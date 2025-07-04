import Expense from '../models/expense.model.js';

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

    if (expense.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You are not the owner of this expense' });
    }

    req.expense = expense;
    next();
  } catch (error) {
    console.error('Expense owner middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}; 