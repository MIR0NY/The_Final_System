// app/page.js
'use client'; // This directive makes this a Client Component

import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to show/hide loading overlay
  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  // Function to display custom alerts (for login page)
  const showCustomAlert = (text, isError = true) => {
    setLoginMessage({ text, isError });
    // Clear message after a few seconds
    setTimeout(() => setLoginMessage(null), 5000);
  };

  // Function to handle login logic
  const handleLogin = async (email, password) => {
    showLoading();
    try {
      const APP_SCRIPT_URL = process.env.NEXT_PUBLIC_APP_SCRIPT_URL;
      // const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyCMcLCbReZjcr6p6YygynFWh5GvS58-L19YPgeODnc0g5E2PAYY00_4z4lN4HDXu83Yg/exec";
      if (!APP_SCRIPT_URL) {
        throw new Error("Apps Script URL is not configured. Check your .env.local file.");
      }

      const url = new URL(APP_SCRIPT_URL);
      url.searchParams.append('action', 'login');
      url.searchParams.append('sheet', 'Users'); // Assuming 'Users' sheet for login

      console.log('Attempting to fetch from URL:', url.toString()); // <--- ADD THIS LINE
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`);
      }

      const result = await response.json();

      if (result.success && result.user) {
        setCurrentUser(result.user);
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        showCustomAlert('Login successful!', false);
      } else {
        showCustomAlert(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      showCustomAlert(`Login failed: ${error.message}`);
    } finally {
      hideLoading();
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setLoginMessage(null); // Clear any previous login messages
  };

  // Check for existing login session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {isLoading && (
        <div className="loading-overlay">
          <i className="fas fa-spinner fa-spin mr-3"></i> Loading...
        </div>
      )}

      {currentUser ? (
        <MainApp
          currentUser={currentUser}
          onLogout={handleLogout}
          showLoading={showLoading}
          hideLoading={hideLoading}
          showCustomAlert={showCustomAlert}
        />
      ) : (
        <LoginPage onLogin={handleLogin} loginMessage={loginMessage} />
      )}
    </div>
  );
}