import React, { useState, useEffect } from 'react';
import api from '../api';
import { showNotification } from '../notifications';

function AddPersonalExpenseModal({ isOpen, onClose, onSuccess, expense }) {
  const [type, setType] = useState('spent');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setType(expense.type);
        setAmount(expense.amount);
        setCategory(expense.category);
        setDescription(expense.description);
        setNote(expense.note || '');
      } else {
        setType('spent');
        setAmount('');
        setCategory('other');
        setDescription('');
        setNote('');
      }
    }
  }, [isOpen, expense]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) {
      showNotification('Amount and description are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: Number(amount),
        category,
        description,
        note
      };

      if (expense) {
        const res = await api.put(`/personal-expense/${expense._id}/edit`, payload);
        if (res.data.success) {
          showNotification('Personal expense updated successfully', 'success');
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post('/personal-expense/add', payload);
        if (res.data.success) {
          showNotification('Personal expense added successfully', 'success');
          onSuccess();
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving personal expense:', error);
      showNotification('Failed to save personal expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {expense ? 'Edit' : 'Add'} Personal Expense
          </h2>
          <button 
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex space-x-4 mb-2">
            <button
              type="button"
              onClick={() => setType('spent')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                type === 'spent' 
                  ? 'bg-red-100 text-red-700 border-2 border-red-500' 
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              I Spent
            </button>
            <button
              type="button"
              onClick={() => setType('lent')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                type === 'lent' 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' 
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              I Lent
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
              placeholder="0.00"
            />
          </div>

          {type === 'spent' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="food">🍕 Food</option>
                <option value="travel">🚗 Travel</option>
                <option value="entertainment">🎬 Entertainment</option>
                <option value="utilities">💡 Utilities</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="health">🏥 Health</option>
                <option value="education">📚 Education</option>
                <option value="other">📋 Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'lent' ? 'Who did you lend to?' : 'Description'}
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={type === 'lent' ? 'e.g., John Doe' : 'e.g., Lunch at Cafe'}
              maxLength="200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
              placeholder="Any details to remember..."
              maxLength="500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer disabled:bg-blue-400 flex items-center disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddPersonalExpenseModal;
