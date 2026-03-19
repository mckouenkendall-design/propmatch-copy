import React, { useEffect, useRef, useState } from 'react';

const ACCENT = '#00DBC5';

// facingRight = true means the fish swims to the right → nose points right, tail points left
// We use scaleX(-1) to flip the SVG which naturally points right (nose at +x, tail at -x)
function FishIcon({ size = 40, wiggle = 0, facingRight = true }) {
  // Tail wag: slight rotation oscillation on the body
  const wagDeg = Math.sin(wiggle) * 6;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-26 -14 52 28"
      width={size}
      height={size * 0.58}
      style={{
        display: 'block',
        transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)',
        filter: 'drop-shadow(0 0 2px rgba(0,219,197,0.25))',
      }}
    >
      {/* Body with subtle waggle via rotation on the tail half */}
      <g style={{ transformOrigin: '0px 0px', transform: `rotate(${wagDeg}deg)`, transition: 'none' }}>
        <path
          d="M -16,0 Q 0,-7 16,0 Q 19,-1.5 22,-5 Q 20,-1 16,0 Q 19,1.5 22,5 Q 20,1 16,0 Q 0,7 -16,0 Z"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// Track occupied Y bands to avoid overlap
const usedYBands = [];
const BAND_HEIGHT = 60;

function pickY() {
  const pageH = window.innerHeight;
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const y = 80 + Math.random() * (pageH - 180);
    const band = Math.floor(y / BAND_HEIGHT);
    if (!usedYBands.includes(band)) {
      usedYBands.push(band);
      // Release this band after 80s so it can be reused
      setTimeout(() => {
        const idx = usedYBands.indexOf(band);
        if (idx !== -1) usedYBands.splice(idx, 1);
      }, 80000);
      return y;
    }
  }
  // fallback if all bands taken
  return 150 + Math.random() * (pageH - 400);
}

function generateSchool() {
  const count = Math.floor(Math.random() * 5) + 1;
  const facingRight = Math.random() > 0.5;
  // Start off-screen on the correct side
  const startX = facingRight ? -80 : window.innerWidth + 80;
  const endX = facingRight ? window.innerWidth + 120 : -120;
  const baseY = pickY();
  const duration = 45000 + Math.random() * 30000; // 45–75s, very slow

  // Arrange fish in a loose school formation
  const fishes = Array.from({ length: count }, (_, i) => {
    // stagger behind the leader in the direction they came from
    const staggerX = i * (facingRight ? -28 : 28);
    const staggerY = (Math.random() - 0.5) * 30;
    return {
      id: Math.random(),
      offsetX: staggerX,
      offsetY: staggerY,
      size: 36 + Math.random() * 10,
      wiggleOffset: Math.random() * Math.PI * 2,
    };
  });

  return { id: Math.random(), startX, endX, baseY, duration, facingRight, fishes, startTime: Date.now() };
}

function SchoolRenderer({ school, onDone }) {
  const [progress, setProgress] = useState(0);
  const [wiggle, setWiggle] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / school.duration, 1);
      setProgress(p);
      // Slow tail wag — one full cycle every ~1.8s
      setWiggle(elapsed / 1800 * Math.PI * 2);
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
  // Very gentle vertical sine drift
  const waveY = Math.sin(progress * Math.PI * 2.5) * 12;

  return (
    <>
      {school.fishes.map(fish => (
        <div
          key={fish.id}
          style={{
            position: 'absolute',
            left: currentX + fish.offsetX,
            top: school.baseY + waveY + fish.offsetY,
            pointerEvents: 'none',
          }}
        >
          <FishIcon
            size={fish.size}
            wiggle={wiggle + fish.wiggleOffset}
            facingRight={school.facingRight}
          />
        </div>
      ))}
    </>
  );
}

export default function SwimmingFish() {
  const [schools, setSchools] = useState([]);
  const schoolsRef = useRef([]);
  const timerRef = useRef(null);

  const spawnSchool = () => {
    // Keep max 8 schools alive at once
    if (schoolsRef.current.length >= 8) return;
    const school = generateSchool();
    schoolsRef.current = [...schoolsRef.current, school];
    setSchools([...schoolsRef.current]);
  };

  const scheduleNext = () => {
    // Random interval between 3–7s for frequent-enough presence
    const delay = 3000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      spawnSchool();
      scheduleNext();
    }, delay);
  };

  useEffect(() => {
    // Spawn 3 right away at different times for initial density
    spawnSchool();
    setTimeout(spawnSchool, 1500);
    setTimeout(spawnSchool, 3200);
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, []);

  const removeSchool = (id) => {
    schoolsRef.current = schoolsRef.current.filter(s => s.id !== id);
    setSchools([...schoolsRef.current]);
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {schools.map(school => (
        <SchoolRenderer
          key={school.id}
          school={school}
          onDone={() => removeSchool(school.id)}
        />
      ))}
    </div>
  );
}