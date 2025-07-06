import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from './Header';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupCount, setGroupCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to access your profile.');
      navigate('/login');
      return;
    }

    // Get user profile data and group count
    Promise.all([
      api.get('/user/profile'),
      api.get('/group/allgroups')
    ])
      .then(([profileResponse, groupsResponse]) => {
        setUser(profileResponse.data.data);
        setGroupCount(groupsResponse.data.groups.length);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        alert('Session expired. Please log in again.');
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    navigate('/login');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      username: user?.username || '',
      email: user?.email || '',
      password: ''
    });
  };

  const handleSave = async () => {
    try {
      const updateData = {};
      if (editForm.username && editForm.username !== user?.username) {
        updateData.username = editForm.username;
      }
      if (editForm.email && editForm.email !== user?.email) {
        updateData.email = editForm.email;
      }
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      if (Object.keys(updateData).length === 0) {
        alert('No changes to save');
        return;
      }

      const response = await api.put('/user/update', updateData);
      if (response.data.success) {
        setUser(response.data.data);
        setIsEditing(false);
        setEditForm({ username: '', email: '', password: '' });
        alert('Profile updated successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ username: '', email: '', password: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto py-8 px-4 mt-16">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <div className="space-x-3">
              {!isEditing ? (
                <button 
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    onClick={handleSave}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Personal Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.username}</h3>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Username:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="text-gray-800 border rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-800">{user?.username}</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Email:</span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="text-gray-800 border rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-gray-800">{user?.email}</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Password:</span>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                          className="text-gray-800 border rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-800">••••••••</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">Member since:</span>
                    <span className="text-gray-800">
                      {new Date(user?.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Account Statistics</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Groups</h3>
                  <p className="text-2xl font-bold text-blue-600">{groupCount}</p>
                  <p className="text-sm text-blue-600">Active groups</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Total Expenses</h3>
                  <p className="text-2xl font-bold text-green-600">₹2,450</p>
                  <p className="text-sm text-green-600">This month</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Settlements</h3>
                  <p className="text-2xl font-bold text-purple-600">8</p>
                  <p className="text-sm text-purple-600">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg text-left transition-colors"
              >
                <h3 className="font-semibold text-gray-800">Dashboard</h3>
                <p className="text-sm text-gray-600">View your overview</p>
              </button>
              <button 
                onClick={() => navigate('/groupdetails')}
                className="bg-gray-100 hover:bg-gray-200 p-4 rounded-lg text-left transition-colors"
              >
                <h3 className="font-semibold text-gray-800">Groups</h3>
                <p className="text-sm text-gray-600">Manage your groups</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
