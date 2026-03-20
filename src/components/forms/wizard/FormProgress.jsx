import React from 'react';
import { Check } from 'lucide-react';

export default function FormProgress({ currentStep, steps }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: done || active ? 'var(--tiffany-blue)' : '#e5e7eb',
                  color: done || active ? 'white' : '#9ca3af',
                }}
              >
                {done ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className="text-xs mt-1 whitespace-nowrap" style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: active ? 500 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mb-4 rounded transition-all duration-300"
                style={{ backgroundColor: done ? 'var(--tiffany-blue)' : '#e5e7eb' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}