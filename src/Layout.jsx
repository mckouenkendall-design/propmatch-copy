import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, Building2, Search, Sparkles } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Dashboard', path: 'Dashboard', icon: Home },
    { name: 'Listings', path: 'Listings', icon: Building2 },
    { name: 'Requirements', path: 'Requirements', icon: Search },
    { name: 'Matches', path: 'Matches', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        :root {
          --tiffany-blue: #4FB3A9;
          --tiffany-blue-dark: #3A8A82;
          --tiffany-blue-light: #6FC9C0;
        }
      `}</style>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white shadow-2xl z-50">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--tiffany-blue)' }}>
            PropMatch
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real Estate Matchmaker</p>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.path;
            return (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                style={isActive ? { backgroundColor: 'var(--tiffany-blue)' } : {}}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}