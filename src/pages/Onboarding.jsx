import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import PostOnboarding from '@/components/onboarding/PostOnboarding';
import PaymentScreen from '@/components/onboarding/PaymentScreen';

const ACCENT = '#00DBC5';

const STATE_RULES = {
  Michigan:       { pattern: /^\d{10}$/, hint: '10 digits' },
  Florida:        { pattern: /^[A-Za-z]{2}\d{5,6}$/, hint: '2 letters + 5-6 digits' },
  California:     { pattern: /^([A-Za-z]\d{7}|\d{8})$/, hint: '8 digits or 1 letter + 7 digits' },
  Texas:          { pattern: /^\d{6,9}$/, hint: '6-9 digits' },
  'New York':     { pattern: /^\d{10}$/, hint: '10 digits' },
  Illinois:       { pattern: /^[A-Za-z]{2,3}\d{5,7}$/, hint: '2-3 letters + digits' },
  Ohio:           { pattern: /^\d{6}$/, hint: '6 digits' },
  Georgia:        { pattern: /^\d{6}$/, hint: '6 digits' },
  'North Carolina': { pattern: /^\d{6}$/, hint: '6 digits' },
  Pennsylvania:   { pattern: /^[A-Za-z]{2}\d{6}$/, hint: '2 letters + 6 digits' },
  Arizona:        { pattern: /^\d{6}$/, hint: '6 digits' },
  Colorado:       { pattern: /^\d{6}$/, hint: '6 digits' },
  Washington:     { pattern: /^\d{6}$/, hint: '6 digits' },
  Nevada:         { pattern: /^\d{6}$/, hint: '6 digits' },
};
const DEFAULT_RULE = { pattern: /^[A-Za-z0-9]{5,12}$/, hint: '5-12 alphanumeric characters' };

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

function FieldLabel({ children }) {
  return <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>{children}</label>;
}

const baseInputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px', padding: '12px 14px', fontFamily: "'Inter', sans-serif", fontSize: '14px',
  color: 'rgba(255,255,255,0.85)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s ease',
};

function StyledInput({ value, onChange, type = 'text', error, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...baseInputStyle, borderColor: error ? '#EF4444' : focused ? ACCENT : 'rgba(255,255,255,0.12)' }} />
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#EF4444', margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

function StyledSelect({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...baseInputStyle, borderColor: focused ? ACCENT : 'rgba(255,255,255,0.12)', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px', cursor: 'pointer' }}>
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt} style={{ background: '#0E1318', color: 'rgba(255,255,255,0.85)' }}>{opt}</option>)}
    </select>
  );
}

function ToggleChip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', padding: '9px 18px', borderRadius: '6px',
        border: `1px solid ${selected ? ACCENT : 'rgba(255,255,255,0.12)'}`,
        background: selected ? 'rgba(0,219,197,0.1)' : 'rgba(255,255,255,0.03)',
        color: selected ? ACCENT : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const FORM_INIT = { fullName: '', email: '', phone: '', username: '', state: '', role: '', brokerageName: '', employingBrokerId: '', licenseNumber: '' };

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(FORM_INIT);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showPostOnboarding, setShowPostOnboarding] = useState(false);

  useEffect(() => {
    if (user?.email && !form.email) setForm(prev => ({ ...prev, email: user.email }));
  }, [user]);

  const allFilled = form.fullName && form.email && form.phone && form.username && form.state &&
    form.role && form.brokerageName && form.employingBrokerId && form.licenseNumber;

  const clearError = (field) => { if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };

  const handleContinue = async () => {
    if (!allFilled || saving) return;
    setSaving(true);

    // Safety net: if ANYTHING hangs for more than 10 seconds, let the user through.
    // Better a user who proceeds than a user stuck forever on "Saving..."
    let timedOut = false;
    const hangGuard = setTimeout(() => {
      timedOut = true;
      console.warn('Onboarding save took longer than 10s, advancing anyway');
      setSaving(false);
      setShowPayment(true);
    }, 10000);

    const finishSuccess = () => {
      if (timedOut) return;
      clearTimeout(hangGuard);
      setErrors({});
      setSaving(false);
      setShowPayment(true);
    };

    const finishError = (msg) => {
      if (timedOut) return;
      clearTimeout(hangGuard);
      setSaving(false);
    };

    try {
      // License format validation
      const brokerError = form.state ? validateLicenseField(form.employingBrokerId, form.state) : null;
      const licenseError = form.state ? validateLicenseField(form.licenseNumber, form.state) : null;
      if (brokerError || licenseError) {
        setErrors({ employingBrokerId: brokerError, licenseNumber: licenseError });
        clearTimeout(hangGuard);
        setSaving(false);
        return;
      }

      // Username uniqueness check (non-blocking on error)
      try {
        const existingUsers = await supabase.from('profiles').select('user_email').eq('username', form.username.trim());
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          const isOurOwn = existingUsers.every(u => u.user_email === user?.email);
          if (!isOurOwn) {
            setErrors({ username: 'This username is already taken. Please choose another.' });
            clearTimeout(hangGuard);
            setSaving(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Username check failed, continuing anyway:', e);
      }

      const email = user?.email;
      if (!email) {
        console.error('No user email available, cannot save profile');
        finishError('No email');
        return;
      }

      // Build the full profile. All of these columns are confirmed to exist on the profiles table.
      const profileData = {
        full_name: form.fullName,
        username: form.username.trim(),
        contact_email: form.email,
        phone: form.phone,
        state: form.state,
        user_type: form.role === 'Principal Broker' ? 'principal_broker' : 'agent',
        brokerage_name: form.brokerageName,
        employing_broker_id: form.employingBrokerId,
        license_number: form.licenseNumber,
        verification_status: 'format_verified',
        theme: 'dark',
      };

      // Check if a profile row already exists for this email, then update or insert
      const existing = await supabase.from('profiles').select('id').eq('user_email', email).limit(1);

      if (Array.isArray(existing) && existing.length > 0 && existing[0]?.id) {
        await supabase.from('profiles').update(profileData).eq('id', existing[0].id);
      } else {
        await supabase.from('profiles').insert({ user_email: email, ...profileData });
      }

      // Fire-and-forget backup to auth metadata (useful if the DB row somehow doesn't persist)
      supabase.auth.updateUser({
        data: {
          full_name: form.fullName,
          name: form.fullName,
          username: form.username.trim(),
        }
      }).catch(() => {});

      finishSuccess();

    } catch (e) {
      console.error('Continue error:', e);
      finishError(e?.message || 'Unknown error');
    }
  };

  const isBroker = form.role === 'Principal Broker';

  if (showPayment) {
    return (
      <PaymentScreen
        isBroker={isBroker}
        employingBrokerNumber={form.employingBrokerId}
        onComplete={async (plan) => {
          // Save plan to profile (fire and forget)
          const email = user?.email;
          if (email) {
            supabase.from('profiles').update({ selected_plan: plan }).eq('user_email', email).then(() => {}).catch(() => {});
            supabase.auth.updateUser({ data: { selected_plan: plan } }).catch(() => {});
          }
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
      <div style={{ padding: '24px 48px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="180" height="36">
            <g transform="translate(20,20)"><path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></g>
            <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25"><tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan></text>
          </svg>
        </Link>
        <Link to="/" style={{ marginLeft: 'auto', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
          ← Back to site
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '56px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>
          <div style={{ marginBottom: '36px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)', padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)', display: 'inline-block', marginBottom: '20px' }}>Join PropMatch</span>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(26px, 3.5vw, 38px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 10px' }}>Professional Credentials</h1>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>Your license and brokerage details are required to verify your credentials.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <div><FieldLabel>Full Name</FieldLabel><StyledInput value={form.fullName} onChange={e => { setForm({ ...form, fullName: e.target.value }); clearError('fullName'); }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><FieldLabel>Email</FieldLabel><StyledInput type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); clearError('email'); }} />
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>This email will be visible to other agents for contact purposes.</p></div>
              <div><FieldLabel>Phone Number</FieldLabel><StyledInput type="tel" value={form.phone} onChange={e => { setForm({ ...form, phone: formatPhone(e.target.value) }); clearError('phone'); }} /></div>
            </div>
            <div><FieldLabel>Username</FieldLabel><StyledInput value={form.username} error={errors.username} onChange={e => { setForm({ ...form, username: e.target.value }); clearError('username'); }} /></div>
            <div><FieldLabel>State</FieldLabel><StyledSelect value={form.state} onChange={e => { setForm({ ...form, state: e.target.value }); clearError('state'); }} options={US_STATES} placeholder="Select your state" /></div>
            <div><FieldLabel>Role</FieldLabel><div style={{ display: 'flex', gap: '10px' }}>{['Agent', 'Principal Broker'].map(role => <ToggleChip key={role} label={role} selected={form.role === role} onClick={() => { setForm({ ...form, role }); clearError('role'); }} />)}</div></div>
            <div><FieldLabel>Brokerage Name</FieldLabel><StyledInput value={form.brokerageName} onChange={e => { setForm({ ...form, brokerageName: e.target.value }); clearError('brokerageName'); }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><FieldLabel>Employing Broker #</FieldLabel><StyledInput value={form.employingBrokerId} error={errors.employingBrokerId} onChange={e => { setForm({ ...form, employingBrokerId: e.target.value }); clearError('employingBrokerId'); }} /></div>
              <div><FieldLabel>License No.</FieldLabel><StyledInput value={form.licenseNumber} error={errors.licenseNumber} onChange={e => { setForm({ ...form, licenseNumber: e.target.value }); clearError('licenseNumber'); }} /></div>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.6 }}>PropMatch is exclusively available to licensed real estate professionals. Your credentials are required for verification.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleContinue} disabled={!allFilled || saving}
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: allFilled && !saving ? '#111827' : 'rgba(255,255,255,0.2)',
                background: allFilled && !saving ? ACCENT : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: '6px', padding: '12px 28px',
                cursor: allFilled && !saving ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease' }}>
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
      <style>{`select option { background: #0E1318; }`}</style>
    </div>
  );
}
