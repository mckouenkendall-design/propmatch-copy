import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ACCENT = '#00DBC5';

export default function RoleChangeModal({ onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0E1318',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(0,219,197,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertTriangle size={24} color={ACCENT} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '22px',
            fontWeight: 500,
            color: '#FFFFFF',
            margin: '0 0 12px',
            lineHeight: 1.3,
          }}
        >
          Switch to Principal Broker?
        </h2>

        {/* Message */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.6,
            margin: '0 0 28px',
          }}
        >
          Changing your role to <strong style={{ color: ACCENT }}>Principal Broker</strong> requires
          a subscription upgrade. You'll be redirected to select your brokerage plan.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              background: ACCENT,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}