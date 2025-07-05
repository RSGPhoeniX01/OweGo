import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 

function Login() {
  const [form, setForm] = useState({ usernameOrEmail: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Auto-redirect if logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile')
        .then(() => navigate('/dashboard'))
        .catch(() => {
          localStorage.removeItem('token');
          alert('Session expired. Please log in again.');
          setTimeout(() => navigate('/login'), 1000);
        });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      
      const res = await api.post('/user/login', form);
      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      setSuccess('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="usernameOrEmail"
            placeholder="Username or Email"
            value={form.usernameOrEmail}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <div className="text-red-600 text-center font-medium">{error}</div>}
          {success && <div className="text-green-600 text-center font-medium">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default Login;
