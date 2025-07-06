// components/ThemeProvider.jsx
'use client'; // This directive makes this a Client Component

import { useState, useEffect } from 'react';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light'); // Default theme

  useEffect(() => {
    // Apply theme from localStorage or system preference on initial load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Update document element class whenever theme changes
    const htmlElement = document.documentElement;
    htmlElement.classList.remove('light', 'dark');
    htmlElement.classList.add(theme);
    localStorage.setItem('theme', theme); // Persist theme preference
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Pass theme and toggle function down to children via context or direct props
  // For now, we'll just expose the toggle function globally or pass it down explicitly
  // For simplicity, we'll just manage the class on <html>.
  // The toggle function will be passed to the sidebar component later.

  return <>{children}</>;
}