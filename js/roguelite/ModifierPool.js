/**
 * @fileoverview Modifier registry and pool management
 * Provides all available modifiers for selection
 */

import { LeGeometre } from './modifiers/LeGeometre.js';
import { VitesseInstable } from './modifiers/VitesseInstable.js';
import { ModifierType } from './Modifier.js';

/**
 * All available modifiers
 */
const ALL_MODIFIERS = [
    LeGeometre,
    VitesseInstable
];

/**
 * ModifierPool - Manages available modifiers for selection
 */
export class ModifierPool {
    constructor() {
        this.modifierClasses = [...ALL_MODIFIERS];
    }

    /**
     * Get random modifiers for selection
     * @param {number} count - Number of modifiers to return
     * @param {Object} options - Filter options
     * @param {string} options.type - Filter by type (bonus, malus, mixed)
     * @param {string[]} options.excludeIds - IDs to exclude (already active)
     * @returns {Modifier[]} Array of new modifier instances
     */
    getRandomModifiers(count = 3, { type = null, excludeIds = [] } = {}) {
        // Filter available modifiers
        let available = this.modifierClasses.filter(ModClass => {
            const instance = new ModClass();

            // Exclude by ID
            if (excludeIds.includes(instance.id)) {
                return false;
            }

            // Filter by type
            if (type && instance.type !== type) {
                return false;
            }

            return true;
        });

        // Shuffle
        available = this.shuffle(available);

        // Take requested count
        const selected = available.slice(0, count);

        // Return new instances
        return selected.map(ModClass => new ModClass());
    }

    /**
     * Get malus modifiers for deal system
     * If not enough malus, include any available modifiers
     * @param {number} count - Number of modifiers
     * @param {string[]} excludeIds - IDs to exclude
     * @returns {Modifier[]}
     */
    getMalusModifiers(count = 3, excludeIds = []) {
        let modifiers = this.getRandomModifiers(count, {
            type: ModifierType.MALUS,
            excludeIds
        });

        // If not enough malus, fill with any available
        if (modifiers.length < count) {
            const additional = this.getRandomModifiers(count - modifiers.length, {
                excludeIds: [...excludeIds, ...modifiers.map(m => m.id)]
            });
            modifiers = [...modifiers, ...additional];
        }

        return modifiers;
    }

    /**
     * Get bonus or mixed modifiers for rewards
     * If not enough, fill with any available modifiers
     * @param {number} count - Number of modifiers
     * @param {string[]} excludeIds - IDs to exclude
     * @returns {Modifier[]}
     */
    getBonusModifiers(count = 3, excludeIds = []) {
        // Get bonus and mixed modifiers first
        let available = this.modifierClasses.filter(ModClass => {
            const instance = new ModClass();

            if (excludeIds.includes(instance.id)) {
                return false;
            }

            return instance.type === ModifierType.BONUS ||
                instance.type === ModifierType.MIXED;
        });

        available = this.shuffle(available);
        let modifiers = available.slice(0, count).map(ModClass => new ModClass());

        // If not enough bonus/mixed, fill with any available (including malus)
        if (modifiers.length < count) {
            const additional = this.getRandomModifiers(count - modifiers.length, {
                excludeIds: [...excludeIds, ...modifiers.map(m => m.id)]
            });
            modifiers = [...modifiers, ...additional];
        }

        return modifiers;
    }

    /**
     * Fisher-Yates shuffle
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array copy
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

export default ModifierPool;
