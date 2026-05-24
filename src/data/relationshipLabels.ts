/**
 * Hell is a Penthouse in Toronto — Relationship Label Tiers
 *
 * Per-character labels derived from score. Displayed in the affinities panel
 * instead of (or alongside) a raw score number.
 *
 * Labels map to the seven RelationshipStage thresholds:
 *   [HOSTILE, COLD, NEUTRAL, ACQUAINTANCE, FAMILIAR, CLOSE, DEVOTED]
 *   [≤-50,   <0,   <25,     <50,          <75,       <90,   ≤100  ]
 *
 * Design intent: even high scores should feel slightly wrong — possessive,
 * consuming, not entirely safe. Negative labels are actively unpleasant
 * because reaching them matters for gameplay.
 */

import { CharacterId } from '../types';

type LabelTiers = [
    hostile:      string,   // ≤ –50
    cold:         string,   // –49 to –1
    neutral:      string,   //   0 to  24
    acquaintance: string,   //  25 to  49
    familiar:     string,   //  50 to  74
    close:        string,   //  75 to  89
    devoted:      string,   //  90 to 100
];

const RELATIONSHIP_LABEL_TIERS: Record<CharacterId, LabelTiers> = {
    // His arc: contempt → fixation. High scores are not comfortable.
    adrian: [
        'Contempt',
        'Dismissal',
        'Assessment',
        'Interest',
        'Fixation',
        'Obsession',
        'Claimed',
    ],

    // Performs at everyone. High scores mean he drops the performance —
    // which is its own kind of unsettling.
    sebastian: [
        'Tedium',
        'Diversion',
        'Appetite',
        'Intrigue',
        'Desire',
        'Devotion',
        'Surrender',
    ],

    // Not a romantic arc — a trust arc. Labels read like operational assessments.
    luca: [
        'Liability',
        'Irrelevant',
        'Assessed',
        'Acknowledged',
        'Reliable',
        'Trusted',
        'Necessary',
    ],

    // Accumulates. You are data that increasingly refuses to behave like data.
    callum: [
        'Contamination',
        'Noise',
        'Subject',
        'Specimen',
        'Study',
        'Fascination',
        'Catalogued',
    ],

    // Boredom is an active threat. Keeping her attention is the whole game.
    lilith: [
        'Forgotten',
        'Dull',
        'Noticed',
        'Amusing',
        'Captivating',
        'Hunger',
        'Kept',
    ],

    // Alien register entirely. His labels are about perception, not feeling.
    // Being seen by him is not straightforwardly good.
    kethros: [
        'Absent',
        'Peripheral',
        'Present',
        'Distinct',
        'Named',
        'Held',
        'Bound',
    ],
};

/**
 * Returns the relationship label for a character at a given score.
 * Falls back to an empty string if the character has no label tiers defined.
 */
export function getRelationshipLabel(id: CharacterId, score: number): string {
    const tiers = RELATIONSHIP_LABEL_TIERS[id];
    if (!tiers) return '';
    if (score <= -50) return tiers[0];
    if (score <    0) return tiers[1];
    if (score <   25) return tiers[2];
    if (score <   50) return tiers[3];
    if (score <   75) return tiers[4];
    if (score <   90) return tiers[5];
    return tiers[6];
}
