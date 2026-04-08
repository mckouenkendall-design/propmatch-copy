import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState({});

  const fetchUserProfile = async (email) => {
    if (!email) return null;
    try {
      const profile = await supabase.from('profiles').select('*').eq('user_email', email).single();
      return profile || null;
    } catch (e) {
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
      username: profile.username || authUser.user_metadata?.username || '',
      contact_email: profile.contact_email || authUser.email,
      phone: profile.phone || authUser.user_metadata?.phone || '',
      state: profile.state || authUser.user_metadata?.state || '',
      user_type: profile.user_type || authUser.user_metadata?.user_type || '',
      brokerage_name: profile.brokerage_name || authUser.user_metadata?.brokerage_name || '',
      brokerage_address: profile.brokerage_address || authUser.user_metadata?.brokerage_address || '',
      employing_broker_id: profile.employing_broker_id || authUser.user_metadata?.employing_broker_id || '',
      license_number: profile.license_number || authUser.user_metadata?.license_number || '',
      verification_status: profile.verification_status || authUser.user_metadata?.verification_status || '',
      property_categories: profile.property_categories || authUser.user_metadata?.property_categories || [],
      transaction_types: profile.transaction_types || authUser.user_metadata?.transaction_types || [],
      bio: profile.bio || authUser.user_metadata?.bio || '',
      years_experience: profile.years_experience || authUser.user_metadata?.years_experience || '',
      specialties: profile.specialties || authUser.user_metadata?.specialties || '',
      certifications: profile.certifications || authUser.user_metadata?.certifications || '',
      languages: profile.languages || authUser.user_metadata?.languages || '',
      linkedin: profile.linkedin || authUser.user_metadata?.linkedin || '',
      website: profile.website || authUser.user_metadata?.website || '',
      instagram: profile.instagram || authUser.user_metadata?.instagram || '',
      tiktok: profile.tiktok || authUser.user_metadata?.tiktok || '',
      facebook: profile.facebook || authUser.user_metadata?.facebook || '',
      profile_photo_url: profile.profile_photo_url || authUser.user_metadata?.profile_photo_url || '',
      selected_plan: profile.selected_plan || authUser.user_metadata?.selected_plan || '',
      brokerage_id: profile.employing_broker_id || authUser.user_metadata?.brokerage_id || authUser.user_metadata?.employing_broker_id || '',
      theme: profile.theme || authUser.user_metadata?.theme || 'dark',
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

    // Use getSession() — it properly waits for Supabase v2 hash-token exchange
    // unlike getUser() which can race ahead before the OAuth redirect tokens are processed
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        await loadUser(session.user);
      }
      if (isMounted) setIsLoadingAuth(false);
    }).catch((error) => {
      console.error('Session check failed:', error);
      if (isMounted) setIsLoadingAuth(false);
    });

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (session?.user) {
        await loadUser(session.user);
      }
    });

    return () => {
      isMounted = false;
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