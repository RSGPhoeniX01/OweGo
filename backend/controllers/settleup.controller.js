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
      const settledBySet = new Set(settleDoc.settledBy.map(id => id.toString()));
      // If all group members have settled
      const allSettled = group.members.every(m => settledBySet.has(m.toString()));
      if (allSettled) {
        settleDoc.isSettled = true;
      }
      await settleDoc.save();
      res.status(200).json({
        success: true,
        settleUp: settleDoc,
        allSettled,
        settledCount: allSettled ? group.members.length : settledBySet.size,
        totalMembers: group.members.length,
      });
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
      let settledCount = 0;
      let totalMembers = 0;
      if (settleDoc) {
        const settledBySet = new Set(settleDoc.settledBy.map(id => id.toString()));
        userSettled = settledBySet.has(userId);
        // Check if all group members have settled
        const group = await Group.findById(groupId);
        if (group) {
          totalMembers = group.members.length;
          allSettled = group.members.every(m => settledBySet.has(m.toString()));
          settledCount = allSettled ? totalMembers : Math.min(settledBySet.size, totalMembers);
        }
      }
      // If no settleDoc, check if group is already fully settled
      if (!settleDoc) {
        const group = await Group.findById(groupId).select('members');
        if (group) {
          totalMembers = group.members.length;
        }
        const lastSettle = await SettleUp.findOne({ group: groupId, isSettled: true }).sort({ updatedAt: -1 });
        if (lastSettle) {
          userSettled = lastSettle.settledBy.map(id => id.toString()).includes(userId);
          allSettled = true;
          settledCount = totalMembers;
        }
      }
      res.status(200).json({ success: true, userSettled, allSettled, settledCount, totalMembers });
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
      const userId = req.user.userId;
      const groups = await Group.find({ _id: { $in: groupIds } }).select('_id members');
      const latestSettleDocs = await SettleUp.find({ group: { $in: groupIds } })
        .sort({ updatedAt: -1 })
        .select('group settledBy isSettled updatedAt');

      const latestByGroup = {};
      latestSettleDocs.forEach((doc) => {
        const key = doc.group.toString();
        if (!latestByGroup[key]) {
          latestByGroup[key] = doc;
        }
      });

      const statusMap = {};
      const progressMap = {};
      const userSettledMap = {};
      const settledMembersMap = {};

      groups.forEach((group) => {
        const key = group._id.toString();
        const settleDoc = latestByGroup[key];
        const totalMembers = group.members.length;
        const settledBySet = new Set((settleDoc?.settledBy || []).map((id) => id.toString()));
        const allSettled = Boolean(settleDoc?.isSettled) || group.members.every((memberId) => settledBySet.has(memberId.toString()));
        const settledCount = allSettled ? totalMembers : Math.min(settledBySet.size, totalMembers);

        statusMap[key] = allSettled;
        progressMap[key] = {
          settledCount,
          totalMembers,
          allSettled,
        };
        userSettledMap[key] = settledBySet.has(userId) || allSettled;
        settledMembersMap[key] = allSettled ? group.members.map(id => id.toString()) : Array.from(settledBySet);
      });

      groupIds.forEach((id) => {
        const key = id.toString();
        if (statusMap[key] === undefined) {
          statusMap[key] = false;
        }
        if (!progressMap[key]) {
          progressMap[key] = {
            settledCount: 0,
            totalMembers: 0,
            allSettled: false,
          };
        }
        if (userSettledMap[key] === undefined) {
          userSettledMap[key] = false;
        }
        if (settledMembersMap[key] === undefined) {
          settledMembersMap[key] = [];
        }
      });

      res.status(200).json({
        success: true,
        status: statusMap,
        progress: progressMap,
        userSettled: userSettledMap,
        settledMembers: settledMembersMap,
      });
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