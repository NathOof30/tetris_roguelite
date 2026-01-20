/**
 * @fileoverview "Maniaque" modifier
 * Per score threshold: push all blocks left to fill gaps
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class Maniaque extends Modifier {
    constructor() {
        super({
            id: 'maniaque',
            name: 'Maniaque',
            description: 'Par palier de score: pousse tous les blocs à gauche',
            rarity: ModifierRarity.RARE,
            type: ModifierType.BONUS,
            icon: '🧹'
        });

        this.lastTriggerScore = 0;
        this.threshold = 2000; // Every 2000 points
    }

    onApply(game) {
        super.onApply(game);
        this.lastTriggerScore = game ? game.score : 0;
        console.log('[Maniaque] Activé: Pousse blocs à gauche / 2000 points');
    }

    onUpdate(game, deltaTime) {
        if (!game) return;

        const currentScore = game.score;
        const currentLevel = Math.floor(currentScore / this.threshold);
        const lastLevel = Math.floor(this.lastTriggerScore / this.threshold);

        if (currentLevel > lastLevel) {
            this.lastTriggerScore = currentScore;

            if (game.board) {
                game.board.pushRowsLeft();
                globalEvents.emit('notification', { text: '🧹 Nettoyage maniaque!', type: 'success' });
            }
        }
    }
}

export default Maniaque;
