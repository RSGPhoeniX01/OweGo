import React, { useState } from 'react';
import api from '../api';

function Feedback() {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sendPressed, setSendPressed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      setSendPressed(true);
      setError('Please enter your feedback description.');
      setMessage('');
      return;
    }

    setSendPressed(true);
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post('/feedback', {
        description,
      });

      if (res.data.success) {
        setMessage('Thanks for your feedback.');
        setDescription('');
      } else {
        setError(res.data.message || 'Failed to submit feedback.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to submit feedback.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl border border-gray-300 rounded-xl p-4 md:p-6 bg-white">
      <h2 className="text-xl md:text-2xl font-bold mb-2">Feedback</h2>
      <p className="text-sm text-gray-600 mb-4">
        We are still in development. Share your suggestions or issues to help improve OweGo.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium text-sm md:text-base">
            Description
          </label>
          <textarea
            className="w-full border rounded p-3 text-sm md:text-base"
            rows={6}
            placeholder="Write your feedback here..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSendPressed(false);
            }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`group relative overflow-hidden px-4 py-2 rounded cursor-pointer text-sm md:text-base border transition-all duration-300 disabled:opacity-60 ${
            sendPressed
              ? 'bg-sky-300 border-sky-500 shadow-[inset_0_3px_8px_rgba(3,105,161,0.35)] translate-y-[1px]'
              : 'bg-sky-200 border-sky-400 shadow-sm hover:shadow-md hover:-translate-y-[1px]'
          }`}
        >
          <span className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/65 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[340%] transition-all duration-700"></span>
          <span className="relative font-bold text-black">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </span>
        </button>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default Feedback;