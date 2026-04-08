import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api";
import Header from "./Header";
import ExpenseDetails from "./ExpenseDetails";
import CreateExpense from "./CreateExpense";
import editIcon from "../assets/editsvg.svg";
import SettleUp from "./SettleUp";
import { jwtDecode } from "jwt-decode";
import EditExpenseModal from "./EditExpenseModal";
import EditGroupModal from "./EditGroupModal";
import open_slider from "../assets/open_slider.svg";
import closed_slider from "../assets/close_slider.svg";
import AddMembers from "./AddMembers";
function GroupDetails() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const routeGroupId = searchParams.get("groupId");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [isGroupSettled, setIsGroupSettled] = useState(false);
  const [settledStatusMap, setSettledStatusMap] = useState({});
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupBeingEdited, setGroupBeingEdited] = useState(null);
  const handleEditGroupClick = (group) => {
    setGroupBeingEdited(group);
    setIsEditModalOpen(true);
  };
  const handleSaveGroupChanges = async (updatedGroup) => {
    try {
      const res = await api.put(`/group/${updatedGroup.id}/edit`, {
        name: updatedGroup.name,
        description: updatedGroup.description,
      });

      if (res.data.success) {
        // Update group list locally
        setGroups((prev) =>
          prev.map((g) =>
            g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g
          )
        );
        if (selectedGroup === updatedGroup.name) {
          setSelectedGroup(updatedGroup.name); // reflect name change
        }
        setIsEditModalOpen(false);
        setGroupBeingEdited(null);
      } else {
        alert("Failed to update group.");
      }
    } catch (error) {
      console.error("Update group failed:", error);
      alert("Something went wrong while updating the group.");
    }
  };

  // Get userId from token (original, simple)
  let userId = "";
  try {
    const token = localStorage.getItem("token");
    if (token) {
      userId = jwtDecode(token).userId;
    }
  } catch (e) {
    userId = "";
  }

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
          creatorId: group.creator?._id,
        }));
        setGroups(fetchedGroups);
        // Fetch settle status for all groups
        api
          .post("/settleup/multi-status", {
            groupIds: data.groups.map((g) => g._id),
          })
          .then((res2) => {
            if (res2.data && res2.data.success) {
              setSettledStatusMap(res2.data.status);
              // Filter out settled groups - only show active groups
              const activeGroups = fetchedGroups.filter(
                (group) => !res2.data.status[group.id]
              );
              setGroups(activeGroups);
            }
          });
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

    // Check if group is settled when group changes
    if (routeGroupId) {
      api
        .get(`/settleup/${routeGroupId}/status`)
        .then((res) => {
          if (res.data && res.data.allSettled) {
            setIsGroupSettled(true);
          } else {
            setIsGroupSettled(false);
          }
        })
        .catch(() => setIsGroupSettled(false));
    }
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
      setSidebarOpen(false);
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

  const handleAddMembersToGroup = async (usersToAdd) => {
    if (usersToAdd.length === 0) return false;

    const group = groups.find((g) => g.name === selectedGroup);
    if (!group) return false;

    try {
      // Get array of user IDs
      const memberIds = usersToAdd.map((user) => user._id);

      // Add all selected users at once using the correct endpoint
      const res = await api.post(`/group/${group.id}/add-members`, {
        members: memberIds,
      });

      if (res.data.success) {
        // Add usernames to members list
        const newUsernames = usersToAdd.map((user) => user.username);
        setMembers((prev) => [...prev, ...newUsernames]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Add members error:", err);
      alert("Failed to add members. Please try again.");
      return false;
    }
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

  // Function to open the edit expense modal
  const [editExpense, setEditExpense] = useState(null);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const openEditExpense = (expense) => {
    setEditExpense(expense);
    setIsEditExpenseModalOpen(true);
  };

  const handleUpdateExpense = async (updated) => {
  try {
    const res = await api.put(`/expense/${updated._id}/editexpense`, {
      description: updated.description,
      amount: updated.amount,
      splits: updated.splits  
    });

    if (res.data.success) {
      alert("Expense updated");
      fetchExpenses(groupId);
      setIsEditExpenseModalOpen(false);
    }
  } catch (err) {
    console.error("Error updating:", err);
    alert("Update failed");
  }
};
  const deleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      const res = await api.delete(`/expense/${expenseId}/deleteexpense`);
      if (res.data.success) {
        alert("Expense deleted successfully");
        // Refresh the expense list
        const group = groups.find((g) => g.name === selectedGroup);
        if (group) fetchExpenses(group.id);
      } else {
        alert(res.data.message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting expense");
    }
  };

  const selectedGroupObj = groups.find((g) => g.name === selectedGroup);
  const groupId = selectedGroupObj?.id;
  const groupMembers = selectedGroupObj?.members || [];
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      <div className="flex h-screen overflow-x-hidden">
        {/* Left Pane - Groups */}
        <div className={`fixed left-0 top-16 h-full ${sidebarOpen ? 'w-56 md:w-64' : 'w-10 md:w-12'} bg-white shadow-lg flex flex-col overflow-y-auto transition-all duration-300 ease-in-out`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 focus:outline-none absolute top-2 right-2 text-sm border border-gray-400 rounded px-1 py-0.5 cursor-pointer"
            title="Toggle sidebar"
          >
            <img
              src={sidebarOpen ? closed_slider : open_slider}
              alt="Toggle Sidebar"
              className="w-4 h-4"
            />
          </button>
          {sidebarOpen && (
            <>
              <div className="p-4 mt-10">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-blue-600 text-white text-sm md:text-base py-2 px-3 md:px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="p-4 pb-20">
                <h2 className="text-lg font-semibold mb-4">Your Groups</h2>
                <div className="space-y-2">
                  {groups.length > 0 ? (
                    groups.map((group, index) => (
                      <div
                        key={index}
                        className={`group w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                          selectedGroup === group.name
                            ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600"
                            : settledStatusMap[group.id]
                            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => handleGroupSelect(group.name)}
                      >
                        <span className="flex-1 truncate">{group.name}</span>

                        {userId === group.creatorId && (
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
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm text-center mt-4">
                      You don't have any groups yet. Create one to get started!
                    </div>
                  )}
                </div>
                <div className="mt-6 mb-4">
                  <button
                    onClick={() => navigate("/creategroup")}
                    className="w-full bg-green-600 text-white text-sm md:text-base py-2 px-3 md:px-4 rounded-lg hover:bg-green-700 transition-colors text-center cursor-pointer"
                  >
                    + Create Group
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-gray-50 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-56 md:ml-64' : 'ml-10 md:ml-12'}`}>
          <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto mt-16 w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-words">
                {selectedGroup}
              </h1>
            </div>

            {/* Settled group indicator */}
            {isGroupSettled && (
              <div className="mb-6 p-4 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center">
                <span className="text-green-800 font-bold text-lg">
                  Group Settled ✓
                </span>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-6 overflow-x-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Members</h2>
                <button
                  type="button"
                  onClick={() => setIsMembersPanelOpen((prev) => !prev)}
                  className="text-gray-600 focus:outline-none text-sm border border-gray-400 rounded px-1 py-0.5 cursor-pointer"
                  title="Toggle members panel"
                >
                  <img
                    src={open_slider}
                    alt="Toggle Members Panel"
                    className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                      isMembersPanelOpen ? '-rotate-90' : 'rotate-90'
                    }`}
                  />
                </button>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isMembersPanelOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                  <div className="mb-6">
                    <div className="w-full min-w-0">
                      <AddMembers
                        key={selectedGroup || 'group-members'}
                        currentUsername=""
                        label="Add Members"
                        excludedUsernames={members}
                        showAdminChip={false}
                        onAddMembers={handleAddMembersToGroup}
                        addButtonLabel="Add"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {members.map((member, index) => {
                      const isCreator =
                        groups.find((g) => g.name === selectedGroup)?.creator ===
                        member;
                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 p-2.5 md:p-3 rounded-lg min-w-0 ${
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
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{member}</span>
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
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 overflow-x-hidden">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                <h2 className="text-lg md:text-xl font-semibold">Group Expenses</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleAddExpense}
                    className="bg-green-600 text-white text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer transition-colors w-full sm:w-auto"
                  >
                    Add Expense
                  </button>
                  <button
                    onClick={() => setIsSettleUpOpen(true)}
                    className="bg-blue-600 text-white text-sm md:text-base px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors w-full sm:w-auto"
                  >
                    Settle Up
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {expenses.map((expense) => {
                  const isOwner = expense.user?._id === userId;

                  return (
                    <div
                      key={expense._id}
                      className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 md:p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => handleExpenseClick(expense)}
                      >
                        <h3 className="font-medium text-sm md:text-base break-words">{expense.description}</h3>
                        <p className="text-xs md:text-sm text-gray-600 break-words">
                          Paid by {expense.user?.username || "Unknown"} •{" "}
                          {new Date(expense.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-base md:text-lg font-semibold text-green-600">
                          ₹{expense.amount}
                        </span>
                        {isOwner && (
                          <div className="flex gap-2 mt-1 justify-end">
                            <button
                              onClick={() => openEditExpense(expense)}
                              className="text-blue-600 text-sm hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteExpense(expense._id)}
                              className="text-red-600 text-sm hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
        groupId={groupId}
        isOpen={isCreateExpenseModalOpen}
        onClose={handleCloseCreateExpenseModal}
        onExpenseCreated={handleExpenseCreated}
      />

      {/* SettleUp modal */}
      <SettleUp
        groupId={groupId}
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        userId={userId}
        groupMembers={groupMembers}
      />
      {/* Edit Group Modal */}
      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={groupBeingEdited}
        onSave={handleSaveGroupChanges}
      />
      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => setIsEditExpenseModalOpen(false)}
        expense={editExpense}
        onSave={handleUpdateExpense}
      />
    </div>
  );
}
export default GroupDetails;
