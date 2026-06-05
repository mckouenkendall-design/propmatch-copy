// ─────────────────────────────────────────────────────────────────────────────
// PropMatch Scoring Engine
// Compares a Listing against a Requirement and returns a 0-100 match score
// with a full breakdown by category.
// ─────────────────────────────────────────────────────────────────────────────

export function parseDetails(post) {
  if (!post?.property_details) return {};
  if (typeof post.property_details === 'string') {
    try { return JSON.parse(post.property_details); } catch { return {}; }
  }
  return post.property_details;
}

// Score a numeric value against a min/max range — returns 0-100 or null
export function scoreRange(value, min, max) {
  const v   = parseFloat(value);
  const lo  = (min != null && min !== '' && parseFloat(min) > 0) ? parseFloat(min) : null;
  const hi  = (max != null && max !== '' && parseFloat(max) > 0) ? parseFloat(max) : null;

  if (isNaN(v) || v === 0) return null;
  if (lo === null && hi === null) return null;

  if (lo !== null && hi !== null) {
    if (v >= lo && v <= hi) return 100;
    if (v < lo) return Math.max(0, Math.round(100 - ((lo - v) / lo) * 100));
    return Math.max(0, Math.round(100 - ((v - hi) / hi) * 150)); // penalise over-budget harder
  }
  if (lo !== null) {
    if (v >= lo) return 100;
    return Math.max(0, Math.round(100 - ((lo - v) / lo) * 100));
  }
  if (hi !== null) {
    if (v <= hi) return 100;
    return Math.max(0, Math.round(100 - ((v - hi) / hi) * 150));
  }
  return null;
}

// Price-specific scoring. Same as scoreRange but treats under-budget as 100 (never penalised).
// Reason: paying less than the client's budget is never a downside. Only over-budget hurts.
export function scorePriceRange(value, min, max) {
  const v   = parseFloat(value);
  const lo  = (min != null && min !== '' && parseFloat(min) > 0) ? parseFloat(min) : null;
  const hi  = (max != null && max !== '' && parseFloat(max) > 0) ? parseFloat(max) : null;
  if (isNaN(v) || v === 0) return null;
  if (lo === null && hi === null) return null;
  // Below min: still a 100 — under budget is always fine.
  if (lo !== null && v < lo) return 100;
  // In range: 100.
  if ((lo === null || v >= lo) && (hi === null || v <= hi)) return 100;
  // Over max: graduated falloff, 1.5x penalty (consistent with scoreRange's over-budget side).
  if (hi !== null && v > hi) return Math.max(0, Math.round(100 - ((v - hi) / hi) * 150));
  return null;
}

// Transaction compatibility
function scoreTx(listingTx, reqTx) {
  if (!listingTx || !reqTx) return null;
  if (listingTx === reqTx) return 100;
  if ((listingTx === 'lease' || listingTx === 'sublease') &&
      (reqTx    === 'lease' || reqTx    === 'sublease')) return 80;
  if (listingTx === 'sale' && reqTx === 'purchase') return 100;
  return 0;
}

// Location score — ANY single city match = 100. Having more preferred areas never penalizes.
function scoreLoc(listingCity, reqCities) {
  let cities = reqCities;
  if (typeof cities === 'string') {
    try {
      cities = JSON.parse(cities);
    } catch {
      // Handle plain comma-separated string: "Auburn Hills, Troy, Rochester"
      cities = cities.split(',').map(c => c.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(cities) || cities.length === 0) return null;
  if (!listingCity) return 0;
  const lc = listingCity.toLowerCase().trim();
  // Any preferred city matching the listing city = 100%.
  // Also handles "City, State" vs plain "City" format mismatch.
  const hit = cities.some(c => {
    const cc = c.toLowerCase().trim();
    return cc === lc ||
      cc.startsWith(lc + ',') ||
      lc.startsWith(cc + ',');
  });
  return hit ? 100 : 0;
}

// Amenity / feature overlap — bonus pool curve, not flat percentage.
// Amenities are nice-to-haves, scored generously so missing one or two
// doesn't catastrophically drop the score.
// Curve: 100% match → 100, 75% → 90, 50% → 75, 25% → 55, 0% → 15.
function scoreAmenities(listingSet, requiredSet) {
  if (!requiredSet?.length) return null;
  const matched = (listingSet || []).filter(a => requiredSet.includes(a)).length;
  const pct = matched / requiredSet.length;
  if (pct >= 1.0)  return 100;
  if (pct >= 0.75) return 90;
  if (pct >= 0.50) return 75;
  if (pct >= 0.25) return 55;
  return 15;
}

// ── Property-type detail scoring ──────────────────────────────────────────────
function scoreDetails(listing, requirement, ld, rd) {
  const type   = listing.property_type;
  const scores = [];

  const add = (label, score, details = '', icon = '') => {
    if (score !== null && score !== undefined) {
      scores.push({ label, score: Math.round(Math.max(0, Math.min(100, score))), details, icon });
    }
  };

  // ── OFFICE ──────────────────────────────────────────────────────────────────
  if (type === 'office') {
    add('Private Offices',
      scoreRange(ld.offices, rd.min_offices, rd.max_offices),
      `${ld.offices ?? '—'} offices`, '🏢');
    add('Conference Rooms',
      scoreRange(ld.conf_rooms, rd.min_conf_rooms, rd.max_conf_rooms),
      `${ld.conf_rooms ?? '—'} rooms`, '📋');
    if (rd.building_classes?.length && ld.building_class)
      add('Building Class', rd.building_classes.includes(ld.building_class) ? 100 : 20,
        `Class ${ld.building_class}`, '🏛️');
    if (rd.insuit_restrooms && ld.in_suite_restrooms !== undefined)
      add('In-Suite Restrooms', ld.in_suite_restrooms ? 100 : 0,
        ld.in_suite_restrooms ? 'Available' : 'Not available', '🚻');
    const bAmenScore = scoreAmenities(ld.building_amenities, rd.building_amenities_required);
    if (bAmenScore !== null) {
      const matched = (ld.building_amenities || []).filter(a => rd.building_amenities_required.includes(a));
      add('Building Amenities', bAmenScore, `${matched.length}/${rd.building_amenities_required.length} required`, '✨');
    }
    add('Parking Spaces',
      scoreRange(ld.total_parking_spaces, rd.min_total_parking_spaces, rd.max_parking),
      `${ld.total_parking_spaces ?? '—'} spaces`, '🚗');
  }

  // ── MEDICAL OFFICE ───────────────────────────────────────────────────────────
  if (type === 'medical_office') {
    add('Exam Rooms',    scoreRange(ld.exam_rooms,       rd.min_exam_rooms,       null), `${ld.exam_rooms ?? '—'}`, '🏥');
    add('Procedure Rooms', scoreRange(ld.procedure_rooms, rd.min_procedure_rooms, null), `${ld.procedure_rooms ?? '—'}`, '⚕️');
    add('Lab Space',     scoreRange(ld.lab_sf,           rd.min_lab_sf,           null), `${ld.lab_sf ?? '—'} SF`, '🔬');
    add('Waiting Capacity', scoreRange(ld.waiting_capacity, rd.min_waiting_capacity, null), `${ld.waiting_capacity ?? '—'} seats`, '👥');
    if (rd.building_classes?.length && ld.building_class)
      add('Building Class', rd.building_classes.includes(ld.building_class) ? 100 : 20, `Class ${ld.building_class}`, '🏛️');
    const medFeats = ['xray','medical_gas','sterilization','ada','hipaa'];
    const reqMedFeats = medFeats.filter(f => rd[f + '_required']);
    if (reqMedFeats.length) {
      const matched = reqMedFeats.filter(f => (ld.medical_features || []).includes(f));
      add('Medical Features', Math.round((matched.length / reqMedFeats.length) * 100),
        `${matched.length}/${reqMedFeats.length} required`, '⚕️');
    }
  }

  // ── RETAIL ───────────────────────────────────────────────────────────────────
  if (type === 'retail') {
    add('Traffic Count', scoreRange(ld.traffic_count, rd.min_traffic_count, null),
      `${(ld.traffic_count || 0).toLocaleString()}/day`, '🚗');
    add('Street Frontage', scoreRange(ld.frontage, rd.min_frontage, null), `${ld.frontage ?? '—'}ft`, '📏');
    add('Ceiling Height', scoreRange(ld.ceiling_height, rd.min_ceiling_height, null), `${ld.ceiling_height ?? '—'}ft`, '📐');
    if (rd.location_type && ld.location_type)
      add('Location Type', ld.location_type === rd.location_type ? 100 : 40, ld.location_type, '📍');
    if (rd.foot_traffic_pref && ld.foot_traffic)
      add('Foot Traffic', ld.foot_traffic === rd.foot_traffic_pref || rd.foot_traffic_pref === 'any' ? 100 : 40,
        ld.foot_traffic, '🚶');
    const featScore = scoreAmenities(ld.retail_features, rd.retail_features);
    if (featScore !== null) {
      const hit = (ld.retail_features || []).filter(f => rd.retail_features.includes(f));
      add('Required Features', featScore, `${hit.length}/${rd.retail_features.length} features`, '⚡');
    }
    add('Parking', scoreRange(ld.total_parking_spaces, rd.min_total_parking_spaces, null),
      `${ld.total_parking_spaces ?? '—'} spaces`, '🅿️');
  }

  // ── INDUSTRIAL / FLEX ────────────────────────────────────────────────────────
  if (type === 'industrial_flex') {
    add('Loading Docks',   scoreRange(ld.dock_doors,    rd.min_dock_doors,    null), `${ld.dock_doors ?? '—'}`, '🚛');
    add('Drive-In Doors',  scoreRange(ld.drive_in_doors, rd.min_drive_in_doors, null), `${ld.drive_in_doors ?? '—'}`, '🚪');
    add('Clear Height',    scoreRange(ld.clear_height,  rd.min_clear_height,  null), `${ld.clear_height ?? '—'}ft`, '📐');
    add('Truck Court Depth', scoreRange(ld.truck_court_depth, rd.min_truck_court_depth, null), `${ld.truck_court_depth ?? '—'}ft`, '🛣️');
    add('Floor Load',      scoreRange(ld.floor_load,    rd.min_floor_load,    null), `${ld.floor_load ?? '—'} lbs/SF`, '🏋️');
    add('Crane Capacity',  scoreRange(ld.crane_system ? parseFloat(ld.crane_system) : null, rd.min_crane_tons, null),
      ld.crane_system ?? '—', '🏗️');
    if (rd.three_phase_required)
      add('3-Phase Power', ld.three_phase ? 100 : 0, ld.three_phase ? 'Available' : 'Not available', '⚡');
    if (rd.rail_access_required)
      add('Rail Access', ld.rail_access ? 100 : 0, ld.rail_access ? 'Available' : 'Not available', '🚂');
    if (rd.fenced_yard_required)
      add('Fenced Yard', ld.fenced_yard ? 100 : 0, ld.fenced_yard ? 'Available' : 'Not available', '🔒');
    if (rd.cross_dock_required)
      add('Cross-Dock', ld.cross_dock ? 100 : 0, ld.cross_dock ? 'Capable' : 'Not capable', '↔️');
    const sysScore = scoreAmenities(ld.systems, rd.required_systems);
    if (sysScore !== null) {
      const hit = (ld.systems || []).filter(s => rd.required_systems.includes(s));
      add('Required Systems', sysScore, `${hit.length}/${rd.required_systems.length} systems`, '⚙️');
    }
  }

  // ── LAND (Commercial) ────────────────────────────────────────────────────────
  if (type === 'land') {
    add('Acreage', scoreRange(ld.acres, rd.min_acres, rd.max_acres), `${ld.acres ?? '—'} acres`, '🌿');
    add('Road Frontage', scoreRange(ld.road_frontage, rd.min_road_frontage, rd.max_road_frontage), `${ld.road_frontage ?? '—'}ft`, '🛣️');
    add('Traffic Count', scoreRange(ld.traffic_count, rd.min_traffic_count, null), `${(ld.traffic_count || 0).toLocaleString()}/day`, '🚗');
    add('Max Build SF', scoreRange(ld.max_build_sf, rd.min_build_sf, null), `${(ld.max_build_sf || 0).toLocaleString()} SF`, '📐');
    const utilScore = scoreAmenities(ld.utilities_to_site, rd.utilities_required);
    if (utilScore !== null) {
      const hit = (ld.utilities_to_site || []).filter(u => rd.utilities_required.includes(u));
      add('Utilities at Site', utilScore, `${hit.length}/${rd.utilities_required.length} required`, '🔌');
    }
    if (rd.entitlements_preferred?.length && ld.entitlements)
      add('Entitlements', rd.entitlements_preferred.some(e => ld.entitlements?.toLowerCase().includes(e.toLowerCase())) ? 100 : 40,
        ld.entitlements, '📋');
  }

  // ── SPECIAL USE ──────────────────────────────────────────────────────────────
  if (type === 'special_use') {
    add('Total SF', scoreRange(ld.total_sf, rd.min_total_sf, rd.max_total_sf), `${(ld.total_sf || 0).toLocaleString()} SF`, '📐');
    add('Seating Capacity', scoreRange(ld.seating_capacity, rd.min_seating_capacity, rd.max_seating_capacity), `${ld.seating_capacity ?? '—'} seats`, '💺');
    add('Bed/Room Count', scoreRange(ld.bed_room_count, rd.min_bed_room_count, rd.max_bed_room_count), `${ld.bed_room_count ?? '—'}`, '🛏️');
    const infra = ['commercial_kitchen','stage_platform','gymnasium','assembly_hall','sound_acoustic','commercial_laundry','elevator_access'];
    const reqInfra = infra.filter(k => rd[k + '_required']);
    if (reqInfra.length) {
      const matched = reqInfra.filter(k => ld[k]);
      add('Specialty Features', Math.round((matched.length / reqInfra.length) * 100), `${matched.length}/${reqInfra.length}`, '⭐');
    }
  }

  // ── SINGLE FAMILY ────────────────────────────────────────────────────────────
  if (type === 'single_family') {
    add('Bedrooms', scoreRange(ld.bedrooms, rd.min_bedrooms, rd.max_bedrooms), `${ld.bedrooms ?? '—'} beds`, '🛏️');
    add('Bathrooms', scoreRange(ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms), `${ld.bathrooms ?? '—'} baths`, '🚿');
    add('Garage Spaces', scoreRange(ld.garage, rd.min_garage, null), `${ld.garage ?? '—'} spaces`, '🚗');
    add('Lot Size', scoreRange(ld.lot_sqft, rd.min_lot_sqft, null), `${(ld.lot_sqft || 0).toLocaleString()} SF`, '🌿');
    if (rd.min_year_built && ld.year_built)
      add('Year Built', ld.year_built >= rd.min_year_built ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_year_built - ld.year_built) / 20) * 100)),
        `Built ${ld.year_built}`, '📅');
    if (rd.max_hoa !== undefined && ld.hoa !== undefined)
      add('HOA', scoreRange(ld.hoa, 0, rd.max_hoa || null) ?? 100, `$${ld.hoa ?? 0}/mo`, '💰');
    const mustHaveScore = scoreAmenities(
      (ld.features || []).concat(Object.keys(ld).filter(k => ld[k] === true)),
      rd.must_haves
    );
    if (mustHaveScore !== null) {
      const hit = (rd.must_haves || []).filter(k => ld.features?.includes(k) || ld[k]);
      add('Must-Have Features', mustHaveScore, `${hit.length}/${rd.must_haves.length} features`, '✅');
    }
    if (rd.stories && ld.stories && rd.stories !== 'any')
      add('Stories', ld.stories === rd.stories ? 100 : 50, ld.stories, '🏠');
    if (rd.basement && ld.basement && rd.basement !== 'not_needed')
      add('Basement', (ld.basement !== 'none' && rd.basement === 'required') ? 100 :
        (ld.basement !== 'none') ? 80 : 0, ld.basement, '🏚️');
  }

  // ── CONDO ────────────────────────────────────────────────────────────────────
  if (type === 'condo') {
    add('Bedrooms', scoreRange(ld.bedrooms, rd.min_bedrooms, rd.max_bedrooms), `${ld.bedrooms ?? '—'} beds`, '🛏️');
    add('Bathrooms', scoreRange(ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms), `${ld.bathrooms ?? '—'} baths`, '🚿');
    if (rd.max_hoa && ld.hoa)
      add('HOA', scoreRange(ld.hoa, 0, rd.max_hoa), `$${ld.hoa}/mo`, '💰');
    if (rd.min_year_built && ld.year_built)
      add('Year Built', ld.year_built >= rd.min_year_built ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_year_built - ld.year_built) / 20) * 100)),
        `Built ${ld.year_built}`, '📅');
    if (rd.parking && ld.parking && rd.parking !== 'not_needed')
      add('Parking', ld.parking !== 'none' ? 100 : 0, ld.parking, '🚗');
    if (rd.pet_policy === 'required')
      add('Pet Policy', ld.pet_policy === 'allowed' ? 100 : 0, ld.pet_policy ?? '—', '🐾');
    const mustHaveScore = scoreAmenities(ld.amenities, rd.must_haves);
    if (mustHaveScore !== null) {
      const hit = (rd.must_haves || []).filter(k => (ld.amenities || []).includes(k) || ld[k]);
      add('Must-Have Amenities', mustHaveScore, `${hit.length}/${rd.must_haves.length}`, '✅');
    }
  }

  // ── APARTMENT ────────────────────────────────────────────────────────────────
  if (type === 'apartment') {
    add('Bedrooms', scoreRange(ld.bedrooms, rd.min_bedrooms, rd.max_bedrooms), `${ld.bedrooms ?? '—'} beds`, '🛏️');
    add('Bathrooms', scoreRange(ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms), `${ld.bathrooms ?? '—'} baths`, '🚿');
    if (rd.laundry) {
      const laundryMatch = { in_unit: 2, in_building: 1, none: 0 };
      const reqL = laundryMatch[rd.laundry] ?? 0;
      const listL = laundryMatch[ld.laundry] ?? 0;
      if (rd.laundry !== 'any') add('Laundry', listL >= reqL ? 100 : listL > 0 ? 50 : 0, ld.laundry ?? '—', '👕');
    }
    if (rd.parking && ld.parking && rd.parking !== 'not_needed')
      add('Parking', ld.parking !== 'none' ? 100 : 0, ld.parking, '🚗');
    if (rd.pet_policy === 'required')
      add('Pet Policy', ld.pet_policy === 'allowed' ? 100 : 0, ld.pet_policy ?? '—', '🐾');
    const mustHaveScore = scoreAmenities(ld.amenities, rd.must_haves);
    if (mustHaveScore !== null) {
      const hit = (rd.must_haves || []).filter(k => (ld.amenities || []).includes(k));
      add('Must-Have Amenities', mustHaveScore, `${hit.length}/${rd.must_haves.length}`, '✅');
    }
  }

  // ── TOWNHOUSE ────────────────────────────────────────────────────────────────
  if (type === 'townhouse') {
    add('Bedrooms', scoreRange(ld.bedrooms, rd.min_bedrooms, rd.max_bedrooms), `${ld.bedrooms ?? '—'} beds`, '🛏️');
    add('Bathrooms', scoreRange(ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms), `${ld.bathrooms ?? '—'} baths`, '🚿');
    add('Garage', scoreRange(ld.garage, rd.min_garage, null), `${ld.garage ?? '—'} spaces`, '🚗');
    if (rd.max_hoa && ld.hoa) add('HOA', scoreRange(ld.hoa, 0, rd.max_hoa), `$${ld.hoa}/mo`, '💰');
    if (rd.rooftop && rd.rooftop !== 'not_needed') add('Rooftop Deck', ld.rooftop ? 100 : rd.rooftop === 'required' ? 0 : 70, ld.rooftop ? 'Has rooftop' : 'No rooftop', '🏙️');
    if (rd.patio && rd.patio !== 'not_needed') add('Private Patio/Yard', ld.patio ? 100 : rd.patio === 'required' ? 0 : 70, ld.patio ? 'Has patio' : 'No patio', '🌿');
    if (rd.basement && rd.basement !== 'not_needed') add('Basement', ld.basement && ld.basement !== 'none' ? 100 : rd.basement === 'required' ? 0 : 70, ld.basement ?? '—', '🏚️');
  }

  // ── MULTI-FAMILY 2-4 ─────────────────────────────────────────────────────────
  if (type === 'multi_family') {
    add('Unit Count', scoreRange(ld.total_units, rd.min_units, rd.max_units), `${ld.total_units ?? '—'} units`, '🏘️');
    if (rd.min_cap_rate && ld.cap_rate)
      add('Cap Rate', ld.cap_rate >= rd.min_cap_rate ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_cap_rate - ld.cap_rate) / rd.min_cap_rate) * 100)),
        `${ld.cap_rate}%`, '📈');
    if (rd.min_occupancy && ld.occupancy_pct)
      add('Occupancy', ld.occupancy_pct >= rd.min_occupancy ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_occupancy - ld.occupancy_pct) / rd.min_occupancy) * 100)),
        `${ld.occupancy_pct}%`, '👥');
  }

  // ── MULTI-FAMILY 5+ ──────────────────────────────────────────────────────────
  if (type === 'multi_family_5') {
    add('Unit Count', scoreRange(ld.total_units, rd.min_units, rd.max_units), `${ld.total_units ?? '—'} units`, '🏘️');
    if (rd.min_cap_rate && ld.cap_rate)
      add('Cap Rate', ld.cap_rate >= rd.min_cap_rate ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_cap_rate - ld.cap_rate) / rd.min_cap_rate) * 100)),
        `${ld.cap_rate}%`, '📈');
    if (rd.min_noi && ld.noi)
      add('NOI', scoreRange(ld.noi, rd.min_noi, null), `$${(ld.noi || 0).toLocaleString()}`, '💰');
    if (rd.min_occupancy && ld.occupancy_pct)
      add('Occupancy', ld.occupancy_pct >= rd.min_occupancy ? 100 :
        Math.max(0, Math.round(100 - ((rd.min_occupancy - ld.occupancy_pct) / rd.min_occupancy) * 100)),
        `${ld.occupancy_pct}%`, '👥');
  }

  // ── MANUFACTURED ────────────────────────────────────────────────────────────
  if (type === 'manufactured') {
    add('Bedrooms', scoreRange(ld.bedrooms, rd.min_bedrooms, rd.max_bedrooms), `${ld.bedrooms ?? '—'} beds`, '🛏️');
    add('Bathrooms', scoreRange(ld.bathrooms, rd.min_bathrooms, rd.max_bathrooms), `${ld.bathrooms ?? '—'} baths`, '🚿');
    if (rd.land_ownership && rd.land_ownership !== 'either' && ld.land_ownership)
      add('Land Ownership', ld.land_ownership === rd.land_ownership ? 100 : 30, ld.land_ownership, '🏠');
    if (rd.max_lot_rent && ld.lot_rent)
      add('Lot Rent', scoreRange(ld.lot_rent, 0, rd.max_lot_rent), `$${ld.lot_rent}/mo`, '💰');
    if (rd.ac_required) add('Central A/C', ld.ac ? 100 : 0, ld.ac ? 'Has A/C' : 'No A/C', '❄️');
    if (rd.hud_required) add('HUD Tag', ld.hud_tag ? 100 : 0, ld.hud_tag ? 'Present' : 'Not present', '📄');
  }

  // ── LAND RESIDENTIAL ────────────────────────────────────────────────────────
  if (type === 'land_residential') {
    add('Acreage', scoreRange(ld.acres, rd.min_acres, rd.max_acres), `${ld.acres ?? '—'} acres`, '🌿');
    add('Road Frontage', scoreRange(ld.road_frontage, rd.min_road_frontage, null), `${ld.road_frontage ?? '—'}ft`, '🛣️');
    add('Buildable Area', scoreRange(ld.buildable_area || ld.gross_sqft, rd.min_buildable_area, null),
      `${((ld.buildable_area || ld.gross_sqft) || 0).toLocaleString()} SF`, '🏗️');
    const utilScore = scoreAmenities(ld.utilities_at_site, rd.utilities_required);
    if (utilScore !== null) {
      const hit = (ld.utilities_at_site || []).filter(u => rd.utilities_required.includes(u));
      add('Utilities at Site', utilScore, `${hit.length}/${rd.utilities_required.length}`, '🔌');
    }
    if (rd.no_wetlands_required)
      add('No Wetlands', !(ld.topography_tags || []).includes('wetlands') ? 100 : 0,
        'Wetland status', '🌊');
    if (rd.survey_required)
      add('Survey Available', ld.survey_available ? 100 : 0, ld.survey_available ? 'Available' : 'Not available', '📋');
  }

  return scores;
}

// ── Main scoring function ────────────────────────────────────────────────────
export function calculateMatchScore(listing, requirement) {
  // Hard gate: property type must match
  if (listing.property_type !== requirement.property_type) {
    return { totalScore: 0, breakdown: [], rangeData: {}, isMatch: false, matchLabel: null, coverage: 0 };
  }

  // Hard gate: transaction type must be compatible.
  // No partial-credit weighting — either compatible or not.
  const txScore = scoreTx(listing.transaction_type, requirement.transaction_type);
  if (txScore === 0 || txScore === null) {
    return { totalScore: 0, breakdown: [], rangeData: {}, isMatch: false, matchLabel: null, coverage: 0 };
  }

  // Hard gate: if the requirement specifies cities and the listing's (city + state)
  // isn't in that list, this is not a match. Agents enter the cities they want;
  // we honor them stiffly. Comparison matches on BOTH city AND state — Clarkston MI
  // is not the same place as Clarkston TN.
  //
  // Listings store city and state in two separate columns. Requirements store
  // each entry as a single "City, ST" string. Parse both into {city, state}
  // and compare both halves.
  const reqCitiesRaw = Array.isArray(requirement.cities)
    ? requirement.cities
    : (typeof requirement.cities === 'string'
        ? (() => { try { return JSON.parse(requirement.cities); } catch { return []; } })()
        : []);
  if (reqCitiesRaw.length > 0 && listing.city) {
    const norm = (s) => String(s || '').trim().toLowerCase();
    // Parse "City, ST" → { city: "city", state: "st" }
    const parseEntry = (entry) => {
      const parts = String(entry || '').split(',').map(p => p.trim());
      return { city: norm(parts[0]), state: norm(parts[1] || '') };
    };
    const listingKey = { city: norm(listing.city), state: norm(listing.state) };
    const hit = reqCitiesRaw.some(entry => {
      const r = parseEntry(entry);
      if (!r.city) return false;
      // City must match. If requirement didn't include a state, tolerate it
      // (older requirements may not have state). If both included a state,
      // states must match too — prevents Clarkston MI vs Clarkston TN false match.
      if (r.city !== listingKey.city) return false;
      if (r.state && listingKey.state && r.state !== listingKey.state) return false;
      return true;
    });
    if (!hit) {
      return { totalScore: 0, breakdown: [], rangeData: {}, isMatch: false, matchLabel: null, coverage: 0 };
    }
  }

  const ld = parseDetails(listing);
  const rd = parseDetails(requirement);

  const breakdown = [];
  const rangeData = {};
  let weightedSum = 0;
  let totalWeight = 0;

  // Phase B: per-property-type weight tables. The first type wired up is Office Lease.
  // Other types fall back to the legacy generic split (Phase A behavior) until they get
  // their own per-type pass. Location no longer has its own weight — it's a hard gate
  // above; surviving listings are already perfect on city/state. The Location row in
  // the breakdown is informational only.
  const txKind = listing.transaction_type;
  const isOfficeLease = (listing.property_type === 'office') && (txKind === 'lease' || txKind === 'sublease');
  const isMedicalOfficeLease = (listing.property_type === 'medical_office') && (txKind === 'lease' || txKind === 'sublease');

  // Top-level weights. Office Lease and Medical Office Lease use tuned per-type tables.
  // Everything else uses the legacy generic split for now.
  const W = (isOfficeLease || isMedicalOfficeLease)
    ? { price: 21, size: 23, location: 0, details: 0 } // detail items added individually below
    : { price: 26, size: 22, location: 22, details: 30 };

  // ── Price (with unit normalization) ────────────────────────────────────────
  const listingPrice    = parseFloat(listing.price) || 0;
  const listingPriceTBD = !!(listing.price_is_tbd);
  // Requirement TBD lives inside property_details so we don't need a DB column.
  const reqPriceTBD     = !!(requirement.price_is_tbd || rd.price_is_tbd);
  const reqMinRaw       = parseFloat(requirement.min_price) || 0;
  const reqMaxRaw       = parseFloat(requirement.max_price) || 0;

  // Requirement TBD = no price preference yet → match everything at 100% on price.
  // (Earlier design called for skip; product decision: when an agent flags price as TBD,
  // they explicitly want the score broadened to surface matches.)
  if (reqPriceTBD) {
    breakdown.push({ category: 'Price', score: 100, weight: W.price, details: 'Price TBD — open', icon: '💰' });
    weightedSum += W.price;
    totalWeight += W.price;
  } else if (listingPriceTBD) {
      // Listing is open to offers — price category scores 100.
      breakdown.push({ category: 'Price', score: 100, weight: W.price, details: 'Listing open to offers', icon: '💰' });
      weightedSum += W.price;
      totalWeight += W.price;
    } else if (listingPrice > 0 && (reqMinRaw > 0 || reqMaxRaw > 0)) {
      const listingTx = listing.transaction_type;
      const reqPeriod = requirement.price_period || 'per_month';
      let compareValue, compareMin, compareMax, priceLabel, priceDetails, priceUnit;

      const isCommercialLease = (listingTx === 'lease' || listingTx === 'sublease') && listing.size_sqft;

      if (isCommercialLease) {
        const listingMonthly = (listingPrice * parseFloat(listing.size_sqft)) / 12;
        // Requirements are always entered as TOTAL dollars (per month or per year), never per-SF.
        // Reduce both sides to a monthly total before comparing.
        if (reqPeriod === 'per_year') {
          compareValue = listingMonthly;
          compareMin   = reqMinRaw ? reqMinRaw / 12 : null;
          compareMax   = reqMaxRaw ? reqMaxRaw / 12 : null;
        } else {
          compareValue = listingMonthly;
          compareMin   = reqMinRaw || null;
          compareMax   = reqMaxRaw || null;
        }
        priceLabel   = 'Monthly Total';
        priceDetails = `$${Math.round(listingMonthly).toLocaleString()}/mo`;
        priceUnit    = '$/mo';
      } else if (listingTx === 'rent') {
        const reqMin = reqPeriod === 'per_year' ? (reqMinRaw ? reqMinRaw / 12 : null) : (reqMinRaw || null);
        const reqMax = reqPeriod === 'per_year' ? (reqMaxRaw ? reqMaxRaw / 12 : null) : (reqMaxRaw || null);
        compareValue = listingPrice;
        compareMin   = reqMin;
        compareMax   = reqMax;
        priceLabel   = 'Monthly Rent';
        priceDetails = `$${listingPrice.toLocaleString()}/mo`;
        priceUnit    = '$/mo';
      } else {
        compareValue = listingPrice;
        compareMin   = reqMinRaw || null;
        compareMax   = reqMaxRaw || null;
        priceLabel   = 'Purchase Price';
        priceDetails = `$${listingPrice.toLocaleString()}`;
        priceUnit    = '$';
      }

      const priceScore = scorePriceRange(compareValue, compareMin, compareMax);
      if (priceScore !== null) {
        breakdown.push({ category: priceLabel, score: priceScore, weight: W.price, details: priceDetails, icon: '💰' });
        weightedSum += (priceScore / 100) * W.price;
        totalWeight += W.price;
        rangeData.price = {
          value: Math.round(compareValue * 100) / 100,
          min: compareMin, max: compareMax,
          unit: priceUnit, label: priceLabel, score: priceScore,
        };
      }
    }

  // ── Size ──────────────────────────────────────────────────────────────────
  const listingSize = parseFloat(listing.size_sqft) || 0;
  const reqMinSize  = parseFloat(requirement.min_size_sqft) || 0;
  const reqMaxSize  = parseFloat(requirement.max_size_sqft) || 0;

  if (listingSize > 0 && (reqMinSize > 0 || reqMaxSize > 0)) {
    const sizeScore = scoreRange(listingSize, reqMinSize || null, reqMaxSize || null);
    if (sizeScore !== null) {
      breakdown.push({ category: 'Size (SF)', score: sizeScore, weight: W.size,
        details: `${listingSize.toLocaleString()} SF`, icon: '📐' });
      weightedSum += (sizeScore / 100) * W.size;
      totalWeight += W.size;
      rangeData.size = { value: listingSize, min: reqMinSize || null, max: reqMaxSize || null,
        unit: 'SF', label: 'Size', score: sizeScore };
    }
  }

  // ── Location ──────────────────────────────────────────────────────────────
  // If we reached this point, location either matched (city in cities list) or
  // the requirement had no cities specified at all. Either way, location is not
  // dragging the score down — show 100 in the breakdown for display.
  // When location is a hard gate with no own weight (e.g. Office Lease in Phase B),
  // it's informational only and doesn't contribute to weightedSum.
  if (reqCitiesRaw.length > 0 && listing.city) {
    breakdown.push({ category: 'Location', score: 100, weight: W.location,
      details: `${listing.city} matches`, icon: '📍' });
    if (W.location > 0) {
      weightedSum += W.location;
      totalWeight += W.location;
    }
  }

  // ── Property-type details ─────────────────────────────────────────────────
  if (isOfficeLease) {
    // Office Lease: each detail item has its own weight from the tuned per-type table.
    // Empty requirement fields skip entirely (weight not added to totalWeight),
    // which renormalizes the score to whatever was actually asked for.
    // Missing on listing when requirement asks = 0 score on that line (Option A).

    const officeItems = [];

    // Helpers
    const reqAmen   = Array.isArray(rd.preferred_amenities) ? rd.preferred_amenities : [];
    const listAmen  = Array.isArray(ld.building_amenities) ? ld.building_amenities : [];
    const listSpaceAmen = Array.isArray(ld.amenities) ? ld.amenities : [];
    const hasL = (key) => listAmen.includes(key);
    const hasS = (key) => listSpaceAmen.includes(key);

    // Number of Offices (graduated, only penalized when listing has FEWER than requested)
    if (rd.offices_needed && parseFloat(rd.offices_needed) > 0) {
      const want = parseFloat(rd.offices_needed);
      const have = parseFloat(ld.offices) || 0;
      const score = have >= want ? 100 : Math.max(0, Math.round((have / want) * 100));
      officeItems.push({ label: 'Number of Offices', score, weight: 8,
        details: `${ld.offices ?? '—'} offices vs ${want} requested`, icon: '🏢' });
    }

    // Conference Rooms (graduated, same rules as offices)
    if (rd.conf_rooms_needed && parseFloat(rd.conf_rooms_needed) > 0) {
      const want = parseFloat(rd.conf_rooms_needed);
      const have = parseFloat(ld.conf_rooms) || 0;
      const score = have >= want ? 100 : Math.max(0, Math.round((have / want) * 100));
      officeItems.push({ label: 'Conference Rooms', score, weight: 8,
        details: `${ld.conf_rooms ?? '—'} rooms vs ${want} requested`, icon: '📋' });
    }

    // ADA Compliant (binary, lives in amenity arrays)
    if (reqAmen.includes('ada_building')) {
      const score = hasL('ada_building') ? 100 : 0;
      officeItems.push({ label: 'ADA Compliant', score, weight: 10,
        details: score ? 'Yes' : 'Not specified on listing', icon: '♿' });
    }

    // Natural Light (binary — lives in space amenities/in-suite features, not building amenities)
    if (reqAmen.includes('natural_light')) {
      const score = hasS('natural_light') ? 100 : 0;
      officeItems.push({ label: 'Natural Light', score, weight: 6,
        details: score ? 'Yes' : 'Not specified on listing', icon: '☀️' });
    }

    // 24/7 Access (binary)
    if (reqAmen.includes('access_247')) {
      const score = hasL('access_247') ? 100 : 0;
      officeItems.push({ label: '24/7 Access', score, weight: 5,
        details: score ? 'Yes' : 'Not specified on listing', icon: '🔓' });
    }

    // Fitness Center (binary)
    if (reqAmen.includes('fitness_center')) {
      const score = hasL('fitness_center') ? 100 : 0;
      officeItems.push({ label: 'Fitness Center', score, weight: 3,
        details: score ? 'Yes' : 'Not specified on listing', icon: '🏋️' });
    }

    // Cafe / Food Service (binary)
    if (reqAmen.includes('cafe_food_service')) {
      const score = hasL('cafe_food_service') ? 100 : 0;
      officeItems.push({ label: 'Cafe / Food Service', score, weight: 3,
        details: score ? 'Yes' : 'Not specified on listing', icon: '☕' });
    }

    // Kitchenette is a SPACE_AMENITY (in-suite), lives on listing.amenities not building_amenities.
    // For now skip — requirement form doesn't expose kitchenette as a separate "required" toggle.
    // Banked.

    // Covered Parking (binary)
    if (reqAmen.includes('covered_parking')) {
      const score = hasL('covered_parking') ? 100 : 0;
      officeItems.push({ label: 'Covered Parking', score, weight: 2,
        details: score ? 'Yes' : 'Not specified on listing', icon: '🅿️' });
    }

    // Building Class (tiered: requirement allows multiple acceptable classes)
    const acceptableClasses = Array.isArray(rd.building_class_pref) ? rd.building_class_pref : [];
    if (acceptableClasses.length > 0 && ld.building_class) {
      const score = acceptableClasses.includes(ld.building_class) ? 100 : 40;
      officeItems.push({ label: 'Building Class', score, weight: 2,
        details: `Class ${ld.building_class} (acceptable: ${acceptableClasses.join(', ')})`, icon: '🏛️' });
    }

    // In-Suite Restrooms (binary — now a chip in space amenities)
    if (rd.in_suite_restrooms_req) {
      const has = hasS('in_suite_restrooms');
      officeItems.push({ label: 'In-Suite Restrooms', score: has ? 100 : 0, weight: 5,
        details: has ? 'Yes' : 'Not specified on listing', icon: '🚻' });
    }

    // Server Room / IT Infrastructure Required (toggle - small weight at 2)
    if (rd.server_room_req) {
      // Listing has either an it_infrastructure description or could indicate via amenities.
      const has = !!(ld.it_infrastructure && String(ld.it_infrastructure).trim());
      officeItems.push({ label: 'Server Room / IT', score: has ? 100 : 0, weight: 2,
        details: has ? 'Specified' : 'Not specified on listing', icon: '💻' });
    }

    // "Other amenities pool" — the long tail of less-important amenities the requirement asked for.
    // Excludes the ones already scored individually above.
    const individuallyScoredKeys = new Set([
      'ada_building','natural_light','access_247','fitness_center','cafe_food_service','covered_parking',
    ]);
    const poolReqAmen  = reqAmen.filter(a => !individuallyScoredKeys.has(a));
    if (poolReqAmen.length > 0) {
      const matched = poolReqAmen.filter(a => listAmen.includes(a)).length;
      const pct = matched / poolReqAmen.length;
      // Bonus pool curve: forgiving by design (these are nice-to-haves).
      let poolScore;
      if (pct >= 1.0)  poolScore = 100;
      else if (pct >= 0.75) poolScore = 90;
      else if (pct >= 0.50) poolScore = 75;
      else if (pct >= 0.25) poolScore = 55;
      else poolScore = 15;
      officeItems.push({ label: 'Other Amenities', score: poolScore, weight: 6,
        details: `${matched} / ${poolReqAmen.length} matched`, icon: '✨' });
    }

    // Roll all office items into the main weightedSum.
    officeItems.forEach(item => {
      breakdown.push({ category: item.label, score: item.score, weight: item.weight,
        details: item.details, icon: item.icon });
      weightedSum += (item.score / 100) * item.weight;
      totalWeight += item.weight;
    });
  } else if (isMedicalOfficeLease) {
    // Medical Office Lease: per-type weighted scoring.
    // Tuned for medical: ADA + HIPAA are top-priority binary; clinical capacity
    // (exam/procedure/lab/waiting/restrooms) ties at 5 each; specialty in-suite
    // infrastructure (xray, gas, sterilization) at 3 each; building amenities
    // matter much less to clinical tenants — Cafe/Covered Parking/Building Class
    // are folded into the bonus pool rather than getting their own lines.

    const medItems = [];

    const reqAmen   = Array.isArray(rd.preferred_amenities) ? rd.preferred_amenities : [];
    const listAmen  = Array.isArray(ld.building_amenities) ? ld.building_amenities : [];
    const listSpaceAmen = Array.isArray(ld.amenities) ? ld.amenities : [];
    const listMedFeat = Array.isArray(ld.medical_features) ? ld.medical_features : [];
    const hasL = (key) => listAmen.includes(key);
    const hasMed = (key) => listMedFeat.includes(key);

    // ADA Compliant (binary, top priority, lives in building amenities)
    if (reqAmen.includes('ada_building')) {
      const score = hasL('ada_building') ? 100 : 0;
      medItems.push({ label: 'ADA Compliant', score, weight: 8,
        details: score ? 'Yes' : 'Not specified on listing', icon: '♿' });
    }

    // HIPAA Compliant Layout (binary, top priority, lives in medical_features)
    if (rd.hipaa_req) {
      const has = hasMed('hipaa');
      medItems.push({ label: 'HIPAA Compliant Layout', score: has ? 100 : 0, weight: 8,
        details: has ? 'Yes' : 'Not specified on listing', icon: '🔒' });
    }

    // Exam Rooms (graduated, never penalized for having more)
    if (rd.exam_rooms_needed && parseFloat(rd.exam_rooms_needed) > 0) {
      const want = parseFloat(rd.exam_rooms_needed);
      const have = parseFloat(ld.exam_rooms) || 0;
      const score = have >= want ? 100 : Math.max(0, Math.round((have / want) * 100));
      medItems.push({ label: 'Exam Rooms', score, weight: 5,
        details: `${ld.exam_rooms ?? '—'} rooms vs ${want} requested`, icon: '🩺' });
    }

    // Procedure Rooms (graduated, same rules)
    if (rd.procedure_rooms_needed && parseFloat(rd.procedure_rooms_needed) > 0) {
      const want = parseFloat(rd.procedure_rooms_needed);
      const have = parseFloat(ld.procedure_rooms) || 0;
      const score = have >= want ? 100 : Math.max(0, Math.round((have / want) * 100));
      medItems.push({ label: 'Procedure Rooms', score, weight: 5,
        details: `${ld.procedure_rooms ?? '—'} rooms vs ${want} requested`, icon: '⚕️' });
    }

    // Lab Space (binary chip in medical_features)
    if (rd.lab_req) {
      const has = hasMed('lab_space');
      medItems.push({ label: 'Lab Space', score: has ? 100 : 0, weight: 5,
        details: has ? 'Yes' : 'Not specified on listing', icon: '🧪' });
    }

    // Waiting Room Capacity (graduated)
    if (rd.waiting_capacity_needed && parseFloat(rd.waiting_capacity_needed) > 0) {
      const want = parseFloat(rd.waiting_capacity_needed);
      const have = parseFloat(ld.waiting_capacity) || 0;
      const score = have >= want ? 100 : Math.max(0, Math.round((have / want) * 100));
      medItems.push({ label: 'Waiting Room Capacity', score, weight: 5,
        details: `${ld.waiting_capacity ?? '—'} seats vs ${want} requested`, icon: '🪑' });
    }

    // In-Suite Restrooms (binary chip in medical_features)
    if (rd.in_suite_restrooms_req) {
      const has = hasMed('in_suite_restrooms');
      medItems.push({ label: 'In-Suite Restrooms', score: has ? 100 : 0, weight: 5,
        details: has ? 'Yes' : 'Not specified on listing', icon: '🚻' });
    }

    // X-Ray / Shielded Room (binary chip in medical_features)
    if (rd.xray_req) {
      const has = hasMed('xray');
      medItems.push({ label: 'X-Ray / Shielded Room', score: has ? 100 : 0, weight: 3,
        details: has ? 'Yes' : 'Not specified on listing', icon: '☢️' });
    }

    // Medical Gas Lines (binary chip in medical_features)
    if (rd.medical_gas_req) {
      const has = hasMed('medical_gas');
      medItems.push({ label: 'Medical Gas Lines', score: has ? 100 : 0, weight: 3,
        details: has ? 'Yes' : 'Not specified on listing', icon: '💨' });
    }

    // Sterilization Area (binary chip in medical_features)
    if (rd.sterilization_req) {
      const has = hasMed('sterilization');
      medItems.push({ label: 'Sterilization Area', score: has ? 100 : 0, weight: 3,
        details: has ? 'Yes' : 'Not specified on listing', icon: '🧼' });
    }

    // 24/7 Access (binary, building amenities)
    if (reqAmen.includes('access_247')) {
      const score = hasL('access_247') ? 100 : 0;
      medItems.push({ label: '24/7 Access', score, weight: 3,
        details: score ? 'Yes' : 'Not specified on listing', icon: '🔓' });
    }

    // Fitness Center (binary, low priority for medical)
    if (reqAmen.includes('fitness_center')) {
      const score = hasL('fitness_center') ? 100 : 0;
      medItems.push({ label: 'Fitness Center', score, weight: 1,
        details: score ? 'Yes' : 'Not specified on listing', icon: '🏋️' });
    }

    // "Other amenities pool" — everything else the requirement asked for.
    // Cafe / Covered Parking / Building Class / etc. fold in here for medical
    // since they don't get their own scored lines.
    const individuallyScoredKeys = new Set([
      'ada_building', 'access_247', 'fitness_center',
    ]);
    const poolReqAmen = reqAmen.filter(a => !individuallyScoredKeys.has(a));
    if (poolReqAmen.length > 0) {
      const matched = poolReqAmen.filter(a => listAmen.includes(a)).length;
      const pct = matched / poolReqAmen.length;
      let poolScore;
      if (pct >= 1.0)  poolScore = 100;
      else if (pct >= 0.75) poolScore = 90;
      else if (pct >= 0.50) poolScore = 75;
      else if (pct >= 0.25) poolScore = 55;
      else poolScore = 15;
      medItems.push({ label: 'Other Amenities', score: poolScore, weight: 2,
        details: `${matched} / ${poolReqAmen.length} matched`, icon: '✨' });
    }

    // Roll all medical items into the main weightedSum.
    medItems.forEach(item => {
      breakdown.push({ category: item.label, score: item.score, weight: item.weight,
        details: item.details, icon: item.icon });
      weightedSum += (item.score / 100) * item.weight;
      totalWeight += item.weight;
    });
  } else {
    // Legacy generic detail path for all non-office-lease types (until they get their own pass).
    const detailScores = scoreDetails(listing, requirement, ld, rd);
    if (detailScores.length > 0) {
      const detailAvg = detailScores.reduce((s, d) => s + d.score, 0) / detailScores.length;
      const hitCount  = detailScores.filter(d => d.score >= 80).length;
      breakdown.push({ category: 'Property Details', score: Math.round(detailAvg), weight: W.details,
        details: `${hitCount}/${detailScores.length} factors matched`,
        icon: '🏢', subScores: detailScores });
      weightedSum += (detailAvg / 100) * W.details;
      totalWeight += W.details;
    }
  }

  // ── Final score: raw weighted average, no baseline floor ───────────────────
  // If nothing scored (no requirement fields filled), default to 0 — there's
  // nothing to evaluate so it's not a match.
  const finalScore = totalWeight > 0
    ? Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)))
    : 0;

  // Coverage = how many dimensions actually contributed to this score.
  // Used in the UI to show "score based on N dimensions" so users can tell
  // whether a 95 came from 2 fields (sketchy) or 18 fields (solid).
  const coverage = breakdown.length;

  const isMatch    = finalScore >= 45;
  const matchLabel = isMatch ? getScoreLabel(finalScore) : null;

  return { totalScore: finalScore, breakdown, rangeData, isMatch, matchLabel, coverage };
}

export function getScoreColor(score) {
  if (score >= 85) return '#00DBC5';
  if (score >= 65) return '#F59E0B';
  if (score >= 45) return '#F97316';
  return '#374151';
}

export function getScoreLabel(score) {
  if (score >= 85) return 'Strong Match';
  if (score >= 65) return 'Good Match';
  if (score >= 45) return 'Partial Match';
  return null;
}