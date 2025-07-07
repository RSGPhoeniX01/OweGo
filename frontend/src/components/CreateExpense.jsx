import React, { useState, useEffect } from 'react';
import api from '../api';

function CreateExpense({ groupId, isOpen, onClose, onExpenseCreated }) {
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    type: 'other'
  });
  const [loading, setLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [splitType, setSplitType] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState({});

  // Fetch group members when component opens
  useEffect(() => {
    if (isOpen && groupId) {
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
        }));
        setGroupMembers(members);
        
        // Initialize custom splits with equal amounts
        const equalAmount = parseFloat(newExpense.amount || 0) / members.length;
        const initialSplits = {};
        members.forEach(member => {
          initialSplits[member._id] = equalAmount.toFixed(2);
        });
        setCustomSplits(initialSplits);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  // Update custom splits when amount changes
  useEffect(() => {
    if (splitType === 'equal' && groupMembers.length > 0 && newExpense.amount) {
      const equalAmount = parseFloat(newExpense.amount) / groupMembers.length;
      const updatedSplits = {};
      groupMembers.forEach(member => {
        updatedSplits[member._id] = equalAmount.toFixed(2);
      });
      setCustomSplits(updatedSplits);
    }
  }, [newExpense.amount, splitType, groupMembers]);

  if (!isOpen) return null;

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare splits data - backend expects 'member' and 'share' fields
      const splits = splitType === 'equal' 
        ? groupMembers.map(member => ({
            member: member._id,
            share: parseFloat((parseFloat(newExpense.amount) / groupMembers.length).toFixed(2))
          }))
        : Object.entries(customSplits).map(([userId, amount]) => ({
            member: userId,
            share: parseFloat(parseFloat(amount).toFixed(2))
          }));

      const res = await api.post(`/expense/${groupId}/addexpense`, {
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        type: newExpense.type,
        splits: splits
      });

      if (res.data.success) {
        alert('Expense added successfully');
        onExpenseCreated();
        handleClose();
      } else {
        alert(res.data.message || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('An error occurred. Please try again.');
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
    setSplitType('equal');
    setCustomSplits({});
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
              <option value="transport">Transport</option>
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
              <p className="text-sm text-gray-600">
                Each member will pay ₹{(parseFloat(newExpense.amount || 0) / groupMembers.length).toFixed(2)}
              </p>
              <div className="mt-2 space-y-1">
                {groupMembers.map(member => (
                  <div key={member._id} className="flex justify-between text-sm">
                    <span>{member.username}</span>
                    <span className="font-medium">₹{(parseFloat(newExpense.amount || 0) / groupMembers.length).toFixed(2)}</span>
                  </div>
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
                    <span className="text-sm font-medium">{member.username}</span>
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