import Group from '../models/group.model.js';
import User from '../models/user.model.js';

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, members = [] } = req.body;
    const creator = req.user.userId;

    // Ensure creator is in members
    if (!members.includes(creator)) members.push(creator);

    // Validate all member IDs
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ success: false, message: 'Some members do not exist' });
    }

    const group = new Group({ name, description, creator, members });
    await group.save();
    res.status(201).json({ success: true, message: 'Group created', group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Add members to a group (only creator can add)
export const addMembers = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { members } = req.body;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // Only creator can add members
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the group creator can add members' });
    }

    // Validate all member IDs
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ success: false, message: 'Some members do not exist' });
    }

    // Add new members (avoid duplicates)
    group.members = Array.from(new Set([...group.members.map(id => id.toString()), ...members]));
    await group.save();
    res.status(200).json({ success: true, message: 'Members added', group });
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get group details
export const groupDetails = async (req, res) => {
  try {
    const {groupId}  = req.params;
    const group = await Group.findById(groupId)
      .populate('creator', 'username email')
      .populate('members', 'username email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    res.status(200).json({ success: true, group });
  } catch (error) {
    console.error('Group details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only creator can delete
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete the group' });
    }

    await group.deleteOne();
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
    const userId = req.user.userId;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only creator can edit
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the group creator can edit the group' });
    }

    if (name) group.name = name;
    if (description) group.description = description;

    await group.save();
    res.status(200).json({ success: true, message: 'Group updated successfully', group });
  } catch (error) {
    console.error('Edit group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const removeMembers = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { members } = req.body;
    const userId = req.user.userId;

    if (!groupId || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ success: false, message: 'groupId and members array are required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Only creator can remove members
    if (group.creator.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only the group creator can remove members' });
    }

    // Prevent removing the creator
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