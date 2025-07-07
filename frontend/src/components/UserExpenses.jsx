import React, { useState, useEffect } from 'react';
import api from '../api';
import ExpenseDetails from './ExpenseDetails';

function UserExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalToPay, setTotalToPay] = useState(0);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expense/allexpenses');
      const data = res.data;
      
      if (data.success) {
        setExpenses(data.expenses);
        setTotalToPay(data.totalToPay || 0);
        setTotalToReceive(data.totalToReceive || 0);
      } else {
        console.error('Failed to fetch expenses:', data.message);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍕',
      transport: '🚗',
      entertainment: '🎬',
      utilities: '💡',
      shopping: '🛍️',
      health: '🏥',
      education: '📚',
      other: '📋'
    };
    return icons[category] || icons.other;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };
  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl space-y-6">
        <div className="border border-gray-300 rounded-xl p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-red-800 font-semibold mb-2">You Owe</h3>
          <p className="text-2xl font-bold text-red-600">₹{totalToPay.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-green-800 font-semibold mb-2">You're Owed</h3>
          <p className="text-2xl font-bold text-green-600">₹{totalToReceive.toFixed(2)}</p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Expenses</h2>
          <span className="text-sm text-gray-500">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No expenses found.</p>
              <p className="text-gray-400 text-sm mt-2">Start adding expenses to your groups!</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <div 
                key={expense._id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleExpenseClick(expense)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-2xl">{getCategoryIcon(expense.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{expense.description}</h3>
                    <p className="text-sm text-gray-600">
                      {expense.userRole === 'owner' ? 'You paid' : `Paid by ${expense.user?.username || 'Unknown'}`} • {formatDate(expense.updatedAt)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{expense.type} • {expense.group?.name || 'Unknown Group'}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ₹{expense.amount}
                  </div>
                  {expense.userRole === 'owner' ? (
                    <div className="text-sm text-green-600">
                      +₹{expense.userReceives.toFixed(2)}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      -₹{expense.userPays.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ExpenseDetails
        expense={selectedExpense}
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
      />
    </div>
  );
}

export default UserExpenses; 