/**
 * @fileoverview "Ligne Fantôme" modifier
 * Every 10 pieces: delete bottom row. Next piece hidden while current drops.
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class LigneFantome extends Modifier {
    constructor() {
        super({
            id: 'ligne_fantome',
            name: 'Ligne Fantôme',
            description: 'Toutes les 10 pièces: supprime ligne du bas. Next cachée.',
            rarity: ModifierRarity.EPIC,
            type: ModifierType.MIXED,
            icon: '👻'
        });

        this.pieceCount = 0;
        this.threshold = 10;
    }

    onApply(game) {
        super.onApply(game);
        this.pieceCount = 0;

        // Hide next piece
        if (game) {
            game.hideNextPiece = true;
        }

        console.log('[Ligne Fantôme] Activé: Suppression ligne bas / 10 pièces, Next cachée');
    }

    onPieceDrop(game, piece) {
        this.pieceCount++;

        if (this.pieceCount >= this.threshold) {
            this.pieceCount = 0;

            // Delete bottom row
            if (game && game.board) {
                game.board.deleteBottomRow();
                globalEvents.emit('notification', { text: '👻 Ligne fantôme supprimée!', type: 'info' });
            }
        }
    }

    onRemove(game) {
        super.onRemove(game);

        if (game) {
            game.hideNextPiece = false;
        }
    }
}

export default LigneFantome;
