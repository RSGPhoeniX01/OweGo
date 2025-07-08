import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import Header from "./Header";
import ExpenseDetails from "./ExpenseDetails";
import CreateExpense from "./CreateExpense";
import editIcon from "../assets/editsvg.svg";

import EditGroupModal from "./EditGroupModal";
function GroupDetails() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeGroupId = searchParams.get("groupId");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in to access group details.");
      navigate("/login");
      return;
    }

    api.get("/user/profile").catch(() => {
      localStorage.removeItem("token");
      alert("Session expired. Please log in again.");
      navigate("/login");
    });

    api
      .get("/group/allgroups")
      .then((res) => {
        const data = res.data;
        if (!data.success)
          throw new Error(data.message || "Failed to fetch groups");

        const fetchedGroups = data.groups.map((group) => ({
          id: group._id,
          name: group.name,
          members: group.members.map((m) => m.username),
          creator: group.creator?.username,
        }));
        setGroups(fetchedGroups);
        let initialGroup = null;
        if (routeGroupId) {
          initialGroup = data.groups.find((g) => g._id === routeGroupId);
        }
        if (!initialGroup && data.groups.length > 0) {
          initialGroup = data.groups[0];
        }
        if (initialGroup) {
          setSelectedGroup(initialGroup.name);
          setMembers(initialGroup.members.map((m) => m.username));
          fetchExpenses(initialGroup._id);
        }
      })
      .catch((err) => {
        console.error("Error fetching groups:", err);
        alert("Could not load groups. Please try again later.");
      });
  }, [navigate, routeGroupId]);

  const fetchExpenses = (groupId) => {
    api
      .get(`/expense/${groupId}/expenses`)
      .then((res) => {
        const data = res.data;
        if (!data.success)
          throw new Error(data.message || "Failed to fetch expenses");
        console.log("Expenses data:", data.expenses); // Temporary debug log
        setExpenses(data.expenses);
      })
      .catch((err) => {
        console.error("Error fetching expenses:", err);
        setExpenses([]);
      });
  };

  const handleGroupSelect = (groupName) => {
    const group = groups.find((g) => g.name === groupName);
    if (group) {
      setSelectedGroup(group.name);
      setMembers(group.members);
      fetchExpenses(group.id);
      setSearchParams({ groupId: group.id });
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

  // --- User Search and Add Member Logic ---
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      console.log("Searching for:", query);
      const res = await api.get(`/user/search?q=${encodeURIComponent(query)}`);
      console.log("Search response:", res.data);
      if (res.data.success) {
        // Filter out users who are already in the group
        const filteredUsers = res.data.users.filter(
          (user) => !members.includes(user.username)
        );
        console.log("Filtered users:", filteredUsers);
        setSearchResults(filteredUsers);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleUserSelect = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.find((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;

    const group = groups.find((g) => g.name === selectedGroup);
    if (!group) return;

    try {
      // Get array of user IDs
      const memberIds = selectedUsers.map((user) => user._id);

      // Add all selected users at once using the correct endpoint
      const res = await api.post(`/group/${group.id}/add-members`, {
        members: memberIds,
      });

      if (res.data.success) {
        // Add usernames to members list
        const newUsernames = selectedUsers.map((user) => user.username);
        setMembers((prev) => [...prev, ...newUsernames]);

        // Clear selected users after adding
        setSelectedUsers([]);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Add members error:", err);
      alert("Failed to add members. Please try again.");
    }
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleAddExpense = () => {
    setIsCreateExpenseModalOpen(true);
  };

  const handleCloseCreateExpenseModal = () => {
    setIsCreateExpenseModalOpen(false);
  };

  const handleExpenseCreated = () => {
    const group = groups.find((g) => g.name === selectedGroup);
    if (group) {
      fetchExpenses(group.id);
    }
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupBeingEdited, setGroupBeingEdited] = useState(null);
  const handleEditGroupClick = (group) => {
    setGroupBeingEdited(group);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedGroup = async (updatedGroup) => {
    try {
      const res = await api.put(`/group/${updatedGroup.id}/edit`, {
        name: updatedGroup.name,
        description: updatedGroup.description,
      });

      if (res.data.success) {
        // Update local state
        setGroups((prev) =>
          prev.map((g) =>
            g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g
          )
        );
        if (selectedGroup === updatedGroup.name) {
          setSelectedGroup(updatedGroup.name);
        }
        setIsEditModalOpen(false);
        alert("Group updated successfully");
      } else {
        alert("Failed to update group");
      }
    } catch (error) {
      console.error("Edit group error:", error);
      alert("An error occurred while updating the group");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-screen ">
        {/* Left Pane - Groups */}
        <div className="w-64 bg-white shadow-lg flex flex-col overflow-y-auto">
          <div className="p-4 border-b">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Your Groups</h2>
            <div className="space-y-2">
              {groups.length > 0 ? (
                groups.map((group, index) => (
                  <div
                    key={index}
                    className={`group w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      selectedGroup === group.name
                        ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleGroupSelect(group.name)}
                  >
                    <span className="flex-1 truncate">{group.name}</span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGroupClick(group);
                      }}
                      className="hidden group-hover:flex items-center justify-center p-1 rounded hover:bg-gray-200 transition"
                    >
                      <img
                        src={editIcon}
                        alt="Edit"
                        className="h-4 w-4 opacity-70 hover:opacity-100"
                      />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center mt-4">
                  You don't have any groups yet. Create one to get started!
                </div>
              )}
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate("/creategroup")}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                + Create Group
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                {selectedGroup}
              </h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Members</h2>
                <div className="flex items-center space-x-2">
                  {/* Search Box */}
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search user..."
                      className="p-2 border rounded text-sm w-40"
                    />
                    {searchQuery && searchResults.length > 0 && (
                      <div className="absolute left-0 mt-1 w-56 bg-white border rounded shadow z-10 max-h-48 overflow-y-auto">
                        {searchResults.map((user) => {
                          const isSelected = selectedUsers.find(
                            (u) => u._id === user._id
                          );
                          return (
                            <div
                              key={user._id}
                              className={`flex items-center justify-between px-2 py-1 hover:bg-gray-100 cursor-pointer ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleUserSelect(user)}
                            >
                              <div>
                                <span className="font-medium">
                                  {user.username}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {isSelected && (
                                  <span className="text-blue-600 text-xs">
                                    ✓
                                  </span>
                                )}
                                <span className="text-blue-600 text-xs font-semibold">
                                  {isSelected ? "Selected" : "Click to select"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedUsers.length > 0
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={handleAddSelectedUsers}
                    disabled={selectedUsers.length === 0}
                  >
                    Add Selected ({selectedUsers.length})
                  </button>
                </div>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">
                    Selected Users:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border"
                      >
                        <span className="text-sm font-medium">
                          {user.username}
                        </span>
                        <button
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {members.map((member, index) => {
                  const isCreator =
                    groups.find((g) => g.name === selectedGroup)?.creator ===
                    member;
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-3 rounded-lg ${
                        isCreator
                          ? "bg-yellow-50 border border-yellow-300"
                          : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                          isCreator ? "bg-yellow-500" : "bg-blue-500"
                        }`}
                      >
                        {member.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{member}</span>
                        {isCreator && (
                          <span className="text-xs text-yellow-600 font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Group Expenses</h2>
                <button
                  onClick={handleAddExpense}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Expense
                </button>
              </div>
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
                        Paid by {expense.user?.username || "Unknown"} •{" "}
                        {new Date(expense.updatedAt).toLocaleDateString()}
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

      {/* Create Expense Modal */}
      <CreateExpense
        groupId={groups.find((g) => g.name === selectedGroup)?.id}
        isOpen={isCreateExpenseModalOpen}
        onClose={handleCloseCreateExpenseModal}
        onExpenseCreated={handleExpenseCreated}
      />
      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={groupBeingEdited}
        onSave={handleSaveEditedGroup}
      />
    </div>
  );
}

export default GroupDetails;