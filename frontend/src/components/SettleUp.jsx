import React, { useEffect, useState } from 'react';
import api from '../api';

const SettleUp = ({ groupId, isOpen, onClose, userId, groupMembers }) => {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [totalToPay, setTotalToPay] = useState(0);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [error, setError] = useState('');
  const [settling, setSettling] = useState(false);
  const [settleStatus, setSettleStatus] = useState(null); // null | 'waiting' | 'settled'
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  // Fetch settle status on open and after settling
  const fetchSettleStatus = () => {
    if (!groupId) return;
    api.get(`/settleup/${groupId}/status`).then(res => {
      if (res.data.success) {
        setHasConfirmed(res.data.userSettled);
        setSettleStatus(res.data.allSettled ? 'settled' : (res.data.userSettled ? 'waiting' : null));
      }
    });
  };

  useEffect(() => {
    if (!isOpen || !groupId) return;
    setLoading(true);
    setError('');
    api.post(`/expense/${groupId}/userexpense`)
      .then(res => {
        if (!res.data.success) throw new Error(res.data.message || 'Failed to fetch expenses');
        setExpenses(res.data.expenses);
        setTotalToPay(res.data.totalToPay);
        setTotalToReceive(res.data.totalToReceive);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch expenses');
        setLoading(false);
      });
    fetchSettleStatus();
    // eslint-disable-next-line
  }, [isOpen, groupId]);

  const handleSettle = () => {
    setShowConfirm(true);
  };

  const handleConfirmSettle = () => {
    setSettling(true);
    setSettleStatus('waiting');
    api.post(`/settleup/${groupId}`)
      .then(res => {
        setSettling(false);
        setShowConfirm(false);
        fetchSettleStatus();
      })
      .catch(err => {
        setError(err.message || 'Failed to settle group');
        setSettling(false);
        setShowConfirm(false);
      });
  };

  const handleCancelSettle = () => {
    setShowConfirm(false);
  };

  if (!isOpen) return null;

  // Calculate per-expense user position
  const expenseRows = expenses.map(exp => {
    let userPays = 0;
    let userReceives = 0;
    const isOwner = exp.user?._id === userId || exp.user === userId;
    if (isOwner) {
      userReceives = exp.splits
        .filter(s => (s.member?._id || s.member) !== userId)
        .reduce((sum, s) => sum + s.share, 0);
    } else {
      const split = exp.splits.find(s => (s.member?._id || s.member) === userId);
      if (split) {
        userPays = split.share;
      }
    }
    return {
      ...exp,
      userPays,
      userReceives,
      isOwner
    };
  });

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Settle Up</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto">
                <h3 className="font-semibold mb-2">Your Payments in this Group</h3>
                {expenseRows.length === 0 ? (
                  <div className="text-gray-500 text-sm">No expenses found.</div>
                ) : (
                  <ul className="divide-y">
                    {expenseRows.map(exp => (
                      <li key={exp._id} className="py-2 flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{exp.description}</span>
                          {exp.userPays > 0 ? (
                            <span className="text-red-600 font-semibold">-₹{exp.userPays}</span>
                          ) : exp.userReceives > 0 ? (
                            <span className="text-green-600 font-semibold">+₹{exp.userReceives}</span>
                          ) : (
                            <span className="text-gray-400 font-semibold">₹0</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Paid by {exp.user?.username || 'Unknown'} • {new Date(exp.updatedAt).toLocaleDateString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Total to Pay:</span>
                  <span className="text-red-600 font-bold">₹{totalToPay}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Total to Receive:</span>
                  <span className="text-green-600 font-bold">₹{totalToReceive}</span>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="flex flex-col items-end space-y-2 p-6 border-t">
          {settleStatus === 'settled' ? (
            <div className="text-center text-green-700 font-bold text-lg w-full">Group settled!</div>
          ) : hasConfirmed ? (
            <div className="text-center text-blue-700 font-bold text-lg w-full">You have settled up.</div>
          ) : showConfirm ? (
            <>
              <div className="flex w-full gap-2">
                <button
                  className="w-1/2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-60"
                  onClick={handleConfirmSettle}
                  disabled={settling}
                >
                  Confirm
                </button>
                <button
                  className="w-1/2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  onClick={handleCancelSettle}
                  disabled={settling}
                >
                  Cancel
                </button>
              </div>
              <div className="text-center text-red-500 text-sm mt-2 w-full">This can't be undone</div>
            </>
          ) : (
            <button
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-60"
              onClick={handleSettle}
              disabled={settling || settleStatus === 'waiting'}
            >
              {settleStatus === 'waiting' ? 'Waiting for others...' : 'Settle the group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettleUp; 