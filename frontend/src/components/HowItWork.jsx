import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from './Header';

export default function HowItWork() {
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
    <div className="min-h-screen bg-white">
      <Header />

      <section className="text-center py-20">
        <h1 className="text-4xl font-bold">How It Works</h1>
        <p className="text-gray-500 mt-3">
          OweGo makes splitting expenses effortless
        </p>
      </section>

      <section className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 px-4 pb-16">
        <div className="bg-blue-50 p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-blue-600">1. Describe</h2>
          <p className="text-sm mt-2 text-gray-700">
            Type what happened: "Riya paid ₹900, others didn’t".
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-green-600">2. Analyze</h2>
          <p className="text-sm mt-2 text-gray-700">
            Our AI calculates balances instantly behind the scenes.
          </p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-yellow-600">3. Settle</h2>
          <p className="text-sm mt-2 text-gray-700">
            Get a clear list of who owes whom and how much.
          </p>
        </div>
      </section>
    </div>
  );
}
