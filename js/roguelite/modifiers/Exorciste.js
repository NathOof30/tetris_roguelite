/**
 * @fileoverview "Exorciste" modifier
 * Disables ghost piece (shadow showing landing position)
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import config from '../../utils/Config.js';

export class Exorciste extends Modifier {
    constructor() {
        super({
            id: 'exorciste',
            name: 'Exorciste',
            description: 'Désactive la pièce fantôme (ombre de destination)',
            rarity: ModifierRarity.COMMON,
            type: ModifierType.MALUS,
            icon: '👁️'
        });

        this.originalGhostSetting = true;
    }

    onApply(game) {
        super.onApply(game);

        // Save and disable ghost piece
        this.originalGhostSetting = config.get('game.ghostPiece');
        config.set('game.ghostPiece', false);

        console.log('[Exorciste] Activé: Ghost piece désactivée');
    }

    onRemove(game) {
        super.onRemove(game);

        // Restore ghost piece setting
        config.set('game.ghostPiece', this.originalGhostSetting);
    }
}

export default Exorciste;
