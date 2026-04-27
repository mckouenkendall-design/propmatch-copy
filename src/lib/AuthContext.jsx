import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({});
  const initialLoadDone = useRef(false);

  const fetchUserProfile = async (email) => {
    if (!email) return null;
    try {
      // Now that the proxy wrapper bug is fixed, this query no longer hangs.
      // The .race timeout has been removed - if there's ever a real network
      // problem, the 15s top-level safety timeout in the main effect catches it.
      const profiles = await supabase.from('profiles').select('*').eq('user_email', email).limit(1);
      if (Array.isArray(profiles) && profiles.length > 0) return profiles[0];
      return null;
    } catch (e) {
      console.warn('fetchUserProfile error:', e);
      return null;
    }
  };

  const buildMergedUser = (authUser, profile) => {
    if (!profile) {
      return {
        ...authUser,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
        brokerage_id: authUser.user_metadata?.brokerage_id || authUser.user_metadata?.employing_broker_id || '',
      };
    }
    return {
      ...authUser,
      full_name: profile.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
      username: profile.username || '',
      contact_email: profile.contact_email || authUser.email,
      phone: profile.phone || '',
      state: profile.state || '',
      user_type: profile.user_type || '',
      brokerage_name: profile.brokerage_name || '',
      brokerage_address: profile.brokerage_address || '',
      employing_broker_id: profile.employing_broker_id || '',
      license_number: profile.license_number || '',
      verification_status: profile.verification_status || '',
      property_categories: profile.property_categories || [],
      transaction_types: profile.transaction_types || [],
      bio: profile.bio || '',
      years_experience: profile.years_experience || '',
      specialties: profile.specialties || '',
      certifications: profile.certifications || '',
      languages: profile.languages || '',
      linkedin: profile.linkedin || '',
      website: profile.website || '',
      instagram: profile.instagram || '',
      tiktok: profile.tiktok || '',
      facebook: profile.facebook || '',
      profile_photo_url: profile.profile_photo_url || '',
      logo_url: profile.logo_url || '',
      selected_plan: profile.selected_plan || '',
      brokerage_id: profile.employing_broker_id || '',
      theme: profile.theme || 'dark',
      email_notifications: profile.email_notifications ?? true,
      match_alerts: profile.match_alerts ?? true,
      group_notifications: profile.group_notifications ?? true,
      message_notifications: profile.message_notifications ?? true,
      auto_renew: profile.auto_renew ?? true,
      _profileId: profile.id,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadUser = async (authUser) => {
      const profile = await fetchUserProfile(authUser.email);
      if (!isMounted) return;
      const mergedUser = buildMergedUser(authUser, profile);
      setUser(mergedUser);
      setIsAuthenticated(true);
    };

    // Safety timeout - never show loading spinner for more than 15 seconds
    const timeout = setTimeout(() => {
      if (isMounted && isLoadingAuth) {
        console.warn('Auth loading timed out');
        setIsLoadingAuth(false);
      }
    }, 15000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      try {
        if (session?.user) {
          await loadUser(session.user);
        }
      } catch (e) {
        console.warn('loadUser failed on initial session:', e);
      }
      initialLoadDone.current = true;
      if (isMounted) setIsLoadingAuth(false);
    }).catch((error) => {
      console.error('Session check failed:', error);
      initialLoadDone.current = true;
      if (isMounted) setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Skip INITIAL_SESSION - getSession() above already handles it
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        try {
          await loadUser(session.user);
        } catch (e) {
          console.warn('loadUser failed on SIGNED_IN:', e);
        }
        if (isMounted && !initialLoadDone.current) {
          initialLoadDone.current = true;
          setIsLoadingAuth(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just update the auth user data, don't re-fetch profile
        setUser(prev => prev ? { ...prev, ...session.user } : prev);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const profile = await fetchUserProfile(authUser.email);
      const mergedUser = buildMergedUser(authUser, profile);
      setUser(mergedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await supabase.auth.signOut();
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState: refreshUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
