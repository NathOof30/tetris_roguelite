/**
 * @fileoverview "Le Géomètre" modifier
 * Increases I-piece probability, decreases O-piece probability
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

/**
 * Le Géomètre - Mixed modifier affecting piece probabilities
 * +20% I-piece chance, -10% O-piece chance
 */
export class LeGeometre extends Modifier {
    constructor() {
        super({
            id: 'le_geometre',
            name: 'Le Géomètre',
            description: '+20% chance barre (I) / -10% chance carré (O)',
            rarity: ModifierRarity.COMMON,
            type: ModifierType.MIXED,
            icon: '📐'
        });

        this.iBonus = 0.2;  // +20%
        this.oPenalty = 0.1; // -10%
    }

    /**
     * Modify piece weights
     * @param {Object} weights - Current weights
     * @returns {Object} Modified weights
     */
    modifyPieceWeights(weights) {
        return {
            ...weights,
            I: weights.I * (1 + this.iBonus),
            O: weights.O * (1 - this.oPenalty)
        };
    }

    onApply(game) {
        super.onApply(game);
        console.log('[Le Géomètre] Activé: +20% I, -10% O');
    }
}

export default LeGeometre;
