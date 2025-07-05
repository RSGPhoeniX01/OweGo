import React, { useEffect, useState } from 'react';
import api from '../api'
import Header from './Header';
import { useNavigate } from 'react-router-dom';
function Home() {
  const [msg, setMsg] = useState('');
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
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <section className="pt-20 pb-16 text-center max-w-5xl mx-auto px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Welcome to <span className="text-orange-600">OweGo</span>
        </h1>
        <p className="text-lg text-gray-600">
          Simplifying shared expenses for you and your friends.
        </p>
      </section>
      <section className="bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg text-indigo-600">Smart Splits</h3>
            <p className="text-sm mt-2 text-gray-600">
              OweGo split bills based on how much each person paid.
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg text-indigo-600">Debt Summary</h3>
            <p className="text-sm mt-2 text-gray-600">
              See who owes whom in a simplified dashboard.
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <h3 className="font-semibold text-lg text-indigo-600">No Math Required</h3>
            <p className="text-sm mt-2 text-gray-600">
              Just describe the scenario in words, we will do the rest.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
