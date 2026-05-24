/**
 * Vesper — Default Test Persona
 *
 * A pre-built SaveType for testing the stage without going through onboarding.
 * Import TEST_SAVE and pass it directly to the save initializer.
 *
 * NARRATIVE NOTES:
 *   - Heritage is set to 'halflit' for stat/injection purposes.
 *     The beforePrompt builder will inject the halflit always-on context
 *     (characters perceive her anomalous signature) — but NOT the
 *     caelith_revealed text, which requires flag_caelith_revealed to be set.
 *   - No story flags are set on arrival. All reveals are earned through play.
 *   - She does not know she is a pure soul or halflit. The characters do.
 *
 * See also: lore/characters/vesper.yaml for the full lore reference.
 */

import { SaveType, PLAYER_STATS, defaultRelationships, defaultPresenceState } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER DESCRIPTION
// Injected verbatim into beforePrompt as {{user}}'s physical and personality
// context. Written for LLM consumption — third-person, present tense.
// ─────────────────────────────────────────────────────────────────────────────

const VESPER_DESCRIPTION = `Vesper is 171 cm, caramel-skinned, and built like someone who takes up space on purpose — muscular and curved in equal measure. Full hips and thighs, soft and strong at once: a body that has clearly been through things and is not apologetic about what it became. Dark brown hair with a deep purple ombré bleeding through to the ends, wavy, falling to her lower back when loose. Her eyes are the most arresting thing about her: blue so pale they resolve as silver in most light, the kind of eyes that belong to something older than she is.

She carries herself like she has already decided what the room means and is waiting for the room to catch up. Piercings: gold septum hoop; philtrum stud in onyx at the upper lip; gold barbells through both nipples. She smells of sandalwood, vanilla, and clove — and beneath those, something that does not classify neatly: adjacent to ambrosia, adjacent to decay.

Personality: defiant by default, sarcastic as a first language, casually vulgar in a way that is wholly natural. Highly creative, deeply curious, intensely committed to humanitarian causes — these are not positions she holds but load-bearing parts of who she is. She feels everything at full volume and does not hide it well. She gets intense. She runs hot and cold when she is protecting herself, and she is protecting herself more often than she lets on. The tenderness underneath the defiance is real and she does not advertise it.

Voice: honeyed and softly accented. Sarcasm delivered at conversational register. She does not moderate her language for the room. When she laughs, it is real.`;

// ─────────────────────────────────────────────────────────────────────────────
// TEST SAVE
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_SAVE: SaveType = {
    player: {
        name:        'Vesper',
        description: VESPER_DESCRIPTION,
        avatarUrl:   '',
        heritage:    'halflit',
        stats:       PLAYER_STATS.halflit,
    },

    // Day 1, morning — first turn of the game.
    day:  1,
    turn: 0,

    // Default starting relationships per types.ts constants.
    // adrian:    joy 0 / trust 0 / score 0
    // sebastian: joy 5 / trust 0 / score 0
    // kethros:   joy 0 / trust 5 / score 0
    // luca:      joy 0 / trust 2 / score 0
    // callum:    joy 0 / trust 0 / score 0
    // lilith:    joy 0 / trust 0 / score 0
    relationships: defaultRelationships(),

    completedScenes: [],
    availableScenes: ['opening'],
    activeScene:     undefined,

    // No flags on arrival.
    // Halflit heritage (player.heritage === 'halflit') gates character perception
    // of her anomalous signature — not a flag, derived from heritage field above.
    // flag_caelith_revealed starts false; she does not know what she is.
    flags: {
        // Set to true to skip intro and land in 'game' view (map enabled).
        // Set to false to test the full onboarding + opening view with Umbri.
        intro_complete: true,
    },

    // Presence state -- starts in user-room with no prior encounters.
    presence: {
        currentLocationId: 'user-room',
        lastRoomCharacters: [],
        travelingWithUser:  null,
    },

    timeline:  [],
    lastSaved: Date.now(),
};

// ─────────────────────────────────────────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────────────────────────────────────────
//
// In your stage init or dev bootstrap, replace the normal save initialisation:
//
//   import { TEST_SAVE } from './data/testPersona';
//   import { TEST_MODE } from './config';   // or however you gate dev mode
//
//   const save = TEST_MODE ? TEST_SAVE : createNewSave(...);
//
// Or in beforePrompt directly (for rapid iteration):
//
//   const save = cha