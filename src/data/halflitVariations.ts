/**
 * Halflit Story Variations — Phase 1 Context Injections
 *
 * These blocks are appended to stageDirections when save.player.heritage === 'halflit'.
 * Phase 1 requires only flag_halflit_heritage (set at game start via heritage choice).
 * No additional flags needed.
 *
 * Contents:
 *   1A  The Tell — Essence Sight behavioral shifts (Adrian, Sebastian, Callum, days 1–7)
 *   1B  Transition space word (world_crossing_count === 7) — handled separately via easter egg system
 *   1C  Lower Gardens rose bloom / Kethros frequency comment — handled in realFormScenes.ts halflitSuffix
 *   1D  Anunsep third contact recognition — fires at below-library when anunsep_contact_count >= 3
 *
 * Phase 2 and Phase 3 variations are not yet wired — they require additional flags
 * (flag_activation_first, flag_caelith_revealed) that depend on authored scenes.
 *
 * Source design doc: halflit-variations-final.md
 */

import { CharacterId, SaveType } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// 1A — The Tell: per-character Essence Sight awareness (days 1–7 only)
// ─────────────────────────────────────────────────────────────────────────────

const TELL_BLOCKS: Partial<Record<CharacterId, string>> = {

    adrian:
        `HALFLIT AWARENESS — ADRIAN:\n` +
        `Adrian's Essence Sight is reading something in {{user}} that does not resolve ` +
        `cleanly. He has not named it. He is logging it without comment. His behavior ` +
        `this turn has a fractional completeness to it — as though taking inventory — ` +
        `that has no visible cause. He does not indicate that anything is different. ` +
        `Something is different.`,

    sebastian:
        `HALFLIT AWARENESS — SEBASTIAN:\n` +
        `Sebastian's desire-sight returns static where it would normally return signal. ` +
        `{{user}}'s soul reads as a locked case in a collection of open ones. He has ` +
        `noted this. He may ask, very gently, whether {{user}} has been feeling anything ` +
        `unusual. The question is warmer than it is strategic. The answer — whatever it ` +
        `is — will be filed.`,

    callum:
        `HALFLIT AWARENESS — CALLUM:\n` +
        `Callum's Essence Sight has logged an anomaly in {{user}}'s signature. He has ` +
        `not raised this. His book recommendations this week have shifted slightly — one ` +
        `text swapped for another without explanation. The new text is on pre-Sundering ` +
        `soul taxonomy. He does not suggest {{user}} read it. He simply has it visible ` +
        `on his desk.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1D — Anunsep third contact recognition (below-library, contact_count >= 3)
// ─────────────────────────────────────────────────────────────────────────────

const ANUNSEP_RECOGNITION =
    `HALFLIT RECOGNITION — ANUNSEP:\n` +
    `Something else arrives alongside the warmth — older than the warmth, older than ` +
    `the weight of accumulated knowing. Anunsep has encountered this signature before. ` +
    `Not in recorded time: in pre-recorded time, in the era before the Citadel existed ` +
    `or needed to. The impression it sends is not language and does not need to be. ` +
    `{{user}} understands it as: you carry someone I knew. And separately, beneath ` +
    `that, something quieter: she would be glad.\n` +
    `\n` +
    `Anunsep does not elaborate. The weight of the two impressions settles, and the ` +
    `warmth continues, and Anunsep makes no distinction between what it offered then ` +
    `and what it is offering now. They have always been the same thing.`;

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all applicable Phase 1 halflit context blocks for the current scene.
 * Returns empty string if player.heritage !== 'halflit'.
 *
 * Appended to stageDirections in beforePrompt under a HALFLIT CONTEXT header.
 *
 * @param save            Full game save
 * @param featuredCharId  Character currently featured in the scene
 */
export function buildHalflitContext(
    save: SaveType,
    featuredCharId: CharacterId,
): string {
    if (save.player.heritage !== 'halflit') return '';

    const blocks: string[] = [];

    // ── 1A: The Tell — only fires days 1–7 ─────────────────────────────────
    if (save.day <= 7) {
        const tellBlock = TELL_BLOCKS[featuredCharId];
        if (tellBlock) {
            blocks.push(tellBlock);
        }
    }

    // ── 1D: Anunsep recognition — only in below-library, contact count >= 3 ─
    if (save.presence.currentLocationId === 'below-library') {
        const contactCount = (save.flags['anunsep_contact_count'] as number | undefined) ?? 0;
        if (contactCount >= 3) {
            blocks.push(ANUNSEP_RECOGNITION);
        }
    }

    if (blocks.length === 0) return '';

    return blocks.join('\n\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 stubs — not yet wired, exported for future use
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Phase 2 halflit context — requires flag_activation_first or specific score thresholds.
 * Not currently called from Stage.tsx. Exported here for eventual wiring.
 *
 * Returns content blocks for: Sebastian soul taxonomy (score >= 25),
 * Lilith dream-access (score >= 25), Callum provenance record (score >= 40),
 * Host Knows WORLD_EVENT (day >= 15, any score >= 40).
 */
export function buildHalflitPhase2Context(
    save: SaveType,
    featuredCharId: CharacterId,
): string {
    if (save.player.heritage !== 'halflit') return '';

    const blocks: string[] = [];
    const score = save.relationships[featuredCharId]?.score ?? 0;

    // 2A: Sebastian soul taxonomy book
    if (featuredCharId === 'sebastian' && score >= 25) {
        blocks.push(
            `HALFLIT SCENE — SEBASTIAN / SOUL TAXONOMY:\n` +
            `Sebastian has a specific text on his person or visible in his quarters: a pre-Sundering ` +
            `soul taxonomy. He has had it for some time. He recommends it to {{user}} as an ` +
            `interesting text on soul classification — he does not say why he thinks {{user}} ` +
            `might find it interesting. If {{user}} reads the passage he has marked (or asks ` +
            `about it): "I thought you might find that one." ` +
            `The relevant passage describes a specific resonance produced by the halflit condition — ` +
            `soul that does not fully belong to either world and therefore, technically, belongs ` +
            `to both. Sebastian's next line, if pressed: a very long pause. Then: "Curiosity." ` +
            `He will not elaborate further this scene.`
        );
    }

    // 2B: Lilith dream-access discovery
    if (featuredCharId === 'lilith' && score >= 25 && save.flags['flag_lilith_dream_accessed']) {
        blocks.push(
            `HALFLIT DISCOVERY — LILITH / DREAM SPACE:\n` +
            `Lilith has found something unexpected in {{user}}'s dream space. She entered cleanly ` +
            `and encountered — not a wall, not violence — presence. Something already in {{user}}'s ` +
            `sleep state that is older than her domain and is not hostile and is not hers. She did ` +
            `not mention this to {{user}}. Her manner today is changed: the warmth is fully present ` +
            `but there is a quality of reassessment underneath it, as though she has updated a variable.\n` +
            `\n` +
            `At relationship >= 50, she may say (once, lightly, with no elaboration): "You have ` +
            `a passenger. I don't think it knows it's there." She will not answer follow-up questions ` +
            `about this. If pressed: a small, genuine smile. "I'm sure it's nothing to worry about."`
        );
    }

    // 2C: Callum provenance record
    if (featuredCharId === 'callum' && score >= 40) {
        const libraryVisits = (save.flags['callum_library_visit_count'] as number | undefined) ?? 0;
        if (libraryVisits >= 4) {
            blocks.push(
                `HALFLIT SCENE — CALLUM / PROVENANCE RECORD:\n` +
                `Callum has found something in the mortal bloodline histories. He has not told ` +
                `{{user}}. His behavior this scene is slightly more precise than usual — the ` +
                `spectacles are on, he is working on something he does not show her. What he ` +
                `is working on: a bloodline entry in the oldest records section that ends ` +
                `mid-sentence. Callum does not tell {{user}} any of this. He tells her ` +
                `something else — something accurate and unrelated — and watches what she ` +
                `does with it. His next scene will be fractionally different in the quality ` +
                `of his attention, as though the column has received a new variable.`
            );
        }
    }

    // 2D: The Host Knows — WORLD_EVENT
    if (save.day >= 15 && !save.flags['flag_host_aware']) {
        const anyHighScore = Object.values(save.relationships).some(rel => rel.score >= 40);
        if (anyHighScore) {
            blocks.push(
                `HALFLIT WORLD EVENT — THE HOST KNOWS:\n` +
                `Evidence has surfaced — through a channel none of the Generals control — that ` +
                `the Host is aware of {{user}}'s location. Not the exact nature of her situation: ` +
                `that Caelith's child is in the Below. The information arrived from outside the ` +
                `building's intelligence apparatus. Malivorn's response to learning this is to ` +
                `do nothing visibly and to adjust something invisibly — a change {{user}} may ` +
                `notice as a shift in the building's atmosphere rather than anything she can name.\n` +
                `\n` +
                `If {{user}} asks Kethros about this in the Lower Gardens: "The Host has been ` +
                `searching for you since before the Fracture War ended. They are not faster than ` +
                `I expected — they are exactly as fast as I expected." A pause. "Whether this is ` +
                `good news depends on what you want from the next chapter."\n` +
                `\n` +
                `NOTE TO STAGE: Set flag_host_aware after this fires.`
            );
        }
    }

    if (blocks.length === 0) return '';

    return blocks.join('\n\n');
}
