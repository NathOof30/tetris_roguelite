/**
 * @fileoverview Modifier registry and pool management
 * Provides all available modifiers for selection
 */

// Original modifiers
import { LeGeometre } from './modifiers/LeGeometre.js';
import { VitesseInstable } from './modifiers/VitesseInstable.js';

// MIXED modifiers
import { BlocDor } from './modifiers/BlocDor.js';
import { GraviteGranulaire } from './modifiers/GraviteGranulaire.js';
import { EchangeurRisque } from './modifiers/EchangeurRisque.js';
import { LigneFantome } from './modifiers/LigneFantome.js';

// MALUS modifiers
import { Exorciste } from './modifiers/Exorciste.js';
import { Verglas } from './modifiers/Verglas.js';
import { PoidsRouille } from './modifiers/PoidsRouille.js';
import { EcranReduit } from './modifiers/EcranReduit.js';

// BONUS modifiers
import { Maniaque } from './modifiers/Maniaque.js';
import { PixelNettoyage } from './modifiers/PixelNettoyage.js';
import { ReserveInfinie } from './modifiers/ReserveInfinie.js';
import { SurchargeScore } from './modifiers/SurchargeScore.js';

import { ModifierType } from './Modifier.js';

/**
 * All available modifiers
 */
const ALL_MODIFIERS = [
    // Original
    LeGeometre,
    VitesseInstable,
    // MIXED (4)
    BlocDor,
    GraviteGranulaire,
    EchangeurRisque,
    LigneFantome,
    // MALUS (4)
    Exorciste,
    Verglas,
    PoidsRouille,
    // BONUS (4)
    Maniaque,
    PixelNettoyage,
    ReserveInfinie,
    SurchargeScore
];

/**
 * ModifierPool - Manages available modifiers for selection
 */
export class ModifierPool {
    constructor() {
        this.modifierClasses = [...ALL_MODIFIERS];
        console.log(`[ModifierPool] Loaded ${this.modifierClasses.length} modifiers:`,
            this.modifierClasses.map(M => new M().name));
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
        let available = this.modifierClasses.filter(ModClass => {
            const instance = new ModClass();
            if (excludeIds.includes(instance.id)) return false;
            if (type && instance.type !== type) return false;
            return true;
        });

        available = this.shuffle(available);
        const selected = available.slice(0, count);
        return selected.map(ModClass => new ModClass());
    }

    /**
     * Get MALUS modifiers only (for deals)
     * @param {number} count - Number of modifiers
     * @param {string[]} excludeIds - IDs to exclude
     * @returns {Modifier[]}
     */
    getMalusModifiers(count = 3, excludeIds = []) {
        const result = this.getRandomModifiers(count, {
            type: ModifierType.MALUS,
            excludeIds
        });
        console.log(`[ModifierPool] getMalusModifiers: ${result.length} found`, result.map(m => m.name));
        return result;
    }

    /**
     * Get BONUS or MIXED modifiers (for level ups)
     * @param {number} count - Number of modifiers
     * @param {string[]} excludeIds - IDs to exclude
     * @returns {Modifier[]}
     */
    getBonusModifiers(count = 3, excludeIds = []) {
        // Get bonus and mixed modifiers
        let available = this.modifierClasses.filter(ModClass => {
            const instance = new ModClass();
            if (excludeIds.includes(instance.id)) return false;
            const match = instance.type === ModifierType.BONUS ||
                instance.type === ModifierType.MIXED;
            return match;
        });

        console.log(`[ModifierPool] getBonusModifiers: ${available.length} available (BONUS+MIXED)`);

        available = this.shuffle(available);
        const result = available.slice(0, count).map(ModClass => new ModClass());
        console.log(`[ModifierPool] getBonusModifiers: returning ${result.length}`, result.map(m => m.name));
        return result;
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
