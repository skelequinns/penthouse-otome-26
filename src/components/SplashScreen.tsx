import { CSSProperties, useState } from 'react';
import { COLORS } from '../data/theme';
import { useWindowSize, BP } from '../hooks/useWindowSize';

interface SplashScreenProps {
    onProceed: () => void;
}

// --- Slide 1: Alley abduction ---

const SLIDE1_PARAGRAPHS: Array<{ text: string; isDialogue?: boolean }[]> = [
    [{ text: "You were leaving your building after work; four men materialized from a side street — paramilitary gear, no insignia, utterly deliberate — and pulled you into an alley before you could process what was happening. One of them placed a necklace over your head; cold metal, heavier than it looked. Then the world vanished." }],
    [{ text: "Wind whipped around you from nowhere as though you were being shot through a long tunnel through a darkness so complete it had weight. Earth doesn't have magic — you were raised sensibly, you live sensibly, magic does not exist on earth. And yet in the half-second before everything stopped, some animal part of you recognized exactly what was happening." }],
    [{ text: 'The floor was cold beneath your hands, and you were somewhere else.' }],
];

// --- Slide 2: Formal receiving room ---

const SLIDE2_PARAGRAPHS: Array<{ text: string; isDialogue?: boolean }[]> = [
    [{ text: "You see floor-to-ceiling windows, the glow of city lights far below and a skyline you don't recognize. You're in a formal receiving room, richly decorated, with full bookshelves and random artifacts that look like they belong in museums." }],
    [{ text: "Three men stand around you. One of them has golden hair and a smile that lands between comfort and malice. Another has dark skin and silver at his temples; he stands by the door. The third is closest to you, impossibly tall, and radiating an inhuman warmth." }],
    [
        { text: `“You're not in danger.”`, isDialogue: true },
        { text: " He doesn't say this like comfort. " },
        { text: `“Not anymore.”`, isDialogue: true },
    ],
    [
        { text: 'The one with golden hair crouches to your level, unhurried. ' },
        { text: `“You have something rare,”`, isDialogue: true },
        { text: ' he says. ' },
        { text: `“A pure soul. In this world, that draws the wrong kind of attention.”`, isDialogue: true },
    ],
    [{ text: "Behind them both, the one with silver at his temples stands facing the door, but his gaze turns to you for just a moment before it quickly turns back to the door." }],
    [
        { text: `“We've been watching you for some time,”`, isDialogue: true },
        { text: ' the tall one says. ' },
        { text: `“We've decided you'll be safer here, with us. As our guest.”`, isDialogue: true },
        { text: ' He extends his hand to you.' },
    ],
    [{ text: `“What's your name?”`, isDialogue: true }],
];

// --- Shared styles ---

const PANEL_STYLE: CSSProperties = {
    position: 'absolute',
    background: 'rgba(10, 13, 35, 0.80)',
    border: '1px solid rgba(30, 36, 85, 0.75)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
};

const WORDMARK_STYLE: CSSProperties = {
    position: 'absolute',
    top: 18,
    left: 22,
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    letterSpacing: '0.26em',
    textTransform: 'uppercase',
    color: COLORS.accent,
    zIndex: 20,
    opacity: 1,
    fontWeight: 600,
};

// --- Component ---

export function SplashScreen({ onProceed }: SplashScreenProps) {
    const [slide, setSlide] = useState<1 | 2>(1);
    const { width: vpWidth } = useWindowSize();
    const isTablet = vpWidth > 0 && vpWidth < BP.TABLET;

    const handleAdvance = () => {
        if (slide === 1) {
            setSlide(2);
        } else {
            onProceed();
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* --- Slide 1 --- */}
            {slide === 1 && (
                <>
                    {/* Background */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url(https://i.imgur.com/AWTmCaz.jpeg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* Overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(6,10,28,0.28) 0%, rgba(6,10,28,0.46) 70%, rgba(6,10,28,0.58) 100%)',
                    }} />

                    {/* Wordmark */}
                    <span style={WORDMARK_STYLE}>Penthouse Otome</span>

                    {/* Text panel — 50% wide centered on desktop; widens to 88% on tablet. */}
                    <div style={{
                        ...PANEL_STYLE,
                        width:  isTablet ? '88%' : '50%',
                        left:   isTablet ? '6%'  : '25%',
                        top: '9%',
                        bottom: '7%',
                        zIndex: 5,
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px 12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(30,36,85,0.5) transparent' }}>
                            {SLIDE1_PARAGRAPHS.map((spans, pi) => (
                                <p key={pi} style={{
                                    margin: pi === SLIDE1_PARAGRAPHS.length - 1 ? 0 : '0 0 18px',
                                    fontSize: 17,
                                    lineHeight: 1.88,
                                    color: COLORS.textPrimary,
                                    fontFamily: 'Georgia, serif',
                                }}>
                                    {spans.map((span, si) => (
                                        span.isDialogue
                                            ? <em key={si} style={{ fontStyle: 'italic', color: COLORS.accent }}>{span.text}</em>
                                            : <span key={si}>{span.text}</span>
                                    ))}
                                </p>
                            ))}
                        </div>
                        <PanelFooter onAdvance={handleAdvance} />
                    </div>
                </>
            )}

            {/* --- Slide 2 --- */}
            {slide === 2 && (
                <>
                    {/* Background */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'url(https://i.imgur.com/Hiw1E4A.jpeg)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* Overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to right, rgba(6,10,28,0.42) 0%, rgba(6,10,28,0.12) 48%, rgba(6,10,28,0.18) 100%)',
                    }} />

                    {/* Wordmark */}
                    <span style={WORDMARK_STYLE}>Penthouse Otome</span>

                    {/* Character group */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 36,
                        bottom: 0,
                        width: '48%',
                        zIndex: 6,
                        overflow: 'visible',
                    }}>
                        {/* Luca — left, behind (z 1) */}
                        <img
                            src="https://i.imgur.com/fg9ltKB.png"
                            alt="Luca"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: '91%',
                                width: 'auto',
                                zIndex: 1,
                            }}
                        />
                        {/* Adrian — center, front (z 3) */}
                        <img
                            src="https://i.imgur.com/IOu0wqH.png"
                            alt="Adrian"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '28.5%',
                                height: '100%',
                                width: 'auto',
                                zIndex: 3,
                            }}
                        />
                        {/* Sebastian — right, middle (z 2) */}
                        <img
                            src="https://i.imgur.com/MiZKkp0.png"
                            alt="Sebastian"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                height: '93%',
                                width: 'auto',
                                zIndex: 2,
                            }}
                        />
                    </div>

                    {/* Text panel — left edge at 46% to clear Sebastian, extends to right edge */}
                    <div style={{
                        ...PANEL_STYLE,
                        left: '46%',
                        right: '1%',
                        top: '6%',
                        bottom: '5%',
                        zIndex: 5,
                    }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(30,36,85,0.5) transparent' }}>
                            {SLIDE2_PARAGRAPHS.map((spans, pi) => (
                                <p key={pi} style={{
                                    margin: pi === SLIDE2_PARAGRAPHS.length - 1 ? 0 : '0 0 18px',
                                    fontSize: 17,
                                    lineHeight: 1.88,
                                    color: COLORS.textPrimary,
                                    fontFamily: 'Georgia, serif',
                                }}>
                                    {spans.map((span, si) => (
                                        span.isDialogue
                                            ? <em key={si} style={{ fontStyle: 'italic', color: COLORS.accent }}>{span.text}</em>
                                            : <span key={si}>{span.text}</span>
                                    ))}
                                </p>
                            ))}
                        </div>
                        <PanelFooter onAdvance={handleAdvance} />
                    </div>
                </>
            )}
        </div>
    );
}

// --- Shared footer with heart-arrow button ---

function PanelFooter({ onAdvance }: { onAdvance: () => void }) {
    return (
        <div style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(30,36,85,0.6)',
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
        }}>
            <button
                onClick={onAdvance}
                title="Continue"
                style={{
                    background: 'transparent',
                    border: `2px solid ${COLORS.accent}`,
                    borderRadius: 32,
                    padding: '12px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    color: COLORS.accent,
                    fontSize: 26,
                    lineHeight: 1,
                    transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = COLORS.accent;
                    (e.currentTarget as HTMLButtonElement).style.color = COLORS.bgPrimary;
                }}
                onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).styl