import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Home, Building2 } from 'lucide-react';

export default function PostTypeModal({ onClose, onSelectType }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white border-0 shadow-2xl w-full max-w-md">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>What would you like to post?</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onSelectType('listing')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-[var(--tiffany-blue)] hover:bg-gray-50 transition-all group"
            >
              <Home className="w-12 h-12 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-3" />
              <span className="text-lg font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)]">Listing</span>
            </button>
            <button
              onClick={() => onSelectType('requirement')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-[var(--tiffany-blue)] hover:bg-gray-50 transition-all group"
            >
              <Building2 className="w-12 h-12 text-gray-400 group-hover:text-[var(--tiffany-blue)] transition-colors mb-3" />
              <span className="text-lg font-semibold text-gray-700 group-hover:text-[var(--tiffany-blue)]">Requirement</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}