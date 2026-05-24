import { ReactElement } from 'react';
import { StageBase, StageResponse, InitialData, Message, DEFAULT_MESSAGE } from '@chub-ai/stages-ts';
import { LoadResponse } from '@chub-ai/stages-ts/dist/types/load';
import {
    InitStateType, ChatStateType, MessageStateType, ConfigType, SaveType,
    CharacterId, ALL_CHARACTER_IDS, clampScore,
} from './types';
import { CHARACTERS } from './data/characters';
import { LOCATIONS } from './data/locations';
import { SENTIMENT_RUBRICS, SENTIMENT_FORMAT_INSTRUCTION, SPEAKER_FORMAT_INSTRUCTION, STANDING_RULES } from './data/sentimentRubrics';
import { buildPresenceContext, parseTravelWithTag } from './data/locationRng';
import { buildInterLiAwarenessContext } from './data/jealousySystem';
import { buildRealFormContext, getRealFormFlagKey } from './data/realFormScenes';
import { buildHalflitContext } from './data/halflitVariations';
import { GameRoot } from './components/GameRoot';
import { SendMessageResult, ArrivalContext } from './components/ChatView';
import PRESET from './data/localApiPreset.json';

// ───────────────────────────────────────────────────────────────────────────────
// Dev flag — flip to false before shipping to strip debug tags from output
// ───────────────────────────────────────────────────────────────────────────────

/**
 * While true, [SENTIMENT:{...}] and other debug tags remain visible in chat
 * so you can verify the LLM is emitting them correctly.
 * Set to false to strip all debug tags before the player sees the response.
 *
 * ⚠️ REMOVE BEFORE PROD — must be false in any public-facing build.
 *    Search: DEV_MODE and flip to false.
 */
const DEV_MODE = true;

/**
 * Removes all [SENTIMENT:{...}] tags from a response string.
 * Called in afterResponse when DEV_MODE is false.
 */
function stripSentimentTags(text: string): string {
    // Matches both single-object and array variants, including multiline JSON.
    return text.replace(/\[SENTIMENT:(?:\{[\s\S]*?\}|\[[\s\S]*?\])\]/g, '').trim();
}

/**
 * Extracts the speaker name from a [SPEAKER:Name] tag in the response.
 * Returns the name exactly as the LLM wrote it, or null if no tag found.
 */
function parseSpeakerTag(text: string): string | null {
    const match = text.match(/\[SPEAKER:([A-Za-z]+)\]/i);
    return match ? match[1] : null;
}

/**
 * Removes all [SPEAKER:...] tags from a response string.
 * Called in afterResponse when DEV_MODE is false.
 */
function stripSpeakerTag(text: string): string {
    return text.replace(/\[SPEAKER:[A-Za-z]+\]/gi, '').trim();
}

/**
 * Parses a [TIME_OF_DAY:X] tag from the LLM response.
 * Returns 0 (Morning), 1 (Afternoon), 2 (Evening), or null if no tag found.
 * The LLM emits this when narrative prose signals a time change.
 */
function parseTimeOfDayTag(text: string): 0 | 1 | 2 | null {
    const match = text.match(/\[TIME_OF_DAY:(Morning|Afternoon|Evening)\]/i);
    if (!match) return null;
    const label = match[1].toLowerCase();
    if (label === 'morning')   return 0;
    if (label === 'afternoon') return 1;
    if (label === 'evening')   return 2;
    return null;
}

/**
 * Removes [TIME_OF_DAY:...] tags from a response string.
 * Always stripped before the player sees the output.
 */
function stripTimeOfDayTag(text: string): string {
    return text.replace(/\[TIME_OF_DAY:[A-Za-z]+\]/gi, '').trim();
}

// ───────────────────────────────────────────────────────────────────────────────
// Dev-only helpers for local simulation
// ───────────────────────────────────────────────────────────────────────────────

function resolvePlaceholders(text: string, playerName: string): string {
    return text
        .replace(/\{\{char\}\}/g, 'the narrator')
        .replace(/\{\{user\}\}/g, playerName || 'the visitor');
}

function buildLocalSystemPrompt(save: SaveType, stageDirections: string | null): string {
    const playerName = save.player.name || 'the visitor';

    const layer1 = resolvePlaceholders(PRESET.main_prompt, playerName);

    const charRef = Object.values(CHARACTERS)
        .map(c => [
            `${c.name} (${c.title})`,
            `  Appearance: ${c.appearance}`,
            `  Personality: ${c.personality}`,
            `  Voice: ${c.voiceStyle}`,
        ].join('\n'))
        .join('\n\n');

    const layer2 = [
        ``,
        `<Game Context>`,
        `You are narrating "Hell is a Penthouse in Toronto" - a cosmic horror otome visual novel.`,
        ``,
        `SETTING`,
        `A luxury penthouse on the 43rd floor of a Toronto skyscraper. The inhabitants are ancient,`,
        `infernal, or otherwise not-quite-human. ${playerName} has just arrived. Nothing here is`,
        `ordinary. The atmosphere is gothic, sensual, and faintly wrong.`,
        ``,
        `YOUR ROLE`,
        `You narrate the scene and voice all characters. Give each character their full voice and`,
        `personality. Do not summarise. Do not break the fourth wall.`,
        ``,
        `CHARACTER REFERENCE`,
        charRef,
        `</Game Context>`,
    ].join('\n');

    const layer3 = PRESET.assistant_prefill
        ? `\n\n${resolvePlaceholders(PRESET.assistant_prefill, playerName)}`
        : '';

    const layer4 = stageDirections
        ? `\n\n---\n${resolvePlaceholders(stageDirections, playerName)}\n---`
        : '';

    const layer5 = PRESET.jailbreak_prompt
        ? `\n\n${resolvePlaceholders(PRESET.jailbreak_prompt, playerName)}`
        : '';

    return [layer1, layer2, layer3, layer4, layer5].join('');
}

async function callAnthropicLocal(
    apiKey: string,
    systemPrompt: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: history,
        // temperature and top_p cannot both be set — temperature takes priority
        temperature: PRESET.temperature,
    };
    if (PRESET.top_k > 0) {
        body.top_k = PRESET.top_k;
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Anthropic API ${resp.status}: ${errText}`);
    }
    const data = await resp.json() as { content: Array<{ text: string }> };
    return data.content[0].text;
}


// ───────────────────────────────────────────────────────────────────────────────
// Arrival narration — scene-setting prose generated on room navigation
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Characters that are always present in specific rooms regardless of RNG.
 * Umbri is always in {{user}}'s room. Damon is handled separately via damonPresent.
 */
const ROOM_PERMANENT_NPCS: Partial<Record<string, string[]>> = {
    'user-room': ['Umbri'],
};

function buildArrivalPrompt(context: ArrivalContext): string {
    const { locationName, locationDescription, presentCharacters, timeOfDay, playerName, locationId } = context;

    // Build character presence lines
    const charLines: string[] = [];

    // Love interests present
    for (const charId of presentCharacters) {
        const char = CHARACTERS[charId];
        if (!char) continue;
        charLines.push(`${char.name} (${char.title}) — ${char.personality.split('.')[0].trim()}.`);
    }

    // Permanent NPCs for this room (e.g. Umbri in user-room)
    const permanentNpcs = ROOM_PERMANENT_NPCS[locationId] ?? [];
    for (const npcName of permanentNpcs) {
        if (npcName === 'Umbri') {
            charLines.push(`Umbri (${playerName}'s attendant) — small, quiet, already aware of the arrival. Slightly wrong hands. Not unkind.`);
        }
    }

    // War room always has Damon
    const isWarRoom = locationId === 'war-room' || locationId === 'below-war-room';
    if (isWarRoom) {
        charLines.push(`Damon (Luca's enforcer) — military bearing, not pleased, already watching the door.`);
    }

    const charSection = charLines.length > 0
        ? `\nPresent:\n${charLines.map(l => `  - ${l}`).join('\n')}`
        : `\nThe room is empty — no one else is here.`;

    const timeContext = timeOfDay === 'Morning'
        ? 'Early morning. People are waking, beginning their day.'
        : timeOfDay === 'Afternoon'
        ? 'Afternoon. The day is in full motion.'
        : 'Evening. Dinner hour or winding down toward night.';

    return [
        `${playerName} has just entered: ${locationName}`,
        `Time: ${timeOfDay}. ${timeContext}`,
        ``,
        `Room: ${locationDescription}`,
        charSection,
        ``,
        `Write one paragraph (2–4 sentences) of arrival narration.`,
        `Describe what ${playerName} steps into: the atmosphere, what the character(s) are doing right now`,
        `(be specific to the time of day — dining room in evening = mid-dinner, quarters at night = preparing`,
        `for bed, library at afternoon = deep in a book, etc.), and one detail that invites {{user}} to engage.`,
        `If the room is empty: describe something atmospheric to notice, feel, or explore.`,
        ``,
        `Third person, present tense. Do not start with "${playerName}" or "The". No dialogue. Under 80 words.`,
        `Tone: literary, gothic, faintly unsettling. Restrained. Not overwrought.`,
    ].join('\n');
}

async function generateArrivalNarration(
    apiKey: string,
    context: ArrivalContext,
): Promise<string | null> {
    const system = [
        `You are a prose narrator for a gothic cosmic horror visual novel set in a luxury Toronto penthouse.`,
        `The inhabitants are ancient, infernal, or otherwise not-quite-human.`,
        `Write immersive, literary scene-setting narrations. Third person, present tense.`,
        `Lean prose. Atmospheric. The game does not shy from tension, body horror, or sensuality.`,
    ].join(' ');

    const userPrompt = buildArrivalPrompt(context);

    try {
        return await callAnthropicLocal(
            apiKey,
            system,
            [{ role: 'user', content: userPrompt }],
        );
    } catch (e) {
        console.error('Arrival narration failed:', e);
        return null;
    }
}

// ───────────────────────────────────────────────────────────────────────────────

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    private save: SaveType | null = null;
    private userName: string = '';
    private userProfile: string = '';

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        super(data);

        const { users, userId, chatState } = data;

        const user = users[userId];
        if (user) {
            this.userName    = user.name        ?? '';
            this.userProfile = user.chatProfile ?? '';
        }

        if (chatState?.save) {
            this.save = chatState.save;
        }
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {
        return {
            success: true,
            error: null,
            initState: null,
            chatState: this.save ? { save: this.save } : null,
        };
    }

    async setState(state: MessageStateType): Promise<void> {
        // Called by Chub when the user branches (retries a message or switches branch).
        // Restores the full save snapshot from that message point — making scores,
        // flags, and time all revert correctly to where they were at that moment.
        if (state?.save) {
            this.save = state.save;
        }
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        if (!this.save) {
            return { stageDirections: null, messageState: null, chatState: null };
        }

        const { player, day, turn, relationships, activeScene } = this.save;
        const turnLabel = turn === 0 ? 'Morning' : turn === 1 ? 'Afternoon' : 'Evening';

        const descriptionLine = player.description ? ' Description: ' + player.description : '';

        const relationshipLines = Object.entries(relationships).map(
            ([id, rel]) => '  ' + id + ': score ' + rel.score + ' | joy ' + rel.joy + ' | trust ' + rel.trust
        );

        const stateBlock = [
            '[GAME STATE - Day ' + day + ', ' + turnLabel + ']',
            'Player: ' + player.name + '. Heritage: ' + player.heritage + '.' + descriptionLine,
            'Stats - STR ' + player.stats.strength + ' DEX ' + player.stats.dexterity +
                ' CON ' + player.stats.constitution + ' WIS ' + player.stats.wisdom +
                ' INT ' + player.stats.intelligence + ' CHA ' + player.stats.charisma +
                ' NRV ' + player.stats.nerve,
            '',
            'Relationship states:',
            ...relationshipLines,
        ].join('\n');

        let presentCharacters: CharacterId[];
        if (activeScene?.characterIds && activeScene.characterIds.length > 0) {
            presentCharacters = activeScene.characterIds.filter(
                (id): id is CharacterId => id !== 'kethros' && id in SENTIMENT_RUBRICS
            );
        } else {
            presentCharacters = ALL_CHARACTER_IDS.filter(
                id => id !== 'kethros' && id in SENTIMENT_RUBRICS
            );
        }

        const rubricLines: string[] = [];
        for (const id of presentCharacters) {
            const rubric = SENTIMENT_RUBRICS[id];
            if (rubric) rubricLines.push(rubric);
        }

        // Presence context -- who is in the current room
        const presenceContext = buildPresenceContext(this.save);

        // Opening scene narration — set when {{user}} first entered the current room.
        // Persists for the whole room visit so the LLM maintains scene continuity.
        const sceneOpening = this.save.flags['_scene_opening'] as string | undefined;
        const sceneOpeningBlock = sceneOpening
            ? [
                '[OPENING SCENE — how this room was when {{user}} arrived]',
                sceneOpening,
                '(Continue from this established scene. Do not re-describe the arrival.)',
              ].join('\n')
            : null;

        // ── First-arrival narration (Chub path) ────────────────────────────
        // Set when player clicks "Enter the Penthouse" in onboarding.
        // Fires exactly once — the LLM's first response opens with atmospheric
        // arrival narration for the formal receiving room before the scene continues.
        // On local dev the arrival is handled by generateArrivalNarration() instead.
        const firstArrivalPending = !!this.save.flags['_first_arrival_pending'];
        if (firstArrivalPending) {
            // Clear the flag now so it never fires again, even on branch restores.
            this.save = {
                ...this.save,
                flags: { ...this.save.flags, _first_arrival_pending: false },
            };
        }

        // ── Real form scene context ─────────────────────────────────────────
        // Injects "first time seeing character in their real form" description
        // for Below chamber locations before the seen flag is set.
        const realFormContext = buildRealFormContext(
            this.save.presence.currentLocationId,
            this.save.flags,
            this.save.player.heritage,
        );

        // Set the real-form-seen flag now so the injection won't repeat
        // after this turn (flag persists in chatState returned below).
        if (realFormContext) {
            const flagKey = getRealFormFlagKey(this.save.presence.currentLocationId);
            if (flagKey && !this.save.flags[flagKey]) {
                this.save = {
                    ...this.save,
                    flags: { ...this.save.flags, [flagKey]: true },
                };
            }
        }

        // ── Inter-LI awareness (jealousy system) ───────────────────────────
        // Fires when a rival character's score gap crosses a threshold.
        const jealousyContext = buildInterLiAwarenessContext(
            this.save,
            presentCharacters[0] ?? 'adrian',
            this.save.presence.lastRoomCharacters,
        );

        // ── Halflit heritage context ────────────────────────────────────────
        // Phase 1 blocks: The Tell (days 1–7), Anunsep recognition.
        const halflitContext = buildHalflitContext(
            this.save,
            presentCharacters[0] ?? 'adrian',
        );

        const stageDirections = [
            stateBlock,
            '',
            presenceContext,
            ...(firstArrivalPending ? [
                '',
                '[FIRST ARRIVAL — NARRATION REQUIRED]',
                `Open your response with one paragraph (3–5 sentences) of atmospheric arrival narration ` +
                `for the formal receiving room. ${player.name} has just stepped off the elevator onto ` +
                `the forty-third floor. Establish the space — the light, the air, the wrongness underneath ` +
                `the luxury. Umbri is already present. Third person, present tense. Literary, gothic, ` +
                `restrained. Under 100 words. Then continue into the scene naturally. ` +
                `Do not reference this instruction.`,
            ] : []),
            ...(sceneOpeningBlock ? ['', sceneOpeningBlock] : []),
            ...(realFormContext ? ['', realFormContext] : []),
            ...(jealousyContext ? ['', jealousyContext] : []),
            ...(halflitContext ? ['', halflitContext] : []),
            '',
            STANDING_RULES,
            '',
            ...rubricLines,
            '',
            SENTIMENT_FORMAT_INSTRUCTION,
            '',
            SPEAKER_FORMAT_INSTRUCTION,
            '',
            `TIME OF DAY: Track the time of day from the narrative. When your prose signals that time has ` +
            `meaningfully advanced — sunset, the dinner hour arriving, waking the next morning, the library ` +
            `going dark — append a tag at the very end of your response: [TIME_OF_DAY:Morning], ` +
            `[TIME_OF_DAY:Afternoon], or [TIME_OF_DAY:Evening]. Only emit this tag when the time has ` +
            `actually changed from the current turn (${turnLabel}). Do not emit it if the time is unchanged. ` +
            `Do not force a time change. If the scene is still in the same part of the day, omit the tag entirely.`,
        ].join('\n');

        return {
            stageDirections,
            // Snapshot the current save into messageState so Chub can restore it
            // if the user branches (retries a message). This makes scores, flags,
            // and time all revert correctly to the state at this point in the conversation.
            messageState: { save: this.save, activeScene: this.save.activeScene },
            chatState: this.save ? { save: this.save } : null,
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        if (!this.save) return { messageState: null, chatState: null };

        let saveUpdated = false;

        // [TRAVEL_WITH:characterId] tag
        // Emitted by the LLM when a character suggests leaving a room together.
        // We detect it here and set travelingWithUser on the presence state.
        // The UI should then present a confirmation beat to {{user}}.
        // On acceptance (handled in GameRoot/ChatView), navigateToRoom() consumes
        // and clears the flag when {{user}} actually moves rooms.
        const travelCandidate = parseTravelWithTag(botMessage.content);
        if (travelCandidate && this.save.presence.travelingWithUser !== travelCandidate) {
            this.save = {
                ...this.save,
                presence: {
                    ...this.save.presence,
                    travelingWithUser: travelCandidate,
                },
            };
            saveUpdated = true;
        }

        // Parse [SENTIMENT:{...}] tags and apply score deltas to relationships.
        // Both formats are handled:
        //   Single:   [SENTIMENT:{"character":"adrian","score":2}]
        //   Multiple: [SENTIMENT:[{"character":"adrian","score":1},{"character":"sebastian","score":-2}]]
        const sentimentMatch = botMessage.content.match(
            /\[SENTIMENT:(\{[\s\S]*?\}|\[[\s\S]*?\])\]/
        );
        if (sentimentMatch && this.save) {
            try {
                const raw = sentimentMatch[1];
                const parsed: unknown = JSON.parse(raw);
                const entries = Array.isArray(parsed) ? parsed : [parsed];

                const newRelationships = { ...this.save.relationships };
                let anyUpdated = false;

                for (const entry of entries) {
                    const { character, score } = entry as { character: CharacterId; score: number };
                    if (
                        character &&
                        typeof score === 'number' &&
                        newRelationships[character] !== undefined
                    ) {
                        const rel = newRelationships[character];
                        newRelationships[character] = {
                            ...rel,
                            score: clampScore(rel.score + score),
                            lastDelta: score,
                        };
                        anyUpdated = true;
                    }
                }

                if (anyUpdated) {
                    this.save = { ...this.save, relationships: newRelationships };
                    saveUpdated = true;
                }
            } catch (e) {
                console.warn('[Stage] Failed to parse SENTIMENT tag:', e, sentimentMatch[1]);
            }
        }

        // Mark characters as met — any LI present in the current room when the
        // bot responds has been encountered by {{user}}. Kethros still requires
        // the separate flag_kethros_met story gate on top of this.
        //
        // Two sources:
        //   1. lastRoomCharacters — the RNG-placed characters in this room.
        //   2. [SPEAKER:Name] tag — the LLM may write a character into the scene
        //      even when they weren't RNG'd there (e.g. opening-room hallucination).
        //      Whenever a named LI is tagged as primary speaker, mark them met.
        const metCandidates = new Set<CharacterId>(this.save.presence.lastRoomCharacters);

        const speakerTagName = parseSpeakerTag(botMessage.content);
        if (speakerTagName) {
            const speakerIdCandidate = speakerTagName.toLowerCase() as CharacterId;
            if (ALL_CHARACTER_IDS.includes(speakerIdCandidate)) {
                metCandidates.add(speakerIdCandidate);

                // If the LLM wrote this character into the scene but they weren't
                // in lastRoomCharacters, add them now so the next beforePrompt
                // lists them as Present. Without this, the next turn shows
                // "Present: no one" and the LLM loses track of who is in the room,
                // causing character drift (e.g. Sebastian → Adrian mid-conversation).
                if (
                    speakerIdCandidate !== 'kethros' &&
                    !this.save.presence.lastRoomCharacters.includes(speakerIdCandidate)
                ) {
                    this.save = {
                        ...this.save,
                        presence: {
                            ...this.save.presence,
                            lastRoomCharacters: [
                                ...this.save.presence.lastRoomCharacters,
                                speakerIdCandidate,
                            ],
                        },
                    };
                    saveUpdated = true;
                }
            }
        }

        if (metCandidates.size > 0) {
            const rels = { ...this.save.relationships };
            let anyNewlyMet = false;
            for (const id of metCandidates) {
                if (rels[id] && !rels[id].met) {
                    rels[id] = { ...rels[id], met: true };
                    anyNewlyMet = true;
                }
            }
            if (anyNewlyMet) {
                this.save = { ...this.save, relationships: rels };
                saveUpdated = true;
            }
        }

        // [TIME_OF_DAY:X] tag — LLM signals time has changed based on narrative prose.
        // Strip the tag from visible output, then update save.turn (and save.day if
        // the time went "backwards" — e.g. Evening → Morning means a new day).
        const newTurn = parseTimeOfDayTag(botMessage.content);
        if (newTurn !== null && this.save) {
            botMessage.content = stripTimeOfDayTag(botMessage.content);
            const oldTurn = this.save.turn;
            const dayAdvances = newTurn < oldTurn; // backwards step = new day
            this.save = {
                ...this.save,
                turn: newTurn,
                day: dayAdvances ? this.save.day + 1 : this.save.day,
            };
            saveUpdated = true;
        }

        // Strip debug tags from the displayed message if not in dev mode.
        if (!DEV_MODE) {
            botMessage.content = stripSentimentTags(botMessage.content);
            botMessage.content = stripSpeakerTag(botMessage.content);
        }

        return {
            // Always snapshot save into messageState for branch-awareness.
            messageState: this.save ? { save: this.save, activeScene: this.save.activeScene } : null,
            chatState: saveUpdated && this.save ? { save: this.save } : null,
        };
    }

    /**
     * Marks a character as met based on their speaker tag name (e.g. "Adrian" → 'adrian').
     * Mutates this.save in place and returns the new save if an update was made, else undefined.
     * Used in local dev mode where afterResponse never runs.
     */
    private markSpeakerMet(speakerName: string): SaveType | undefined {
        if (!this.save) return undefined;
        const speakerId = speakerName.toLowerCase() as CharacterId;
        if (!ALL_CHARACTER_IDS.includes(speakerId)) return undefined;
        const rel = this.save.relationships[speakerId];
        if (!rel || rel.met) return undefined;
        const updatedSave: SaveType = {
            ...this.save,
            relationships: {
                ...this.save.relationships,
                [speakerId]: { ...rel, met: true },
            },
        };
        this.save = updatedSave;
        return updatedSave;
    }

    render(): ReactElement {
        const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

        const onTestBeforePrompt = apiKey
            ? async (
                text: string,
                history: Array<{ role: 'user' | 'assistant'; content: string }>,
                _featuredCharId: CharacterId,
            ): Promise<SendMessageResult | null> => {
                if (!this.save) return null;

                const fakeMsg: Message = { ...DEFAULT_MESSAGE, content: text };
                const { stageDirections } = await this.beforePrompt(fakeMsg);
                const systemPrompt = buildLocalSystemPrompt(this.save, stageDirections ?? null);
                const response = await callAnthropicLocal(apiKey, systemPrompt, history);

                // Parse the SPEAKER tag so the UI knows who to attribute this turn to.
                // If the LLM omitted the tag entirely, infer from who's in the room
                // rather than falling back to the generic 'Narrator' label.
                // If the LLM explicitly said "Narrator", we respect that.
                const taggedSpeaker = parseSpeakerTag(response);
                const firstRoomChar = this.save.presence.lastRoomCharacters[0];
                const speakerName = taggedSpeaker
                    ?? (firstRoomChar ? CHARACTERS[firstRoomChar]?.name ?? 'Narrator' : 'Narrator');

                // In local dev mode afterResponse never runs, so we replicate its
                // save-mutation logic here. Two things afterResponse does that we
                // mirror:
                //   1. met-flag: if the speaker is a named LI, mark them met.
                //   2. SENTIMENT: parse score deltas and apply them to relationships.
                // Both mutations fold into a single updatedSave that ChatView passes
                // to onSaveUpdate so GameRoot re-renders the roster panel immediately.
                // NOTE: this whole callback is gated on apiKey being present, so it
                // only runs in local dev — on Chub, afterResponse handles both tasks
                // and this code is never reached.
                let updatedSave = speakerName !== 'Narrator'
                    ? this.markSpeakerMet(speakerName)
                    : undefined;

                // Mirror afterResponse: if the LLM introduced a character via
                // [SPEAKER:Name], add them to lastRoomCharacters so the next
                // beforePrompt lists them as "Present" and so ChatView can
                // update the featured-character sprite immediately.
                if (speakerName !== 'Narrator' && this.save) {
                    const speakerId = speakerName.toLowerCase() as CharacterId;
                    if (
                        ALL_CHARACTER_IDS.includes(speakerId) &&
                        speakerId !== 'kethros' &&
                        !this.save.presence.lastRoomCharacters.includes(speakerId)
                    ) {
                        const base = updatedSave ?? this.save;
                        updatedSave = {
                            ...base,
                            presence: {
                                ...base.presence,
                                lastRoomCharacters: [
                                    ...base.presence.lastRoomCharacters,
                                    speakerId,
                                ],
                            },
                        };
                        this.save = updatedSave;
                    }
                }

                // Replicate afterResponse SENTIMENT parsing for dev mode.
                const sentimentMatch = response.match(
                    /\[SENTIMENT:(\{[\s\S]*?\}|\[[\s\S]*?\])\]/
                );
                if (sentimentMatch && this.save) {
                    try {
                        const raw = sentimentMatch[1];
                        const parsed: unknown = JSON.parse(raw);
                        const entries = Array.isArray(parsed) ? parsed : [parsed];
                        const base = updatedSave ?? this.save;
                        const newRelationships = { ...base.relationships };
                        let anyUpdated = false;
                        for (const entry of entries) {
                            const { character, score } = entry as { character: CharacterId; score: number };
                            if (
                                character &&
                                typeof score === 'number' &&
                                newRelationships[character] !== undefined
                            ) {
                                const rel = newRelationships[character];
                                newRelationships[character] = {
                                    ...rel,
                                    score: clampScore(rel.score + score),
                                    lastDelta: score,
                                };
                                anyUpdated = true;
                            }
                        }
                        if (anyUpdated) {
                            updatedSave = { ...base, relationships: newRelationships };
                            this.save = updatedSave;
                        }
                    } catch (e) {
                        console.warn('[Stage][dev] Failed to parse SENTIMENT tag:', e, sentimentMatch[1]);
                    }
                }

                // [TIME_OF_DAY:X] detection for dev mode.
                // Parse time tag, apply turn/day update to save, strip from response.
                const devNewTurn = parseTimeOfDayTag(response);
                const cleanResponse = devNewTurn !== null ? stripTimeOfDayTag(response) : response;
                if (devNewTurn !== null && this.save) {
                    const base = updatedSave ?? this.save;
                    const oldTurn = base.turn;
                    const dayAdvances = devNewTurn < oldTurn;
                    updatedSave = {
                        ...base,
                        turn: devNewTurn,
                        day: dayAdvances ? base.day + 1 : base.day,
                    };
                    this.save = updatedSave;
                }

                return {
                    stageDirections: stageDirections ?? null,
                    response: cleanResponse,
                    respondingCharacterId: undefined,
                    speakerName,
                    updatedSave,
                };
            }
            : undefined;

        const onGenerateArrival = apiKey
            ? async (context: ArrivalContext): Promise<string | null> => {
                const narration = await generateArrivalNarration(apiKey, context);
                // Store in this.save so beforePrompt injects it for the whole room visit.
                // Gets overwritten on next navigation (onNavigate clears it first).
                if (narration && this.save) {
                    this.save = {
                        ...this.save,
                        flags: {
                            ...this.save.flags,
                            _scene_opening: narration,
                        },
                    };
                }
                return narration;
            }
            : undefined;

        return (
            <GameRoot
                userName={this.userName}
                userProfile={this.userProfile}
                initialSave={this.save}
                onSaveReady={(save: SaveType) => { this.save = save; }}
                onClearSave={() => { this.save = null; }}
                onTestBeforePrompt={onTestBeforePrompt}
                onGenerateArrival={onGenerateArrival}
            />
        );
    }
}
