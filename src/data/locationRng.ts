/**
 * Location presence RNG engine.
 *
 * Answers: "Who is in this room right now?"
 *
 * ─── Algorithm ──────────────────────────────────────────────────────────────
 *
 * For each LI character: roll Math.random() < (weight / 10)
 *   weight 0  → skip roll (never present)
 *   weight 5  → 50% chance
 *   weight 10 → always present
 *
 * Blank rule: any unlisted cell = weight 0. The table is the only source of truth.
 *
 * ─── Special cases (applied in order) ───────────────────────────────────────
 *
 * 1. travelingWithUser — authored presence, bypasses RNG and ineligibility.
 *
 * 2. Ineligibility — characters in lastRoomCharacters are skipped for RNG.
 *    Exception: travelingWithUser bypasses ineligibility.
 *
 * 3. Court in session (flag_court_in_session + location === 'below-throne') —
 *    Adrian, Sebastian, Callum, Luca are 100% present. Lilith is 70%.
 *    This overrides all RNG weights.
 *
 * 4. Kethros flat-visit roll — after standard RNG, if flag_kethros_met is true
 *    and {{user}} is NOT in below-gardens (his standard domain), Kethros has a
 *    flat 10% chance of appearing wherever {{user}} is.
 *    PENDING: earth-side scope confirmation from Rin. Currently applies Below-only.
 *    Once confirmed, set KETHROS_VISIT_EARTH_SIDE = true to extend to penthouse.
 *
 * 5. Below access — Below rooms return empty if flag_below_access is not set.
 *
 * 6. War Room — Damon is injected into LLM context when {{user}} is in the war
 *    room, regardless of RNG (he's always there). Not a love interest; not on map.
 *    flag_war_room_escort_active suspends the off-limits consequence roll.
 *
 * ─── State lifecycle ────────────────────────────────────────────────────────
 *
 * Call navigateToRoom() on every room change.
 * Write presenceResult.updatedPresence back to save.presence before persisting.
 *
 * travelingWithUser set by: afterResponse detects [TRAVEL_WITH:characterId].
 * travelingWithUser cleared by: navigateToRoom() after consuming it.
 */

import {
    SaveType, CharacterId, LocationId, ALL_CHARACTER_IDS, TurnOfDay, PresenceState,
} from '../types';
import { getWeight } from './locationWeights';
import { LOCATIONS } from './locations';
import { CHARACTERS } from './characters';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flat probability Kethros visits {{user}} in any non-garden room (post-meeting).
 * He seeks her out — he appears where she is, never waiting.
 * Below: 10% per room navigation. Earth-side: 3% (rarer; he is making an effort).
 */
const KETHROS_VISIT_CHANCE_BELOW = 0.10;
const KETHROS_VISIT_CHANCE_EARTH = 0.03;

/** Lilith's attendance probability during Court in session. */
const LILITH_COURT_CHANCE = 0.70;

/** Characters guaranteed 100% attendance when Court is in session. */
const COURT_MANDATORY: CharacterId[] = ['adrian', 'sebastian', 'callum', 'luca'];


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

type TurnKey = 'morning' | 'afternoon' | 'evening' | 'night';

function turnToKey(turn: TurnOfDay): TurnKey {
    if (turn === 0) return 'morning';
    if (turn === 1) return 'afternoon';
    return 'evening';
}

function roll(weight: number, rng: () => number): boolean {
    if (weight <= 0) return false;
    if (weight >= 10) return true;
    return rng() < weight / 10;
}


// ─────────────────────────────────────────────────────────────────────────────
// CORE: NAVIGATE TO ROOM
// ─────────────────────────────────────────────────────────────────────────────

export interface PresenceResult {
    /** LI characters resolved as present. Map will show their portraits. */
    presentCharacters: CharacterId[];
    /**
     * Updated presence state. Write back to save.presence and persist.
     * travelingWithUser is cleared here after being consumed.
     */
    updatedPresence: PresenceState;
    /**
     * True if {{user}} is in a war room without escort clearance.
     * Caller should trigger the consequence roll system.
     */
    triggerWarRoomConsequence: boolean;
    /**
     * True if Damon should be injected into LLM context for this room.
     * Damon is always present in both war rooms; not shown on map.
     */
    damonPresent: boolean;
}

/**
 * Resolve presence when {{user}} navigates to a new room.
 * Call on every room navigation. Persist the returned updatedPresence.
 */
export function navigateToRoom(
    newLocationId: LocationId,
    save: SaveType,
    rngOverride?: () => number,
): PresenceResult {
    const rng = rngOverride ?? Math.random;
    const { presence, turn, flags } = save;

    const location = LOCATIONS[newLocationId];
    const isBelow = location?.isBelow ?? false;

    // Below rooms require portal access
    if (isBelow && !flags['flag_below_access']) {
        return {
            presentCharacters: [],
            updatedPresence: buildUpdatedPresence(presence, newLocationId, []),
            triggerWarRoomConsequence: false,
            damonPresent: false,
        };
    }

    const turnKey = turnToKey(turn);
    const ineligible = new Set<CharacterId>(presence.lastRoomCharacters);
    const traveling  = presence.travelingWithUser;
    const courtActive = !!flags['flag_court_in_session'] && newLocationId === 'below-throne';
    const isWarRoom = newLocationId === 'war-room' || newLocationId === 'below-war-room';
    const hasEscort = !!flags['flag_war_room_escort_active'];

    const present: CharacterId[] = [];

    // ── 1. Authored presence ──────────────────────────────────────────────────
    if (traveling) {
        present.push(traveling);
    }

    // ── 2. Court override ─────────────────────────────────────────────────────
    if (courtActive) {
        for (const id of COURT_MANDATORY) {
            if (!present.includes(id)) present.push(id);
        }
        // Lilith: 70% during court
        if (!present.includes('lilith') && rng() < LILITH_COURT_CHANCE) {
            present.push('lilith');
        }
    } else {
        // ── 3. Standard RNG ───────────────────────────────────────────────────
        for (const charId of ALL_CHARACTER_IDS) {
            if (charId === traveling) continue;    // already added
            if (ineligible.has(charId)) continue;  // ineligible from last room
            if (charId === 'kethros') continue;    // handled separately below

            const weight = getWeight(newLocationId, charId, turnKey);
            if (roll(weight, rng)) {
                present.push(charId);
            }
        }
    }

    // ── 4. Kethros flat-visit roll ────────────────────────────────────────────
    // Only after meeting. Only outside his garden domain.
    // He appears wherever {{user}} is — including off-limits rooms.
    // He does not wait; he arrives. The ineligibility rule does NOT apply to him.
    // Below: 10% per room. Earth-side: 3% (rare; he is making a deliberate effort).
    if (
        newLocationId !== 'below-gardens' &&
        !present.includes('kethros') &&
        !!flags['flag_kethros_met'] &&
        rng() < (isBelow ? KETHROS_VISIT_CHANCE_BELOW : KETHROS_VISIT_CHANCE_EARTH)
    ) {
        present.push('kethros');
    } else if (newLocationId === 'below-gardens') {
        // Standard weight roll in his home location
        if (!present.includes('kethros') && !ineligible.has('kethros')) {
            const weight = getWeight('below-gardens', 'kethros', turnKey);
            if (roll(weight, rng)) present.push('kethros');
        }
    }

    // ── 5. War room consequence flag ──────────────────────────────────────────
    const triggerWarRoomConsequence = isWarRoom && location?.isOffLimits === true && !hasEscort;

    // ── 6. Damon presence (war rooms only) ───────────────────────────────────
    const damonPresent = isWarRoom;

    return {
        presentCharacters: present,
        updatedPresence: buildUpdatedPresence(presence, newLocationId, present),
        triggerWarRoomConsequence,
        damonPresent,
    };
}

function buildUpdatedPresence(
    prev: PresenceState,
    newLocationId: LocationId,
    present: CharacterId[],
): PresenceState {
    return {
        currentLocationId: newLocationId,
        lastRoomCharacters: present,
        travelingWithUser: null,  // consumed — cleared after every navigation
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// TRAVEL_WITH TAG PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a [TRAVEL_WITH:characterId] tag from LLM output.
 * afterResponse calls this; on {{user}} acceptance, write result to
 * save.presence.travelingWithUser. navigateToRoom() consumes and clears it.
 *
 * Tag format:  [TRAVEL_WITH:characterId]
 * Example:     [TRAVEL_WITH:callum]
 */
export function parseTravelWithTag(botMessage: string): CharacterId | null {
    const match = botMessage.match(/\[TRAVEL_WITH:([a-z]+)\]/i);
    if (!match) return null;
    const candidate = match[1].toLowerCase() as CharacterId;
    if (!ALL_CHARACTER_IDS.includes(candidate)) return null;
    return candidate;
}


// ─────────────────────────────────────────────────────────────────────────────
// BEFORE_PROMPT CONTEXT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the presence context string injected into beforePrompt.
 *
 * Format:
 *   [PRESENCE — Library]
 *   Present: Callum Mori, Sebastian Devereux
 *   Likely elsewhere: Adrian Vorne (Dining Room), Luca Bael (War Room), ...
 *   Note: Damon is present (War Room). {{user}} entered without clearance.
 *
 * Only love interests appear on the map. NPCs noted in text only.
 */
export function buildPresenceContext(save: SaveType): string {
    const { presence, flags } = save;
    if (!presence.currentLocationId) return '';

    const location = LOCATIONS[presence.currentLocationId];
    const locationName = location?.name ?? presence.currentLocationId;

    const presentIds = presence.lastRoomCharacters;
    const presentNames = presentIds.map(id => CHARACTERS[id]?.name ?? id);

    // Absent characters with their likely default locations
    const absentLines: string[] = [];
    for (const id of ALL_CHARACTER_IDS) {
        if (presentIds.includes(id)) continue;
        const char = CHARACTERS[id];
        if (!char) continue;
        const defaultLoc = LOCATIONS[char.defaultLocation];
        if (defaultLoc) {
            absentLines.push(`${char.name} (${defaultLoc.name})`);
        }
    }

    const isWarRoom = presence.currentLocationId === 'war-room'
        || presence.currentLocationId === 'below-war-room';
    const hasEscort = !!flags['flag_war_room_escort_active'];

    const lines = [
        `[PRESENCE — ${locationName}]`,
        presentNames.length > 0
            ? `Present: ${presentNames.join(', ')}`
            : `Present: no one`,
    ];

    if (absentLines.length > 0) {
        lines.push(`Likely elsewhere: ${absentLines.join(', ')}`);
    }

    // Damon note for war rooms
    if (isWarRoom) {
        if (hasEscort) {
            lines.push(`Note: Damon is present. {{user}} has escort clearance — no violation.`);
        } else {
            lines.push(`Note: Damon is present. {{user}} entered without clearance — consequence roll active.`);
        }
    }

    // Court note
    if (flags['flag_court_in_session'] && presence.currentLocationId === 'below-throne') {
        lines.push(`Note: Court is in session. All Generals are in attendance.`);
    }

    return lines.join('\n');
}



// ─────────────────────────────────────────────────────────────────────────────
// MAP PRESENCE — pre-roll all rooms for the map display
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Presence snapshot keyed by LocationId.
 * Built once when the map opens; used by MapView for portrait display.
 * Every character appears in at most ONE room across all floors.
 */
export type MapPresence = Partial<Record<LocationId, CharacterId[]>>;

/**
 * Assign every character to exactly one room (or nowhere) using a
 * highest-weight-first sequential roll.
 *
 * Algorithm per character:
 *   1. Collect every accessible room where weight > 0 for current time-of-day.
 *   2. Sort descending by weight (highest-priority room first).
 *   3. Roll weight/10 for each room in order; first success = character's location.
 *   4. If all rolls fail: character is "elsewhere" — not visible on any floor.
 *
 * This guarantees a character appears on at most one map floor and in at most
 * one room. High-weight rooms dominate naturally: Adrian (weight 9 in Throne
 * Room) will be placed there ~90% of the time.
 *
 * Special cases:
 *   - Court override (flag_court_in_session + below-throne accessible):
 *       COURT_MANDATORY placed directly, Lilith gets a single 70% roll.
 *       Both skip the priority-roll entirely.
 *   - Kethros: standard priority roll (his weight 8/10 in gardens means he
 *       almost always lands there first). Flat-visit outside gardens is a
 *       per-navigation event handled in navigateToRoom, not here — the map
 *       shows where characters *are*, not where they might appear when {{user}}
 *       walks in.
 *   - Below gate: Below rooms excluded from the pool if flag_below_access unset.
 *   - Ineligibility: lastRoomCharacters excluded entirely (same as navigateToRoom).
 *   - travelingWithUser: NOT injected here — ChatView places them in the
 *       current room at navigation time.
 */
export function buildMapPresence(
    save: SaveType,
    rngOverride?: () => number,
): MapPresence {
    const rng = rngOverride ?? Math.random;
    const { presence, turn, flags } = save;
    const turnKey = turnToKey(turn);
    const ineligible = new Set<CharacterId>(presence.lastRoomCharacters);

    // Initialise all rooms as empty arrays
    const result: MapPresence = {};
    for (const locId of Object.keys(LOCATIONS) as LocationId[]) {
        result[locId] = [];
    }

    // Build accessible location list (respects Below gate)
    const accessibleLocIds = (Object.keys(LOCATIONS) as LocationId[]).filter(locId => {
        const loc = LOCATIONS[locId];
        return !(loc.isBelow && !flags['flag_below_access']);
    });

    const courtActive = !!flags['flag_court_in_session']
        && accessibleLocIds.includes('below-throne' as LocationId);

    for (const charId of ALL_CHARACTER_IDS) {
        // Ineligible characters (just seen in previous room) don't appear
        if (ineligible.has(charId)) continue;

        // ── Court override ────────────────────────────────────────────────────
        if (courtActive) {
            if ((COURT_MANDATORY as CharacterId[]).includes(charId)) {
                (result['below-throne' as LocationId] as CharacterId[]).push(charId);
                continue;
            }
            if (charId === 'lilith') {
                if (rng() < LILITH_COURT_CHANCE) {
                    (result['below-throne' as LocationId] as CharacterId[]).push('lilith');
                }
                continue;
            }
        }

        // ── Priority roll ─────────────────────────────────────────────────────
        // Collect rooms with weight > 0, sorted highest → lowest
        const candidates: Array<{ locId: LocationId; weight: number }> = [];
        for (const locId of accessibleLocIds) {
            const w = getWeight(locId, charId, turnKey);
            if (w > 0) candidates.push({ locId, weight: w });
        }
        candidates.sort((a, b) => b.weight - a.weight);

        // Roll in priority order — first success wins
        for (const { locId, weight } of candidates) {
            if (roll(weight, rng)) {
                (result[locId] as CharacterId[]).push(charId);
                break;
                // character placed — stop checking remaining rooms
            }
        }
        // If no roll succeeded: character is elsewhere, no map entry
    }

    return result;
}
