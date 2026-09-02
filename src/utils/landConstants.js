// Shared land constants — used by the listing form, the requirement form, and
// the scoring engine so all three stay in sync. Phase 3.

// Proposed Use — what a parcel is suited for / what a buyer wants to build.
// This is the single most important land matching signal. Mirrors LoopNet's list.
export const PROPOSED_USES = [
  'Agribusiness', 'Agricultural', 'Airplane Hangar', 'Airport', 'Amusement Park',
  'Apartment Units', 'Apartment Units - Condo', 'Apartment Units - Dorms',
  'Apartment Units - Senior', 'Apartment Units - Subsidized', 'Auto Dealership',
  'Auto Repair', 'Auto Salvage Facility', 'Bank', 'Bar', 'Baseball Field',
  'Bowling Alley', 'Car Wash', 'Casino', 'Cement/Gravel Plant', 'Cemetery/Mausoleum',
  'Chemical/Oil Refinery', 'Commercial', 'Community Center', 'Contractor Storage Yard',
  'Convenience Store', 'Correctional Facility', 'Data Centers', 'Day Care Center',
  'Department Store', 'Distribution', 'Drug Store', 'Fast Food', 'Food Processing',
  'Funeral Home', 'Garden Center', 'General Freestanding', 'Golf Course/Driving Range',
  'Health Care', 'Health Club', 'Hold for Development', 'Hold for Investment',
  'Horse Stables', 'Hospital', 'Hospitality', 'Hotel', 'Industrial',
  'Industrial Live/Work Unit', 'Industrial Park', 'Landfill', 'Lodge/Meeting Hall',
  'Loft/Creative Space', 'Lumberyard', 'Manufactured Homes/Mobile Home Park', 'Marina',
  'Master Planned Community', 'Medical', 'Mixed Use', 'Motel', 'Movie Theater',
  'Movie/Radio/TV Studio', 'MultiFamily', 'Neighborhood Center', 'Office', 'Office Park',
  'Open Space', 'Outlet Center', 'Parking Garage', 'Parking Lot', 'Pasture/Ranch',
  'Planned Unit Development', 'Police/Fire Station', 'Post Office', 'Power Center',
  'Public Library', 'Public Park', 'Public Swimming Pool', 'R&D', 'Race Track',
  'Radio/TV Transmission Facility', 'Railroad Yard', 'Recycling Center',
  'Refrigeration/Cold Storage', 'Regional Mall', 'Rehabilitation Center',
  'Religious Facility', 'Restaurant', 'Retail', 'Retail Warehouse', 'Schools',
  'Self-Storage', 'Service Station', 'Shelter', 'Shipyard', 'Single Family Development',
  'Single Family Residence', 'Skating Rink', 'Specialty/Festival/Entertainment',
  'Storefront Retail/Residential', 'Storefront', 'Storefront Retail/Office',
  'Strip Center', 'Supermarket', 'Theater/Concert Hall', 'Timberland',
  'Trailer/Camper Park', 'Truck Stop', 'Truck Terminal', 'Utility Sub-Station',
  'Veterinarian/Kennel', 'Warehouse', 'Water Retention Facility',
  'Water Treatment Facility', 'Winery/Vineyard',
];

// Grading — how build-ready the dirt is, raw to finished.
export const GRADING_OPTIONS = [
  'Raw Land', 'Rough Graded', 'Finish Grade', 'Finished Lot',
  'Previously Developed Lot', 'Asphalt Paved Lot',
];
// Rank for scoring: a listing at or above the buyer's minimum readiness scores full.
export const GRADING_RANK = {
  'Raw Land': 1, 'Rough Graded': 2, 'Finish Grade': 3,
  'Previously Developed Lot': 3, 'Finished Lot': 4, 'Asphalt Paved Lot': 4,
};

// Permitting & Approvals — what's already in hand.
export const PERMITTING_OPTIONS = [
  { key: 'approved_plan', label: 'Approved Plan' },
  { key: 'engineering',   label: 'Engineering' },
  { key: 'maps',          label: 'Maps' },
];

// Utilities — the full LoopNet set (9), superseding the old 5.
export const LAND_UTILITIES = [
  { key: 'curb_gutter',    label: 'Curb / Gutter' },
  { key: 'streets',        label: 'Streets' },
  { key: 'electric',       label: 'Electricity' },
  { key: 'natural_gas',    label: 'Gas' },
  { key: 'municipal_water', label: 'Water' },
  { key: 'sanitary_sewer', label: 'Sewer' },
  { key: 'cable',          label: 'Cable' },
  { key: 'telephone',      label: 'Telephone' },
  { key: 'irrigation',     label: 'Irrigation' },
];

// Secondary Type — land classification.
export const LAND_SECONDARY_TYPES = ['Commercial', 'Industrial', 'Residential', 'Agricultural'];

// Topography — single-select-per-tag, richer than LoopNet (keeps wooded/cleared/wetlands).
export const TOPOGRAPHY_OPTIONS = [
  { key: 'level',    label: 'Level / Flat' },
  { key: 'rolling',  label: 'Rolling' },
  { key: 'sloped',   label: 'Sloped' },
  { key: 'steep',    label: 'Steep' },
  { key: 'wooded',   label: 'Wooded' },
  { key: 'cleared',  label: 'Cleared' },
  { key: 'wetlands', label: 'Wetlands / Marsh' },
];
