/**
 * @fileoverview "Surcharge de Score" modifier
 * Tetris (4 lines) clears 5 from Deal gauge
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class SurchargeScore extends Modifier {
    constructor() {
        super({
            id: 'surcharge_score',
            name: 'Surcharge de Score',
            description: 'Tetris (4 lignes): -5 points de jauge Deal',
            rarity: ModifierRarity.RARE,
            type: ModifierType.BONUS,
            icon: '⚡'
        });
    }

    onApply(game) {
        super.onApply(game);
        console.log('[Surcharge de Score] Activé: Tetris = -5 jauge Deal');
    }

    onLineClear(game, count, rows) {
        if (count === 4) {
            // Tetris! Clear 5 from deal gauge
            globalEvents.emit('dealGaugeDecrease', 5);
            globalEvents.emit('notification', { text: '⚡ Surcharge! Jauge -5', type: 'success' });
        }
    }
}

export default SurchargeScore;
