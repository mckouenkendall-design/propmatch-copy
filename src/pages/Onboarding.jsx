import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PostOnboarding from '@/components/onboarding/PostOnboarding';
import PaymentScreen from '@/components/onboarding/PaymentScreen';

const ACCENT = '#00DBC5';
// ─── State license format rules ───────────────────────────────────────────────
const STATE_RULES = {
  Michigan:       { pattern: /^\d{10}$/, hint: '10 digits' },
  Florida:        { pattern: /^[A-Za-z]{2}\d{5,6}$/, hint: '2 letters + 5–6 digits (e.g. BK12345)' },
  California:     { pattern: /^([A-Za-z]\d{7}|\d{8})$/, hint: '8 digits or 1 letter + 7 digits' },
  Texas:          { pattern: /^\d{6,9}$/, hint: '6–9 digits' },
  'New York':     { pattern: /^\d{10}$/, hint: '10 digits' },
  Illinois:       { pattern: /^[A-Za-z]{2,3}\d{5,7}$/, hint: '2–3 letters + digits, 8–10 chars total' },
  Ohio:           { pattern: /^\d{6}$/, hint: '6 digits' },
  Georgia:        { pattern: /^\d{6}$/, hint: '6 digits' },
  'North Carolina': { pattern: /^\d{6}$/, hint: '6 digits' },
  Pennsylvania:   { pattern: /^[A-Za-z]{2}\d{6}$/, hint: '2 letters + 6 digits' },
  Arizona:        { pattern: /^\d{6}$/, hint: '6 digits' },
  Colorado:       { pattern: /^\d{6}$/, hint: '6 digits' },
  Washington:     { pattern: /^\d{6}$/, hint: '6 digits' },
  Nevada:         { pattern: /^\d{6}$/, hint: '6 digits' },
};
const DEFAULT_RULE = { pattern: /^[A-Za-z0-9]{5,12}$/, hint: '5–12 alphanumeric characters' };

function validateLicenseField(value, state) {
  if (!value) return null;
  const rule = STATE_RULES[state] || DEFAULT_RULE;
  return rule.pattern.test(value.trim()) ? null : `This doesn't match the expected license format for ${state}. Please double-check and try again.`;
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

// ─── Shared UI ─────────────────────────────────────────────────────────────────
const STEPS_LABELS = ['Your Info', 'Your Practice'];

function StepIndicator({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
      {STEPS_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: i <= current ? ACCENT : 'rgba(255,255,255,0.08)',
              border: `2px solid ${i <= current ? ACCENT : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              {i < current ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          {i < STEPS_LABELS.length - 1 && (
            <div style={{ flex: 1, height: '1px', background: i < current ? ACCENT : 'rgba(255,255,255,0.1)', margin: '0 12px', marginBottom: '28px', transition: 'background 0.3s ease' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>
      {children}
    </label>
  );
}

const baseInputStyle = {
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

function StyledInput({ value, onChange, type = 'text', error, onFocusChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => { setFocused(true); onFocusChange && onFocusChange(true); }}
        onBlur={() => { setFocused(false); onFocusChange && onFocusChange(false); }}
        style={{ ...baseInputStyle, borderColor: error ? '#EF4444' : focused ? ACCENT : 'rgba(255,255,255,0.12)' }}
      />
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#EF4444', margin: '6px 0 0', lineHeight: 1.5 }}>{error}</p>}
    </div>
  );
}

function StyledSelect({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...baseInputStyle,
        borderColor: focused ? ACCENT : 'rgba(255,255,255,0.12)',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: '36px',
        cursor: 'pointer',
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => (
        <option key={opt} value={opt} style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>{opt}</option>
      ))}
    </select>
  );
}

function ToggleChip({ label, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '13px',
        padding: '9px 18px',
        borderRadius: '6px',
        border: `1px solid ${selected ? ACCENT : 'rgba(255,255,255,0.12)'}`,
        background: selected ? 'rgba(0,219,197,0.1)' : disabled ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
        color: selected ? ACCENT : disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ─── Phone formatter ───────────────────────────────────────────────────────────
function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

// ─── STEP 1 ────────────────────────────────────────────────────────────────────
function Step1({ data, setData, errors, setErrors }) {
  const clearError = (field) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <FieldLabel>Full Name</FieldLabel>
        <StyledInput
          value={data.fullName}
          onChange={e => { setData({ ...data, fullName: e.target.value }); clearError('fullName'); }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <FieldLabel>Email</FieldLabel>
          <StyledInput
            type="email"
            value={data.email}
            onChange={e => { setData({ ...data, email: e.target.value }); clearError('email'); }}
          />
        </div>
        <div>
          <FieldLabel>Phone Number</FieldLabel>
          <StyledInput
            type="tel"
            value={data.phone}
            onChange={e => { setData({ ...data, phone: formatPhone(e.target.value) }); clearError('phone'); }}
          />
        </div>
      </div>

      <div>
        <FieldLabel>State</FieldLabel>
        <StyledSelect
          value={data.state}
          onChange={e => { setData({ ...data, state: e.target.value }); clearError('state'); }}
          options={US_STATES}
          placeholder="Select your state"
        />
      </div>

      <div>
        <FieldLabel>Role</FieldLabel>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['Agent', 'Broker'].map(role => (
            <ToggleChip
              key={role}
              label={role}
              selected={data.role === role}
              onClick={() => { setData({ ...data, role }); clearError('role'); }}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Brokerage Name</FieldLabel>
        <StyledInput
          value={data.brokerageName}
          onChange={e => { setData({ ...data, brokerageName: e.target.value }); clearError('brokerageName'); }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <FieldLabel>Employing Broker #</FieldLabel>
          <StyledInput
            value={data.employingBrokerId}
            error={errors.employingBrokerId}
            onChange={e => { setData({ ...data, employingBrokerId: e.target.value }); clearError('employingBrokerId'); }}
          />
        </div>
        <div>
          <FieldLabel>License No.</FieldLabel>
          <StyledInput
            value={data.licenseNumber}
            error={errors.licenseNumber}
            onChange={e => { setData({ ...data, licenseNumber: e.target.value }); clearError('licenseNumber'); }}
          />
        </div>
      </div>

      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6 }}>
        PropMatch is exclusively available to licensed real estate professionals. Your credentials are required for verification.
      </p>
    </div>
  );
}

// ─── STEP 2 ────────────────────────────────────────────────────────────────────
const CAT_OPTIONS = ['Residential', 'Commercial', 'Both', 'Other'];
const TX_OPTIONS = ['Sales', 'Leasing', 'Rentals', 'All', 'Other'];

function Step2({ data, setData }) {
  const toggleCat = (cat) => {
    const current = data.propertyCategories;
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    setData({ ...data, propertyCategories: next, catOther: cat === 'Other' && current.includes('Other') ? '' : data.catOther });
  };

  const toggleTx = (tx) => {
    if (tx === 'All') {
      const isSelected = data.transactionTypes.includes('All');
      setData({ ...data, transactionTypes: isSelected ? [] : ['All'], txOther: '' });
      return;
    }
    const hasAll = data.transactionTypes.includes('All');
    if (hasAll) return;
    const current = data.transactionTypes;
    const next = current.includes(tx) ? current.filter(t => t !== tx) : [...current, tx];
    setData({ ...data, transactionTypes: next, txOther: tx === 'Other' && current.includes('Other') ? '' : data.txOther });
  };

  const allSelected = data.transactionTypes.includes('All');
  const catOtherSelected = data.propertyCategories.includes('Other');
  const txOtherSelected = data.transactionTypes.includes('Other');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Property Categories */}
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}>
          What property categories do you work in?
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: catOtherSelected ? '12px' : '0' }}>
          {CAT_OPTIONS.map(cat => (
            <ToggleChip
              key={cat}
              label={cat}
              selected={data.propertyCategories.includes(cat)}
              onClick={() => toggleCat(cat)}
            />
          ))}
        </div>
        {catOtherSelected && (
          <div style={{ marginTop: '12px' }}>
            <FieldLabel>Please specify</FieldLabel>
            <StyledInput
              value={data.catOther}
              onChange={e => setData({ ...data, catOther: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Transaction Types */}
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', margin: '0 0 14px' }}>
          What transaction types do you handle?
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {TX_OPTIONS.map(tx => (
            <ToggleChip
              key={tx}
              label={tx}
              selected={data.transactionTypes.includes(tx)}
              disabled={allSelected && tx !== 'All' && tx !== 'Other'}
              onClick={() => toggleTx(tx)}
            />
          ))}
        </div>
        {txOtherSelected && !allSelected && (
          <div style={{ marginTop: '12px' }}>
            <FieldLabel>Please specify</FieldLabel>
            <StyledInput
              value={data.txOther}
              onChange={e => setData({ ...data, txOther: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const STEP1_INIT = { fullName: '', email: '', phone: '', state: '', role: '', brokerageName: '', employingBrokerId: '', licenseNumber: '' };
const STEP2_INIT = { propertyCategories: [], catOther: '', transactionTypes: [], txOther: '' };

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState(STEP1_INIT);
  const [step2, setStep2] = useState(STEP2_INIT);
  const [errors, setErrors] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [showPostOnboarding, setShowPostOnboarding] = useState(false);
  const navigate = useNavigate();

  // Step 1 all-fields check
  const step1Filled = step1.fullName && step1.email && step1.phone && step1.state &&
    step1.role && step1.brokerageName && step1.employingBrokerId && step1.licenseNumber;

  // Step 2 validity
  const catOtherSelected = step2.propertyCategories.includes('Other');
  const txOtherSelected = step2.transactionTypes.includes('Other');
  const step2Valid =
    step2.propertyCategories.length > 0 &&
    (!catOtherSelected || step2.catOther.trim()) &&
    step2.transactionTypes.length > 0 &&
    (!txOtherSelected || step2.txOther.trim());

  const canContinue = step === 0 ? !!step1Filled : step2Valid;

  const handleStep1Continue = async () => {
    if (!step1Filled) return;

    // Run format validation
    const brokerError = step1.state ? validateLicenseField(step1.employingBrokerId, step1.state) : null;
    const licenseError = step1.state ? validateLicenseField(step1.licenseNumber, step1.state) : null;

    if (brokerError || licenseError) {
      setErrors({ employingBrokerId: brokerError, licenseNumber: licenseError });
      return;
    }

    // Save to user profile
    try {
      await base44.auth.updateMe({
        full_name: step1.fullName,
        email: step1.email,
        phone: step1.phone,
        state: step1.state,
        role_type: step1.role.toLowerCase(),
        brokerage_name: step1.brokerageName,
        employing_broker_id: step1.employingBrokerId,
        license_number: step1.licenseNumber,
        verification_status: 'format_verified',
      });
    } catch (e) {
      // Non-blocking — proceed anyway
    }

    setErrors({});
    setStep(1);
  };

  const handleStep2Continue = async () => {
    if (!step2Valid) return;

    try {
      await base44.auth.updateMe({
        property_categories: step2.propertyCategories,
        property_categories_other: step2.catOther || null,
        transaction_types: step2.transactionTypes,
        transaction_types_other: step2.txOther || null,
      });
    } catch (e) {
      // Non-blocking
    }

    setShowPayment(true);
  };

  const handleContinue = () => {
    if (step === 0) handleStep1Continue();
    else if (step === 1) handleStep2Continue();
  };

  const isBroker = step1.role === 'Broker';

  const headings = [
    'Professional Credentials',
    'Your Practice',
  ];
  const subheadings = [
    'Your license and brokerage details are required to verify your credentials.',
    "This helps us personalize your experience and understand who's joining the platform.",
  ];

  if (showPayment) {
    return (
      <PaymentScreen
        isBroker={isBroker}
        onComplete={(plan) => {
          try { base44.auth.updateMe({ selected_plan: plan }); } catch (e) {}
          setShowPayment(false);
          setShowPostOnboarding(true);
        }}
      />
    );
  }

  if (showPostOnboarding) {
    return <PostOnboarding isBroker={isBroker} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <div style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
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
        <Link to="/Landing"
          style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.2s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          ← Back to site
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '56px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>
          {/* Badge + heading */}
          <div style={{ marginBottom: '36px' }}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
              padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
              display: 'inline-block', marginBottom: '20px',
            }}>
              Join PropMatch
            </span>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 10px' }}>
              {headings[step]}
            </h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
              {subheadings[step]}
            </p>
          </div>

          <StepIndicator current={step} />

          {/* Step content */}
          <div style={{ marginBottom: '32px' }}>
            {step === 0 && <Step1 data={step1} setData={setStep1} errors={errors} setErrors={setErrors} />}
            {step === 1 && <Step2 data={step2} setData={setStep2} />}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >
                  ← Back
                </button>
              ) : <div />}

              <button
                onClick={handleContinue}
                disabled={!canContinue}
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
        </div>
      </div>

      <style>{`
        select option { background: #0E1318; }
        @media (max-width: 600px) {
          .onb-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}