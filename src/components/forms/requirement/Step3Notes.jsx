import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bookmark } from 'lucide-react';
import SaveTemplateModal from '@/components/templates/SaveTemplateModal';

const AMENITIES = [
  'Elevator', 'ADA Compliant', 'High Speed Internet', 'Generator', 'Storage',
  'Rooftop Access', 'Security System', '24/7 Access', 'Loading Dock', 'HVAC',
  'Kitchenette', 'Gym', 'Parking', 'EV Charging', 'Fiber Optic'
];

export default function ReqStep3({ data, update, onNext }) {
  const [showSave, setShowSave] = useState(false);

  const toggle = (a) => {
    const cur = data.required_amenities || [];
    update({ required_amenities: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Must-Have Amenities</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => {
            const sel = (data.required_amenities || []).includes(a);
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

      <div className="space-y-1.5">
        <Label>Additional Notes</Label>
        <Textarea value={data.notes} onChange={e => update({ notes: e.target.value })}
          placeholder="Any deal-breakers, special requirements, or context about the client..." rows={4} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setShowSave(true)} className="gap-2 text-gray-600">
          <Bookmark className="w-4 h-4" /> Save as Template
        </Button>
        <Button onClick={onNext} className="text-white gap-2" style={{ backgroundColor: 'var(--tiffany-blue)' }}>
          Review <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {showSave && (
        <SaveTemplateModal formData={data} templateType="requirement" onClose={() => setShowSave(false)} />
      )}
    </div>
  );
}