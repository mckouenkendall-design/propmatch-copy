// ─────────────────────────────────────────────────────────────────────────────
// PropMatch — Client Priority Ranker: Default Importance Map
//
// Encodes every Phase B scoring decision as a per-property-type list of items,
// each with a default importance level. The ranker UI reads this to know which
// items to show and how to pre-select them. The scoring engine (matchScore.js)
// uses the SAME weightKey() normalization so overrides line up with scored items.
//
// Importance levels: 'none' | 'low' | 'normal' | 'high' | 'dealbreaker' | 'locked'
//   locked      → permanent hard gate the agent CANNOT change (shown greyed out).
//                 Currently only Location (needs area-search infra we haven't built).
//   dealbreaker → hard gate by default, but the agent MAY downgrade it.
//   high/normal/low → maps to weight multipliers in matchScore.js.
//   none        → informational by default; agent may bump it up if their client cares.
//
// Mapping from our Phase B weights → default importance:
//   weight >= 8      → 'high'
//   weight 3 – 7.9   → 'normal'
//   weight 1 – 2.9   → 'low'
//   informational    → 'none'
//   hard gate        → 'dealbreaker' (or 'locked' for location)
// ─────────────────────────────────────────────────────────────────────────────

// Items shared by every property type (Size, Price always scored heavily;
// Property Type / Transaction / Location are gates).
const UNIVERSAL_GATES = [
  { key: 'property_type', label: 'Property Type', default: 'dealbreaker' },
  { key: 'transaction_type', label: 'Transaction Type', default: 'dealbreaker' },
  { key: 'location', label: 'Location', default: 'locked',
    note: 'Location matching requires area search — coming soon' },
];

const SIZE_PRICE = [
  { key: 'size', label: 'Size', default: 'high' },
  { key: 'price', label: 'Price', default: 'high' },
];

// Per-type scored items (everything beyond the universal gates + size/price).
// Labels MUST match the item labels used in matchScore.js so weightKey() lines up.
export const CLIENT_WEIGHT_DEFAULTS = {
  office: {
    label: 'Office (Lease)',
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high' },
      { key: 'number_of_offices', label: 'Number of Offices', default: 'high' },
      { key: 'conference_rooms', label: 'Conference Rooms', default: 'high' },
      { key: 'natural_light', label: 'Natural Light', default: 'normal' },
      { key: '24_7_access', label: '24/7 Access', default: 'normal' },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal' },
      { key: 'fitness_center', label: 'Fitness Center', default: 'low' },
      { key: 'cafe_food_service', label: 'Cafe / Food Service', default: 'low' },
      { key: 'covered_parking', label: 'Covered Parking', default: 'low' },
      { key: 'building_class', label: 'Building Class', default: 'low' },
      { key: 'server_room_it', label: 'Server Room / IT', default: 'low' },
      { key: 'other_amenities', label: 'Other Amenities', default: 'low', expandable: 'office_amenities' },
    ],
  },
  medical_office: {
    label: 'Medical Office (Lease)',
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high' },
      { key: 'hipaa_compliant_layout', label: 'HIPAA Compliant Layout', default: 'high' },
      { key: 'exam_rooms', label: 'Exam Rooms', default: 'normal' },
      { key: 'procedure_rooms', label: 'Procedure Rooms', default: 'normal' },
      { key: 'lab_space', label: 'Lab Space', default: 'normal' },
      { key: 'waiting_room_capacity', label: 'Waiting Room Capacity', default: 'normal' },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal' },
      { key: 'x_ray_shielded_room', label: 'X-Ray / Shielded Room', default: 'normal' },
      { key: 'medical_gas_lines', label: 'Medical Gas Lines', default: 'normal' },
      { key: 'sterilization_area', label: 'Sterilization Area', default: 'normal' },
      { key: '24_7_access', label: '24/7 Access', default: 'normal' },
      { key: 'fitness_center', label: 'Fitness Center', default: 'low' },
      { key: 'other_amenities', label: 'Other Building Amenities', default: 'low', expandable: 'office_amenities' },
    ],
  },
  retail: {
    label: 'Retail (Lease)',
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high' },
      { key: 'capacity', label: 'Capacity', default: 'normal' },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal' },
      { key: 'foot_traffic', label: 'Foot Traffic', default: 'normal' },
      { key: 'traffic_count_tier', label: 'Traffic Count Tier', default: 'normal' },
      { key: 'location_type', label: 'Location Type', default: 'normal' },
      { key: 'length', label: 'Length', default: 'normal' },
      { key: 'width', label: 'Width', default: 'normal' },
      { key: 'ceiling_height', label: 'Ceiling Height', default: 'normal' },
      { key: 'signage_rights', label: 'Signage Rights', default: 'low' },
      { key: 'building_class', label: 'Building Class', default: 'low' },
      { key: 'special_features', label: 'Special Features', default: 'low', expandable: 'retail_features' },
    ],
  },
  industrial_flex: {
    label: 'Industrial / Flex (Lease)',
    items: [
      { key: 'rail_access', label: 'Rail Access', default: 'dealbreaker' },
      { key: 'crane_system', label: 'Crane System', default: 'dealbreaker' },
      { key: 'clear_height', label: 'Clear Height', default: 'high' },
      { key: 'dock_high_doors', label: 'Dock-High Doors', default: 'normal' },
      { key: 'floor_load', label: 'Floor Load', default: 'normal' },
      { key: 'drive_in_doors', label: 'Drive-In Doors', default: 'normal' },
      { key: 'amperage', label: 'Amperage', default: 'normal' },
      { key: '3_phase_power', label: '3-Phase Power', default: 'normal' },
      { key: 'outside_storage', label: 'Outside Storage', default: 'normal' },
      { key: 'fenced_yard', label: 'Fenced Yard', default: 'normal' },
      { key: 'truck_court_depth', label: 'Truck Court Depth', default: 'normal' },
      { key: 'land_lot_size', label: 'Land / Lot Size', default: 'normal' },
      { key: 'voltage', label: 'Voltage', default: 'normal' },
      { key: 'esfr_sprinklers', label: 'ESFR Sprinklers', default: 'low' },
      { key: 'warehouse_hvac', label: 'Warehouse HVAC', default: 'low' },
      { key: 'dock_equipment', label: 'Dock Equipment', default: 'low', expandable: 'dock_equipment_items' },
      { key: 'skylights', label: 'Skylights', default: 'low' },
      { key: 'led_lighting', label: 'LED Lighting', default: 'low' },
    ],
  },
  land: {
    label: 'Land (Commercial)',
    items: [
      { key: 'buildable_developable', label: 'Buildable / Developable', default: 'high' },
      { key: 'no_wetlands', label: 'No Wetlands', default: 'normal' },
      { key: 'flat_level_land', label: 'Flat / Level Land', default: 'normal' },
      { key: 'site_access', label: 'Site Access', default: 'normal' },
      { key: 'road_surface', label: 'Road Surface', default: 'normal' },
      { key: 'municipal_water', label: 'Municipal Water', default: 'low' },
      { key: 'sanitary_sewer', label: 'Sanitary Sewer', default: 'low' },
      { key: 'electric', label: 'Electric', default: 'low' },
      { key: 'natural_gas', label: 'Natural Gas', default: 'low' },
      { key: 'fiber_internet', label: 'Fiber / Internet', default: 'low' },
    ],
  },
  land_residential: {
    label: 'Residential Land',
    items: [
      { key: 'buildable_developable', label: 'Buildable / Developable', default: 'high' },
      { key: 'no_wetlands', label: 'No Wetlands', default: 'normal' },
      { key: 'paved_road_access', label: 'Paved Road Access', default: 'normal' },
      { key: 'municipal_water', label: 'Municipal Water', default: 'low' },
      { key: 'sanitary_sewer', label: 'Sanitary Sewer', default: 'low' },
      { key: 'electric', label: 'Electric', default: 'low' },
      { key: 'natural_gas', label: 'Natural Gas', default: 'low' },
      { key: 'fiber_internet', label: 'Fiber / Internet', default: 'low' },
    ],
  },
  single_family: {
    label: 'Single Family Home',
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high' },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high' },
      { key: 'lot_size', label: 'Lot Size', default: 'high' },
      { key: 'garage_spaces', label: 'Garage Spaces', default: 'normal' },
      { key: 'stories', label: 'Stories', default: 'normal' },
      { key: 'basement', label: 'Basement', default: 'low' },
      { key: 'features_amenities', label: 'Features & Amenities', default: 'normal', expandable: 'sf_features' },
    ],
  },
  condo: {
    label: 'Condo',
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high' },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high' },
      { key: 'parking', label: 'Parking', default: 'normal' },
      { key: 'pet_policy', label: 'Pet Policy', default: 'dealbreaker' },
      { key: 'building_amenities', label: 'Building Amenities', default: 'high', expandable: 'condo_amenities' },
    ],
  },
  apartment: {
    label: 'Apartment',
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high' },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high' },
      { key: 'parking', label: 'Parking', default: 'normal' },
      { key: 'lease_term', label: 'Lease Term', default: 'normal' },
      { key: 'pet_policy', label: 'Pet Policy', default: 'dealbreaker' },
      { key: 'building_amenities', label: 'Building Amenities', default: 'high', expandable: 'apt_amenities' },
    ],
  },
  townhouse: {
    label: 'Townhouse',
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high' },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high' },
    ],
  },
  manufactured: {
    label: 'Manufactured / Mobile Home',
    items: [
      { key: 'age_restriction', label: 'Age Restriction', default: 'dealbreaker' },
      { key: 'bedrooms', label: 'Bedrooms', default: 'high' },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high' },
      { key: 'lot_size', label: 'Lot Size', default: 'high' },
    ],
  },
};

// Individual amenities behind each "expandable" pooled item. When an agent
// expands one of these, they can rank each amenity individually. These mirror
// the chip lists in the Step 2 listing forms so the keys line up with scoring.
export const AMENITY_GROUPS = {
  office_amenities: [
    { key: 'ev_charging', label: 'EV Charging Stations' },
    { key: 'elevators', label: 'Elevators' },
    { key: 'shared_loading_dock', label: 'Shared Loading Dock' },
    { key: 'shared_conference', label: 'Shared Conference Rooms' },
    { key: 'tenant_lounge', label: 'Tenant Lounge / Break Room' },
    { key: 'grab_and_go', label: 'Grab-and-Go Station' },
    { key: 'outdoor_space', label: 'Outdoor Space / Patio / Terrace' },
    { key: 'golf_simulator', label: 'Golf Simulator' },
    { key: 'backup_generator', label: 'Backup Generator' },
    { key: 'janitorial_common', label: 'Janitorial (Common Areas)' },
  ],
  sf_features: [
    { key: 'pool', label: 'Pool' },
    { key: 'hot_tub', label: 'Hot Tub / Spa' },
    { key: 'deck', label: 'Deck / Patio' },
    { key: 'fence', label: 'Fenced Yard' },
    { key: 'fireplace', label: 'Fireplace' },
    { key: 'ac', label: 'Central A/C' },
    { key: 'generator', label: 'Generator' },
    { key: 'solar', label: 'Solar Panels' },
    { key: 'sprinklers', label: 'Irrigation / Sprinklers' },
    { key: 'mudroom', label: 'Mudroom' },
    { key: 'bonus_room', label: 'Bonus Room / Loft' },
    { key: 'home_office', label: 'Dedicated Home Office' },
  ],
  condo_amenities: [
    { key: 'gym', label: 'Fitness Center' },
    { key: 'pool', label: 'Pool' },
    { key: 'rooftop', label: 'Rooftop Deck' },
    { key: 'doorman', label: 'Doorman / Concierge' },
    { key: 'lounge', label: 'Resident Lounge' },
    { key: 'business_ctr', label: 'Business Center' },
    { key: 'bike_storage', label: 'Bike Storage' },
    { key: 'ev_charging', label: 'EV Charging' },
    { key: 'dog_wash', label: 'Dog Wash Station' },
    { key: 'package_room', label: 'Package Room' },
  ],
  apt_amenities: [
    { key: 'gym', label: 'Fitness Center' },
    { key: 'pool', label: 'Pool' },
    { key: 'rooftop', label: 'Rooftop Deck' },
    { key: 'doorman', label: 'Doorman / Concierge' },
    { key: 'package_room', label: 'Package Room' },
    { key: 'bike_storage', label: 'Bike Storage' },
    { key: 'ev_charging', label: 'EV Charging' },
    { key: 'coworking', label: 'Co-Working Space' },
    { key: 'dog_park', label: 'Dog Park / Pet Area' },
    { key: 'game_room', label: 'Game Room / Lounge' },
  ],
  retail_features: [
    { key: 'drive_thru', label: 'Drive-Thru Window' },
    { key: 'grease_trap', label: 'Grease Trap' },
    { key: 'venting_hood', label: 'Venting / Hood' },
    { key: 'cold_storage', label: 'Cold Storage / Walk-in Freezer' },
    { key: 'outdoor_seating', label: 'Outdoor Seating / Patio' },
    { key: 'capped_utilities', label: 'Capped / Stubbed Utilities' },
    { key: 'showroom', label: 'Dedicated Showroom' },
    { key: 'fitting_rooms', label: 'Fitting Rooms' },
    { key: 'high_end_lighting', label: 'High-End Lighting' },
    { key: 'rear_loading', label: 'Rear Loading / Alley Access' },
    { key: 'vault', label: 'Secure Vault / Safe Room' },
    { key: 'medical_flooring', label: 'Medical Grade Flooring' },
    { key: 'auto_bay', label: 'Auto Bay / Garage Doors' },
  ],
  dock_equipment_items: [
    { key: 'dock_levelers', label: 'Levelers' },
    { key: 'dock_seals', label: 'Seals' },
    { key: 'dock_restraints', label: 'Restraints' },
  ],
};

// Fetch the amenity sub-items for an expandable group id (or [] if none).
export function amenityGroup(groupId) {
  return AMENITY_GROUPS[groupId] || [];
}

// Build the full ordered item list for a property type: universal gates first,
// then Size/Price, then the type-specific items. Returns [] for unknown types
// (e.g. special_use, multi_family) which don't have per-type scoring yet.
export function itemsForPropertyType(propertyType) {
  const typeConfig = CLIENT_WEIGHT_DEFAULTS[propertyType];
  if (!typeConfig) return [];
  return [...UNIVERSAL_GATES, ...SIZE_PRICE, ...typeConfig.items];
}

// Build the default client_weights object for a property type — every item at
// its default importance. This is what a fresh ranker screen shows.
export function defaultWeightsForPropertyType(propertyType) {
  const items = itemsForPropertyType(propertyType);
  const out = {};
  items.forEach(item => {
    // 'locked' items aren't stored as overrides (they're permanent gates the
    // engine already enforces). Everything else stores its default level.
    if (item.default !== 'locked') out[item.key] = item.default;
  });
  return out;
}

export const IMPORTANCE_LEVELS = ['none', 'low', 'normal', 'high', 'dealbreaker'];

export const IMPORTANCE_LABELS = {
  none: 'Not Important',
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  dealbreaker: 'Dealbreaker',
  locked: 'Required',
};