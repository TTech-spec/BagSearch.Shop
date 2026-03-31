/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    // Initial check: check localStorage first, then system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        
        // Handle post-login logic (especially for OAuth)
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          const user = session.user;
          // Small delay to let login.jsx finish its tasks if this was a password login
          setTimeout(async () => {
            try {
              // Check if profile exists
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', user.id)
                .single();

              if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist, create it
                const metadata = user.user_metadata;
                const role = metadata?.role || 'buyer';
                const fullName = metadata?.full_name || metadata?.name || 'User';
                
                const { error: insertError } = await supabase.from('users').insert([{
                  user_id: user.id,
                  full_name: fullName,
                  email: user.email,
                  role: role,
                  updated_at: new Date(),
                }]);
                
                if (insertError && insertError.name !== 'AbortError') {
                  console.error('Error creating user profile after OAuth:', insertError);
                }
              } else if (profileError && profileError.name !== 'AbortError') {
                console.error('Error checking profile existence:', profileError);
              }
            } catch (err) {
              if (err.name !== 'AbortError') {
                console.error('Error in post-auth profile check:', err);
              }
            }
          }, 100);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Apply the theme on mount and whenever darkMode changes
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};
