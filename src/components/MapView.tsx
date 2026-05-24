/**
 * MapView — Full-screen map overlay.
 *
 * Layout:
 *   World tabs:  THE PENTHOUSE  |  THE BELOW
 *   Floor tabs:  Upper Floor / Lower Floor  (penthouse)
 *                Citadel / Lower Gardens    (below)
 *   Room grid:   3-column CSS grid. Throne room spans full width.
 *
 * Presence:
 *   mapPresence is pre-rolled by ChatView when the map opens.
 *   Portrait thumbnails in each room reflect those rolls.
 *   travelingWithUser (if set) displays as a "traveling" indicator on
 *   every room card — they follow wherever the player goes.
 *
 * Navigation:
 *   Clicking a room calls onRoomSelect(locationId).
 *   Locked rooms (relationship threshold not met) are dimmed and non-clickable.
 *   Off-limits rooms are always clickable — the player can choose to disobey.
 */

import { useState } from 'react';
import { useWindowSize, BP } from '../hooks/useWindowSize';
import { SaveType, LocationId, CharacterId, ALL_CHARACTER_IDS } from '../types';
import { LOCATIONS } from '../data/locations';
import { CHARACTERS } from '../data/characters';
import { MapPresence } from '../data/locationRng';
import { COLORS } from '../data/theme';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** Character accent colors for map portrait chips — neon palette. */
const MAP_CHAR_COLORS: Record<CharacterId, string> = {
    adrian:    '#6655CC',   // periwinkle-violet
    sebastian: '#F5A623',   // amber
    callum:    '#4488EE',   // clear blue
    luca:      '#3399FF',   // cobalt blue
    lilith:    '#DD44FF',   // violet-magenta
    kethros:   '#00D4D4',   // electric cyan
};

/** Portrait image paths (same registry as ChatView). */
const MAP_PORTRAITS: Partial<Record<CharacterId, string>> = {
    adrian:    '/images/characters/adrian-portrait.png',
    sebastian: '/images/characters/sebastian-portrait.PNG',
    callum:    '/images/characters/Callum-portrait.PNG',
    kethros:   '/images/characters/kethros-portraitHumanoidVariant.PNG',
    lilith:    '/images/characters/lilith-portrait.PNG',
};


// ─────────────────────────────────────────────────────────────────────────────
// FLOOR GRID DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

type GridCell =
    | { kind: 'room'; id: LocationId; span?: number }
    | { kind: 'empty' };

const FLOOR_GRIDS: Record<string, GridCell[]> = {
    'penthouse-upper': [
        { kind: 'room', id: 'user-room' },
        { kind: 'room', id: 'adrian-quarters' },
        { kind: 'room', id: 'sebastian-quarters' },
        { kind: 'room', id: 'callum-quarters' },
        { kind: 'room', id: 'luca-quarters' },
        { kind: 'room', id: 'lilith-suite' },
    ],
    'penthouse-lower': [
        { kind: 'room', id: 'formal-receiving' },
        { kind: 'room', id: 'dining-room' },
        { kind: 'room', id: 'library' },
        { kind: 'room', id: 'war-room' },
        { kind: 'empty' },
        { kind: 'empty' },
    ],
    'below-citadel': [
        { kind: 'room', id: 'below-throne', span: 3 },
        { kind: 'room', id: 'below-citadel' },
        { kind: 'room', id: 'below-library' },
        { kind: 'room', id: 'below-dining' },
        { kind: 'room', id: 'below-adrian-chambers' },
        { kind: 'room', id: 'below-adrian-office' },
        { kind: 'room', id: 'below-sebastian-chambers' },
        { kind: 'room', id: 'below-callum-chambers' },
        { kind: 'room', id: 'below-luca-chambers' },
        { kind: 'room', id: 'below-lilith-office' },
        { kind: 'room', id: 'below-war-room' },
        { kind: 'empty' },
        { kind: 'empty' },
    ],
    'below-gardens': [
        { kind: 'room', id: 'below-gardens', span: 3 },
    ],
};

type WorldTab    = 'penthouse' | 'below';
type FloorKey    = 'penthouse-upper' | 'penthouse-lower' | 'below-citadel' | 'below-gardens';

const WORLD_FLOORS: Record<WorldTab, FloorKey[]> = {
    penthouse: ['penthouse-upper', 'penthouse-lower'],
    below:     ['below-citadel', 'below-gardens'],
};

const FLOOR_LABELS: Record<FloorKey, string> = {
    'penthouse-upper': 'Upper Floor',
    'penthouse-lower': 'Lower Floor',
    'below-citadel':   'Citadel',
    'below-gardens':   'Lower Gardens',
};


// ─────────────────────────────────────────────────────────────────────────────
// LOCK CHECK
// ─────────────────────────────────────────────────────────────────────────────

function isLocationLocked(id: LocationId, save: SaveType): boolean {
    const loc = LOCATIONS[id];
    if (!loc?.unlockCondition) return false;
    const cond = loc.unlockCondition;

    if (cond.flags) {
        for (const [flag, val] of Object.entries(cond.flags)) {
            if (save.flags[flag] !== val) return true;
        }
    }
    if (cond.minRelationship) {
        for (const [charId, minScore] of Object.entries(cond.minRelationship)) {
            const rel = save.relationships[charId as CharacterId];
            if (!rel || rel.score < (minScore as number)) return true;
        }
    }
    return false;
}


// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Small portrait chip shown inside a room card.
 * When isRevealed is false the chip shows a plain "?" — the player hasn't
 * met this character yet and shouldn't know who is in the room.
 * Single-return pattern — all conditional logic resolved before JSX.
 */
function PresenceChip({ charId, isRevealed }: { charId: CharacterId; isRevealed: boolean }) {
    const char        = CHARACTERS[charId];
    // When unrevealed: hide portrait/initials and use muted border
    const color       = isRevealed ? MAP_CHAR_COLORS[charId] : '#1A1A45';
    const src         = isRevealed ? (MAP_PORTRAITS[charId] ?? null) : null;
    const init        = isRevealed
        ? (char?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?')
        : '?';
    const titleAttr   = isRevealed ? (char?.name ?? charId) : 'Unknown';
    const initColor   = isRevealed ? MAP_CHAR_COLORS[charId] : '#303068';

    return (
        <div
            title={titleAttr}
            style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `1.5px solid ${color}`,
                overflow: 'hidden',
                background: '#070B1E',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {src ? (
                <img
                    src={src}
                    alt={char?.name ?? charId}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
            ) : (
                <span style={{ fontSize: 10, color: initColor, letterSpacing: '0.04em', fontFamily: "'Georgia', serif" }}>
                    {init}
                </span>
            )}
        </div>
    );
}

/**
 * Returns true when the character should be visible in map UI.
 * Kethros is hidden entirely until flag_kethros_met is set.
 * All other LIs are always visible — no met-gate.
 */
function isCharacterRevealed(charId: CharacterId, save: SaveType): boolean {
    if (charId === 'kethros') {
        return !!(save.flags['flag_kethros_met']);
    }
    return true;
}

/** One row in the Residents sidebar panel. */
function SidebarCharRow({
    charId,
    save,
    mapPresence,
    curLocId,
}: {
    charId: CharacterId;
    save: SaveType;
    mapPresence: MapPresence;
    curLocId: LocationId | null | undefined;
}) {
    const char     = CHARACTERS[charId];
    const color    = MAP_CHAR_COLORS[charId];
    const portrait = MAP_PORTRAITS[charId] ?? null;
    const inits    = char.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const revealed = isCharacterRevealed(charId, save);

    let foundRoom: string | null = null;
    for (const [locId, chars] of Object.entries(mapPresence)) {
        if ((chars as CharacterId[]).includes(charId)) {
            foundRoom = LOCATIONS[locId as LocationId]?.name ?? locId;
            break;
        }
    }

    const inCurrentRoom: boolean = curLocId
        ? (mapPresence[curLocId] ?? []).includes(charId)
        : false;

    // Pre-computed style values — keeps JSX clean of nested ternaries.
    const avatarBorder  = revealed && inCurrentRoom ? color : '#1A1A45';
    const nameColor     = revealed
        ? (inCurrentRoom ? COLORS.textSecondary : COLORS.textMuted)
        : '#1A1A45';
    const nameText      = revealed ? char.name : 'Unknown';
    const nameStyle     = revealed ? 'normal' : 'italic';
    const locColor      = revealed && foundRoom ? '#3A3A70' : '#1A1A45';
    const locText       = revealed ? (foundRoom ?? 'elsewhere') : '—';
    const dotBg         = inCurrentRoom ? color : '#1A1A45';
    const initColor     = inCurrentRoom ? color : '#303068';
    const imgOpacity    = inCurrentRoom ? 1 : 0.5;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 14px',
                borderBottom: '1px solid #070B1E',
            }}
        >
            <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: `1.5px solid ${avatarBorder}`,
                overflow: 'hidden',
                background: '#070B1E',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
            }}>
                {revealed && portrait && (
                    <img
                        src={portrait}
                        alt={char.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', opacity: imgOpacity }}
                    />
                )}
                {revealed && !portrait && (
                    <span style={{ fontSize: 9, color: initColor, fontFamily: "'Georgia', serif" }}>{inits}</span>
                )}
                {!revealed && (
                    <span style={{ fontSize: 12, color: '#1A1A45', fontFamily: "'Georgia', serif" }}>?</span>
                )}
                {revealed && (
                    <div style={{
                        position: 'absolute',
                        bottom: 1,
                        right: 1,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: dotBg,
                        border: '1px solid #0A0F28',
                    }} />
                )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                    fontSize: 10,
                    color: nameColor,
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Georgia', serif",
                    fontStyle: nameStyle,
                }}>
                    {nameText}
                </div>
                <div style={{
                    fontSize: 9,
                    color: locColor,
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                    fontStyle: 'italic',
                    fontFamily: "'Georgia', serif",
                }}>
                    {locText}
                </div>
            </div>
        </div>
    );
}

/** Single room tile in the map grid. */
function RoomCard({
    locationId,
    save,
    mapPresence,
    isCurrentRoom,
    isTraveling,
    onSelect,
}: {
    locationId: LocationId;
    save: SaveType;
    mapPresence: MapPresence;
    isCurrentRoom: boolean;
    isTraveling: boolean;
    onSelect: (id: LocationId) => void;
}) {
    const loc     = LOCATIONS[locationId];
    const locked  = isLocationLocked(locationId, save);
    const present = mapPresence[locationId] ?? [];
    const offLim  = loc?.isOffLimits ?? false;
    const below   = loc?.isBelow ?? false;

    // travelingWithUser is only shown in the current room (they're with {{user}} now).
    // On any other room card they don't appear — they'll follow when user navigates.
    // Kethros is filtered until flag_kethros_met — he shouldn't appear on the map at all.
    const travelingChar = save.presence.travelingWithUser;
    const displayChars: CharacterId[] = [...present].filter(
        id => id !== 'kethros' || !!save.flags['flag_kethros_met']
    );
    const showTraveling = isCurrentRoom && travelingChar && !displayChars.includes(travelingChar);
    if (showTraveling && travelingChar) {
        displayChars.push(travelingChar);
    }

    const borderColor = isCurrentRoom
        ? COLORS.accent
        : offLim
        ? '#660022'
        : '#1A1A45';

    const bgColor = isCurrentRoom
        ? 'rgba(238,0,238,0.12)'
        : below
        ? 'rgba(7,9,25,0.95)'
        : 'rgba(10,12,36,0.95)';

    const mapImageUrl = loc?.mapImageUrl ?? null;

    return (
        <div
            onClick={() => !locked && onSelect(locationId)}
            style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 3,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: locked ? 'default' : 'pointer',
                opacity: locked ? 0.35 : 1,
                transition: 'border-color 0.15s, background 0.15s, opacity 0.15s',
                minHeight: 120,
                position: 'relative',
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            {/* Background thumbnail — dimmed so text stays legible */}
            {mapImageUrl && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url('${mapImageUrl}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isCurrentRoom ? 0.85 : 0.52,
                    transition: 'opacity 0.15s',
                    zIndex: 0,
                }} />
            )}
            {/* Gradient overlay so bottom chips stay readable */}
            {mapImageUrl && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(10,12,36,0.4) 0%, rgba(10,12,36,0.78) 100%)',
                    zIndex: 1,
                }} />
            )}
            {/* Room name row */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'space-between' }}>
                <span style={{
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    color: isCurrentRoom ? COLORS.textPrimary : COLORS.textSecondary,
                    fontFamily: "'Georgia', serif",
                    lineHeight: 1.3,
                    flex: 1,
                }}>
                    {loc?.name ?? locationId}
                </span>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0, marginTop: 1 }}>
                    {offLim && (
                        <span style={{
                            fontSize: 8,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: '#FF3355',
                            border: '1px solid #660022',
                            padding: '1px 5px',
                            borderRadius: 2,
                            fontFamily: "'Georgia', serif",
                        }}>
                            off limits
                        </span>
                    )}
                    {isCurrentRoom && (
                        <span style={{
                            fontSize: 8,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: COLORS.accent,
                            border: `1px solid ${COLORS.accent}`,
                            padding: '1px 5px',
                            borderRadius: 2,
                            fontFamily: "'Georgia', serif",
                        }}>
                            here
                        </span>
                    )}
                    {locked && (
                        <span style={{ fontSize: 10, color: '#3A3A70' }} title="Locked">🔒</span>
                    )}
                </div>
            </div>

            {/* Presence chips */}
            {displayChars.length > 0 && (
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {displayChars.map(id => (
                        <PresenceChip key={id} charId={id} isRevealed={isCharacterRevealed(id, save)} />
                    ))}
                    {showTraveling && travelingChar && (
                        <span style={{
                            fontSize: 8,
                            color: MAP_CHAR_COLORS[travelingChar],
                            letterSpacing: '0.06em',
                            alignSelf: 'center',
                            fontStyle: 'italic',
                            fontFamily: "'Georgia', serif",
                        }}>
                            traveling with you
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface MapViewProps {
    save: SaveType;
    mapPresence: MapPresence;
    onRoomSelect: (locationId: LocationId) => void;
    onClose: () => void;
}

export function MapView({ save, mapPresence, onRoomSelect, onClose }: MapViewProps) {
    const hasBelow = !!save.flags['flag_below_access'];

    // Determine starting world/floor based on current location
    function startingWorld(): WorldTab {
        const cur = save.presence.currentLocationId;
        if (!cur) return 'penthouse';
        return LOCATIONS[cur]?.isBelow ? 'below' : 'penthouse';
    }

    function startingFloor(world: WorldTab): FloorKey {
        const cur = save.presence.currentLocationId;
        if (!cur) return world === 'penthouse' ? 'penthouse-lower' : 'below-citadel';
        const loc = LOCATIONS[cur];
        if (!loc) return world === 'penthouse' ? 'penthouse-lower' : 'below-citadel';
        if (world === 'penthouse') {
            return loc.isBelow ? 'penthouse-lower'
                : (cur === 'user-room' || cur.endsWith('-quarters') || cur === 'lilith-suite')
                ? 'penthouse-upper' : 'penthouse-lower';
        } else {
            return cur === 'below-gardens' ? 'below-gardens' : 'below-citadel';
        }
    }

    const { width: vpWidth } = useWindowSize();
    /** True when the viewport is narrower than a desktop (< 1024px). */
    const isTablet = vpWidth > 0 && vpWidth < BP.TABLET;

    const initWorld = startingWorld();
    const [worldTab, setWorldTab] = useState<WorldTab>(initWorld);
    const [floorTab, setFloorTab] = useState<FloorKey>(startingFloor(initWorld));

    function switchWorld(world: WorldTab) {
        setWorldTab(world);
        setFloorTab(WORLD_FLOORS[world][0]);
    }

    const cells = FLOOR_GRIDS[floorTab] ?? [];
    const curLocId = save.presence.currentLocationId;

    // Sidebar: all LIs except Kethros until he's been met
    const sidebarChars = ALL_CHARACTER_IDS.filter(
        id => id !== 'kethros' || !!save.flags['flag_kethros_met']
    );

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                background: 'rgba(10,12,40,0.95)',
                backdropFilter: 'blur(6px)',
                fontFamily: "'Georgia', serif",
            }}
        >
            {/* ── MAP PANEL ── */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderRight: '1px solid #1A1A45',
            }}>
                {/* Header */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderBottom: '1px solid #1A1A45',
                    background: 'rgba(10,12,36,0.98)',
                }}>
                    {/* World tabs */}
                    <div style={{ display: 'flex', gap: 4 }}>
                        {(['penthouse', 'below'] as WorldTab[]).map(w => {
                            const disabled = w === 'below' && !hasBelow;
                            const active   = worldTab === w;
                            return (
                                <button
                                    key={w}
                                    onClick={() => !disabled && switchWorld(w)}
                                    disabled={disabled}
                                    style={{
                                        background:   active ? COLORS.accentSubtle : 'transparent',
                                        border:       `1px solid ${active ? COLORS.accent : '#1A1A45'}`,
                                        color:        disabled ? '#252550' : active ? COLORS.textPrimary : COLORS.textMuted,
                                        fontSize:     10,
                                        letterSpacing:'0.14em',
                                        textTransform:'uppercase',
                                        padding:      '5px 16px',
                                        cursor:       disabled ? 'default' : 'pointer',
                                        fontFamily:   "'Georgia', serif",
                                        transition:   'all 0.15s',
                                    }}
                                >
                                    {w === 'penthouse' ? 'The Penthouse' : 'The Below'}
                                </button>
                            );
                        })}
                    </div>

                    {/* Title */}
                    <span style={{
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: '#303068',
                    }}>
                        Day {save.day} · {['Morning','Afternoon','Evening'][save.turn]}
                    </span>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '1px solid #1A1A45',
                            color: COLORS.textMuted,
                            fontSize: 12,
                            padding: '4px 12px',
                            cursor: 'pointer',
                            letterSpacing: '0.08em',
                            fontFamily: "'Georgia', serif",
                            transition: 'border-color 0.15s, color 0.15s',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Floor tabs */}
                <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    gap: 0,
                    padding: '8px 18px 0',
                    borderBottom: '1px solid #1A1A45',
                    background: 'rgba(10,12,36,0.95)',
                }}>
                    {WORLD_FLOORS[worldTab].map(fk => {
                        const active = floorTab === fk;
                        return (
                            <button
                                key={fk}
                                onClick={() => setFloorTab(fk)}
                                style={{
                                    background:   'transparent',
                                    border:       'none',
                                    borderBottom: `2px solid ${active ? COLORS.accent : 'transparent'}`,
                                    color:        active ? COLORS.textSecondary : '#303068',
                                    fontSize:     9,
                                    letterSpacing:'0.14em',
                                    textTransform:'uppercase',
                                    padding:      '4px 14px 8px',
                                    cursor:       'pointer',
                                    fontFamily:   "'Georgia', serif",
                                    transition:   'color 0.15s, border-bottom-color 0.15s',
                                }}
                            >
                                {FLOOR_LABELS[fk]}
                            </button>
                        );
                    })}
                </div>

                {/* Room grid — 3 columns on desktop, 2 on tablet.
                    Span values are capped to the column count so throne/gardens
                    still stretch full-width on both layouts. */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 18px',
                    display: 'grid',
                    gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: 12,
                    alignContent: 'start',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#1A1A45 transparent',
                }}>
                    {cells.map((cell, i) => {
                        if (cell.kind === 'empty') {
                            return <div key={`empty-${i}`} />;
                        }
                        const colCount = isTablet ? 2 : 3;
                        const span = cell.span ? Math.min(cell.span, colCount) : undefined;
                        return (
                            <div
                                key={cell.id}
                                style={span ? { gridColumn: `span ${span}` } : {}}
                            >
                                <RoomCard
                                    locationId={cell.id}
                                    save={save}
                                    mapPresence={mapPresence}
                                    isCurrentRoom={curLocId === cell.id}
                                    isTraveling={false}
                                    onSelect={onRoomSelect}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ―― SIDEBAR: RESIDENTS ―― */}
            <div style={{
                width: isTablet ? 160 : 200,
                flexShrink: 0,
                display: 'flex',
flexDirection: 'column',
                background: 'rgba(10,12,36,0.98)',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#1A1A45 transparent',
            }}>
                <div style={{
                    padding: '14px 14px 8px',
                    borderBottom: '1px solid #1A1A45',
                    fontSize: 9,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: '#303068',
                }}>
                    Residents
                </div>

                {sidebarChars.map(charId => (
                    <SidebarCharRow
                        key={charId}
                        charId={charId}
                        save={save}
                        mapPresence={mapPresence}
                        curLocId={curLocId}
                    />
                ))}
            </div>
        </div>
    );
}
