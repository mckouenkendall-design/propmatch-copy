import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/api/supabaseClient';

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
    const syncTheme = async () => {
      if (!user) return;
      if (user.theme) {
        setTheme(user.theme);
      } else {
        setTheme('dark');
        if (user._profileId) {
          try {
            await supabase.from('user_profiles').update({ theme: 'dark' }).eq('id', user._profileId);
          } catch (error) {
            console.error('Failed to save default theme:', error);
          }
        }
      }
    };

    if (!isLoadingAuth && user) {
      syncTheme();
    } else if (!isLoadingAuth && !user) {
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
    
    if (user && user._profileId) {
      try {
        await supabase.from('user_profiles').update({ theme: newTheme }).eq('id', user._profileId);
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