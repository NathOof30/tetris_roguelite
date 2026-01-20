/**
 * @fileoverview Central manager for all active modifiers
 * Handles modifier lifecycle and event dispatching
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * ModifierManager - Central hub for the roguelite system
 * Listens to game events and dispatches to active modifiers
 */
export class ModifierManager {
    constructor() {
        this.activeModifiers = [];
        this.game = null;

        // Bind event handlers
        this.handlePieceLocked = this.handlePieceLocked.bind(this);
        this.handleLinesCleared = this.handleLinesCleared.bind(this);
        this.handleRender = this.handleRender.bind(this);

        this.lastTime = performance.now();
    }

    /**
     * Initialize the manager with a game instance
     * @param {Game} game - Game instance
     */
    init(game) {
        this.game = game;
        this.subscribeToEvents();
    }

    /**
     * Subscribe to global game events
     */
    subscribeToEvents() {
        globalEvents.on('pieceLocked', this.handlePieceLocked);
        globalEvents.on('linesCleared', this.handleLinesCleared);
        globalEvents.on('render', this.handleRender);
    }

    /**
     * Unsubscribe from events
     */
    unsubscribeFromEvents() {
        globalEvents.off('pieceLocked', this.handlePieceLocked);
        globalEvents.off('linesCleared', this.handleLinesCleared);
        globalEvents.off('render', this.handleRender);
    }

    /**
     * Handle piece locked event
     * @param {Piece} piece - The locked piece
     */
    handlePieceLocked(piece) {
        for (const modifier of this.activeModifiers) {
            if (modifier.onPieceDrop) {
                modifier.onPieceDrop(this.game, piece);
            }
        }
    }

    /**
     * Handle lines cleared event
     * @param {Object} data - { count, rows, points }
     */
    handleLinesCleared(data) {
        for (const modifier of this.activeModifiers) {
            if (modifier.onLineClear) {
                modifier.onLineClear(this.game, data.count, data.rows);
            }
        }
    }

    /**
     * Handle render/update event
     */
    handleRender() {
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        for (const modifier of this.activeModifiers) {
            if (modifier.onUpdate) {
                modifier.onUpdate(this.game, deltaTime);
            }
        }
    }

    /**
     * Add a modifier to the active list
     * @param {Modifier} modifier - Modifier instance
     */
    addModifier(modifier) {
        // Check if already active
        if (this.activeModifiers.find(m => m.id === modifier.id)) {
            console.warn(`Modifier ${modifier.id} is already active`);
            return;
        }

        this.activeModifiers.push(modifier);

        if (modifier.onApply) {
            modifier.onApply(this.game);
        }

        console.log(`[ModifierManager] Activated: ${modifier.name}`);
        globalEvents.emit('modifierAdded', modifier);
    }

    /**
     * Remove a modifier by ID
     * @param {string} id - Modifier ID
     */
    removeModifier(id) {
        const index = this.activeModifiers.findIndex(m => m.id === id);

        if (index === -1) {
            console.warn(`Modifier ${id} not found`);
            return;
        }

        const modifier = this.activeModifiers[index];

        if (modifier.onRemove) {
            modifier.onRemove(this.game);
        }

        this.activeModifiers.splice(index, 1);
        console.log(`[ModifierManager] Removed: ${modifier.name}`);
        globalEvents.emit('modifierRemoved', modifier);
    }

    /**
     * Get all active modifiers
     * @returns {Modifier[]}
     */
    getActiveModifiers() {
        return [...this.activeModifiers];
    }

    /**
     * Check if a modifier is active
     * @param {string} id - Modifier ID
     * @returns {boolean}
     */
    hasModifier(id) {
        return this.activeModifiers.some(m => m.id === id);
    }

    /**
     * Get aggregated piece weights from all modifiers
     * @returns {Object} Combined weights { I: number, O: number, ... }
     */
    getPieceWeights() {
        let weights = { I: 1, O: 1, T: 1, S: 1, Z: 1, J: 1, L: 1 };

        for (const modifier of this.activeModifiers) {
            if (modifier.modifyPieceWeights) {
                weights = modifier.modifyPieceWeights(weights);
            }
        }

        // Ensure no negative weights
        for (const key of Object.keys(weights)) {
            weights[key] = Math.max(0.01, weights[key]);
        }

        return weights;
    }

    /**
     * Get aggregated drop interval multiplier
     * @param {number} baseInterval - Base drop interval
     * @returns {number} Modified interval
     */
    getModifiedDropInterval(baseInterval) {
        let interval = baseInterval;

        for (const modifier of this.activeModifiers) {
            if (modifier.modifyDropInterval) {
                interval = modifier.modifyDropInterval(interval);
            }
        }

        // Ensure minimum interval of 16ms (60fps cap)
        return Math.max(16, interval);
    }

    /**
     * Clear all modifiers
     */
    clearAll() {
        for (const modifier of [...this.activeModifiers]) {
            this.removeModifier(modifier.id);
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.unsubscribeFromEvents();
        this.clearAll();
        this.game = null;
    }
}

export default ModifierManager;
