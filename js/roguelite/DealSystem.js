/**
 * @fileoverview Deal System - Malus gauge for roguelite
 * Tracks pieces placed without line clears and triggers forced malus selection
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * DealSystem - Manages the malus gauge
 */
export class DealSystem {
    /**
     * @param {Object} options - Configuration
     * @param {number} options.threshold - Pieces without clear before trigger (default: 10)
     */
    constructor({ threshold = 10 } = {}) {
        this.threshold = threshold;
        this.piecesWithoutClear = 0;
        this.isTriggered = false;

        // Bind handlers
        this.handlePieceLocked = this.handlePieceLocked.bind(this);
        this.handleLinesCleared = this.handleLinesCleared.bind(this);
        this.handleGaugeIncrease = this.handleGaugeIncrease.bind(this);
        this.handleGaugeDecrease = this.handleGaugeDecrease.bind(this);
    }

    /**
     * Initialize and subscribe to events
     */
    init() {
        globalEvents.on('pieceLocked', this.handlePieceLocked);
        globalEvents.on('linesCleared', this.handleLinesCleared);
        globalEvents.on('dealGaugeIncrease', this.handleGaugeIncrease);
        globalEvents.on('dealGaugeDecrease', this.handleGaugeDecrease);
    }

    /**
     * Handle piece locked event - increment gauge
     */
    handlePieceLocked() {
        if (this.isTriggered) return;

        this.piecesWithoutClear++;
        this.emitUpdate();

        if (this.piecesWithoutClear >= this.threshold) {
            this.trigger();
        }
    }

    /**
     * Handle gauge increase from modifiers (e.g., Échangeur Risqué)
     * @param {number} amount - Amount to increase
     */
    handleGaugeIncrease(amount) {
        if (this.isTriggered) return;

        this.piecesWithoutClear += amount;
        this.emitUpdate();

        if (this.piecesWithoutClear >= this.threshold) {
            this.trigger();
        }
    }

    /**
     * Handle gauge decrease from modifiers (e.g., Surcharge de Score)
     * @param {number} amount - Amount to decrease
     */
    handleGaugeDecrease(amount) {
        this.piecesWithoutClear = Math.max(0, this.piecesWithoutClear - amount);
        this.emitUpdate();
    }

    /**
     * Handle lines cleared - reset gauge
     */
    handleLinesCleared() {
        this.piecesWithoutClear = 0;
        this.emitUpdate();
    }

    /**
     * Emit gauge update event
     */
    emitUpdate() {
        globalEvents.emit('dealGaugeUpdate', {
            current: this.piecesWithoutClear,
            threshold: this.threshold,
            percentage: this.getPercentage()
        });
    }

    /**
     * Trigger the deal (forced malus selection)
     */
    trigger() {
        this.isTriggered = true;
        globalEvents.emit('dealTriggered');
    }

    /**
     * Reset after malus selection
     */
    reset() {
        this.piecesWithoutClear = 0;
        this.isTriggered = false;
        this.emitUpdate();
    }

    /**
     * Get current percentage (0-100)
     * @returns {number}
     */
    getPercentage() {
        return Math.min(100, (this.piecesWithoutClear / this.threshold) * 100);
    }

    /**
     * Clean up
     */
    destroy() {
        globalEvents.off('pieceLocked', this.handlePieceLocked);
        globalEvents.off('linesCleared', this.handleLinesCleared);
        globalEvents.off('dealGaugeIncrease', this.handleGaugeIncrease);
        globalEvents.off('dealGaugeDecrease', this.handleGaugeDecrease);
    }
}

export default DealSystem;
