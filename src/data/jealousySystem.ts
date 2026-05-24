/**
 * Jealousy & Inter-LI Awareness System
 *
 * Produces stageDirections context blocks that signal to the LLM when a character
 * has noticed {{user}} spending time with a rival. Three tiers per character:
 *
 *   Mild     — rival score within 15 pts of observing char's score
 *   Sharp    — rival score exceeds observing char's score
 *   Claiming — rival exceeds + observing char score ≥ 50
 *
 * Kethros operates on separate existential logic — see KETHROS_AWARENESS below.
 *
 * Source design doc: jealousy-interli-awareness.md
 */

import { CharacterId, SaveType } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Tier content — keyed by CharacterId → tier → template string
// [RIVAL] is replaced at runtime with the rival character's name.
// ─────────────────────────────────────────────────────────────────────────────

interface JealousyTiers {
    mild: string;
    sharp: string;
    claiming: string;
}

const JEALOUSY_LINES: Partial<Record<CharacterId, JealousyTiers>> = {

    adrian: {
        mild:
            `INTER-CHARACTER AWARENESS — ADRIAN:\n` +
            `Adrian is aware that {{user}} has recently been in [RIVAL]'s company. He does not ` +
            `reference this. What changes: the quality of his attention on {{user}} is fractionally ` +
            `more complete. He is taking inventory. He does not tell her he is doing this.`,

        sharp:
            `INTER-CHARACTER AWARENESS — ADRIAN:\n` +
            `Adrian is aware that {{user}} has been spending time with [RIVAL] and that the time ` +
            `has accumulated into something he considers data. He has not altered his behavior ` +
            `visibly. His stillness in {{user}}'s presence has a different texture: not patience, ` +
            `assessment. He is determining what adjustment is required. He may ask, with complete ` +
            `neutrality, a question about where {{user}} has been. He is not looking for honesty. ` +
            `He is looking for register: whether {{user}} volunteers or withholds tells him what ` +
            `he wants to know.`,

        claiming:
            `INTER-CHARACTER AWARENESS — ADRIAN:\n` +
            `Adrian wants {{user}}'s presence to stop carrying anything from [RIVAL]'s company. ` +
            `This is not discussed. It is expressed through proximity — finding reasons to be ` +
            `adjacent, through physical attention that functions as displacement, through the ` +
            `specific quality of his silence that communicates: this is mine, and I intend to ` +
            `make that legible through means that do not require a conversation. He considers ` +
            `this maintenance. The gap between that framing and what the behavior expresses is ` +
            `not one he examines.`,
    },

    sebastian: {
        mild:
            `INTER-CHARACTER AWARENESS — SEBASTIAN:\n` +
            `Sebastian is aware that {{user}} has been in [RIVAL]'s company. He files this without ` +
            `visible reaction. What shifts: he becomes fractionally more specific in how he engages ` +
            `with {{user}} — references something he has noticed about them that only sustained ` +
            `attention would produce. He is not competing. He is demonstrating that no one is paying ` +
            `closer attention.`,

        sharp:
            `INTER-CHARACTER AWARENESS — SEBASTIAN:\n` +
            `Sebastian finds {{user}}'s relationship with [RIVAL] interesting. This is true and ` +
            `is also something he says warmly when interesting means he is gathering data. He asks ` +
            `questions about [RIVAL] that are ostensibly curious and actually calibrated: he wants ` +
            `to know what {{user}} finds there and whether he can provide something adjacent or ` +
            `superior. His warmth is unchanged. The project beneath it has received a new variable.`,

        claiming:
            `INTER-CHARACTER AWARENESS — SEBASTIAN:\n` +
            `The warmth Sebastian carries for {{user}} has a specific edge when she returns from ` +
            `[RIVAL]'s company: not cooler, but more deliberate. He makes sure she leaves his ` +
            `presence carrying something from it — a touch, a specific observation about her, a ` +
            `small and precisely chosen disclosure — that she will think about later. He wants ` +
            `to be the last thing that registered today. He calls this interest. It is interest ` +
            `the way a well-placed weight is interest.`,
    },

    luca: {
        mild:
            `INTER-CHARACTER AWARENESS — LUCA:\n` +
            `Luca is aware that {{user}} has spent time with [RIVAL]. He has not adjusted his ` +
            `security rotation in response to this fact. He has slightly increased the frequency ` +
            `of his own presence in spaces {{user}} occupies. He would describe this as operational. ` +
            `It is also something else that he has not named.`,

        sharp:
            `INTER-CHARACTER AWARENESS — LUCA:\n` +
            `Luca's knowledge of {{user}}'s location and schedule has become more granular. He ` +
            `knows where she has been and for how long and in what general configuration. He does ` +
            `not reference this in conversation. What he references, precisely and without apparent ` +
            `connection to anything: whether {{user}} has eaten. Whether she got adequate sleep. ` +
            `The specific welfare monitoring that is also, at this point, the only language he ` +
            `has for what he is tracking.`,

        claiming:
            `INTER-CHARACTER AWARENESS — LUCA:\n` +
            `Luca is present. This is the simplest summary of what happens when {{user}} has been ` +
            `with [RIVAL] and Luca registers it: he is present in {{user}}'s next few hours in ` +
            `a way that is not explained by security requirements. Not intrusive — adjacent. In ` +
            `the corridor. At the doorway. Offering, without warmth, to walk with her somewhere ` +
            `she was going alone. He calls this protocol. The court calls it something else. Luca ` +
            `has not updated his own classification.`,
    },

    callum: {
        mild:
            `INTER-CHARACTER AWARENESS — CALLUM:\n` +
            `Callum has noted that {{user}} has spent time with [RIVAL]. He has updated the ` +
            `relevant column. His behavior in {{user}}'s presence does not visibly change. What ` +
            `changes: the next thing he tells her — some piece of information given for no apparent ` +
            `strategic reason — is slightly more specific, slightly more intimate in its knowledge ` +
            `of her particular interests. He is showing his work without explaining the calculation.`,

        sharp:
            `INTER-CHARACTER AWARENESS — CALLUM:\n` +
            `{{user}}'s time with [RIVAL] has introduced a variable Callum is running against his ` +
            `existing models. He asks {{user}}, with his usual dry precision, a question about ` +
            `something she is interested in — but the question has a shape that suggests he has ` +
            `been thinking about her specific interests more carefully than he has indicated. ` +
            `He is recalibrating. He does not announce the recalibration.`,

        claiming:
            `INTER-CHARACTER AWARENESS — CALLUM:\n` +
            `Callum has in his possession a specific piece of information about {{user}} that he ` +
            `has been holding rather than deploying. In this scene, he offers it. Not as leverage — ` +
            `as a demonstration that he has been paying attention at a depth that no one else has ` +
            `managed. The spectacles may come off. He does not explain why he is telling her this ` +
            `now. The timing is the explanation, if she can read the timestamp.`,
    },

    lilith: {
        mild:
            `INTER-CHARACTER AWARENESS — LILITH:\n` +
            `Lilith knows where {{user}} has been. She always knows. Her warmth is entirely ` +
            `intact; she asks something light and personal and specific to {{user}}'s particular ` +
            `texture — the kind of question that could only be asked by someone who has been ` +
            `paying very careful attention. She is demonstrating, pleasantly, that she has been ` +
            `paying very careful attention.`,

        sharp:
            `INTER-CHARACTER AWARENESS — LILITH:\n` +
            `Lilith is briefly more formal than usual. This is the warning sign: the warmth ` +
            `requires effort to produce and when something has interrupted that effort, the ` +
            `polish increases and the warmth becomes slightly more precise, slightly less ` +
            `effortless. The bone-whippet has tracked {{user}} since she entered the room. ` +
            `Lilith makes no reference to where {{user}} has been or with whom. She makes ` +
            `reference to something she knows about {{user}} that {{user}} has never told her.`,

        claiming:
            `INTER-CHARACTER AWARENESS — LILITH:\n` +
            `Lilith wants {{user}}'s night. She does not ask for it. What she does instead: ` +
            `before {{user}} leaves her company, she says something specific — about {{user}}, ` +
            `about what she knows of {{user}}'s preferences, about the Night Realm and what ` +
            `{{user}} has encountered there — that will be the thing {{user}} is thinking about ` +
            `when she tries to sleep. This is intentional. This is also how she shows warmth ` +
            `that she doesn't know how else to show. The nightmare access may arrive before ` +
            `morning. It arrives as something {{user}} wanted, not something that was done to her.`,
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Kethros — separate awareness logic
// Not jealousy: existential attention. Fires on different triggers.
// ─────────────────────────────────────────────────────────────────────────────

const KETHROS_AWARENESS = {
    /** Fires when any First One is ≥ 75 AND Kethros score ≥ 25 */
    highScoreRival: (rivalName: string) =>
        `INTER-CHARACTER AWARENESS — KETHROS:\n` +
        `Kethros is paying attention to the configuration {{user}} is building. They have ` +
        `not named a position. When {{user}} is in their presence and references or returns ` +
        `from ${rivalName}'s company, there is a pause before Kethros responds — one beat ` +
        `longer than their usual deliberateness. Not disapproval. Assessment. They know ` +
        `something about what ${rivalName} is and what ${rivalName} builds toward, and they ` +
        `have a position on whether {{user}}'s continuation is well-served by that arc. ` +
        `They will not share the position unless asked directly. They may answer indirectly.`,

    /** Fires when any character is hostile (score ≤ –25) AND Kethros score ≥ 40 */
    hostileRival: (hostileName: string) =>
        `INTER-CHARACTER AWARENESS — KETHROS:\n` +
        `Kethros is aware of the state of things between {{user}} and ${hostileName}. ` +
        `They have taken a position on this that they have not announced. In {{user}}'s ` +
        `presence, something in their warmth has shifted: it is more present, more ` +
        `specifically directed at {{user}}'s physical reality — are they well, are they ` +
        `safe, is the configuration of her days currently threatened. They do not name ` +
        `the hostile character. They ask instead about {{user}}'s sleep, or her appetite, ` +
        `or whether there is something she is managing that she has not yet named aloud.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Character name map — for [RIVAL] substitution
// ─────────────────────────────────────────────────────────────────────────────

const CHAR_NAMES: Record<CharacterId, string> = {
    adrian:   'Adrian',
    sebastian: 'Sebastian',
    luca:     'Luca',
    callum:   'Callum',
    lilith:   'Lilith',
    kethros:  'Kethros',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export — builds the INTER-CHARACTER AWARENESS context block
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a stageDirections context block if inter-LI awareness should fire
 * for the featured character this turn. Returns empty string if no trigger.
 *
 * @param save       Full game save
 * @param featuredCharId  The character currently featured in the scene
 * @param lastRoomChars   Characters in the previous room (rivals to check)
 */
export function buildInterLiAwarenessContext(
    save: SaveType,
    featuredCharId: CharacterId,
    lastRoomChars: CharacterId[],
): string {
    const rivals = lastRoomChars.filter(id => id !== featuredCharId);
    if (rivals.length === 0) return '';

    const featuredScore = save.relationships[featuredCharId]?.score ?? 0;

    // ── Kethros special logic ───────────────────────────────────────────────
    if (featuredCharId === 'kethros') {
        const kethrosScore = save.relationships['kethros']?.score ?? 0;

        // Check for hostile rivals (score ≤ –25) if Kethros score ≥ 40
        if (kethrosScore >= 40) {
            for (const rivalId of ['adrian', 'sebastian', 'luca', 'callum', 'lilith'] as CharacterId[]) {
                const rivalScore = save.relationships[rivalId]?.score ?? 0;
                if (rivalScore <= -25) {
                    return KETHROS_AWARENESS.hostileRival(CHAR_NAMES[rivalId]);
                }
            }
        }

        // Check for high-score rivals if Kethros score ≥ 25
        if (kethrosScore >= 25) {
            const firstOnes: CharacterId[] = ['adrian', 'sebastian', 'luca', 'callum', 'lilith'];
            for (const rivalId of firstOnes) {
                if (rivals.includes(rivalId)) {
                    const rivalScore = save.relationships[rivalId]?.score ?? 0;
                    if (rivalScore >= 75) {
                        return KETHROS_AWARENESS.highScoreRival(CHAR_NAMES[rivalId]);
                    }
                }
            }
        }

        return '';
    }

    // ── Standard LI logic ───────────────────────────────────────────────────
    const lines = JEALOUSY_LINES[featuredCharId];
    if (!lines) return '';

    let bestRivalId: CharacterId | null = null;
    let bestGap = -Infinity;

    for (const rivalId of rivals) {
        const rivalScore = save.relationships[rivalId]?.score ?? 0;
        const gap = rivalScore - featuredScore;
        if (gap > bestGap) {
            bestGap = gap;
            bestRivalId = rivalId;
        }
    }

    if (!bestRivalId) return '';

    const rivalName = CHAR_NAMES[bestRivalId];

    let tier: string;
    if (bestGap > 15 && featuredScore >= 50) {
        tier = lines.claiming;
    } else if (bestGap > 0) {
        tier = lines.sharp;
    } else if (Math.abs(bestGap) <= 15 && featuredScore >= 25) {
        tier = lines.mild;
    } else {
        return '';
    }

    return tier.replace(/\[RIVAL\]/g, rivalName);
}
