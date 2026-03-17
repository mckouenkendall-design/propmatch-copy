import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, BookmarkCheck } from 'lucide-react';

export default function SaveTemplateModal({ formData, templateType, onClose }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Template.create({
      name: name.trim(),
      template_type: templateType,
      property_category: formData.property_category || null,
      property_type: formData.property_type || null,
      data: JSON.stringify(formData),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Save as Template</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <BookmarkCheck className="w-12 h-12" style={{ color: 'var(--tiffany-blue)' }} />
            <p className="text-gray-700 font-medium">Template saved!</p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label>Template Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Main Street Office Building"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                disabled={!name.trim() || saving}
                onClick={handleSave}
                className="text-white"
                style={{ backgroundColor: 'var(--tiffany-blue)' }}
              >
                {saving ? 'Saving...' : 'Save Template'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}