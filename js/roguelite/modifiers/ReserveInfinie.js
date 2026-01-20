/**
 * @fileoverview "Réserve Infinie" modifier
 * Hold always available (no cooldown after use)
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';

export class ReserveInfinie extends Modifier {
    constructor() {
        super({
            id: 'reserve_infinie',
            name: 'Réserve Infinie',
            description: 'Hold toujours disponible (pas de cooldown)',
            rarity: ModifierRarity.EPIC,
            type: ModifierType.BONUS,
            icon: '♾️'
        });
    }

    onApply(game) {
        super.onApply(game);

        if (game) {
            game.infiniteHold = true;
        }

        console.log('[Réserve Infinie] Activé: Hold sans cooldown');
    }

    onRemove(game) {
        super.onRemove(game);

        if (game) {
            game.infiniteHold = false;
        }
    }
}

export default ReserveInfinie;
