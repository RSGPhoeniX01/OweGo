import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Groups() {
  const [allGroups, setAllGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to access groups.');
      navigate('/login');
      return;
    }

    api.get('/group/allgroups')
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message || 'Failed to fetch groups');
        setAllGroups(data.groups);
      })
      .catch((err) => {
        console.error('Error fetching groups:', err);
      });
  }, [navigate]);

  const handleGroupClick = (groupId) => {
    navigate(`/groupdetails?groupId=${groupId}`);
  };



  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="border border-gray-300 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Groups</h2>
          <button
            onClick={() => navigate('/creategroup')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Create Group
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allGroups.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500 text-lg">No groups found.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first group to get started!</p>
          </div>
        ) : (
          allGroups.map((group) => (
            <div 
              key={group._id} 
              className="border border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors bg-white cursor-pointer"
              onClick={() => handleGroupClick(group._id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg text-gray-800">{group.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {group.members?.length || 0} members
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                {group.description || 'No description available'}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                <span className="text-blue-600 font-medium">Click to view details →</span>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}

export default Groups; 