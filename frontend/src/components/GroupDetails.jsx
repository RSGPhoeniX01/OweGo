import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ExpenseDetails from './ExpenseDetails';

function GroupDetails() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Please log in to access group details.');
      navigate('/login');
      return;
    }

    api.get('/user/profile').catch(() => {
      localStorage.removeItem('token');
      alert('Session expired. Please log in again.');
      navigate('/login');
    });

    api.get('/group/allgroups')
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message || 'Failed to fetch groups');

        const fetchedGroups = data.groups.map(group => ({
          id: group._id,
          name: group.name,
          members: group.members.map(m => m.username),
        }));
        setGroups(fetchedGroups);

        if (data.groups.length > 0) {
          setSelectedGroup(data.groups[0].name);
          setMembers(data.groups[0].members.map(m => m.username));
          fetchExpenses(data.groups[0]._id);
        }
      })
      .catch((err) => {
        console.error('Error fetching groups:', err);
        alert('Could not load groups. Please try again later.');
      });
  }, [navigate]);

  const fetchExpenses = (groupId) => {
    api.get(`/expense/${groupId}/expenses`)
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message || 'Failed to fetch expenses');
        console.log('Expenses data:', data.expenses); // Temporary debug log
        setExpenses(data.expenses);
      })
      .catch((err) => {
        console.error('Error fetching expenses:', err);
        setExpenses([]);
      });
  };

  const handleGroupSelect = (groupName) => {
    setSelectedGroup(groupName);

    const group = groups.find(g => g.name === groupName);
    if (group) {
      setMembers(group.members);
      fetchExpenses(group.id);
    }
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
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
            {groups.length > 0 ? (
              groups.map((group, index) => (
                <button
                  key={index}
                  onClick={() => handleGroupSelect(group.name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedGroup === group.name 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {group.name}
                </button>
              ))
            ) : (
              <div className="text-gray-500 text-sm text-center mt-4">
                You don’t have any groups yet. Create one to get started!
              </div>
            )}
          </div>
          <div className="mt-6">
            <button
              onClick={() => navigate('/creategroup')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
            >
              + Create Group
            </button>
          </div>

          </div>
        </div>

        
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            
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

            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Group Expenses</h2>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div 
                    key={expense._id} 
                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleExpenseClick(expense)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{expense.description}</h3>
                      <p className="text-sm text-gray-600">
                        Paid by {expense.user?.username || 'Unknown'} • {new Date(expense.updatedAt).toLocaleDateString()}
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

      {/* Expense Details Modal */}
      <ExpenseDetails
        expense={selectedExpense}
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
      />
    </div>
  );
}

export default GroupDetails;
