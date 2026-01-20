/**
 * @fileoverview Keyboard input handler with DAS/ARR system
 * Provides professional-grade input handling with zero latency
 */

import config from '../utils/Config.js';
import { globalEvents } from '../utils/EventEmitter.js';

/**
 * Set of game keys that should prevent default browser behavior
 */
const GAME_KEYS = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'KeyC', 'KeyZ', 'KeyP', 'KeyM', 'Escape'
]);

/**
 * Keyboard input handler with DAS/ARR
 */
export class Keyboard {
    /**
     * Create keyboard handler
     * @param {import('../engine/Game.js').Game} game - Game instance
     */
    constructor(game) {
        this.game = game;
        this.enabled = false;

        // Key states
        this.keysDown = new Set();

        // DAS/ARR timers
        this.dasTimers = new Map();
        this.arrIntervals = new Map();

        // DAS/ARR configuration
        this.dasDelay = config.get('game.das.delay') || 150;
        this.arrInterval = config.get('game.das.interval') || 50;

        // Bind handlers
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleBlur = this.handleBlur.bind(this);

        // Get key mappings
        this.updateKeyMappings();
    }

    /**
     * Update key mappings from config
     */
    updateKeyMappings() {
        const controls = config.get('controls') || {};

        this.keyMappings = {
            left: new Set(controls.left || ['ArrowLeft']),
            right: new Set(controls.right || ['ArrowRight']),
            rotateRight: new Set(controls.rotateRight || ['ArrowUp']),
            rotateLeft: new Set(controls.rotateLeft || ['KeyZ']),
            softDrop: new Set(controls.softDrop || ['ArrowDown']),
            hardDrop: new Set(controls.hardDrop || ['Space']),
            hold: new Set(controls.hold || ['KeyC']),
            pause: new Set(controls.pause || ['KeyP', 'Escape']),
            mute: new Set(controls.mute || ['KeyM']),
        };
    }

    /**
     * Get action for a key code
     * @param {string} code - Key code
     * @returns {string|null} Action name or null
     */
    getAction(code) {
        for (const [action, keys] of Object.entries(this.keyMappings)) {
            if (keys.has(code)) {
                return action;
            }
        }
        return null;
    }

    /**
     * Enable input handling
     */
    enable() {
        if (this.enabled) return;

        window.addEventListener('keydown', this.handleKeyDown, { passive: false });
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);

        this.enabled = true;
    }

    /**
     * Disable input handling
     */
    disable() {
        if (!this.enabled) return;

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleBlur);

        this.clearAllTimers();
        this.keysDown.clear();

        this.enabled = false;
    }

    /**
     * Handle keydown event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Prevent default for game keys
        if (GAME_KEYS.has(e.code)) {
            e.preventDefault();
        }

        // Ignore if already pressed (key repeat from OS)
        if (this.keysDown.has(e.code)) {
            return;
        }

        this.keysDown.add(e.code);

        const action = this.getAction(e.code);
        if (!action) return;

        // Execute action immediately
        this.executeAction(action);

        // Set up DAS for repeatable actions
        if (this.isRepeatableAction(action)) {
            this.startDAS(e.code, action);
        }
    }

    /**
     * Handle keyup event
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        this.keysDown.delete(e.code);

        // Clear DAS/ARR timers for this key
        this.clearTimersForKey(e.code);
    }

    /**
     * Handle window blur (clear all keys)
     */
    handleBlur() {
        this.keysDown.clear();
        this.clearAllTimers();
    }

    /**
     * Check if action should auto-repeat
     * @param {string} action - Action name
     * @returns {boolean}
     */
    isRepeatableAction(action) {
        return ['left', 'right', 'softDrop'].includes(action);
    }

    /**
     * Start DAS timer for an action
     * @param {string} code - Key code
     * @param {string} action - Action name
     */
    startDAS(code, action) {
        // Clear existing timer
        this.clearTimersForKey(code);

        // Start DAS delay
        const dasTimer = setTimeout(() => {
            // Start ARR
            const arrInterval = setInterval(() => {
                if (this.keysDown.has(code)) {
                    this.executeAction(action);
                } else {
                    this.clearTimersForKey(code);
                }
            }, this.arrInterval);

            this.arrIntervals.set(code, arrInterval);
        }, this.dasDelay);

        this.dasTimers.set(code, dasTimer);
    }

    /**
     * Clear timers for a specific key
     * @param {string} code - Key code
     */
    clearTimersForKey(code) {
        if (this.dasTimers.has(code)) {
            clearTimeout(this.dasTimers.get(code));
            this.dasTimers.delete(code);
        }

        if (this.arrIntervals.has(code)) {
            clearInterval(this.arrIntervals.get(code));
            this.arrIntervals.delete(code);
        }
    }

    /**
     * Clear all timers
     */
    clearAllTimers() {
        this.dasTimers.forEach(timer => clearTimeout(timer));
        this.arrIntervals.forEach(interval => clearInterval(interval));
        this.dasTimers.clear();
        this.arrIntervals.clear();
    }

    /**
     * Execute a game action
     * @param {string} action - Action name
     */
    executeAction(action) {
        switch (action) {
            case 'left':
                this.game.moveLeft();
                break;
            case 'right':
                this.game.moveRight();
                break;
            case 'rotateRight':
                this.game.rotate(true);
                break;
            case 'rotateLeft':
                this.game.rotate(false);
                break;
            case 'softDrop':
                this.game.softDrop();
                break;
            case 'hardDrop':
                this.game.hardDrop();
                break;
            case 'hold':
                this.game.hold();
                break;
            case 'pause':
                this.game.togglePause();
                break;
            case 'mute':
                globalEvents.emit('toggleMute');
                break;
        }
    }

    /**
     * Update DAS/ARR settings
     * @param {number} dasDelay - DAS delay in ms
     * @param {number} arrInterval - ARR interval in ms
     */
    updateDAS(dasDelay, arrInterval) {
        this.dasDelay = dasDelay;
        this.arrInterval = arrInterval;
        config.set('game.das.delay', dasDelay);
        config.set('game.das.interval', arrInterval);
    }

    /**
     * Set key mapping for an action
     * @param {string} action - Action name
     * @param {string[]} keys - Array of key codes
     */
    setKeyMapping(action, keys) {
        if (this.keyMappings[action]) {
            this.keyMappings[action] = new Set(keys);
            config.set(`controls.${action}`, keys);
        }
    }

    /**
     * Get all key mappings
     * @returns {Object} Key mappings
     */
    getKeyMappings() {
        const mappings = {};
        for (const [action, keys] of Object.entries(this.keyMappings)) {
            mappings[action] = Array.from(keys);
        }
        return mappings;
    }

    /**
     * Clean up
     */
    destroy() {
        this.disable();
    }
}

export default Keyboard;
