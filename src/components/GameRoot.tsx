import { useState } from 'react';
import { SaveType, PlayerHeritage, createNewSave, CharacterId } from '../types';
import { SplashScreen } from './SplashScreen';
import { SetupScreen } from './SetupScreen';
import { ChatView, SendMessageResult, ArrivalContext } from './ChatView';

// ── localStorage persistence ──────────────────────────────────────────────────
// Key used for browser-local save. On Chub, the real save lives in chatState
// (managed by the SDK); localStorage is the fallback for local dev reloads and
// will eventually also back the Import/Export feature.

const LS_KEY = 'gilded-ruin-save';

function readLocalSave(): SaveType | null {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as SaveType;
        // Minimal sanity check — if the object looks wrong, discard it.
        if (!parsed || typeof parsed !== 'object' || !parsed.player) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeLocalSave(save: SaveType): void {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(save));
    } catch {
        // Quota exceeded or private browsing — ignore silently.
    }
}

function clearLocalSave(): void {
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────

interface GameRootProps {
    userName: string;
    userProfile: string;
    initialSave: SaveType | null;
    onSaveReady: (save: SaveType) => void;
    /**
     * Test hook: called when the player sends a message in the chat UI.
     * In dev mode, simulates the full Chub cycle: beforePrompt → API call → afterResponse.
     * Returns stage directions (for debug overlay) and/or the character response.
     */
    onTestBeforePrompt?: (
        text: string,
        history: Array<{ role: 'user' | 'assistant'; content: string }>,
        featuredCharId: CharacterId,
    ) => Promise<SendMessageResult | null>;
    onGenerateArrival?: (context: ArrivalContext) => Promise<string | null>;
    /** Called when the Stage instance should clear its own save reference (e.g. on new game). */
    onClearSave?: () => void;
}

// View state machine:
//   splash -> setup -> game
//
// splash:  shown when no save exists
// setup:   persona review + heritage choice ("Enter the Penthouse" = intro complete)
// game:    map + chat immediately accessible
type View = 'splash' | 'setup' | 'game';

export function GameRoot({ userName, userProfile, initialSave, onSaveReady, onTestBeforePrompt, onGenerateArrival, onClearSave }: GameRootProps) {
    // Priority: Chub-provided initialSave > localStorage > null (new player).
    const resolvedSave = initialSave ?? readLocalSave();
    const [save, setSave] = useState<SaveType | null>(resolvedSave);

    // Returning player: skip splash + setup, go straight to game.
    const startView = (): View => {
        if (!resolvedSave) return 'splash';
        return 'game';
    };

    const [view, setView] = useState<View>(startView);

    function handleSplashProceed() {
        setView('setup');
    }

    function handleBegin(heritage: PlayerHeritage) {
        // NOTE: Chub SDK User type exposes no avatar URL — only name, anonymizedId,
        // isRemoved, chatProfile. The initials fallback in SetupScreen is the best
        // available until Chub adds an avatar field to the SDK.
        const newSave = createNewSave(userName, userProfile, '', heritage);

        // _first_arrival_pending triggers a one-shot arrival narration directive
        // in Stage.beforePrompt() on the player's very first message.
        // This is the Chub-path equivalent of generateArrivalNarration() (local only).
        const newSaveWithArrival: typeof newSave = {
            ...newSave,
            flags: { ...newSave.flags, _first_arrival_pending: true },
        };

        setSave(newSaveWithArrival);
        writeLocalSave(newSaveWithArrival);
        onSaveReady(newSaveWithArrival);
        setView('game');
    }

    if (view === 'splash') {
        return (
            <SplashScreen
                onProceed={handleSplashProceed}
            />
        );
    }

    if (view === 'setup' || !save) {
        return (
            <SetupScreen
                userName={userName}
                userProfile={userProfile}
                onBegin={handleBegin}
            />
        );
    }

    // Umbri's greeting — shown only on a brand-new save (no timeline entries yet).
    // For returning players the log starts empty; their history lives in the LLM context.
    const isNewSave = save.timeline.length === 0 && save.day === 1 && save.turn === 0;
    const umbriIntroMessages = isNewSave ? [
        {
            id: 'opening-narr-1',
            type: 'narr' as const,
            text: 'The elevator opens on the forty-third floor. You were not told what to expect. You were told to come.',
        },
        {
            id: 'opening-narr-2',
            type: 'narr' as const,
            text: 'A figure is already here. Small, forgettable coloring — muted, contained, hands folded at her waist. She doesn\'t startle at your arrival. She was expecting you.',
        },
        {
            id: 'opening-umbri-1',
            type: 'npc' as const,
            npcId: 'umbri',
            text: '"I am Umbri," she says. "I have been assigned to attend to you. For the duration of your stay here, I am yours to direct."\n\nA pause. Precise.\n\n"Your room is on this floor. The others occupy the level above — you will find them in the common areas as you move through the penthouse."',
        },
        {
            id: 'opening-umbri-2',
            type: 'npc' as const,
            npcId: 'umbri',
            text: '"The map" — she gestures briefly toward the top of the room — "will show you where you are able to go and who you are likely to find there. The portraits show you at a glance who is currently nearby; when someone is in the same room as you, their portrait will be marked."\n\nA brief pause.\n\n"There is one you have not encountered yet. You will know them when the time comes."\n\nHer eyes are steady. Soft, calibrated, revealing nothing.\n\n"I will be in your room if you need me. Do you have questions?"',
        },
    ] : [];

    // Game view: map + chat, free navigation.
    return (
        <ChatView
            save={save}
            onSendMessage={onTestBeforePrompt}
            mapEnabled={true}
            initialMessages={umbriIntroMessages}
            onNavigate={(updatedSave) => {
                setSave(updatedSave);
                writeLocalSave(updatedSave);
                onSaveReady(updatedSave);
            }}
            onSaveUpdate={(updatedSave) => {
                setSave(updatedSave);
                writeLocalSave(updatedSave);
                onSaveReady(updatedSave);
            }}
            onNewGame={() => {
                clearLocalSave();
                onClearSave?.();
                setSave(null);
                setView('splash');
            }}
            onGenerateArrival={onGenerateArrival}
        />
    );
}
