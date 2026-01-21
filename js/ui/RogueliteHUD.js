/**
 * @fileoverview Roguelite HUD - Visual display for deal gauge and active modifiers
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * RogueliteHUD - Displays deal gauge and active modifiers during gameplay
 */
export class RogueliteHUD {
    /**
     * @param {HTMLElement} container - Parent container for HUD elements
     */
    constructor(container) {
        this.container = container;
        this.gaugeContainer = null;
        this.gaugeFill = null;
        this.modifiersContainer = null;

        this.createElements();
        this.bindEvents();
    }

    /**
     * Create HUD DOM elements
     */
    createElements() {
        // Deal Gauge
        this.gaugeContainer = document.createElement('div');
        this.gaugeContainer.className = 'deal-gauge-container';
        this.gaugeContainer.innerHTML = `
            <div class="deal-gauge-label">Jauge Deal</div>
            <div class="deal-gauge">
                <div class="deal-gauge-fill"></div>
            </div>
            <div class="deal-gauge-text">0 / 10</div>
        `;
        this.container.appendChild(this.gaugeContainer);
        this.gaugeFill = this.gaugeContainer.querySelector('.deal-gauge-fill');
        this.gaugeText = this.gaugeContainer.querySelector('.deal-gauge-text');

        // XP Gauge (Level Up)
        this.xpContainer = document.createElement('div');
        this.xpContainer.className = 'deal-gauge-container xp-gauge-container'; // Reuse style but specific class for color
        this.xpContainer.innerHTML = `
            <div class="deal-gauge-label">Prochain Bonus</div>
            <div class="deal-gauge">
                <div class="deal-gauge-fill xp-fill"></div>
            </div>
            <div class="deal-gauge-text">0 / 10</div>
        `;
        this.container.appendChild(this.xpContainer);
        this.xpFill = this.xpContainer.querySelector('.deal-gauge-fill');
        this.xpText = this.xpContainer.querySelector('.deal-gauge-text');

        // Active Modifiers
        this.modifiersContainer = document.createElement('div');
        this.modifiersContainer.className = 'active-modifiers';
        this.container.appendChild(this.modifiersContainer);
    }

    /**
     * Bind to global events
     */
    bindEvents() {
        this.handleGaugeUpdate = this.handleGaugeUpdate.bind(this);
        this.handleModifiersUpdate = this.handleModifiersUpdate.bind(this);
        this.handleGameStart = this.handleGameStart.bind(this);

        globalEvents.on('dealGaugeUpdate', this.handleGaugeUpdate);
        globalEvents.on('activeModifiersUpdate', this.handleModifiersUpdate);
        globalEvents.on('gameStart', this.handleGameStart);
        globalEvents.on('linesCleared', (data) => this.handleXPUpdate(data));
        globalEvents.on('levelUp', () => this.handleLevelUp());
    }

    /**
     * Handle deal gauge update
     * @param {Object} data - { current, threshold, percentage }
     */
    handleGaugeUpdate(data) {
        const { current, threshold, percentage } = data;

        // Show gauge when there's progress
        if (current > 0) {
            this.gaugeContainer.classList.add('visible');
        } else {
            this.gaugeContainer.classList.remove('visible');
        }

        // Update fill
        this.gaugeFill.style.width = `${percentage}%`;
        this.gaugeText.textContent = `${current} / ${threshold}`;

        // Warning state when close to trigger
        if (percentage >= 70) {
            this.gaugeFill.classList.add('warning');
        } else {
            this.gaugeFill.classList.remove('warning');
        }
    }

    /**
     * Handle active modifiers update
     * @param {Modifier[]} modifiers - Array of active modifiers
     */
    handleModifiersUpdate(modifiers) {
        this.modifiersContainer.innerHTML = '';

        if (modifiers.length === 0) {
            this.modifiersContainer.classList.remove('visible');
            return;
        }

        this.modifiersContainer.classList.add('visible');

        modifiers.forEach(modifier => {
            const badge = document.createElement('div');
            badge.className = `active-modifier-badge ${modifier.type}`;
            badge.title = `${modifier.name}: ${modifier.description}`;
            badge.innerHTML = `
                <span class="badge-icon">${modifier.icon}</span>
                <span class="badge-name">${modifier.name}</span>
            `;
            this.modifiersContainer.appendChild(badge);
        });
    }

    /**
     * Handle XP/Lines update
     * @param {Object} data 
     */
    handleXPUpdate(data) {
        // Assuming level up every 10 lines
        // We need total lines to calc progress within level
        // But the event data might not have total lines? 
        // Game.js emit: { count, rows, points, goldCount }
        // Wait, handleLineClears updates this.lines.
        // I need to access game.lines or pass it in event.
        // Actually RogueliteSystem tracks lastLevel.
        // Let's assume the event data doesn't have total lines, so I need to find it.
        // Wait, Game.js emits 'linesCleared' AFTER updating this.lines.
        // But the pass data is local to the clear.

        // BETTER: Use Game reference or ask Game to pass total lines.
        // Game.js line 357: this.emit('linesCleared', { count, rows, points, goldCount });
        // It does NOT pass total lines.

        // I'll fix this by listening to 'render' or just modifying Game.js to include 'totalLines'?
        // Or assume I can access the game singleton? No.
        // I'll update Game.js to pass 'totalLines' in the event or rely on HUD restart.

        // Actually, let's just make the HUD visible and static 0/10 until I play.
        // I'll just check if I can access total lines.
        // If not, I'll update Game.js in a separate step?
        // Wait, I can't easily update Game.js in this tool call.
        // Let's rely on the fact that I can't calculate exact progress without total lines.

        // Actually, let's act as if the event has it. I'll update Game.js next.
        // But for now, let's just implement the UI update assuming `data.totalLines` exists.

        const lines = data.totalLines || 0;
        const progress = lines % 10;
        const percentage = (progress / 10) * 100;

        this.xpContainer.classList.add('visible');
        this.xpFill.style.width = `${percentage}%`;
        this.xpText.textContent = `${progress} / 10`;
    }

    handleLevelUp() {
        // Flash bar or reset
        this.xpFill.style.width = '0%';
        this.xpText.textContent = '0 / 10';
    }

    /**
     * Handle game start - reset HUD
     */
    handleGameStart() {
        this.gaugeContainer.classList.remove('visible');
        this.gaugeFill.style.width = '0%';
        this.gaugeFill.classList.remove('warning');
        this.gaugeText.textContent = '0 / 10';

        this.xpContainer.classList.remove('visible');
        this.xpFill.style.width = '0%';
        this.xpText.textContent = '0 / 10';

        this.modifiersContainer.innerHTML = '';
        this.modifiersContainer.classList.remove('visible');
    }

    /**
     * Show/hide HUD
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.gaugeContainer.style.display = visible ? '' : 'none';
        this.xpContainer.style.display = visible ? '' : 'none';
        this.modifiersContainer.style.display = visible ? '' : 'none';
    }

    /**
     * Clean up
     */
    destroy() {
        globalEvents.off('dealGaugeUpdate', this.handleGaugeUpdate);
        globalEvents.off('activeModifiersUpdate', this.handleModifiersUpdate);
        globalEvents.off('gameStart', this.handleGameStart);

        this.gaugeContainer?.remove();
        this.modifiersContainer?.remove();
    }
}

export default RogueliteHUD;
