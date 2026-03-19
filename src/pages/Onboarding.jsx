import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const ACCENT = '#00DBC5';
const STEP_COUNT = 3;

const CITIES = [
  'Detroit', 'Ann Arbor', 'Grand Rapids', 'Lansing', 'Troy', 'Novi', 'Birmingham',
  'Royal Oak', 'Dearborn', 'Livonia', 'Farmington Hills', 'Southfield', 'Sterling Heights',
  'Warren', 'Pontiac', 'Flint', 'Kalamazoo', 'Traverse City', 'Saginaw', 'Bay City',
];

function Logo() {
  return (
    <Link to="/Landing" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="200" height="40">
        <g transform="translate(20,20)">
          <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
            fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </g>
        <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
          <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
        </text>
      </svg>
    </Link>
  );
}

function StepIndicator({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <React.Fragment key={i}>
          <div style={{
            width: i < step ? '28px' : '8px',
            height: '4px',
            borderRadius: '4px',
            background: i < step ? ACCENT : i === step - 1 ? ACCENT : 'rgba(255,255,255,0.15)',
            transition: 'all 0.35s ease',
          }} />
        </React.Fragment>
      ))}
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
        Step {step} of {STEP_COUNT}
      </span>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
        {hint && <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '6px', fontSize: '11px' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '12px 16px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  color: '#FFFFFF',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, borderColor: focused ? ACCENT : 'rgba(255,255,255,0.1)' }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{ ...inputStyle, borderColor: focused ? ACCENT : 'rgba(255,255,255,0.1)', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
    >
      <option value="" disabled style={{ background: '#0E1318' }}>{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value} style={{ background: '#0E1318' }}>{o.label}</option>)}
    </select>
  );
}

function CityChip({ city, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(city)}
      style={{
        background: selected ? 'rgba(0,219,197,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? 'rgba(0,219,197,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '6px',
        padding: '7px 14px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        color: selected ? ACCENT : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {city}
    </button>
  );
}

function ToggleChip({ label, selected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: selected ? 'rgba(0,219,197,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${selected ? 'rgba(0,219,197,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px',
        padding: '10px 20px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        color: selected ? ACCENT : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

const LAUNCH_CARDS = [
  { key: 'listing', icon: '🏢', title: 'Post a Listing', desc: 'I have a property ready to get matched with qualified buyers or tenants.' },
  { key: 'requirement', icon: '🔍', title: 'Post a Requirement', desc: 'I have a client looking for something specific — find me the matches.' },
  { key: 'explore', icon: '🧭', title: 'Just Explore', desc: "Show me around. I'll post when I'm ready." },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1
    full_name: '',
    phone: '',
    license_number: '',
    role: '',
    brokerage_name: '',
    broker_id: '',
    // Step 2
    property_focus: [],
    markets: [],
    transaction_types: [],
    // Step 3
    launch_action: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const toggleArr = (key, val) => setForm(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
  }));

  const canNext1 = form.full_name && form.license_number && form.role && form.brokerage_name && form.broker_id;
  const canNext2 = form.property_focus.length > 0 && form.markets.length > 0 && form.transaction_types.length > 0;

  const handleFinish = async () => {
    try {
      await base44.auth.updateMe({
        onboarding_complete: true,
        phone: form.phone,
        license_number: form.license_number,
        agent_role: form.role,
        brokerage_name: form.brokerage_name,
        broker_id: form.broker_id,
        property_focus: form.property_focus.join(','),
        markets: form.markets.join(','),
        transaction_types: form.transaction_types.join(','),
      });
    } catch (e) {
      // continue regardless
    }
    if (form.launch_action === 'listing') navigate('/Listings');
    else if (form.launch_action === 'requirement') navigate('/Requirements');
    else navigate('/Dashboard');
  };

  const sectionStyle = {
    minHeight: '100vh',
    background: '#080C10',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
  };

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '560px',
    width: '100%',
  };

  return (
    <div style={sectionStyle}>
      {/* Top bar */}
      <div style={{ padding: '28px 48px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
          Licensed professionals only
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={cardStyle}>
          <StepIndicator step={step} />

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '32px', color: '#FFFFFF', margin: '0 0 8px' }}>
                Let's get you set up.
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 32px', lineHeight: 1.6 }}>
                PropMatch is exclusively for licensed real estate professionals. Your license will be verified against your broker.
              </p>

              <Field label="Full Name">
                <TextInput value={form.full_name} onChange={v => set('full_name', v)} placeholder="Jane Smith" />
              </Field>
              <Field label="Phone" hint="(optional)">
                <TextInput value={form.phone} onChange={v => set('phone', v)} placeholder="(248) 555-0100" type="tel" />
              </Field>
              <Field label="License Number" hint="Required for verification">
                <TextInput value={form.license_number} onChange={v => set('license_number', v)} placeholder="MI-6012345" />
              </Field>
              <Field label="Your Role">
                <SelectInput
                  value={form.role}
                  onChange={v => set('role', v)}
                  placeholder="Select your role"
                  options={[
                    { value: 'agent', label: 'Agent' },
                    { value: 'broker', label: 'Broker / Brokerage Owner' },
                    { value: 'team_lead', label: 'Team Lead' },
                  ]}
                />
              </Field>
              <Field label="Brokerage Name">
                <TextInput value={form.brokerage_name} onChange={v => set('brokerage_name', v)} placeholder="Keller Williams, RE/MAX, your own brokerage…" />
              </Field>
              <Field label="Broker ID / Brokerage ID" hint="Agents enter their broker's ID — owners enter their own">
                <TextInput value={form.broker_id} onChange={v => set('broker_id', v)} placeholder="e.g. BRK-00421" />
              </Field>

              <button
                onClick={() => canNext1 && setStep(2)}
                disabled={!canNext1}
                style={{
                  width: '100%', padding: '14px', marginTop: '8px',
                  background: canNext1 ? ACCENT : 'rgba(255,255,255,0.06)',
                  color: canNext1 ? '#080C10' : 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '8px', cursor: canNext1 ? 'pointer' : 'not-allowed',
                  fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '32px', color: '#FFFFFF', margin: '0 0 8px' }}>
                What's your focus?
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 32px', lineHeight: 1.6 }}>
                This personalizes your dashboard and helps us show you the most relevant matches.
              </p>

              <Field label="Property Category">
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['Commercial', 'Residential', 'Both'].map(v => (
                    <ToggleChip key={v} label={v} selected={form.property_focus.includes(v)} onToggle={() => toggleArr('property_focus', v)} />
                  ))}
                </div>
              </Field>

              <Field label="Markets You Work In" hint="Select all that apply">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {CITIES.map(city => (
                    <CityChip key={city} city={city} selected={form.markets.includes(city)} onToggle={c => toggleArr('markets', c)} />
                  ))}
                </div>
              </Field>

              <Field label="Transaction Types">
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {['Sales', 'Leasing', 'Rentals'].map(v => (
                    <ToggleChip key={v} label={v} selected={form.transaction_types.includes(v)} onToggle={() => toggleArr('transaction_types', v)} />
                  ))}
                </div>
              </Field>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ padding: '14px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '14px', cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => canNext2 && setStep(3)}
                  disabled={!canNext2}
                  style={{
                    flex: 1, padding: '14px',
                    background: canNext2 ? ACCENT : 'rgba(255,255,255,0.06)',
                    color: canNext2 ? '#080C10' : 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: '8px', cursor: canNext2 ? 'pointer' : 'not-allowed',
                    fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: '32px', color: '#FFFFFF', margin: '0 0 8px' }}>
                How do you want to start?
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 32px', lineHeight: 1.6 }}>
                Pick where you'd like to land. You can always do everything else from the dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {LAUNCH_CARDS.map(card => (
                  <button
                    key={card.key}
                    onClick={() => set('launch_action', card.key)}
                    style={{
                      textAlign: 'left',
                      background: form.launch_action === card.key ? 'rgba(0,219,197,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${form.launch_action === card.key ? 'rgba(0,219,197,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '12px',
                      padding: '20px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                    }}
                  >
                    <span style={{ fontSize: '24px', lineHeight: 1 }}>{card.icon}</span>
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: '15px', color: form.launch_action === card.key ? ACCENT : '#FFFFFF', margin: '0 0 4px' }}>{card.title}</p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ padding: '14px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '14px', cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => form.launch_action && handleFinish()}
                  disabled={!form.launch_action}
                  style={{
                    flex: 1, padding: '14px',
                    background: form.launch_action ? ACCENT : 'rgba(255,255,255,0.06)',
                    color: form.launch_action ? '#080C10' : 'rgba(255,255,255,0.2)',
                    border: 'none', borderRadius: '8px', cursor: form.launch_action ? 'pointer' : 'not-allowed',
                    fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Enter PropMatch →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        input::placeholder, select option[disabled] { color: rgba(255,255,255,0.2) !important; }
        input:focus, select:focus { outline: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}