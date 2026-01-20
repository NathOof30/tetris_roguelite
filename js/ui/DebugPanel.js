/**
 * @fileoverview Debug Panel for roguelite system
 * Shows piece weights, speed modifiers, and active modifiers stats
 */

import { globalEvents } from '../utils/EventEmitter.js';
import config from '../utils/Config.js';

/**
 * DebugPanel - Developer tool for viewing roguelite stats
 */
export class DebugPanel {
    /**
     * @param {RogueliteSystem} rogueliteSystem - Reference to roguelite system
     * @param {Game} game - Reference to game
     */
    constructor(rogueliteSystem, game) {
        this.rogueliteSystem = rogueliteSystem;
        this.game = game;
        this.panel = null;
        this.isVisible = false;
        this.updateInterval = null;

        this.createPanel();
    }

    /**
     * Create debug panel DOM
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'debug-panel';
        this.panel.innerHTML = `
            <div class="debug-header">
                <h4>🔧 Debug Roguelite</h4>
                <button class="debug-close" type="button">×</button>
            </div>
            <div class="debug-content">
                <div class="debug-section">
                    <h5>📊 Poids des pièces</h5>
                    <div class="piece-weights"></div>
                </div>
                <div class="debug-section">
                    <h5>⚡ Vitesse</h5>
                    <div class="speed-info"></div>
                </div>
                <div class="debug-section">
                    <h5>💀 Jauge Deal</h5>
                    <div class="deal-info"></div>
                </div>
                <div class="debug-section">
                    <h5>🎯 Modificateurs actifs</h5>
                    <div class="modifiers-info"></div>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);

        // Close button
        this.panel.querySelector('.debug-close').addEventListener('click', () => {
            this.hide();
        });

        // Initially hidden
        this.panel.style.display = 'none';
    }

    /**
     * Show the debug panel
     */
    show() {
        this.isVisible = true;
        this.panel.style.display = 'block';
        config.set('debug.roguelite', true);

        // Start update loop
        this.updateInterval = setInterval(() => this.update(), 100);
        this.update();
    }

    /**
     * Hide the debug panel
     */
    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
        config.set('debug.roguelite', false);

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update debug info
     */
    update() {
        if (!this.isVisible || !this.rogueliteSystem) return;

        // Piece weights
        const weights = this.rogueliteSystem.getPieceWeights();
        const weightsHtml = Object.entries(weights).map(([piece, weight]) => {
            const percent = (weight * 100 / 7).toFixed(1); // Rough percentage
            const barWidth = Math.min(100, weight * 50);
            const color = this.getPieceColor(piece);
            return `
                <div class="weight-row">
                    <span class="piece-name" style="color: ${color}">${piece}</span>
                    <div class="weight-bar" style="width: ${barWidth}%; background: ${color}"></div>
                    <span class="weight-value">${weight.toFixed(2)}</span>
                </div>
            `;
        }).join('');
        this.panel.querySelector('.piece-weights').innerHTML = weightsHtml;

        // Speed info
        if (this.game) {
            const baseInterval = this.getBaseDropInterval();
            const modifiedInterval = this.game.getDropInterval();
            const speedMod = ((baseInterval - modifiedInterval) / baseInterval * 100).toFixed(1);
            this.panel.querySelector('.speed-info').innerHTML = `
                <div>Base: ${baseInterval.toFixed(0)}ms</div>
                <div>Actuel: ${modifiedInterval.toFixed(0)}ms</div>
                <div>Modification: ${speedMod > 0 ? '+' : ''}${speedMod}%</div>
            `;
        }

        // Deal info
        const dealState = this.rogueliteSystem.getDealState();
        this.panel.querySelector('.deal-info').innerHTML = `
            <div>Pièces sans ligne: ${dealState.piecesWithoutClear} / ${dealState.threshold}</div>
            <div>Progression: ${dealState.percentage.toFixed(0)}%</div>
        `;

        // Active modifiers
        const modifiers = this.rogueliteSystem.getActiveModifiers();
        if (modifiers.length === 0) {
            this.panel.querySelector('.modifiers-info').innerHTML = '<div class="no-mods">Aucun</div>';
        } else {
            const modsHtml = modifiers.map(m => `
                <div class="mod-row">
                    <span class="mod-icon">${m.icon}</span>
                    <span class="mod-name">${m.name}</span>
                    <span class="mod-type ${m.type}">${m.type}</span>
                </div>
            `).join('');
            this.panel.querySelector('.modifiers-info').innerHTML = modsHtml;
        }
    }

    /**
     * Get base drop interval without modifiers
     */
    getBaseDropInterval() {
        if (!this.game) return 800;
        const framesPerDrop = [
            48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
            5, 5, 5, 4, 4, 4, 3, 3, 3, 2,
            2, 2, 2, 2, 2, 2, 2, 2, 2, 1
        ];
        const levelIndex = Math.min(this.game.level - 1, framesPerDrop.length - 1);
        return (framesPerDrop[levelIndex] / 60) * 1000;
    }

    /**
     * Get piece color
     * @param {string} piece - Piece type
     * @returns {string} CSS color
     */
    getPieceColor(piece) {
        const colors = {
            I: '#00f5ff',
            O: '#ffea00',
            T: '#b24bf3',
            S: '#4ade80',
            Z: '#f43f5e',
            J: '#3b82f6',
            L: '#f97316'
        };
        return colors[piece] || '#ffffff';
    }

    /**
     * Check if debug is enabled in config
     * @returns {boolean}
     */
    static isEnabled() {
        return config.get('debug.roguelite') === true;
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.panel?.remove();
    }
}

export default DebugPanel;
