import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const memberIds = members
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    setLoading(true);
    const memberUsernames = members.split(',').map(m => m.trim()).filter(Boolean);
    try {
      const res = await api.post('/group/create', {
        name,
        description,
        members: memberUsernames,
      });

      if (res.data.success) {
        alert('Group created successfully');
        navigate('/groupdetails');
      } else {
        alert(res.data.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('An error occurred. Please try again.');
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
            <label className="block mb-1 font-medium">Description</label>
            <textarea
              className="w-full border rounded p-2"
              placeholder="Enter group description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Member Usernames (comma-separated)</label>
            <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="alice, bob, charlie"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Enter usernames separated by commas.</p>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateGroup;