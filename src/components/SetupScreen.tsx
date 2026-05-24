import React, { useState } from 'react';
import { PlayerHeritage } from '../types';
import { COLORS } from '../data/theme';

interface SetupScreenProps {
    userName: string;
    userProfile: string;
    onBegin: (heritage: PlayerHeritage) => void;
}

// backgroundImage trick: Chub's index.scss nukes background-color via !important
// so we use single-stop linear-gradient() everywhere we need a solid fill.
const bg   = (hex: string) => `linear-gradient(${hex}, ${hex})`;
const bgGr = (a: string, b: string, deg = '160deg') => `linear-gradient(${deg}, ${a} 0%, ${b} 100%)`;

export function SetupScreen({ userName, userProfile, onBegin }: SetupScreenProps) {
    const [heritage, setHeritage] = useState<PlayerHeritage>('human');

    const initials = userName
        ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Georgia, serif',
            overflowY: 'auto',
        }}>
            {/* Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(https://i.imgur.com/Hiw1E4A.jpeg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />

            {/* Overlay — matches slide 2 gradient */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(to right, rgba(6,10,28,0.42) 0%, rgba(6,10,28,0.12) 48%, rgba(6,10,28,0.18) 100%)',
            }} />

            {/* Wordmark */}
            <span style={{
                position: 'absolute',
                top: 16,
                left: 20,
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase' as const,
                color: COLORS.accent,
                zIndex: 20,
                opacity: 0.75,
            }}>
                Penthouse Otome
            </span>

            {/* Form panel — semi-transparent, same style as intro text panels */}
            <div style={{
                position: 'relative',
                zIndex: 5,
                width: '100%',
                maxWidth: 480,
                margin: '0 24px',
                backgroundImage: bg('rgba(10,13,35,0.82)'),
                border: '1px solid rgba(30,36,85,0.75)',
                borderRadius: 12,
                padding: '32px 28px',
                backdropFilter: 'none',
            }}>

                {/* Title */}
                <p style={{
                    textAlign: 'center',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: COLORS.accent,
                    margin: '0 0 6px',
                }}>
                    Penthouse Otome
                </p>
                <p style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    fontFamily: 'Georgia, serif',
                    margin: '0 0 28px',
                    fontStyle: 'italic',
                    letterSpacing: '0.05em',
                }}>
                    a new beginning
                </p>

                {/* Divider */}
                <div style={{
                    height: 1,
                    backgroundImage: bgGr(COLORS.borderDefault, COLORS.borderDefault),
                    margin: '0 0 28px',
                    opacity: 0.6,
                }} />

                {/* Persona section */}
                <p style={labelStyle}>Your persona</p>
                <div style={{
                    backgroundImage: bg('rgba(15,20,56,0.70)'),
                    border: `1px solid ${COLORS.borderDefault}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    marginBottom: 8,
                }}>
                    {/* Name row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        marginBottom: 12,
                    }}>
                        {/* Avatar initials */}
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            backgroundImage: bg(COLORS.accentSubtle),
                            border: `2px solid ${COLORS.accent}`,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 17,
                            color: COLORS.accent,
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 500,
                        }}>
                            {initials}
                        </div>
                        <p style={{
                            fontSize: 17,
                            color: COLORS.textPrimary,
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 500,
                            margin: 0,
                        }}>
                            {userName || 'Unknown'}
                        </p>
                    </div>

                    {/* Scrollable persona description */}
                    <div style={{
                        maxHeight: 112,
                        overflowY: 'auto',
                        paddingRight: 4,
                        // Custom scrollbar styling (webkit)
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${COLORS.accent} transparent`,
                    } as React.CSSProperties}>
                        <p style={{
                            fontSize: 13,
                            color: COLORS.textSecondary,
                            margin: 0,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                        }}>
                            {userProfile || 'No persona description set.'}
                        </p>
                    </div>
                </div>
                <p style={{
                    fontSize: 12,
                    color: COLORS.textMuted,
                    fontFamily: 'Arial, sans-serif',
                    margin: '0 0 28px',
                    fontStyle: 'italic',
                }}>
                    Uses your default Chub persona.
                </p>

                {/* Heritage section */}
                <p style={labelStyle}>Heritage</p>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginBottom: 10,
                }}>
                    {(['human', 'halflit'] as PlayerHeritage[]).map(h => {
                        const active = heritage === h;
                        return (
                            <button
                                key={h}
                                onClick={() => setHeritage(h)}
                                style={{
                                    backgroundImage: active
                                        ? bg('rgba(26,26,80,0.80)')
                                        : bg('rgba(11,13,42,0.60)'),
                                    border: `1px solid ${active ? COLORS.accent : COLORS.borderDefault}`,
                                    borderRadius: 8,
                                    padding: '14px 12px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 4,
                                }}>
                                    {/* Radio dot */}
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundImage: active ? bg(COLORS.accent) : bg('transparent'),
                                        border: `1.5px solid ${active ? COLORS.accent : COLORS.textSecondary}`,
                                        flexShrink: 0,
                                    }} />
                                    <span style={{
                                        fontFamily: 'Arial, sans-serif',
                                        fontSize: 15,
                                        fontWeight: 500,
                                        color: active ? COLORS.textPrimary : COLORS.textSecondary,
                                        letterSpacing: '0.02em',
                                    }}>
                                        {h === 'human' ? 'Human' : 'Halflit'}
                                    </span>
                                </div>
              