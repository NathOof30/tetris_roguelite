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
     * Handle game start - reset HUD
     */
    handleGameStart() {
        this.gaugeContainer.classList.remove('visible');
        this.gaugeFill.style.width = '0%';
        this.gaugeFill.classList.remove('warning');
        this.gaugeText.textContent = '0 / 10';
        this.modifiersContainer.innerHTML = '';
        this.modifiersContainer.classList.remove('visible');
    }

    /**
     * Show/hide HUD
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.gaugeContainer.style.display = visible ? '' : 'none';
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
