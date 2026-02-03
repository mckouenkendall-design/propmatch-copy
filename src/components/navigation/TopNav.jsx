import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TopNav() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Home', path: 'Dashboard' },
    { name: 'Dealboard', path: 'Dealboard' },
    { name: 'My Posts', path: 'MyPosts' },
    { name: 'Messages', path: 'Messages' }
  ];

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu - Left */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          {/* Logo/Title - Center */}
          <Link to={createPageUrl('Dashboard')} className="absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-xl font-bold" style={{ color: 'var(--tiffany-blue)' }}>
              PropMatch
            </h1>
          </Link>

          {/* Empty space for balance */}
          <div className="w-10"></div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--tiffany-blue)' }}>
              PropMatch
            </h2>
            <p className="text-xs text-gray-500 mt-1">Real Estate Matchmaker</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={createPageUrl(item.path)}
              onClick={() => setSidebarOpen(false)}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:text-white transition-all duration-200"
              style={{
                '--hover-glow': 'var(--tiffany-blue-light)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--tiffany-blue)';
                e.currentTarget.style.boxShadow = '0 0 15px var(--tiffany-blue-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}