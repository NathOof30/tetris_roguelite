/**
 * @fileoverview "Gravité Granulaire" modifier
 * 15% unstable pieces (granular gravity), 5% stone blocks
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

export class GraviteGranulaire extends Modifier {
    constructor() {
        super({
            id: 'gravite_granulaire',
            name: 'Gravité Granulaire',
            description: '15% pièces instables (comblent trous), 5% blocs de pierre',
            rarity: ModifierRarity.EPIC,
            type: ModifierType.MIXED,
            icon: '🪨'
        });

        this.unstableChance = 0.15;
        this.stoneChance = 0.05;
    }

    modifySpawnedPiece(piece, game) {
        // Chance for unstable (granular gravity)
        if (Math.random() < this.unstableChance) {
            piece.isUnstable = true;
        }

        // Chance for stone (health = 2)
        if (Math.random() < this.stoneChance) {
            piece.isStone = true;
            piece.color = '#708090'; // Slate gray
        }
    }

    onApply(game) {
        super.onApply(game);
        console.log('[Gravité Granulaire] Activé: 15% instable, 5% pierre');
    }
}

export default GraviteGranulaire;
