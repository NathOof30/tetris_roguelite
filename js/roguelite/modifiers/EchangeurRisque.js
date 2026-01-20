/**
 * @fileoverview "Échangeur Risqué" modifier
 * Double Hold allowed, but each Hold adds to Deal gauge
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class EchangeurRisque extends Modifier {
    constructor() {
        super({
            id: 'echangeur_risque',
            name: 'Échangeur Risqué',
            description: 'Hold utilisable 2x de suite, mais +1 jauge par Hold',
            rarity: ModifierRarity.RARE,
            type: ModifierType.MIXED,
            icon: '🔄'
        });

        this.holdSubscribed = false;
    }

    onApply(game) {
        super.onApply(game);

        // Allow double hold
        if (game) {
            game.allowDoubleHold = true;
        }

        // Subscribe to hold events
        this.handleHold = this.handleHold.bind(this);
        globalEvents.on('hold', this.handleHold);
        this.holdSubscribed = true;

        console.log('[Échangeur Risqué] Activé: Double Hold, +1 jauge par Hold');
    }

    handleHold() {
        // Increase deal gauge by 1 on each hold
        globalEvents.emit('dealGaugeIncrease', 1);
    }

    onRemove(game) {
        super.onRemove(game);

        if (game) {
            game.allowDoubleHold = false;
        }

        if (this.holdSubscribed) {
            globalEvents.off('hold', this.handleHold);
            this.holdSubscribed = false;
        }
    }
}

export default EchangeurRisque;
