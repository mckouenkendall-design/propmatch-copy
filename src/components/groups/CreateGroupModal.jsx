import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';

const FOCUS_OPTIONS = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'residential', label: 'Residential' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'general', label: 'General' },
];

export default function CreateGroupModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    focus_category: 'general',
    group_type: 'public',
    rules: '',
  });

  const update = patch => setForm(prev => ({ ...prev, ...patch }));

  const mutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const group = await base44.entities.Group.create({ ...data, member_count: 1, status: 'active' });
      // Auto-join creator as admin
      await base44.entities.GroupMember.create({
        group_id: group.id,
        user_email: user.email,
        user_name: user.full_name,
        role: 'admin',
        status: 'active',
      });
      return group;
    },
    onSuccess,
  });

  const canSubmit = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create a Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Group Name <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Detroit Commercial RE Group" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={e => update({ description: e.target.value })}
              placeholder="What is this group about? Who is it for?"
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location Focus</Label>
            <Input value={form.location} onChange={e => update({ location: e.target.value })} placeholder="e.g. Metro Detroit, Southeast Michigan" />
          </div>

          <div className="space-y-1.5">
            <Label>Property Focus</Label>
            <div className="grid grid-cols-4 gap-2">
              {FOCUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ focus_category: opt.value })}
                  className="py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: form.focus_category === opt.value ? 'var(--tiffany-blue)' : '#e5e7eb',
                    backgroundColor: form.focus_category === opt.value ? '#e6f7f5' : 'white',
                    color: form.focus_category === opt.value ? '#3A8A82' : '#6b7280',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Group Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can join' },
                { value: 'private', label: 'Private', desc: 'Requires approval' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ group_type: opt.value })}
                  className="p-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: form.group_type === opt.value ? 'var(--tiffany-blue)' : '#e5e7eb',
                    backgroundColor: form.group_type === opt.value ? '#e6f7f5' : 'white',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: form.group_type === opt.value ? '#3A8A82' : '#374151' }}>{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Group Rules <span className="text-gray-400 text-xs">(optional)</span></Label>
            <textarea
              value={form.rules}
              onChange={e => update({ rules: e.target.value })}
              placeholder="Any guidelines or rules for the group..."
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate(form)}
            disabled={!canSubmit || mutation.isPending}
            className="text-white gap-2"
            style={{ backgroundColor: 'var(--tiffany-blue)' }}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Group
          </Button>
        </div>
      </div>
    </div>
  );
}