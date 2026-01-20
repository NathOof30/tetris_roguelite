/**
 * @fileoverview "Vitesse Instable" modifier
 * Increases piece fall speed by 15%
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

/**
 * Vitesse Instable - Malus modifier increasing fall speed
 * Reduces drop interval by 15%
 */
export class VitesseInstable extends Modifier {
    constructor() {
        super({
            id: 'vitesse_instable',
            name: 'Vitesse Instable',
            description: 'Augmente la vitesse de chute de 15%',
            rarity: ModifierRarity.COMMON,
            type: ModifierType.MALUS,
            icon: '⚡'
        });

        this.speedIncrease = 0.15; // 15% faster
    }

    /**
     * Modify drop interval (reduce it to make pieces fall faster)
     * @param {number} interval - Current drop interval in ms
     * @returns {number} Modified interval
     */
    modifyDropInterval(interval) {
        // Reduce interval = faster falling
        return interval * (1 - this.speedIncrease);
    }

    onApply(game) {
        super.onApply(game);
        console.log('[Vitesse Instable] Activé: +15% vitesse de chute');
    }
}

export default VitesseInstable;
