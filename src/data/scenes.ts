import { SceneDefinition, SceneType } from '../types';

/**
 * All authored scene definitions.
 * The scene engine in beforePrompt looks these up by id.
 */
export const SCENES: Record<string, SceneDefinition> = {

    opening: {
        id: 'opening',
        type: SceneType.OPENING,
        title: 'Arrival',
        characterId: undefined,           // Umbri is an NPC — no LI sentiment scored here
        locationId: 'user-room',
        unlock: {},                        // Mandatory — no conditions required
        promptContext:
            `{{user}} has been shown to {{user}}'s room and {{user}} is in {{user}}'s room. ` +
            `Describe the beauty of the room and some things user can explore in the room. ` +
            `Have Umbri introduce herself and orient {{user}} with the map.`,
        outcomes: {
            advanceTime: false,            // Arrival doesn't burn a turn
        },
    },

};
