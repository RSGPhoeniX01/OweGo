import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'; 
import Header from './Header';
import { showNotification } from '../notifications';
import { GoogleLogin } from '@react-oauth/google';

function SignUp() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Detect if running inside a WebView or Median/GoNative app
  const isWebView = /gonative|median|webview/i.test(navigator.userAgent);

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

  useEffect(() => {
    // Handle Google Redirect Response (Implicit Flow for WebViews)
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      if (idToken) {
        handleGoogleSuccess({ credential: idToken });
        // Clean up URL hash to prevent re-processing on refresh
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }, []);

  const handleMobileGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin + '/signup'; // Current page
    const nonce = Math.random().toString(36).substring(2);
    const scope = encodeURIComponent('openid profile email');
    
    // Construct the manual OAuth URL (Implicit Flow)
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}`;
    
    setLoading(true);
    window.location.assign(authUrl);
  };

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
      setSuccess('Google Signup successful! Redirecting...');
      showNotification('Google Signup successful', 'success');
      setForm({ username: '', email: '', password: '' });
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
    //  POST request with axios
    const res = await api.post('/user/signup', form);
    const data = res.data;

    // Check success flag in response
    if (!data.success) {
      let errorMsg = data.message || 'Signup failed';
      if (data.errors && Array.isArray(data.errors)) {
        errorMsg += ': ' + data.errors.join(', ');
      }
      throw new Error(errorMsg);
    }

   
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.data && data.data.username) {
      localStorage.setItem('username', data.data.username);
    }
    setSuccess('Signup successful! Redirecting...');
    showNotification('Signup successful', 'success');
    setForm({ username: '', email: '', password: '' });
    setTimeout(() => navigate('/dashboard'), 1200);
  } catch (err) {
    setError(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen flex flex-col">
      <Header />
    <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-purple-700 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            minLength={3}
            maxLength={30}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg cursor-pointer transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
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
          {isWebView ? (
            // Custom button for WebViews where the standard GSI button often fails to render
            <button
              onClick={handleMobileGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-white border border-gray-300 rounded-lg px-6 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <img 
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
                alt="Google" 
                className="w-5 h-5"
              />
              <span>Sign up with Google</span>
            </button>
          ) : (
            // Standard interactive button for desktop browsers
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError('Google Failed');
              }}
            />
          )}
        </div>
      <div>
        <p className="text-center text-gray-600">
          Already have an account?{' '}Log in{' '}
          <Link to="/login" className="text-purple-600 hover:underline">
             here.            
          </Link>
        </p>
      </div>
      </div>
      </main>
    </div>
  );
}

export default SignUp
