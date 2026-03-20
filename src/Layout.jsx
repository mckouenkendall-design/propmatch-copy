import React from 'react';
import TopNav from './components/navigation/TopNav';

export default function Layout({ children, currentPageName }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0E1318' }}>
      <TopNav />
      
      <div style={{ paddingTop: '64px' }}>
        {children}
      </div>
    </div>
  );
}