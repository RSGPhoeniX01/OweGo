import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function GroupDetails() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('Group 1');
  const [groups, setGroups] = useState(['Group 1', 'Group 2', 'Group 3']);
  const [members, setMembers] = useState(['John', 'Alice', 'Bob', 'Sarah']);
  const [expenses, setExpenses] = useState([
    { id: 1, description: 'Dinner', amount: 120, paidBy: 'John', date: '2024-01-15' },
    { id: 2, description: 'Movie tickets', amount: 80, paidBy: 'Alice', date: '2024-01-14' },
    { id: 3, description: 'Gas', amount: 45, paidBy: 'Bob', date: '2024-01-13' }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to access group details.');
      navigate('/login');
      return;
    }

    // Verify token
    api.get('/user/profile')
      .catch(() => {
        localStorage.removeItem('token');
        alert('Session expired. Please log in again.');
        navigate('/login');
      });
  }, [navigate]);

  const handleGroupSelect = (groupName) => {
    setSelectedGroup(groupName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Left Pane - Groups */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4 border-b">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Groups
            </button>
          </div>
          
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Your Groups</h2>
            <div className="space-y-2">
              {groups.map((group, index) => (
                <button
                  key={index}
                  onClick={() => handleGroupSelect(group)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedGroup === group 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane - Group Details */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Group Header */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">{selectedGroup}</h1>
              <div className="space-x-3">
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Add Expense
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Member
                </button>
              </div>
            </div>

            {/* Members Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Members</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.charAt(0)}
                    </div>
                    <span className="font-medium">{member}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-gray-600">
                        Paid by {expense.paidBy} • {expense.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-green-600">
                        ₹{expense.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupDetails;
