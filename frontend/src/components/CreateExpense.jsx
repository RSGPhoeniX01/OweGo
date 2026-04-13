import React, { useState, useEffect } from 'react';
import api from '../api';
import { showNotification } from '../notifications';

function CreateExpense({ groupId, isOpen, onClose, onExpenseCreated, currentUserId, settledMembers = [] }) {
  const [selectedPayer, setSelectedPayer] = useState(currentUserId || '');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    type: 'other'
  });
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState({});
  const [selectedForSplit, setSelectedForSplit] = useState([]);

  // Fetch group members when component opens
  useEffect(() => {
    if (isOpen && groupId) {
      if (currentUserId && !selectedPayer) {
        setSelectedPayer(currentUserId);
      }
      fetchGroupMembers();
    }
  }, [isOpen, groupId]);

  const fetchGroupMembers = async () => {
    try {
      const res = await api.get(`/group/${groupId}`);
      if (res.data.success) {
        const members = res.data.group.members.map(member => ({
          _id: member._id,
          username: member.username
        })).filter(member => !settledMembers.includes(member._id));
        setGroupMembers(members);
        const memberIds = members.map(m => m._id);
        setSelectedForSplit(memberIds);
        
        // Initialize custom splits with equal amounts
        const equalAmount = parseFloat(newExpense.amount || 0) / memberIds.length;
        const initialSplits = {};
        members.forEach(member => {
          initialSplits[member._id] = memberIds.includes(member._id) ? equalAmount.toFixed(2) : "0.00";
        });
        setCustomSplits(initialSplits);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  // Update custom splits when amount changes
  useEffect(() => {
    if (splitType === 'equal' && selectedForSplit.length > 0 && newExpense.amount) {
      const equalAmount = parseFloat(newExpense.amount) / selectedForSplit.length;
      const updatedSplits = {};
      groupMembers.forEach(member => {
        updatedSplits[member._id] = selectedForSplit.includes(member._id) ? equalAmount.toFixed(2) : "0.00";
      });
      setCustomSplits(updatedSplits);
    } else if (splitType === 'equal') {
      const updatedSplits = {};
      groupMembers.forEach(member => {
        updatedSplits[member._id] = "0.00";
      });
      setCustomSplits(updatedSplits);
    }
  }, [newExpense.amount, splitType, groupMembers, selectedForSplit]);

  if (!isOpen) return null;

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare splits data - backend expects 'member' and 'share' fields
      const splits = splitType === 'equal' 
        ? selectedForSplit.map(memberId => ({
            member: memberId,
            share: parseFloat((parseFloat(newExpense.amount) / selectedForSplit.length).toFixed(2))
          }))
        : Object.entries(customSplits)
            .filter(([_, amount]) => parseFloat(amount) > 0)
            .map(([userId, amount]) => ({
              member: userId,
              share: parseFloat(parseFloat(amount).toFixed(2))
            }));

      const res = await api.post(`/expense/${groupId}/addexpense`, {
        user: selectedPayer || currentUserId,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        type: newExpense.type,
        splits: splits
      });

      if (res.data.success) {
        showNotification('Expense added successfully', 'success');
        onExpenseCreated();
        handleClose();
      } else {
        showNotification(res.data.message || 'Failed to add expense', 'error');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewExpense({
      description: '',
      amount: '',
      type: 'other'
    });
    setSelectedPayer(currentUserId || '');
    setSplitType('equal');
    setCustomSplits({});
    setSelectedForSplit(groupMembers.map(m => m._id));
    onClose();
  };

  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const getTotalCustomSplit = () => {
    return Object.values(customSplits).reduce((sum, amount) => sum + parseFloat(amount || 0), 0);
  };

  const getSplitDifference = () => {
    const total = parseFloat(newExpense.amount || 0);
    const customTotal = getTotalCustomSplit();
    return (total - customTotal).toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Add New Expense</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Paid By</label>
            <select
              className="w-full border rounded p-2 bg-gray-50"
              value={selectedPayer}
              onChange={(e) => setSelectedPayer(e.target.value)}
              required
            >
              <option value="" disabled>Select User</option>
              {groupMembers.map(member => (
                <option key={member._id} value={member._id}>
                  {member.username} {member._id === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Description</label>
            <input
              type="text"
              required
              className="w-full border rounded p-2"
              placeholder="Enter expense description"
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Amount (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              className="w-full border rounded p-2"
              placeholder="0.00"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select
              className="w-full border rounded p-2"
              value={newExpense.type}
              onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="food">Food</option>
              <option value="travel">Travel</option>
              <option value="entertainment">Entertainment</option>
              <option value="utilities">Utilities</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Split Options */}
          <div>
            <label className="block mb-1 font-medium">Split Type</label>
            <select
              className="w-full border rounded p-2"
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
            >
              <option value="equal">Split Equally</option>
              <option value="custom">Custom Split</option>
            </select>
          </div>

          {/* Split Details */}
          {splitType === 'equal' && groupMembers.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Equal Split</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select who is involved in this expense. Each member will pay ₹{
                  selectedForSplit.length > 0 
                  ? (parseFloat(newExpense.amount || 0) / selectedForSplit.length).toFixed(2) 
                  : "0.00"
                }
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {groupMembers.map(member => (
                  <label key={member._id} className="flex items-center space-x-3 text-sm cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedForSplit.includes(member._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedForSplit([...selectedForSplit, member._id]);
                        } else {
                          setSelectedForSplit(selectedForSplit.filter(id => id !== member._id));
                        }
                      }}
                      className="rounded text-blue-600 w-4 h-4 focus:ring-blue-500"
                    />
                    <span className="flex-1 font-medium">
                      {member.username} {localStorage.getItem('username') === member.username && "(You)"}
                    </span>
                    {selectedForSplit.includes(member._id) && (
                      <span className="font-semibold text-gray-700">
                        ₹{(parseFloat(newExpense.amount || 0) / selectedForSplit.length).toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {splitType === 'custom' && groupMembers.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Custom Split</h3>
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member._id} className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {member.username} {localStorage.getItem('username') === member.username && "(You)"}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 border rounded p-1 text-sm"
                      placeholder="0.00"
                      value={customSplits[member._id] || ''}
                      onChange={(e) => handleCustomSplitChange(member._id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              {/* Split Summary */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span>Total Split Amount:</span>
                  <span className="font-medium">₹{getTotalCustomSplit().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Expense Amount:</span>
                  <span className="font-medium">₹{parseFloat(newExpense.amount || 0).toFixed(2)}</span>
                </div>
                <div className={`flex justify-between text-sm font-medium ${
                  Math.abs(getSplitDifference()) > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <span>Difference:</span>
                  <span>₹{getSplitDifference()}</span>
                </div>
                {Math.abs(getSplitDifference()) > 0.01 && (
                  <p className="text-xs text-red-600 mt-1">
                    Split amounts don't match the total expense amount
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (splitType === 'custom' && Math.abs(getSplitDifference()) > 0.01)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateExpense; 