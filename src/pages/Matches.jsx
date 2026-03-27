import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, X, Mail, Phone,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MessageCircle, CheckCircle, XCircle, Minus
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtN = (n, dec = 2) => {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: dec });
};

function priceStr(post, isListing) {
  const tx = post.transaction_type;
  const pp = post.price_period;
  const u  = isListing
    ? (tx === 'lease' || tx === 'sublease' ? '/SF/yr' : tx === 'rent' ? '/mo' : '')
    : (pp === 'per_month' ? '/mo' : pp === 'per_sf_per_year' ? '/SF/yr' : pp === 'annually' ? '/yr'
      : (tx === 'lease' || tx === 'rent') ? '/mo' : '');
  if (isListing) { const f = fmtN(post.price); return f ? `$${f}${u}` : null; }
  const lo = fmtN(post.min_price), hi = fmtN(post.max_price);
  if (lo && hi) return `$${lo}–$${hi}${u}`;
  if (hi) return `Up to $${hi}${u}`;
  if (lo) return `From $${lo}${u}`;
  return null;
}

const LEASE_LABELS = {
  full_service_gross:'Full Service Gross', modified_gross:'Modified Gross',
  net_lease:'Net Lease', ground_lease:'Ground Lease', percentage_lease:'Percentage Lease',
  nnn:'NNN (Triple Net)', nn:'NN (Double Net)', n:'N (Single Net)', absolute_net:'Absolute Net',
};
const TX_LABELS = { lease:'Lease', sublease:'Sublease', sale:'Sale', rent:'Rent', purchase:'Purchase' };
const PT_LABELS = {
  office:'General Office', medical_office:'Medical Office', retail:'Retail',
  industrial_flex:'Industrial / Flex', land:'Land', special_use:'Special Use',
  single_family:'Single Family', condo:'Condo', apartment:'Apartment',
  multi_family:'Multi-Family (2–4)', multi_family_5:'Multi-Family (5+)',
  townhouse:'Townhouse', manufactured:'Manufactured / Mobile', land_residential:'Residential Land',
};

// ─────────────────────────────────────────────────────────────────────────────
// Large Score Circle
// ─────────────────────────────────────────────────────────────────────────────
function BigScoreCircle({ score }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const size  = 110;
  const r     = 46;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 700, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginTop: '2px' }}>MATCH</span>
        </div>
      </div>
      {label && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, background: `${color}15`, border: `1px solid ${color}35`, borderRadius: '6px', padding: '3px 10px' }}>
          {label}
        </span>
      )}
    </div>
  );
}

// Small score circle for cards
function SmallScoreCircle({ score }) {
  const color = getScoreColor(score);
  const r = 18, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '11px', fontWeight: 700, color }}>{score}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Range Bar
// ─────────────────────────────────────────────────────────────────────────────
function RangeBar({ value, min, max, label, score, unit = '' }) {
  if (value == null || (min == null && max == null)) return null;
  const color  = getScoreColor(score);
  const lo     = min ?? value * 0.6;
  const hi     = max ?? value * 1.4;
  const pad    = (hi - lo) * 0.3;
  const barMin = Math.max(0, lo - pad);
  const barMax = hi + pad;
  const range  = barMax - barMin;
  if (range === 0) return null;
  const vPct   = Math.max(3, Math.min(97, ((value - barMin) / range) * 100));
  const loPct  = Math.max(0, Math.min(100, ((lo - barMin) / range) * 100));
  const hiPct  = Math.max(0, Math.min(100, ((hi - barMin) / range) * 100));
  const fmt    = (v) => {
    const isDollar = unit.startsWith('/') || unit === '$';
    const prefix   = (unit.startsWith('/') || unit === '') ? '$' : '';
    if (v >= 1000000) return `${prefix}${(v/1000000).toFixed(1)}M`;
    if (v >= 1000) return `${prefix}${Math.round(v/1000)}K`;
    return `${prefix}${Math.round(v).toLocaleString()}`;
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color }}>
          {fmt(value)}{unit.startsWith('/') ? unit : ''}
        </span>
      </div>
      <div style={{ position: 'relative', height: '44px' }}>
        <div style={{ position: 'absolute', top: '18px', left: 0, right: 0, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}>
          <div style={{ position: 'absolute', left: `${loPct}%`, width: `${hiPct - loPct}%`, height: '100%', background: `${color}20`, borderRadius: '4px', border: `1px solid ${color}35` }} />
          <div style={{ position: 'absolute', left: `${vPct}%`, top: '-6px', transform: 'translateX(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: color, border: '3px solid #0E1318', boxShadow: `0 0 10px ${color}70` }} />
        </div>
        <div style={{ position: 'absolute', top: '32px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
          {min != null && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.25)', position: 'absolute', left: `${loPct}%`, transform: 'translateX(-50%)' }}>{fmt(lo)}</span>}
          {max != null && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.25)', position: 'absolute', left: `${hiPct}%`, transform: 'translateX(-50%)' }}>{fmt(hi)}</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakdown Bar
// ─────────────────────────────────────────────────────────────────────────────
function BreakdownBar({ item, expanded, onToggle }) {
  const color = getScoreColor(item.score);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', cursor: item.subScores ? 'pointer' : 'default' }}
        onClick={item.subScores ? onToggle : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '14px' }}>{item.icon}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item.category}</span>
          {item.details && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>· {item.details}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color, minWidth: '36px', textAlign: 'right' }}>{item.score}%</span>
          {item.subScores && (expanded
            ? <ChevronUp style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.3)' }} />
            : <ChevronDown style={{ width: '13px', height: '13px', color: 'rgba(255,255,255,0.3)' }} />)}
        </div>
      </div>
      <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${item.score}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
      {item.subScores && expanded && (
        <div style={{ marginTop: '10px', paddingLeft: '16px', borderLeft: '2px solid rgba(255,255,255,0.07)' }}>
          {item.subScores.map((sub, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                {sub.icon} {sub.label} <span style={{ color: 'rgba(255,255,255,0.25)' }}>· {sub.details}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${sub.score}%`, height: '100%', background: getScoreColor(sub.score) }} />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: getScoreColor(sub.score), minWidth: '28px', textAlign: 'right' }}>{sub.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spec Row — side by side comparison
// ─────────────────────────────────────────────────────────────────────────────
function SpecRow({ label, listingVal, reqVal, icon }) {
  if (!listingVal && !reqVal) return null;
  const match = listingVal && reqVal && String(listingVal).toLowerCase() === String(reqVal).toLowerCase();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: '8px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '2px' }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: listingVal ? 'white' : 'rgba(255,255,255,0.2)', fontWeight: listingVal ? 500 : 400 }}>{listingVal || '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {listingVal && reqVal
          ? match
            ? <CheckCircle style={{ width: '14px', height: '14px', color: ACCENT }} />
            : <Minus style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.2)' }} />
          : <div style={{ width: '14px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
      </div>
      <div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '2px' }}>{label}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: reqVal ? 'white' : 'rgba(255,255,255,0.2)', fontWeight: reqVal ? 500 : 400 }}>{reqVal || '—'}</span>
      </div>
    </div>
  );
}

function SpecSection({ title }) {
  return (
    <div style={{ padding: '12px 0 4px' }}>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{title}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Build full specs for both listing and requirement
// ─────────────────────────────────────────────────────────────────────────────
function buildSpecRows(listing, requirement) {
  const ld = parseDetails(listing);
  const rd = parseDetails(requirement);

  const rows = [];

  // ── Core ──────────────────────────────────────────────────────────────────
  rows.push({ _section: 'Core Details' });
  rows.push({ label: 'Property Type', lv: PT_LABELS[listing.property_type] || listing.property_type, rv: PT_LABELS[requirement.property_type] || requirement.property_type });
  rows.push({ label: 'Transaction', lv: TX_LABELS[listing.transaction_type] || listing.transaction_type, rv: TX_LABELS[requirement.transaction_type] || requirement.transaction_type });
  rows.push({ label: 'Price', lv: priceStr(listing, true), rv: priceStr(requirement, false) });
  rows.push({ label: 'Size', lv: listing.size_sqft ? `${parseFloat(listing.size_sqft).toLocaleString()} SF` : null, rv: (requirement.min_size_sqft || requirement.max_size_sqft) ? `${fmtN(requirement.min_size_sqft)||'0'}–${fmtN(requirement.max_size_sqft)||'∞'} SF` : null });
  rows.push({ label: 'Location', lv: [listing.city, listing.state].filter(Boolean).join(', ') || null, rv: requirement.cities?.join(', ') || null });
  rows.push({ label: 'Zip Code', lv: listing.zip_code || null, rv: null });
  rows.push({ label: 'Address', lv: listing.address || null, rv: null });
  rows.push({ label: 'Status', lv: listing.status || 'Active', rv: requirement.status || 'Active' });

  // ── Lease terms (commercial) ──────────────────────────────────────────────
  if (listing.transaction_type === 'lease' || listing.transaction_type === 'sublease') {
    rows.push({ _section: 'Lease Terms' });
    rows.push({ label: 'Lease Type', lv: LEASE_LABELS[listing.lease_type] || listing.lease_type || null, rv: null });
    if (listing.lease_sub) {
      const sub = Array.isArray(listing.lease_sub) ? listing.lease_sub.join(', ') : listing.lease_sub;
      rows.push({ label: 'Lease Sub-Type', lv: sub, rv: null });
    }
  }

  // ── Office ────────────────────────────────────────────────────────────────
  if (listing.property_type === 'office') {
    rows.push({ _section: 'Office Details' });
    rows.push({ label: 'Suite Number', lv: ld.suite_number || null, rv: null });
    rows.push({ label: 'Private Offices', lv: ld.offices ? String(ld.offices) : null, rv: rd.min_offices ? `Min ${rd.min_offices}${rd.max_offices ? `–${rd.max_offices}` : '+'}` : null });
    rows.push({ label: 'Conference Rooms', lv: ld.conf_rooms ? String(ld.conf_rooms) : null, rv: rd.min_conf_rooms ? `Min ${rd.min_conf_rooms}` : null });
    rows.push({ label: 'In-Suite Restrooms', lv: ld.in_suite_restrooms ? `${ld.in_suite_restrooms} pair(s)` : 'Shared (floor)', rv: rd.insuit_restrooms ? `Required (min ${rd.min_restrooms || 1})` : null });
    rows.push({ label: 'Layout', lv: ld.layout?.replace(/_/g, ' ') || null, rv: rd.layout?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Floor Preference', lv: null, rv: rd.floor_pref?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Ceiling Height', lv: ld.ceiling_height || null, rv: (rd.min_ceiling_height || rd.max_ceiling_height) ? `${rd.min_ceiling_height || ''}${rd.max_ceiling_height ? `–${rd.max_ceiling_height} ft` : '+ ft'}` : null });
    rows.push({ label: 'Building Class', lv: ld.building_class ? `Class ${ld.building_class}` : null, rv: rd.building_classes?.length ? `Class ${rd.building_classes.join('/')}` : null });
    rows.push({ label: 'Parking Ratio', lv: ld.parking_ratio || null, rv: rd.min_parking_ratio || null });
    rows.push({ label: 'Total Parking', lv: ld.total_parking_spaces ? String(ld.total_parking_spaces) : null, rv: rd.min_total_parking_spaces ? `Min ${rd.min_total_parking_spaces}` : null });
    rows.push({ label: 'Dedicated Parking', lv: ld.dedicated_parking ? 'Yes' : null, rv: rd.dedicated_parking_required ? 'Required' : null });
    rows.push({ label: 'IT Infrastructure', lv: ld.it_infrastructure || null, rv: null });
    rows.push({ label: 'Zoning', lv: ld.zoning || null, rv: null });
  }

  // ── Medical Office ────────────────────────────────────────────────────────
  if (listing.property_type === 'medical_office') {
    rows.push({ _section: 'Medical Office Details' });
    rows.push({ label: 'Exam Rooms', lv: ld.exam_rooms ? String(ld.exam_rooms) : null, rv: rd.min_exam_rooms ? `Min ${rd.min_exam_rooms}` : null });
    rows.push({ label: 'Procedure Rooms', lv: ld.procedure_rooms ? String(ld.procedure_rooms) : null, rv: rd.min_procedure_rooms ? `Min ${rd.min_procedure_rooms}` : null });
    rows.push({ label: 'Lab Space', lv: ld.lab_sf ? `${ld.lab_sf} SF` : null, rv: rd.min_lab_sf ? `Min ${rd.min_lab_sf} SF` : null });
    rows.push({ label: 'Waiting Capacity', lv: ld.waiting_capacity ? String(ld.waiting_capacity) : null, rv: rd.min_waiting_capacity ? `Min ${rd.min_waiting_capacity}` : null });
    rows.push({ label: 'X-Ray / Shielding', lv: (ld.medical_features||[]).includes('xray') ? 'Yes' : null, rv: rd.xray_required ? 'Required' : null });
    rows.push({ label: 'Medical Gas Lines', lv: (ld.medical_features||[]).includes('medical_gas') ? 'Yes' : null, rv: rd.medical_gas_required ? 'Required' : null });
    rows.push({ label: 'Sterilization Area', lv: (ld.medical_features||[]).includes('sterilization') ? 'Yes' : null, rv: rd.sterilization_required ? 'Required' : null });
    rows.push({ label: 'ADA Compliant', lv: (ld.medical_features||[]).includes('ada') ? 'Yes' : null, rv: rd.ada_required ? 'Required' : null });
    rows.push({ label: 'HIPAA Layout', lv: (ld.medical_features||[]).includes('hipaa') ? 'Yes' : null, rv: rd.hipaa_required ? 'Required' : null });
    rows.push({ label: 'Building Class', lv: ld.building_class ? `Class ${ld.building_class}` : null, rv: rd.building_classes?.length ? `Class ${rd.building_classes.join('/')}` : null });
    rows.push({ label: 'Total Parking', lv: ld.total_parking_spaces ? String(ld.total_parking_spaces) : null, rv: rd.min_total_parking_spaces ? `Min ${rd.min_total_parking_spaces}` : null });
    rows.push({ label: 'Valet Parking', lv: ld.valet_parking ? 'Yes' : null, rv: rd.valet_parking_required ? 'Required' : null });
    rows.push({ label: 'Zoning', lv: ld.zoning || null, rv: rd.zoning_pref || null });
  }

  // ── Retail ────────────────────────────────────────────────────────────────
  if (listing.property_type === 'retail') {
    rows.push({ _section: 'Retail Details' });
    rows.push({ label: 'Sales Floor', lv: ld.sales_floor_sf ? `${ld.sales_floor_sf} SF` : null, rv: rd.min_sales_floor_sf ? `Min ${rd.min_sales_floor_sf} SF` : null });
    rows.push({ label: 'Street Frontage', lv: ld.frontage ? `${ld.frontage} ft` : null, rv: rd.min_frontage ? `Min ${rd.min_frontage} ft` : null });
    rows.push({ label: 'Ceiling Height', lv: ld.ceiling_height ? `${ld.ceiling_height} ft` : null, rv: rd.min_ceiling_height ? `Min ${rd.min_ceiling_height} ft` : null });
    rows.push({ label: 'Location Type', lv: ld.location_type?.replace(/_/g, ' ') || null, rv: rd.location_type?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Foot Traffic', lv: ld.foot_traffic || null, rv: rd.foot_traffic_pref || null });
    rows.push({ label: 'Traffic Count', lv: ld.traffic_count ? `${parseInt(ld.traffic_count).toLocaleString()}/day` : null, rv: rd.min_traffic_count ? `Min ${parseInt(rd.min_traffic_count).toLocaleString()}/day` : null });
    rows.push({ label: 'Signage Rights', lv: ld.signage_rights || null, rv: rd.signage_pref || null });
    rows.push({ label: 'Drive-Thru', lv: (ld.retail_features||[]).includes('drive_thru') ? 'Yes' : null, rv: (rd.retail_features||[]).includes('drive_thru') ? 'Required' : null });
    rows.push({ label: 'Grease Trap', lv: (ld.retail_features||[]).includes('grease_trap') ? 'Yes' : null, rv: (rd.retail_features||[]).includes('grease_trap') ? 'Required' : null });
    rows.push({ label: 'Cold Storage', lv: (ld.retail_features||[]).includes('cold_storage') ? 'Yes' : null, rv: (rd.retail_features||[]).includes('cold_storage') ? 'Required' : null });
    rows.push({ label: 'Outdoor Seating', lv: (ld.retail_features||[]).includes('outdoor_seating') ? 'Yes' : null, rv: (rd.retail_features||[]).includes('outdoor_seating') ? 'Required' : null });
    rows.push({ label: 'ADA Compliant', lv: ld.ada_compliant ? 'Yes' : null, rv: rd.ada_required ? 'Required' : null });
    rows.push({ label: 'In-Suite Restrooms', lv: ld.in_suite_restrooms ? `${ld.in_suite_restrooms} pair(s)` : null, rv: rd.in_suite_restrooms ? `Required` : null });
    rows.push({ label: 'Total Parking', lv: ld.total_parking_spaces ? String(ld.total_parking_spaces) : null, rv: rd.min_total_parking_spaces ? `Min ${rd.min_total_parking_spaces}` : null });
    rows.push({ label: 'Building Class', lv: ld.building_class ? `Class ${ld.building_class}` : null, rv: rd.building_classes?.length ? `Class ${rd.building_classes.join('/')}` : null });
    rows.push({ label: 'Zoning', lv: ld.zoning || null, rv: rd.zoning_pref || null });
  }

  // ── Industrial / Flex ────────────────────────────────────────────────────
  if (listing.property_type === 'industrial_flex') {
    rows.push({ _section: 'Industrial / Flex Details' });
    rows.push({ label: 'Loading Docks', lv: ld.dock_doors ? String(ld.dock_doors) : null, rv: rd.min_dock_doors ? `Min ${rd.min_dock_doors}` : null });
    rows.push({ label: 'Drive-In Doors', lv: ld.drive_in_doors ? String(ld.drive_in_doors) : null, rv: rd.min_drive_in_doors ? `Min ${rd.min_drive_in_doors}` : null });
    rows.push({ label: 'Clear Height', lv: ld.clear_height ? `${ld.clear_height} ft` : null, rv: rd.min_clear_height ? `Min ${rd.min_clear_height} ft` : null });
    rows.push({ label: 'Truck Court Depth', lv: ld.truck_court_depth ? `${ld.truck_court_depth} ft` : null, rv: rd.min_truck_court_depth ? `Min ${rd.min_truck_court_depth} ft` : null });
    rows.push({ label: 'Floor Load', lv: ld.floor_load ? `${ld.floor_load} lbs/SF` : null, rv: rd.min_floor_load ? `Min ${rd.min_floor_load} lbs/SF` : null });
    rows.push({ label: 'Power Amperage', lv: ld.power_amps || null, rv: rd.min_power_amps || null });
    rows.push({ label: 'Power Voltage', lv: ld.power_voltage || null, rv: rd.required_power_voltage || null });
    rows.push({ label: '3-Phase Power', lv: ld.three_phase ? 'Yes' : null, rv: rd.three_phase_required ? 'Required' : null });
    rows.push({ label: 'Crane System', lv: ld.crane_system || null, rv: rd.min_crane_tons ? `Min ${rd.min_crane_tons} tons` : null });
    rows.push({ label: 'Hook Height', lv: ld.hook_height ? `${ld.hook_height} ft` : null, rv: rd.min_hook_height ? `Min ${rd.min_hook_height} ft` : null });
    rows.push({ label: 'Cross-Dock', lv: ld.cross_dock ? 'Capable' : null, rv: rd.cross_dock_required ? 'Required' : null });
    rows.push({ label: 'Rail Access', lv: ld.rail_access ? 'Yes' : null, rv: rd.rail_access_required ? 'Required' : null });
    rows.push({ label: 'Fenced / Secured Yard', lv: ld.fenced_yard ? 'Yes' : null, rv: rd.fenced_yard_required ? 'Required' : null });
    rows.push({ label: 'Outside Storage', lv: ld.outside_storage ? 'Allowed' : null, rv: rd.outside_storage_required ? 'Required' : null });
    rows.push({ label: 'Gated Access', lv: ld.gated_access ? 'Yes' : null, rv: rd.gated_access_required ? 'Required' : null });
    rows.push({ label: 'Office %', lv: ld.office_pct ? `${ld.office_pct}%` : null, rv: (rd.office_pct_min||rd.office_pct_max) ? `${rd.office_pct_min||0}–${rd.office_pct_max||100}%` : null });
    rows.push({ label: 'Zoning', lv: ld.zoning || null, rv: rd.zoning_pref || null });
  }

  // ── Single Family ────────────────────────────────────────────────────────
  if (listing.property_type === 'single_family') {
    rows.push({ _section: 'Single Family Details' });
    rows.push({ label: 'Bedrooms', lv: ld.bedrooms ? String(ld.bedrooms) : null, rv: (rd.min_bedrooms||rd.max_bedrooms) ? `${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}` : null });
    rows.push({ label: 'Bathrooms', lv: ld.bathrooms ? String(ld.bathrooms) : null, rv: (rd.min_bathrooms||rd.max_bathrooms) ? `${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}` : null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'Lot Size', lv: ld.lot_sqft ? `${parseInt(ld.lot_sqft).toLocaleString()} SF` : null, rv: rd.min_lot_sqft ? `Min ${parseInt(rd.min_lot_sqft).toLocaleString()} SF` : null });
    rows.push({ label: 'Garage', lv: ld.garage ? `${ld.garage} car` : null, rv: rd.min_garage ? `Min ${rd.min_garage} car` : null });
    rows.push({ label: 'Stories', lv: ld.stories?.replace(/_/g, ' ') || null, rv: rd.stories === 'any' ? null : rd.stories?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Basement', lv: ld.basement?.replace(/_/g, ' ') || null, rv: rd.basement === 'not_needed' ? null : rd.basement || null });
    rows.push({ label: 'HOA', lv: ld.hoa ? `$${parseFloat(ld.hoa).toLocaleString()}/mo` : 'None', rv: rd.max_hoa ? `Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo` : null });
    rows.push({ label: 'Heating', lv: ld.heating?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Cooling', lv: ld.cooling?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Pool', lv: (ld.features||[]).includes('pool') ? 'Yes' : null, rv: (rd.must_haves||[]).includes('pool') ? 'Required' : null });
    rows.push({ label: 'Fireplace', lv: (ld.features||[]).includes('fireplace') ? 'Yes' : null, rv: (rd.must_haves||[]).includes('fireplace') ? 'Required' : null });
    rows.push({ label: 'Central A/C', lv: (ld.features||[]).includes('ac') ? 'Yes' : null, rv: (rd.must_haves||[]).includes('ac') ? 'Required' : null });
    rows.push({ label: 'School District', lv: ld.school_district || null, rv: rd.school_district || null });
  }

  // ── Condo ────────────────────────────────────────────────────────────────
  if (listing.property_type === 'condo') {
    rows.push({ _section: 'Condo Details' });
    rows.push({ label: 'Bedrooms', lv: ld.bedrooms ? String(ld.bedrooms) : null, rv: (rd.min_bedrooms||rd.max_bedrooms) ? `${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}` : null });
    rows.push({ label: 'Bathrooms', lv: ld.bathrooms ? String(ld.bathrooms) : null, rv: (rd.min_bathrooms||rd.max_bathrooms) ? `${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}` : null });
    rows.push({ label: 'Unit Number', lv: ld.unit_number || null, rv: null });
    rows.push({ label: 'Floor', lv: ld.floor_num ? `Floor ${ld.floor_num}` : null, rv: rd.floor_pref === 'any' ? null : rd.floor_pref?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Total Floors', lv: ld.total_floors ? String(ld.total_floors) : null, rv: null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'HOA', lv: ld.hoa ? `$${parseFloat(ld.hoa).toLocaleString()}/mo` : null, rv: rd.max_hoa ? `Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo` : null });
    rows.push({ label: 'View', lv: ld.view || null, rv: rd.view_pref === 'any' ? null : rd.view_pref || null });
    rows.push({ label: 'Parking', lv: ld.parking?.replace(/_/g, ' ') || null, rv: rd.parking === 'not_needed' ? null : rd.parking || null });
    rows.push({ label: 'Pet Policy', lv: ld.pet_policy?.replace(/_/g, ' ') || null, rv: rd.pet_policy === 'not_needed' ? null : rd.pet_policy || null });
    rows.push({ label: 'In-Unit Laundry', lv: ld.in_unit_laundry ? 'Yes' : null, rv: (rd.must_haves||[]).includes('in_unit_laundry') ? 'Required' : null });
    rows.push({ label: 'Balcony', lv: ld.balcony ? 'Yes' : null, rv: (rd.must_haves||[]).includes('balcony') ? 'Required' : null });
    rows.push({ label: 'Furnished', lv: ld.furnished || null, rv: rd.furnished === 'any' ? null : rd.furnished || null });
  }

  // ── Apartment ────────────────────────────────────────────────────────────
  if (listing.property_type === 'apartment') {
    rows.push({ _section: 'Apartment Details' });
    rows.push({ label: 'Bedrooms', lv: ld.bedrooms ? String(ld.bedrooms) : null, rv: (rd.min_bedrooms||rd.max_bedrooms) ? `${rd.min_bedrooms||0}–${rd.max_bedrooms||'any'}` : null });
    rows.push({ label: 'Bathrooms', lv: ld.bathrooms ? String(ld.bathrooms) : null, rv: (rd.min_bathrooms||rd.max_bathrooms) ? `${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}` : null });
    rows.push({ label: 'Floor', lv: ld.floor_num ? `Floor ${ld.floor_num}` : null, rv: null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'Lease Term', lv: ld.lease_term ? `${ld.lease_term} months` : null, rv: rd.max_lease_term ? `Max ${rd.max_lease_term} months` : null });
    rows.push({ label: 'Laundry', lv: ld.laundry?.replace(/_/g, ' ') || null, rv: rd.laundry === 'any' ? null : rd.laundry?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Parking', lv: ld.parking?.replace(/_/g, ' ') || null, rv: rd.parking === 'not_needed' ? null : rd.parking || null });
    rows.push({ label: 'Pet Policy', lv: ld.pet_policy?.replace(/_/g, ' ') || null, rv: rd.pet_policy === 'not_needed' ? null : rd.pet_policy || null });
    rows.push({ label: 'Heating', lv: ld.heating?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Cooling', lv: ld.cooling?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Furnished', lv: ld.furnished || null, rv: rd.furnished === 'any' ? null : rd.furnished || null });
  }

  // ── Multi-Family 2-4 ─────────────────────────────────────────────────────
  if (listing.property_type === 'multi_family') {
    rows.push({ _section: 'Multi-Family Details' });
    rows.push({ label: 'Total Units', lv: ld.total_units ? String(ld.total_units) : null, rv: (rd.min_units||rd.max_units) ? `${rd.min_units||1}–${rd.max_units||'any'}` : null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'Gross Monthly Rent', lv: ld.gross_monthly_rent ? `$${parseInt(ld.gross_monthly_rent).toLocaleString()}/mo` : null, rv: null });
    rows.push({ label: 'Cap Rate', lv: ld.cap_rate ? `${ld.cap_rate}%` : null, rv: rd.min_cap_rate ? `Min ${rd.min_cap_rate}%` : null });
    rows.push({ label: 'Occupancy', lv: ld.occupancy_pct ? `${ld.occupancy_pct}%` : null, rv: rd.min_occupancy ? `Min ${rd.min_occupancy}%` : null });
    rows.push({ label: 'Laundry', lv: ld.laundry?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Utility Metering', lv: ld.utility_metering?.replace(/_/g, ' ') || null, rv: null });
    rows.push({ label: 'Owner Occupied', lv: ld.owner_occupied ? 'Yes' : null, rv: rd.owner_occupied === 'either' ? null : rd.owner_occupied || null });
  }

  // ── Multi-Family 5+ ──────────────────────────────────────────────────────
  if (listing.property_type === 'multi_family_5') {
    rows.push({ _section: 'Multi-Family (5+) Details' });
    rows.push({ label: 'Total Units', lv: ld.total_units ? String(ld.total_units) : null, rv: (rd.min_units||rd.max_units) ? `${rd.min_units||1}–${rd.max_units||'any'}` : null });
    rows.push({ label: '# of Buildings', lv: ld.num_buildings ? String(ld.num_buildings) : null, rv: null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'Total Building SF', lv: ld.total_building_sf ? `${parseInt(ld.total_building_sf).toLocaleString()} SF` : null, rv: null });
    rows.push({ label: 'Gross Monthly Rent', lv: ld.gross_monthly_rent ? `$${parseInt(ld.gross_monthly_rent).toLocaleString()}/mo` : null, rv: null });
    rows.push({ label: 'NOI (Annual)', lv: ld.noi ? `$${parseInt(ld.noi).toLocaleString()}` : null, rv: rd.min_noi ? `Min $${parseInt(rd.min_noi).toLocaleString()}` : null });
    rows.push({ label: 'Cap Rate', lv: ld.cap_rate ? `${ld.cap_rate}%` : null, rv: rd.min_cap_rate ? `Min ${rd.min_cap_rate}%` : null });
    rows.push({ label: 'GRM', lv: ld.grm ? String(ld.grm) : null, rv: rd.max_grm ? `Max ${rd.max_grm}` : null });
    rows.push({ label: 'Occupancy', lv: ld.occupancy_pct ? `${ld.occupancy_pct}%` : null, rv: rd.min_occupancy ? `Min ${rd.min_occupancy}%` : null });
    rows.push({ label: 'Utility Metering', lv: ld.utility_metering?.replace(/_/g, ' ') || null, rv: rd.utility_metering === 'any' ? null : rd.utility_metering?.replace(/_/g, ' ') || null });
    rows.push({ label: 'Assumable Financing', lv: ld.assumable_financing ? 'Yes' : null, rv: null });
    rows.push({ label: 'Value-Add Opportunity', lv: ld.value_add ? 'Yes' : null, rv: null });
  }

  // ── Townhouse ────────────────────────────────────────────────────────────
  if (listing.property_type === 'townhouse') {
    rows.push({ _section: 'Townhouse Details' });
    rows.push({ label: 'Bedrooms', lv: ld.bedrooms ? String(ld.bedrooms) : null, rv: (rd.min_bedrooms||rd.max_bedrooms) ? `${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}` : null });
    rows.push({ label: 'Bathrooms', lv: ld.bathrooms ? String(ld.bathrooms) : null, rv: (rd.min_bathrooms||rd.max_bathrooms) ? `${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}` : null });
    rows.push({ label: 'Year Built', lv: ld.year_built ? String(ld.year_built) : null, rv: rd.min_year_built ? `After ${rd.min_year_built}` : null });
    rows.push({ label: 'Garage', lv: ld.garage ? `${ld.garage} car` : null, rv: rd.min_garage ? `Min ${rd.min_garage} car` : null });
    rows.push({ label: 'HOA', lv: ld.hoa ? `$${parseFloat(ld.hoa).toLocaleString()}/mo` : null, rv: rd.max_hoa ? `Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo` : null });
    rows.push({ label: 'Stories', lv: ld.stories?.replace(/_/g, ' ') || null, rv: rd.stories === 'any' ? null : rd.stories || null });
    rows.push({ label: 'Position', lv: ld.position?.replace(/_/g, ' ') || null, rv: rd.position === 'any' ? null : rd.position || null });
    rows.push({ label: 'Basement', lv: ld.basement?.replace(/_/g, ' ') || null, rv: rd.basement === 'not_needed' ? null : rd.basement || null });
    rows.push({ label: 'Rooftop Deck', lv: ld.rooftop ? 'Yes' : null, rv: rd.rooftop === 'not_needed' ? null : rd.rooftop || null });
    rows.push({ label: 'Private Patio', lv: ld.patio ? 'Yes' : null, rv: rd.patio === 'not_needed' ? null : rd.patio || null });
    rows.push({ label: 'In-Unit Laundry', lv: ld.in_unit_laundry ? 'Yes' : null, rv: null });
  }

  // ── Amenities (any type) ─────────────────────────────────────────────────
  const listingAmenities = [...(ld.building_amenities||[]), ...(ld.amenities||[])];
  const reqAmenities     = [...(rd.building_amenities_required||[]), ...(rd.must_haves||[])];
  if (listingAmenities.length || reqAmenities.length) {
    rows.push({ _section: 'Amenities' });
    const allAmenities = [...new Set([...listingAmenities, ...reqAmenities])];
    allAmenities.forEach(a => {
      rows.push({
        label: a.replace(/_/g, ' '),
        lv: listingAmenities.includes(a) ? '✓ Included' : null,
        rv: reqAmenities.includes(a) ? '✓ Required' : null,
      });
    });
  }

  // ── Description ──────────────────────────────────────────────────────────
  if (listing.description || listing.notes || ld.description || rd.intended_use) {
    rows.push({ _section: 'Notes & Description' });
    if (listing.description || ld.description)
      rows.push({ label: 'Listing Notes', lv: listing.description || ld.description || null, rv: null, fullWidth: true });
    if (requirement.notes || rd.intended_use)
      rows.push({ label: 'Requirement Notes', lv: null, rv: requirement.notes || rd.intended_use || null, fullWidth: true });
  }

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// The Modal
// ─────────────────────────────────────────────────────────────────────────────
function MatchModal({ myPost, matchPost, matchResult, posterProfile, matchIndex, totalMatches, onPrev, onNext, onClose }) {
  const [tab, setTab]               = useState('analysis');
  const [expandedBreakdown, setExp] = useState(null);

  const myIsListing = myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const theirColor  = myIsListing ? LAVENDER : ACCENT;

  const listing     = myIsListing ? myPost : matchPost;
  const requirement = myIsListing ? matchPost : myPost;

  const { totalScore, breakdown, rangeData, matchLabel } = matchResult;
  const scoreColor = getScoreColor(totalScore);

  const posterName    = matchPost.contact_agent_name  || posterProfile?.full_name  || matchPost.created_by || 'Agent';
  const posterEmail   = matchPost.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone   = matchPost.contact_agent_phone || posterProfile?.phone;
  const posterCompany = matchPost.company_name        || posterProfile?.brokerage_name;
  const posterPhoto   = posterProfile?.profile_photo_url;

  const specRows = useMemo(() => buildSpecRows(listing, requirement), [listing, requirement]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
      onClick={onClose}>
      <div style={{ background: '#0E1318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', width: '100%', maxWidth: '720px', marginBottom: '16px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Modal Top Bar ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {totalMatches > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', display: 'flex' }}>
                  <ChevronLeft style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.6)' }} />
                </button>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', minWidth: '36px', textAlign: 'center' }}>
                  {matchIndex + 1} / {totalMatches}
                </span>
                <button onClick={onNext} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', display: 'flex' }}>
                  <ChevronRight style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.6)' }} />
                </button>
              </div>
            )}
            {/* Tab switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
              {[{ k: 'analysis', l: 'Match Analysis' }, { k: 'specs', l: 'Full Specs' }].map(t => (
                <button key={t.k} onClick={() => setTab(t.k)}
                  style={{ padding: '6px 14px', background: tab === t.k ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', borderRadius: '6px', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: tab === t.k ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <X style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.5)' }} />
          </button>
        </div>

        {/* ── TAB 1: MATCH ANALYSIS ── */}
        {tab === 'analysis' && (
          <div style={{ padding: '24px' }}>

            {/* Big score + post titles */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
              <BigScoreCircle score={totalScore} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* YOUR POST */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: myColor }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: myColor }}>
                      Your {myIsListing ? 'Listing' : 'Requirement'}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myPost.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: myColor, margin: 0, fontWeight: 600 }}>{priceStr(myPost, myIsListing)}</p>
                </div>
                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>matched with</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>
                {/* THEIR MATCH */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: theirColor }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: theirColor }}>
                      Their {myIsListing ? 'Requirement' : 'Listing'}
                    </span>
                  </div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matchPost.title}</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: theirColor, margin: 0, fontWeight: 600 }}>{priceStr(matchPost, !myIsListing)}</p>
                </div>
              </div>
            </div>

            {/* Range Bars */}
            {(rangeData.price || rangeData.size) && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px 18px 2px', marginBottom: '16px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>
                  How Your Listing Fits Their Range
                </p>
                {rangeData.price && (
                  <RangeBar value={rangeData.price.value} min={rangeData.price.min} max={rangeData.price.max}
                    label={rangeData.price.label} score={rangeData.price.score} unit={rangeData.price.unit} />
                )}
                {rangeData.size && (
                  <RangeBar value={rangeData.size.value} min={rangeData.size.min} max={rangeData.size.max}
                    label="Size (SF)" score={rangeData.size.score} unit="SF" />
                )}
              </div>
            )}

            {/* Score Breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', margin: '0 0 16px' }}>
                Score Breakdown — click any row to expand
              </p>
              {breakdown.map((item, i) => (
                <BreakdownBar key={i} item={item} expanded={expandedBreakdown === i}
                  onToggle={() => setExp(expandedBreakdown === i ? null : i)} />
              ))}
            </div>

            {/* Contact */}
            <div style={{ background: `${theirColor}06`, border: `1px solid ${theirColor}20`, borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', margin: '0 0 12px' }}>
                {myIsListing ? 'Representing Agent' : 'Listing Agent'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: theirColor, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: '16px', fontWeight: 700 }}>
                  {posterPhoto ? <img src={posterPhoto} alt={posterName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : posterName[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'white', margin: 0 }}>{posterName}</p>
                  {posterCompany && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{posterCompany}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {posterEmail && <a href={`mailto:${posterEmail}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theirColor, textDecoration: 'none', padding: '8px 12px', background: `${theirColor}08`, borderRadius: '8px', border: `1px solid ${theirColor}15` }}><Mail style={{ width: '13px', height: '13px', flexShrink: 0 }} />{posterEmail}</a>}
                {posterPhone && <a href={`tel:${posterPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: theirColor, textDecoration: 'none', padding: '8px 12px', background: `${theirColor}08`, borderRadius: '8px', border: `1px solid ${theirColor}15` }}><Phone style={{ width: '13px', height: '13px', flexShrink: 0 }} />{posterPhone}</a>}
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', background: theirColor, border: 'none', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: '#111827', cursor: 'pointer' }}>
                  <MessageCircle style={{ width: '13px', height: '13px' }} /> Send Message
                </button>
              </div>
            </div>

            {/* Hint to Full Specs */}
            <button onClick={() => setTab('specs')}
              style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
              View complete field-by-field specs →
            </button>
          </div>
        )}

        {/* ── TAB 2: FULL SPECS ── */}
        {tab === 'specs' && (
          <div style={{ padding: '20px 24px' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: '8px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: `${myColor}15`, border: `1px solid ${myColor}30`, borderRadius: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: myColor }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: myColor }}>Your {myIsListing ? 'Listing' : 'Requirement'}</span>
                </div>
              </div>
              <div />
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: `${theirColor}15`, border: `1px solid ${theirColor}30`, borderRadius: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theirColor }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: theirColor }}>Their {myIsListing ? 'Requirement' : 'Listing'}</span>
                </div>
              </div>
            </div>

            {specRows.map((row, i) => {
              if (row._section) return <SpecSection key={i} title={row._section} />;
              if (row.fullWidth) {
                const val = row.lv || row.rv;
                return val ? (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>{row.label}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{val}</p>
                  </div>
                ) : null;
              }
              return <SpecRow key={i} label={row.label} listingVal={row.lv} reqVal={row.rv} />;
            })}

            <div style={{ height: '20px' }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Match Group Card
// ─────────────────────────────────────────────────────────────────────────────
function MatchGroupCard({ myPost, matches, onOpen }) {
  const [previewIdx, setPreviewIdx] = useState(0);
  const myIsListing = myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const best        = matches[previewIdx];
  const scoreColor  = getScoreColor(best.totalScore);
  const label       = getScoreLabel(best.totalScore);
  const matchPost   = myIsListing ? best.requirement : best.listing;

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = `${myColor}35`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>

      {/* Your Post row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: myColor, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: myColor }}>
              Your {myIsListing ? 'Listing' : 'Requirement'}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '15px', fontWeight: 500, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {myPost.title}
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {priceStr(myPost, myIsListing)}
            {myIsListing && myPost.size_sqft ? ` · ${parseFloat(myPost.size_sqft).toLocaleString()} SF` : ''}
            {myPost.city ? ` · ${myPost.city}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: `${myColor}10`, border: `1px solid ${myColor}25`, borderRadius: '20px', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: myColor }}>{matches.length}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{matches.length === 1 ? 'match' : 'matches'}</span>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 14px' }} />

      {/* Their Match row */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: myIsListing ? LAVENDER : ACCENT, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)' }}>
              Their {myIsListing ? 'Requirement' : 'Listing'}
            </span>
          </div>
          {matches.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={e => { e.stopPropagation(); setPreviewIdx(i => (i - 1 + matches.length) % matches.length); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer', display: 'flex' }}>
                <ChevronLeft style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.5)' }} />
              </button>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.3)', minWidth: '32px', textAlign: 'center' }}>{previewIdx + 1}/{matches.length}</span>
              <button onClick={e => { e.stopPropagation(); setPreviewIdx(i => (i + 1) % matches.length); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '3px 5px', cursor: 'pointer', display: 'flex' }}>
                <ChevronRight style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SmallScoreCircle score={best.totalScore} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, color: 'white', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {matchPost.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                {priceStr(matchPost, !myIsListing)}
              </span>
              {label && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, color: scoreColor, background: `${scoreColor}12`, border: `1px solid ${scoreColor}30`, borderRadius: '4px', padding: '1px 6px' }}>
                  {label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => onOpen(myPost, best, previewIdx)}
        style={{ width: '100%', padding: '10px', background: `${myColor}10`, border: `1px solid ${myColor}25`, borderRadius: '8px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: myColor, cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = `${myColor}20`; e.currentTarget.style.borderColor = `${myColor}50`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${myColor}10`; e.currentTarget.style.borderColor = `${myColor}25`; }}>
        View Full Match Details
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Matches() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const [modalState, setModalState] = useState(null);

  const { data: myListings = [] }     = useQuery({ queryKey: ['my-listings'],            queryFn: () => base44.entities.Listing.filter({ created_by: user?.email }) });
  const { data: myRequirements = [] } = useQuery({ queryKey: ['my-requirements'],        queryFn: () => base44.entities.Requirement.filter({ created_by: user?.email }) });
  const { data: allListings = [] }    = useQuery({ queryKey: ['all-listings-matches'],   queryFn: () => base44.entities.Listing.list('-created_date', 200) });
  const { data: allRequirements = [] }= useQuery({ queryKey: ['all-requirements-matches'], queryFn: () => base44.entities.Requirement.list('-created_date', 200) });
  const { data: allProfiles = [] }    = useQuery({ queryKey: ['all-user-profiles'],      queryFn: () => base44.entities.UserProfile.list() });

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.user_email, p]));

  const listingGroups = useMemo(() => myListings.map(listing => {
    const matches = allRequirements.filter(r => r.created_by !== user?.email)
      .map(req => { const r = calculateMatchScore(listing, req); return r.isMatch ? { listing, requirement: req, ...r } : null; })
      .filter(Boolean).sort((a, b) => b.totalScore - a.totalScore);
    return matches.length ? { myPost: { ...listing, postType: 'listing' }, matches } : null;
  }).filter(Boolean), [myListings, allRequirements, user?.email]);

  const requirementGroups = useMemo(() => myRequirements.map(req => {
    const matches = allListings.filter(l => l.created_by !== user?.email)
      .map(listing => { const r = calculateMatchScore(listing, req); return r.isMatch ? { listing, requirement: req, ...r } : null; })
      .filter(Boolean).sort((a, b) => b.totalScore - a.totalScore);
    return matches.length ? { myPost: { ...req, postType: 'requirement' }, matches } : null;
  }).filter(Boolean), [myRequirements, allListings, user?.email]);

  const currentGroups = activeTab === 'listings' ? listingGroups : requirementGroups;

  const openModal = (myPost, matchResult, matchIndex) => {
    const groups = myPost.postType === 'listing' ? listingGroups : requirementGroups;
    const group  = groups.find(g => g.myPost.id === myPost.id);
    setModalState({ myPost, matches: group?.matches || [matchResult], matchIndex });
  };

  const navigate = (dir) => {
    if (!modalState) return;
    const total = modalState.matches.length;
    setModalState(s => ({ ...s, matchIndex: (s.matchIndex + dir + total) % total }));
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 300, color: 'white', margin: '0 0 6px' }}>My Matches</h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Matches scoring 30% or higher. Click "View Full Match Details" to see everything.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
        {[
          { key: 'listings',     label: 'My Listings',     color: ACCENT,   Icon: Building2, count: listingGroups.length },
          { key: 'requirements', label: 'My Requirements', color: LAVENDER, Icon: Search,    count: requirementGroups.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: '10px 20px', background: activeTab === t.key ? `${t.color}18` : 'transparent', border: activeTab === t.key ? `1px solid ${t.color}40` : 'none', borderRadius: '7px', color: activeTab === t.key ? t.color : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' }}>
            <t.Icon style={{ width: '15px', height: '15px' }} />
            {t.label}
            <span style={{ padding: '1px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: activeTab === t.key ? `${t.color}22` : 'rgba(255,255,255,0.08)', color: activeTab === t.key ? t.color : 'rgba(255,255,255,0.4)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {currentGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <TrendingUp style={{ width: '48px', height: '48px', color: `${ACCENT}30`, margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 400, color: 'white', margin: '0 0 8px' }}>No matches yet</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {activeTab === 'listings' ? "Your listings haven't matched with any requirements yet" : "Your requirements haven't matched with any listings yet"}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentGroups.map((g, i) => (
            <MatchGroupCard key={i} myPost={g.myPost} matches={g.matches} onOpen={openModal} />
          ))}
        </div>
      )}

      {modalState && (() => {
        const { myPost, matches, matchIndex } = modalState;
        const current     = matches[matchIndex];
        const myIsListing = myPost.postType === 'listing';
        const matchPost   = myIsListing ? current.requirement : current.listing;
        return (
          <MatchModal myPost={myPost} matchPost={matchPost} matchResult={current}
            posterProfile={profileMap[matchPost.created_by]}
            matchIndex={matchIndex} totalMatches={matches.length}
            onPrev={() => navigate(-1)} onNext={() => navigate(1)} onClose={() => setModalState(null)} />
        );
      })()}
    </div>
  );
}