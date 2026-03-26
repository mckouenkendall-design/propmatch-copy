import React from 'react';
import TopNav from './components/navigation/TopNav';

const NO_NAV_PAGES = ['Onboarding', 'Landing'];

export default function Layout({ children, currentPageName }) {
  const showNav = !NO_NAV_PAGES.includes(currentPageName);

  return (
    <div style={{ minHeight: '100vh', background: '#0E1318' }}>
      {showNav && <TopNav />}
      <div style={{ paddingTop: showNav ? '64px' : '0' }}>
        {children}
      </div>
    </div>
  );
}