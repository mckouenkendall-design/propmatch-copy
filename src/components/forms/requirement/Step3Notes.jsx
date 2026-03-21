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
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Must-Have Amenities</Label>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map(a => {
            const sel = (data.required_amenities || []).includes(a);
            return (
              <button key={a} type="button" onClick={() => toggle(a)}
                className="px-3 py-1.5 rounded-full text-sm border-2 transition-all"
                style={{ borderColor: sel ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.2)', backgroundColor: sel ? 'rgba(0,219,197,0.15)' : 'rgba(255,255,255,0.05)', color: sel ? 'var(--tiffany-blue)' : 'rgba(255,255,255,0.7)' }}>
                {a}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label style={{ color: 'rgba(255,255,255,0.9)' }}>Additional Notes</Label>
        <Textarea value={data.notes} onChange={e => update({ notes: e.target.value })}
          placeholder="Any deal-breakers, special requirements, or context about the client..." rows={4} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setShowSave(true)} className="gap-2">
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