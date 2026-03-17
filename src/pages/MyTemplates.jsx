import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileText, Building2, Home, Trash2, Pencil, Check, X } from 'lucide-react';

const CAT_ICONS = { commercial: Building2, residential: Home };
const TYPE_LABELS = { listing: 'Listing', requirement: 'Requirement' };

function TemplateCard({ template, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const CatIcon = CAT_ICONS[template.property_category] || FileText;

  const save = () => {
    if (name.trim() && name.trim() !== template.name) onRename(template.id, name.trim());
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#e6f7f5' }}>
        <CatIcon className="w-6 h-6" style={{ color: 'var(--tiffany-blue)' }} />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={save}><Check className="w-4 h-4 text-green-600" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => setEditing(false)}><X className="w-4 h-4 text-gray-400" /></Button>
          </div>
        ) : (
          <p className="font-semibold text-gray-800 truncate">{template.name}</p>
        )}
        <p className="text-xs text-gray-500 capitalize mt-0.5">
          {TYPE_LABELS[template.template_type] || template.template_type}
          {template.property_category && ` · ${template.property_category}`}
          {template.property_type && ` · ${template.property_type.replace(/_/g, ' ')}`}
        </p>
      </div>

      {!editing && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MyTemplates() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.Template.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.property_category || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.property_type || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Saved form templates you can load when creating a new listing or requirement.</p>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 bg-white"
          />
        </div>

        {/* Templates */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[var(--tiffany-blue)] rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-gray-400">
            <FileText className="w-14 h-14" />
            <p className="font-medium">No templates yet</p>
            <p className="text-sm text-center">Save a template from Step 3 when creating a listing or requirement.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={(id) => deleteMutation.mutate(id)}
              onRename={(id, name) => renameMutation.mutate({ id, name })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}