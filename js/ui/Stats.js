/**
 * @fileoverview Stats display component
 * Shows score, level, lines, and other game statistics
 */

import { TETROMINOES } from '../engine/Piece.js';
import config from '../utils/Config.js';

/**
 * Stats display class
 */
export class Stats {
    /**
     * Create stats display
     * @param {Object} elements - DOM elements for stats display
     */
    constructor(elements) {
        this.elements = elements;
        this.animatedScore = 0;
        this.targetScore = 0;
        this.animationFrame = null;
    }

    /**
     * Update all stats
     * @param {Object} state - Game state
     */
    update(state) {
        // Animate score
        if (state.score !== this.targetScore) {
            this.targetScore = state.score;
            this.animateScore();
        }

        // Update level
        if (this.elements.level) {
            this.elements.level.textContent = state.level;
        }

        // Update lines
        if (this.elements.lines) {
            this.elements.lines.textContent = state.lines;
        }
    }

    /**
     * Animate score counting up
     */
    animateScore() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        const animate = () => {
            const diff = this.targetScore - this.animatedScore;

            if (Math.abs(diff) < 10) {
                this.animatedScore = this.targetScore;
            } else {
                this.animatedScore += Math.ceil(diff * 0.1);
            }

            if (this.elements.score) {
                this.elements.score.textContent = this.animatedScore.toLocaleString();
            }

            if (this.animatedScore !== this.targetScore) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Update hold piece display
     * @param {string} pieceType - Held piece type
     * @param {boolean} canHold - Whether hold is available
     */
    updateHold(pieceType, canHold = true) {
        const holdCanvas = this.elements.holdCanvas;
        if (!holdCanvas) return;

        const ctx = holdCanvas.getContext('2d');
        const width = holdCanvas.width;
        const height = holdCanvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        if (!pieceType) return;

        // Draw piece
        const tetromino = TETROMINOES[pieceType];
        if (!tetromino) return;

        const shape = tetromino.states[0];
        const cellSize = Math.min(
            (width - 20) / shape[0].length,
            (height - 20) / shape.length
        );

        // Center the piece
        const pieceWidth = shape[0].length * cellSize;
        const pieceHeight = shape.length * cellSize;
        const startX = (width - pieceWidth) / 2;
        const startY = (height - pieceHeight) / 2;

        // Set opacity if can't hold
        ctx.globalAlpha = canHold ? 1 : 0.3;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = startX + col * cellSize;
                    const y = startY + row * cellSize;

                    this.drawMiniCell(ctx, x, y, cellSize - 2, tetromino.color);
                }
            }
        }

        ctx.globalAlpha = 1;
    }

    /**
     * Update next pieces display
     * @param {string[]} pieces - Array of next piece types
     */
    updateNext(pieces) {
        const nextContainer = this.elements.nextContainer;
        if (!nextContainer) return;

        // Clear existing
        nextContainer.innerHTML = '';

        pieces.forEach((pieceType, index) => {
            const canvas = document.createElement('canvas');
            canvas.className = 'next-piece-canvas';
            canvas.width = 80;
            canvas.height = 60;

            const ctx = canvas.getContext('2d');
            const tetromino = TETROMINOES[pieceType];
            if (!tetromino) return;

            const shape = tetromino.states[0];
            const cellSize = Math.min(
                (canvas.width - 10) / shape[0].length,
                (canvas.height - 10) / shape.length,
                18
            );

            // Center the piece
            const pieceWidth = shape[0].length * cellSize;
            const pieceHeight = shape.length * cellSize;
            const startX = (canvas.width - pieceWidth) / 2;
            const startY = (canvas.height - pieceHeight) / 2;

            // Fade out for pieces further in queue
            ctx.globalAlpha = 1 - (index * 0.15);

            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = startX + col * cellSize;
                        const y = startY + row * cellSize;

                        this.drawMiniCell(ctx, x, y, cellSize - 2, tetromino.color);
                    }
                }
            }

            nextContainer.appendChild(canvas);
        });
    }

    /**
     * Draw a mini cell for preview displays
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Cell size
     * @param {string} color - Cell color
     */
    drawMiniCell(ctx, x, y, size, color) {
        // Main color
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, size, size / 3);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x, y + size - size / 4, size, size / 4);
    }

    /**
     * Show line clear notification
     * @param {number} count - Lines cleared
     * @param {number} points - Points earned
     */
    showLineClear(count, points) {
        const notification = this.elements.notification;
        if (!notification) return;

        let text = '';
        switch (count) {
            case 1: text = 'Single'; break;
            case 2: text = 'Double'; break;
            case 3: text = 'Triple'; break;
            case 4: text = 'TETRIS!'; break;
        }

        notification.textContent = `${text} +${points}`;
        notification.className = 'notification show';

        setTimeout(() => {
            notification.className = 'notification';
        }, 1000);
    }

    /**
     * Show level up notification
     * @param {number} level - New level
     */
    showLevelUp(level) {
        const notification = this.elements.notification;
        if (!notification) return;

        notification.textContent = `Niveau ${level}!`;
        notification.className = 'notification level-up show';

        setTimeout(() => {
            notification.className = 'notification';
        }, 1500);
    }

    /**
     * Reset stats display
     */
    reset() {
        this.animatedScore = 0;
        this.targetScore = 0;

        if (this.elements.score) this.elements.score.textContent = '0';
        if (this.elements.level) this.elements.level.textContent = '1';
        if (this.elements.lines) this.elements.lines.textContent = '0';

        this.updateHold(null);
        this.updateNext([]);
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

export default Stats;
