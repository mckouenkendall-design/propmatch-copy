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
  return hit ? 100 : 20;
}

// Amenity / feature overlap
function scoreAmenities(listingSet, requiredSet) {
  if (!requiredSet?.length) return null;
  if (!listingSet?.length) return 0;
  const hit = requiredSet.filter(a => listingSet.includes(a));
  return Math.round((hit.length / requiredSet.length) * 100);
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
    return { totalScore: 0, breakdown: [], rangeData: {}, isMatch: false, matchLabel: null };
  }

  // Hard gate: transaction type must be compatible
  const txScore = scoreTx(listing.transaction_type, requirement.transaction_type);
  if (txScore === 0) {
    return { totalScore: 0, breakdown: [], rangeData: {}, isMatch: false, matchLabel: null };
  }

  const ld = parseDetails(listing);
  const rd = parseDetails(requirement);

  const breakdown = [];
  const rangeData  = {};
  let weightedSum  = 0;
  let totalWeight  = 0;

  const W = { tx: 15, price: 22, size: 18, location: 15, details: 15 };

  // Transaction type
  breakdown.push({ category: 'Transaction Type', score: txScore, weight: W.tx,
    details: txScore === 100 ? 'Exact match' : 'Compatible types', icon: '↔️' });
  weightedSum += (txScore / 100) * W.tx;
  totalWeight += W.tx;

  // ── Price (with unit normalization) ────────────────────────────────────────
  const listingPrice    = parseFloat(listing.price) || 0;
  const listingPriceTBD = !!(listing.price_is_tbd);
  const reqMinRaw       = parseFloat(requirement.min_price) || 0;
  const reqMaxRaw       = parseFloat(requirement.max_price) || 0;

  // TBD price: counts as 100% — listing is open to negotiation, not a blocker
  if (listingPriceTBD) {
    breakdown.push({ category: 'Price', score: 100, weight: W.price, details: 'TBD — open to offers', icon: '💰' });
    weightedSum += W.price;
    totalWeight += W.price;
  } else if (listingPrice > 0 && (reqMinRaw > 0 || reqMaxRaw > 0)) {
    const listingTx = listing.transaction_type;
    const reqPeriod = requirement.price_period || 'per_month';
    let compareValue, compareMin, compareMax, priceLabel, priceDetails, priceUnit;

    const isCommercialLease = (listingTx === 'lease' || listingTx === 'sublease') && listing.size_sqft;

    if (isCommercialLease) {
      const listingMonthly = (listingPrice * parseFloat(listing.size_sqft)) / 12;
      if (reqPeriod === 'per_sf_per_year') {
        compareValue  = listingPrice;
        compareMin    = reqMinRaw || null;
        compareMax    = reqMaxRaw || null;
        priceLabel    = 'Rate ($/SF/yr)';
        priceDetails  = `$${listingPrice}/SF/yr`;
        priceUnit     = '$/SF/yr';
      } else {
        compareValue  = listingMonthly;
        compareMin    = reqMinRaw || null;
        compareMax    = reqMaxRaw || null;
        priceLabel    = 'Monthly Total';
        priceDetails  = `$${Math.round(listingMonthly).toLocaleString()}/mo`;
        priceUnit     = '$/mo';
      }
    } else if (listingTx === 'rent') {
      compareValue = listingPrice;
      compareMin   = reqMinRaw || null;
      compareMax   = reqMaxRaw || null;
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

    const priceScore = scoreRange(compareValue, compareMin, compareMax);
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
  const locScore = scoreLoc(listing.city, requirement.cities);
  if (locScore !== null) {
    breakdown.push({ category: 'Location', score: locScore, weight: W.location,
      details: locScore === 100 ? `${listing.city} matches` : `${listing.city} (not in preferred areas)`,
      icon: '📍' });
    weightedSum += (locScore / 100) * W.location;
    totalWeight += W.location;
  }

  // ── Property-type details ─────────────────────────────────────────────────
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

  // ── Final score calculation ───────────────────────────────────────────────
  // 20 base points for property-type match, 80 points from weighted factors
  const factorScore = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 50;
  const finalScore  = Math.min(100, Math.max(0, Math.round(20 + factorScore * 0.8)));

  const isMatch    = finalScore >= 30;
  const matchLabel = isMatch ? getScoreLabel(finalScore) : null;

  return { totalScore: finalScore, breakdown, rangeData, isMatch, matchLabel };
}

export function getScoreColor(score) {
  if (score >= 70) return '#00DBC5';
  if (score >= 50) return '#F59E0B';
  if (score >= 30) return '#F97316';
  return '#374151';
}

export function getScoreLabel(score) {
  if (score >= 70) return 'Strong Match';
  if (score >= 50) return 'Good Match';
  if (score >= 30) return 'Partial Match';
  return null;
}