import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ACCENT = '#00DBC5';

const STEPS = ['Your Info', 'Your Focus', 'Get Started'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '48px' }}>
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: i < current ? ACCENT : i === current ? ACCENT : 'rgba(255,255,255,0.08)',
              border: `2px solid ${i <= current ? ACCENT : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 7 5.5 10.5 12 3.5" />
                </svg>
              ) : (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: i === current ? '#111827' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
              )}
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: i === current ? ACCENT : 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: '1px', background: i < current ? ACCENT : 'rgba(255,255,255,0.1)', margin: '0 12px', marginBottom: '28px', transition: 'background 0.3s ease' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
      {children}{required && <span style={{ color: ACCENT, marginLeft: '3px' }}>*</span>}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  padding: '12px 14px',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  color: 'rgba(255,255,255,0.85)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};

function StyledInput({ value, onChange, placeholder, type = 'text', note }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, borderColor: focused ? ACCENT : 'rgba(255,255,255,0.12)' }}
      />
      {note && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: '6px 0 0' }}>{note}</p>}
    </div>
  );
}

function ToggleChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        padding: '9px 18px',
        borderRadius: '6px',
        border: `1px solid ${selected ? ACCENT : 'rgba(255,255,255,0.12)'}`,
        background: selected ? 'rgba(0,219,197,0.1)' : 'rgba(255,255,255,0.03)',
        color: selected ? ACCENT : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

const CITIES = ['Detroit', 'Ann Arbor', 'Grand Rapids', 'Lansing', 'Troy', 'Dearborn', 'Macomb', 'Oakland County', 'Wayne County', 'Other'];

function Step1({ data, setData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <FieldLabel required>First Name</FieldLabel>
          <StyledInput value={data.firstName} onChange={e => setData({ ...data, firstName: e.target.value })} placeholder="John" />
        </div>
        <div>
          <FieldLabel required>Last Name</FieldLabel>
          <StyledInput value={data.lastName} onChange={e => setData({ ...data, lastName: e.target.value })} placeholder="Smith" />
        </div>
      </div>
      <div>
        <FieldLabel required>Email</FieldLabel>
        <StyledInput value={data.email} onChange={e => setData({ ...data, email: e.target.value })} placeholder="john@smithrealty.com" type="email" />
      </div>
      <div>
        <FieldLabel>Phone</FieldLabel>
        <StyledInput value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} placeholder="(248) 555-0100" type="tel" />
      </div>
      <div>
        <FieldLabel required>Real Estate License Number</FieldLabel>
        <StyledInput value={data.licenseNumber} onChange={e => setData({ ...data, licenseNumber: e.target.value })} placeholder="MI-6012345" note="Required — PropMatch is exclusively for licensed real estate professionals." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <FieldLabel required>Brokerage Name</FieldLabel>
          <StyledInput value={data.brokerageName} onChange={e => setData({ ...data, brokerageName: e.target.value })} placeholder="Smith Realty Group" note="If you're the broker, enter your own brokerage name." />
        </div>
        <div>
          <FieldLabel required>Brokerage ID</FieldLabel>
          <StyledInput value={data.brokerageId} onChange={e => setData({ ...data, brokerageId: e.target.value })} placeholder="BRK-00123" note="Agents: enter your broker's ID. Brokers: enter your own brokerage ID." />
        </div>
      </div>
      <div>
        <FieldLabel required>Your Role</FieldLabel>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Agent', 'Broker', 'Team Lead'].map(role => (
            <ToggleChip key={role} label={role} selected={data.role === role} onClick={() => setData({ ...data, role })} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, setData }) {
  const toggleCity = (city) => {
    const cities = data.cities.includes(city)
      ? data.cities.filter(c => c !== city)
      : [...data.cities, city];
    setData({ ...data, cities });
  };

  const toggleCategory = (cat) => {
    const cats = data.propertyCategories.includes(cat)
      ? data.propertyCategories.filter(c => c !== cat)
      : [...data.propertyCategories, cat];
    setData({ ...data, propertyCategories: cats });
  };

  const toggleTx = (tx) => {
    const txs = data.transactionTypes.includes(tx)
      ? data.transactionTypes.filter(t => t !== tx)
      : [...data.transactionTypes, tx];
    setData({ ...data, transactionTypes: txs });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <FieldLabel required>Property Categories You Work In</FieldLabel>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Residential', 'Commercial', 'Industrial', 'Land'].map(cat => (
            <ToggleChip key={cat} label={cat} selected={data.propertyCategories.includes(cat)} onClick={() => toggleCategory(cat)} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel required>Transaction Types</FieldLabel>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['Sales', 'Leasing', 'Rentals'].map(tx => (
            <ToggleChip key={tx} label={tx} selected={data.transactionTypes.includes(tx)} onClick={() => toggleTx(tx)} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Markets You Primarily Serve</FieldLabel>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {CITIES.map(city => (
            <ToggleChip key={city} label={city} selected={data.cities.includes(city)} onClick={() => toggleCity(city)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ navigate }) {
  const options = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      ),
      title: 'Post a Listing',
      body: "I have a property to list and want it matched to active buyers and tenants.",
      to: '/Listings',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="11" y1="8" x2="11" y2="14" />
        </svg>
      ),
      title: 'Post a Requirement',
      body: "I have a client looking for a property and want to find matching listings.",
      to: '/Requirements',
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      title: 'Explore the Dashboard',
      body: "I want to get the lay of the land before posting anything.",
      to: '/Dashboard',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {options.map((opt, i) => (
        <Link
          key={i}
          to={opt.to}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            padding: '24px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            textDecoration: 'none',
            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = 'rgba(0,219,197,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
        >
          <div style={{ flexShrink: 0, marginTop: '2px' }}>{opt.icon}</div>
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400, fontSize: '17px', color: '#FFFFFF', margin: '0 0 6px' }}>{opt.title}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>{opt.body}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}

const STEP1_INIT = { firstName: '', lastName: '', email: '', phone: '', licenseNumber: '', brokerageName: '', brokerageId: '', role: '' };
const STEP2_INIT = { propertyCategories: [], transactionTypes: [], cities: [] };

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState(STEP1_INIT);
  const [step2, setStep2] = useState(STEP2_INIT);
  const navigate = useNavigate();

  const step1Valid = step1.firstName && step1.lastName && step1.email && step1.licenseNumber && step1.brokerageName && step1.brokerageId && step1.role;
  const step2Valid = step2.propertyCategories.length > 0 && step2.transactionTypes.length > 0;

  const canContinue = step === 0 ? step1Valid : step === 1 ? step2Valid : true;

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', flexDirection: 'column' }}>
      {/* Nav bar */}
      <div style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/Landing" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="180" height="36">
            <g transform="translate(20,20)">
              <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
                fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            </g>
            <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
              <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
            </text>
          </svg>
        </Link>
        <Link to="/Landing" style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          ← Back to site
        </Link>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '64px 24px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>
          {/* Heading */}
          <div style={{ marginBottom: '40px' }}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
              padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
              display: 'inline-block', marginBottom: '20px',
            }}>
              {step === 2 ? 'Almost There' : 'Join PropMatch'}
            </span>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(28px, 4vw, 40px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 10px' }}>
              {step === 0 && 'Tell us about yourself.'}
              {step === 1 && 'What do you focus on?'}
              {step === 2 && 'Where do you want to start?'}
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              {step === 0 && 'Your license and brokerage details are required to verify your credentials.'}
              {step === 1 && 'This helps us personalize your matches and understand who's joining the platform.'}
              {step === 2 && 'You can always do all of these — just pick where to begin.'}
            </p>
          </div>

          <StepIndicator current={step} />

          {/* Step content */}
          <div style={{ marginBottom: '32px' }}>
            {step === 0 && <Step1 data={step1} setData={setStep1} />}
            {step === 1 && <Step2 data={step2} setData={setStep2} />}
            {step === 2 && <Step3 navigate={navigate} />}
          </div>

          {/* Navigation */}
          {step < 2 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{
                    fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                  ← Back
                </button>
              ) : <div />}
              <button
                onClick={() => { if (canContinue) setStep(step + 1); }}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: canContinue ? '#111827' : 'rgba(255,255,255,0.2)',
                  background: canContinue ? ACCENT : 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: '6px',
                  padding: '12px 28px', cursor: canContinue ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                Continue →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}