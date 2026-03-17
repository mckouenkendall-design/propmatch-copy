import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bookmark } from 'lucide-react';
import SaveTemplateModal from '@/components/templates/SaveTemplateModal';

const AMENITIES = [
  'Elevator', 'ADA Compliant', 'High Speed Internet', 'Generator', 'Rooftop Access',
  'Security System', '24/7 Access', 'Loading Dock', 'HVAC', 'Kitchenette',
  'Gym / Fitness', 'EV Charging', 'Fiber Optic', 'Conference Rooms', 'Storage'
];

export default function ListStep3({ data, update, onNext }) {
  const [showSave, setShowSave] = useState(false);

  const toggle = (a) => {
    const cur = data.amenities || [];
    update({ amenities: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Listing Title <span className="text-gray-400 text-xs font-normal">(optional — auto-generated if blank)</span></Label>
        <Input value={data.title} onChange={e => update({ title: e.target.value })} placeholder="e.g. Modern Class A Office – 5,000 SF in Ferndale" />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={data.description} onChange={e => update({ description: e.target.value })}
          placeholder="Describe the property, its highlights, lease terms, and anything a potential match should know..." rows={5} />
      </div>

      <div className="space-y-2">
        <Label>Amenities / Features</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => {
            const sel = (data.amenities || []).includes(a);
            return (
              <button key={a} type="button" onClick={() => toggle(a)}
                className="px-3 py-1.5 rounded-full text-sm border-2 transition-all"
                style={{ borderColor: sel ? 'var(--tiffany-blue)' : '#e5e7eb', backgroundColor: sel ? '#e6f7f5' : 'white', color: sel ? '#3A8A82' : '#6b7280' }}>
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setShowSave(true)} className="gap-2 text-gray-600">
          <Bookmark className="w-4 h-4" /> Save as Template
        </Button>
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Next <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {showSave && (
        <SaveTemplateModal formData={data} templateType="listing" onClose={() => setShowSave(false)} />
      )}
    </div>
  );
}