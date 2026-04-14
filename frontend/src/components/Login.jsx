import React, { useState, useEffect } from 'react';
import {Link, useNavigate } from 'react-router-dom';
import api from '../api'; 
import Header from './Header';
import { showNotification } from '../notifications';
import { GoogleLogin } from '@react-oauth/google';

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
          showNotification('Session expired. Please log in again.', 'error');
          navigate('/login')
        });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.post('/user/google-auth', { token: credentialResponse.credential });
      const data = res.data;
      if (!data.success) {
        throw new Error(data.message || 'Google Auth failed');
      }
      if (data.token) localStorage.setItem('token', data.token);
      if (data.data && data.data.username) {
        localStorage.setItem('username', data.data.username);
      }
      setSuccess('Google Login successful! Redirecting...');
      showNotification('Google Login successful', 'success');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
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
      if (data.data && data.data.username) {
        localStorage.setItem('username', data.data.username);
      }

      setSuccess('Login successful! Redirecting...');
      showNotification('Login successful', 'success');
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
    <div className="min-h-screen flex flex-col">
      <Header />
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-200 px-4 py-6">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer duration-200 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <div className="text-red-600 text-center font-medium">{error}</div>}
          {success && <div className="text-green-600 text-center font-medium">{success}</div>}
        </form>
        <div className="my-5 flex items-center justify-center">
          <span className="h-px bg-gray-300 flex-1"></span>
          <span className="px-4 text-gray-500 font-medium text-sm">OR</span>
          <span className="h-px bg-gray-300 flex-1"></span>
        </div>
        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google Failed');
            }}
          />
        </div>
      <div>
        <p className="text-center text-gray-600">
          Don't have an account? Register{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            here.
          </Link>
        </p>
      </div>
      </div>
      </main>
    </div>
  );
}

export default Login;
