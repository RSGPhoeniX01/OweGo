import React from 'react';

function ExpenseDetails({ expense, isOpen, onClose }) {
  if (!isOpen || !expense) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Expense Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getCategoryIcon(expense.type)}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{expense.description}</h3>
                <p className="text-sm text-gray-500 capitalize">{expense.type}</p>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-green-600">
              ₹{expense.amount}
            </div>
          </div>

          {/* Paid By */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Paid By</h4>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {expense.user?.username?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-medium">{expense.user?.username || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{expense.user?.email || ''}</p>
              </div>
            </div>
          </div>

          {/* Splits */}
          {expense.splits && expense.splits.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Split Between</h4>
              <div className="space-y-2">
                {expense.splits.map((split, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {split.member?.username?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="font-medium">{split.member?.username || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{split.member?.email || ''}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">₹{split.share}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{formatDate(expense.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated:</span>
              <span>{formatDate(expense.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseDetails; 