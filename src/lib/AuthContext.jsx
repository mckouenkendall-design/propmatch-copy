import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await checkUserAuth(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (email) => {
    if (!email) return null;
    try {
      const { data, error } = await supabase.from('UserProfile').select('*').eq('user_email', email).single();
      if (error) {
        console.error('UserProfile fetch error:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.error('UserProfile fetch error:', e);
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

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      // Assume appPublicSettings not needed for Supabase
      setAppPublicSettings({});
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({ type: 'unknown', message: error.message || 'Failed to load app' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async (authUser) => {
    try {
      setIsLoadingAuth(true);
      if (!authUser) {
        const { data: { user } } = await supabase.auth.getUser();
        authUser = user;
      }
      if (!authUser) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }
      const profile = await fetchUserProfile(authUser.email);
      const mergedUser = buildMergedUser(authUser, profile);
      setUser(mergedUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      const pathname = window.location.pathname;
      const isOnRootOrLanding = pathname === '/';

      if (isOnRootOrLanding && authUser) {
        const needsOnboarding = !authUser.user_metadata?.user_type && !(profile?.user_type);
        if (needsOnboarding) {
          // New user — show them the landing page first, CTA will take them to Onboarding
          window.location.href = '/Landing';
        } else {
          const userType = profile?.user_type || authUser.user_metadata?.user_type;
          const defaultPage = userType === 'principal_broker' ? '/BrokerDashboard' : '/Dashboard';
          window.location.href = defaultPage;
        }
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const profile = await fetchUserProfile(authUser?.email);
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
      window.location.href = '/Landing';
    }
  };

  const navigateToLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
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