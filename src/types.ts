/**
 * Hell is a Penthouse in Toronto — Core Type Definitions
 *
 * All game state, character data, scene, and relationship types live here.
 * Import from this file rather than defining types locally in components.
 */

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIFIERS
// ─────────────────────────────────────────────────────────────────────────────

/** The six love interests. Used as keys throughout save state. */
export type CharacterId =
    | 'adrian'
    | 'sebastian'
    | 'kethros'
    | 'luca'
    | 'callum'
    | 'lilith';

export const ALL_CHARACTER_IDS: CharacterId[] = [
    'adrian', 'sebastian', 'luca', 'callum', 'lilith', 'kethros',
];

/** Attendants and non-LI named characters. */
export type NpcId =
    | 'umbri'
    | 'raura'
    | 'kostas'
    | 'damon'
    | 'zaros'
    | 'cassara'
    | 'lyra'
    | 'yulis'
    | 'karn';

export const ALL_NPC_IDS: NpcId[] = [
    'umbri', 'raura', 'kostas', 'damon', 'zaros',
    'cassara', 'lyra', 'yulis', 'karn',
];

/**
 * Power tier — determines stat ceilings and conflict resolution weight.
 *
 * Human     ≤ 10  {{user}} (mortal baseline), unnamed humans
 * Halflit   ≤ 13  {{user}} (Caelith's child), minor heritage bonuses
 * Forged    ≤ 15  Lilith, all attendants
 * First One ≤ 20  Adrian, Sebastian, Callum, Luca — Shattered First-Born
 * Cosmic    ≤ 40  Kethros — pre-infernal, categorically other
 */
export type CharacterTier = 'human' | 'halflit' | 'forged' | 'first-one' | 'cosmic';

export const TIER_STAT_MAX: Record<CharacterTier, number> = {
    'human':     10,
    'halflit':   13,
    'forged':    15,
    'first-one': 20,
    'cosmic':    40,
} as const;

/** All navigable locations in the penthouse and the Below. */
export type LocationId =
    // ── Penthouse — Lower Floor (Common) ────────────────────────────────────
    | 'formal-receiving'        // Entry room; Umbri greets {{user}} here on arrival
    | 'dining-room'             // Nightly dinner; household politics play out here
    | 'library'                 // Callum's domain; freely accessible to {{user}}
    | 'war-room'                // Luca's domain; daily dispatches — off limits
    // ── Penthouse — Upper Floor (Private Quarters) ───────────────────────────
    | 'user-room'               // {{user}}'s room; Umbri present
    | 'adrian-quarters'         // Unlocks with relationship progress; portal inside
    | 'sebastian-quarters'      // Unlocks with relationship progress; portal inside
    | 'callum-quarters'         // Unlocks with relationship progress; portal inside
    | 'luca-quarters'           // Unlocks with relationship progress; portal inside
    | 'lilith-suite'            // Unlocks with relationship progress; portal + mirror inside
    // ── The Below — Citadel (Common Areas) ──────────────────────────────────
    | 'below-citadel'           // General Citadel entry; unlocks via story
    | 'below-throne'            // Throne Room; late unlock; spans full width
    | 'below-library'           // Library & Archives; home of the Anunsep
    | 'below-dining'            // Citadel Dining Room; court dynamics at full weight
    | 'below-war-room'          // Military operations — off limits
    // ── The Below — Citadel (Character Chambers) ────────────────────────────
    | 'below-adrian-chambers'   // Full height, wings present; earth suppression ends
    | 'below-adrian-office'     // Private operations — off limits
    | 'below-sebastian-chambers'// Warmly lit; mirrors penthouse quarters
    | 'below-callum-chambers'   // Precision and order; Zaros's adjacent office
    | 'below-luca-chambers'     // Antechamber + bedroom; military, functional
    | 'below-lilith-office'     // Intelligence hub; entry point to the Night Realm
    // ── The Below — Lower Gardens ────────────────────────────────────────────
    | 'below-gardens';          // Predates the Citadel; only place to find Kethros


// ─────────────────────────────────────────────────────────────────────────────
// TIME & PHASE
// ─────────────────────────────────────────────────────────────────────────────

/** Three turns per in-game day. */
export type TurnOfDay = 0 | 1 | 2;

export const TURN_LABELS: Record<TurnOfDay, string> = {
    0: 'Morning',
    1: 'Afternoon',
    2: 'Evening',
} as const;

/**
 * Named story phases — used to gate scene availability and world events.
 * Phase is derived from day count + story flags; it is never stored directly.
 *
 * ARRIVAL    Days 1–3    Orientation. Forced proximity. No frame of reference.
 * UNSETTLED  Days 4–7    Patterns emerging. First real tensions.
 * FAMILIAR   Days 8–14   The shape of things becoming clear.
 * ENTANGLED  Day 15+     No clean exits. Relationships have weight now.
 */
export enum GamePhase {
    ARRIVAL    = 'ARRIVAL',
    UNSETTLED  = 'UNSETTLED',
    FAMILIAR   = 'FAMILIAR',
    ENTANGLED  = 'ENTANGLED',
}

/** Derive the current game phase from day and flags. */
export function getGamePhase(day: number, flags: Record<string, any>): GamePhase {
    // Flag-triggered phase overrides take priority over day-based thresholds.
    // Add flag checks here as story develops (e.g. first Below visit accelerates phase).
    if (flags['phase_entangled']) return GamePhase.ENTANGLED;
    if (flags['phase_familiar'])  return GamePhase.FAMILIAR;
    if (day >= 15) return GamePhase.ENTANGLED;
    if (day >= 8)  return GamePhase.FAMILIAR;
    if (day >= 4)  return GamePhase.UNSETTLED;
    return GamePhase.ARRIVAL;
}


// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base stats for all characters and NPCs.
 * Used for LLM conflict resolution — injected into beforePrompt when two
 * characters clash, so the model knows who has the edge and by how much.
 *
 * Volatile is intentionally low for ancient beings: millennia of self-control.
 * That {{user}} can crack this is the point.
 */
export interface CharacterStats {
    strength:     number;  // Physical force
    dexterity:    number;  // Speed, precision, agility
    constitution: number;  // Endurance, resistance to harm
    wisdom:       number;  // Perceptiveness, judgment, read on others
    intelligence: number;  // Reasoning, knowledge, planning
    charisma:     number;  // Social force, presence, persuasion
    nerve:        number;  // Willingness to act under pressure; holds ground
    volatile:     number;  // Likelihood of dramatic behavioral rupture
    lust:         number;  // Base appetite — character nature, not relationship state
}

/**
 * {{user}}'s heritage, chosen during onboarding.
 * Determines starting stat block and LLM framing.
 *
 * Human:   Mortal baseline. Max stat 10. Entirely vulnerable.
 * Halflit: Child of Caelith. Max stat 13. Enhanced but not infernal.
 *          TODO: add Caelith lore note here once confirmed with Rin.
 */
export type PlayerHeritage = 'human' | 'halflit';

/**
 * {{user}}'s stats — Nerve is included; {{user}} needs to hold their ground.
 * Volatile, Lust, Joy, and Trust are player-governed and not engine-resolved.
 */
export interface PlayerStats {
    strength:     number;
    dexterity:    number;
    constitution: number;
    wisdom:       number;
    intelligence: number;
    charisma:     number;
    nerve:        number;
}

export const PLAYER_STATS: Record<PlayerHeritage, PlayerStats> = {
    human: {
        strength: 8, dexterity: 7, constitution: 6,
        wisdom: 8, intelligence: 8, charisma: 7, nerve: 8,
    },
    halflit: {
        strength: 11, dexterity: 13, constitution: 12,
        wisdom: 13, intelligence: 13, charisma: 12, nerve: 12,
    },
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Starting Joy and Trust for each LI — used when initialising a new save.
 * These are the character's opening state toward {{user}}, before anything happens.
 */
export const CHARACTER_STARTING_JOY: Record<CharacterId, number> = {
    adrian: 0, sebastian: 5, kethros: 0, luca: 0, callum: 0, lilith: 0,
} as const;

export const CHARACTER_STARTING_TRUST: Record<CharacterId, number> = {
    adrian: 0, sebastian: 0, kethros: 5, luca: 2, callum: 0, lilith: 0,
} as const;

/**
 * Relationship stages derived from score.
 * Score range: –100 (maximum hostility) → +100 (devoted).
 * All characters start at 0 (NEUTRAL).
 */
export enum RelationshipStage {
    HOSTILE      = 'HOSTILE',      // –100 to –50  Active antagonism
    COLD         = 'COLD',         //  –49 to  –1  Guarded, dismissive
    NEUTRAL      = 'NEUTRAL',      //    0 to  24  Stranger; baseline
    ACQUAINTANCE = 'ACQUAINTANCE', //   25 to  49  Acknowledged; curiosity forming
    FAMILIAR     = 'FAMILIAR',     //   50 to  74  Warmth; some trust
    CLOSE        = 'CLOSE',        //   75 to  89  Real bond; vulnerability possible
    DEVOTED      = 'DEVOTED',      //   90 to 100  Deep connection
}

export const RELATIONSHIP_STAGE_LABELS: Record<RelationshipStage, string> = {
    [RelationshipStage.HOSTILE]:      'Hostile',
    [RelationshipStage.COLD]:         'Cold',
    [RelationshipStage.NEUTRAL]:      'Neutral',
    [RelationshipStage.ACQUAINTANCE]: 'Acquaintance',
    [RelationshipStage.FAMILIAR]:     'Familiar',
    [RelationshipStage.CLOSE]:        'Close',
    [RelationshipStage.DEVOTED]:      'Devoted',
} as const;

/** Derive relationship stage from a numeric score. Never stored — always computed. */
export function getRelationshipStage(score: number): RelationshipStage {
    if (score <= -50) return RelationshipStage.HOSTILE;
    if (score <    0) return RelationshipStage.COLD;
    if (score <   25) return RelationshipStage.NEUTRAL;
    if (score <   50) return RelationshipStage.ACQUAINTANCE;
    if (score <   75) return RelationshipStage.FAMILIAR;
    if (score <   90) return RelationshipStage.CLOSE;
    return RelationshipStage.DEVOTED;
}

/** Clamp a relationship score to valid range. */
export function clampScore(score: number): number {
    return Math.max(-100, Math.min(100, score));
}

export interface RelationshipData {
    /** –100 to +100. Never stored outside this range. */
    score: number;
    /**
     * True once {{user}} has shared a room with this character and they have spoken.
     * Controls whether the character's name, portrait, and score are revealed in the UI.
     * All characters start hidden; Kethros requires additional flag gating.
     */
    met: boolean;
    /** IDs of scenes completed with this character. */
    completedScenes: string[];
    /**
     * Evolving: genuine joy this character has found in {{user}}'s presence.
     * Distinct from affinity score — tracks something rarer and harder to fake.
     * Updated only at milestone scene completions, not per-message.
     */
    joy: number;
    /**
     * Evolving: how much this character trusts {{user}}.
     * Also distinct from score — trust can be high while affinity is complicated.
     * Updated only at milestone scene completions, not per-message.
     */
    trust: number;
    /**
     * The score delta from the most recent message exchange.
     * Used by the UI to display a transient +/– indicator beside the character portrait.
     * Not meaningful outside of the current session; treated as display state only.
     */
    lastDelta?: number;
}

/** Starting relationship state for a single LI character. */
export function defaultRelationshipData(id: CharacterId): RelationshipData {
    return {
        score: 0,
        met: false,
        completedScenes: [],
        joy:   CHARACTER_STARTING_JOY[id],
        trust: CHARACTER_STARTING_TRUST[id],
    };
}

/** Starting relationships for a new save — all characters at their defined defaults. */
export function defaultRelationships(): Record<CharacterId, RelationshipData> {
    return Object.fromEntries(
        ALL_CHARACTER_IDS.map(id => [id, defaultRelationshipData(id)])
    ) as Record<CharacterId, RelationshipData>;
}


// ─────────────────────────────────────────────────────────────────────────────
// SCENES
// ─────────────────────────────────────────────────────────────────────────────

export enum SceneType {
    OPENING      = 'OPENING',      // The arrival. Mandatory, once.
    CASUAL       = 'CASUAL',       // Low-stakes room encounters. Slow build.
    MILESTONE    = 'MILESTONE',    // Unlocked at relationship thresholds. Significant.
    DATE         = 'DATE',         // Player-initiated private time.
    GROUP        = 'GROUP',        // Multi-character scenes (dinner, events).
    WORLD_EVENT  = 'WORLD_EVENT',  // Plot-driven; not relationship-gated.
}

/** Conditions that must be true for a scene to become available. */
export interface SceneUnlockCondition {
    /** Minimum relationship score with specified characters. */
    minRelationship?: Partial<Record<CharacterId, number>>;
    /** Maximum relationship score — for scenes that only work when things are bad. */
    maxRelationship?: Partial<Record<CharacterId, number>>;
    /** Scene IDs that must have already been completed. */
    prerequisiteScenes?: string[];
    /** Scene IDs that make this one unavailable (mutually exclusive). */
    excludedIfScenesComplete?: string[];
    /** Earliest day this scene can trigger. */
    minDay?: number;
    /** Latest day this scene can trigger (for early-game-only moments). */
    maxDay?: number;
    /** Story phases in which this scene is available. */
    phases?: GamePhase[];
    /** Arbitrary story flags that must be set. */
    flags?: Record<string, any>;
}

/** What changes in the game world when a scene ends. */
export interface SceneOutcome {
    /** Score deltas applied to each character's relationship on scene completion. */
    relationshipDeltas?: Partial<Record<CharacterId, number>>;
    /** Story flags to set. Can be boolean, string, or number. */
    flagsToSet?: Record<string, any>;
    /** Scene IDs to add to availableScenes. */
    scenesToUnlock?: string[];
    /**
     * Whether this scene consumes a turn.
     * Defaults to true. Set false for ambient/background scenes.
     */
    advanceTime?: boolean;
}

/**
 * A scene definition — authored by Rin, read by the scene engine.
 * The engine uses promptContext for LLM injection; outcomes are applied on completion.
 */
export interface SceneDefinition {
    id: string;
    type: SceneType;
    title: string;

    /** Primary character. Undefined for GROUP or WORLD_EVENT scenes. */
    characterId?: CharacterId;

    /** Where the scene takes place. */
    locationId: LocationId;

    /** Conditions required for this scene to become available. */
    unlock: SceneUnlockCondition;

    /**
     * Context injected into beforePrompt for this scene.
     * Describe the situation, tone, and what should be explored.
     * The LLM generates all actual dialogue — this is the director's note.
     */
    promptContext: string;

    /** Outcomes applied when the scene ends (player clicks End Scene or [SCENE END] tag detected). */
    outcomes: SceneOutcome;

    /**
     * Optional: hint for Chub image generation if a dynamic background is wanted.
     * If omitted, the location's default image is used.
     */
    imagePrompt?: string;
}

/** The state of a scene currently in progress. Stored in MessageStateType. */
export interface ActiveSceneData {
    sceneId: string;
    startedDay: number;
    startedTurn: TurnOfDay;
    /** Number of message exchanges so far in this scene. */
    messageCount: number;
    /** True once [SCENE END] tag detected or player manually ends. */
    complete: boolean;
    /**
     * Character(s) participating in this scene.
     * Used by beforePrompt to scope SENTIMENT rubric injection.
     * When undefined, beforePrompt falls back to all non-Kethros characters.
     */
    characterIds?: CharacterId[];
}


// ─────────────────────────────────────────────────────────────────────────────
// CHARACTERS & LOCATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-coded character profile — fully defined in src/data/characters.ts.
 * Appearance and personality are used verbatim in LLM context injection.
 */
export interface CharacterProfile {
    id: CharacterId;
    name: string;
    /** True infernal name — knowing/using it is significant in-lore. */
    infernalName?: string;
    title: string;
    /** Static avatar URL. Provided by Rin. Empty until portraits are generated. */
    avatarUrl: string;
    /** Per-character accent color from theme.ts. */
    themeColor: string;
    themeFont: string;
    /** Power tier — sets stat ceiling and conflict resolution context. */
    tier: CharacterTier;
    /** Combat and social stats. Injected into beforePrompt for conflict resolution. */
    stats: CharacterStats;
    /** Physical description for LLM scene context. */
    appearance: string;
    /** Personality and behavioral profile for LLM scene context. */
    personality: string;
    /** How this character sounds — register, cadence, vocabulary — for LLM tone guidance. */
    voiceStyle: string;
    /** Infernal domain (e.g. 'Sovereign force', 'Desire systems'). */
    domain?: string;
    /** Room this character occupies by default each day. */
    defaultLocation: LocationId;
}

/**
 * Non-LI named character — attendants and supporting cast.
 * Has stats for conflict resolution; Joy and Trust are not tracked.
 */
export interface NpcProfile {
    id: NpcId;
    name: string;
    title: string;
    avatarUrl: string;
    themeColor: string;
    themeFont: string;
    tier: CharacterTier;
    stats: CharacterStats;
    appearance: string;
    personality: string;
    voiceStyle: string;
    defaultLocation: LocationId;
}

/** A navigable room in the penthouse or the Below. */
export interface LocationDefinition {
    id: LocationId;
    name: string;
    /** Atmospheric description injected into scene context. */
    description: string;
    /** Characters most likely found here. */
    defaultOccupants: CharacterId[];
    /** If set, location is hidden until condition is met. */
    unlockCondition?: SceneUnlockCondition;
    /** Background image URL — used for both the chat view and map room card. */
    mapImageUrl?: string;
    /** Hint for dynamic image generation if static image not available. */
    imagePrompt?: string;
    /** True for Below-realm locations. Requires portal access. */
    isBelow?: boolean;
    /**
     * True for rooms that are technically accessible but prohibited.
     * Off-limits rooms ALWAYS appear on the map — the player can choose to enter.
     * Disobedience triggers a consequence event; outcome severity varies by character.
     */
    isOffLimits?: boolean;
}


// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────────────────────────────────────

/** One entry in the player's in-game history log. */
export interface TimelineEntry {
    day: number;
    turn: TurnOfDay;
    sceneId: string;
    sceneTitle: string;
    characterId?: CharacterId;
    locationId: LocationId;
    /** Optional LLM-generated one-line summary of what happened. */
    summary?: string;
}


// ─────────────────────────────────────────────────────────────────────────────
// PRESENCE STATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tracks room navigation state for the presence/RNG system.
 *
 * Rules enforced by locationRng.ts:
 *
 * Ineligibility — if {{user}} just left a room, characters encountered there
 * are ineligible to appear via RNG in the *immediately next* room. They can
 * reappear after one room gap. This prevents the instant-teleport effect.
 *
 * travelingWithUser — set when a character suggests leaving together AND
 * {{user}} accepts. That character appears in the next room regardless of
 * RNG weight; they are NOT subject to ineligibility. Cleared once the new
 * room scene begins.
 *
 * How travelingWithUser gets set:
 *   afterResponse detects a [TRAVEL_WITH:characterId] tag in the LLM output.
 *   The UI presents a confirmation beat; on acceptance, this field is written.
 *   See Stage.tsx afterResponse for tag parsing.
 */
export interface PresenceState {
    /** Where {{user}} currently is. Null before intro completes. */
    currentLocationId: LocationId | null;
    /**
     * Characters present in the PREVIOUS room.
     * Ineligible for RNG in the immediate next room navigated to.
     * Reset on the room after that (one-room cooldown only).
     */
    lastRoomCharacters: CharacterId[];
    /**
     * Character traveling with {{user}} between rooms.
     * Set by [TRAVEL_WITH:characterId] tag. Cleared after new room resolves.
     * This character is authored-present in the next room regardless of weights.
     */
    travelingWithUser: CharacterId | null;
}

export function defaultPresenceState(): PresenceState {
    return {
        currentLocationId: null,
        lastRoomCharacters: [],
        travelingWithUser: null,
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// SAVE STATE
// ─────────────────────────────────────────────────────────────────────────────

/** The full game save. Persisted in ChatStateType. */
export interface SaveType {
    // Player
    player: {
        name: string;
        description: string;
        /** Pulled from Chub user data on init. Displayed in relationship screens, scene headers. */
        avatarUrl: string;
        /** Chosen during onboarding — determines stat block and LLM framing. */
        heritage: PlayerHeritage;
        /** Derived from heritage via PLAYER_STATS. */
        stats: PlayerStats;
    };

    // Time
    day: number;
    turn: TurnOfDay;
    // Note: GamePhase is always derived via getGamePhase(day, flags) — never stored directly.

    // Relationships
    relationships: Record<CharacterId, RelationshipData>;

    // Scene tracking
    completedScenes: string[];
    availableScenes: string[];
    activeScene?: ActiveSceneData;

    // Story flags -- arbitrary key/value pairs for tracking world state
    flags: Record<string, any>;

    // Presence -- room navigation and character RNG state
    presence: PresenceState;

    // History
    timeline: TimelineEntry[];

    // Metadata
    lastSaved?: number;
}

/** Build a fresh save for a new game. */
export function createNewSave(
    playerName: string,
    playerDescription: string,
    playerAvatarUrl: string,
    heritage: PlayerHeritage,
): SaveType {
    return {
        player: {
            name: playerName,
            description: playerDescription,
            avatarUrl: playerAvatarUrl,
            heritage,
            stats: PLAYER_STATS[heritage],
        },
        day: 1,
        turn: 0,
        relationships: defaultRelationships(),
        completedScenes: [],
        availableScenes: ['opening'],
        activeScene: undefined,
        flags: {},
        presence: {
            ...defaultPresenceState(),
            // The game opens in the formal receiving room — Umbri greets {{user}} here on arrival.
            currentLocationId: 'formal-receiving',
        },
        timeline: [],
        lastSaved: Date.now(),
    };
}


// ─────────────────────────────────────────────────────────────────────────────
// CHUB STAGE STATE TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-message state — branch-aware snapshot of volatile game state.
 *
 * Chub stores this per-message so when a user retries or branches,
 * setState() is called with the snapshot from that branch point.
 * This makes relationship scores, flags, and time all revert correctly
 * when the player goes back in the conversation.
 *
 * Contains the full save so nothing is missed on a branch restore.
 */
export type MessageStateType = {
    activeScene?: ActiveSceneData;
    /** Full save snapshot at the time this message was processed. */
    save?: SaveType;
} | null;

/** Chat-level state -- the full save, persists regardless of branch switching. */
export type ChatStateType = {
    save: SaveType | null;
};

/** Stage config -- no user-facing config for now. */
export type ConfigType = Record<string, never>;

/** Stage init state -- unused. */
export type InitStateType = null;
