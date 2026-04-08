import React, { useState } from 'react';
import api from '../api';

function AddMembers({
  currentUsername = '',
  selectedUsers,
  onSelectedUsersChange,
  label = 'Add Members (Optional)',
//   helperText = 'Search and click users to add them. The logged-in user is always included as Admin.',
  excludedUsernames = [],
  showAdminChip = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get(`/user/search?q=${encodeURIComponent(query)}`);
      if (res.data.success) {
        const filteredUsers = res.data.users.filter(
          (user) =>
            user.username !== currentUsername &&
            !excludedUsernames.includes(user.username) &&
            !selectedUsers.some((selected) => selected._id === user._id)
        );
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search users error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    const alreadySelected = selectedUsers.some((selected) => selected._id === user._id);
    const updatedUsers = alreadySelected
      ? selectedUsers.filter((selected) => selected._id !== user._id)
      : [...selectedUsers, user];

    onSelectedUsersChange(updatedUsers);
    setSearchResults((prev) => prev.filter((result) => result._id !== user._id));
  };

  const removeSelectedUser = (userId) => {
    onSelectedUsersChange(selectedUsers.filter((user) => user._id !== userId));
  };

  return (
    <div className="w-full min-w-0">
      <label className="block mb-1 font-medium text-sm md:text-base">{label}</label>
      <div className="relative">
        <input
          type="text"
          className="w-full border rounded p-2 text-sm md:text-base"
          placeholder="Search users by username or email"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
          <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-10 max-h-48 overflow-y-auto">
            {searchResults.map((user) => {
              const isSelected = selectedUsers.some(
                (selected) => selected._id === user._id
              );

              return (
                <div
                  key={user._id}
                  className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="min-w-0">
                    <span className="font-medium text-sm md:text-base">{user.username}</span>
                    <span className="text-xs text-gray-500 ml-2 break-all">{user.email}</span>
                  </div>
                  <span className="text-blue-600 text-xs font-semibold">
                    {isSelected ? 'Selected' : 'Click to add'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {searchQuery.trim().length >= 2 && isSearching && (
          <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-10 px-3 py-2 text-sm text-gray-500">
            Searching...
          </div>
        )}
      </div>

      {/* <p className="text-xs text-gray-500 mt-1">{helperText}</p> */}

      {showAdminChip && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Admin</h3>
          {currentUsername ? (
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-yellow-300">
                <span className="text-sm font-medium break-all">{currentUsername}</span>
                <span className="text-xs text-yellow-700 font-semibold">Admin</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading admin...</p>
          )}
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 text-sm md:text-base mb-2">Selected Members:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border max-w-full"
              >
                <span className="text-sm font-medium break-all">{user.username}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedUser(user._id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AddMembers;