import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Home, Building2, BookOpen } from 'lucide-react';

export default function PostTypeModal({ onClose, onSelectType, onLoadTemplate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }} className="shadow-2xl w-full max-w-xl">
        <CardHeader style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl" style={{ color: 'white' }}>What would you like to post?</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => onSelectType('listing')}
              className="flex flex-col items-center justify-center p-8 border-2 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Home className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold group-hover:text-[var(--tiffany-blue)] mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Listing</span>
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Space I have for lease or sale</p>
            </button>
            <button
              onClick={() => onSelectType('requirement')}
              className="flex flex-col items-center justify-center p-8 border-2 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Building2 className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold group-hover:text-[var(--tiffany-blue)] mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Requirement</span>
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Space needed for a client of mine</p>
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <button
              onClick={onLoadTemplate}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed hover:border-[var(--tiffany-blue)] transition-all group"
              style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}
            >
              <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors" />
              <span className="text-sm font-medium group-hover:text-[var(--tiffany-blue)]" style={{ color: 'rgba(255,255,255,0.6)' }}>Load a Saved Template</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}