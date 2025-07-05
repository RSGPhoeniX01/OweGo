import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please log in to access the dashboard.');
      navigate('/login');
      return;
    }

    // Verify token
    api.get('/user/profile')
      .catch(() => {
        localStorage.removeItem('token');
        alert('Session expired. Please log in again.');
        navigate('/login');
      });
  }, [navigate]);

  return (
    <div>
      Dashboard
    </div>
  );
}

export default Dashboard;
