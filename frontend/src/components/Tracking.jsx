import React, { useState, useEffect } from 'react';
import api from '../api';

function Tracking({ preloaded }) {
  const [settledGroups, setSettledGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  useEffect(() => {
  if (preloaded) {
    setSettledGroups(preloaded || []);
    setLoading(false);
  } else {
    fetchSettledGroups();
  }
}, [preloaded]);


  const fetchSettledGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settleup/settled-groups');
      if (res.data.success) {
        setSettledGroups(res.data.settledGroups);
      }
    } catch (error) {
      console.error('Error fetching settled groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleCloseGroupModal = () => {
    setIsGroupModalOpen(false);
    setSelectedGroup(null);
  };

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
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Settled Groups</h2>
          <span className="text-sm text-gray-500">
            {settledGroups.length} settled group{settledGroups.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-3">
          {settledGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No settled groups found.</p>
              <p className="text-gray-400 text-sm mt-2">Groups will appear here once they are settled.</p>
            </div>
          ) : (
            settledGroups.map((group) => (
              <div 
                key={group.groupId} 
                className="border border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-green-50"
                onClick={() => handleGroupClick(group)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{group.groupName}</h3>
                    <p className="text-sm text-gray-600">{group.groupDescription || 'No description'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">₹{group.totalAmount}</div>
                    <div className="text-sm text-gray-500">{group.expenseCount} expense{group.expenseCount !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Settled: {formatDate(group.settledAt)}</span>
                  <span className="text-green-600 font-medium">Click to view details →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Group Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">{selectedGroup.groupName}</h2>
              <button
                onClick={handleCloseGroupModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Group Info */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Group Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <div className="text-xl font-bold text-green-600">₹{selectedGroup.totalAmount}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Expenses:</span>
                    <div className="text-xl font-bold text-gray-800">{selectedGroup.expenseCount}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Members:</span>
                    <div className="text-lg font-medium text-gray-800">{selectedGroup.members?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Settled On:</span>
                    <div className="text-lg font-medium text-gray-800">{formatDate(selectedGroup.settledAt)}</div>
                  </div>
                </div>
              </div>

              {/* Expenses List */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">All Expenses</h3>
                <div className="space-y-3">
                  {selectedGroup.expenses.map((expense) => (
                    <div key={expense._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(expense.type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-800">{expense.description}</h4>
                            <p className="text-sm text-gray-500 capitalize">{expense.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">₹{expense.amount}</div>
                          <div className="text-xs text-gray-500">{formatDate(expense.createdAt)}</div>
                        </div>
                      </div>
                      
                      {/* Splits */}
                      {expense.splits && expense.splits.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Split Between:</h5>
                          <div className="space-y-1">
                            {expense.splits.map((split, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{split.member?.username || 'Unknown'}</span>
                                <span className="font-medium text-green-600">₹{split.share}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseGroupModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tracking; 