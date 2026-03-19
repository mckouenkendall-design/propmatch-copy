import React, { useEffect, useRef, useState } from 'react';

const ACCENT = '#00DBC5';

// The fish icon — exact same path used in the logo, no text
function FishIcon({ size = 44, flop = 0, facingLeft = false }) {
  // flop is a value 0-1 that controls a subtle body wiggle
  const skew = Math.sin(flop * Math.PI * 2) * 4;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-24 -14 48 28"
      width={size}
      height={size * 0.6}
      style={{
        transform: `${facingLeft ? 'scaleX(-1)' : ''} skewY(${skew}deg)`,
        display: 'block',
        filter: 'drop-shadow(0 0 3px rgba(0,219,197,0.3))',
      }}
    >
      <path
        d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
        fill="none"
        stroke={ACCENT}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function generateSchool() {
  const count = Math.floor(Math.random() * 5) + 1;
  const facingLeft = Math.random() > 0.5;
  const startX = facingLeft ? window.innerWidth + 60 : -60;
  const endX = facingLeft ? -120 : window.innerWidth + 120;
  const baseY = 120 + Math.random() * (document.body.scrollHeight - 300);
  const duration = 18000 + Math.random() * 14000; // 18–32s
  const fishes = Array.from({ length: count }, (_, i) => ({
    id: Math.random(),
    offsetX: (i % 3) * (facingLeft ? 36 : -36),
    offsetY: (Math.floor(i / 3) * 22) + (Math.random() * 10 - 5),
    size: 38 + Math.random() * 12,
    flopPhase: Math.random(),
  }));
  return { id: Math.random(), startX, endX, baseY, duration, facingLeft, fishes, startTime: Date.now() };
}

export default function SwimmingFish() {
  const [schools, setSchools] = useState([]);
  const animRef = useRef(null);
  const schoolsRef = useRef([]);

  // Spawn a new school every 6–12s
  useEffect(() => {
    const spawn = () => {
      const school = generateSchool();
      schoolsRef.current = [...schoolsRef.current, school];
      setSchools([...schoolsRef.current]);
    };
    spawn(); // spawn one immediately
    const interval = setInterval(() => {
      spawn();
      // clean up finished schools
      const now = Date.now();
      schoolsRef.current = schoolsRef.current.filter(s => now - s.startTime < s.duration + 2000);
      setSchools([...schoolsRef.current]);
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {schools.map(school => (
        <SchoolRenderer key={school.id} school={school} onDone={() => {
          schoolsRef.current = schoolsRef.current.filter(s => s.id !== school.id);
          setSchools([...schoolsRef.current]);
        }} />
      ))}
    </div>
  );
}

function SchoolRenderer({ school, onDone }) {
  const [progress, setProgress] = useState(0);
  const [flop, setFlop] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / school.duration, 1);
      setProgress(p);
      setFlop(elapsed / 400); // flop cycles every ~400ms
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const currentX = school.startX + (school.endX - school.startX) * progress;
  // gentle sine wave vertical drift
  const waveY = Math.sin(progress * Math.PI * 3) * 18;

  return (
    <>
      {school.fishes.map(fish => (
        <div
          key={fish.id}
          style={{
            position: 'absolute',
            left: currentX + fish.offsetX,
            top: school.baseY + waveY + fish.offsetY,
            willChange: 'transform',
          }}
        >
          <FishIcon size={fish.size} flop={flop + fish.flopPhase} facingLeft={school.facingLeft} />
        </div>
      ))}
    </>
  );
}