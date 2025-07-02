import React, { useEffect, useState } from 'react';
import api from '../api'

function Home() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    // fetch('http://localhost:5000/test')
    api.get('/test')
      // .then(response => response.json())
      // .then(data => setMsg(data.message))
      .then(response=>setMsg(response.data.message))
      .catch(error => console.error('Error fetching message:', error));
  }, []);
  return (
    <div>
      hello
      {msg}
    </div>
  );
}

export default Home;
