/**
 * @fileoverview "Poids de la Rouille" modifier
 * Every 15 pieces, 2 random pixels become rusted (cannot be cleared normally)
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class PoidsRouille extends Modifier {
    constructor() {
        super({
            id: 'poids_rouille',
            name: 'Poids de la Rouille',
            description: 'Toutes les 15 pièces: 2 pixels rouillés (non effaçables)',
            rarity: ModifierRarity.RARE,
            type: ModifierType.MALUS,
            icon: '🦀'
        });

        this.pieceCount = 0;
        this.threshold = 15;
        this.rustCount = 2;
    }

    onApply(game) {
        super.onApply(game);
        this.pieceCount = 0;
        console.log('[Poids de la Rouille] Activé: 2 pixels rouillés / 15 pièces');
    }

    onPieceDrop(game, piece) {
        this.pieceCount++;

        if (this.pieceCount >= this.threshold) {
            this.pieceCount = 0;

            // Add rusted pixels
            if (game && game.board) {
                game.board.addRustedPixels(this.rustCount);
                globalEvents.emit('notification', { text: '🦀 Rouille ajoutée!', type: 'warning' });
            }
        }
    }
}

export default PoidsRouille;
