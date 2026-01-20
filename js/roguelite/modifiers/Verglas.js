/**
 * @fileoverview "Verglas" modifier
 * Pieces slide 1 cell left or right randomly on landing
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class Verglas extends Modifier {
    constructor() {
        super({
            id: 'verglas',
            name: 'Verglas',
            description: 'Les pièces glissent d\'1 case au sol (aléatoire L/R)',
            rarity: ModifierRarity.COMMON,
            type: ModifierType.MALUS,
            icon: '🧊'
        });
    }

    onApply(game) {
        super.onApply(game);

        if (game) {
            game.iceSlide = true;
        }

        console.log('[Verglas] Activé: Glissade au sol');
    }

    onRemove(game) {
        super.onRemove(game);

        if (game) {
            game.iceSlide = false;
        }
    }
}

export default Verglas;
