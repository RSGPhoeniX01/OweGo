import React, { useEffect, useState } from 'react';
import api from '../api'
import Header from './Header';
import { useLocation, useNavigate } from 'react-router-dom';
function Home() {
  const [msg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // Auto-redirect if logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/user/profile')
        .then(() => navigate('/dashboard'))
        .catch(() => {
          localStorage.removeItem('token');
          alert('Session expired. Please log in again.');
          navigate('/login')
        });
    }
  }, [navigate]);

  useEffect(() => {
    if (!location.hash) return;

    const sectionId = location.hash.replace('#', '');
    const section = document.getElementById(sectionId);
    if (section) {
      setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header />
      <section id="home" className="scroll-mt-24 min-h-screen flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Welcome to <span className="text-orange-600">OweGo</span>
        </h1>
        <p className="text-lg text-gray-600">
          Simplifying shared expenses for you and your friends.
        </p>
      </section>

      <section id="features" className="scroll-mt-24 min-h-screen flex flex-col justify-center bg-gray-50 py-12">
        <div className="text-center mb-10 px-4">
          <h2 className="text-3xl font-bold">Features</h2>
          <p className="text-gray-500 mt-3">Why OweGo is better than traditional bill splitting</p>
        </div>
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

      <section id="how-it-works" className="scroll-mt-24 min-h-screen flex flex-col justify-center py-16 bg-white">
        <div className="text-center mb-10 px-4">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-gray-500 mt-3">OweGo makes splitting expenses effortless</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 px-4 pb-4">
          <div className="bg-blue-50 p-6 rounded-lg shadow text-center">
            <h3 className="text-xl font-bold text-blue-600">1. Describe</h3>
            <p className="text-sm mt-2 text-gray-700">
              Type what happened: "Riya paid 900, others did not".
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow text-center">
            <h3 className="text-xl font-bold text-green-600">2. Analyze</h3>
            <p className="text-sm mt-2 text-gray-700">
              OweGo calculates balances instantly behind the scenes.
            </p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow text-center">
            <h3 className="text-xl font-bold text-yellow-600">3. Settle</h3>
            <p className="text-sm mt-2 text-gray-700">
              Get a clear list of who owes whom and how much.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
