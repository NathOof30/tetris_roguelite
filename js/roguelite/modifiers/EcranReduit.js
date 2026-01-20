/**
 * @fileoverview "Écran Réduit" modifier
 * Reduces board from 10 to 8 columns (dead zones on columns 1 and 10)
 */

import { Modifier, ModifierRarity, ModifierType } from '../Modifier.js';
import { globalEvents } from '../../utils/EventEmitter.js';

export class EcranReduit extends Modifier {
    constructor() {
        super({
            id: 'ecran_reduit',
            name: 'Écran Réduit',
            description: 'Plateau réduit à 8 colonnes (bordures mortes)',
            rarity: ModifierRarity.EPIC,
            type: ModifierType.MALUS,
            icon: '⬜'
        });
    }

    onApply(game) {
        super.onApply(game);

        if (game && game.board) {
            game.board.setDeadZones(1, 1); // 1 column dead on each side
            globalEvents.emit('notification', { text: '⬜ Plateau réduit à 8 colonnes!', type: 'warning' });
        }

        console.log('[Écran Réduit] Activé: Plateau 8 colonnes');
    }

    onRemove(game) {
        super.onRemove(game);

        if (game && game.board) {
            game.board.clearDeadZones();
        }
    }
}

export default EcranReduit;
