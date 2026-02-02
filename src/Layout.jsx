import React from 'react';
import TopNav from './components/navigation/TopNav';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --tiffany-blue: #4FB3A9;
          --tiffany-blue-dark: #3A8A82;
          --tiffany-blue-light: #6FC9C0;
        }
      `}</style>
      
      <TopNav />
      
      <div className="pt-[57px]">
        {children}
      </div>
    </div>
  );
}