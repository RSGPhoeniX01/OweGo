import mongoose from 'mongoose';
import PersonalExpense from '../models/personalExpense.model.js';

// Return time-series chart data aggregated server-side by day or month
export const getChartData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const range = req.query.range || 'month'; // week | month | year | all

    // Compute start date based on the requested range
    let startDate = null;
    let dateFormat = '%Y-%m-%d';
    const map = {};

    if (range === 'week') {
      dateFormat = '%Y-%m-%d';
      startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        const label = d.toISOString().split('T')[0];
        map[label] = { label, spent: 0, lent: 0 };
      }
    } else if (range === 'month') {
      dateFormat = '%Y-%m-%d';
      startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        const label = d.toISOString().split('T')[0];
        map[label] = { label, spent: 0, lent: 0 };
      }
    } else if (range === 'year') {
      dateFormat = '%Y-%m';
      startDate = new Date();
      startDate.setUTCMonth(startDate.getUTCMonth() - 11);
      startDate.setUTCDate(1);
      startDate.setUTCHours(0, 0, 0, 0);
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setUTCMonth(d.getUTCMonth() - i);
        const label = d.toISOString().slice(0, 7);
        map[label] = { label, spent: 0, lent: 0 };
      }
    } else if (range === 'all') {
      dateFormat = '%Y';
      // 'all' leaves startDate null — no date filter applied
    }

    // Cast to ObjectId — aggregation pipelines don't auto-cast strings like find() does
    const matchStage = { user: new mongoose.Types.ObjectId(userId) };
    if (startDate) matchStage.createdAt = { $gte: startDate };

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            label: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.label': 1 } }
    ];

    const raw = await PersonalExpense.aggregate(pipeline);

    if (range === 'all') {
      if (raw.length > 0) {
        const minYear = Math.min(...raw.map(r => parseInt(r._id.label)));
        const maxYear = new Date().getUTCFullYear();
        for (let y = minYear; y <= maxYear; y++) {
          const label = y.toString();
          map[label] = { label, spent: 0, lent: 0 };
        }
      } else {
        const label = new Date().getUTCFullYear().toString();
        map[label] = { label, spent: 0, lent: 0 };
      }
    }

    // Reshape into [{ label, spent, lent }] for recharts
    raw.forEach(({ _id, total }) => {
      if (!map[_id.label]) map[_id.label] = { label: _id.label, spent: 0, lent: 0 };
      map[_id.label][_id.type] += parseFloat((total / 100).toFixed(2));
    });

    const chartData = Object.values(map).sort((a, b) => a.label.localeCompare(b.label));

    // Summary totals for the selected range
    const totalSpent = chartData.reduce((s, d) => s + d.spent, 0);
    const totalLent = chartData.reduce((s, d) => s + d.lent, 0);

    res.status(200).json({ success: true, chartData, totalSpent, totalLent });
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};



// Add a new personal expense
export const addPersonalExpense = async (req, res) => {
  try {
    const { type, amount, category, description, note } = req.body;
    const userId = req.user.userId;

    if (!type || !['spent', 'lent'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing expense type' });
    }

    const expense = new PersonalExpense({
      user: userId,
      type,
      amount,
      category,
      description,
      note
    });

    await expense.save();

    res.status(201).json({ success: true, message: 'Personal expense added', expense });
  } catch (error) {
    console.error('Add personal expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Update a personal expense
export const updatePersonalExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.userId;
    const updateFields = { ...req.body };
    
    // Disallow updating the user or ID
    delete updateFields.user;
    delete updateFields._id;

    const expense = await PersonalExpense.findOneAndUpdate(
      { _id: expenseId, user: userId },
      { $set: updateFields },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Personal expense updated', expense });
  } catch (error) {
    console.error('Update personal expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Delete a personal expense
export const deletePersonalExpense = async (req, res) => {
  try {
    const expenseId = req.params.expenseId;
    const userId = req.user.userId;

    const expense = await PersonalExpense.findOneAndDelete({ _id: expenseId, user: userId });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Personal expense deleted' });
  } catch (error) {
    console.error('Delete personal expense error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all personal expenses for a user
export const getPersonalExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const expenses = await PersonalExpense.find({ user: userId }).sort({ createdAt: -1 });

    let totalSpent = 0;
    let totalLent = 0;

    expenses.forEach(exp => {
      if (exp.type === 'spent') {
        totalSpent += exp.amount;
      } else if (exp.type === 'lent') {
        totalLent += exp.amount;
      }
    });

    res.status(200).json({ 
      success: true, 
      expenses, 
      totalSpent, 
      totalLent 
    });
  } catch (error) {
    console.error('Get personal expenses error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
