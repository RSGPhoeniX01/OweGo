import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Header from './Header';

export default function Features() {
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

      
      <section className="pt-20 pb-10 text-center">
        <h1 className="text-4xl font-bold">Features</h1>
        <p className="text-gray-500 mt-3">
          Why OweGo is better than traditional bill splitting
        </p>
      </section>

      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Natural Language AI</h2>
          <p className="text-sm text-gray-600">
            Just type "Lakshya paid ₹1000, Amit paid ₹200" and we will figure out who owes whom.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Clean UI</h2>
          <p className="text-sm text-gray-600">
            Minimal design with maximum clarity — see your balances in one glance.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Instant Calculation</h2>
          <p className="text-sm text-gray-600">
            No waiting. As soon as you type your message, the split is done.
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Privacy First</h2>
          <p className="text-sm text-gray-600">
            Your data is not saved unless you want to. No accounts needed to try.
          </p>
        </div>
      </section>
    </div>
  );
}

