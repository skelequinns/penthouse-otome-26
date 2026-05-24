/**
 * Character × Room × Time-of-Day presence weights.
 *
 * Values 0–10. 0 = never here. 10 = always here.
 * BLANK RULE: any cell not listed = 0. No defaults, no fallback weight.
 * Only characters explicitly listed for a room have any chance of appearing.
 *
 * Time-of-day keys:
 *   morning   6am–12pm   (turn 0)
 *   afternoon 12pm–6pm   (turn 1)
 *   evening   6pm–12am   (turn 2)
 *   night     12am–6am   (not a playable turn; used for atmosphere / night visits)
 *
 * Weight is siloed per room. Each room rolls independently.
 * A character can have high weights in multiple rooms simultaneously.
 *
 * Special cases handled in locationRng.ts (not here):
 *   - Kethros flat-visit roll (post-meeting; pending Rin answer on earth-side scope)
 *   - Court-in-session override (flag_court_in_session: Adrian/Sebastian/Callum/Luca 100%, Lilith 70%)
 *   - War Room escort exception (flag_war_room_escort_active: off-limits consequence suspended)
 *   - Damon: only injected into LLM context when {{user}} is IN the war room; not in RNG
 *   - Raura/Kostas/Zaros: narrator-available regardless; not in LI RNG system
 *   - Anunsep + offspring: easter egg system, not RNG
 */

import { CharacterId, LocationId } from '../types';

export type WeightBlock = {
    morning?:   number;
    afternoon?: number;
    evening?:   number;
    night?:     number;
};

export type LocationWeightTable = Partial<Record<
    LocationId,
    Partial<Record<CharacterId, WeightBlock>>
>>;

// ─────────────────────────────────────────────────────────────────────────────
// PENTHOUSE — UPPER FLOOR (PRIVATE QUARTERS)
// ─────────────────────────────────────────────────────────────────────────────

export const LOCATION_WEIGHTS: LocationWeightTable = {

    'user-room': {
        // Characters who visit {{user}}'s room.
        // Low weights — a visit is meaningful, not routine.
        // Kethros post-meeting is handled by the flat-visit roll in locationRng.ts.
        adrian:   { morning: 1, afternoon: 0, evening: 0, night: 4 },
        sebastian:{ morning: 1, afternoon: 0, evening: 0, night: 3 },
        callum:   { morning: 1, afternoon: 0, evening: 0, night: 2 },
        luca:     { morning: 1, afternoon: 0, evening: 0, night: 1 },
        lilith:   { morning: 1, afternoon: 0, evening: 0, night: 1 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 }, // flat roll handles him
    },

    'adrian-quarters': {
        adrian:   { morning: 2, afternoon: 1, evening: 3, night: 6 },
        // No other LI has any weight here
    },

    'sebastian-quarters': {
        sebastian:{ morning: 8, afternoon: 1, evening: 1, night: 7 },
        // Raura/Kostas are narrator-available; handled outside LI RNG
    },

    'callum-quarters': {
        callum:   { morning: 1, afternoon: 0, evening: 4, night: 9 },
    },

    'luca-quarters': {
        luca:     { morning: 0, afternoon: 0, evening: 3, night: 8 },
    },

    'lilith-suite': {
        // "Lilith's Quarters & Office" — she stays at the penthouse occasionally
        lilith:   { morning: 3, afternoon: 6, evening: 2, night: 1 },
    },


    // ─────────────────────────────────────────────────────────────────────────
    // PENTHOUSE — LOWER FLOOR (COMMON SPACE)
    // ─────────────────────────────────────────────────────────────────────────

    'dining-room': {
        adrian:   { morning: 2, afternoon: 1, evening: 7, night: 0 },
        sebastian:{ morning: 4, afternoon: 1, evening: 8, night: 0 },
        callum:   { morning: 8, afternoon: 1, evening: 9, night: 0 },
        luca:     { morning: 8, afternoon: 1, evening: 9, night: 0 },
        lilith:   { morning: 1, afternoon: 0, evening: 4, night: 0 },
        // Kethros: never on earth-side common areas (flat-visit roll only, pending scope answer)
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'library': {
        // Penthouse library — Callum's domain, freely accessible
        // Raura/Kostas/Zaros narrator-available but not in LI RNG
        adrian:   { morning: 2, afternoon: 1, evening: 1, night: 2 },
        sebastian:{ morning: 4, afternoon: 3, evening: 2, night: 2 },
        callum:   { morning: 3, afternoon: 4, evening: 3, night: 1 },
        luca:     { morning: 1, afternoon: 1, evening: 1, night: 0 },
        lilith:   { morning: 1, afternoon: 1, evening: 1, night: 1 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'war-room': {
        // Off-limits to {{user}} — weights here inform LLM context only.
        // Characters can be present; {{user}} entering triggers consequence roll.
        // Damon is injected separately when {{user}} is in this room (not via LI RNG).
        // If Luca or Adrian escorts {{user}} here, flag_war_room_escort_active suspends consequences.
        adrian:   { morning: 4, afternoon: 5, evening: 5, night: 3 },
        sebastian:{ morning: 1, afternoon: 4, evening: 3, night: 1 },
        callum:   { morning: 2, afternoon: 3, evening: 3, night: 1 },
        luca:     { morning: 3, afternoon: 8, evening: 6, night: 1 },
        lilith:   { morning: 1, afternoon: 1, evening: 1, night: 1 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },


    // ─────────────────────────────────────────────────────────────────────────
    // THE BELOW — CITADEL (COMMON AREAS)
    // All require flag_below_access; enforced at runtime in locationRng.ts.
    // ─────────────────────────────────────────────────────────────────────────

    'below-citadel': {
        // Citadel entry — transit space, low weights, anyone passing through
        adrian:   { morning: 1, afternoon: 1, evening: 1, night: 0 },
        sebastian:{ morning: 1, afternoon: 1, evening: 1, night: 0 },
        callum:   { morning: 1, afternoon: 1, evening: 1, night: 0 },
        luca:     { morning: 1, afternoon: 1, evening: 1, night: 0 },
        lilith:   { morning: 1, afternoon: 1, evening: 1, night: 0 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'below-throne': {
        // Court is held here. During flag_court_in_session: 100/70 override applies.
        // These weights govern non-court visits.
        adrian:   { morning: 9, afternoon: 9, evening: 6, night: 1 },
        sebastian:{ morning: 1, afternoon: 1, evening: 1, night: 1 },
        callum:   { morning: 2, afternoon: 2, evening: 2, night: 0 },
        luca:     { morning: 1, afternoon: 1, evening: 1, night: 0 },
        lilith:   { morning: 1, afternoon: 1, evening: 1, night: 3 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'below-library': {
        // Library & Archives — Anunsep presence is easter-egg, not RNG
        adrian:   { morning: 2, afternoon: 1, evening: 1, night: 3 },
        sebastian:{ morning: 4, afternoon: 3, evening: 2, night: 2 },
        callum:   { morning: 3, afternoon: 4, evening: 3, night: 1 },
        luca:     { morning: 1, afternoon: 1, evening: 1, night: 0 },
        lilith:   { morning: 1, afternoon: 1, evening: 1, night: 1 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'below-dining': {
        // Citadel Dining Room.
        // Callum/Luca/Lilith: copied from penthouse dining (morning/afternoon/evening).
        // Night is 0 for all — no late-night formal dining.
        adrian:   { morning: 2, afternoon: 1, evening: 8, night: 0 },
        sebastian:{ morning: 1, afternoon: 1, evening: 9, night: 0 },
        callum:   { morning: 8, afternoon: 1, evening: 9, night: 0 },
        luca:     { morning: 8, afternoon: 1, evening: 9, night: 0 },
        lilith:   { morning: 1, afternoon: 0, evening: 4, night: 0 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },

    'below-war-room': {
        // Off-limits — weights inform LLM context only, same as earth-side war room.
        adrian:   { morning: 3, afternoon: 6, evening: 5, night: 2 },
        sebastian:{ morning: 1, afternoon: 3, evening: 1, night: 1 },
        callum:   { morning: 1, afternoon: 3, evening: 2, night: 1 },
        luca:     { morning: 3, afternoon: 9, evening: 6, night: 1 },
        lilith:   { morning: 0, afternoon: 2, evening: 2, night: 0 },
        kethros:  { morning: 0, afternoon: 0, evening: 0, night: 0 },
    },


    // ─────────────────────────────────────────────────────────────────────────
    // THE BELOW — CHARACTER CHAMBERS
    // ─────────────────────────────────────────────────────────────────────────

    'below-adrian-chambers': {
        adrian:   { morning: 2, afternoon: 1, evening: 3, night: 6 },
        // Mirrored from his penthouse quarters — same rhythms, native environment
    },

    'below-adrian-office': {
        // Off-limits. Adrian is frequently here; weights inform LLM context.
        adrian:   { morning: 4, afternoon: 7, evening: 3, night: 1 },
    },

    'below-sebastian-chambers': {
        sebastian:{ morning: 8, afternoon: 1, evening: 1, night: 7 },
        // Raura/Kostas narrator-available here
    },

    'below-callum-chambers': {
        callum:   { morning: 1, afternoon: 0, evening: 4, night: 9 },
    },

    'below-luca-chambers': {
        luca:     { morning: 0, afternoon: 0, evening: 1, night: 8 },
        // Note: evening weight is 1 in Below vs 3 in penthouse — less time here
    },

    'below-lilith-office': {
        lilith:   { morning: 2, afternoon: 3, evening: 3, night: 1 },
    },


    // ─────────────────────────────────────────────────────────────────────────
    // THE BELOW — LOWER GARDENS
    // Kethros's domain. Other characters visit; weights reflect this.
    // ─────────────────────────────────────────────────────────────────────────

    'below-gardens': {
        adrian:   { morning: 2, afternoon: 3, evening: 3, night: 1 },
        sebastian:{ morning: 1, afternoon: 1, evening: 1, night: 0 },
        callum:   { morning: 3, afternoon: 4, evening: 2, night: 0 },
        luca:     { morning: 0, afternoon: 1, evening: 1, night: 0 },
        lilith:   { morning: 2, afternoon: 2, evening: 1, night: 0 },
        kethros:  { morning: 8, afternoon: 8, evening: 8, night: 10 },
    },

};


// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the defined weight for a character in a room at a turn.
 * Returns 0 if no entry exists — blank = 0%, always.
 */
export function getWeight(
    locationId: LocationId,
    characterId: CharacterId,
    turn: 'morning' | 'afternoon' | 'evening' | 'night',
): number {
    return LOCATION_WEIGHTS[locationId]?.[characterId]?.[turn] ?? 0;
}
