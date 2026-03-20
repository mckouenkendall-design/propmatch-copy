import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Building, Home, ArrowLeft } from 'lucide-react';

export default function PropertyCategoryModal({ onClose, onSelectCategory, onBack, postType }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card style={{ background: '#1a1f25', border: '1px solid rgba(255,255,255,0.1)' }} className="shadow-2xl w-full max-w-xl">
        <CardHeader style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
              </Button>
              <CardTitle className="text-2xl" style={{ color: 'white' }}>Select Property Type</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => onSelectCategory('commercial')}
              className="flex flex-col items-center justify-center p-8 border-2 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Building className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold group-hover:text-[var(--tiffany-blue)] mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Commercial</span>
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Office, retail, industrial...</p>
            </button>
            <button
              onClick={() => onSelectCategory('residential')}
              className="flex flex-col items-center justify-center p-8 border-2 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Home className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold group-hover:text-[var(--tiffany-blue)] mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Residential</span>
              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>Home, apartment, condo...</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}