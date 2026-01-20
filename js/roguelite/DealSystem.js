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
    }

    /**
     * Initialize and subscribe to events
     */
    init() {
        globalEvents.on('pieceLocked', this.handlePieceLocked);
        globalEvents.on('linesCleared', this.handleLinesCleared);
    }

    /**
     * Handle piece locked event - increment gauge
     */
    handlePieceLocked() {
        if (this.isTriggered) return;

        this.piecesWithoutClear++;

        globalEvents.emit('dealGaugeUpdate', {
            current: this.piecesWithoutClear,
            threshold: this.threshold,
            percentage: this.getPercentage()
        });

        if (this.piecesWithoutClear >= this.threshold) {
            this.trigger();
        }
    }

    /**
     * Handle lines cleared - reset gauge
     */
    handleLinesCleared() {
        this.piecesWithoutClear = 0;

        globalEvents.emit('dealGaugeUpdate', {
            current: 0,
            threshold: this.threshold,
            percentage: 0
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

        globalEvents.emit('dealGaugeUpdate', {
            current: 0,
            threshold: this.threshold,
            percentage: 0
        });
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
    }
}

export default DealSystem;
