import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import { showNotification } from '../notifications';

function AddMembers({
  currentUsername = '',
  label = 'Add Members (Optional)',
//   helperText = 'Search and click users to add them. The logged-in user is always included as Admin.',
  excludedUsernames = [],
  showAdminChip = true,
  onSelectionChange,
  onAddMembers,
  addButtonLabel = 'Add',
  canAddMembers = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const shouldShowDropdown = isInputFocused && searchQuery.trim().length >= 2;
    if (!shouldShowDropdown) return;

    const updateDropdownPosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const belowTop = rect.bottom + 4;
      const spaceBelow = window.innerHeight - belowTop - 8;
      const spaceAbove = rect.top - 8;
      const showAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const availableHeight = showAbove ? spaceAbove - 4 : spaceBelow;
      const maxHeight = Math.max(120, Math.min(360, availableHeight));
      const top = showAbove ? Math.max(8, rect.top - maxHeight - 4) : belowTop;
      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        top,
        width: rect.width,
        zIndex: 9999,
        maxHeight,
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isInputFocused, searchQuery]);

  const updateSelectedUsers = (updater) => {
    setSelectedUsers((prev) => {
      const nextUsers = typeof updater === 'function' ? updater(prev) : updater;
      if (onSelectionChange) {
        onSelectionChange(nextUsers);
      }
      return nextUsers;
    });
  };

  const runSearch = async (query, selectedUsersOverride = selectedUsers) => {
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
            !selectedUsersOverride.some((selected) => selected._id === user._id)
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

  const handleSearch = async (query) => {
    await runSearch(query);
  };

  const handleUserSelect = (user) => {
    const alreadySelected = selectedUsers.some((selected) => selected._id === user._id);
    const updatedUsers = alreadySelected
      ? selectedUsers.filter((selected) => selected._id !== user._id)
      : [...selectedUsers, user];

    updateSelectedUsers(updatedUsers);
    setSearchResults((prev) => prev.filter((result) => result._id !== user._id));
  };

  const removeSelectedUser = (userId) => {
    const updatedUsers = selectedUsers.filter((user) => user._id !== userId);
    updateSelectedUsers(updatedUsers);

    if (searchQuery.trim().length >= 2) {
      runSearch(searchQuery, updatedUsers);
    }
  };

  const handleAddMembersClick = async () => {
    if (!onAddMembers || selectedUsers.length === 0 || isAdding) return;
    if (!canAddMembers) {
      showNotification('Only admin can add new members', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const shouldClear = await onAddMembers(selectedUsers);
      if (shouldClear !== false) {
        showNotification('Members added successfully', 'success');
        updateSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      <label className="block mb-1 font-medium text-sm md:text-base">{label}</label>
      <div className="relative" ref={containerRef}>
        <div
          className="w-full border rounded p-2 bg-white flex items-center gap-2"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-full border border-blue-200 max-w-full"
              >
                <span className="text-xs md:text-sm font-medium break-all">{user.username}</span>
                <button
                  type="button"
                  onClick={() => removeSelectedUser(user._id)}
                  className="text-red-500 hover:text-red-700 text-sm leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            <input
              ref={inputRef}
              type="text"
              className="min-w-[180px] flex-1 border-0 outline-none text-sm md:text-base"
              placeholder="Search users by username or email"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
            />
          </div>
          {onAddMembers && (
            <button
              type="button"
              onClick={handleAddMembersClick}
              disabled={selectedUsers.length === 0 || isAdding}
              className={`shrink-0 px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                selectedUsers.length > 0 && !isAdding
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isAdding ? 'Adding...' : `${addButtonLabel} (${selectedUsers.length})`}
            </button>
          )}
        </div>

        {isInputFocused && searchQuery.trim().length >= 2 && searchResults.length > 0 && (
          <div style={dropdownStyle} className="bg-white border rounded shadow overflow-y-auto overflow-x-auto">
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
        {isInputFocused && searchQuery.trim().length >= 2 && isSearching && (
          <div style={dropdownStyle} className="bg-white border rounded shadow px-3 py-2 text-sm text-gray-500 overflow-y-auto">
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

    </div>
  );
}

export default AddMembers;