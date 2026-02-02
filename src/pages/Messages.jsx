import React from 'react';
import TopNav from '@/components/navigation/TopNav';

export default function Messages() {
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
      
      <div className="pt-[57px] p-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-2">Your conversations will appear here</p>
      </div>
    </div>
  );
}