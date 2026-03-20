import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import AddTeamModal from '@/components/broker/AddTeamModal';

const ACCENT = '#00DBC5';

// ─── Confetti ──────────────────────────────────────────────────────────────────
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00DBC5', '#00b8a7', '#ffffff', '#a3f0e8', '#6ee7dc', '#FFD700', '#FF6B6B'];
    const count = 120;
    particles.current = [];

    for (let i = 0; i < count; i++) {
      const fromLeft = i < count / 2;
      particles.current.push({
        x: fromLeft ? -10 : canvas.width + 10,
        y: canvas.height * (0.3 + Math.random() * 0.4),
        vx: fromLeft ? (3 + Math.random() * 4) : -(3 + Math.random() * 4),
        vy: -(4 + Math.random() * 5),
        gravity: 0.12 + Math.random() * 0.06,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: 6 + Math.random() * 6,
        height: 3 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        fade: 0.008 + Math.random() * 0.008,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles.current) {
        if (p.opacity <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.fade;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }
      if (alive) animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}
    />
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────
function SkipButton({ onSkip, label = 'Skip' }) {
  return (
    <button
      onClick={onSkip}
      style={{
        fontFamily: "'Inter', sans-serif", fontSize: '13px',
        color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none',
        cursor: 'pointer', padding: '8px 0', transition: 'color 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
    >
      {label}
    </button>
  );
}

function PrimaryButton({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        color: disabled ? 'rgba(255,255,255,0.2)' : '#111827',
        background: disabled ? 'rgba(255,255,255,0.06)' : ACCENT,
        border: 'none', borderRadius: '6px',
        padding: '12px 28px', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </button>
  );
}

function ScreenShell({ children, onSkip, skipLabel }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080C10', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '20px 48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" width="160" height="32">
          <g transform="translate(20,20)">
            <path d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
              fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
          </g>
          <text fontFamily="'Segoe UI', Arial, sans-serif" fontSize="15" letterSpacing="0.3" x="44" y="25">
            <tspan fill="#FFFFFF" fontWeight="300">Prop</tspan><tspan fill="#00DBC5" fontWeight="600">Match</tspan>
          </text>
        </svg>
        {onSkip && <SkipButton onSkip={onSkip} label={skipLabel || 'Skip'} />}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 64px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Screen 0: Confetti celebration ────────────────────────────────────────────
function ConfettiScreen({ onNext }) {
  const [confettiActive, setConfettiActive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setConfettiActive(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <ConfettiCanvas active={confettiActive} />
      <ScreenShell onSkip={onNext} skipLabel="Skip intro">
        <div style={{ textAlign: 'center', maxWidth: '520px' }}>
          <div style={{ fontSize: '52px', marginBottom: '24px' }}>🎉</div>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
            padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
            display: 'inline-block', marginBottom: '24px',
          }}>Welcome to PropMatch</span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(28px, 4vw, 44px)', color: '#FFFFFF', lineHeight: 1.15, margin: '0 0 16px' }}>
            You're in.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px' }}>
            Your account is set up and ready. We'll take you through a quick tour of the platform so you know exactly where everything is.
          </p>
          <PrimaryButton onClick={onNext}>Let's go →</PrimaryButton>
        </div>
      </ScreenShell>
    </>
  );
}

// ─── Screen 1: How did you hear about us ───────────────────────────────────────
const REFERRAL_OPTIONS = [
  { label: 'LinkedIn', icon: '💼' },
  { label: 'Twitter / X', icon: '🐦' },
  { label: 'TikTok', icon: '🎵' },
  { label: 'Instagram', icon: '📷' },
  { label: 'YouTube', icon: '▶️' },
  { label: 'Google Search', icon: '🔍' },
  { label: 'Friend or Colleague', icon: '🤝' },
  { label: 'Other', icon: '✦' },
];

function HowDidYouHearScreen({ onNext }) {
  const [selected, setSelected] = useState(null);

  const handleNext = async () => {
    if (!selected) return;
    try { await base44.auth.updateMe({ referral_source: selected }); } catch (e) {}
    onNext();
  };

  return (
    <ScreenShell onSkip={onNext} skipLabel="Skip">
      <div style={{ textAlign: 'center', maxWidth: '560px', width: '100%' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(22px, 3vw, 34px)', color: '#FFFFFF', margin: '0 0 10px' }}>
          How did you hear about us?
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 36px' }}>
          Helps us understand where our community comes from.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '32px' }}>
          {REFERRAL_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setSelected(opt.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 18px', borderRadius: '8px',
                border: `1px solid ${selected === opt.label ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                background: selected === opt.label ? 'rgba(0,219,197,0.08)' : 'rgba(255,255,255,0.02)',
                color: selected === opt.label ? ACCENT : 'rgba(255,255,255,0.6)',
                fontFamily: "'Inter', sans-serif", fontSize: '14px',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '18px' }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkipButton onSkip={onNext} label="Skip this question" />
          <PrimaryButton onClick={handleNext} disabled={!selected}>Continue →</PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Screen 2: Theme picker ─────────────────────────────────────────────────────
function ThemeScreen({ onNext }) {
  const [selectedTheme, setSelectedTheme] = useState('dark');

  const handleNext = async () => {
    try { await base44.auth.updateMe({ theme_preference: selectedTheme }); } catch (e) {}
    onNext();
  };

  const themes = [
    { id: 'dark', label: 'Dark Mode', desc: 'Easy on the eyes. Great for long sessions.', preview: { bg: '#080C10', card: '#111827', accent: ACCENT } },
    { id: 'light', label: 'Light Mode', desc: 'Clean and bright. Perfect for daytime use.', preview: { bg: '#F9FAFB', card: '#FFFFFF', accent: ACCENT } },
  ];

  return (
    <ScreenShell onSkip={onNext} skipLabel="Skip">
      <div style={{ textAlign: 'center', maxWidth: '580px', width: '100%' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(22px, 3vw, 34px)', color: '#FFFFFF', margin: '0 0 10px' }}>
          Pick your theme
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 36px' }}>
          You can change this anytime in your settings.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              style={{
                border: `2px solid ${selectedTheme === theme.id ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                background: 'transparent', padding: 0, transition: 'border-color 0.2s ease',
                boxShadow: selectedTheme === theme.id ? `0 0 0 1px ${ACCENT}` : 'none',
              }}
            >
              <div style={{ background: theme.preview.bg, padding: '16px', height: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ background: theme.preview.card, borderRadius: '4px', height: '12px', width: '60%' }} />
                <div style={{ background: theme.preview.card, borderRadius: '4px', height: '8px', width: '80%', opacity: 0.6 }} />
                <div style={{ background: theme.preview.accent, borderRadius: '4px', height: '8px', width: '40%', marginTop: 'auto', opacity: 0.8 }} />
              </div>
              <div style={{ padding: '14px 16px', textAlign: 'left', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: selectedTheme === theme.id ? ACCENT : 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>{theme.label}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{theme.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkipButton onSkip={onNext} label="Decide later" />
          <PrimaryButton onClick={handleNext}>Continue →</PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Screen 3: Demo video ───────────────────────────────────────────────────────
function DemoVideoScreen({ onNext }) {
  return (
    <ScreenShell onSkip={onNext} skipLabel="Skip video">
      <div style={{ textAlign: 'center', maxWidth: '760px', width: '100%' }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
          padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
          display: 'inline-block', marginBottom: '20px',
        }}>Platform Overview</span>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(22px, 3vw, 34px)', color: '#FFFFFF', margin: '0 0 10px' }}>
          See PropMatch in action
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 32px' }}>
          A quick walkthrough of the core features.
        </p>
        {/* Video placeholder — swap src for YouTube embed when ready */}
        <div style={{
          width: '100%', aspectRatio: '16/9',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px', marginBottom: '32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0,219,197,0.1)', border: `1px solid ${ACCENT}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={ACCENT} stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>Demo video coming soon</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkipButton onSkip={onNext} label="Skip video" />
          <PrimaryButton onClick={onNext}>Continue →</PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Feature Demo Screen (with multi-screenshot sub-carousel) ───────────────────
function FeatureDemoScreen({ feature, onNext, onSkipAll, totalScreens, currentIndex }) {
  const [shotIndex, setShotIndex] = useState(0);
  const shots = feature.screenshots || [null]; // array of { url, caption } or null placeholders

  const prevShot = () => setShotIndex(i => Math.max(0, i - 1));
  const nextShot = () => setShotIndex(i => Math.min(shots.length - 1, i + 1));

  // Reset sub-index when feature changes
  useEffect(() => { setShotIndex(0); }, [currentIndex]);

  const isLastFeature = currentIndex === totalScreens - 1;
  const isLastShot = shotIndex === shots.length - 1;

  const handleNext = () => {
    if (!isLastShot) {
      nextShot();
    } else {
      onNext();
    }
  };

  return (
    <ScreenShell onSkip={onSkipAll} skipLabel="Skip all">
      <div style={{ textAlign: 'center', maxWidth: '720px', width: '100%' }}>
        {/* Feature progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '32px' }}>
          {Array.from({ length: totalScreens }).map((_, i) => (
            <div key={i} style={{
              width: i === currentIndex ? '20px' : '6px',
              height: '6px', borderRadius: '3px',
              background: i === currentIndex ? ACCENT : i < currentIndex ? 'rgba(0,219,197,0.35)' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <span style={{
          fontFamily: "'Inter', sans-serif", fontSize: '11px', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: ACCENT, border: '1px solid rgba(0,219,197,0.4)',
          padding: '4px 12px', borderRadius: '4px', background: 'rgba(0,219,197,0.06)',
          display: 'inline-block', marginBottom: '20px',
        }}>{feature.tag}</span>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300, fontSize: 'clamp(22px, 3vw, 34px)', color: '#FFFFFF', margin: '0 0 12px' }}>
          {feature.title}
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, margin: '0 0 28px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
          {shots[shotIndex]?.caption || feature.description}
        </p>

        {/* Screenshot area with prev/next arrows */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '28px' }}>
          <div style={{
            width: '100%', aspectRatio: '16/9',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
            position: 'relative',
          }}>
            {shots[shotIndex]?.url ? (
              <img
                src={shots[shotIndex].url}
                alt={shots[shotIndex].caption || feature.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: '200px', height: '200px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,219,197,0.06) 0%, transparent 70%)',
                }} />
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(0,219,197,0.08)', border: '1px solid rgba(0,219,197,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0, zIndex: 1 }}>
                  {shots[shotIndex]?.label || 'Screenshot coming soon'}
                </p>
              </>
            )}
          </div>

          {/* Prev / Next arrows — only shown when multiple screenshots */}
          {shots.length > 1 && (
            <>
              <button
                onClick={prevShot}
                disabled={shotIndex === 0}
                style={{
                  position: 'absolute', left: '-18px', top: '50%', transform: 'translateY(-50%)',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: shotIndex === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: shotIndex === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                  cursor: shotIndex === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (shotIndex > 0) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = shotIndex === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button
                onClick={nextShot}
                disabled={isLastShot}
                style={{
                  position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)',
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: isLastShot ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: isLastShot ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)',
                  cursor: isLastShot ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!isLastShot) e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isLastShot ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </>
          )}
        </div>

        {/* Sub-screenshot dots */}
        {shots.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '28px' }}>
            {shots.map((_, i) => (
              <button
                key={i}
                onClick={() => setShotIndex(i)}
                style={{
                  width: i === shotIndex ? '16px' : '5px', height: '5px', borderRadius: '3px',
                  background: i === shotIndex ? ACCENT : 'rgba(255,255,255,0.2)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkipButton onSkip={onSkipAll} label="Skip all" />
          <PrimaryButton onClick={handleNext}>
            {isLastFeature && isLastShot ? 'Go to Dashboard →' : isLastShot ? 'Next →' : 'Next screenshot →'}
          </PrimaryButton>
        </div>
      </div>
    </ScreenShell>
  );
}

// ─── Feature definitions ─────────────────────────────────────────────────────────
// screenshots: array of { label, caption, url }
// url can be null (shows placeholder) or a real image URL
// caption overrides the main description when that screenshot is active

const BROKER_FEATURES = [
  {
    tag: 'Broker Dashboard',
    title: 'Your brokerage, at a glance',
    description: "As a broker, you get a dedicated admin view of your entire office's activity. See who is posting, which listings are matched, and where deals are moving across your team.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    screenshots: [
      { label: 'Brokerage overview dashboard', caption: "Your admin view shows every agent's active listings, requirements, and match activity across the office — all in one place.", url: null },
      { label: 'Agent performance metrics', caption: 'See which agents have the most active deals, recent matches, and pipeline movement at a glance without asking anyone.', url: null },
    ],
  },
  {
    tag: 'Team Collaboration',
    title: 'Tools built for your whole office',
    description: "Share listings internally before going public, assign requirements to agents, and keep your team coordinated on active opportunities. Built for how brokerages actually work.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    screenshots: [
      { label: 'Internal listing visibility', caption: 'Before going public, share a listing internally so your team can match it against their active buyer requirements first.', url: null },
      { label: 'Requirement assignment', caption: 'Assign a client requirement to any agent on your team and track who is working what deal.', url: null },
    ],
  },
];

const BASE_FEATURES = [
  {
    tag: 'Posting Listings',
    title: 'Post a listing in under two minutes',
    description: 'Add your property details, set your visibility, and PropMatch instantly begins scoring it against active client requirements from agents across the platform.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
    screenshots: [
      { label: 'Listing creation form', caption: 'The two-step listing wizard keeps it fast — property details, pricing, and visibility controls all in one clean flow.', url: null },
      { label: 'Visibility controls', caption: 'Choose who sees your listing: public to all agents, brokerage-only, a specific group, or a private direct share.', url: null },
    ],
  },
  {
    tag: 'Client Requirements',
    title: "Post what your client is looking for",
    description: "Enter your client's criteria once — budget, location, property type, size — and the platform continuously surfaces matching listings as they come in, ranked by compatibility.",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>,
    screenshots: [
      { label: 'Requirement form', caption: "Set your client's budget, preferred cities, property type, and size range — then let the engine do the hunting.", url: null },
      { label: 'Matched listings view', caption: "Every requirement shows a live list of matching listings, ranked by compatibility score so the best fits are always at the top.", url: null },
    ],
  },
  {
    tag: 'Match Engine',
    title: 'Your matches, scored and ranked',
    description: 'Every listing is scored against every requirement using our proprietary match engine. You see a ranked list of opportunities, not a pile of irrelevant leads.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    screenshots: [
      { label: 'Match score breakdown', caption: 'Each match shows a score and a breakdown of why it matched — price fit, location overlap, size range, and property type.', url: null },
    ],
  },
  {
    tag: 'Groups and Networking',
    title: 'Connect with agents in your market',
    description: 'Join or create groups by market, property type, or specialty. Share posts, co-op opportunities, and host or attend networking events — all inside the platform.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    screenshots: [
      { label: 'Group discussion board', caption: 'Post deal intel, co-op opportunities, or market updates to your group. Tag listings or requirements directly in the discussion.', url: null },
      { label: 'Group listings & requirements', caption: 'Every group has a shared feed of the listings and client requirements posted by its members — filtered to just your market.', url: null },
      { label: 'Events — join or host', caption: 'Host a networking happy hour or a site tour, or RSVP to events your group is running. Everything is managed inside PropMatch.', url: null },
    ],
  },
  {
    tag: 'Your Portfolio',
    title: 'All your listings and requirements, in one place',
    description: 'Your dashboard keeps every active listing and client requirement organized. See status, match counts, and activity at a glance without digging through email threads.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    screenshots: [
      { label: 'Dashboard overview', caption: 'Your dashboard shows all active listings and requirements with match counts, status badges, and quick-action buttons.', url: null },
    ],
  },
  {
    tag: 'Match Notifications',
    title: 'Get notified when a new match lands',
    description: 'PropMatch watches the platform for you. When a new listing or requirement hits that matches yours, you get notified immediately so you can act before anyone else.',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    screenshots: [
      { label: 'Notification center', caption: 'Your notification center collects every new match, group activity, and platform update — no inbox noise required.', url: null },
    ],
  },
];

// ─── Main exported component ────────────────────────────────────────────────────
export default function PostOnboarding({ isBroker = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [brokerInfo, setBrokerInfo] = useState(null);

  // Check if broker needs to add team (purchased brokerage plan)
  useEffect(() => {
    async function checkBrokerStatus() {
      if (!isBroker || !user) return;
      
      // Check if they have a brokerage subscription
      try {
        const userProfile = await base44.auth.me();
        if (userProfile.selected_plan === 'brokerage' && userProfile.brokerage_seats) {
          setBrokerInfo({
            totalSeats: userProfile.brokerage_seats,
            brokerEmail: userProfile.email,
            brokerName: userProfile.full_name,
            brokerageName: userProfile.brokerage_name,
            employingBrokerNumber: userProfile.employing_broker_id,
            stripeSubscriptionId: userProfile.stripe_subscription_id,
          });
          setShowAddTeam(true);
        }
      } catch (e) {
        console.error('Broker status check error:', e);
      }
    }
    
    checkBrokerStatus();
  }, [isBroker, user]);

  // Broker features come FIRST (after the video), then base features
  const featureList = isBroker ? [...BROKER_FEATURES, ...BASE_FEATURES] : BASE_FEATURES;
  const totalFeatureScreens = featureList.length;

  const SCREEN_CONFETTI = 0;
  const SCREEN_HOW_HEARD = 1;
  const SCREEN_THEME = 2;
  const SCREEN_VIDEO = 3;
  const FIRST_FEATURE = 4;
  const LAST_SCREEN = FIRST_FEATURE + totalFeatureScreens - 1;

  const [screen, setScreen] = useState(SCREEN_CONFETTI);

  const goNext = () => {
    if (screen >= LAST_SCREEN) { navigate('/Dashboard'); return; }
    setScreen(s => s + 1);
  };

  const skipAll = () => navigate('/Dashboard');

  const featureIndex = screen - FIRST_FEATURE;

  // Show Add Team Modal for brokers first
  if (showAddTeam && brokerInfo) {
    return (
      <AddTeamModal
        totalSeats={brokerInfo.totalSeats}
        brokerEmail={brokerInfo.brokerEmail}
        brokerName={brokerInfo.brokerName}
        brokerageName={brokerInfo.brokerageName}
        employingBrokerNumber={brokerInfo.employingBrokerNumber}
        stripeSubscriptionId={brokerInfo.stripeSubscriptionId}
        onClose={() => setShowAddTeam(false)}
        onComplete={() => setShowAddTeam(false)}
      />
    );
  }

  if (screen === SCREEN_CONFETTI) return <ConfettiScreen onNext={goNext} />;
  if (screen === SCREEN_HOW_HEARD) return <HowDidYouHearScreen onNext={goNext} />;
  if (screen === SCREEN_THEME) return <ThemeScreen onNext={goNext} />;
  if (screen === SCREEN_VIDEO) return <DemoVideoScreen onNext={goNext} />;

  if (screen >= FIRST_FEATURE) {
    return (
      <FeatureDemoScreen
        feature={featureList[featureIndex]}
        onNext={goNext}
        onSkipAll={skipAll}
        totalScreens={totalFeatureScreens}
        currentIndex={featureIndex}
      />
    );
  }

  return null;
}