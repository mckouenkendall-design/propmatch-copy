import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Home, Building2, BookOpen } from 'lucide-react';

export default function PostTypeModal({ onClose, onSelectType, onLoadTemplate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white border-0 shadow-2xl w-full max-w-xl">
        <CardHeader className="border-b" style={{ background: 'linear-gradient(135deg, #f0fdfc 0%, #ffffff 100%)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">What would you like to post?</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => onSelectType('listing')}
              className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfc 100%)' }}
            >
              <Home className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)] mb-2">Listing</span>
              <p className="text-xs text-gray-500 text-center">Space I have for lease or sale</p>
            </button>
            <button
              onClick={() => onSelectType('requirement')}
              className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-[var(--tiffany-blue)] hover:shadow-lg transition-all group"
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfc 100%)' }}
            >
              <Building2 className="w-14 h-14 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-4" />
              <span className="text-xl font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)] mb-2">Requirement</span>
              <p className="text-xs text-gray-500 text-center">Space needed for a client of mine</p>
            </button>
          </div>

          <div className="border-t pt-5">
            <button
              onClick={onLoadTemplate}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-[var(--tiffany-blue)] hover:bg-[#f0fdfc] transition-all group"
            >
              <BookOpen className="w-5 h-5 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors" />
              <span className="text-sm font-medium text-gray-500 group-hover:text-[var(--tiffany-blue)]">Load a Saved Template</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}