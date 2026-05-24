/**
 * Hell is a Penthouse in Toronto — Design System
 *
 * Base palette — sourced from neon city reference art
 * ─────────────────────────────────────────────────────
 * #0A0F28  dark navy      — primary background (rightmost swatch)
 * #1C2060  cobalt blue    — panels, cards (4th swatch)
 * #EE00EE  fuchsia        — primary accent (2nd swatch — hot magenta)
 * #00D4D4  electric cyan  — secondary accent (3rd swatch)
 * #7B1FA2  deep purple    — tertiary accent (1st swatch)
 *
 * Text
 * #F0F0FF  near-white     — primary text (slight blue tint reads on navy)
 * #8888C8  muted periwinkle — secondary text / labels
 */

export const PALETTE = {
    darkNavy:      '#0A0F28',
    cobaltBlue:    '#1C2060',
    fuchsia:       '#EE00EE',
    electricCyan:  '#00D4D4',
    deepPurple:    '#7B1FA2',
    nearWhite:     '#F0F0FF',
    periwinkle:    '#8888C8',
} as const;

/**
 * Semantic aliases — use these in components rather than raw hex values
 * so that if the palette shifts, only this file needs to change.
 */
export const COLORS = {
    // Backgrounds
    bgPrimary:      PALETTE.darkNavy,
    bgPanel:        '#0F1438',   // between darkNavy and cobaltBlue
    bgCard:         '#070B1E',   // deeper than darkNavy — for inset surfaces

    // Text
    textPrimary:    PALETTE.nearWhite,
    textSecondary:  PALETTE.periwinkle,
    textMuted:      '#444470',

    // Accents & interactive
    accent:         PALETTE.fuchsia,
    accentHover:    '#FF33FF',
    accentSubtle:   '#300030',

    // Borders
    borderDefault:  '#1E2455',
    borderAccent:   PALETTE.fuchsia,

    // Relationship bar — hostile (–100) through neutral (0) to devoted (+100)
    relationshipNegative: '#141830',
    relationshipNeutral:  '#1C2448',
    relationshipPositive: PALETTE.fuchsia,
    relationshipDevoted:  '#FF88FF',

    // Utility
    white:  '#FFFFFF',
    black:  '#000000',
    error:  '#FF4444',
    success: '#00D4D4',
} as const;

/**
 * Per-character accent colors
 * Applied to character cards, scene headers, relationship bars, and name plates.
 * Each color is drawn from the cyberpunk neon palette — cyan → blue → purple → magenta.
 * Sebastian is the deliberate outlier: amber against a cool field reads as danger.
 */
export const CHARACTER_COLORS: Record<string, { accent: string; font: string }> = {
    adrian: {
        accent: '#6655CC',   // deep periwinkle-violet — cold sovereignty, controlled depth
        font:   "'Cormorant Garamond', 'Garamond', serif",
    },
    sebastian: {
        accent: '#F5A623',   // amber-gold — the only warm note; desire as threat
        font:   "'Playfair Display', 'Georgia', serif",
    },
    kethros: {
        accent: '#00D4D4',   // electric cyan — ancient, pre-everything, inhuman
        font:   "'IM Fell English', 'Palatino Linotype', serif",
    },
    luca: {
        accent: '#3399FF',   // cobalt blue — military precision, contained force
        font:   "'Libre Baskerville', 'Georgia', serif",
    },
    callum: {
        accent: '#4488EE',   // clear blue — data, accumulation, watching
        font:   "'Source Serif Pro', 'Georgia', serif",
    },
    lilith: {
        accent: '#DD44FF',   // electric violet-magenta — beautiful and wrong
        font:   "'Cormorant', 'Garamond', serif",
    },
} as const;

export type CharacterColorKey = keyof typeof CHARACTER_COLORS;
