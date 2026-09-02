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
    sizePriceWhy: {
      size: "Square footage is the starting point for almost every office decision. Too small and the team doesn't fit. Too large and the client is paying for space they'll never use. We weight this heavily because it sets the ceiling on everything else.",
      price: "Rent is a fixed monthly commitment that compounds over a multi-year lease. A space that's over budget on day one only gets harder to justify as the lease goes on. We weight this heavily because no other factor matters if the numbers don't work.",
    },
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high',
        why: "ADA compliance is a federal legal requirement for most commercial tenants, not a preference. Retrofitting a non-compliant building is expensive and slow. We weight this high because it's either there or it isn't, and if it isn't, someone is paying to fix it." },
      { key: 'number_of_offices', label: 'Number of Offices', default: 'high',
        why: "Private offices are physical rooms with walls and doors. You can reconfigure furniture but you can't add rooms without a build-out, permits, and landlord approval. We weight this high because what the space has today is largely what your client is getting." },
      { key: 'conference_rooms', label: 'Conference Rooms', default: 'high',
        why: "Conference rooms are harder to add than most tenants expect. They require walls, soundproofing, and often sprinkler adjustments. We weight this high because it directly affects how the team functions day to day and can't easily be improvised." },
      { key: 'natural_light', label: 'Natural Light', default: 'normal',
        why: "Natural light comes from the building's orientation, floor plan, and window placement. None of those change after a lease is signed. We weight this because some clients won't take a space without it, and it genuinely affects employee wellbeing and retention." },
      { key: '24_7_access', label: '24/7 Access', default: 'normal',
        why: "24/7 access is a building-level policy set by the landlord and property management. Some buildings simply don't allow after-hours entry regardless of what a tenant wants. We weight this because for clients who need it, a building that doesn't offer it is a non-starter." },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal',
        why: "In-suite restrooms mean your client's team never has to share facilities with other tenants on the floor. This is a building layout decision that can't be changed. We weight this because it matters significantly in certain industries and client cultures." },
      { key: 'fitness_center', label: 'Fitness Center', default: 'low',
        why: "An on-site fitness center is a building amenity that tenants use to attract and retain employees. It's not critical, but it's a meaningful differentiator for clients in competitive talent markets. We weight this lower because most teams can work around its absence." },
      { key: 'cafe_food_service', label: 'Cafe / Food Service', default: 'low',
        why: "On-site food service changes how teams spend their lunch breaks and whether employees stay on-campus during the day. It's a nice-to-have that some clients treat as important for culture. We weight this lower because it's rarely a dealbreaker and there are usually alternatives nearby." },
      { key: 'covered_parking', label: 'Covered Parking', default: 'low',
        why: "Covered parking is a fixed building feature that can't be added after the fact. For clients in colder climates or with frequent client visits, it matters more than people initially think. We weight this lower because it's a convenience factor rather than an operational one." },
      { key: 'building_class', label: 'Building Class', default: 'low',
        why: "Building class reflects the age, condition, finishes, and overall quality of the property. It affects brand perception, client impressions, and sometimes the caliber of neighboring tenants. We weight this lower because class preference varies widely and a great B building often beats a mediocre A." },
      { key: 'server_room_it', label: 'Server Room / IT', default: 'low',
        why: "Dedicated server rooms and structured IT infrastructure are expensive and difficult to add after a lease is signed. For tech-dependent teams, the existing infrastructure is the baseline they're building on. We weight this lower because not every tenant needs it, but for those who do, it matters a lot." },
      { key: 'other_amenities', label: 'Other Amenities', default: 'low', expandable: 'office_amenities',
        why: "The remaining building amenities, things like EV charging, tenant lounges, rooftop access, and backup generators, add quality of life without being core to how a business operates. We weight the group together because collectively they paint a picture of how well the building is managed and invested in." },
    ],
  },
  medical_office: {
    label: 'Medical Office (Lease)',
    sizePriceWhy: {
      size: "Square footage in a medical office isn't just about headcount. Exam rooms, waiting areas, and procedure spaces each have minimum size requirements set by state licensing boards. We weight this heavily because undersized medical space can't be fixed with furniture.",
      price: "Medical office leases run long, often 7 to 10 years, which makes the monthly rent a compounding commitment. A space that's over budget at signing becomes a financial anchor as the practice grows. We weight this heavily because no clinical advantage offsets unsustainable rent.",
    },
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high',
        why: "ADA compliance is a federal legal baseline for any medical practice serving patients. Non-compliant spaces expose the tenant to liability and often can't be corrected without structural work. We weight this high because it's a requirement, not a preference." },
      { key: 'hipaa_compliant_layout', label: 'HIPAA Compliant Layout', default: 'high',
        why: "HIPAA requires that patient conversations and records can't be overheard or accessed by others. Open-plan layouts, thin walls, and shared reception areas can make compliance impossible without a full build-out. We weight this high because no medical practice can operate legally without it." },
      { key: 'exam_rooms', label: 'Exam Rooms', default: 'normal',
        why: "Exam rooms are the production units of a medical practice. Adding them requires permits, plumbing rough-ins, and specific dimensions. We weight this because the number of exam rooms is one of the clearest constraints on how many patients a practice can see per day." },
      { key: 'procedure_rooms', label: 'Procedure Rooms', default: 'normal',
        why: "Procedure rooms require additional infrastructure including specific electrical, ventilation, and sometimes plumbing that can't be improvised. We weight this because a practice that needs procedure space and doesn't have it can't simply work around that gap." },
      { key: 'lab_space', label: 'Lab Space', default: 'normal',
        why: "On-site lab space requires specific plumbing, ventilation, and in some states, separate licensing. It can't be added by rearranging existing rooms. We weight this because for practices that rely on in-house testing, its absence changes how care is delivered." },
      { key: 'waiting_room_capacity', label: 'Waiting Room Capacity', default: 'normal',
        why: "Waiting room capacity directly limits patient throughput. A practice scheduling 20 patients per hour needs room for them to actually wait. We weight this because it's a physical constraint that can't be addressed without relocating walls." },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal',
        why: "In-suite restrooms are required for specimen collection in many medical specialties and expected by patients in a clinical setting. Shared hallway restrooms create privacy and compliance issues. We weight this because it affects both patient experience and regulatory compliance." },
      { key: 'x_ray_shielded_room', label: 'X-Ray / Shielded Room', default: 'normal',
        why: "X-ray shielding is built into the walls during construction. It cannot be added to an existing room without gutting and rebuilding it. We weight this because for imaging-dependent practices, a space without it simply doesn't work." },
      { key: 'medical_gas_lines', label: 'Medical Gas Lines', default: 'normal',
        why: "Medical gas lines, including oxygen, nitrous oxide, and vacuum, require certified installation and are built into the infrastructure. Retrofitting them is expensive and often requires landlord approval and structural access. We weight this because practices that need them can't operate without them." },
      { key: 'sterilization_area', label: 'Sterilization Area', default: 'normal',
        why: "Sterilization areas require specific plumbing, ventilation, and clearances set by state health departments. They can't be improvised in a corner of an existing room. We weight this because for surgical and procedure-based practices, it's a licensing requirement, not a convenience." },
      { key: '24_7_access', label: '24/7 Access', default: 'normal',
        why: "Some medical practices, particularly urgent care, behavioral health, and on-call services, need after-hours access for providers if not patients. Building access policies are set by property management and don't change easily. We weight this because for the practices that need it, it's non-negotiable." },
      { key: 'fitness_center', label: 'Fitness Center', default: 'low',
        why: "An on-site fitness center is an employee retention amenity, not a clinical requirement. It matters more for larger practices with administrative staff than for small clinical teams. We weight this lower because it has no bearing on how care is delivered." },
      { key: 'other_amenities', label: 'Other Building Amenities', default: 'low', expandable: 'office_amenities',
        why: "Shared building amenities like parking, EV charging, and tenant lounges add convenience for staff and patients but don't affect clinical operations. We weight the group together as a quality-of-life signal rather than a functional requirement." },
    ],
  },
  retail: {
    label: 'Retail (Lease)',
    sizePriceWhy: {
      size: "Retail square footage determines how much product you can display, how many customers can be in the space at once, and how the store feels to walk through. Too small and the experience suffers. Too large and the rent per sale becomes unsustainable. We weight this heavily because it defines the entire retail model.",
      price: "Retail rent is paid out of sales, which makes the rent-to-revenue ratio one of the most watched numbers in the business. A space that costs too much relative to expected sales volume will fail regardless of everything else. We weight this heavily because profitability starts here.",
    },
    items: [
      { key: 'ada_compliant', label: 'ADA Compliant', default: 'high',
        why: "ADA compliance is a federal legal requirement for businesses open to the public. Non-compliant entrances, aisles, and restrooms expose the tenant to lawsuits and can require expensive retrofitting. We weight this high because it's a condition of operating legally, not a preference." },
      { key: 'capacity', label: 'Capacity', default: 'normal',
        why: "Fire code limits how many people can occupy a space at once. For restaurants, event retailers, and fitness concepts, that limit is a direct ceiling on revenue. We weight this because a tenant whose business model requires 200 people in the space at a time cannot make a 100-person space work." },
      { key: 'in_suite_restrooms', label: 'In-Suite Restrooms', default: 'normal',
        why: "In-suite restrooms are required for food and beverage tenants and expected by customers in most service-based retail. Shared hallway restrooms create a friction point that hurts the customer experience. We weight this because for the businesses that need it, shared restrooms are a dealbreaker." },
      { key: 'foot_traffic', label: 'Foot Traffic', default: 'normal',
        why: "Foot traffic is the lifeblood of most retail concepts. A destination business can survive in a quiet location. An impulse or convenience concept cannot. We weight this because the traffic pattern of a location is set by its surroundings and can't be manufactured." },
      { key: 'traffic_count_tier', label: 'Traffic Count Tier', default: 'normal',
        why: "Vehicle traffic count tells you how many potential customers pass the location every day. More exposure means more walk-in opportunity. We weight this because drive-by visibility is built into the road network and can't be changed by the tenant." },
      { key: 'location_type', label: 'Location Type', default: 'normal',
        why: "Whether a space is in a strip mall, a standalone building, or inline in a mixed-use development shapes co-tenancy, parking access, and the type of customer who arrives. These are fixed characteristics of the property. We weight this because the right location type depends entirely on the business model." },
      { key: 'length', label: 'Length', default: 'normal',
        why: "The length of a retail space determines how deep inventory can be displayed and how merchandise flow works. A long narrow space works differently than a wide shallow one. We weight this because some retail concepts simply don't fit certain footprint shapes regardless of total square footage." },
      { key: 'width', label: 'Width', default: 'normal',
        why: "Width determines storefront presence and how visible the space is from the sidewalk or parking lot. A narrow frontage reduces visibility and limits signage. We weight this because frontage is a fixed characteristic of the space." },
      { key: 'ceiling_height', label: 'Ceiling Height', default: 'normal',
        why: "Ceiling height affects what can be stored, how lighting works, and the overall feel of the space. High-cube retail or food and beverage concepts with elevated equipment need minimum heights to operate. We weight this because ceiling height is set by the building structure and can't be changed." },
      { key: 'signage_rights', label: 'Signage Rights', default: 'low',
        why: "Signage is how a retail business announces itself to passing traffic. Landlords and municipalities both regulate what's allowed, and some buildings restrict tenants to minimal or no exterior signage. We weight this lower because it matters more for some concepts than others, but it's worth knowing upfront." },
      { key: 'building_class', label: 'Building Class', default: 'low',
        why: "Building class reflects the overall quality, condition, and profile of the property. It affects brand perception and the caliber of co-tenants. We weight this lower because for retail, location and traffic often matter more than whether the finishes are Class A." },
      { key: 'special_features', label: 'Special Features', default: 'low', expandable: 'retail_features',
        why: "Features like drive-thrus, grease traps, cold storage, and auto bays are infrastructure requirements for specific retail and food concepts. They're expensive and difficult to add after a lease is signed. We weight the group together because they're dealbreakers for the concepts that need them and irrelevant for those that don't." },
    ],
  },
  industrial_flex: {
    label: 'Industrial / Flex (Lease)',
    sizePriceWhy: {
      size: "Industrial square footage determines how much equipment, inventory, and workforce can operate simultaneously. Unlike office space, square footage here is often directly tied to production output or storage capacity. We weight this heavily because the business model is built around a specific footprint.",
      price: "Industrial leases tie up significant capital over long terms and often require tenant-funded build-outs. A space that stretches the rent budget leaves nothing for the infrastructure improvements most industrial tenants need. We weight this heavily because the total occupancy cost determines whether the operation is viable.",
    },
    items: [
      { key: 'rail_access', label: 'Rail Access', default: 'dealbreaker',
        why: "Rail access is either built into the site or it isn't. You cannot add a rail spur after the fact. We treat this as a dealbreaker by default because tenants who need rail access for receiving or shipping have no workaround." },
      { key: 'crane_capacity', label: 'Crane Capacity', default: 'dealbreaker',
        why: "Overhead cranes require reinforced structural columns and ceiling clearance built into the building from the start. Retrofitting them is a major capital project that most landlords won't allow or fund. We treat this as a dealbreaker by default because manufacturing and heavy assembly tenants can't operate without it." },
      { key: 'clear_height', label: 'Clear Height', default: 'high',
        why: "Clear height is determined by the steel structure of the building. You can't add ceiling height after a building is constructed. A distribution tenant who needs 32 feet cannot make a 24-foot building work regardless of every other factor. We weight this heavily and penalize shortfalls sharply." },
      { key: 'dock_high_doors', label: 'Dock-High Doors', default: 'normal',
        why: "Dock-high doors allow trailers to back directly to the building floor for loading and unloading. Adding them requires cutting through the building envelope, which is expensive and often requires structural work. We weight this because the number of dock doors directly limits shipping and receiving throughput." },
      { key: 'floor_load', label: 'Floor Load', default: 'normal',
        why: "Floor load capacity is engineered into the concrete slab during construction. Reinforcing an existing slab is a major project that typically requires removing and replacing it entirely. We weight this heavily because heavy manufacturing and storage operations simply cannot use a slab that isn't rated for their equipment." },
      { key: 'drive_in_doors', label: 'Drive-In Doors', default: 'normal',
        why: "Drive-in or grade-level doors allow vehicles and forklifts to enter the building directly from the ground. Adding them requires cutting through the building envelope and may require grading work outside. We weight this because operations that need ground-level vehicle access can't easily substitute dock doors." },
      { key: 'amperage', label: 'Amperage', default: 'normal',
        why: "Electrical amperage determines how much power-intensive equipment can run simultaneously. Upgrading a building's service requires utility coordination, transformer work, and can take months. We weight this because manufacturing and processing tenants who exceed the available power have no short-term fix." },
      { key: '3_phase_power', label: '3-Phase Power', default: 'normal',
        why: "Three-phase power is required by most industrial motors, CNC machines, and compressors. Single-phase buildings can be upgraded but it requires utility work and landlord cooperation. We weight this because for tenants who need it, a building without it is a non-starter." },
      { key: 'outside_storage', label: 'Outside Storage', default: 'normal',
        why: "Outside storage permission is a zoning and landlord policy decision. Many industrial parks explicitly prohibit it for aesthetic and liability reasons. We weight this because for contractors, landscapers, and distributors who need to stage equipment or materials outside, the absence of this right fundamentally changes their operation." },
      { key: 'fenced_yard', label: 'Fenced Yard', default: 'normal',
        why: "A fenced and secured yard protects equipment and inventory stored outside and is a requirement for some industries from an insurance standpoint. Adding fencing requires landlord permission and often site plan approval. We weight this because operations that store high-value assets outdoors need it." },
      { key: 'truck_court_depth', label: 'Truck Court Depth', default: 'normal',
        why: "Truck court depth determines whether full-size semi-trucks can maneuver to the dock doors safely. The standard for a 53-foot trailer is 130 feet of clear depth. A shallow court creates operational bottlenecks that can't be engineered away. We weight this because it limits what type of freight and carrier a tenant can use." },
      { key: 'land_lot_size', label: 'Land / Lot Size', default: 'normal',
        why: "Total land area determines how much room exists for truck staging, outdoor storage, employee parking, and future expansion. A tight site limits operational flexibility in ways that become apparent only after move-in. We weight this because site constraints are permanent." },
      { key: 'voltage', label: 'Voltage', default: 'normal',
        why: "Specific voltage requirements are set by the equipment a tenant operates. 240V and 480V serve different machinery, and converting between them requires an electrician and often utility coordination. We weight this because a voltage mismatch means the tenant's equipment won't run." },
      { key: 'esfr_sprinklers', label: 'ESFR Sprinklers', default: 'low',
        why: "ESFR (Early Suppression Fast Response) sprinklers are required by fire code for high-pile storage above certain heights. Retrofitting them is expensive and disruptive. We weight this lower because it only applies to specific storage operations, but for those tenants it's often mandatory by their insurer." },
      { key: 'warehouse_hvac', label: 'Warehouse HVAC', default: 'low',
        why: "Climate-controlled warehouse space costs significantly more to build and operate. It's required for food, pharmaceutical, and sensitive electronics storage. We weight this lower because most industrial tenants don't need conditioned warehouse space, but for those who do, it's a hard requirement." },
      { key: 'dock_equipment', label: 'Dock Equipment', default: 'low', expandable: 'dock_equipment_items',
        why: "Dock levelers, seals, and restraints make loading and unloading safer and faster. They're standard equipment in newer facilities but often missing in older buildings. We weight this lower because they can be added by the tenant, but they represent a real upfront cost if not already in place." },
      { key: 'skylights', label: 'Skylights', default: 'low',
        why: "Skylights reduce artificial lighting costs and improve the work environment for staff on the floor. They're a fixed feature of the building's roof structure. We weight this lower because it's a quality-of-life factor rather than an operational requirement." },
      { key: 'led_lighting', label: 'LED Lighting', default: 'low',
        why: "LED lighting in a warehouse reduces energy costs meaningfully over a long lease term. Older buildings with sodium or fluorescent fixtures can be retrofitted, but it's a tenant cost. We weight this lower because it's an efficiency factor, not an operational one, but it matters over a 5 to 10 year lease." },
    ],
  },
  land: {
    label: 'Land (Commercial)',
    sizePriceWhy: {
      size: "Acreage sets the ceiling on what can be built. A site that's too small for the intended building footprint, parking ratios, and setbacks required by code simply cannot accommodate the project, regardless of everything else. We weight this heavily because you can't buy more land after the fact.",
      price: "Land is typically purchased outright, making the price a permanent capital commitment rather than a monthly expense. Overpaying for land compresses the return on everything built on top of it. We weight this heavily because land cost is the foundation the entire project's economics are built on.",
    },
    items: [
      { key: 'proposed_use', label: 'Proposed Use', default: 'high',
        why: "The single most important thing about a parcel is whether it can become what your client wants to build. A site marketed for self-storage and one for a restaurant attract completely different buyers because zoning, access, and infrastructure differ. We weight this heavily because a use mismatch means the deal simply doesn't work." },
      { key: 'land_type', label: 'Land Type', default: 'normal',
        why: "The broad classification — commercial, industrial, residential, or agricultural — sets the frame for everything else. A buyer hunting industrial land and one hunting a residential subdivision are looking at different markets. We weight this because it's the fastest filter for whether a parcel is even in the right category." },
      { key: 'buildable', label: 'Buildable / Developable', default: 'high',
        why: "Buildable means permits, utilities, and zoning are aligned for construction. A non-buildable parcel requires variances, environmental remediation, or utility extension before a shovel goes in the ground. We weight this heavily because it's the difference between a development site and a land banking play." },
      { key: 'grading', label: 'Grading / Site Readiness', default: 'normal',
        why: "Raw land versus a finished, graded pad can be a six or seven figure difference to a developer. A shovel-ready lot saves months and real money. We weight this because site readiness directly affects both the budget and the timeline of any project." },
      { key: 'permitting', label: 'Permitting & Approvals', default: 'normal',
        why: "Approved plans, completed engineering, and recorded maps can be worth more than the dirt itself. A parcel that's already entitled skips the single slowest and riskiest part of development. We weight this because entitlements in hand de-risk the entire deal." },
      { key: 'no_wetlands', label: 'No Wetlands', default: 'normal',
        why: "Wetlands are federally regulated. Building on or near them requires Army Corps of Engineers permits and in some cases mitigation land purchases. You can drain wetlands, but it's expensive, slow, and not always approved. We score a miss here as a significant penalty rather than a dealbreaker because it's fixable, just costly." },
      { key: 'outparcel', label: 'Outparcel', default: 'low',
        why: "Outparcels — the standalone pads in front of a shopping center — are specifically hunted by quick-service restaurants, banks, and drive-thru retail. For those buyers it's essential; for everyone else it's irrelevant. We score this as additive because it matters intensely to a narrow set of buyers." },
      { key: 'topography', label: 'Topography', default: 'normal',
        why: "The lay of the land — level, rolling, sloped, or steep — drives grading cost and buildable area. Steep sites need retaining walls and engineered foundations. We weight this because topography is a fixed physical constraint that shapes what's economically possible on the site." },
      { key: 'site_access', label: 'Site Access', default: 'normal',
        why: "A landlocked parcel with no direct road access requires an easement from a neighboring landowner before it can be developed. Easements can be negotiated but they're not guaranteed. We weight this because a site without access is a site that can't be used until that legal issue is resolved." },
      { key: 'road_surface', label: 'Road Surface', default: 'low',
        why: "The surface quality of the road leading to a site affects construction logistics and delivery access. Paved access is the standard expectation for commercial development. We weight this modestly because upgrading a road is possible but requires municipal or private coordination." },
      { key: 'utilities_at_site', label: 'Utilities at Site', default: 'low',
        why: "Water, sewer, electric, gas, and the rest already at the property line eliminate the cost and timeline of extending service, which can run into six figures for a large site. We score utilities as additive — their presence is a cost savings, their absence a budget line rather than a dealbreaker." },
      { key: 'road_frontage', label: 'Road Frontage', default: 'low',
        why: "Frontage is the width of the parcel along the road, which drives visibility, curb-cut placement, and how much of the site is exposed to passing traffic. Retail and commercial uses value it far more than industrial. We score this as a preference because it matters intensely to some uses and barely at all to others." },
      { key: 'traffic_count', label: 'Traffic Count', default: 'low',
        why: "Vehicles per day on the fronting road is a direct proxy for exposure — it's what a gas station, drive-thru, or retailer is really buying. For a warehouse or land bank it's irrelevant. We score this as a preference that carries real weight for traffic-dependent uses and none for the rest." },
    ],
  },
  land_residential: {
    label: 'Residential Land',
    sizePriceWhy: {
      size: "Lot size determines what can be built within the setbacks, coverage limits, and zoning rules of the municipality. A lot that's too small for the home footprint your client wants simply won't work, regardless of everything else about it. We weight this heavily because you can't expand a lot after purchase.",
      price: "Land price is a permanent capital commitment that rolls into the total cost of the build. Overpaying for the lot compresses the budget for construction and leaves less room for the finishes and features your client actually wants. We weight this heavily because land cost sets the financial baseline for the entire project.",
    },
    items: [
      { key: 'no_wetlands', label: 'No Wetlands', default: 'normal',
        why: "Wetlands are federally protected and building near them requires environmental permits that can take months or years to obtain. Draining or filling wetlands is possible in some cases but expensive and not always approved. We score a miss as a significant penalty rather than a dealbreaker because it's fixable, just costly and slow." },
      { key: 'utilities_at_site', label: 'Utilities at Site', default: 'low',
        why: "Water, sewer, electric, and gas already at the lot line save the buyer the cost and delay of extending service or installing a well and septic. We score utilities as additive — their presence is a cost savings, their absence a budget line and alternative, not a hard blocker for most residential builds." },
      { key: 'road_frontage', label: 'Road Frontage', default: 'low',
        why: "Frontage is the width of the lot along the road, which affects the buildable footprint, driveway placement, and privacy. We score this as a preference because the right amount depends heavily on the home and lot layout your client has in mind." },
      { key: 'survey_available', label: 'Survey Available', default: 'low',
        why: "An existing survey confirms the exact boundaries, easements, and setbacks of the lot, saving the buyer the cost and wait of commissioning one before they can plan a build. We score this as additive because a survey can always be ordered — its presence is a convenience and a small cost savings." },
    ],
  },
  single_family: {
    label: 'Single Family Home',
    sizePriceWhy: {
      size: "Square footage determines how a family lives in a home day to day. A house that's too small creates a problem that can only be solved by moving. We weight this heavily because it's the most fundamental physical reality of any home purchase.",
      price: "A mortgage is typically the largest monthly commitment in a buyer's budget and it compounds over 30 years. A house that stretches the budget on day one creates financial pressure that doesn't go away. We weight this heavily because affordability sets the entire search.",
    },
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high',
        why: "Adding a bedroom isn't as simple as adding a wall. In most cities it requires egress, a window large enough to climb out of in an emergency. That means permitted structural work, not just a renovation. We weight this heavily because the bedroom count you see is largely the bedroom count you're getting." },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high',
        why: "Adding a full bathroom requires plumbing rough-ins that aren't always available where you'd want the bathroom. Half baths are easier to add than full baths but still require permits and structural access. We weight this because the bathroom count shapes daily routines for everyone in the house." },
      { key: 'lot_size', label: 'Lot Size', default: 'high',
        why: "Lot size determines outdoor space, privacy from neighbors, and what can be added in the future like a pool, garage, or addition. You can't buy more land after closing. We weight this because buyers who care about land either get it upfront or they don't get it." },
      { key: 'garage_spaces', label: 'Garage Spaces', default: 'normal',
        why: "Adding garage space requires either building a new structure or converting existing space, both of which need permits, cost significant money, and may be limited by lot coverage rules. We weight this because the garage situation at purchase is close to the garage situation for the life of ownership." },
      { key: 'stories', label: 'Stories', default: 'normal',
        why: "The number of stories affects livability in ways that are personal and hard to change. A buyer with mobility concerns may need single-story. A family wanting separation between parent and kid bedrooms may want two stories. We weight this because it reflects a genuine lifestyle preference that can't be retrofitted." },
      { key: 'basement', label: 'Basement', default: 'low',
        why: "A basement adds usable square footage and can be finished over time, but whether one exists is determined by the foundation type, which was set at construction. Adding a basement to an existing home is extremely rare and prohibitively expensive. We weight this lower because it's a nice-to-have for many buyers, not a requirement." },
      { key: 'features_amenities', label: 'Features & Amenities', default: 'normal', expandable: 'sf_features',
        why: "Features like a pool, finished deck, or fenced yard add immediate value and livability but vary widely in how much they matter to different buyers. We score the group together because collectively they reflect how move-in-ready and lifestyle-ready the home is for your specific client." },
    ],
  },
  condo: {
    label: 'Condo',
    sizePriceWhy: {
      size: "Condo square footage is fixed by the unit and building layout. Unlike a house, there's no lot to expand into and no adjacent space to absorb. We weight this heavily because condo buyers are buying exactly the space they see, not potential.",
      price: "Condo price includes not just the purchase price but ongoing HOA fees that can be substantial. A unit that looks affordable can become expensive when maintenance fees are factored in. We weight this heavily because the total cost of ownership is what actually determines affordability.",
    },
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high',
        why: "Condo bedrooms are defined by the unit's floor plan and building layout. You can't add a bedroom to a condo the way you might convert a room in a house. We weight this heavily because the bedroom count is fixed at purchase." },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high',
        why: "Adding a bathroom to a condo requires rerouting plumbing that runs through shared building infrastructure, which typically requires HOA approval and significant cost. We weight this because the bathroom count at purchase is effectively permanent." },
      { key: 'parking', label: 'Parking', default: 'normal',
        why: "Parking in a condo building is assigned by the HOA and there are typically a fixed number of spaces per unit. Additional spots are rarely available and often expensive when they are. We weight this because for buyers with multiple vehicles, parking availability is a real constraint." },
      { key: 'pet_policy', label: 'Pet Policy', default: 'dealbreaker',
        why: "Pet policies are set by the HOA and changing them requires a board vote across all unit owners. A building that doesn't allow pets won't allow them for your client's tenancy regardless of the landlord's preferences. We treat this as a dealbreaker by default because there's no workaround." },
      { key: 'building_amenities', label: 'Building Amenities', default: 'high', expandable: 'condo_amenities',
        why: "Condo amenities like a fitness center, pool, or rooftop terrace are part of what justifies the HOA fee. They affect quality of life and resale value. We weight this because condo buyers are paying for the building experience, not just the unit." },
    ],
  },
  apartment: {
    label: 'Apartment',
    sizePriceWhy: {
      size: "Apartment square footage defines how comfortable a renter's daily life is. Too small and it becomes a stressor, not a home. We weight this because the footprint is fixed by the unit and building and it directly affects livability for the entire lease term.",
      price: "Monthly rent is the core financial commitment of any lease. A unit that's over budget creates financial stress that doesn't go away for the duration of the tenancy. We weight this heavily because affordability is the first filter on any apartment search.",
    },
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high',
        why: "Apartment bedroom count is set by the floor plan. You can't add a bedroom to a rental unit. We weight this heavily because a renter who needs two bedrooms and rents a one-bedroom has a problem that the lease can't solve." },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high',
        why: "Bathroom count in an apartment is determined by the unit layout and can't be changed by the renter. We weight this because shared bathrooms in a multi-person household affect daily routine in ways that compound over a lease term." },
      { key: 'parking', label: 'Parking', default: 'normal',
        why: "Apartment parking is assigned by the building and availability is often limited. Street parking isn't always reliable or safe. We weight this because a renter with a vehicle who doesn't have guaranteed parking faces an ongoing problem every day of the lease." },
      { key: 'lease_term', label: 'Lease Term', default: 'normal',
        why: "Lease term is negotiable but landlords have preferences based on their vacancy strategy. A renter who needs a 6-month lease in a building that only offers 12-month leases faces a real mismatch. We weight this because it affects a renter's flexibility and the landlord's willingness to negotiate other terms." },
      { key: 'pet_policy', label: 'Pet Policy', default: 'dealbreaker',
        why: "Pet policies are set by the building owner or property management and rarely change mid-tenancy. A building that doesn't allow pets won't allow them regardless of how long the renter has lived there. We treat this as a dealbreaker by default because there's no workaround for a renter with a pet." },
      { key: 'building_amenities', label: 'Building Amenities', default: 'high', expandable: 'apt_amenities',
        why: "Apartment building amenities like a gym, laundry, and package room reduce the need for external services and make daily life more convenient. We weight this because for renters, the building experience is a significant part of what they're paying for beyond the unit itself." },
    ],
  },
  townhouse: {
    label: 'Townhouse',
    sizePriceWhy: {
      size: "Townhouse square footage spans multiple floors and can feel very different from the same square footage in a single-story home. We weight this heavily because it sets the livability ceiling for everyday life in the space.",
      price: "Townhouse pricing often includes HOA fees on top of the mortgage, which can add meaningfully to the monthly commitment. We weight this heavily because total housing cost is what determines whether the purchase is sustainable.",
    },
    items: [
      { key: 'bedrooms', label: 'Bedrooms', default: 'high',
        why: "Townhouse bedrooms are set by the floor plan and building structure. Adding a bedroom would require modifying shared walls or structural elements, which is typically prohibited by the HOA. We weight this heavily because the bedroom count at purchase is the bedroom count for as long as your client owns it." },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high',
        why: "Adding a bathroom to a townhouse requires plumbing access that may run through shared building infrastructure. HOA approval is typically required for any plumbing modifications. We weight this because the bathroom situation is effectively fixed at purchase." },
    ],
  },
  manufactured: {
    label: 'Manufactured / Mobile Home',
    sizePriceWhy: {
      size: "Manufactured home square footage is fixed by the unit dimensions, which are set at the factory. Expanding a manufactured home after placement is a significant structural undertaking. We weight this heavily because what you see is largely what you get.",
      price: "Manufactured home pricing is often more affordable than site-built housing but still represents a major purchase. Lot rent, if the land isn't owned, adds a recurring cost that factors into affordability. We weight this heavily because the all-in monthly cost is what determines whether the purchase works financially.",
    },
    items: [
      { key: 'age_restriction', label: 'Age Restriction', default: 'dealbreaker',
        why: "Age-restricted communities (typically 55+) require that at least one resident meets the age requirement. This is enforced by the community and can't be waived by the seller or landlord. We treat this as a dealbreaker by default because a buyer who doesn't qualify simply cannot live there." },
      { key: 'bedrooms', label: 'Bedrooms', default: 'high',
        why: "Manufactured home bedrooms are set by the unit's factory floor plan. Structural modifications are difficult and often prohibited by community rules. We weight this heavily because the bedroom count at purchase reflects the unit your client will live in long-term." },
      { key: 'bathrooms', label: 'Bathrooms', default: 'high',
        why: "Bathroom count in a manufactured home is set by the factory layout. Modifying plumbing in a manufactured home is possible but more complex than in site-built housing. We weight this because it directly shapes daily life for everyone in the household." },
      { key: 'lot_size', label: 'Lot Size', default: 'high',
        why: "Lot size determines outdoor space, privacy from neighboring units, and what additions like a deck or shed are permitted. Community rules and lot dimensions are set and can't be expanded. We weight this because buyers who want outdoor space need to get it at purchase." },
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
    { key: 'rear_loading', label: 'Rear Loading / Alley Access' },
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
// If the type defines sizePriceWhy, those tooltip strings are merged into the
// shared Size and Price items (which otherwise carry no type-specific copy).
export function itemsForPropertyType(propertyType) {
  const typeConfig = CLIENT_WEIGHT_DEFAULTS[propertyType];
  if (!typeConfig) return [];
  const spWhy = typeConfig.sizePriceWhy || {};
  const sizePrice = SIZE_PRICE.map(item => (
    spWhy[item.key] ? { ...item, why: spWhy[item.key] } : item
  ));
  return [...UNIVERSAL_GATES, ...sizePrice, ...typeConfig.items];
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