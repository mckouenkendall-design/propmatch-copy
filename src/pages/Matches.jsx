import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import {
  Building2, Search, TrendingUp, X, Mail, Phone,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  MessageCircle, Check, Minus
} from 'lucide-react';
import { calculateMatchScore, getScoreColor, getScoreLabel, parseDetails } from '@/utils/matchScore';

const ACCENT   = '#00DBC5';
const LAVENDER = '#818cf8';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtN = (n) => {
  const num = parseFloat(n);
  if (!n || isNaN(num)) return null;
  return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};
const PT = { office:'General Office', medical_office:'Medical Office', retail:'Retail', industrial_flex:'Industrial/Flex', land:'Land', special_use:'Special Use', single_family:'Single Family', condo:'Condo', apartment:'Apartment', multi_family:'Multi-Family (2–4)', multi_family_5:'Multi-Family (5+)', townhouse:'Townhouse', manufactured:'Manufactured/Mobile', land_residential:'Residential Land' };
const TX = { lease:'Lease', sublease:'Sublease', sale:'Sale', rent:'Rent', purchase:'Purchase' };
const LL = { full_service_gross:'Full Service Gross', modified_gross:'Modified Gross', net_lease:'Net Lease', ground_lease:'Ground Lease', percentage_lease:'Percentage Lease', nnn:'NNN', nn:'NN', n:'N (Single Net)', absolute_net:'Absolute Net' };

function priceStr(post, isListing) {
  const tx = post.transaction_type, pp = post.price_period;
  const u = isListing
    ? (tx==='lease'||tx==='sublease'?'/SF/yr':tx==='rent'?'/mo':'')
    : (pp==='per_month'?'/mo':pp==='per_sf_per_year'?'/SF/yr':pp==='annually'?'/yr':(tx==='lease'||tx==='rent')?'/mo':'');
  if (isListing) { const f=fmtN(post.price); return f?`$${f}${u}`:null; }
  const lo=fmtN(post.min_price),hi=fmtN(post.max_price);
  if(lo&&hi) return `$${lo}–$${hi}${u}`;
  if(hi) return `Up to $${hi}${u}`;
  if(lo) return `From $${lo}${u}`;
  return null;
}

// ─── Big Score Circle ─────────────────────────────────────────────────────────
function BigScoreCircle({ score }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const sz=120, r=48, circ=2*Math.PI*r, dash=(score/100)*circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      <div style={{ position:'relative', width:sz, height:sz }}>
        <svg width={sz} height={sz} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:'34px', fontWeight:700, color, lineHeight:1 }}>{score}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', marginTop:'2px' }}>MATCH</span>
        </div>
      </div>
      {label && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color, background:`${color}15`, border:`1px solid ${color}35`, borderRadius:'6px', padding:'3px 10px' }}>{label}</span>}
    </div>
  );
}

// ─── Range Bar ────────────────────────────────────────────────────────────────
function RangeBar({ value, min, max, label, score, unit='' }) {
  if (value==null||(min==null&&max==null)) return null;
  const color=getScoreColor(score);
  const lo=min??value*0.6, hi=max??value*1.4;
  const pad=(hi-lo)*0.3, barMin=Math.max(0,lo-pad), barMax=hi+pad, range=barMax-barMin;
  if(range===0) return null;
  const vP=Math.max(3,Math.min(97,((value-barMin)/range)*100));
  const loP=Math.max(0,Math.min(100,((lo-barMin)/range)*100));
  const hiP=Math.max(0,Math.min(100,((hi-barMin)/range)*100));
  const fmt=(v)=>v>=1000000?`$${(v/1e6).toFixed(1)}M`:v>=1000?`$${Math.round(v/1000)}K`:`$${Math.round(v).toLocaleString()}`;
  return (
    <div style={{ marginBottom:'18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:700, color }}>{fmt(value)}{unit}</span>
      </div>
      <div style={{ position:'relative', height:'42px' }}>
        <div style={{ position:'absolute', top:'16px', left:0, right:0, height:'8px', background:'rgba(255,255,255,0.06)', borderRadius:'4px' }}>
          <div style={{ position:'absolute', left:`${loP}%`, width:`${hiP-loP}%`, height:'100%', background:`${color}20`, borderRadius:'4px', border:`1px solid ${color}35` }}/>
          <div style={{ position:'absolute', left:`${vP}%`, top:'-6px', transform:'translateX(-50%)', width:'20px', height:'20px', borderRadius:'50%', background:color, border:'3px solid #0E1318', boxShadow:`0 0 10px ${color}60` }}/>
        </div>
        {min!=null&&<span style={{ position:'absolute', top:'30px', left:`${loP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap' }}>{fmt(lo)}</span>}
        {max!=null&&<span style={{ position:'absolute', top:'30px', left:`${hiP}%`, transform:'translateX(-50%)', fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.25)', whiteSpace:'nowrap' }}>{fmt(hi)}</span>}
      </div>
    </div>
  );
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────
function BreakdownBar({ item, expanded, onToggle }) {
  const color = getScoreColor(item.score);
  return (
    <div style={{ marginBottom:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px', cursor:item.subScores?'pointer':'default' }} onClick={item.subScores?onToggle:undefined}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontSize:'13px' }}>{item.icon}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.8)', fontWeight:500 }}>{item.category}</span>
          {item.details&&<span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>· {item.details}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:700, color }}>{item.score}%</span>
          {item.subScores&&(expanded?<ChevronUp style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.3)'}}/>:<ChevronDown style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.3)'}}/>)}
        </div>
      </div>
      <div style={{ width:'100%', height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ width:`${item.score}%`, height:'100%', background:color, borderRadius:'2px', transition:'width 0.5s ease' }}/>
      </div>
      {item.subScores&&expanded&&(
        <div style={{ marginTop:'8px', paddingLeft:'14px', borderLeft:'2px solid rgba(255,255,255,0.07)' }}>
          {item.subScores.map((sub,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>{sub.icon} {sub.label} <span style={{color:'rgba(255,255,255,0.22)'}}>· {sub.details}</span></span>
              <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <div style={{ width:'40px', height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}><div style={{ width:`${sub.score}%`, height:'100%', background:getScoreColor(sub.score) }}/></div>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, color:getScoreColor(sub.score), minWidth:'26px', textAlign:'right' }}>{sub.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Block ───────────────────────────────────────────────────────────────
function PostBlock({ post, isListing, label, color, compact }) {
  const pd = priceStr(post, isListing);
  const chips = [
    isListing ? [post.city,post.state].filter(Boolean).join(', ') : post.cities?.join(', '),
    isListing ? (post.size_sqft?`${parseFloat(post.size_sqft).toLocaleString()} SF`:null) : ((post.min_size_sqft||post.max_size_sqft)?`${fmtN(post.min_size_sqft)||'0'}–${fmtN(post.max_size_sqft)||'∞'} SF`:null),
    TX[post.transaction_type]||post.transaction_type,
    post.property_type ? (PT[post.property_type]||post.property_type) : null,
  ].filter(Boolean);
  return (
    <div style={{ background:`${color}08`, border:`1px solid ${color}22`, borderRadius:'12px', padding:'16px', height:'100%', boxSizing:'border-box' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:color }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color }}>{label}</span>
      </div>
      <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:compact?'14px':'16px', fontWeight:500, color:'white', margin:'0 0 6px', lineHeight:1.3 }}>{post.title}</h3>
      {pd&&<div style={{ fontFamily:"'Inter',sans-serif", fontSize:'18px', fontWeight:700, color, marginBottom:'10px' }}>{pd}</div>}
      <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
        {chips.map((c,i)=>(
          <span key={i} style={{ padding:'2px 8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'5px', fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.5)', textTransform:'capitalize' }}>{c}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Spec Sections Builder ────────────────────────────────────────────────────
function buildSections(listing, req, myIsListing, breakdown) {
  const ld = parseDetails(listing);
  const rd = parseDetails(req);

  // Helper to find score from breakdown by category keyword
  const bScore = (keyword) => {
    const item = breakdown?.find(b => b.category?.toLowerCase().includes(keyword.toLowerCase()));
    return item?.score ?? null;
  };

  const row = (lLabel, lVal, rLabel, rVal) => ({ lLabel, lVal, rLabel, rVal });
  const sections = [];

  // ── Core ────────────────────────────────────────────────────────────────────
  const coreRows = [
    row('Property Type', PT[listing.property_type]||listing.property_type, 'Property Type', PT[req.property_type]||req.property_type),
    row('Transaction', TX[listing.transaction_type]||listing.transaction_type, 'Transaction', TX[req.transaction_type]||req.transaction_type),
    row('Price', priceStr(listing,true), 'Budget', priceStr(req,false)),
    row('Size', listing.size_sqft?`${parseFloat(listing.size_sqft).toLocaleString()} SF`:null, 'Size Range', (req.min_size_sqft||req.max_size_sqft)?`${fmtN(req.min_size_sqft)||'0'}–${fmtN(req.max_size_sqft)||'∞'} SF`:null),
    row('Location', [listing.city,listing.state].filter(Boolean).join(', ')||null, 'Preferred Areas', req.cities?.join(', ')||null),
    row('Address', listing.address||null, null, null),
    row('Zip Code', listing.zip_code||null, null, null),
    row('Status', listing.status||'Active', 'Status', req.status||'Active'),
  ].filter(r=>r.lVal||r.rVal);
  if(coreRows.length) sections.push({ key:'core', title:'Core Details', icon:'📋', scoreHint:null, rows:coreRows });

  // ── Lease Terms ──────────────────────────────────────────────────────────────
  if(listing.transaction_type==='lease'||listing.transaction_type==='sublease') {
    const leaseRows = [
      row('Lease Type', LL[listing.lease_type]||listing.lease_type||null, null, null),
    ];
    const sub = Array.isArray(listing.lease_sub) ? listing.lease_sub.join(', ') : listing.lease_sub;
    if(sub) leaseRows.push(row('Lease Sub-Type', sub, null, null));
    if(leaseRows.some(r=>r.lVal||r.rVal)) sections.push({ key:'lease', title:'Lease Terms', icon:'📄', scoreHint:bScore('Transaction'), rows:leaseRows });
  }

  // ── Property Details (type-specific) ────────────────────────────────────────
  const detailRows = [];
  const pt = listing.property_type;

  if(pt==='office') {
    detailRows.push(row('Suite Number', ld.suite_number||null, null, null));
    detailRows.push(row('Private Offices', ld.offices?String(ld.offices):null, 'Min. Private Offices', rd.min_offices?`Min ${rd.min_offices}${rd.max_offices?`–${rd.max_offices}`:''}`:null));
    detailRows.push(row('Conference Rooms', ld.conf_rooms?String(ld.conf_rooms):null, 'Min. Conference Rooms', rd.min_conf_rooms?`Min ${rd.min_conf_rooms}`:null));
    detailRows.push(row('In-Suite Restrooms', ld.in_suite_restrooms?`${ld.in_suite_restrooms} pair(s)`:'Shared (floor)', 'Restrooms Required', rd.insuit_restrooms?`Required (min ${rd.min_restrooms||1})`:null));
    detailRows.push(row('Layout', ld.layout?.replace(/_/g,' ')||null, 'Layout Preference', rd.layout?.replace(/_/g,' ')||null));
    detailRows.push(row('Ceiling Height', ld.ceiling_height||null, 'Min. Ceiling Height', (rd.min_ceiling_height||rd.max_ceiling_height)?`${rd.min_ceiling_height||''}–${rd.max_ceiling_height||'any'} ft`:null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailRows.push(row('Parking Ratio', ld.parking_ratio||null, 'Min. Parking Ratio', rd.min_parking_ratio||null));
    detailRows.push(row('Total Parking', ld.total_parking_spaces?String(ld.total_parking_spaces):null, 'Min. Parking Spaces', rd.min_total_parking_spaces?`Min ${rd.min_total_parking_spaces}`:null));
    detailRows.push(row('Dedicated Parking', ld.dedicated_parking?'Available':null, 'Dedicated Parking', rd.dedicated_parking_required?'Required':null));
    detailRows.push(row('Floor Preference', null, 'Floor Preference', rd.floor_pref&&rd.floor_pref!=='any'?rd.floor_pref.replace(/_/g,' '):null));
    detailRows.push(row('IT Infrastructure', ld.it_infrastructure||null, null, null));
    detailRows.push(row('Zoning', ld.zoning||null, null, null));
  }
  if(pt==='medical_office') {
    detailRows.push(row('Exam Rooms', ld.exam_rooms?String(ld.exam_rooms):null, 'Min. Exam Rooms', rd.min_exam_rooms?`Min ${rd.min_exam_rooms}`:null));
    detailRows.push(row('Procedure Rooms', ld.procedure_rooms?String(ld.procedure_rooms):null, 'Min. Procedure Rooms', rd.min_procedure_rooms?`Min ${rd.min_procedure_rooms}`:null));
    detailRows.push(row('Lab Space', ld.lab_sf?`${ld.lab_sf} SF`:null, 'Min. Lab Space', rd.min_lab_sf?`Min ${rd.min_lab_sf} SF`:null));
    detailRows.push(row('Waiting Capacity', ld.waiting_capacity?String(ld.waiting_capacity):null, 'Min. Waiting Capacity', rd.min_waiting_capacity?`Min ${rd.min_waiting_capacity}`:null));
    detailRows.push(row('X-Ray Shielding', (ld.medical_features||[]).includes('xray')?'Yes':'No', 'X-Ray Shielding', rd.xray_required?'Required':null));
    detailRows.push(row('Medical Gas Lines', (ld.medical_features||[]).includes('medical_gas')?'Yes':'No', 'Medical Gas Lines', rd.medical_gas_required?'Required':null));
    detailRows.push(row('ADA Compliant', (ld.medical_features||[]).includes('ada')?'Yes':'No', 'ADA Compliant', rd.ada_required?'Required':null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailRows.push(row('Total Parking', ld.total_parking_spaces?String(ld.total_parking_spaces):null, 'Min. Parking', rd.min_total_parking_spaces?`Min ${rd.min_total_parking_spaces}`:null));
    detailRows.push(row('Zoning', ld.zoning||null, 'Zoning Preference', rd.zoning_pref||null));
  }
  if(pt==='retail') {
    detailRows.push(row('Sales Floor', ld.sales_floor_sf?`${ld.sales_floor_sf} SF`:null, 'Min. Sales Floor', rd.min_sales_floor_sf?`Min ${rd.min_sales_floor_sf} SF`:null));
    detailRows.push(row('Street Frontage', ld.frontage?`${ld.frontage} ft`:null, 'Min. Frontage', rd.min_frontage?`Min ${rd.min_frontage} ft`:null));
    detailRows.push(row('Ceiling Height', ld.ceiling_height?`${ld.ceiling_height} ft`:null, 'Min. Ceiling Height', rd.min_ceiling_height?`Min ${rd.min_ceiling_height} ft`:null));
    detailRows.push(row('Location Type', ld.location_type?.replace(/_/g,' ')||null, 'Location Type', rd.location_type?.replace(/_/g,' ')||null));
    detailRows.push(row('Foot Traffic', ld.foot_traffic||null, 'Foot Traffic Preference', rd.foot_traffic_pref||null));
    detailRows.push(row('Traffic Count', ld.traffic_count?`${parseInt(ld.traffic_count).toLocaleString()}/day`:null, 'Min. Traffic Count', rd.min_traffic_count?`Min ${parseInt(rd.min_traffic_count).toLocaleString()}/day`:null));
    detailRows.push(row('ADA Compliant', ld.ada_compliant?'Yes':null, 'ADA Required', rd.ada_required?'Required':null));
    detailRows.push(row('In-Suite Restrooms', ld.in_suite_restrooms?`${ld.in_suite_restrooms} pair(s)`:null, 'Restrooms Required', rd.in_suite_restrooms?'Required':null));
    detailRows.push(row('Parking', ld.total_parking_spaces?String(ld.total_parking_spaces):null, 'Min. Parking', rd.min_total_parking_spaces?`Min ${rd.min_total_parking_spaces}`:null));
    detailRows.push(row('Building Class', ld.building_class?`Class ${ld.building_class}`:null, 'Acceptable Classes', rd.building_classes?.length?`Class ${rd.building_classes.join('/')}`:null));
    detailRows.push(row('Zoning', ld.zoning||null, 'Zoning Preference', rd.zoning_pref||null));
  }
  if(pt==='industrial_flex') {
    detailRows.push(row('Loading Docks', ld.dock_doors?String(ld.dock_doors):null, 'Min. Loading Docks', rd.min_dock_doors?`Min ${rd.min_dock_doors}`:null));
    detailRows.push(row('Drive-In Doors', ld.drive_in_doors?String(ld.drive_in_doors):null, 'Min. Drive-In Doors', rd.min_drive_in_doors?`Min ${rd.min_drive_in_doors}`:null));
    detailRows.push(row('Clear Height', ld.clear_height?`${ld.clear_height} ft`:null, 'Min. Clear Height', rd.min_clear_height?`Min ${rd.min_clear_height} ft`:null));
    detailRows.push(row('Floor Load', ld.floor_load?`${ld.floor_load} lbs/SF`:null, 'Min. Floor Load', rd.min_floor_load?`Min ${rd.min_floor_load} lbs/SF`:null));
    detailRows.push(row('Amperage', ld.power_amps||null, 'Min. Amperage', rd.min_power_amps||null));
    detailRows.push(row('Power Voltage', ld.power_voltage||null, 'Required Voltage', rd.required_power_voltage||null));
    detailRows.push(row('3-Phase Power', ld.three_phase?'Yes':null, '3-Phase Required', rd.three_phase_required?'Required':null));
    detailRows.push(row('Crane System', ld.crane_system||null, 'Min. Crane (tons)', rd.min_crane_tons?`Min ${rd.min_crane_tons} tons`:null));
    detailRows.push(row('Cross-Dock', ld.cross_dock?'Capable':null, 'Cross-Dock', rd.cross_dock_required?'Required':null));
    detailRows.push(row('Rail Access', ld.rail_access?'Yes':null, 'Rail Access', rd.rail_access_required?'Required':null));
    detailRows.push(row('Fenced Yard', ld.fenced_yard?'Yes':null, 'Fenced Yard', rd.fenced_yard_required?'Required':null));
    detailRows.push(row('Gated Access', ld.gated_access?'Yes':null, 'Gated Access', rd.gated_access_required?'Required':null));
    detailRows.push(row('Office %', ld.office_pct?`${ld.office_pct}%`:null, 'Office % Range', (rd.office_pct_min||rd.office_pct_max)?`${rd.office_pct_min||0}–${rd.office_pct_max||100}%`:null));
    detailRows.push(row('Zoning', ld.zoning||null, 'Zoning Preference', rd.zoning_pref||null));
  }
  if(pt==='single_family') {
    detailRows.push(row('Bedrooms', ld.bedrooms?String(ld.bedrooms):null, 'Bedrooms', (rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}`:null));
    detailRows.push(row('Bathrooms', ld.bathrooms?String(ld.bathrooms):null, 'Bathrooms', (rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}`:null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('Lot Size', ld.lot_sqft?`${parseInt(ld.lot_sqft).toLocaleString()} SF`:null, 'Min. Lot Size', rd.min_lot_sqft?`Min ${parseInt(rd.min_lot_sqft).toLocaleString()} SF`:null));
    detailRows.push(row('Garage', ld.garage?`${ld.garage} car`:null, 'Min. Garage', rd.min_garage?`Min ${rd.min_garage} car`:null));
    detailRows.push(row('Stories', ld.stories?.replace(/_/g,' ')||null, 'Stories', rd.stories&&rd.stories!=='any'?rd.stories.replace(/_/g,' '):null));
    detailRows.push(row('Basement', ld.basement?.replace(/_/g,' ')||null, 'Basement', rd.basement&&rd.basement!=='not_needed'?rd.basement:null));
    detailRows.push(row('HOA', ld.hoa?`$${parseFloat(ld.hoa).toLocaleString()}/mo`:'None', 'Max HOA', rd.max_hoa?`Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo`:null));
    detailRows.push(row('Heating', ld.heating?.replace(/_/g,' ')||null, null, null));
    detailRows.push(row('Cooling', ld.cooling?.replace(/_/g,' ')||null, null, null));
    detailRows.push(row('School District', ld.school_district||null, 'School District', rd.school_district||null));
  }
  if(pt==='condo') {
    detailRows.push(row('Bedrooms', ld.bedrooms?String(ld.bedrooms):null, 'Bedrooms', (rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||0}–${rd.max_bedrooms||'any'}`:null));
    detailRows.push(row('Bathrooms', ld.bathrooms?String(ld.bathrooms):null, 'Bathrooms', (rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}`:null));
    detailRows.push(row('Unit Number', ld.unit_number||null, null, null));
    detailRows.push(row('Floor', ld.floor_num?`Floor ${ld.floor_num}`:null, 'Floor Preference', rd.floor_pref&&rd.floor_pref!=='any'?rd.floor_pref.replace(/_/g,' '):null));
    detailRows.push(row('Total Floors', ld.total_floors?String(ld.total_floors):null, null, null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('HOA', ld.hoa?`$${parseFloat(ld.hoa).toLocaleString()}/mo`:null, 'Max HOA', rd.max_hoa?`Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo`:null));
    detailRows.push(row('View', ld.view||null, 'View Preference', rd.view_pref&&rd.view_pref!=='any'?rd.view_pref:null));
    detailRows.push(row('Parking', ld.parking?.replace(/_/g,' ')||null, 'Parking', rd.parking&&rd.parking!=='not_needed'?rd.parking:null));
    detailRows.push(row('Pet Policy', ld.pet_policy?.replace(/_/g,' ')||null, 'Pet Policy', rd.pet_policy&&rd.pet_policy!=='not_needed'?rd.pet_policy:null));
    detailRows.push(row('In-Unit Laundry', ld.in_unit_laundry?'Yes':null, 'In-Unit Laundry', (rd.must_haves||[]).includes('in_unit_laundry')?'Required':null));
    detailRows.push(row('Balcony', ld.balcony?'Yes':null, 'Balcony', (rd.must_haves||[]).includes('balcony')?'Required':null));
    detailRows.push(row('Furnished', ld.furnished||null, 'Furnished', rd.furnished&&rd.furnished!=='any'?rd.furnished:null));
  }
  if(pt==='apartment') {
    detailRows.push(row('Bedrooms', ld.bedrooms?String(ld.bedrooms):null, 'Bedrooms', (rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||0}–${rd.max_bedrooms||'any'}`:null));
    detailRows.push(row('Bathrooms', ld.bathrooms?String(ld.bathrooms):null, 'Bathrooms', (rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}`:null));
    detailRows.push(row('Floor', ld.floor_num?`Floor ${ld.floor_num}`:null, null, null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('Lease Term', ld.lease_term?`${ld.lease_term} months`:null, 'Max Lease Term', rd.max_lease_term?`Max ${rd.max_lease_term} months`:null));
    detailRows.push(row('Laundry', ld.laundry?.replace(/_/g,' ')||null, 'Laundry', rd.laundry&&rd.laundry!=='any'?rd.laundry.replace(/_/g,' '):null));
    detailRows.push(row('Parking', ld.parking?.replace(/_/g,' ')||null, 'Parking', rd.parking&&rd.parking!=='not_needed'?rd.parking:null));
    detailRows.push(row('Pet Policy', ld.pet_policy?.replace(/_/g,' ')||null, 'Pet Policy', rd.pet_policy&&rd.pet_policy!=='not_needed'?rd.pet_policy:null));
    detailRows.push(row('Furnished', ld.furnished||null, 'Furnished', rd.furnished&&rd.furnished!=='any'?rd.furnished:null));
  }
  if(pt==='multi_family'||pt==='multi_family_5') {
    detailRows.push(row('Total Units', ld.total_units?String(ld.total_units):null, 'Unit Count', (rd.min_units||rd.max_units)?`${rd.min_units||1}–${rd.max_units||'any'}`:null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('Cap Rate', ld.cap_rate?`${ld.cap_rate}%`:null, 'Min. Cap Rate', rd.min_cap_rate?`Min ${rd.min_cap_rate}%`:null));
    detailRows.push(row('Occupancy', ld.occupancy_pct?`${ld.occupancy_pct}%`:null, 'Min. Occupancy', rd.min_occupancy?`Min ${rd.min_occupancy}%`:null));
    if(pt==='multi_family_5') {
      detailRows.push(row('NOI (Annual)', ld.noi?`$${parseInt(ld.noi).toLocaleString()}`:null, 'Min. NOI', rd.min_noi?`Min $${parseInt(rd.min_noi).toLocaleString()}`:null));
      detailRows.push(row('GRM', ld.grm?String(ld.grm):null, 'Max. GRM', rd.max_grm?`Max ${rd.max_grm}`:null));
    }
    detailRows.push(row('Utility Metering', ld.utility_metering?.replace(/_/g,' ')||null, 'Metering Preference', rd.utility_metering&&rd.utility_metering!=='any'?rd.utility_metering.replace(/_/g,' '):null));
    detailRows.push(row('Laundry', ld.laundry?.replace(/_/g,' ')||null, null, null));
  }
  if(pt==='townhouse') {
    detailRows.push(row('Bedrooms', ld.bedrooms?String(ld.bedrooms):null, 'Bedrooms', (rd.min_bedrooms||rd.max_bedrooms)?`${rd.min_bedrooms||1}–${rd.max_bedrooms||'any'}`:null));
    detailRows.push(row('Bathrooms', ld.bathrooms?String(ld.bathrooms):null, 'Bathrooms', (rd.min_bathrooms||rd.max_bathrooms)?`${rd.min_bathrooms||1}–${rd.max_bathrooms||'any'}`:null));
    detailRows.push(row('Year Built', ld.year_built?String(ld.year_built):null, 'Min. Year Built', rd.min_year_built?`After ${rd.min_year_built}`:null));
    detailRows.push(row('Garage', ld.garage?`${ld.garage} car`:null, 'Min. Garage', rd.min_garage?`Min ${rd.min_garage} car`:null));
    detailRows.push(row('HOA', ld.hoa?`$${parseFloat(ld.hoa).toLocaleString()}/mo`:null, 'Max HOA', rd.max_hoa?`Max $${parseFloat(rd.max_hoa).toLocaleString()}/mo`:null));
    detailRows.push(row('Stories', ld.stories?.replace(/_/g,' ')||null, 'Stories', rd.stories&&rd.stories!=='any'?rd.stories:null));
    detailRows.push(row('Basement', ld.basement?.replace(/_/g,' ')||null, 'Basement', rd.basement&&rd.basement!=='not_needed'?rd.basement:null));
    detailRows.push(row('Rooftop Deck', ld.rooftop?'Yes':null, 'Rooftop Deck', rd.rooftop&&rd.rooftop!=='not_needed'?rd.rooftop:null));
    detailRows.push(row('Private Patio', ld.patio?'Yes':null, 'Private Patio', rd.patio&&rd.patio!=='not_needed'?rd.patio:null));
  }
  const filteredDetails = detailRows.filter(r=>r.lVal||r.rVal);
  if(filteredDetails.length) sections.push({ key:'details', title:'Property Details', icon:'🏗️', scoreHint:bScore('Details'), rows:filteredDetails });

  // ── Amenities ────────────────────────────────────────────────────────────────
  const listingAmens = [...(ld.building_amenities||[]),...(ld.amenities||[]),...(ld.medical_features||[]),...(ld.retail_features||[])];
  const reqAmens = [...(rd.building_amenities_required||[]),...(rd.must_haves||[])];
  if(listingAmens.length||reqAmens.length) {
    const allA = [...new Set([...listingAmens,...reqAmens])];
    const amenRows = allA.map(a=>row(a.replace(/_/g,' '), listingAmens.includes(a)?'✓ Included':null, a.replace(/_/g,' '), reqAmens.includes(a)?'✓ Required':null)).filter(r=>r.lVal||r.rVal);
    if(amenRows.length) sections.push({ key:'amenities', title:'Amenities & Features', icon:'✨', scoreHint:bScore('Details'), rows:amenRows });
  }

  // ── Notes ────────────────────────────────────────────────────────────────────
  const lDesc = listing.description||ld.description;
  const rDesc = req.notes||rd.intended_use;
  if(lDesc||rDesc) {
    sections.push({ key:'notes', title:'Notes & Description', icon:'📝', scoreHint:null, rows:[
      row('Listing Description', lDesc||null, 'Requirement Notes', rDesc||null),
    ].filter(r=>r.lVal||r.rVal) });
  }

  return sections;
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ section, myIsListing, myColor, theirColor, open, onToggle }) {
  const scoreColor = section.scoreHint!=null ? getScoreColor(section.scoreHint) : null;
  const myLabel  = myIsListing ? 'Your Listing' : 'Your Requirement';
  const theirLabel = myIsListing ? 'Their Requirement' : 'Their Listing';

  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', overflow:'hidden', marginBottom:'8px' }}>
      <button type="button" onClick={onToggle}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:open?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.03)', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'14px' }}>{section.icon}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{section.title}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>{section.rows.length} fields</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {scoreColor&&section.scoreHint!=null&&(
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'11px', fontWeight:700, color:scoreColor, background:`${scoreColor}12`, border:`1px solid ${scoreColor}30`, borderRadius:'5px', padding:'2px 8px' }}>{section.scoreHint}%</span>
          )}
          {open?<ChevronUp style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.4)'}}/>:<ChevronDown style={{width:'14px',height:'14px',color:'rgba(255,255,255,0.4)'}}/>}
        </div>
      </button>
      {open&&(
        <div style={{ padding:'0 16px 12px' }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'8px 0 6px', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom:'4px' }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:myColor }}>{myLabel}</span>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:theirColor }}>{theirLabel}</span>
          </div>
          {section.rows.map((row,i)=>{
            const matches = row.lVal&&row.rVal;
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'7px 0', borderBottom:i<section.rows.length-1?'1px solid rgba(255,255,255,0.04)':'none', alignItems:'start' }}>
                {/* Left — YOUR post */}
                <div>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.3)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.lLabel}</p>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.lVal?'white':'rgba(255,255,255,0.2)', margin:0, fontWeight:row.lVal?400:300, wordBreak:'break-word', lineHeight:1.5 }}>{row.lVal||'—'}</p>
                </div>
                {/* Right — THEIR post */}
                <div style={{ display:'flex', alignItems:'flex-start', gap:'6px' }}>
                  {matches&&<Check style={{ width:'12px',height:'12px',color:ACCENT,flexShrink:0,marginTop:'14px' }}/>}
                  <div>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', color:'rgba(255,255,255,0.3)', margin:'0 0 2px', textTransform:'capitalize' }}>{row.rLabel||row.lLabel}</p>
                    <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'13px', color:row.rVal?'white':'rgba(255,255,255,0.2)', margin:0, fontWeight:row.rVal?400:300, wordBreak:'break-word', lineHeight:1.5 }}>{row.rVal||'—'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Full Match Modal ─────────────────────────────────────────────────────────
function MatchModal({ myPost, matchPost, matchResult, posterProfile, matchIndex, totalMatches, onPrev, onNext, onClose }) {
  const [tab, setTab]     = useState('analysis');
  const [expBreak, setExpBreak] = useState(null);
  const [openSections, setOpenSections] = useState({ core:true });

  const myIsListing = myPost.postType === 'listing';
  const myColor     = myIsListing ? ACCENT : LAVENDER;
  const theirColor  = myIsListing ? LAVENDER : ACCENT;

  const listing     = myIsListing ? myPost : matchPost;
  const requirement = myIsListing ? matchPost : myPost;

  const { totalScore, breakdown, rangeData, matchLabel } = matchResult;

  const posterName    = matchPost.contact_agent_name  || posterProfile?.full_name  || matchPost.created_by || 'Agent';
  const posterEmail   = matchPost.contact_agent_email || posterProfile?.contact_email || posterProfile?.user_email;
  const posterPhone   = matchPost.contact_agent_phone || posterProfile?.phone;
  const posterCompany = matchPost.company_name        || posterProfile?.brokerage_name;
  const posterPhoto   = posterProfile?.profile_photo_url;

  const sections = useMemo(() => buildSections(listing, requirement, myIsListing, breakdown), [listing, requirement]);

  const toggleSection = (key) => setOpenSections(s=>({...s,[key]:!s[key]}));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}>
      <div style={{ background:'#0E1318', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'95vw', height:'90vh', maxWidth:'1200px', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            {totalMatches>1&&(
              <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <button onClick={onPrev} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}>
                  <ChevronLeft style={{ width:'14px',height:'14px',color:'rgba(255,255,255,0.6)' }}/>
                </button>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.4)', minWidth:'40px', textAlign:'center' }}>{matchIndex+1} / {totalMatches}</span>
                <button onClick={onNext} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 7px', cursor:'pointer', display:'flex' }}>
                  <ChevronRight style={{ width:'14px',height:'14px',color:'rgba(255,255,255,0.6)' }}/>
                </button>
              </div>
            )}
            <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'3px' }}>
              {[{k:'analysis',l:'Match Analysis'},{k:'specs',l:'Full Specs'}].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k)}
                  style={{ padding:'7px 16px', background:tab===t.k?'rgba(255,255,255,0.1)':'transparent', border:'none', borderRadius:'6px', fontFamily:"'Inter',sans-serif", fontSize:'12px', fontWeight:500, color:tab===t.k?'white':'rgba(255,255,255,0.4)', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'7px', padding:'6px', cursor:'pointer', display:'flex', flexShrink:0 }}>
            <X style={{ width:'16px',height:'16px',color:'rgba(255,255,255,0.5)' }}/>
          </button>
        </div>

        {/* ── MATCH ANALYSIS — 2×2 grid ── */}
        {tab==='analysis'&&(
          <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:'1px', background:'rgba(255,255,255,0.07)' }}>

            {/* Q1 top-left — YOUR POST */}
            <div style={{ background:'#0E1318', padding:'24px', overflowY:'auto' }}>
              <PostBlock post={myPost} isListing={myIsListing} label={`Your ${myIsListing?'Listing':'Requirement'}`} color={myColor} />
            </div>

            {/* Q2 top-right — THEIR MATCH */}
            <div style={{ background:'#0E1318', padding:'24px', overflowY:'auto' }}>
              <PostBlock post={matchPost} isListing={!myIsListing} label={`Their ${myIsListing?'Requirement':'Listing'}`} color={theirColor} />
            </div>

            {/* Q3 bottom-left — Score Breakdown */}
            <div style={{ background:'#0E1318', padding:'24px', overflowY:'auto' }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', margin:'0 0 16px' }}>Score Breakdown — click to expand</p>
              {breakdown.map((item,i)=>(
                <BreakdownBar key={i} item={item} expanded={expBreak===i} onToggle={()=>setExpBreak(expBreak===i?null:i)}/>
              ))}
            </div>

            {/* Q4 bottom-right — Big score + Ranges + Contact */}
            <div style={{ background:'#0E1318', padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'20px' }}>
              {/* Score */}
              <div style={{ display:'flex', justifyContent:'center' }}>
                <BigScoreCircle score={totalScore}/>
              </div>

              {/* Ranges */}
              {(rangeData.price||rangeData.size)&&(
                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', padding:'16px 16px 2px' }}>
                  <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', margin:'0 0 14px' }}>How It Fits Their Range</p>
                  {rangeData.price&&<RangeBar value={rangeData.price.value} min={rangeData.price.min} max={rangeData.price.max} label={rangeData.price.label} score={rangeData.price.score} unit={rangeData.price.unit}/>}
                  {rangeData.size&&<RangeBar value={rangeData.size.value} min={rangeData.size.min} max={rangeData.size.max} label="Size (SF)" score={rangeData.size.score}/>}
                </div>
              )}

              {/* Contact */}
              <div style={{ background:`${theirColor}06`, border:`1px solid ${theirColor}20`, borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.3)', margin:'0 0 12px' }}>
                  {myIsListing?'Representing Agent':'Listing Agent'}
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <div style={{ width:'40px',height:'40px',borderRadius:'50%',background:theirColor,flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',color:'#111827',fontSize:'16px',fontWeight:700 }}>
                    {posterPhoto?<img src={posterPhoto} alt={posterName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:posterName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:600,color:'white',margin:0 }}>{posterName}</p>
                    {posterCompany&&<p style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0 }}>{posterCompany}</p>}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {posterEmail&&<a href={`mailto:${posterEmail}`} style={{ display:'flex',alignItems:'center',gap:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:theirColor,textDecoration:'none',padding:'7px 10px',background:`${theirColor}08`,borderRadius:'7px',border:`1px solid ${theirColor}15` }}><Mail style={{width:'12px',height:'12px',flexShrink:0}}/>{posterEmail}</a>}
                  {posterPhone&&<a href={`tel:${posterPhone}`} style={{ display:'flex',alignItems:'center',gap:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:theirColor,textDecoration:'none',padding:'7px 10px',background:`${theirColor}08`,borderRadius:'7px',border:`1px solid ${theirColor}15` }}><Phone style={{width:'12px',height:'12px',flexShrink:0}}/>{posterPhone}</a>}
                  <button style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'8px',background:theirColor,border:'none',borderRadius:'7px',fontFamily:"'Inter',sans-serif",fontSize:'12px',fontWeight:600,color:'#111827',cursor:'pointer' }}>
                    <MessageCircle style={{width:'12px',height:'12px'}}/> Send Message
                  </button>
                </div>
              </div>

              <button onClick={()=>setTab('specs')} style={{ padding:'9px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',cursor:'pointer' }}>
                View complete field-by-field specs →
              </button>
            </div>
          </div>
        )}

        {/* ── FULL SPECS — scrollable accordion ── */}
        {tab==='specs'&&(
          <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:'12px', color:'rgba(255,255,255,0.35)', margin:'0 0 16px', lineHeight:1.6 }}>
              Every field from Step 1 and Step 2 — left is <span style={{color:myColor,fontWeight:600}}>your {myIsListing?'listing':'requirement'}</span>, right is <span style={{color:theirColor,fontWeight:600}}>their {myIsListing?'requirement':'listing'}</span>. A <span style={{color:ACCENT}}>✓</span> means both sides filled the same field. Click any section to expand.
            </p>
            {sections.map(s=>(
              <AccordionSection key={s.key} section={s} myIsListing={myIsListing} myColor={myColor} theirColor={theirColor} open={!!openSections[s.key]} onToggle={()=>toggleSection(s.key)}/>
            ))}
            <div style={{height:'20px'}}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Match Group Card ─────────────────────────────────────────────────────────
function MatchGroupCard({ myPost, matches, onOpen }) {
  const [previewIdx,setPreviewIdx] = useState(0);
  const myIsListing = myPost.postType==='listing';
  const myColor     = myIsListing?ACCENT:LAVENDER;
  const best        = matches[previewIdx];
  const scoreColor  = getScoreColor(best.totalScore);
  const label       = getScoreLabel(best.totalScore);
  const matchPost   = myIsListing?best.requirement:best.listing;

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px', transition:'all 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.borderColor=`${myColor}35`;}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>

      {/* Your post */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'14px' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom:'3px' }}>
            <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myColor }}/>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:myColor }}>Your {myIsListing?'Listing':'Requirement'}</span>
          </div>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'15px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{myPost.title}</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)',margin:0 }}>
            {priceStr(myPost,myIsListing)}{myIsListing&&myPost.size_sqft?` · ${parseFloat(myPost.size_sqft).toLocaleString()} SF`:''}{myPost.city?` · ${myPost.city}`:''}
          </p>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'20px',flexShrink:0 }}>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:700,color:myColor }}>{matches.length}</span>
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.35)' }}>{matches.length===1?'match':'matches'}</span>
        </div>
      </div>

      <div style={{ height:'1px',background:'rgba(255,255,255,0.06)',margin:'0 0 14px' }}/>

      {/* Their match */}
      <div style={{ marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'6px',height:'6px',borderRadius:'50%',background:myIsListing?LAVENDER:ACCENT }}/>
            <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'rgba(255,255,255,0.35)' }}>Their {myIsListing?'Requirement':'Listing'}</span>
          </div>
          {matches.length>1&&(
            <div style={{ display:'flex',alignItems:'center',gap:'4px' }}>
              <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i-1+matches.length)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronLeft style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
              <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'11px',color:'rgba(255,255,255,0.3)',minWidth:'32px',textAlign:'center' }}>{previewIdx+1}/{matches.length}</span>
              <button onClick={e=>{e.stopPropagation();setPreviewIdx(i=>(i+1)%matches.length);}} style={{ background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'5px',padding:'3px 5px',cursor:'pointer',display:'flex' }}><ChevronRight style={{width:'12px',height:'12px',color:'rgba(255,255,255,0.5)'}}/></button>
            </div>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {/* Mini score circle */}
          {(() => { const c=getScoreColor(best.totalScore),sz=44,r=18,circ=2*Math.PI*r,dash=(best.totalScore/100)*circ; return (
            <div style={{ position:'relative',width:sz,height:sz,flexShrink:0 }}>
              <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={c} strokeWidth="4" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/></svg>
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'11px',fontWeight:700,color:c }}>{best.totalScore}</span>
              </div>
            </div>
          );})()}
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:500,color:'white',margin:'0 0 2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{matchPost.title}</p>
            <div style={{ display:'flex',alignItems:'center',gap:'6px' }}>
              <span style={{ fontFamily:"'Inter',sans-serif",fontSize:'12px',color:'rgba(255,255,255,0.4)' }}>{priceStr(matchPost,!myIsListing)}</span>
              {label&&<span style={{ fontFamily:"'Inter',sans-serif",fontSize:'10px',fontWeight:700,color:scoreColor,background:`${scoreColor}12`,border:`1px solid ${scoreColor}30`,borderRadius:'4px',padding:'1px 6px' }}>{label}</span>}
            </div>
          </div>
        </div>
      </div>

      <button onClick={()=>onOpen(myPost,best,previewIdx)}
        style={{ width:'100%',padding:'10px',background:`${myColor}10`,border:`1px solid ${myColor}25`,borderRadius:'8px',fontFamily:"'Inter',sans-serif",fontSize:'13px',fontWeight:500,color:myColor,cursor:'pointer',transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.background=`${myColor}20`;e.currentTarget.style.borderColor=`${myColor}50`;}}
        onMouseLeave={e=>{e.currentTarget.style.background=`${myColor}10`;e.currentTarget.style.borderColor=`${myColor}25`;}}>
        View Full Match Details
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Matches() {
  const { user }        = useAuth();
  const [activeTab,setActiveTab] = useState('listings');
  const [modalState,setModalState] = useState(null);

  const { data: myListings=[] }      = useQuery({ queryKey:['my-listings'],             queryFn:()=>base44.entities.Listing.filter({created_by:user?.email}) });
  const { data: myRequirements=[] }  = useQuery({ queryKey:['my-requirements'],         queryFn:()=>base44.entities.Requirement.filter({created_by:user?.email}) });
  const { data: allListings=[] }     = useQuery({ queryKey:['all-listings-matches'],    queryFn:()=>base44.entities.Listing.list('-created_date',200) });
  const { data: allRequirements=[] } = useQuery({ queryKey:['all-requirements-matches'],queryFn:()=>base44.entities.Requirement.list('-created_date',200) });
  const { data: allProfiles=[] }     = useQuery({ queryKey:['all-user-profiles'],       queryFn:()=>base44.entities.UserProfile.list() });

  const profileMap = Object.fromEntries(allProfiles.map(p=>[p.user_email,p]));

  const listingGroups = useMemo(()=>myListings.map(listing=>{
    const matches=allRequirements.filter(r=>r.created_by!==user?.email).map(req=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...listing,postType:'listing'},matches}:null;
  }).filter(Boolean),[myListings,allRequirements,user?.email]);

  const requirementGroups = useMemo(()=>myRequirements.map(req=>{
    const matches=allListings.filter(l=>l.created_by!==user?.email).map(listing=>{const r=calculateMatchScore(listing,req);return r.isMatch?{listing,requirement:req,...r}:null;}).filter(Boolean).sort((a,b)=>b.totalScore-a.totalScore);
    return matches.length?{myPost:{...req,postType:'requirement'},matches}:null;
  }).filter(Boolean),[myRequirements,allListings,user?.email]);

  const currentGroups = activeTab==='listings'?listingGroups:requirementGroups;

  const openModal=(myPost,matchResult,matchIndex)=>{
    const groups=myPost.postType==='listing'?listingGroups:requirementGroups;
    const group=groups.find(g=>g.myPost.id===myPost.id);
    setModalState({myPost,matches:group?.matches||[matchResult],matchIndex});
  };
  const navigate=(dir)=>{ if(!modalState)return; const t=modalState.matches.length; setModalState(s=>({...s,matchIndex:(s.matchIndex+dir+t)%t})); };

  return (
    <div style={{ maxWidth:'860px',margin:'0 auto',padding:'48px 32px' }}>
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'32px',fontWeight:300,color:'white',margin:'0 0 6px' }}>My Matches</h1>
        <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>Matches scoring 30% or higher. Click any card to open the full analysis.</p>
      </div>

      <div style={{ display:'inline-flex',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'4px',marginBottom:'28px' }}>
        {[{key:'listings',label:'My Listings',color:ACCENT,Icon:Building2,count:listingGroups.length},{key:'requirements',label:'My Requirements',color:LAVENDER,Icon:Search,count:requirementGroups.length}].map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            style={{ padding:'10px 20px',background:activeTab===t.key?`${t.color}18`:'transparent',border:activeTab===t.key?`1px solid ${t.color}40`:'none',borderRadius:'7px',color:activeTab===t.key?t.color:'rgba(255,255,255,0.5)',cursor:'pointer',fontFamily:"'Inter',sans-serif",fontSize:'14px',fontWeight:500,display:'flex',alignItems:'center',gap:'8px',transition:'all 0.15s' }}>
            <t.Icon style={{width:'15px',height:'15px'}}/>{t.label}
            <span style={{ padding:'1px 7px',borderRadius:'12px',fontSize:'11px',fontWeight:700,background:activeTab===t.key?`${t.color}22`:'rgba(255,255,255,0.08)',color:activeTab===t.key?t.color:'rgba(255,255,255,0.4)' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {currentGroups.length===0?(
        <div style={{ textAlign:'center',padding:'80px 32px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px' }}>
          <TrendingUp style={{width:'48px',height:'48px',color:`${ACCENT}30`,margin:'0 auto 16px',display:'block'}}/>
          <h3 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'20px',fontWeight:400,color:'white',margin:'0 0 8px' }}>No matches yet</h3>
          <p style={{ fontFamily:"'Inter',sans-serif",fontSize:'14px',color:'rgba(255,255,255,0.4)',margin:0 }}>{activeTab==='listings'?"Your listings haven't matched with any requirements yet":"Your requirements haven't matched with any listings yet"}</p>
        </div>
      ):(
        <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
          {currentGroups.map((g,i)=><MatchGroupCard key={i} myPost={g.myPost} matches={g.matches} onOpen={openModal}/>)}
        </div>
      )}

      {modalState&&(()=>{
        const {myPost,matches,matchIndex}=modalState;
        const current=matches[matchIndex];
        const myIsListing=myPost.postType==='listing';
        const matchPost=myIsListing?current.requirement:current.listing;
        return <MatchModal myPost={myPost} matchPost={matchPost} matchResult={current} posterProfile={profileMap[matchPost.created_by]} matchIndex={matchIndex} totalMatches={matches.length} onPrev={()=>navigate(-1)} onNext={()=>navigate(1)} onClose={()=>setModalState(null)}/>;
      })()}
    </div>
  );
}