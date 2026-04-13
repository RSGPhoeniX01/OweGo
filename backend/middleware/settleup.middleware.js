import SettleUp from '../models/settleup.model.js';

export const checkUserNotSettled = async (req, res, next) => {
  try {
    let groupId = req.groupId || req.params.groupId || (req.expense && req.expense.group) || req.body.groupId;
    const userId = req.user.userId;

    if (!groupId) {
      return res.status(400).json({ success: false, message: 'Group ID is required for settlement check' });
    }

    const settleDoc = await SettleUp.findOne({ group: groupId }).sort({ createdAt: -1 });
    
    if (settleDoc) {
      const hasSettled = settleDoc.settledBy.map(id => id.toString()).includes(userId);
      if (hasSettled || settleDoc.isSettled) {
        return res.status(403).json({ success: false, message: 'Action not allowed: You have already settled up for this group' });
      }
    }

    next();
  } catch (error) {
    console.error('Check user not settled middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
