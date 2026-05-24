/**
 * Hell is a Penthouse in Toronto — Location Definitions
 *
 * All navigable rooms in the penthouse and the Below.
 * description fields are injected verbatim into beforePrompt for LLM scene context.
 *
 * Structure:
 *   The Penthouse (Earth / Toronto)
 *     Lower Floor — Common Space
 *     Upper Floor — Private Quarters
 *   The Below (Citadel)
 *     Common Areas
 *     Character Chambers
 *     Lower Gardens (own floor tab)
 *
 * Off-limits rooms (war-room, below-war-room, below-adrian-office) appear on
 * the map at all times. The player can choose to enter — this is intentional.
 * Disobedience has consequences (RNG catch probability; tiers TBD).
 *
 * TODOs (Rin):
 *   - Replace all imageUrl placeholders once backgrounds are generated
 *   - Confirm unlock conditions for Below character chambers (relationship threshold?)
 *   - Confirm catch/consequence tiers for off-limits rooms (per character)
 *   - Lower Gardens pull logic: escalating environmental cues from Citadel rooms (TBD)
 *   - Night Realm map (Lilith's personal domain) — Phase 2 backlog
 *   - Transition event bank: 8 narrative beats for Earth ↔ Below travel (TBD)
 *   - Weighted RNG character location table: character × room × time-of-day (TBD)
 */

import { LocationId, LocationDefinition } from '../types';


// ─────────────────────────────────────────────────────────────────────────────
// PENTHOUSE — LOWER FLOOR (COMMON SPACE)
// ─────────────────────────────────────────────────────────────────────────────

const PENTHOUSE_COMMON: LocationDefinition[] = [

    {
        id: 'formal-receiving',
        name: 'Formal Receiving Room',
        description: `The first interior space after the elevator — where guests are received, where expectations are set. It is a room designed to be looked at before it is lived in. The furniture is precise, the proportions considered; the view through the tall windows reminds a visitor exactly how high up they are. Umbri receives {{user}} here on arrival. Everything that follows begins in this room.`,
        defaultOccupants: [],
        chatImageUrl: '/images/backgrounds/penthouse-formalReceivingChat-evening.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-formalReceivingMap-evening.png',
        imagePrompt: 'Penthouse formal receiving room, elegant entry space, tall windows, Toronto high-rise evening light, understated luxury, composed and deliberate',
    },

    {
        id: 'dining-room',
        name: 'Dining Room',
        description: `Used nightly. The table is long enough that distance is a statement, and seating is never random — who sits where, who is served first, what is said in front of whom. Court dynamics play out here as surely as anywhere in the Below. The dining room is one of the primary stages for household politics, which means it is also one of the primary stages for everything else.`,
        defaultOccupants: [],
        chatImageUrl: '/images/backgrounds/penthouse-diningChat-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-diningMap-night.png',
        imagePrompt: 'Penthouse dining room, long dark table, candlelight, formal setting, Toronto high-rise, luxury and tension, understated wealth',
    },

    {
        id: 'library',
        name: 'Library',
        description: `Floor-to-ceiling shelving, organised by a logic that becomes legible over time if you pay attention. Callum's domain in the way that a collector's museum is their domain — the material is everywhere, the ownership is understood without being stated. One of the few common spaces where {{user}} can move freely without that movement reading as encroachment. The silence here is different from the silence in other rooms.`,
        defaultOccupants: ['callum'],
        chatImageUrl: '/images/backgrounds/penthouse-libraryChat-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-libraryMap-night.png',
        imagePrompt: 'Penthouse library, floor-to-ceiling dark shelves, leather and amber tones, intimate reading lamps, Toronto night view through tall windows',
    },

    {
        id: 'war-room',
        name: 'War Room',
        description: `Active working space. Below dispatches, tactical assessments, earth-side Firstlight business — the actual operational centre of the household. Nothing here is decorative. The screens and surfaces are configured for utility, and the room feels different from the receiving rooms: less performed, more real. {{user}} has been told, clearly, that this room is not for them.`,
        defaultOccupants: ['luca'],
        isOffLimits: true,
        chatImageUrl: '/images/backgrounds/penthouse-warroomChat1-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-warroomMap-night.png',
        imagePrompt: 'Penthouse war room, screens and tactical maps, dark and functional, modern military aesthetic, Toronto penthouse, no ornamentation',
    },

];


// ─────────────────────────────────────────────────────────────────────────────
// PENTHOUSE — UPPER FLOOR (PRIVATE QUARTERS)
// ─────────────────────────────────────────────────────────────────────────────

const PENTHOUSE_QUARTERS: LocationDefinition[] = [

    {
        id: 'user-room',
        name: 'Your Room',
        description: `Not a cell — it's a room in the penthouse, and it shows. The confinement is structural rather than physical: the floor's security, the building's height, the understanding that there is nowhere to go. Umbri is present by default, attending without intruding. What the room tells {{user}} about their situation is mostly in what it doesn't say.`,
        defaultOccupants: [],
        chatImageUrl: '/images/backgrounds/penthouse-userBedroomChat-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-userBedroomMap-night.png',
        imagePrompt: 'Penthouse guest room, elegant and understated, dark palette, high floor, Toronto city view at night, quiet and contained',
    },

    {
        id: 'adrian-quarters',
        name: "Adrian's Quarters",
        description: `His territory, in the full sense of the word — the rest of the penthouse communicates his authority, but this room simply is it. Dark and extensive, attended by household staff in the moments he permits it. A permanent portal to the Below occupies one wall, sealed except when he chooses otherwise. Being here, without being invited, is a different category of transgression from most things {{user}} could do.`,
        defaultOccupants: ['adrian'],
        chatImageUrl: '/images/backgrounds/penthouse-adrianQuartersChat-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-adrianQuartersMap-night.png',
        imagePrompt: 'Penthouse suite, severe luxury, dark materials, portal aperture on one wall, no softness anywhere, controlled and absolute',
    },

    {
        id: 'sebastian-quarters',
        name: "Sebastian's Quarters",
        description: `Warmly lit, deliberately comfortable — the design logic here is the same as Sebastian's entire operational mode: create an environment where guard comes down. It works. The warmth is infrastructure. Kostas and Raura are based here and move through with the practiced ease of people who have long since stopped noticing what they're noticing. The portal is present but unobtrusive. Sebastian's quarters feel like an invitation, which is the point.`,
        defaultOccupants: ['sebastian'],
        chatImageUrl: '/images/backgrounds/penthouse-sebastianQuartersChat-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-sebastianQuartersMap-night.png',
        imagePrompt: 'Penthouse suite, warm amber lighting, comfortable and beautiful, deliberately approachable, velvet and warmth, portal subtle in background',
    },

    {
        id: 'callum-quarters',
        name: "Callum's Quarters",
        description: `Precision and order — every surface organised by a system that is immediately evident but not immediately legible. The adjacent study is where Zaros works, managing the administrative layer of Callum's operations; the boundary between Callum's personal space and his working space is not entirely clear, which may be intentional. The portal is well-integrated, architecturally. He has had a long time to get it right.`,
        defaultOccupants: ['callum'],
        chatImageUrl: '/images/backgrounds/penthouse-callumQuartersUI-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-callumQuartersMap-night.png',
        imagePrompt: 'Penthouse suite, precise and ordered, cool tones, scholarly aesthetic, every object deliberate, adjacent study visible through open door',
    },

    {
        id: 'luca-quarters',
        name: "Luca's Quarters",
        description: `Functional and spare — military in character in a way that isn't affectation, just the expression of someone who has never seen the point in surplus. Damon is usually nearby. The portal is there; the room doesn't dress it up. What the space communicates is efficiency, which is the only aesthetic Luca has ever consistently applied.`,
        defaultOccupants: ['luca'],
        chatImageUrl: '/images/backgrounds/penthouse-lucaQuartersUI-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-lucaQuartersMap-night.png',
        imagePrompt: 'Penthouse suite, functional and spare, military aesthetic without decoration, cool tones, no excess, portal present and understated',
    },

    {
        id: 'lilith-suite',
        name: "Lilith's Quarters & Office",
        description: `The personal chambers and the office are technically distinct spaces, but the boundary between them is managed by Lilith and shifts depending on what she needs. The mirror occupies one wall of the office — the entry point to her Night Realm, a personal domain within the Below that operates entirely by her rules. It looks like a mirror. The portal is elsewhere in the suite. Being here without invitation means {{user}} is either trusted completely or has made a very interesting mistake.`,
        defaultOccupants: ['lilith'],
        chatImageUrl: '/images/backgrounds/penthouse-lilithQuartersOfficeUI-night.PNG',
        mapImageUrl: '/images/backgrounds/penthouse-lilithQuartersOfficeMap-night.png',
        imagePrompt: 'Penthouse suite, beautiful and wrong in the seams, mirror covering one full wall, warm and unsettling, Night Realm portal aesthetic',
    },

];


// ─────────────────────────────────────────────────────────────────────────────
// THE BELOW — CITADEL (COMMON AREAS)
// ─────────────────────────────────────────────────────────────────────────────

const BELOW_COMMON: LocationDefinition[] = [

    {
        id: 'below-citadel',
        name: 'Citadel — Entry',
        description: `The general approach: corridors of black stone, the suppression that operates on earth lifting away here, the air carrying a weight that is not atmospheric in any conventional sense. The Citadel predates the hierarchy it now houses. Its architecture communicates permanence in the way that only structures built without the concept of endings can. The earth is very far above.`,
        defaultOccupants: [],
        isBelow: true,
        imageUrl: '',
        imagePrompt: 'Infernal citadel interior, black stone corridors, vast and ancient, no natural light, deep reds and obsidian, weight and permanence',
    },

    {
        id: 'below-throne',
        name: 'Throne Room',
        description: `Vast, obsidian, elevated. Malivorn's formal court space — it is never used casually, and the room makes casual impossible. The scale is psychic as much as physical: you understand, standing in it, that you are small, that you have always been small, and that this is not an assessment but a fact of geometry. Court convenes here during General visits. The throne itself is a presence in the room even when empty.`,
        defaultOccupants: ['adrian'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true } },
        imageUrl: '',
        imagePrompt: 'Infernal throne room, vast obsidian hall, elevated throne, deep reds and black, crushing scale, court setting, ancient and absolute',
    },

    {
        id: 'below-library',
        name: 'Library & Archives',
        description: `Extensive in a way that defies architectural accounting — the shelving system does not map cleanly onto the space it occupies. Managed by the Anunsep: small, sharp-legged library creatures with a retrieval instinct that operates slightly ahead of the request. One of the few spaces in the Citadel with a genuinely non-threatening atmosphere, though the Anunsep are unsettling in their own specific way if you watch them move. Callum maintains the classification system.`,
        defaultOccupants: ['callum'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true } },
        imageUrl: '',
        imagePrompt: 'Infernal library, impossible shelving depth, warm amber against dark stone, small spider-form creatures retrieving books, ancient knowledge, not quite threatening',
    },

    {
        id: 'below-dining',
        name: 'Citadel Dining Room',
        description: `Used nightly during Citadel visits, and the dynamics here carry more weight than in the penthouse — Malivorn's sovereignty is fully active in the Below, and the formal hierarchy is legible in the room itself. Who is present, who speaks, what subjects are raised and which are not: all of it means more here. The penthouse dinner has always been a performance of constraint. This is what it's a performance of.`,
        defaultOccupants: [],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true } },
        imageUrl: '',
        imagePrompt: 'Infernal dining room, long obsidian table, candlelight from above, formal court setting, deep reds and black, sovereignty and ceremony',
    },

    {
        id: 'below-war-room',
        name: 'War Room',
        description: `Below military management, faction dispatches, tactical assessments — more sensitive than its penthouse counterpart by several orders of magnitude. The room is staffed. {{user}} has not been given clearance, and the understanding that they lack clearance is not something anyone has been subtle about. The Generals work here. The work is not for mortal observation.`,
        defaultOccupants: ['luca'],
        isBelow: true,
        isOffLimits: true,
        unlockCondition: { flags: { 'below_access': true } },
        imageUrl: '',
        imagePrompt: 'Infernal war room, Below military command centre, dark and operational, faction maps, no ornamentation, clearly prohibited',
    },

];


// ─────────────────────────────────────────────────────────────────────────────
// THE BELOW — CITADEL (CHARACTER CHAMBERS)
// ─────────────────────────────────────────────────────────────────────────────

const BELOW_CHAMBERS: LocationDefinition[] = [

    {
        id: 'below-adrian-chambers',
        name: "Adrian's Chambers",
        description: `The earth suppression ends here — this is the first thing a visitor would register, the way the air changes. He is his full height in the Below; his wings are present and burning at the edges of visible. The chambers are extensive, attended by staff that are semi-corporeal here, drifting rather than walking. The difference between who Adrian is in the penthouse and who he is here is not a difference in kind. It is a difference in scale.`,
        defaultOccupants: ['adrian'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true }, minRelationship: { adrian: 25 } },
        imageUrl: '',
        imagePrompt: 'Infernal lord\'s chambers, vast and dark, wings implied in shadow, obsidian and ember tones, full sovereignty present, semi-corporeal attendants',
    },

    {
        id: 'below-adrian-office',
        name: "Adrian's Office",
        description: `Adjacent to his chambers, operationally separate. Private — more so than the chambers, which at least have attending staff. The office is where Adrian's actual decisions are made, not where they are communicated. {{user}} does not have access to this room. The prohibition has not been stated as a rule so much as understood as a law.`,
        defaultOccupants: ['adrian'],
        isBelow: true,
        isOffLimits: true,
        unlockCondition: { flags: { 'below_access': true } },
        imageUrl: '',
        imagePrompt: 'Private infernal office, dark and spare, documents and instruments of power, absolute prohibition implied in the architecture',
    },

    {
        id: 'below-sebastian-chambers',
        name: "Sebastian's Chambers",
        description: `Sitting room, lounge, bedroom — the design logic mirrors his penthouse quarters. Warmly lit, deliberately comfortable. In the Below, where the pretence of normalcy isn't required, the warmth reads slightly differently: it is still calibrated, but the calibration is visible in a way it isn't on earth. Kostas and Raura are based here and move through with practised ease.`,
        defaultOccupants: ['sebastian'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true }, minRelationship: { sebastian: 25 } },
        imageUrl: '',
        imagePrompt: 'Infernal suite, warmly lit against dark stone, comfortable and beautiful, amber and red, desire aesthetic, the warmth is still deliberate',
    },

    {
        id: 'below-callum-chambers',
        name: "Callum's Chambers",
        description: `Office and bedroom, with the adjacent space managed by Zaros handling Below documentation and administration. The precision that characterises Callum's penthouse quarters is here without the architectural softening that earth-side living provides — this is the same operating system in its native environment. The classification system for the archives is managed from here.`,
        defaultOccupants: ['callum'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true }, minRelationship: { callum: 25 } },
        imageUrl: '',
        imagePrompt: 'Infernal scholar\'s chambers, precise and ordered, dark stone and cool light, documentation and records visible, adjacent office space, no softening',
    },

    {
        id: 'below-luca-chambers',
        name: "Luca's Chambers",
        description: `Antechamber and bedroom, with the antechamber serving as a buffer between the Citadel's general traffic and Luca's actual space. Damon is usually present in the antechamber. The rooms are functional and military in character, consistent with everywhere else Luca occupies — the Below removes any remaining concession to comfort that earth-side residence required. This is what the aesthetic always was.`,
        defaultOccupants: ['luca'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true }, minRelationship: { luca: 25 } },
        imageUrl: '',
        imagePrompt: 'Infernal military chambers, antechamber and inner room, functional and spare, dark stone, no excess, structured access and clear hierarchy',
    },

    {
        id: 'below-lilith-office',
        name: "Lilith's Office",
        description: `Where she receives, reads intelligence, and runs Below operations — distinct from her personal chambers in function and in register. The Night Realm mirror is here, not in the personal suite; the point of entry to a personal domain that operates simultaneously as ballroom and labyrinth, where her nightmare powers run at full strength. The office has a warmth to it that is probably not entirely deceptive, which is its own thing to notice.`,
        defaultOccupants: ['lilith'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true }, minRelationship: { lilith: 25 } },
        imageUrl: '',
        imagePrompt: 'Infernal office, warm against dark stone, intelligence and beauty, mirror to Night Realm on one wall, wrong in the seams, not entirely threatening',
    },

];


// ─────────────────────────────────────────────────────────────────────────────
// THE BELOW — LOWER GARDENS
// ─────────────────────────────────────────────────────────────────────────────

const LOWER_GARDENS: LocationDefinition[] = [

    {
        id: 'below-gardens',
        name: 'Lower Gardens',
        description: `Subterranean — beneath the Citadel, predating it. Black-red thornveil roses grow on dark stone walls and bloom without light. The air is still, cold, and old in a way the rest of the Citadel isn't; something in it that does not respond to the passage of events above. The Generals pass the adjacent corridors without lingering and cannot explain why. In the shadowed alcove at the far end, Kethros keeps whatever it is that Kethros keeps. This is the only place a waking encounter with them is possible. Whatever brought {{user}} here, it was not entirely their own idea.`,
        defaultOccupants: ['kethros'],
        isBelow: true,
        unlockCondition: { flags: { 'below_access': true } },
        imagePrompt: 'Subterranean garden, black-red roses blooming without light on dark stone walls, ancient and still, cold air, pre-dates everything above it, shadowed alcove at far end',
    },

];


// ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
// EXPORTS
// ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――

/** All location definitions, ordered by floor/section. */
export const ALL_LOCATIONS: LocationDefinition[] = [
    ...PENTHOUSE_COMMON,
    ...PENTHOUSE_QUARTERS,
    ...BELOW_COMMON,
    ...BELOW_CHAMBERS,
    ...LOWER_GARDENS,
];

/** Keyed lookup — O(1) access by LocationId. */
export const LOCATIONS: Record<LocationId, LocationDefinition> = Object.fromEntries(
    ALL_LOCATIONS.map(loc => [loc.id, loc])
) as Record<LocationId, LocationDefinition>;

export function getLocation(id: LocationId): LocationDefinition {
    return LOCATIONS[id];
}

/** All penthouse locations (earth-side). */
export const PENTHOUSE_LOCATIONS: LocationDefinition[] = ALL_LOCATIONS.filter(
    loc => !loc.isBelow
);

/** All Below locations. */
export const BELOW_LOCATIONS: LocationDefinition[] = ALL_LOCATIONS.filter(
    loc => loc.isBelow
);

/** Locations that appear on the map with an off-limits indicator. */
export const OFF_LIMITS_LOCATIONS: LocationDefinition[] = ALL_LOCATIONS.filter(
    loc => loc.isOffLimits
);
