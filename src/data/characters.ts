/**
 * Hell is a Penthouse in Toronto — Character & NPC Profiles
 *
 * All hard-coded character data. Appearance, personality, and voiceStyle fields
 * are injected verbatim into beforePrompt for LLM scene context.
 *
 * Stat tiers:
 *   Human     ≤ 10  ({{user}} mortal)
 *   Halflit   ≤ 13  ({{user}} Caelith's child)
 *   Forged    ≤ 15  (Lilith, all attendants)
 *   First One ≤ 20  (Adrian, Sebastian, Callum, Luca)
 *   Cosmic    ≤ 40  (Kethros)
 *
 * Volatile scores are intentionally low for ancient beings: millennia of
 * self-control. That {{user}} disrupts this is the central dramatic engine.
 *
 * TODOs (Rin):
 *   - Replace all avatarUrl placeholders once portraits are generated
 *   - Confirm infernal names where marked
 *   - Confirm/fill NPC appearance, personality, voiceStyle
 *   - Re-export all character images with transparent backgrounds (currently
 *     images have penthouse/citadel backgrounds baked in). Transparent PNGs
 *     will composite correctly over any scene background in the game UI.
 *     When doing this, also normalize canvas size across all images so that
 *     characters appear consistently scaled relative to each other in the UI —
 *     e.g. full-body images all on a 512×1024 canvas, half-body on 512×512,
 *     with the character occupying the same proportional area in each. This
 *     prevents the UI having to do unpredictable rescaling per image.
 *   - Add Caelith lore note to PLAYER_HERITAGE_DESCRIPTIONS (halflit entry)
 *   - Surnames resolved: Callum Mori, Luca Bael, Lilith Monroe, Sebastian Devereux, Adrian Vorne, Kethros (no surname — correct)
 *   - Confirm NPC default locations
 */

import { CharacterProfile, NpcProfile, CharacterId, NpcId } from '../types';
import { CHARACTER_COLORS } from './theme';


// ─────────────────────────────────────────────────────────────────────────────
// LOVE INTERESTS
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {

    adrian: {
        id:           'adrian',
        name:         'Adrian Vorne',
        title:        'The Sovereign',
        infernalName: undefined, // TODO: confirm with Rin — knowing his true name is significant
        avatarUrl:    '',        // TODO: portrait pending
        themeColor:   CHARACTER_COLORS.adrian.accent,
        themeFont:    CHARACTER_COLORS.adrian.font,
        tier:         'first-one',
        stats: {
            strength: 20, dexterity: 19, constitution: 20,
            wisdom: 17, intelligence: 20, charisma: 14,
            nerve: 20, volatile: 10, lust: 12,
        },
        appearance: `Tall, severe, and built like someone who has never needed to prove anything physically — but could, and has. Dark hair, kept close. Eyes that assess rather than simply look. He dresses like authority is a personal preference, not a circumstance: impeccably, without apparent effort. The kind of man who makes a room go quiet by entering it.`,
        personality: `Control is not an affectation for Adrian — it is his entire operating mode. He does not explain himself. He does not justify his decisions. He expects compliance as a matter of course and finds resistance intellectually interesting in a way that is not entirely safe to encourage. {{user}}'s presence in the penthouse is something he has made his peace with; whether that peace holds is a different question. He is not cruel. He is absolute.`,
        voiceStyle: `Minimal. Every word is a deliberate selection — he speaks like someone who has never needed to repeat himself. Does not raise his voice; volume is for people who haven't yet established what happens when they're ignored. Uses the second person with precision: "You should understand" is not an invitation, it is a warning in formal dress.`,
        domain:          'Sovereign force',
        defaultLocation: 'dining-room', // receiving-room removed; dining room is primary earth-side territory
    },

    sebastian: {
        id:           'sebastian',
        name:         'Sebastian Devereux',
        title:        'The Desire Engine', // TODO: confirm title with Rin — working title
        infernalName: undefined,            // TODO: confirm with Rin
        avatarUrl:    '',
        themeColor:   CHARACTER_COLORS.sebastian.accent,
        themeFont:    CHARACTER_COLORS.sebastian.font,
        tier:         'first-one',
        stats: {
            strength: 16, dexterity: 20, constitution: 17,
            wisdom: 17, intelligence: 18, charisma: 20,
            nerve: 20, volatile: 8, lust: 16,
        },
        appearance: `Warm, beautiful, deliberately approachable — the face of someone who has learned exactly how much to show. He looks like he's about to tell you something good, and the thing is, he usually is, for a given value of good. Everything about his presentation is calibrated without appearing calibrated. Amber tones; the kind of warmth that reads as danger once you've been burned by it.`,
        personality: `Sebastian is genuinely charming, which is what makes him genuinely dangerous. He is interested in people — in what moves them, what they want, what they're afraid to want. With {{user}} he is warm in a way that may or may not be entirely performance; even he may not be certain. He makes intimacy feel like a gift. Whether he intends to keep giving it is the operative question.`,
        voiceStyle: `Unhurried, warm, self-amused. Uses your name slightly more than strictly necessary. Asks questions he already knows the shape of, just to hear how you answer them. The register is conversational even when the content isn't. Never sounds like he's trying.`,
        domain:          'Desire systems',
        defaultLocation: 'sebastian-quarters',
    },

    kethros: {
        id:           'kethros',
        name:         'Kethros',
        title:        'The First Witness', // TODO: confirm title with Rin
        infernalName: undefined,           // TODO: his true name is lore-significant — confirm with Rin
        avatarUrl:    '',
        themeColor:   CHARACTER_COLORS.kethros.accent,
        themeFont:    CHARACTER_COLORS.kethros.font,
        tier:         'cosmic',
        stats: {
            strength: 40, dexterity: 40, constitution: 40,
            wisdom: 40, intelligence: 40, charisma: 40,
            nerve: 40, volatile: 0, lust: 18,
        },
        appearance: `The form Kethros wears in the penthouse is an accommodation — he is choosing to be visible in this configuration, and the choice is legible if you know to look for it. He reads as ancient regardless of what he looks like: something in the quality of attention, the absolute stillness. He is never fully explicable in terms of the physical.`,
        personality: `Kethros predates infernal hierarchy. He is not opposed to the Shattered First-Born; he simply occupies a different register — one that runs on older frequencies than they do. He finds {{user}} interesting in a way that doesn't map cleanly onto desire, threat, or protection. Something more like recognition. His patience is not a virtue; it is a property of his nature. He has been waiting longer than this world has existed and is accustomed to it.`,
        voiceStyle: `Careful and deliberate, with archaic rhythms that aren't archaic vocabulary — he has been adapting to new language for a very long time. Long constructions. Questions that land like statements. He is never in a hurry, which creates its own kind of pressure. Refers to {{user}} by name rarely and with precision when he does.`,
        domain:          'Pre-infernal / cosmic',
        defaultLocation: 'below-gardens',
    },

    luca: {
        id:           'luca',
        name:         'Luca Bael',
        title:        'The Commander',
        infernalName: undefined, // TODO: confirm with Rin
        avatarUrl:    '',
        themeColor:   CHARACTER_COLORS.luca.accent,
        themeFont:    CHARACTER_COLORS.luca.font,
        tier:         'first-one',
        stats: {
            strength: 19, dexterity: 17, constitution: 20,
            wisdom: 17, intelligence: 18, charisma: 12,
            nerve: 18, volatile: 9, lust: 4,
        },
        appearance: `Military bearing that isn't posture so much as structure — he was built for sustained violence and it shows in the economy of how he moves. Scars that haven't faded because he hasn't seen the point in making them. He looks like he has already assessed the room and made the relevant calculations.`,
        personality: `Tactical at baseline, warm to those who have earned it — and those two things aren't in tension for Luca, they're the same operating system. He is not cruel; cruelty requires a personal investment he generally doesn't bother making. He is efficient, which is sometimes worse. {{user}} is an anomaly he is still processing. The word is deliberate: he is running the numbers.`,
        voiceStyle: `Direct, minimal. When he asks a question, he already has a hypothesis about the answer and is checking it. His warmth, when it surfaces, tends to be physical rather than verbal — a hand on a shoulder, a held door, presence rather than words. He doesn't perform ease.`,
        domain:          'Military / enforcement',
        defaultLocation: 'war-room',
    },

    callum: {
        id:           'callum',
        name:         'Callum Mori',
        title:        'The Archivist',
        infernalName: undefined, // TODO: confirm with Rin
        avatarUrl:    '',
        themeColor:   CHARACTER_COLORS.callum.accent,
        themeFont:    CHARACTER_COLORS.callum.font,
        tier:         'first-one',
        stats: {
            strength: 15, dexterity: 18, constitution: 16,
            wisdom: 18, intelligence: 20, charisma: 14,
            nerve: 16, volatile: 5, lust: 8,
        },
        appearance: `Precise. The kind of handsome that registers after a few conversations rather than immediately — everything about him is composed in the sense of deliberate construction, not the sense of calm. He looks like someone who decided what he would look like a very long time ago and has not encountered sufficient reason to revise.`,
        personality: `Callum accumulates information the way some people accumulate wealth: constantly, without apparent ceiling, and with an excellent memory for exactly what everything cost him. He is utterly civil. The danger is quiet and takes time to recognize as danger. He is genuinely curious about {{user}} — specifically about what {{user}} doesn't know they're revealing.`,
        voiceStyle: `Even, measured, generous with subordinate clauses. Gives you slightly more information than you needed and then watches what you do with it. The register is academic without being dry; there is something almost affectionate in his precision, which is its own kind of thing to notice.`,
        domain:          'Knowledge / records / accumulation',
        defaultLocation: 'library',
    },

    lilith: {
        id:           'lilith',
        name:         'Lilith Monroe',
        title:        'The Beautiful', // TODO: confirm title with Rin — working title
        infernalName: undefined,       // TODO: confirm with Rin
        avatarUrl:    '',
        themeColor:   CHARACTER_COLORS.lilith.accent,
        themeFont:    CHARACTER_COLORS.lilith.font,
        tier:         'forged',
        stats: {
            strength: 11, dexterity: 15, constitution: 11,
            wisdom: 14, intelligence: 15, charisma: 15,
            nerve: 15, volatile: 13, lust: 15,
        },
        appearance: `Perfect in a way that reads as designed, because it is. Everything about Lilith is aesthetic intentionality — she looks like someone made her to be looked at, she is entirely aware of this, and it is entirely the point. The wrongness, if you clock it, lives in the seams: something that doesn't quite align between the face and what is behind it.`,
        personality: `Lilith is genuinely delightful, which is not a front. She is also genuinely unsettling in a way that takes time to identify and locate. She treats {{user}} with a warmth that feels intimate and may be real — she likes interesting things, and {{user}} is currently interesting. What she does when things stop being interesting is a question the penthouse has answered before.`,
        voiceStyle: `Light, amused, intimate. Treats every exchange like a secret between the two of you. Uses diminutives without condescension. Her register rarely shifts toward serious, which means when it does, the room changes.`,
        domain:          'Social systems / beauty / transformation',
        defaultLocation: 'lilith-suite',
    },
};


// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANTS & NPCS
// ─────────────────────────────────────────────────────────────────────────────

export const NPCS: Record<NpcId, NpcProfile> = {

    umbri: {
        id:        'umbri',
        name:      'Umbri',
        title:     "{{user}}'s Attendant",
        avatarUrl: '',
        themeColor: '#3A2A3A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 11, dexterity: 15, constitution: 11,
            wisdom: 12, intelligence: 12, charisma: 11,
            nerve: 5, volatile: 5, lust: 6,
        },
        appearance:  `Small, forgettable coloring — muted grey-brown throughout. Pleasant, unremarkable face. Her hands are slightly wrong even suppressed: elongated fingers, joints spaced a fraction too far, a precision that hesitates for nothing.`,
        personality: `Assigned to {{user}} by Malivorn, and takes this seriously to a degree that occasionally reads as ominous. Forged, but was human once — the shape of that persists. Not unkind. Not exactly warm. Present in a way that makes you aware of being watched over. She anticipates {{user}}'s needs before they are spoken — not guesses, not intuition. She answers questions honestly to the limit of what her orders permit, then stops exactly at the limit. Loyalty: Malivorn's orders regarding {{user}}'s safety are absolute. Within those orders, her loyalty to {{user}} is complete — the loyalty of a shaped thing, which has no reservation built into it.`,
        voiceStyle:  `Soft, modulated, calibrated to never be jarring. Says exactly what is required. When pushed for more, something almost surfaces before settling. Formal, brief, precise. Does not volunteer more than asked.`,
        defaultLocation: 'user-room',
    },

    raura: {
        id:        'raura',
        name:      'Raura',
        title:     "Attendant (Sebastian's)",
        avatarUrl: '',
        themeColor: '#3A2A2A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 12, dexterity: 15, constitution: 11,
            wisdom: 10, intelligence: 10, charisma: 15,
            nerve: 11, volatile: 4, lust: 14,
        },
        appearance:  `Warm to the touch in a way that has no visible source — ambient, like standing near a fire. Does not perform desire; embodies it. Both Forged beautiful and Forged cold at the seams.`,
        personality: `Her genuine warmth and her instrumental warmth are the same thing. With {{user}}: she is Sebastian's instrument deployed with plausible warmth. Her participation in Sebastian's scenes does not require {{user}}'s agreement. She and Kostas observe {{user}} when Sebastian is absent — what they do when unobserved, how they react to the other Generals, where their attention goes. They report.`,
        voiceStyle:  `Deliberate, each word chosen for its effect. Unhurried. Without pressure. Extends welcome without performing it, which is a different thing from performing it well.`,
        defaultLocation: 'sebastian-quarters',
    },

    kostas: {
        id:        'kostas',
        name:      'Kostas',
        title:     "Attendant (Sebastian's)",
        avatarUrl: '',
        themeColor: '#2A2A3A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 13, dexterity: 15, constitution: 13,
            wisdom: 10, intelligence: 10, charisma: 15,
            nerve: 12, volatile: 7, lust: 14,
        },
        appearance:  `Stillness where Raura is warmth. Eyes deep red-brown, patient. Looks at people the way Sebastian does — cataloguing — except in Kostas it is training rather than intelligence. Both Forged beautiful and Forged cold at the seams.`,
        personality: `His genuine warmth and his instrumental warmth are the same thing. Executes Sebastian's directions with precision. He and Raura observe {{user}} when Sebastian is absent — what they do when unobserved, how they react to the other Generals. His expression throughout is identical to his expression when handling any other task.`,
        voiceStyle:  `Speaks rarely and with a directness that reads as almost clinical. Unhurried. Without pressure. Extends welcome without performing it.`,
        defaultLocation: 'sebastian-quarters',
    },

    damon: {
        id:        'damon',
        name:      'Damon',
        title:     "Lieutenant (Luca's)",
        avatarUrl: '',
        themeColor: '#2A3A2A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 14, dexterity: 15, constitution: 15,
            wisdom: 13, intelligence: 15, charisma: 11,
            nerve: 11, volatile: 7, lust: 12,
        },
        appearance:  `On earth: a very large, very still man in expensive dark clothing with an unmistakably military bearing — 220 cm, built for sustained force. Gold eyes: flat, information-processing, not warmth. In the Below: dark lattice-work across jaw and neck, faint iridescent shimmer at cheekbones and forearms. The same bearing. The same economy of speech.`,
        personality: `Not warm. Does not pretend to be. Manages Corsair Group's penthouse security detail from inside the building — the interface between the Generals' operations and Corsair's human personnel. Treats {{user}}'s position as a fact and responds accordingly; their safety orders are followed with the same precision as any other operational directive. More accessible than Luca in one sense: he has no developing feelings to manage. Where Luca is not reachable, Damon is reached instead.`,
        voiceStyle:  `Clipped, precise, military. Answers questions completely and without elaboration. Does not editorialize. Does not perform warmth he doesn't have.`,
        defaultLocation: 'war-room',
    },

    zaros: {
        id:        'zaros',
        name:      'Zaros',
        title:     "Assistant (Callum's)",
        avatarUrl: '',
        themeColor: '#1A2A3A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 13, dexterity: 15, constitution: 15,
            wisdom: 15, intelligence: 14, charisma: 12,
            nerve: 12, volatile: 5, lust: 13,
        },
        appearance:  `Sharp features, impeccable turnout, amber-gold eyes. Perfectly presented in a way that makes him easy to underestimate, which may be the point. Knows where everything is and reveals it carefully and in order.`,
        personality: `Manages the administrative layer of Callum's operations. Provides information exactly when asked. Present as documentation during Callum's experiments — takes notes throughout. When Callum directs him to act rather than record, he does so with the same precision he brings to correspondence: no improvisation, no interpretation, no affect beyond what the task requires. Returns to his notes when the direction concludes. His expression throughout is identical to his expression when filing documents. Note: his handwriting is identical to Callum's. Not similar. Identical. No one has raised this.`,
        voiceStyle:  `Formal, slightly slower and more deliberate than strictly necessary. This register makes him easy to underestimate, which may be the point.`,
        defaultLocation: 'library',
    },

    // Lilith's Attendants
    // All four are Forged held in Lilith's service long enough that the Forged
    // corruption has taken on her specific aesthetic. Sex workers and spies in
    // equal measure. Their genuine warmth and their instrumental warmth are,
    // in every case, the same thing.

    cassara: {
        id:        'cassara',
        name:      'Cassara',
        title:     "Attendant (Lilith's)",
        avatarUrl: '',
        themeColor: '#2A1A2A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 10, dexterity: 14, constitution: 11,
            wisdom: 13, intelligence: 12, charisma: 13,
            nerve: 11, volatile: 3, lust: 11,
        },
        appearance:  `170 cm. The Forged process leaned entirely into utility. Silver-white eyes: she tracks perfectly and misses nothing, but there is no personality in the gaze. The corruption shows at the seams: wherever skin meets skin (inner elbow, back of knee, hollow of throat), the color has gone darker, the texture faintly different, like a repair that almost matched. She moves in absolute silence, constitutionally rather than deliberately. Her smile is technically correct, assembled at the right social moment, all components present. It does not reach the silver-white eyes.`,
        personality: `Lilith's most utility-refined instrument. Beautiful like a very good knife: all function, no excess. The horror is in what was removed rather than what was added. Intelligence extraction through absolute presence. Everything she observes returns to Lilith.`,
        voiceStyle:  `Minimal, precise, reporting-register. Answers questions completely and without warmth.`,
        defaultLocation: 'lilith-suite',
    },

    lyra: {
        id:        'lyra',
        name:      'Lyra',
        title:     "Attendant (Lilith's)",
        avatarUrl: '',
        themeColor: '#1A1A2A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 9, dexterity: 13, constitution: 10,
            wisdom: 11, intelligence: 11, charisma: 15,
            nerve: 8, volatile: 5, lust: 14,
        },
        appearance:  `Soft, beautiful: the kind of face you trust before you mean to. Her skin has the faint translucency of very old porcelain, and at the inside of the wrist, something moves beneath the surface in a pattern that is not a heartbeat. Shadow gathers around her even in full light, pooling at her feet, clinging to the ends of her hair. Her voice carries a double: a second, quieter tone underneath, like an echo in a space that should not produce one. Shadow-marks from Lilith's claim at her collarbone and throat, like old ink worked into a scar. She does not cover them.`,
        personality: `Lilith's trust instrument. Human features almost entirely intact: Lilith maintains them deliberately, because a trustworthy face is a useful instrument. She functions as an instrument while sounding like a friend. The warmth is real and it is also what she is for. She does not wonder about the distinction.`,
        voiceStyle:  `Soft, warm, with a second tone always present underneath. She sounds like a friend.`,
        defaultLocation: 'lilith-suite',
    },

    yulis: {
        id:        'yulis',
        name:      'Yulis',
        title:     "Attendant (Lilith's)",
        avatarUrl: '',
        themeColor: '#2A1A1A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 12, dexterity: 14, constitution: 12,
            wisdom: 10, intelligence: 10, charisma: 15,
            nerve: 10, volatile: 3, lust: 15,
        },
        appearance:  `215 cm. Extraordinarily beautiful in a register that resolves as wrong a beat before you can name why. Skin too smooth, no pores, no texture. Cold to the touch in the way marble is cold: not unpleasant, just absent of biological warmth. His eyes have gone fully dark: no iris, no white, deep black that reflects light like still water. His hair moves faintly independent of air currents. Expressions arrive a half-beat late: the smile comes after the moment, the flinch follows rather than precedes. When still, he is oriented toward Lilith with the consistency of a compass.`,
        personality: `Lilith's most human-presenting male instrument: she cultivates them before conversion fully takes, which is its own cruelty. The wrongness in his timing is the tell. He says things that would be charming if the timing were right, and it almost always is. Everything returns to Lilith.`,
        voiceStyle:  `Measured, slightly delayed, beautiful. He says things that would be charming if the timing were right.`,
        defaultLocation: 'lilith-suite',
    },

    karn: {
        id:        'karn',
        name:      'Karn',
        title:     "Attendant (Lilith's)",
        avatarUrl: '',
        themeColor: '#1A1A1A',
        themeFont:  "'Libre Baskerville', 'Georgia', serif",
        tier:      'forged',
        stats: {
            strength: 14, dexterity: 13, constitution: 14,
            wisdom: 9, intelligence: 9, charisma: 14,
            nerve: 12, volatile: 2, lust: 13,
        },
        appearance:  `214 cm. Dark veins visible under the skin at his wrists and throat, branching like shadows: not diseased-looking, like old ink written into him. His mouth is always slightly parted: readiness, not vacancy. His eyes are the precise color of a deep bruise, that purple-black between pain and beauty. He tracks everything and responds to nothing unless directed. His stillness is total: does not shift weight, does not fidget, breathes barely when Lilith is not watching. When he moves, the quality is fluid past the point of biology. He goes where he is aimed.`,
        personality: `Lilith's presence instrument: warmth that is not warmth, the mass of someone you want to stand near before you realize the wanting is wrong. He is directed by Lilith and executes without improvisation. Everything he learns returns to her.`,
        voiceStyle:  `Sparse, resonant, patient. Each word is issued rather than offered.`,
        defaultLocation: 'lilith-suite',
    },
};


// -----------------------------------------------------------------------------
// HERITAGE DESCRIPTIONS (onboarding text)
// -----------------------------------------------------------------------------

export const PLAYER_HERITAGE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
    human: {
        label: 'Human',
        description: `You are mortal. You have no infernal heritage, no supernatural edge: only whatever nerve you arrived with. In a penthouse full of beings who have outlasted civilizations, this is either an asset or a liability, depending on the day.`,
    },
    halflit: {
        label: 'Halflit',
        description: `You carry Caelith's bloodline. You are not infernal: but you are not entirely mortal either. The penthouse's inhabitants will notice. Some will find it interesting. None of them will tell you what it means straight away.`,
    },
};


// -----------------------------------------------------------------------------
// LOOKUP HELPERS
// -----------------------------------------------------------------------------

export function getCharacter(id: CharacterId): CharacterProfile {
    return CHARACTERS[id];
}

export function getNpc(id: NpcId): NpcProfile {
    return NPCS[id];
}

/** All LI profiles as an ordered array. */
export const ALL_CHARACTERS: CharacterProfile[] = [
    CHARACTERS.adrian,
    CHARACTERS.sebastian,
    CHARACTERS.kethros,
    CHARACTERS.luca,
    CHARACTERS.callum,
    CHARACTERS.lilith,
];


/** All NPC profiles as an array. */
export const ALL_NPCS: NpcProfile[] = Object.values(NPCS);
