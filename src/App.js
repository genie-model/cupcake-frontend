import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './components/HomePage';
import Auth from './components/Auth';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ctoaster_user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleAuthSuccess = useCallback((u) => {
    setUser(u);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('ctoaster_token');
    localStorage.removeItem('ctoaster_user');
    setUser(null);
  }, []);

  useEffect(() => {
    // keep user in sync with storage changes (e.g., from another tab)
    const onStorage = (e) => {
      if (e.key === 'ctoaster_user') {
        const stored = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(stored);
      }
      if (e.key === 'ctoaster_token' && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return <HomePage onLogout={handleLogout} />;
}

export default App;
