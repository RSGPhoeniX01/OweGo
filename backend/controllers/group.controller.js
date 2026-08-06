import Group from '../models/group.model.js';
import User from '../models/user.model.js';
import { getIO } from '../socket.js';

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'Group name and members are required' });
    }

    // Convert usernames to user IDs
    const users = await User.find({ username: { $in: members } }, '_id username');
    if (users.length !== members.length) {
      return res.status(400).json({
        success: false,
        message: 'Some usernames were not found in the system'
      });
    }

    const memberIds = users.map(user => user._id);

    const newGroup = new Group({
      name,
      description,
      members: memberIds,
      creator: req.user.userId, //  add creator here
    });

    await newGroup.save();

    try {
      const io = getIO();
      // Notify all members that a new group they belong to has been created
      memberIds.forEach(id => io.to(`user_${id}`).emit('group_updated'));
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    res.status(201).json({ success: true, message: 'Group created', group: newGroup });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};


// Add members to a group (only creator can add)
export const addMembers = async (req, res) => {
  try {
    const groupId = req.groupId;
    const { members } = req.body;

    // Validate all member IDs
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ success: false, message: 'Some members do not exist' });
    }

    const group = await Group.findById(groupId);
    const currentMemberIds = group.members.map(id => id.toString());
    const alreadyAdded = members.filter(id => currentMemberIds.includes(id));
    if (alreadyAdded.length > 0) {
      return res.status(400).json({ success: false, message: `User(s) already added: ${alreadyAdded.join(', ')}` });
    }

    // Add new members
    group.members = Array.from(new Set([...currentMemberIds, ...members]));
    await group.save();

    try {
      const io = getIO();
      // Broadcast group updates to the group room and all individual members' rooms
      io.to(`group_${groupId}`).emit('group_updated');
      group.members.forEach(id => io.to(`user_${id}`).emit('group_updated'));
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    res.status(200).json({ success: true, message: 'Members added', group });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get group details
export const groupDetails = async (req, res) => {
  try {
    const groupId = req.groupId;
    const group = await Group.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email');
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error('Group details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const groupId = req.groupId;
    const group = await Group.findById(groupId);
    const memberIds = group.members.map(id => id.toString());
    await group.deleteOne();

    try {
      const io = getIO();
      // Inform all current members that the group was deleted to remove it from their UI
      io.to(`group_${groupId}`).emit('group_updated');
      memberIds.forEach(id => io.to(`user_${id}`).emit('group_updated'));
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const editGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { name, description } = req.body;
    const group = await Group.findById(groupId);
    if (name) group.name = name;
    if (description) group.description = description;
    await group.save();

    try {
      const io = getIO();
      // Trigger a group update event so clients re-fetch the edited group name/description
      io.to(`group_${groupId}`).emit('group_updated');
      group.members.forEach(id => io.to(`user_${id}`).emit('group_updated'));
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    res.status(200).json({ success: true, message: 'Group updated successfully', group });
  } catch (error) {
    console.error('Edit group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const removeMembers = async (req, res) => {
  try {
    const groupId = req.groupId;
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'members array is required' });
    }
    const group = await Group.findById(groupId);
    // Prevent removing the creator
    if (members.includes(group.creator.toString())) {
      return res.status(400).json({ success: false, message: 'Cannot remove the group creator/admin' });
    }
    const membersToRemove = members.filter(id => id !== group.creator.toString());
    // Check if all members exist in the group
    const allMembersExist = membersToRemove.every(id => 
      group.members.some(memberId => memberId.toString() === id)
    );
    if (!allMembersExist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Members do not exist in the group'
      });
    }
    // Remove members
    group.members = group.members.filter(
      memberId => !membersToRemove.includes(memberId.toString())
    );
    await group.save();

    try {
      const io = getIO();
      // Update remaining members and also notify the removed members so they lose access
      io.to(`group_${groupId}`).emit('group_updated');
      group.members.forEach(id => io.to(`user_${id}`).emit('group_updated'));
      membersToRemove.forEach(id => io.to(`user_${id}`).emit('group_updated'));
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Members removed', 
      group,
      removedMembers: membersToRemove
    });
  } catch (error) {
    console.error('Remove members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all groups where the user is a member
export const allGroups = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groups = await Group.find({ members: userId })
      .populate('creator', 'username email')
      .populate('members', 'username email');
    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error('All groups fetch error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};