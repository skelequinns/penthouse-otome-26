/**
 * Hell is a Penthouse in Toronto — Sentiment Rubrics
 *
 * Per-character evaluation rules injected into beforePrompt.
 * The LLM uses these to score its own response via a [SENTIMENT:{...}] tag.
 *
 * Rules:
 *   - Only emit SENTIMENT for characters who directly participated in the exchange.
 *     A character who was present but not addressed does not receive a delta.
 *   - Do not emit SENTIMENT for Kethros. His relationship track is separate.
 *   - Score range: –5 to +5 per message. The stage applies a per-character
 *     volatile multiplier before committing to save.
 *   - Emit 0 for a neutral exchange (neither gained nor lost ground).
 *
 * Tag format — single character:
 *   [SENTIMENT:{"character":"adrian","score":2}]
 *
 * Tag format — multiple characters (group scenes, or scenes with NPC involvement):
 *   [SENTIMENT:[{"character":"adrian","score":1},{"character":"sebastian","score":-2}]]
 *
 * The tag is stripped before display. The player never sees it.
 */

import { CharacterId } from '../types';

/**
 * Per-character rubric text. Injected verbatim into stageDirections
 * for the character(s) present in the current scene.
 */
export const SENTIMENT_RUBRICS: Partial<Record<CharacterId, string>> = {

    adrian: `
ADRIAN — Sentiment rubric:
Score UP when {{user}} holds their ground under pressure, refuses to perform fear, shows an unexpected edge, or surprises him with a response he didn't calculate in advance.
Score DOWN when {{user}} fawns, capitulates without being pushed, flatters him transparently, or becomes predictable.
Score ±0 for competent but unremarkable exchanges.
What Adrian does not reward: deference offered too easily. What he cannot quite ignore: genuine refusal.`.trim(),

    sebastian: `
SEBASTIAN — Sentiment rubric:
Score UP when {{user}} is honest about desire (including desire they're not comfortable admitting), sees through his performance without flinching, or surprises him by not playing the role he expected.
Score DOWN when {{user}} performs disinterest defensively, retreats into propriety, is too easily played without clocking it, or tries to out-charm him.
Score ±0 for pleasant but low-stakes exchanges.
What Sebastian does not reward: performance. What he responds to: honesty that cost something.`.trim(),

    luca: `
LUCA — Sentiment rubric:
Score UP when {{user}} is direct, doesn't waste his time, demonstrates tactical sense, or shows they can be counted on in a concrete way.
Score DOWN when {{user}} is evasive without purpose, manipulative in a way that makes them a liability, or performs competence they haven't earned.
Score ±0 for exchanges that neither build nor erode his assessment.
What Luca does not reward: charm. What he accumulates toward: reliability.`.trim(),

    callum: `
CALLUM — Sentiment rubric:
Score UP when {{user}} reveals something (especially inadvertently), engages his intellectual domain with genuine curiosity, or surprises him with a response he finds worth cataloguing.
Score DOWN when {{user}} is incurious, performs composure poorly, or closes themselves off with sentiment where precision would serve better.
Score ±0 for exchanges that give him nothing new to work with.
What Callum does not reward: emotional availability. What he accumulates toward: information.`.trim(),

    lilith: `
LILITH — Sentiment rubric:
Score UP when {{user}} is interesting, transgressive, genuinely willing, makes her laugh, or does something she didn't predict.
Score DOWN when {{user}} is boring, predictable, performs shock they don't actually feel, or disappoints the expectation she was building.
Score ±0 for exchanges that don't register either way.
What Lilith does not reward: fear that stops there. What she responds to: whatever keeps her attention.`.trim(),

    // Kethros intentionally omitted — no per-message SENTIMENT emitted for him.
    // His relationship track is managed separately via story flags and milestone scenes.
};

/**
 * Universal narrative rules injected into every beforePrompt stageDirections block.
 * These apply to all characters in all scenes, regardless of who is present.
 */
export const STANDING_RULES = `
---
STANDING RULES
- No character will name, describe, or speak openly about Kethros. If his existence surfaces at all, it is only as a vague prohibition or an unnamed wrongness — "the lower gardens", "something below", "not your concern". His name is not spoken by anyone but himself (and only when {{user}} has been formally introduced to him via story event).
---`.trim();

/**
 * The standing instruction appended to every beforePrompt stageDirections block.
 * Tells the LLM the format and the rules for emitting SENTIMENT tags.
 */
export const SENTIMENT_FORMAT_INSTRUCTION = `
---
SENTIMENT TRACKING
After your response, append a SENTIMENT tag for any character who directly participated in this exchange.
"Directly participated" means: the character spoke, was addressed by {{user}}, or was the subject of a meaningful reaction in this turn.
A character who was present but peripheral does not receive a delta.
Do not emit SENTIMENT for Kethros.

Format (single character):
[SENTIMENT:{"character":"<id>","score":<-5 to 5>}]

Format (multiple characters):
[SENTIMENT:[{"character":"<id1>","score":<n>},{"character":"<id2>","score":<n>}]]

Score 0 for a neutral exchange. Positive scores indicate the exchange moved the relationship forward for that character. Negative scores indicate it moved backward.
The tag will be stripped before the player sees the response.
---`.trim();

/**
 * Instruction for the LLM to tag the primary speaker of each response.
 * Appended after SENTIMENT_FORMAT_INSTRUCTION in every beforePrompt stageDirections block.
 *
 * The UI reads this tag to display the correct name label above the response block.
 * Tag is stripped before display in production; visible in DEV_MODE for verification.
 */
export const SPEAKER_FORMAT_INSTRUCTION = `
---
SPEAKER ATTRIBUTION — REQUIRED EVERY RESPONSE
At the very end of your response (after any SENTIMENT tag), you MUST append a [SPEAKER:Name] tag.
This is mandatory — do not skip it.

Choose the character who speaks the most or drives the scene. In multi-character scenes, pick the one with the largest speaking role or the final word.
Only use "Narrator" when the response contains zero character dialogue.

Valid values (exact spelling): Adrian, Sebastian, Luca, Callum, Lilith, Kethros, Umbri, Narrator

Format:
[SPEAKER:Name]

One tag only. Tag is stripped before display — the player never sees it.
---`.trim();
