/**
 * @fileoverview "Pixel de Nettoyage" modifier
 * 5% chance for a cleaner pixel that fixes special blocks
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

export class PixelNettoyage extends Modifier {
    constructor() {
        super({
            id: 'pixel_nettoyage',
            name: 'Pixel de Nettoyage',
            description: '5% chance: pixel nettoyeur (répare blocs spéciaux)',
            rarity: ModifierRarity.RARE,
            type: ModifierType.BONUS,
            icon: '✨'
        });

        this.cleanerChance = 0.05;
    }

    modifySpawnedPiece(piece, game) {
        if (Math.random() < this.cleanerChance) {
            piece.hasCleaner = true;
            // Visual indicator - add cyan tint
            piece.color = '#00ffff';
        }
    }

    onApply(game) {
        super.onApply(game);
        console.log('[Pixel de Nettoyage] Activé: 5% pixels nettoyeurs');
    }
}

export default PixelNettoyage;
