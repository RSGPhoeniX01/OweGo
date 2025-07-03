import Group from '../models/group.model.js';

//can add verify group creator here also will do it later

export const verifyGroupMember = async (req, res, next) => {
  try {
    // Try to get groupId from params, body, or query
    const groupId = req.params.groupId || req.body.groupId || req.query.groupId;
    const userId = req.user.userId;

    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.map(id => id.toString()).includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group' });
    }

    // Attach groupId to req for downstream use
    req.groupId = groupId;
    next();
  } catch (error) {
    console.error('Group membership middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
