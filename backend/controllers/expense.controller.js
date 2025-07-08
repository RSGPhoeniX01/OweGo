import Expense from '../models/expense.model.js';
import Group from '../models/group.model.js';
import SettleUp from '../models/settleup.model.js';

// Add a new expense
export const addExpense = async (req, res) => {
  try {
    const { amount, type, description, splits } = req.body;
    const user = req.user.userId;
    const group = req.params.groupId;

    // Check if all users in splits exist in the group
    if (splits && group) {
      const groupDoc = await Group.findById(group);
      if (!groupDoc) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
      const groupMemberIds = groupDoc.members.map(id => id.toString());
      for (const split of splits) {
        if (!groupMemberIds.includes(split.member)) {
          return res.status(400).json({ success: false, message: `User ${split.member} does not exist in the group` });
        }
      }
    }

    const expense = new Expense({
      user,
      group,
      amount,
      type,
      description,
      splits
    });

    await expense.save();
    res.status(201).json({ success: true, message: 'Expense added', expense });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update an expense
export const updateExpense = async (req, res) => {
  try {
    // Expense is already verified and attached to req by middleware
    const expense = req.expense;
    const updateFields = { ...req.body };
    delete updateFields.expenseId; // Don't allow changing the ID

    // Check if all users in splits exist in the group
    if (updateFields.splits && expense.group) {
      const group = await Group.findById(expense.group);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
      const groupMemberIds = group.members.map(id => id.toString());
      for (const split of updateFields.splits) {
        if (!groupMemberIds.includes(split.member)) {
          return res.status(400).json({ success: false, message: `User ${split.member} does not exist in the group` });
        }
      }
    }

    Object.assign(expense, updateFields);
    await expense.save();
    res.status(200).json({ success: true, message: 'Expense updated', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Delete an expense
export const deleteExpense = async (req, res) => {
  try {
    // Expense is already verified and attached to req by middleware
    const expense = req.expense;
    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all expenses for a group
export const getExpense = async (req, res) => {
  try {
    // Use groupId from params
    const groupId = req.params.groupId;
    const expenses = await Expense.find({ group: groupId })
      .populate('user', 'username email')
      .populate('splits.member', 'username email')
      .sort({ updatedAt: -1 }); // Use updatedAt instead of date
    // Remove group info from each expense
    const expensesWithoutGroup = expenses.map(exp => {
      const { group, ...rest } = exp.toObject();
      return rest;
    });
    if (expensesWithoutGroup.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({ success: true, expenses: expensesWithoutGroup });
  } catch (error) {
    console.error('Get group expenses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all expenses for the logged-in user (from all groups where the user is a member)
export const getAllExpense = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all groups where the user is a member
    const userGroups = await Group.find({ members: userId });
    const groupIds = userGroups.map(group => group._id);

    // Find all groups that are fully settled
    const settledGroups = await SettleUp.find({ group: { $in: groupIds }, isSettled: true }).select('group');
    const settledGroupIds = new Set(settledGroups.map(doc => doc.group.toString()));

    // Only include expenses from groups that are NOT settled
    const activeGroupIds = groupIds.filter(id => !settledGroupIds.has(id.toString()));

    // Find all expenses from those active groups
    const expenses = await Expense.find({ group: { $in: activeGroupIds } })
      .populate('user', 'username email')
      .populate('group', 'name')
      .populate('splits.member', 'username email')
      .sort({ createdAt: -1 });

    let totalToPay = 0;
    let totalToReceive = 0;
    const expenseDetails = expenses.map(exp => {
      const isOwner = exp.user._id.toString() === userId;
      let userPays = 0;
      let userReceives = 0;

      if (isOwner) {
        // Others owe this user
        userReceives = exp.splits
          .filter(s => s.member._id.toString() !== userId)
          .reduce((sum, s) => sum + s.share, 0);
        totalToReceive += userReceives;
      } else {
        // This user owes someone else
        const split = exp.splits.find(s => s.member._id.toString() === userId);
        if (split) {
          userPays = split.share;
          totalToPay += userPays;
        }
      }

      return {
        ...exp.toObject(),
        userRole: isOwner ? 'owner' : 'member',
        userPays,
        userReceives
      };
    });

    res.status(200).json({
      success: true,
      totalToPay,
      totalToReceive,
      expenses: expenseDetails
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all expenses for the logged-in user in a specific group (for settle up)
export const userExpense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.groupId;

    // Find all expenses in this group where the user is involved (either as owner or in splits)
    const expenses = await Expense.find({
      group: groupId,
      $or: [
        { user: userId },
        { 'splits.member': userId }
      ]
    })
      .populate('user', 'username email')
      .populate('splits.member', 'username email')
      .sort({ createdAt: -1 });

    let totalToPay = 0;
    let totalToReceive = 0;
    const expenseDetails = expenses.map(exp => {
      const isOwner = exp.user._id.toString() === userId;
      let userPays = 0;
      let userReceives = 0;

      if (isOwner) {
        // Others owe this user
        userReceives = exp.splits
          .filter(s => s.member._id.toString() !== userId)
          .reduce((sum, s) => sum + s.share, 0);
        totalToReceive += userReceives;
      } else {
        // This user owes someone else
        const split = exp.splits.find(s => s.member._id.toString() === userId);
        if (split) {
          userPays = split.share;
          totalToPay += userPays;
        }
      }

      return {
        ...exp.toObject(),
        userRole: isOwner ? 'owner' : 'member',
        userPays,
        userReceives
      };
    });

    res.status(200).json({
      success: true,
      totalToPay,
      totalToReceive,
      expenses: expenseDetails
    });
  } catch (error) {
    console.error('Get user expenses in group error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};