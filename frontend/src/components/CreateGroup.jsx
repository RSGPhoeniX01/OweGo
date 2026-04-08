import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import AddMembers from './AddMembers';
import { showNotification } from '../notifications';

function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [selectedMemberUsernames, setSelectedMemberUsernames] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    api.get('/user/profile')
      .then((res) => {
        const username = res.data?.data?.username || '';
        setCurrentUsername(username);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const memberUsernames = Array.from(
      new Set([
        currentUsername,
        ...selectedMemberUsernames,
      ])
    ).filter(Boolean);

    setLoading(true);
    try {
      const res = await api.post('/group/create', {
        name,
        description,
        members: memberUsernames,
      });

      if (res.data.success) {
        showNotification('Group created successfully', 'success');
        navigate('/groupdetails');
      } else {
        showNotification(res.data.message || 'Failed to create group', 'error');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      showNotification('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded shadow max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Create New Group</h2>
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Group Name</label>
            <input
              type="text"
              required
              className="w-full border rounded p-2"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Description (Optional)</label>
            <textarea
              className="w-full border rounded p-2"
              placeholder="Enter group description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <AddMembers
              currentUsername={currentUsername}
              onSelectionChange={(users) =>
                setSelectedMemberUsernames(users.map((user) => user.username))
              }
            />
          </div>
          <div className="flex justify-end space-x-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
          <button
              type="button"
              onClick={() => navigate('/groupdetails')}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;