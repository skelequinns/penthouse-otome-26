/**
 * ChatView -- Full game UI
 *
 * Three-column layout:
 *   Left   (200px): scene background + character sprite + in-scene chips
 *   Center (flex):  top bar + scrolling message log + text input
 *   Right  (210px): affinities panel (label / bar / score / delta) + events feed
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWindowSize, BP } from '../hooks/useWindowSize';
import { SaveType, CharacterId, ALL_CHARACTER_IDS, TURN_LABELS, LocationId, PresenceState, TurnOfDay } from '../types';
import { CHARACTERS, NPCS } from '../data/characters';
import { LOCATIONS } from '../data/locations';
import { COLORS } from '../data/theme';
import { buildMapPresence, MapPresence } from '../data/locationRng';
import { getRelationshipLabel } from '../data/relationshipLabels';
import { MapView } from './MapView';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type MessageType = 'char' | 'npc' | 'user' | 'narr' | 'debug';

export interface ChatMessage {
    id: string;
    type: MessageType;
    /** Only set for type === 'char' */
    characterId?: CharacterId;
    /** Only set for type === 'npc' — matches a key in NPC_IMAGES / NPCS */
    npcId?: string;
    text: string;
    /**
     * For type === 'narr': the primary speaker as tagged by [SPEAKER:Name].
     * One of the named characters (Adrian, Callum, etc.), 'Umbri', or 'Narrator'.
     * Drives the label shown above the narrator bubble.
     */
    speaker?: string;
}

/** Context passed to onGenerateArrival for scene-setting narration. */
export interface ArrivalContext {
    locationId: LocationId;
    locationName: string;
    locationDescription: string;
    presentCharacters: CharacterId[];
    /** 'Morning' | 'Afternoon' | 'Evening' */
    timeOfDay: string;
    playerName: string;
}

/** Return type for the onSendMessage callback. */
export type SendMessageResult = {
    /** Raw stage directions from beforePrompt — shown in debug overlay. */
    stageDirections?: string | null;
    /** Actual character response text (after afterResponse processing). */
    response?: string | null;
    /** Which character is responding. */
    respondingCharacterId?: CharacterId;
    /**
     * Primary speaker name parsed from [SPEAKER:Name] tag.
     * One of: Adrian, Sebastian, Luca, Callum, Lilith, Kethros, Umbri, Narrator.
     * Used to label narrator-style response blocks in the chat log.
     */
    speakerName?: string;
    /**
     * Updated save state after afterResponse processing (e.g. met flags, score deltas).
     * In local dev mode, afterResponse doesn't run on-platform, so Stage passes the
     * mutated save back here so GameRoot can call setSave() and re-render the roster.
     */
    updatedSave?: SaveType;
};

interface ChatViewProps {
    save: SaveType;
    /**
     * Called when user sends a message.
     * Receives the text, full conversation history (for the API call),
     * and the currently-featured character.
     * Returns stage directions and/or a character response.
     */
    onSendMessage?: (
        text: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        featuredCharId: CharacterId,
    ) => Promise<SendMessageResult | null>;
    /** Initial messages to pre-populate the log (e.g. an opening narration). */
    initialMessages?: ChatMessage[];
    /** If true, shows the Map button and allows location navigation. False during the locked intro. */
    mapEnabled?: boolean;
    /**
     * Called when the player navigates to a new room via the map.
     * Receives the updated save (with new presence state) to persist.
     */
    onNavigate?: (updatedSave: SaveType) => void;
    /**
     * Called immediately after room navigation to generate an arrival narration.
     * Returns atmospheric prose describing the room and what's happening in it.
     * If not provided (no API key), a plain scene divider is shown instead.
     */
    onGenerateArrival?: (context: ArrivalContext) => Promise<string | null>;
    /**
     * Called when a SendMessageResult includes an updatedSave (local dev mode only).
     * Lets GameRoot apply save mutations that would normally happen in afterResponse
     * (e.g. met flags, score deltas) so the roster re-renders immediately.
     */
    onSaveUpdate?: (save: SaveType) => void;
    /** Called when the player confirms a new game. GameRoot should reset all state. */
    onNewGame?: () => void;
}

// -----------------------------------------------------------------------------
// Per-character image registry
// Paths are relative to /public -- served at root in dev and production.
// -----------------------------------------------------------------------------

interface CharacterImages {
    portrait: string | null;
    fullbody: string | null;
    halfbody: string | null;
    /**
     * Rendered height of the sprite as a percentage of the sprite frame height.
     * 100 = image reaches the top of the frame; smaller = shorter character.
     * The image is bottom-anchored; width scales automatically from aspect ratio.
     * For wide images (ratio < ~1.5) the 300px column may still cap the visual
     * height — adjust empirically in that case.
     */
    frameHeightPct: number;
}

const CHARACTER_IMAGES: Partial<Record<CharacterId, CharacterImages>> = {
    adrian: {
        portrait:       'https://i.imgur.com/KLgULRK.png',
        fullbody:       'https://i.imgur.com/IOu0wqH.png',
        halfbody:       null,
        frameHeightPct: 100,
    },
    sebastian: {
        portrait:       'https://i.imgur.com/VcVMDNQ.png',
        fullbody:       'https://i.imgur.com/MiZKkp0.png',
        halfbody:       null,
        frameHeightPct: 93,
    },
    kethros: {
        // Both portrait and fullbody are his humanoid form — Kethros is choosing
        // to be visible in this configuration. Swap to catVariant portrait if needed.
        portrait:       'https://i.imgur.com/ICC595Q.png',
        fullbody:       'https://i.imgur.com/8eh15xJ.png',
        halfbody:       null,
        frameHeightPct: 100,
    },
    luca: {
        portrait:       'https://i.imgur.com/jHh4bCj.jpeg',
        fullbody:       'https://i.imgur.com/fg9ltKB.png',
        halfbody:       null,
        frameHeightPct: 91,
    },
    callum: {
        portrait:       'https://i.imgur.com/Akvy0Tw.jpeg',
        fullbody:       'https://i.imgur.com/5r49Y1Y.png',
        halfbody:       null,
        frameHeightPct: 90,
    },
    lilith: {
        portrait:       'https://i.imgur.com/6P3sPAv.png',
        fullbody:       'https://i.imgur.com/cfCtLK3.png',
        halfbody:       null,
        frameHeightPct: 75,
    },
};

export interface NpcImages {
    portrait:       string | null;
    fullbody:       string | null;
    frameHeightPct: number;
    objectPosition?: string;
}

export const NPC_IMAGES: Record<string, NpcImages> = {
    umbri: {
        portrait:       'https://i.imgur.com/qrnDvtB.png',
        fullbody:       'https://i.imgur.com/sP8eCWY.png',
        frameHeightPct: 70,
    },
};

// Display colors for the presence strip -- neon palette, readable on dark navy
const CHARACTER_DISPLAY_COLORS: Record<CharacterId, string> = {
    adrian:    '#6655CC',   // deep periwinkle-violet
    sebastian: '#F5A623',   // amber — warm outlier
    kethros:   '#00D4D4',   // electric cyan
    luca:      '#3399FF',   // cobalt blue
    callum:    '#4488EE',   // clear blue
    lilith:    '#DD44FF',   // electric violet-magenta
};


// Display colors for NPC bubbles — muted relative to LI neons, still readable on dark navy
const NPC_DISPLAY_COLORS: Record<string, string> = {
    umbri: '#9988CC', // muted periwinkle — forgettable, precise, watching
};

const NPC_DISPLAY_FONTS: Record<string, string> = {
    umbri: "'Libre Baskerville', 'Georgia', serif",
};
// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

let msgCounter = 0;
function nextId(): string {
    return `msg-${++msgCounter}-${Date.now()}`;
}

function makeMessage(type: MessageType, text: string, characterId?: CharacterId, speaker?: string): ChatMessage {
    return { id: nextId(), type, text, characterId, speaker };
}

/** Renders a text string preserving newlines as <br /> elements. */
function TextWithBreaks({ text }: { text: string }) {
    const lines = text.split('\n');
    return (
        <>
            {lines.map((line, i) => (
                <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
            ))}
        </>
    );
}

function locationLabel(save: SaveType): string {
    if (save.activeScene) return 'The Penthouse';
    return 'The Penthouse';
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------


/**
 * One chip in the In Scene strip.
 * All characters always shown (Kethros filtered upstream until met).
 * isPresent=true → full color; isPresent=false → dimmed + greyscale, still clickable.
 */
function InSceneChip({
    portrait,
    name,
    color,
    isActive,
    isPresent,
    onClick,
    compact = false,
}: {
    portrait: string | null;
    name: string;
    color: string;
    isActive: boolean;
    /** Whether this character is physically in the current room. */
    isPresent: boolean;
    onClick: () => void;
    /** Tablet mode: render portrait only, no name label. */
    compact?: boolean;
}) {
    return (
        <div
            onClick={onClick}
            title={isPresent ? name : `${name} — elsewhere`}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: 'pointer',
            }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: isActive
                    ? `2px solid ${color}`
                    : isPresent
                    ? `1.5px solid ${color}88`
                    : `1.5px solid #252550`,
                background: '#070B1E',
                boxShadow: isActive ? `0 0 6px 2px ${color}55` : undefined,
                opacity: isPresent ? 1 : 0.55,
                transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.2s',
            }}>
                {portrait ? (
                    <img
                        src={portrait}
                        alt={name}
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover', objectPosition: 'top center',
                            filter: isPresent ? 'none' : 'grayscale(0.8)',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: isPresent ? color : '#3A3A70',
                        fontFamily: "'Georgia', serif",
                    }}>
                        {name.slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
            {!compact && (
                <div style={{
                    fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase',
                    color: isPresent ? color : `${color}88`,
                    fontFamily: "'Georgia', serif",
                }}>
                    {name.split(' ')[0]}
                </div>
            )}
        </div>
    );
}

/**
 * One row in the Affinities panel.
 * Shows: name (left) | label · score · delta (right) | bar (full width below).
 */
function AffinityRow({
    name,
    color,
    label,
    score,
    lastDelta,
    isPresent,
    isRevealed,
}: {
    name: string;
    color: string;
    label: string;
    score: number | null;
    lastDelta?: number;
    isPresent: boolean;
    isRevealed: boolean;
}) {
    const barFill = score !== null ? Math.max(0, Math.min(100, score)) : 0;
    const deltaText = lastDelta !== undefined && lastDelta !== 0
        ? (lastDelta > 0 ? `+${lastDelta}` : `${lastDelta}`)
        : null;
    const borderLeft = isPresent ? `2px solid ${color}` : '2px solid transparent';

    return (
        <div style={{ padding: '3px 10px', borderLeft, transition: 'border-left-color 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: '0.08em', color: isRevealed ? color : '#3A3A70', fontFamily: "'Georgia', serif" }}>
                    {isRevealed ? name : '???'}
                </span>
                <span style={{ display: 'flex', gap: 4, alignItems: 'baseline' }}>
                    {isRevealed && score !== null && (
                        <>
                            <span style={{ fontSize: 9, fontStyle: 'italic', color: '#4A4A88', fontFamily: "'Georgia', serif" }}>
                                {label}
                            </span>
                            <span style={{ fontSize: 10, color, fontFamily: "'Georgia', serif" }}>
                                {score}
                            </span>
                            {deltaText && (
                                <span style={{ fontSize: 9, color: (lastDelta ?? 0) > 0 ? '#00DD88' : '#FF3355', fontFamily: "'Georgia', serif" }}>
                                    {deltaText}
                                </span>
                            )}
                        </>
                    )}
                </span>
            </div>
            {score !== null && (
                <div style={{ height: 2, background: '#141830', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${barFill}%`,
                        background: isRevealed ? color : '#252550',
                        borderRadius: 1, transition: 'width 0.4s ease',
                    }} />
                </div>
            )}
        </div>
    );
}

function MessageBubble({ msg, save }: { msg: ChatMessage; save: SaveType }) {
    const charProfile = msg.characterId ? CHARACTERS[msg.characterId] : null;
    const charColor = msg.characterId ? CHARACTER_DISPLAY_COLORS[msg.characterId] : COLORS.textMuted;

    if (msg.type === 'narr') {
        // Resolve speaker → display color. Named characters use their theme color;
        // Umbri uses her NPC color; anything else (or Narrator / absent) uses the
        // default muted narrator tone.
        const speakerRaw = msg.speaker ?? 'Narrator';
        const speakerKey = speakerRaw.toLowerCase() as CharacterId | 'umbri' | 'narrator';
        const speakerColor: string =
            speakerKey in CHARACTER_DISPLAY_COLORS
                ? CHARACTER_DISPLAY_COLORS[speakerKey as CharacterId]
                : speakerKey === 'umbri'
                    ? (NPC_DISPLAY_COLORS['umbri'] ?? COLORS.textMuted)
                    : '#3A3A70'; // Narrator / fallback — dim, unobtrusive

        const speakerLabel = speakerRaw.toUpperCase();

        return (
            <div style={{ alignSelf: 'flex-start', maxWidth: '100%' }}>
                <div style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    paddingLeft: 14,
                    color: speakerColor,
                    fontFamily: "'Georgia', serif",
                }}>
                    {speakerLabel}
                </div>
                <div style={{
                    background: 'rgba(7,9,25,0.72)',
                    borderLeft: `2px solid ${speakerColor}`,
                    padding: '5px 12px',
                    fontSize: 12,
                    lineHeight: 1.72,
                    color: COLORS.textSecondary,
                    fontStyle: 'italic',
                    fontFamily: "'Georgia', serif",
                }}>
                    <TextWithBreaks text={msg.text} />
                </div>
            </div>
        );
    }

    if (msg.type === 'debug') {
        return (
            <div style={{ alignSelf: 'flex-start', maxWidth: '100%', width: '100%' }}>
                <div style={{
                    borderLeft: '2px solid #501090',
                    padding: '6px 12px',
                    background: 'rgba(80,20,120,0.15)',
                }}>
                    <div style={{
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: COLORS.accent,
                        marginBottom: 4,
                        fontFamily: "'Georgia', serif",
                    }}>
                        Stage Directions Injected
                    </div>
                    <pre style={{
                        fontSize: 11,
                        lineHeight: 1.6,
                        color: COLORS.textMuted,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                    }}>
                        {msg.text}
                    </pre>
                </div>
            </div>
        );
    }

    if (msg.type === 'user') {
        const playerName = save.player.name || 'You';
        return (
            <div style={{ alignSelf: 'flex-end', maxWidth: '90%' }}>
                <div style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    paddingRight: 2,
                    color: COLORS.textMuted,
                    textAlign: 'right',
                    fontFamily: "'Georgia', serif",
                }}>
                    {playerName}
                </div>
                <div style={{
                    background: 'rgba(10,12,34,0.88)',
                    border: '1px solid #1E2455',
                    borderRadius: '4px 0 0 4px',
                    padding: '9px 13px',
                    fontSize: 13,
                    lineHeight: 1.72,
                    color: COLORS.textSecondary,
                    textAlign: 'right',
                    fontFamily: "'Georgia', serif",
                }}>
                    <TextWithBreaks text={msg.text} />
                </div>
            </div>
        );
    }

    if (msg.type === 'npc') {
        const npcColor = msg.npcId ? (NPC_DISPLAY_COLORS[msg.npcId] ?? COLORS.textMuted) : COLORS.textMuted;
        const npcFont  = msg.npcId ? (NPC_DISPLAY_FONTS[msg.npcId]  ?? "'Georgia', serif") : "'Georgia', serif";
        // Pull display name from NPCS data if available, fall back to npcId
        const npcName  = msg.npcId ? (NPCS[msg.npcId as import('../types').NpcId]?.name ?? msg.npcId) : 'Unknown';
        return (
            <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
                <div style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    paddingLeft: 2,
                    color: npcColor,
                    fontFamily: "'Georgia', serif",
                }}>
                    {npcName}
                </div>
                <div style={{
                    background: 'rgba(11,13,34,0.88)',
                    border: '1px solid #1E2455',
                    borderLeft: `2px solid ${npcColor}`,
                    borderRadius: '0 4px 4px 0',
                    padding: '9px 13px',
                    fontSize: 13,
                    lineHeight: 1.72,
                    color: COLORS.textSecondary,
                    fontFamily: npcFont,
                }}>
                    {msg.text.split('\n').map((line, i) => (
                        <span key={i}>{line}{i < msg.text.split('\n').length - 1 && <br />}</span>
                    ))}
                </div>
            </div>
        );
    }

    // type === 'char'
    return (
        <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
            <div style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 4,
                paddingLeft: 2,
                color: charColor,
                fontFamily: "'Georgia', serif",
            }}>
                {charProfile?.name ?? 'Unknown'}
            </div>
            <div style={{
                background: 'rgba(13,15,42,0.88)',
                border: '1px solid #1E2455',
                borderLeft: `2px solid ${charColor}`,
                borderRadius: '0 4px 4px 0',
                padding: '9px 13px',
                fontSize: 13,
                lineHeight: 1.72,
                color: COLORS.textPrimary,
                fontStyle: 'italic',
                fontFamily: charProfile?.themeFont ?? "'Georgia', serif",
            }}>
                <TextWithBreaks text={msg.text} />
            </div>
        </div>
    );
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------

export function ChatView({
    save,
    onSendMessage,
    initialMessages = [],
    mapEnabled = false,
    onNavigate,
    onGenerateArrival,
    onSaveUpdate,
    onNewGame,
}: ChatViewProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    // Tracks the last message the player sent -- used by the retry button.
    const [lastUserText, setLastUserText] = useState<string | null>(null);
    // Which character is featured in the sprite panel.
    // Prefer the first character actually present in the current room; fall back to adrian.
    const [featuredChar, setFeaturedChar] = useState<CharacterId>(
        save.presence.lastRoomCharacters[0] ?? 'adrian'
    );
    // NPC override for sprite panel (e.g. 'umbri' in user-room). Cleared when player clicks a LI chip.
    // user-room always shows Umbri regardless of which LI characters are present.
    // Also feature the opening NPC if initial messages include NPC dialogue (e.g. Umbri's arrival intro).
    const openingNpcId = initialMessages.find(m => m.type === 'npc')?.npcId ?? null;
    const [featuredNpc, setFeaturedNpc] = useState<string | null>(
        save.presence.currentLocationId === 'user-room' ? 'umbri' : openingNpcId
    );
    // True when the current room has no characters — sprite panel is blank.
    const [roomIsEmpty, setRoomIsEmpty] = useState<boolean>(false);
    // Characters currently present in the same room as {{user}} (for portrait highlight).
    const [presentInRoom, setPresentInRoom] = useState<CharacterId[]>(
        save.presence.lastRoomCharacters,
    );
    // Which character spoke most recently (reserved for future animation use)
    const [speakingChar] = useState<CharacterId | null>(null);
    // Whether to show the stage-directions debug block inline in the log
    const [showDebug, setShowDebug] = useState(false);
    // New game confirmation gate
    const [confirmNewGame, setConfirmNewGame] = useState(false);
    // Map overlay state
    const [mapOpen, setMapOpen] = useState(false);
    const [mapPresence, setMapPresence] = useState<MapPresence | null>(null);
    // Tracks the message count when presence was last rolled.
    // If >= 10 new messages have passed, the cache is stale and we re-roll.
    const mapRolledAtCount = useRef<number>(0);

    const { width: vpWidth } = useWindowSize();
    /** True when the viewport is narrower than a desktop (< 1024px). */
    const isTablet = vpWidth > 0 && vpWidth < BP.TABLET;

    const logRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const ta = e.target;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }, []);

    const runPrompt = useCallback(async (text: string) => {
        if (!onSendMessage) return;
        try {
            // Build conversation history from prior turns (debug/narr excluded).
            // Note: the user message was just set via setMessages but React hasn't
            // re-rendered yet, so `messages` here is the pre-send snapshot.
            // We append the current user turn manually.
            const history = messages
                .filter(m => m.type === 'user' || m.type === 'char')
                .map(m => ({
                    role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
                    content: m.text,
                }));
            history.push({ role: 'user', content: text });

            const result = await onSendMessage(text, history, featuredChar);

            // Real response — char bubble if a specific LI is speaking, narr otherwise.
            // For narr: carry the speakerName so the bubble label knows who to show.
            if (result?.response) {
                const type = result.respondingCharacterId ? 'char' : 'narr';
                setMessages(prev => [
                    ...prev,
                    makeMessage(type, result.response!, result.respondingCharacterId, result.speakerName),
                ]);
            }

            // If Stage performed save mutations (met flags, score deltas) in local dev
            // mode, propagate the updated save to GameRoot so the roster re-renders.
            if (result?.updatedSave) {
                onSaveUpdate?.(result.updatedSave);
            }


            // Auto-switch the featured character (sprite + in-scene chip) to match
            // whoever [SPEAKER:Name] identified this turn.  Only fires for named LIs
            // (not 'Narrator', 'Umbri', or unknown strings).  If the speaker isn't
            // already in presentInRoom we add them so their chip lights up too.
            if (result?.speakerName && result.speakerName !== 'Narrator') {
                const speakerId = result.speakerName.toLowerCase() as CharacterId;
                if (ALL_CHARACTER_IDS.includes(speakerId)) {
                    setFeaturedNpc(null);
                    setRoomIsEmpty(false);
                    setFeaturedChar(speakerId);
                    setPresentInRoom(prev =>
                        prev.includes(speakerId) ? prev : [...prev, speakerId]
                    );
                } else if (result.speakerName === 'Umbri') {
                    // NPC override: show Umbri's sprite when she's speaking
                    setFeaturedNpc('umbri');
                }
            }

            // Stage directions — always stored (so they export), shown only when debug is on.
            if (result?.stageDirections) {
                setMessages(prev => [...prev, makeMessage('debug', result.stageDirections!)]);
            }

            // Nothing at all — probably missing save state.
            if (!result?.response && !result?.stageDirections) {
                setMessages(prev => [...prev, makeMessage('debug', '(no save state -- complete setup first)')]);
            }
        } catch (err) {
            setMessages(prev => [...prev, makeMessage('debug', `Error: ${String(err)}`)]);
        }
    }, [onSendMessage, messages, featuredChar]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isSending) return;

        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setIsSending(true);
        setLastUserText(text);
        setMessages(prev => [...prev, makeMessage('user', text)]);
        await runPrompt(text);
        setIsSending(false);
    }, [input, isSending, runPrompt]);

    // Retry: strip the last user message + debug block, re-run the same prompt.
    const handleRetry = useCallback(async () => {
        if (!lastUserText || isSending) return;
        setIsSending(true);

        setMessages(prev => {
            let cut = [...prev];
            while (cut.length && cut[cut.length - 1].type === 'debug') cut = cut.slice(0, -1);
            if (cut.length && cut[cut.length - 1].type === 'user') cut = cut.slice(0, -1);
            return cut;
        });

        setMessages(prev => [...prev, makeMessage('user', lastUserText)]);
        await runPrompt(lastUserText);
        setIsSending(false);
    }, [lastUserText, isSending, runPrompt]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleExportLog = useCallback(() => {
        const payload = { exportedAt: new Date().toISOString(), save, messages };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-log-${new Date().toISOString().slice(0, 16).replace('T', '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [save, messages]);

    // ── Map handlers ─────────────────────────────────────────────────────────

    const handleOpenMap = useCallback(() => {
        if (!mapEnabled) return;
        const messagesSinceRoll = messages.length - mapRolledAtCount.current;
        const cacheStale = mapPresence === null || messagesSinceRoll >= 10;
        if (cacheStale) {
            const presence = buildMapPresence(save);
            setMapPresence(presence);
            mapRolledAtCount.current = messages.length;
        }
        setMapOpen(true);
    }, [mapEnabled, save, messages.length, mapPresence]);

    const handleMapNavigate = useCallback(async (locationId: LocationId) => {
        if (!mapPresence) return;

        // Use pre-rolled presence; add travelingWithUser if set
        const rawPresent = mapPresence[locationId] ?? [];
        const trav = save.presence.travelingWithUser;
        const presentChars = [...rawPresent];
        if (trav && !presentChars.includes(trav)) {
            presentChars.unshift(trav);
        }

        // Compute war room flags from location definition
        const location = LOCATIONS[locationId];
        const isWarRoom = locationId === 'war-room' || locationId === 'below-war-room';
        const triggerConsequence = isWarRoom && location?.isOffLimits && !save.flags['flag_war_room_escort_active'];

        // Build updated presence (travelingWithUser consumed)
        const updatedPresence: PresenceState = {
            currentLocationId: locationId,
            lastRoomCharacters: presentChars,
            travelingWithUser: null,
        };
        const updatedSave: SaveType = { ...save, presence: updatedPresence };

        // Close map and clear cache immediately (don't wait for narration)
        setMapOpen(false);
        setMapPresence(null);
        mapRolledAtCount.current = 0;
        // Set NPC sprite override for rooms with permanent NPCs (e.g. Umbri in user-room)
        setFeaturedNpc(locationId === 'user-room' ? 'umbri' : null);
        // Hide sprite panel if no characters are present in this room
        setRoomIsEmpty(locationId !== 'user-room' && presentChars.length === 0);
        // Update presence strip highlight to reflect who's in this room
        setPresentInRoom(presentChars);
        // Auto-feature the first present character so their sprite shows immediately
        if (presentChars.length > 0) {
            setFeaturedChar(presentChars[0]);
        }
        onNavigate?.(updatedSave);

        // Arrival narration — async, fires after map closes
        if (onGenerateArrival) {
            const locationName = location?.name ?? locationId;
            const timeLabels: Record<TurnOfDay, string> = { 0: 'Morning', 1: 'Afternoon', 2: 'Evening' };
            const timeOfDay = timeLabels[save.turn];

            // Inject off-limits consequence note into description if needed
            let locationDescription = location?.description ?? '';
            if (triggerConsequence) {
                locationDescription += ' {{user}} does not have clearance to be here.';
            }

            // Placeholder while generating
            const pendingId = nextId();
            setMessages(prev => [...prev, {
                id: pendingId, type: 'narr' as const,
                text: '…',
            }]);

            try {
                const narration = await onGenerateArrival({
                    locationId,
                    locationName,
                    locationDescription,
                    presentCharacters: presentChars,
                    timeOfDay,
                    playerName: save.player.name || 'the visitor',
                });
                setMessages(prev => prev.map(m =>
                    m.id === pendingId
                        ? { ...m, text: narration ?? `— ${locationName}` }
                        : m
                ));
            } catch {
                setMessages(prev => prev.map(m =>
                    m.id === pendingId ? { ...m, text: `— ${location?.name ?? locationId}` } : m
                ));
            }
        } else {
            // No API key — plain fallback divider
            const locationName = location?.name ?? locationId;
            const names = presentChars.map(id => CHARACTERS[id]?.name ?? id).join(', ');
            const divider = names
                ? `— ${locationName} · ${names}`
                : `— ${locationName}`;
            setMessages(prev => [...prev, makeMessage('narr', divider)]);
        }
    }, [mapPresence, save, onNavigate, onGenerateArrival]);

    // Sprite panel: NPC override takes priority (e.g. Umbri in user-room)
    const npcImages = featuredNpc ? NPC_IMAGES[featuredNpc] ?? null : null;
    const featuredImages = npcImages ?? CHARACTER_IMAGES[featuredChar];
    // Clear sprite when room has no characters
    const spriteUrl = roomIsEmpty ? null : (featuredImages?.fullbody ?? (featuredImages as CharacterImages | null)?.halfbody ?? null);
    const frameHeightPct = featuredImages?.frameHeightPct ?? 100;
    const spriteAlt = npcImages
        ? (featuredNpc ?? 'npc')
        : (CHARACTERS[featuredChar]?.name ?? '');

    const spriteStyle: React.CSSProperties = {
        // Height is the sole controlling axis; width follows aspect ratio via 'auto'
        // so the image never warps. Any horizontal overhang is clipped by the
        // parent's overflow:hidden — better than capping maxWidth, which would
        // break the aspect ratio lock and squish the image.
        height: `${frameHeightPct}%`,
        width: 'auto',
        transition: 'opacity 0.3s, height 0.3s',
        opacity: spriteUrl ? 1 : 0,
        alignSelf: 'flex-end',
        display: 'block',
    };

    const turnLabel = TURN_LABELS[save.turn];
    const locLabel  = locationLabel(save);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100vw',
            height: '100vh',
            background: COLORS.bgPrimary,
            fontFamily: "'Georgia', serif",
            color: COLORS.textPrimary,
            overflow: 'hidden',
        }}>
            <style>{`
                #chat-log::-webkit-scrollbar { width: 3px; }
                #chat-log::-webkit-scrollbar-thumb { background: #1E2455; border-radius: 2px; }
            `}</style>

            {/* TOP BAR — location label + day/time only; controls live in right panel */}
            <div style={{
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 18px',
                background: 'rgba(10,12,36,0.97)',
                borderBottom: '1px solid #1E2455',
                zIndex: 10,
            }}>
                <span style={{ fontSize: 11, letterSpacing: '0.12em', color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                    {locLabel}
                </span>
                <span style={{ fontSize: 11, letterSpacing: '0.08em', color: COLORS.accent }}>
                    Day {save.day} · {turnLabel}
                </span>
            </div>

            {/* MAIN CONTENT — three columns; background spans left + center only */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                {/* Location background — img tag so object-fit: cover survives chub's CSS overrides.
                    Right edge tracks the right panel: fixed 200px on tablet, 25% on desktop. */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: isTablet ? 200 : '25%', overflow: 'hidden', zIndex: 0 }}>
                    <img
                        src={LOCATIONS[save.presence.currentLocationId ?? 'formal-receiving']?.mapImageUrl ?? 'https://i.imgur.com/XU227fD.jpeg'}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                    />
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: isTablet ? 200 : '25%', background: 'rgba(8,10,26,0.22)', zIndex: 1 }} />

                {/* LEFT: in-scene chips (top) + sprite (below) — transparent, shows background.
                    At tablet: collapses to an 80px vertical chip strip; sprite moves to overlay. */}
                <div style={{
                    flex: isTablet ? '0 0 80px' : '0 0 25%',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    position: 'relative', zIndex: 2,
                    borderRight: '1px solid #1E2455',
                }}>
                    {/* In Scene chips — pinned to top.
                        Desktop: horizontal row spread across column.
                        Tablet: vertical scrollable stack of compact portrait-only chips. */}
                    <div style={{
                        flexShrink: 0,
                        padding: isTablet ? '8px 6px' : '8px 10px',
                        background: 'rgba(10,12,36,0.97)',
                        borderBottom: '1px solid #1E2455',
                        overflowY: isTablet ? 'auto' : 'visible',
                    }}>
                        {!isTablet && (
                            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5555AA', fontFamily: "'Georgia', serif", marginBottom: 6 }}>In scene</div>
                        )}
                        <div style={{
                            display: 'flex',
                            flexDirection: isTablet ? 'column' : 'row',
                            justifyContent: isTablet ? 'flex-start' : 'space-between',
                            alignItems: isTablet ? 'center' : 'flex-start',
                            gap: isTablet ? 8 : 0,
                        }}>
                            {/* LI chips — all always visible; Kethros hidden until met. */}
                            {ALL_CHARACTER_IDS
                                .filter(id => id !== 'kethros' || !!save.flags['flag_kethros_met'])
                                .map(id => {
                                    const images = CHARACTER_IMAGES[id];
                                    const profile = CHARACTERS[id];
                                    const color = CHARACTER_DISPLAY_COLORS[id];
                                    const isPresent = presentInRoom.includes(id);
                                    const isActive = id === featuredChar && !featuredNpc;
                                    return (
                                        <InSceneChip
                                            key={id}
                                            portrait={images?.portrait ?? null}
                                            name={profile.name}
                                            color={color}
                                            isActive={isActive}
                                            isPresent={isPresent}
                                            compact={isTablet}
                                            onClick={() => { setFeaturedChar(id); setFeaturedNpc(null); setRoomIsEmpty(false); }}
                                        />
                                    );
                                })}
                            {/* Umbri chip — divider above on tablet, divider left on desktop. */}
                            <div style={
                                isTablet
                                    ? { borderTop: '1px solid #1E2455', paddingTop: 8, width: '100%', display: 'flex', justifyContent: 'center' }
                                    : { borderLeft: '1px solid #1E2455', paddingLeft: 10 }
                            }>
                                <InSceneChip
                                    portrait={NPC_IMAGES['umbri']?.portrait ?? null}
                                    name="Umbri"
                                    color={NPC_DISPLAY_COLORS['umbri'] ?? '#9988CC'}
                                    isActive={featuredNpc === 'umbri'}
                                    isPresent={true}
                                    compact={isTablet}
                                    onClick={() => { setFeaturedNpc('umbri'); setRoomIsEmpty(false); }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sprite — desktop only; tablet sprite renders as a background overlay (see below). */}
                    {!isTablet && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                            {spriteUrl && <img key={spriteUrl} src={spriteUrl} alt={spriteAlt} style={spriteStyle} />}
                        </div>
                    )}
                </div>

                {/* CENTER: floating chat over shared background.
                    At tablet: takes all remaining space; sprite renders as a right-anchored
                    faded overlay so the character remains visually present. */}
                <div style={{ flex: isTablet ? 1 : '0 0 50%', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative', zIndex: 2 }}>
                    {/* Tablet sprite overlay — bottom-right corner of the chat column, behind text */}
                    {isTablet && spriteUrl && (
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            top: 0,
                            zIndex: 0,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-end',
                            pointerEvents: 'none',
                            overflow: 'hidden',
                        }}>
                            <img
                                key={spriteUrl}
                                src={spriteUrl}
                                alt={spriteAlt}
                                style={{
                                    height: `${frameHeightPct}%`,
                                    width: 'auto',
                                    opacity: 0.18,
                                    display: 'block',
                                    alignSelf: 'flex-end',
                                }}
                            />
                        </div>
                    )}
                    <div id="chat-log" ref={logRef} style={{ position: 'relative', flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin', scrollbarColor: '#1E2455 transparent', zIndex: 1 }}>
                        {messages.length === 0 && (
                            <div style={{ alignSelf: 'center', marginTop: 40, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5555AA', fontFamily: "'Georgia', serif" }}>
                                -- The penthouse waits --
                            </div>
                        )}
                        {messages.filter(m => showDebug || m.type !== 'debug').map(msg => (
                            <MessageBubble key={msg.id} msg={msg} save={save} />
                        ))}
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, flexShrink: 0, padding: '10px 14px', borderTop: '1px solid #1E2455', background: 'rgba(7,9,25,0.94)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Say something..."
                                rows={1}
                                disabled={isSending}
                                style={{ flex: 1, background: '#070B1E', border: '1px solid #1E2455', color: COLORS.textPrimary, fontSize: 13, padding: '9px 12px', fontFamily: "'Georgia', serif", resize: 'none', outline: 'none', lineHeight: 1.5, borderRadius: 2, minHeight: 38, maxHeight: 120, overflowY: 'auto', opacity: isSending ? 0.5 : 1 }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isSending || !input.trim()}
                                style={{ flexShrink: 0, background: isSending || !input.trim() ? 'transparent' : '#1E2455', border: '1px solid #1E2455', color: isSending || !input.trim() ? '#252550' : COLORS.textPrimary, fontSize: 11, padding: '9px 18px', cursor: isSending || !input.trim() ? 'default' : 'pointer', letterSpacing: '0.1em', fontFamily: "'Georgia', serif", transition: 'background 0.2s, color 0.2s', alignSelf: 'stretch' }}
                            >
                                {isSending ? '...' : 'Send'}
                            </button>
                        </div>
                        {lastUserText && !isSending && (
                            <button onClick={handleRetry} style={{ alignSelf: 'flex-end', background: 'transparent', border: 'none', color: '#3A3A70', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: "'Georgia', serif", padding: '2px 0' }}>
                                ↺ retry
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT: affinities + events + navigation — fully opaque, no background bleed.
                    At tablet: fixed 200px (percentage would be too narrow at ~768px). */}
                <div style={{ flex: isTablet ? '0 0 200px' : '0 0 25%', display: 'flex', flexDirection: 'column', background: 'rgba(7,9,25,0.97)', borderLeft: '1px solid #1E2455', position: 'relative', zIndex: 2 }}>
                    {/* Affinities */}
                    <div style={{ flexShrink: 0, borderBottom: '1px solid #141830' }}>
                        <div style={{ padding: '8px 10px 4px', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5555AA', fontFamily: "'Georgia', serif" }}>Affinities</div>
                        {ALL_CHARACTER_IDS
                            .filter(id => id !== 'kethros' || !!save.flags['flag_kethros_met'])
                            .map(id => {
                                const profile = CHARACTERS[id];
                                const color = CHARACTER_DISPLAY_COLORS[id];
                                const rel = save.relationships[id];
                                const label = getRelationshipLabel(id, rel.score);
                                return (
                                    <AffinityRow
                                        key={id}
                                        name={profile.name}
                                        color={color}
                                        label={label}
                                        score={rel.score}
                                        lastDelta={rel.lastDelta}
                                        isPresent={presentInRoom.includes(id)}
                                        isRevealed={true}
                                    />
                                );
                            })}
                    </div>

                    {/* Events feed — characters with a non-zero lastDelta this session */}
                    <div style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', minHeight: 0 }}>
                        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5555AA', fontFamily: "'Georgia', serif", marginBottom: 6 }}>Events</div>
                        {ALL_CHARACTER_IDS
                            .filter(id => {
                                if (id === 'kethros' && !save.flags['flag_kethros_met']) return false;
                                const rel = save.relationships[id];
                                return rel.lastDelta !== undefined && rel.lastDelta !== 0;
                            })
                            .map(id => {
                                const profile = CHARACTERS[id];
                                const color = CHARACTER_DISPLAY_COLORS[id];
                                const rel = save.relationships[id];
                                const delta = rel.lastDelta!;
                                const label = rel.met ? getRelationshipLabel(id, rel.score) : '';
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, color: delta > 0 ? '#00DD88' : '#FF3355' }}>{delta > 0 ? '↑' : '↓'}</span>
                                        <span style={{ fontSize: 10, color, fontFamily: "'Georgia', serif" }}>
                                            {profile.name}
                                        </span>
                                        <span style={{ fontSize: 9, color: delta > 0 ? '#00DD88' : '#FF3355', fontFamily: "'Georgia', serif" }}>
                                            {delta > 0 ? `+${delta}` : delta}
                                        </span>
                                        {rel.met && (
                                            <span style={{ fontSize: 9, fontStyle: 'italic', color: '#303068', fontFamily: "'Georgia', serif" }}>{label}</span>
                                        )}
                                    </div>
                                );
                            })}
                        {ALL_CHARACTER_IDS.every(id => !save.relationships[id].lastDelta) && (
                            <div style={{ fontSize: 9, color: '#252550', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>—</div>
                        )}
                    </div>

                    {/* Navigation — Map primary; 2-col grid for secondary; New Game with confirm */}
                    <div style={{ flexShrink: 0, padding: '12px 12px 14px', borderTop: '1px solid #1E2455', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5555AA', fontFamily: "'Georgia', serif", marginBottom: 2 }}>Navigation</div>

                        {/* Map — primary accent button */}
                        <button
                            onClick={handleOpenMap}
                            disabled={!mapEnabled}
                            style={{ width: '100%', background: 'transparent', border: `1px solid ${mapEnabled ? COLORS.accent : '#252550'}`, color: mapEnabled ? COLORS.accent : '#252550', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 10px', cursor: mapEnabled ? 'pointer' : 'default', fontFamily: "'Georgia', serif", transition: 'background 0.2s, color 0.2s', borderRadius: 2 }}
                        >
                            Map
                        </button>

                        {/* 2-column grid: secondary actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                            {/* Export Log */}
                            <button
                                onClick={handleExportLog}
                                style={{ background: 'transparent', border: '1px solid #1E2455', color: COLORS.textMuted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 8px', cursor: 'pointer', fontFamily: "'Georgia', serif", borderRadius: 2, transition: 'border-color 0.15s, color 0.15s' }}
                            >
                                Export
                            </button>
                            {/* Debug toggle */}
                            <button
                                onClick={() => setShowDebug(d => !d)}
                                style={{ background: showDebug ? 'rgba(80,20,120,0.3)' : 'transparent', border: `1px solid ${showDebug ? COLORS.accent : '#1E2455'}`, color: showDebug ? COLORS.accent : COLORS.textMuted, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 8px', cursor: 'pointer', fontFamily: "'Georgia', serif", borderRadius: 2, transition: 'all 0.15s' }}
                            >
                                Debug
                            </button>
                        </div>

                        {/* New Game — danger; requires confirmation */}
                        {!confirmNewGame ? (
                            <button
                                onClick={() => setConfirmNewGame(true)}
                                style={{ width: '100%', background: 'transparent', border: '1px solid #660022', color: '#FF3355', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 10px', cursor: 'pointer', fontFamily: "'Georgia', serif", borderRadius: 2, transition: 'background 0.15s' }}
                            >
                                New Game
                            </button>
                        ) : (
                            <div style={{ border: '1px solid #660022', borderRadius: 2, padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#FF3355', fontFamily: "'Georgia', serif", fontStyle: 'italic', textAlign: 'center', marginBottom: 8, letterSpacing: '0.04em' }}>
                                    All progress will be lost.
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    <button
                                        onClick={() => { setConfirmNewGame(false); onNewGame?.(); }}
                                        style={{ background: 'rgba(102,0,34,0.4)', border: '1px solid #FF3355', color: '#FF3355', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 0', cursor: 'pointer', fontFamily: "'Georgia', serif", borderRadius