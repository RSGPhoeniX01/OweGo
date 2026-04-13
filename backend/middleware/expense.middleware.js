import Expense from '../models/expense.model.js';
import SettleUp from '../models/settleup.model.js';

export const verifyExpenseOwner = async (req, res, next) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.userId;

    if (!expenseId) {
      return res.status(400).json({ success: false, message: 'Expense ID is required' });
    }

    const expense = await Expense.findById(expenseId).populate('group');
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Optionally check group membership
    if (expense.group && expense.group.members && !expense.group.members.includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are in a different group' });
    }

    if ((expense.createdBy && expense.createdBy.toString() === userId) || (expense.user && expense.user.toString() === userId)) {
      // Allowed
    } else {
      return res.status(403).json({ success: false, message: 'You are not the creator or owner of this expense' });
    }

    const groupId = expense.group?._id || expense.group;
    const settleDoc = await SettleUp.findOne({ group: groupId }).sort({ createdAt: -1 });
    if (settleDoc && !settleDoc.isSettled) {
      const settledMemberIds = settleDoc.settledBy.map(id => id.toString());
      const involvedMembers = [expense.user.toString()];
      if (expense.createdBy) involvedMembers.push(expense.createdBy.toString());
      if (expense.splits) {
         expense.splits.forEach(s => involvedMembers.push(s.member.toString()));
      }
      
      const hasSettledInvolved = involvedMembers.some(id => settledMemberIds.includes(id));
      if (hasSettledInvolved) {
        return res.status(403).json({ success: false, message: 'Cannot modify this expense because one or more involved members have already settled up.' });
      }
    } else if (settleDoc && settleDoc.isSettled) {
      return res.status(403).json({ success: false, message: 'Cannot modify this expense because the group is fully settled.' });
    }

    req.expense = expense;
    next();
  } catch (error) {
    console.error('Expense owner middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}; 