import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import AddPersonalExpenseModal from './AddPersonalExpenseModal';

const LIST_RANGES = [
  { key: 'week', label: '1 Week' },
  { key: 'month', label: '1 Month' },
  { key: 'year', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

// Filter expenses client-side by the selected time range
function filterByRange(expenses, range) {
  if (range === 'all') return expenses;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === 'week') cutoff.setDate(now.getDate() - 7);
  else if (range === 'month') cutoff.setMonth(now.getMonth() - 1);
  else if (range === 'year') cutoff.setFullYear(now.getFullYear() - 1);
  return expenses.filter(e => new Date(e.createdAt) >= cutoff);
}

function PersonalExpenses({ onExpenseChange }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [listRange, setListRange] = useState('month'); // default to 1 month view

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/personal-expense');
      if (res.data.success) setExpenses(res.data.expenses);
    } catch (error) {
      console.error('Error fetching personal expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await api.delete(`/personal-expense/${expenseId}/delete`);
      if (res.data.success) {
        fetchExpenses();
        if (onExpenseChange) onExpenseChange();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = { food: '🍕', travel: '🚗', entertainment: '🎬', utilities: '💡', shopping: '🛍️', health: '🏥', education: '📚', other: '📋' };
    return icons[category] || icons.other;
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Derive filtered list and summary totals from the selected range — no extra API call
  const filteredExpenses = useMemo(() => filterByRange(expenses, listRange), [expenses, listRange]);

  const totalSpent = useMemo(() => filteredExpenses.filter(e => e.type === 'spent').reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const totalLent = useMemo(() => filteredExpenses.filter(e => e.type === 'lent').reduce((s, e) => s + e.amount, 0), [filteredExpenses]);

  if (loading) {
    return (
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-200 rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm bg-white">
      {/* Header row with title, time filters, and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Personal Expenses</h2>
          <span className="text-sm text-gray-500">{filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range filter buttons */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {LIST_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setListRange(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${listRange === key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setSelectedExpense(null); setIsModalOpen(true); }}
            className="bg-green-600 cursor-pointer text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* Summary totals for selected range */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-gray-100">
        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Total Spent</p>
          <p className="text-xl font-bold text-red-700">₹{totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Total Lent</p>
          <p className="text-xl font-bold text-blue-700">₹{totalLent.toFixed(2)}</p>
        </div>
      </div>

      {/* Expenses list filtered by selected range */}
      <div className="divide-y divide-gray-50">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 font-medium">No expenses in this period.</p>
            <p className="text-gray-400 text-sm mt-1">Try switching to a wider time range or add a new expense.</p>
          </div>
        ) : (
          filteredExpenses.map((expense) => {
            // Group-derived entries are read-only — managed via the group expense flow
            const isGroupDerived = expense.source === 'group';
            return (
              <div key={expense._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">{getCategoryIcon(expense.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-gray-800 truncate">
                        {expense.type === 'lent' ? 'Lent to: ' : ''}{expense.description}
                      </h3>
                      {/* Purple badge for entries auto-tracked from a group expense */}
                      {isGroupDerived && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium flex-shrink-0" title="Auto-tracked from a group expense">
                          Group
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(expense.createdAt)} • <span className="capitalize">{expense.category}</span>
                    </p>
                    {expense.note && <p className="text-xs text-gray-400 mt-0.5 italic">{expense.note}</p>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <div className={`text-base font-semibold ${expense.type === 'spent' ? 'text-red-600' : 'text-blue-600'}`}>
                    {expense.type === 'spent' ? '-' : '+'}₹{expense.amount}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{expense.type}</div>
                  {/* Only manual entries can be edited or deleted */}
                  {!isGroupDerived ? (
                    <div className="flex gap-2 mt-1 justify-end">
                      <button onClick={() => { setSelectedExpense(expense); setIsModalOpen(true); }} className="text-blue-500 text-xs hover:underline cursor-pointer">Edit</button>
                      <button onClick={() => handleDelete(expense._id)} className="text-red-500 text-xs hover:underline cursor-pointer">Delete</button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 mt-1">auto-tracked</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddPersonalExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchExpenses();
          if (onExpenseChange) onExpenseChange();
        }}
        expense={selectedExpense}
      />
    </div>
  );
}

export default PersonalExpenses;
