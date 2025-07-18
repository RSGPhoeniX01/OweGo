import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Groups() {
  const [allGroups, setAllGroups] = useState([]);
  const [settledStatusMap, setSettledStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to access groups.');
      navigate('/login');
      return;
    }

    setLoading(true);
    api.get('/group/allgroups')
      .then((res) => {
        const data = res.data;
        if (!data.success) throw new Error(data.message || 'Failed to fetch groups');
        
        // Fetch settle status for all groups
        api.post('/settleup/multi-status', { groupIds: data.groups.map(g => g._id) })
          .then(res2 => {
            if (res2.data && res2.data.success) {
              setSettledStatusMap(res2.data.status);
              // Filter out settled groups - only show active groups
              const activeGroups = data.groups.filter(group => !res2.data.status[group._id]);
              setAllGroups(activeGroups);
            } else {
              setAllGroups(data.groups);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error('Settle status error:', err);
            setAllGroups(data.groups);
            setLoading(false);
          });
      })
      .catch((err) => {
        console.error('Error fetching groups:', err);
        setLoading(false);
      });
  }, [navigate]);

  const handleGroupClick = (groupId) => {
    navigate(`/groupdetails?groupId=${groupId}`);
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
              className={`border border-gray-300 rounded-xl p-4 transition-colors cursor-pointer ${settledStatusMap[group._id] ? 'bg-green-100 text-green-800 border-green-400' : 'hover:bg-gray-50 bg-white'}`}
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
              {settledStatusMap[group._id] && (
                <div className="mt-2 text-green-700 font-semibold text-xs">Settled ✓</div>
              )}
            </div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}

export default Groups; 