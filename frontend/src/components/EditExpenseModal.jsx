import React, { useState, useEffect } from 'react';

function EditExpenseModal({ isOpen, onClose, expense, onSave }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [splits, setSplits] = useState([]);

  useEffect(() => {
    if (expense) {
      setDescription(expense.description || '');
      setAmount(expense.amount || 0);
      // Initialize splits from expense
      setSplits(
        expense.splits.map(split => ({
          memberId: split.member._id,
          username: split.member.username,
          share: split.share,
        }))
      );
    }
  }, [expense]);

  const handleSplitChange = (index, value) => {
    const newSplits = [...splits];
    newSplits[index].share = parseFloat(value || 0);
    setSplits(newSplits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const totalSplit = splits.reduce((sum, s) => sum + parseFloat(s.share || 0), 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      alert("Total of splits doesn't match amount.");
      return;
    }

    const updatedExpense = {
      ...expense,
      description,
      amount,
      splits: splits.map(s => ({
        member: s.memberId,
        share: parseFloat(s.share),
      })),
    };

    onSave(updatedExpense);
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Edit Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Total Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Splits</label>
            {splits.map((s, i) => (
              <div key={s.memberId} className="flex justify-between items-center mb-2">
                <span>{s.username}</span>
                <input
                  type="number"
                  className="w-24 border rounded p-1 text-sm"
                  value={s.share}
                  onChange={(e) => handleSplitChange(i, e.target.value)}
                />
              </div>
            ))}
            <p className={`text-sm mt-2 ${Math.abs(splits.reduce((sum, s) => sum + parseFloat(s.share), 0) - amount) > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
              Split Total: ₹{splits.reduce((sum, s) => sum + parseFloat(s.share || 0), 0).toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;