/**
 * Hell is a Penthouse in Toronto — Design System
 *
 * Base palette
 * ─────────────────────────────────────────────
 * #0E0509  near-black    — primary background, deepest layer
 * #3B0A1F  deep wine     — secondary background, panels, cards
 * #8B1A4A  merlot        — accent, active states, borders, relationship bars
 * #D4A5B5  dusty rose    — secondary text, labels, soft highlights
 * #F0E4D0  candlelight   — primary text, headings
 */

export const PALETTE = {
    nearBlack:    '#0E0509',
    deepWine:     '#3B0A1F',
    merlot:       '#8B1A4A',
    dustyRose:    '#D4A5B5',
    candlelight:  '#F0E4D0',
} as const;

/**
 * Semantic aliases — use these in components rather than raw hex values
 * so that if the palette shifts, only this file needs to change.
 */
export const COLORS = {
    // Backgrounds
    bgPrimary:      PALETTE.nearBlack,
    bgPanel:        PALETTE.deepWine,
    bgCard:         '#2A0716',   // between nearBlack and deepWine — for elevated surfaces

    // Text
    textPrimary:    PALETTE.candlelight,
    textSecondary:  PALETTE.dustyRose,
    textMuted:      '#9A7080',   // dustyRose at reduced opacity equivalent

    // Accents & interactive
    accent:         PALETTE.merlot,
    accentHover:    '#A82258',   // merlot lightened for hover state
    accentSubtle:   '#5C1233',   // merlot darkened for backgrounds behind active elements

    // Borders
    borderDefault:  '#4A1028',   // between deepWine and merlot
    borderAccent:   PALETTE.merlot,

    // Relationship bar — hostile (–100) through neutral (0) to devoted (+100)
    // Used as a CSS gradient; negative range uses cool/grey, positive uses warm palette
    relationshipNegative: '#3A2535',   // muted, cold
    relationshipNeutral:  '#5C3347',   // mid-tone
    relationshipPositive: PALETTE.merlot,
    relationshipDevoted:  '#E8A0B8',   // bright dusty rose for max score

    // Utility
    white:  '#FFFFFF',
    black:  '#000000',
    error:  '#8B2020',
    success: '#2A5C3A',
} as const;

/**
 * Per-character accent colors
 * Applied to character cards, scene headers, relationship bars, and name plates.
 * Each character gets their own color identity within the base palette's range.
 *
 * TODO: Finalize with Rin once character portraits are generated —
 * colors may need adjustment to complement portrait tones.
 */
export const CHARACTER_COLORS: Record<string, { accent: string; font: string }> = {
    adrian: {
        accent: '#1A1214',   // near-black with a warm undertone — sovereignty, depth
        font:   "'Cormorant Garamond', 'Garamond', serif",
    },
    sebastian: {
        accent: '#7A4A1A',   // deep amber-gold — desire, warmth that reads as danger
        font:   "'Playfair Display', 'Georgia', serif",
    },
    kethros: {
        accent: '#1A3A2A',   // deep forest — ancient, pre-everything, not infernal
        font:   "'IM Fell English', 'Palatino Linotype', serif",
    },
    luca: {
        accent: '#1A2A1A',   // near-black with green — military, controlled force
        font:   "'Libre Baskerville', 'Georgia', serif",
    },
    callum: {
        accent: '#2A2A3A',   // near-black with silver-blue — precision, accumulation
        font:   "'Source Serif Pro', 'Georgia', serif",
    },
    lilith: {
        accent: '#3A1A2A',   // deep rose-black — beautiful, wrong at the seams
        font:   "'Cormorant', 'Garamond', serif",
    },
} as const;

export type CharacterColorKey = keyof typeof CHARACTER_COLORS;
