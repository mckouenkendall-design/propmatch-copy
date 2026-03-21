import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user, isLoadingAuth } = useAuth();
  const [theme, setTheme] = useState('dark');

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Always ensure we have a theme
    const effectiveTheme = theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the current theme
    root.classList.add(effectiveTheme);
  }, [theme]);

  // Sync theme with user preferences
  useEffect(() => {
    if (!isLoadingAuth && user) {
      // If user has a theme preference, use it
      if (user.theme) {
        setTheme(user.theme);
      } else {
        // If no theme is set, default to dark and save it
        setTheme('dark');
        base44.auth.updateMe({ theme: 'dark' }).catch(err => {
          console.error('Failed to set default theme:', err);
        });
      }
    } else if (!isLoadingAuth && !user) {
      // Not logged in - default to dark
      setTheme('dark');
    }
  }, [user, isLoadingAuth]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    
    if (user) {
      try {
        await base44.auth.updateMe({ theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};