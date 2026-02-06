import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Building, Home, ArrowLeft } from 'lucide-react';

export default function PropertyCategoryModal({ onClose, onSelectCategory, onBack, postType }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white border-0 shadow-2xl w-full max-w-xl">
        <CardHeader className="border-b" style={{ background: 'linear-gradient(135deg, #f0fdfc 0%, #ffffff 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-2xl">Select Property Type</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8">
          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => onSelectCategory('commercial')}
              className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfc 100%)' }}
            >
              <Building className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)] mb-2">Commercial</span>
              <p className="text-xs text-gray-500 text-center">Office, retail, industrial...</p>
            </button>
            <button
              onClick={() => onSelectCategory('residential')}
              className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfc 100%)' }}
            >
              <Home className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)] mb-2">Residential</span>
              <p className="text-xs text-gray-500 text-center">Home, apartment, condo...</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}