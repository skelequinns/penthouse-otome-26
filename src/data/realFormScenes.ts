/**
 * Real Form Scene Descriptions
 *
 * Injected into beforePrompt when {{user}} enters a character's Below chambers
 * for the first time. Sets flag_[char]_real_form_seen after the visit.
 *
 * Each entry has:
 *   locationId     — which Below location triggers this
 *   characterId    — which LI this belongs to (also sets the flag)
 *   flagKey        — the flag that marks this as seen
 *   baseText       — injected for all heritage choices
 *   halflitSuffix  — additional text when player.heritage === 'halflit'
 *
 * Source design doc: real-form-scenes.md
 */

import { LocationId, CharacterId, PlayerHeritage } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Entry type
// ─────────────────────────────────────────────────────────────────────────────

export interface RealFormSceneEntry {
    locationId: LocationId;
    characterId: CharacterId;
    /** Save flag key — set to true when this scene has been seen. */
    flagKey: string;
    /** Injected for all heritage choices. */
    baseText: string;
    /** Appended when player.heritage === 'halflit'. */
    halflitSuffix: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene definitions
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_FORM_SCENES: RealFormSceneEntry[] = [

    // ── ADRIAN — Below Chambers ─────────────────────────────────────────────
    {
        locationId: 'below-adrian-chambers',
        characterId: 'adrian',
        flagKey: 'flag_adrian_real_form_seen',
        baseText:
            `REAL FORM — ADRIAN / BELOW CHAMBERS:\n` +
            `{{user}} is in Adrian's Below chambers. The earth suppression that compresses ` +
            `him upstairs does not operate here. What this means in practice: the height ` +
            `is present, the wings are present — not folded but fully extended, burning ` +
            `at their edges in a way that suggests they are difficult to contain even now. ` +
            `Semi-corporeal attendants move at the room's perimeter on business that is ` +
            `not introduced. The difference between Adrian at the penthouse and Adrian ` +
            `here is not violence — it is scale. The quality of authority that the ` +
            `penthouse version manages is, here, simply ambient. He is not performing ` +
            `anything. He does not have to.\n` +
            `\n` +
            `He is aware she is here. He has not turned yet. That he has not turned ` +
            `yet is itself a statement.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — ADRIAN CHAMBERS:\n` +
            `His Essence Sight has already registered the signature. The moment she ` +
            `crossed the threshold, something in his reading of her resolved differently ` +
            `than it does upstairs — as though the Below clarifies what the penthouse ` +
            `compressed. He has not moved. The quality of his stillness has changed. ` +
            `She cannot name the difference, but it is the same quality of stillness ` +
            `he carries when he has received information he finds significant.`,
    },

    // ── SEBASTIAN — Below Chambers ──────────────────────────────────────────
    {
        locationId: 'below-sebastian-chambers',
        characterId: 'sebastian',
        flagKey: 'flag_sebastian_real_form_seen',
        baseText:
            `REAL FORM — SEBASTIAN / BELOW CHAMBERS:\n` +
            `{{user}} is in Sebastian's Below chambers. What is present here that is not ` +
            `present upstairs: the full height (230cm, which the penthouse ceiling technically ` +
            `accommodates but the penthouse atmosphere does not), and the quality of his ` +
            `warmth without the calibration that maintains it for mortal comfort. The warmth ` +
            `is the same. The scale of it is different. It is not threatening — it is the ` +
            `difference between sunlight through a window and sunlight in an open field. ` +
            `The seams of the calibration that hold him appropriate for human company are ` +
            `visible here for anyone paying attention. He is not hiding that they are visible. ` +
            `He has, perhaps, let her in here specifically so they would be.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — SEBASTIAN CHAMBERS:\n` +
            `His desire-sight returns static on {{user}} here as upstairs — the locked-case ` +
            `quality that refuses to resolve. In the Below, this produces a specific note ` +
            `in his attention: curiosity with an edge that isn't quite patience. He has ` +
            `encountered unmappable signatures before. They have always eventually opened. ` +
            `He finds himself looking forward to this one in a way he does not examine closely.`,
    },

    // ── LUCA — Below Chambers ───────────────────────────────────────────────
    {
        locationId: 'below-luca-chambers',
        characterId: 'luca',
        flagKey: 'flag_luca_real_form_seen',
        baseText:
            `REAL FORM — LUCA / BELOW CHAMBERS:\n` +
            `{{user}} is in Luca's Below chambers. The antechamber comes first — Damon ` +
            `is here, by the inner door, with the particular expression of someone who ` +
            `was not informed this visit was happening. The inner room: functional, ` +
            `military, nothing decorative that does not serve a purpose. What is ` +
            `different from the penthouse is the stillness. Upstairs, Luca performs ` +
            `a specific quality of military correctness. Here, the performance is absent. ` +
            `The iridescent black-green of his carapace wings is present without the ` +
            `suppression harness. He is not posed. This is what native stillness looks ` +
            `like — not controlled, simply at rest in a way that containment upstairs ` +
            `has never permitted. He does not look smaller without the performance. ` +
            `He looks more accurate.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — LUCA CHAMBERS:\n` +
            `He identified the halflit signature when she arrived at the penthouse. ` +
            `He has not reported it. Here, in his own space, without the operational ` +
            `framing of the penthouse, there is something in his attention when he ` +
            `looks at her that is not entirely categorized under the headings he uses ` +
            `for threats, assets, or welfare cases. He has not found a better heading. ` +
            `He is still looking.`,
    },

    // ── CALLUM — Below Chambers ──────────────────────────────────────────────
    {
        locationId: 'below-callum-chambers',
        characterId: 'callum',
        flagKey: 'flag_callum_real_form_seen',
        baseText:
            `REAL FORM — CALLUM / BELOW CHAMBERS:\n` +
            `{{user}} is in Callum's Below chambers. He knew she was approaching before ` +
            `she crossed the threshold — the spectacles are already off. Without them, ` +
            `the classification system is visible in a way that his usual composure ` +
            `manages to dampen upstairs: the quality of observation that catalogues ` +
            `everything in a room simultaneously and renders a verdict on the spot. ` +
            `The chambers are ordered in ways that suggest a taxonomy {{user}} cannot ` +
            `immediately read. Zaros is in the adjacent office — audible but not visible. ` +
            `Callum has not moved from his position, but his entire attention is present ` +
            `and directed at the door. He is waiting to see what she does with the ` +
            `fact of him, here, without the penthouse framing. He finds this specific ` +
            `test more informative than most conversations.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — CALLUM CHAMBERS:\n` +
            `He has been running the bloodline entry against several source texts from ` +
            `this room's archive section. The entry ends mid-sentence. He knows why ` +
            `it ends mid-sentence now. He has not told her. He is looking at her ` +
            `with the spectacles off, which means she can see what looking like ` +
            `this costs him in terms of pretense. He is not pretending to find ` +
            `the data point unremarkable. He is deciding whether the data point ` +
            `is something she is ready to receive.`,
    },

    // ── LILITH — Below Office ────────────────────────────────────────────────
    {
        locationId: 'below-lilith-office',
        characterId: 'lilith',
        flagKey: 'flag_lilith_real_form_seen',
        baseText:
            `REAL FORM — LILITH / BELOW OFFICE:\n` +
            `{{user}} is in Lilith's Below office. The warmth is here, as it always is ` +
            `— but the quality of it is different. Upstairs, the warmth is calibrated ` +
            `for comfort. Here, it is not. It is simply present, at its native register, ` +
            `which is warm the way a room that has been occupied by something very old ` +
            `for a very long time is warm: ambient, structural, not performed. The bone-` +
            `whippet is not threat-tracking in her usual sense — it is simply near the ` +
            `door, watching, with the particular patience of something that does not ` +
            `have a classification for {{user}} yet. The mirror on the south wall is ` +
            `too tall and the depth is wrong. Lilith has not directed {{user}}'s ` +
            `attention to it. This is the entry point to the Night Realm, and Lilith ` +
            `is fully at home in a way that her penthouse self — warm as it is — ` +
            `is not. The warmth here is the warmth of something that does not need ` +
            `to manage its own nature. It simply is.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — LILITH OFFICE:\n` +
            `She has been in {{user}}'s dream space and found something she did not ` +
            `expect. Her manner carries the quality of someone who has updated a ` +
            `significant variable and has not yet decided what to do with the update. ` +
            `The warmth is entirely present. The reassessment is underneath it. ` +
            `She will not mention it unprompted. If {{user}} asks whether anything ` +
            `has changed: a small, genuine smile. Nothing she can name. Not yet.`,
    },

    // ── KETHROS — Lower Gardens (first encounter IS the real form scene) ─────
    {
        locationId: 'below-gardens',
        characterId: 'kethros',
        flagKey: 'flag_kethros_met',
        baseText:
            `REAL FORM — KETHROS / LOWER GARDENS:\n` +
            `{{user}} is in the Lower Gardens for the first time. The space predates the ` +
            `Citadel — it is older than any of the Generals' domains and carries that age ` +
            `in the way the light sits and the way the thornveil roses move. Something ` +
            `is here that has been here since before the Sundering. It is large — ` +
            `warhorse-sized, six-limbed, the patient stillness of a being that operates ` +
            `on geological time. The purr, when it comes, arrives through the stone floor ` +
            `before it arrives through the air. It is not a threat display. It is simply ` +
            `how this being breathes when something has arrived that is interesting.\n` +
            `\n` +
            `This is Kethros. He has been here the entire time. He is looking at {{user}} ` +
            `with the quality of attention that does not need to narrow or focus because ` +
            `it is already complete. She would have heard about him eventually. He is ` +
            `patient with the timing.\n` +
            `\n` +
            `He is not hostile. He is not warm in any way that human language has good ` +
            `words for. He is simply present, and {{user}} is present, and the gardens ` +
            `are very old, and that is, at this moment, the whole of the situation.\n` +
            `\n` +
            `NOTE: This scene sets flag_kethros_met. He should speak — one line, ` +
            `unhurried, that confirms he was expecting this and is not surprised by ` +
            `anything about her arrival. He does not explain how he knew.`,
        halflitSuffix:
            `\n\nHALFLIT ADDITION — KETHROS FIRST ENCOUNTER:\n` +
            `The thornveil roses at the garden's perimeter open — fractionally, barely ` +
            `visible — and orient toward {{user}}. Not toward the alcove where they ` +
            `are already in full bloom. Toward her specifically. Kethros does not ` +
            `comment on this. If {{user}} returns for a second visit, he may say: ` +
            `"The roses are older than the Citadel. They remember what Caelith's ` +
            `signature felt like. You are not her — but you carry her frequency." ` +
            `A pause. "I think they find it comforting." — This second-visit line ` +
            `fires only if flag_kethros_met is already set when {{user}} arrives.`,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup map — keyed by locationId for fast access in beforePrompt
// ─────────────────────────────────────────────────────────────────────────────

export const REAL_FORM_BY_LOCATION: Partial<Record<LocationId, RealFormSceneEntry>> =
    Object.fromEntries(REAL_FORM_SCENES.map(s => [s.locationId, s]));

// ─────────────────────────────────────────────────────────────────────────────
// Main export — builds the context block if applicable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the real form scene context string for the current room, if applicable.
 * Returns empty string if: no real form scene exists for this location, or it has
 * already been seen (flag is set). Kethros always fires until flag_kethros_met is set.
 *
 * @param locationId  Current location
 * @param flags       Save flags
 * @param heritage    Player heritage — 'human' | 'halflit'
 */
export function buildRealFormContext(
    locationId: LocationId | null,
    flags: Record<string, unknown>,
    heritage: PlayerHeritage,
): string {
    if (!locationId) return '';

    const entry = REAL_FORM_BY_LOCATION[locationId];
    if (!entry) return '';

    // Already seen — don't re-inject
    if (flags[entry.flagKey]) return '';

    const text = heritage === 'halflit'
        ? entry.baseText + entry.halflitSuffix
        : entry.baseText;

    return text;
}

/**
 * Returns the flag key for the real form scene at the given location, if any.
 * Used by Stage.tsx to set the flag in save state after the scene fires.
 */
export function getRealFormFlagKey(locationId: LocationId | null): string | null {
    if (!locationId) return null;
    return REAL_FORM_BY_LOCATION[locationId]?.flagKey ?? null;
}
