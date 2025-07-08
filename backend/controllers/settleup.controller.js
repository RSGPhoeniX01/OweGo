import SettleUp from '../models/settleup.model.js';
import Group from '../models/group.model.js';
import Expense from '../models/expense.model.js';

export const settleGroup = async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.userId;
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }
      let settleDoc = await SettleUp.findOne({ group: groupId, isSettled: false });
      if (!settleDoc) {
        settleDoc = new SettleUp({ group: groupId, settledBy: [], isSettled: false });
      }
      if (!settleDoc.settledBy.map(id => id.toString()).includes(userId)) {
        settleDoc.settledBy.push(userId);
      }
      // If all group members have settled
      const allSettled = group.members.every(m => settleDoc.settledBy.map(id => id.toString()).includes(m.toString()));
      if (allSettled) {
        settleDoc.isSettled = true;
      }
      await settleDoc.save();
      res.status(200).json({ success: true, settleUp: settleDoc, allSettled });
    } catch (error) {
      console.error('Settle group error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  };
  
  export const getSettleStatus = async (req, res) => {
    try {
      const groupId = req.params.groupId;
      const userId = req.user.userId;
      const settleDoc = await SettleUp.findOne({ group: groupId, isSettled: false });
      let userSettled = false;
      let allSettled = false;
      if (settleDoc) {
        userSettled = settleDoc.settledBy.map(id => id.toString()).includes(userId);
        // Check if all group members have settled
        const group = await Group.findById(groupId);
        if (group) {
          allSettled = group.members.every(m => settleDoc.settledBy.map(id => id.toString()).includes(m.toString()));
        }
      }
      // If no settleDoc, check if group is already fully settled
      if (!settleDoc) {
        const lastSettle = await SettleUp.findOne({ group: groupId, isSettled: true }).sort({ updatedAt: -1 });
        if (lastSettle) {
          userSettled = lastSettle.settledBy.map(id => id.toString()).includes(userId);
          allSettled = true;
        }
      }
      res.status(200).json({ success: true, userSettled, allSettled });
    } catch (error) {
      console.error('Get settle status error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  };
  
  // Get settle status for multiple groups
  export const getMultipleSettleStatus = async (req, res) => {
    try {
      const { groupIds } = req.body; // expects array of group IDs
      if (!Array.isArray(groupIds)) {
        return res.status(400).json({ success: false, message: 'groupIds must be an array' });
      }
      // Find all settled SettleUp docs for these groups
      const settledDocs = await SettleUp.find({ group: { $in: groupIds }, isSettled: true }).select('group');
      const settledGroupIds = new Set(settledDocs.map(doc => doc.group.toString()));
      // Return a map of groupId => isSettled
      const statusMap = {};
      groupIds.forEach(id => {
        statusMap[id] = settledGroupIds.has(id.toString());
      });
      res.status(200).json({ success: true, status: statusMap });
    } catch (error) {
      console.error('Get multiple settle status error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  };
  
  // Get all settled groups with details for tracking
  export const getSettledGroups = async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Find all groups where the user is a member
      const userGroups = await Group.find({ members: userId });
      const groupIds = userGroups.map(group => group._id);
  
      // Find all settled groups
      const settledGroups = await SettleUp.find({ 
        group: { $in: groupIds }, 
        isSettled: true 
      }).populate('group');
  
      // Get detailed information for each settled group
      const settledGroupsDetails = await Promise.all(
        settledGroups.map(async (settleDoc) => {
          const group = settleDoc.group;
          
          // Get all expenses for this group
          const expenses = await Expense.find({ group: group._id })
            .populate('user', 'username email')
            .populate('splits.member', 'username email')
            .sort({ createdAt: -1 });
  
          // Calculate total amount and other stats
          const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const expenseCount = expenses.length;
  
          return {
            groupId: group._id,
            groupName: group.name,
            groupDescription: group.description,
            members: group.members,
            settledAt: settleDoc.updatedAt,
            settledBy: settleDoc.settledBy,
            totalAmount,
            expenseCount,
            expenses: expenses.map(exp => ({
              _id: exp._id,
              description: exp.description,
              amount: exp.amount,
              type: exp.type,
              user: exp.user,
              splits: exp.splits,
              createdAt: exp.createdAt,
              updatedAt: exp.updatedAt
            }))
          };
        })
      );
  
      res.status(200).json({
        success: true,
        settledGroups: settledGroupsDetails
      });
    } catch (error) {
      console.error('Get settled groups error:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  };  