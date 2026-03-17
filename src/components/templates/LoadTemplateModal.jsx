import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, FileText, Building2, Home } from 'lucide-react';

const TYPE_LABELS = {
  listing: 'Listing',
  requirement: 'Requirement',
};

const CAT_ICONS = {
  commercial: Building2,
  residential: Home,
};

export default function LoadTemplateModal({ onClose, onLoad }) {
  const [search, setSearch] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 100),
  });

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.property_type || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.property_category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleLoad = (template) => {
    const data = JSON.parse(template.data);
    onLoad({ data, templateType: template.template_type, category: template.property_category });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">Load a Template</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {isLoading && (
            <p className="text-center text-gray-400 py-8 text-sm">Loading templates...</p>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-2 text-gray-400">
              <FileText className="w-10 h-10" />
              <p className="text-sm">No templates found</p>
            </div>
          )}
          {filtered.map(t => {
            const CatIcon = CAT_ICONS[t.property_category] || FileText;
            return (
              <button
                key={t.id}
                onClick={() => handleLoad(t)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-[var(--tiffany-blue)] hover:bg-[#f0fdfc] transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f7f5' }}>
                  <CatIcon className="w-5 h-5" style={{ color: 'var(--tiffany-blue)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {TYPE_LABELS[t.template_type] || t.template_type}
                    {t.property_category && ` · ${t.property_category}`}
                    {t.property_type && ` · ${t.property_type.replace(/_/g, ' ')}`}
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 group-hover:opacity-100 opacity-0 transition-opacity text-white" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
                  Load
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}