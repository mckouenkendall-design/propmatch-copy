import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeProvider';
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
import ErrorBoundary from '@/components/ErrorBoundary';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth } = useAuth();
  const [hasProfile, setHasProfile] = React.useState(null);
  const [checkedProfile, setCheckedProfile] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setCheckedProfile(false);
    setHasProfile(null);

    const checkProfile = async () => {
      if (!user?.email) {
        setCheckedProfile(true);
        return;
      }

      try {
        const profiles = await supabase.from('profiles').select('user_email').eq('user_email', user.email).limit(1);
        setHasProfile(Array.isArray(profiles) && profiles.length > 0);
      } catch (e) {
        setHasProfile(false);
      }
      setCheckedProfile(true);
    };

    checkProfile();

    // Safety timeout - never stay on loading screen forever
    const timeout = setTimeout(() => {
      if (!checkedProfile) {
        setHasProfile(false);
        setCheckedProfile(true);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [user?.email, location.pathname]);

  if (isLoadingAuth || !checkedProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0E1318' }}>
        <div className="w-8 h-8 border-4 border-slate-600 border-t-[#00DBC5] rounded-full animate-spin"></div>
      </div>
    );
  }

  const pathname = location.pathname;
  const publicPages = ['/Blog', '/Careers', '/Affiliate', '/Privacy', '/Terms', '/AboutUs'];

  if (!publicPages.includes(pathname)) {
    if (!user && pathname !== '/') {
      return <Navigate to="/" replace />;
    }

    if (user && hasProfile === false && pathname !== '/Onboarding') {
      return <Navigate to="/Onboarding" replace />;
    }

    if (user && hasProfile && (pathname === '/' || pathname === '/Landing')) {
      const defaultPage = user.user_type === 'principal_broker' ? '/BrokerDashboard' : '/Dashboard';
      return <Navigate to={defaultPage} replace />;
    }
  }

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
        element={<LayoutWrapper currentPageName="Profile"><Profile /></LayoutWrapper>}
      />
      <Route
        path="/Settings"
        element={<LayoutWrapper currentPageName="Settings"><Settings /></LayoutWrapper>}
      />
      <Route
        path="/BrokerDashboard"
        element={<LayoutWrapper currentPageName="BrokerDashboard"><BrokerDashboard /></LayoutWrapper>}
      />
      <Route
        path="/Inventory"
        element={<LayoutWrapper currentPageName="Inventory"><Inventory /></LayoutWrapper>}
      />
      <Route
        path="/Matches"
        element={<LayoutWrapper currentPageName="Matches"><Matches /></LayoutWrapper>}
      />
      <Route
        path="/Teams"
        element={<LayoutWrapper currentPageName="Teams"><Teams /></LayoutWrapper>}
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
          <ErrorBoundary>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
            </Router>
          </ErrorBoundary>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
