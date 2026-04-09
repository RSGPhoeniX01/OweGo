import React, { useState, useEffect, useRef } from "react";
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
import { showNotification } from "../notifications";
function GroupDetails() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const routeGroupId = searchParams.get("groupId");
  const [isGroupDetailsLoading, setIsGroupDetailsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] =
    useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settledStatusMap, setSettledStatusMap] = useState({});
  const [settleProgressMap, setSettleProgressMap] = useState({});
  const [userSettledMap, setUserSettledMap] = useState({});
  const [selectedGroupSettleStatus, setSelectedGroupSettleStatus] = useState({
    userSettled: false,
    allSettled: false,
    settledCount: 0,
    totalMembers: 0,
  });
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupBeingEdited, setGroupBeingEdited] = useState(null);
  const prevSettledStatusRef = useRef({});
  const selectionRequestRef = useRef(0);

  const resetSelectedGroupState = () => {
    setSelectedGroup("");
    setMembers([]);
    setExpenses([]);
    setSelectedExpense(null);
    setIsExpenseModalOpen(false);
    setIsCreateExpenseModalOpen(false);
    setIsSettleUpOpen(false);
    setSelectedGroupSettleStatus({
      userSettled: false,
      allSettled: false,
      settledCount: 0,
      totalMembers: 0,
    });
  };

  const startSelectionTransition = () => {
    selectionRequestRef.current += 1;
    setIsGroupDetailsLoading(true);
    resetSelectedGroupState();
    return selectionRequestRef.current;
  };
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
        showNotification("Group updated", "success");
      } else {
        showNotification("Failed to update group.", "error");
      }
    } catch (error) {
      console.error("Update group failed:", error);
      showNotification("Something went wrong while updating the group.", "error");
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

  const mapGroupsFromResponse = (groupData) => {
    return groupData.map((group) => ({
      id: group._id,
      name: group.name,
      members: group.members.map((m) => m.username),
      creator: group.creator?.username,
      creatorId: group.creator?._id,
    }));
  };

  const fetchGroupsAndSettleProgress = async (
    showSettleNotifications = false,
    requestId = selectionRequestRef.current
  ) => {
    const groupRes = await api.get("/group/allgroups");
    const data = groupRes.data;
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch groups");
    }

    const fetchedGroups = mapGroupsFromResponse(data.groups);
    const statusRes = await api.post("/settleup/multi-status", {
      groupIds: data.groups.map((g) => g._id),
    });

    if (statusRes.data?.success) {
      const nextStatusMap = statusRes.data.status || {};
      const nextProgressMap = statusRes.data.progress || {};
      const nextUserSettledMap = statusRes.data.userSettled || {};

      if (showSettleNotifications) {
        Object.entries(nextStatusMap).forEach(([id, isSettled]) => {
          if (isSettled && !prevSettledStatusRef.current[id]) {
            const settledGroup = fetchedGroups.find((g) => g.id === id);
            const groupName = settledGroup?.name || "A group";
            showNotification(`${groupName} has been settled and moved to Tracking.`, "success");
            if (routeGroupId === id) {
              navigate("/dashboard?view=settlements");
            }
          }
        });
      }

      prevSettledStatusRef.current = nextStatusMap;
      setSettledStatusMap(nextStatusMap);
      setSettleProgressMap(nextProgressMap);
      setUserSettledMap(nextUserSettledMap);

      const activeGroups = fetchedGroups.filter((group) => !nextStatusMap[group.id]);
      setGroups(activeGroups);

      if (requestId !== selectionRequestRef.current) {
        return;
      }

      let initialGroup = null;
      if (routeGroupId) {
        initialGroup = activeGroups.find((g) => g.id === routeGroupId);
      }
      if (!initialGroup && activeGroups.length > 0) {
        initialGroup = activeGroups[0];
      }

      if (initialGroup) {
        setSelectedGroup(initialGroup.name);
        setMembers(initialGroup.members);
        await fetchExpenses(initialGroup.id, requestId);
        setSelectedGroupSettleStatus({
          userSettled: Boolean(nextUserSettledMap[initialGroup.id]),
          allSettled: Boolean(nextStatusMap[initialGroup.id]),
          settledCount: nextProgressMap[initialGroup.id]?.settledCount || 0,
          totalMembers:
            nextProgressMap[initialGroup.id]?.totalMembers || initialGroup.members.length,
        });
      } else {
        setSelectedGroup("");
        setMembers([]);
        setExpenses([]);
      }

      return;
    }

    setGroups(fetchedGroups);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      showNotification("Please log in to access group details.", "error");
      navigate("/login");
      return;
    }

    api.get("/user/profile").catch(() => {
      localStorage.removeItem("token");
      showNotification("Session expired. Please log in again.", "error");
      navigate("/login");
    });

    const requestId = startSelectionTransition();

    fetchGroupsAndSettleProgress(false, requestId)
      .catch((err) => {
        console.error("Error fetching groups:", err);
        showNotification("Could not load groups. Please try again later.", "error");
      })
      .finally(() => {
        if (selectionRequestRef.current === requestId) {
          setIsGroupDetailsLoading(false);
        }
      });
  }, [navigate, routeGroupId]);

  const fetchExpenses = (groupId, requestId = selectionRequestRef.current) => {
    return api
      .get(`/expense/${groupId}/expenses`)
      .then((res) => {
        const data = res.data;
        if (!data.success)
          throw new Error(data.message || "Failed to fetch expenses");
        console.log("Expenses data:", data.expenses); // Temporary debug log
        if (requestId !== selectionRequestRef.current) {
          return;
        }
        setExpenses(data.expenses);
      })
      .catch((err) => {
        if (requestId !== selectionRequestRef.current) {
          return [];
        }
        console.error("Error fetching expenses:", err);
        setExpenses([]);
        return [];
      });
  };

  const handleGroupSelect = (groupName) => {
    const group = groups.find((g) => g.name === groupName);
    if (group) {
      startSelectionTransition();
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

    if (selectedGroupSettleStatus.userSettled || selectedGroupSettleStatus.allSettled) {
      showNotification("You already settled this group. Adding members is disabled.", "error");
      return false;
    }

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
      showNotification("Failed to add members. Please try again.", "error");
      return false;
    }
  };

  const handleAddExpense = () => {
    if (selectedGroupSettleStatus.userSettled || selectedGroupSettleStatus.allSettled) {
      showNotification("You already settled this group. Adding expenses is disabled.", "error");
      return;
    }
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
      showNotification("Expense updated", "success");
      fetchExpenses(groupId);
      setIsEditExpenseModalOpen(false);
    }
  } catch (err) {
    console.error("Error updating:", err);
    showNotification("Update failed", "error");
  }
};
  const deleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;

    try {
      const res = await api.delete(`/expense/${expenseId}/deleteexpense`);
      if (res.data.success) {
        showNotification("Expense deleted successfully", "success");
        // Refresh the expense list
        const group = groups.find((g) => g.name === selectedGroup);
        if (group) fetchExpenses(group.id);
      } else {
        showNotification(res.data.message || "Failed to delete expense", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification("Error deleting expense", "error");
    }
  };

  const selectedGroupObj = groups.find((g) => g.name === selectedGroup);
  const groupId = selectedGroupObj?.id;
  const groupMembers = selectedGroupObj?.members || [];
  const selectedGroupProgress = groupId
    ? settleProgressMap[groupId] || { settledCount: 0, totalMembers: groupMembers.length }
    : { settledCount: 0, totalMembers: groupMembers.length };
  const hasUserSettledInGroup = groupId ? Boolean(userSettledMap[groupId]) : false;
  const isGroupSettled = groupId ? Boolean(settledStatusMap[groupId]) : false;
  const canAddMembers =
    selectedGroupObj?.creatorId === userId &&
    !hasUserSettledInGroup &&
    !isGroupSettled;

  useEffect(() => {
    if (!groupId) return;
    const intervalId = setInterval(() => {
      fetchExpenses(groupId);
      fetchGroupsAndSettleProgress(true).catch(() => {});
    }, 1000);
    return () => clearInterval(intervalId);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    setSelectedGroupSettleStatus({
      userSettled: hasUserSettledInGroup,
      allSettled: isGroupSettled,
      settledCount: selectedGroupProgress.settledCount || 0,
      totalMembers: selectedGroupProgress.totalMembers || groupMembers.length,
    });
  }, [
    groupId,
    hasUserSettledInGroup,
    isGroupSettled,
    selectedGroupProgress.settledCount,
    selectedGroupProgress.totalMembers,
    groupMembers.length,
  ]);

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
                            : settleProgressMap[group.id]?.settledCount > 0
                            ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => handleGroupSelect(group.name)}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{group.name}</span>
                          {settleProgressMap[group.id]?.settledCount > 0 && (
                            <span className="block text-xs font-medium">
                              {settleProgressMap[group.id].settledCount}/{settleProgressMap[group.id].totalMembers} settled
                            </span>
                          )}
                        </div>

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
          {isGroupDetailsLoading ? (
            <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto mt-16 w-full">
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
            </div>
          ) : (
          <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto mt-16 w-full">
            <div className="flex justify-between items-center mb-6">
              <h1
                className={`text-2xl md:text-3xl font-bold break-words ${
                  selectedGroupProgress.settledCount > 0 && !isGroupSettled
                    ? "text-yellow-700"
                    : "text-gray-800"
                }`}
              >
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
            {!isGroupSettled &&
              selectedGroupProgress.totalMembers > 0 &&
              selectedGroupProgress.settledCount > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-yellow-100 border border-yellow-300 flex items-center justify-center">
                  <span className="text-yellow-800 font-bold text-lg">
                    {selectedGroupProgress.settledCount}/{selectedGroupProgress.totalMembers} members settled
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
                    <div
                      className={`w-full min-w-0 ${
                        canAddMembers ? "" : "opacity-60 pointer-events-none"
                      }`}
                    >
                      <AddMembers
                        key={selectedGroup || 'group-members'}
                        currentUsername=""
                        label="Add Members"
                        excludedUsernames={members}
                        showAdminChip={false}
                        onAddMembers={handleAddMembersToGroup}
                        addButtonLabel="Add"
                        canAddMembers={canAddMembers}
                      />
                    </div>
                    {!canAddMembers && (
                      <p className="text-xs text-yellow-700 mt-2">
                        {hasUserSettledInGroup
                          ? "You have settled this group. Add members is disabled for you."
                          : "Only the group admin can add members."}
                      </p>
                    )}
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
                    disabled={hasUserSettledInGroup || isGroupSettled}
                    className={`text-sm md:text-base px-3 md:px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
                      hasUserSettledInGroup || isGroupSettled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                    }`}
                  >
                    {hasUserSettledInGroup ? "Expense Locked" : "Add Expense"}
                  </button>
                  <button
                    onClick={() => {
                      if (!isGroupSettled && !hasUserSettledInGroup) setIsSettleUpOpen(true);
                    }}
                    disabled={isGroupSettled || hasUserSettledInGroup}
                    className={`text-sm md:text-base px-3 md:px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
                      isGroupSettled || hasUserSettledInGroup
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    }`}
                  >
                    {isGroupSettled ? "Group Settled" : hasUserSettledInGroup ? "Settled Up" : "Settle Up"}
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
          )}
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
