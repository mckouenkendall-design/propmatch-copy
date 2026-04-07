import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeProvider';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { supabase } from '@/api/supabaseClient';
import Blog from './pages/Blog';
import Careers from './pages/Careers';
import Affiliate from './pages/Affiliate';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AboutUs from './pages/AboutUs';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import BrokerDashboard from './pages/BrokerDashboard';
import GroupDetail from './pages/GroupDetail';
import Inventory from './pages/Inventory';
import Matches from './pages/Matches';
import Teams from './pages/Teams';
import NewsWire from './pages/NewsWire';
import BlogFeed from './pages/BlogFeed';
import Insights from './pages/Insights';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const [hasProfile, setHasProfile] = React.useState(null);
  const [checkedProfile, setCheckedProfile] = React.useState(false);

  // Check if user has a profile and handle routing
  React.useEffect(() => {
    const checkProfile = async () => {
      if (!user?.email) {
        setHasProfile(null);
        setCheckedProfile(true);
        return;
      }

      try {
        const { data, error } = await supabase.from('user_profiles').select('user_email').eq('user_email', user.email).single();
        setHasProfile(!error && !!data);
      } catch (e) {
        setHasProfile(false);
      }
      setCheckedProfile(true);
    };

    checkProfile();
  }, [user?.email]);

  // Handle routing based on auth state and profile
  React.useEffect(() => {
    if (!isLoadingAuth && checkedProfile) {
      const pathname = window.location.pathname;
      // Skip routing logic for public pages
      if (['/Blog', '/Careers', '/Affiliate', '/Privacy', '/Terms', '/AboutUs'].includes(pathname)) return;

      if (!user) {
        // No user — stay on or redirect to landing
        if (pathname !== '/') window.location.href = '/';
      } else if (!hasProfile) {
        // User exists but no profile — go to onboarding
        if (pathname !== '/Onboarding') window.location.href = '/Onboarding';
      } else {
        // User exists with profile — go to dashboard if on landing
        if (pathname === '/' || pathname === '/Landing') {
          const defaultPage = user.user_type === 'principal_broker' ? '/BrokerDashboard' : '/Dashboard';
          window.location.href = defaultPage;
        }
      }
    }
  }, [isLoadingAuth, checkedProfile, user, hasProfile]);

  // Show loading spinner while checking auth or profile
  if (isLoadingPublicSettings || isLoadingAuth || !checkedProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Blog" element={<Blog />} />
      <Route path="/Careers" element={<Careers />} />
      <Route path="/Affiliate" element={<Affiliate />} />
      <Route path="/Privacy" element={<Privacy />} />
      <Route path="/Terms" element={<Terms />} />
      <Route path="/AboutUs" element={<AboutUs />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route 
        path="/Profile" 
        element={
          <LayoutWrapper currentPageName="Profile">
            <Profile />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/Settings" 
        element={
          <LayoutWrapper currentPageName="Settings">
            <Settings />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/BrokerDashboard" 
        element={
          <LayoutWrapper currentPageName="BrokerDashboard">
            <BrokerDashboard />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/Inventory" 
        element={
          <LayoutWrapper currentPageName="Inventory">
            <Inventory />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/Matches" 
        element={
          <LayoutWrapper currentPageName="Matches">
            <Matches />
          </LayoutWrapper>
        } 
      />
      <Route 
        path="/Teams" 
        element={
          <LayoutWrapper currentPageName="Teams">
            <Teams />
          </LayoutWrapper>
        } 
      />
      <Route path="/GroupDetail" element={<GroupDetail />} />
      <Route path="/NewsWire" element={<LayoutWrapper currentPageName="NewsWire"><NewsWire /></LayoutWrapper>} />
      <Route path="/BlogFeed" element={<LayoutWrapper currentPageName="BlogFeed"><BlogFeed /></LayoutWrapper>} />
      <Route path="/Insights" element={<LayoutWrapper currentPageName="Insights"><Insights /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App