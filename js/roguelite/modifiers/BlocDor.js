/**
 * @fileoverview "Bloc d'Or" modifier
 * 10% gold pieces with score multiplier, disables Hold on gold
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

export class BlocDor extends Modifier {
    constructor() {
        super({
            id: 'bloc_dor',
            name: "Bloc d'Or",
            description: '10% pièces dorées (+50%/pixel), mais Hold désactivé',
            rarity: ModifierRarity.RARE,
            type: ModifierType.MIXED,
            icon: '💰'
        });

        this.goldChance = 0.10; // 10%
    }

    /**
     * Chance to make spawned piece gold
     */
    modifySpawnedPiece(piece, game) {
        if (Math.random() < this.goldChance) {
            piece.isGold = true;
            piece.color = '#ffd700'; // Gold color
        }
    }

    onApply(game) {
        super.onApply(game);
        console.log("[Bloc d'Or] Activé: 10% pièces dorées, Hold désactivé sur gold");
    }
}

export default BlocDor;
