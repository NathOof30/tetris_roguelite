/**
 * @fileoverview Touch input handler for mobile devices
 * Provides swipe gestures and tap zones for touch controls
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * Touch input handler
 */
export class Touch {
    /**
     * Create touch handler
     * @param {import('../engine/Game.js').Game} game - Game instance
     * @param {HTMLElement} element - Touch target element
     */
    constructor(game, element) {
        this.game = game;
        this.element = element;
        this.enabled = false;

        // Touch state
        this.touchStart = null;
        this.lastTap = 0;

        // Configuration
        this.swipeThreshold = 30; // minimum px for swipe
        this.tapThreshold = 10; // max px for tap
        this.doubleTapDelay = 300; // ms for double tap

        // Bind handlers
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    /**
     * Enable touch handling
     */
    enable() {
        if (this.enabled) return;

        this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.handleTouchEnd);

        this.enabled = true;
    }

    /**
     * Disable touch handling
     */
    disable() {
        if (!this.enabled) return;

        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);

        this.enabled = false;
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        e.preventDefault();

        const touch = e.touches[0];
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        e.preventDefault();

        if (!this.touchStart) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;

        // Quick swipe down for soft drop
        if (deltaY > this.swipeThreshold * 2) {
            this.game.softDrop();
            this.touchStart.y = touch.clientY;
        }
    }

    /**
     * Handle touch end
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        if (!this.touchStart) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;
        const deltaTime = Date.now() - this.touchStart.time;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Tap detection
        if (distance < this.tapThreshold && deltaTime < 200) {
            this.handleTap(touch.clientX, touch.clientY);
        }
        // Swipe detection
        else if (distance > this.swipeThreshold) {
            this.handleSwipe(deltaX, deltaY);
        }

        this.touchStart = null;
    }

    /**
     * Handle tap gesture
     * @param {number} x - Tap X position
     * @param {number} y - Tap Y position
     */
    handleTap(x, y) {
        const now = Date.now();
        const rect = this.element.getBoundingClientRect();
        const relativeX = (x - rect.left) / rect.width;

        // Double tap for hard drop
        if (now - this.lastTap < this.doubleTapDelay) {
            this.game.hardDrop();
            this.lastTap = 0;
            return;
        }

        this.lastTap = now;

        // Left third: move left
        if (relativeX < 0.33) {
            this.game.moveLeft();
        }
        // Right third: move right
        else if (relativeX > 0.66) {
            this.game.moveRight();
        }
        // Middle: rotate
        else {
            this.game.rotate(true);
        }
    }

    /**
     * Handle swipe gesture
     * @param {number} deltaX - X delta
     * @param {number} deltaY - Y delta
     */
    handleSwipe(deltaX, deltaY) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Horizontal swipe
        if (absX > absY) {
            if (deltaX > 0) {
                // Swipe right
                const steps = Math.floor(absX / this.swipeThreshold);
                for (let i = 0; i < steps; i++) {
                    this.game.moveRight();
                }
            } else {
                // Swipe left
                const steps = Math.floor(absX / this.swipeThreshold);
                for (let i = 0; i < steps; i++) {
                    this.game.moveLeft();
                }
            }
        }
        // Vertical swipe
        else {
            if (deltaY > 0) {
                // Swipe down - hard drop
                this.game.hardDrop();
            } else {
                // Swipe up - hold
                this.game.hold();
            }
        }
    }

    /**
     * Clean up
     */
    destroy() {
        this.disable();
    }
}

export default Touch;
