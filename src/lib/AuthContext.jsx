import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

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
  }, []);

  const fetchUserProfile = async (email) => {
    if (!email) return null;
    try {
      const results = await base44.entities.UserProfile.list();
      if (!results || results.length === 0) return null;
      const match = results.find(r => r.user_email === email);
      return match || null;
    } catch (e) {
      console.error('UserProfile fetch error:', e);
      return null;
    }
  };

  const buildMergedUser = (authUser, profile) => {
    if (!profile) {
      return {
        ...authUser,
        full_name: authUser.full_name || authUser.name || '',
        brokerage_id: authUser.brokerage_id || authUser.employing_broker_id || '',
      };
    }
    return {
      ...authUser,
      full_name: profile.full_name || authUser.full_name || authUser.name || '',
      username: profile.username || authUser.username || '',
      contact_email: profile.contact_email || authUser.contact_email || authUser.email || '',
      phone: profile.phone || authUser.phone || '',
      state: profile.state || authUser.state || '',
      user_type: profile.user_type || authUser.user_type || '',
      brokerage_name: profile.brokerage_name || authUser.brokerage_name || '',
      brokerage_address: profile.brokerage_address || authUser.brokerage_address || '',
      employing_broker_id: profile.employing_broker_id || authUser.employing_broker_id || '',
      license_number: profile.license_number || authUser.license_number || '',
      verification_status: profile.verification_status || authUser.verification_status || '',
      property_categories: profile.property_categories || authUser.property_categories || [],
      transaction_types: profile.transaction_types || authUser.transaction_types || [],
      bio: profile.bio || authUser.bio || '',
      years_experience: profile.years_experience || authUser.years_experience || '',
      specialties: profile.specialties || authUser.specialties || '',
      certifications: profile.certifications || authUser.certifications || '',
      languages: profile.languages || authUser.languages || '',
      linkedin: profile.linkedin || authUser.linkedin || '',
      website: profile.website || authUser.website || '',
      instagram: profile.instagram || authUser.instagram || '',
      tiktok: profile.tiktok || authUser.tiktok || '',
      facebook: profile.facebook || authUser.facebook || '',
      profile_photo_url: profile.profile_photo_url || authUser.profile_photo_url || '',
      selected_plan: profile.selected_plan || authUser.selected_plan || '',
      brokerage_id: profile.employing_broker_id || authUser.brokerage_id || authUser.employing_broker_id || '',
      _profileId: profile.id,
    };
  };

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
          } else if (reason === 'user_not_registered') {
            setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
        } else {
          setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const authUser = await base44.auth.me();
      const profile = await fetchUserProfile(authUser?.email);
      const mergedUser = buildMergedUser(authUser, profile);
      setUser(mergedUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);

      const pathname = window.location.pathname;

      // Pages that should never trigger auto-routing
      const noRedirectPages = ['/Onboarding', '/Terms', '/Privacy', '/AboutUs', '/Blog', '/Careers', '/Affiliate'];
      const isNoRedirect = noRedirectPages.some(p => pathname.startsWith(p));

      if (!isNoRedirect && authUser) {
        const needsOnboarding = !authUser.user_type && !(profile?.user_type);

        if (needsOnboarding) {
          // Brand new user — always send to Onboarding regardless of how they signed in
          window.location.href = '/Onboarding';
        } else {
          // Existing user on root or Landing — send to their dashboard
          const onLandingOrRoot = pathname === '/' || pathname.startsWith('/Landing');
          if (onLandingOrRoot) {
            const userType = profile?.user_type || authUser.user_type;
            const defaultPage = userType === 'principal_broker' ? '/BrokerDashboard' : '/Dashboard';
            window.location.href = defaultPage;
          }
          // Already on an app page — don't redirect, let them stay
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
      const authUser = await base44.auth.me();
      const profile = await fetchUserProfile(authUser?.email);
      const mergedUser = buildMergedUser(authUser, profile);
      setUser(mergedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
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