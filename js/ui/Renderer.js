/**
 * @fileoverview Canvas renderer for Tetris game
 * Handles all visual rendering with optimizations
 */

import { TETROMINOES } from '../engine/Piece.js';
import config from '../utils/Config.js';

/**
 * Game renderer class
 */
export class Renderer {
    /**
     * Create renderer
     * @param {HTMLCanvasElement} canvas - Main game canvas
     * @param {Object} options - Renderer options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Board dimensions
        this.boardWidth = options.boardWidth || 10;
        this.boardHeight = options.boardHeight || 20;

        // Cell size (calculated on resize)
        this.cellSize = 30;
        this.padding = 2;

        // Colors and theming
        this.updateTheme();

        // Animation state
        this.lineClearAnimation = null;
        this.particles = [];

        // Initial resize
        this.resize();

        // Listen for resize
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Update theme colors
     */
    updateTheme() {
        const theme = config.get('visual.theme') || 'dark';

        if (theme === 'dark') {
            this.colors = {
                background: '#0a0a0f',
                grid: 'rgba(255, 255, 255, 0.08)',
                gridBorder: 'rgba(255, 255, 255, 0.15)',
                ghost: 'rgba(255, 255, 255, 0.2)',
                text: '#ffffff',
                textSecondary: '#888888'
            };
        } else {
            this.colors = {
                background: '#f0f0f5',
                grid: 'rgba(0, 0, 0, 0.05)',
                gridBorder: 'rgba(0, 0, 0, 0.1)',
                ghost: 'rgba(0, 0, 0, 0.15)',
                text: '#1a1a1f',
                textSecondary: '#666666'
            };
        }
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 40;

        // Calculate cell size to fit
        const cellFromWidth = Math.floor(maxWidth / this.boardWidth);
        const cellFromHeight = Math.floor(maxHeight / this.boardHeight);

        this.cellSize = Math.min(cellFromWidth, cellFromHeight, 35);
        this.cellSize = Math.max(this.cellSize, 20); // Minimum size

        // Set canvas size
        this.canvas.width = this.cellSize * this.boardWidth;
        this.canvas.height = this.cellSize * this.boardHeight;

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        if (dpr > 1) {
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
            this.canvas.width *= dpr;
            this.canvas.height *= dpr;
            this.ctx.scale(dpr, dpr);
        }
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw the grid
     */
    drawGrid() {
        const opacity = config.get('visual.gridOpacity') || 0.15;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize, 0);
            this.ctx.lineTo(x * this.cellSize, this.boardHeight * this.cellSize);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize);
            this.ctx.lineTo(this.boardWidth * this.cellSize, y * this.cellSize);
            this.ctx.stroke();
        }
    }

    /**
     * Draw a single cell
     * @param {number} x - Grid X
     * @param {number} y - Grid Y
     * @param {string} color - Cell color
     * @param {Object} options - Draw options
     */
    drawCell(x, y, color, options = {}) {
        const {
            ghost = false,
            pattern = null,
            colorblind = false,
            isGold = false,
            isRusted = false,
            isCracked = false,
            isCleaner = false,
            isIce = false,
            isSand = false
        } = options;

        const size = this.cellSize - this.padding * 2;
        const px = x * this.cellSize + this.padding;
        const py = y * this.cellSize + this.padding;

        if (ghost) {
            // Ghost piece - outline only
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px, py, size, size);
            return;
        }

        // Determine actual color based on special states
        let displayColor = color;
        if (isGold) {
            displayColor = '#ffd700'; // Gold
        } else if (isRusted) {
            displayColor = '#8b4513'; // Rust brown
        }

        // Main cell color
        this.ctx.fillStyle = displayColor;
        this.ctx.fillRect(px, py, size, size);

        // Gradient highlight
        const gradient = this.ctx.createLinearGradient(px, py, px, py + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(px, py, size, size);

        // 3D border effect
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py + size);
        this.ctx.lineTo(px, py);
        this.ctx.lineTo(px + size, py);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(px + size, py);
        this.ctx.lineTo(px + size, py + size);
        this.ctx.lineTo(px, py + size);
        this.ctx.stroke();

        // Special effects for special blocks
        if (isGold) {
            // Gold sparkle effect
            this.ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(px + size * 0.3, py + size * 0.3, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(px + size * 0.7, py + size * 0.5, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (isCracked) {
            // Cracked stone effect
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(px + size * 0.2, py);
            this.ctx.lineTo(px + size * 0.5, py + size * 0.4);
            this.ctx.lineTo(px + size * 0.3, py + size);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(px + size * 0.5, py + size * 0.4);
            this.ctx.lineTo(px + size * 0.8, py + size * 0.7);
            this.ctx.stroke();
        }

        if (isIce) {
            // Ice efffect: glossy cyan/white
            this.ctx.fillStyle = 'rgba(200, 240, 255, 0.4)';
            this.ctx.fillRect(px, py, size, size);

            // Glint
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.moveTo(px + size * 0.7, py);
            this.ctx.lineTo(px + size, py);
            this.ctx.lineTo(px + size, py + size * 0.3);
            this.ctx.fill();
        }

        if (isSand) {
            // Sand effect: beige + noise
            this.ctx.fillStyle = '#e6c288'; // Sand beige
            this.ctx.fillRect(px, py, size, size);

            // Noise/Grains
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            for (let i = 0; i < 6; i++) {
                const nx = px + Math.random() * size;
                const ny = py + Math.random() * size;
                this.ctx.fillRect(nx, ny, 2, 2);
            }
        }

        if (isRusted) {
            // Rust texture - Enhanced
            this.ctx.fillStyle = '#8b4513'; // Base rust
            this.ctx.fillRect(px, py, size, size);

            this.ctx.fillStyle = 'rgba(60, 20, 0, 0.4)';
            for (let i = 0; i < 8; i++) {
                const rx = px + Math.random() * size;
                const ry = py + Math.random() * size;
                this.ctx.fillRect(rx, ry, Math.random() * 3 + 1, Math.random() * 3 + 1);
            }
        }

        if (isCleaner) {
            // Cleaner: Glass-like transparent green
            this.ctx.fillStyle = 'rgba(50, 255, 100, 0.3)'; // Green tint
            this.ctx.fillRect(px, py, size, size);

            // Cleaner glow border
            this.ctx.strokeStyle = 'rgba(100, 255, 150, 0.9)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

            // Sparkle
            if (Math.random() < 0.05) {
                this.ctx.fillStyle = '#ffffff';
                const sx = px + Math.random() * size;
                const sy = py + Math.random() * size;
                this.ctx.fillRect(sx, sy, 2, 2);
            }
        }

        // Colorblind pattern
        if (colorblind && pattern) {
            this.drawPattern(px, py, size, pattern);
        }
    }

    /**
     * Draw colorblind pattern on cell
     * @param {number} x - Pixel X
     * @param {number} y - Pixel Y
     * @param {number} size - Cell size
     * @param {string} pattern - Pattern type
     */
    drawPattern(x, y, size, pattern) {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;

        const center = size / 2;

        switch (pattern) {
            case 'stripe':
                for (let i = 0; i < size; i += 6) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + i, y);
                    this.ctx.lineTo(x + i, y + size);
                    this.ctx.stroke();
                }
                break;
            case 'dots':
                this.ctx.beginPath();
                this.ctx.arc(x + center, y + center, size / 4, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
            case 'cross':
                this.ctx.beginPath();
                this.ctx.moveTo(x + center, y + 4);
                this.ctx.lineTo(x + center, y + size - 4);
                this.ctx.moveTo(x + 4, y + center);
                this.ctx.lineTo(x + size - 4, y + center);
                this.ctx.stroke();
                break;
            case 'zigzag':
                this.ctx.beginPath();
                for (let i = 0; i < size; i += 8) {
                    this.ctx.lineTo(x + i, y + (i % 16 < 8 ? 4 : size - 4));
                }
                this.ctx.stroke();
                break;
            case 'corner':
                this.ctx.beginPath();
                this.ctx.moveTo(x + 4, y + 4);
                this.ctx.lineTo(x + 4, y + size - 4);
                this.ctx.lineTo(x + size - 4, y + size - 4);
                this.ctx.stroke();
                break;
        }
    }

    /**
     * Draw the locked pieces on the board
     * @param {Object} boardData - Board grid data
     */
    drawBoard(boardData) {
        const { grid } = boardData;
        const colorblind = config.get('accessibility.colorblindMode');

        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const pixel = grid[y][x];
                if (pixel && pixel.filled !== false) {
                    this.drawCell(x, y, pixel.color, {
                        pattern: pixel.pattern,
                        colorblind,
                        isGold: pixel.isGold,
                        isRusted: pixel.isRusted,
                        isCracked: pixel.isCracked,
                        isCleaner: pixel.isCleaner,
                        isIce: pixel.isIce,
                        isSand: pixel.isSand
                    });
                }
            }
        }
    }

    /**
     * Draw the current piece
     * @param {import('../engine/Piece.js').Piece} piece - Current piece
     * @param {number} hiddenRows - Number of hidden rows
     */
    drawPiece(piece, hiddenRows = 2) {
        if (!piece) return;

        const shape = piece.getShape();
        const colorblind = config.get('accessibility.colorblindMode');

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const y = piece.y + row - hiddenRows;
                    if (y >= 0) {
                        this.drawCell(piece.x + col, y, piece.color, {
                            pattern: piece.pattern,
                            colorblind,
                            isGold: piece.isGold,
                            isCleaner: piece.hasCleaner,
                            isRusted: piece.isRusted, // Although usually applied to board
                            isIce: piece.isIce,
                            isSand: piece.isSand
                        });
                    }
                }
            }
        }
    }

    /**
     * Draw ghost piece
     * @param {import('../engine/Piece.js').Piece} piece - Current piece
     * @param {number} ghostY - Ghost Y position
     * @param {number} hiddenRows - Number of hidden rows
     */
    drawGhost(piece, ghostY, hiddenRows = 2) {
        if (!piece || !config.get('game.ghostPiece')) return;

        const shape = piece.getShape();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const y = ghostY + row - hiddenRows;
                    if (y >= 0) {
                        this.drawCell(piece.x + col, y, piece.color, { ghost: true });
                    }
                }
            }
        }
    }

    /**
     * Render full game state
     * @param {Object} state - Game render state
     */
    render(state) {
        this.clear();
        this.drawGrid();

        if (state.board) {
            this.drawBoard(state.board);
        }

        if (state.currentPiece && state.ghostY !== undefined) {
            this.drawGhost(state.currentPiece, state.ghostY);
        }

        if (state.currentPiece) {
            this.drawPiece(state.currentPiece);
        }

        // Draw line clear animation
        if (this.lineClearAnimation) {
            this.renderLineClearAnimation();
        }

        // Draw particles
        this.updateParticles();
    }

    /**
     * Start line clear animation
     * @param {number[]} rows - Rows being cleared
     */
    startLineClearAnimation(rows) {
        this.lineClearAnimation = {
            rows: rows.map(r => r - 2), // Adjust for hidden rows
            progress: 0,
            startTime: performance.now()
        };
    }

    /**
     * Render line clear animation
     */
    renderLineClearAnimation() {
        const anim = this.lineClearAnimation;
        const elapsed = performance.now() - anim.startTime;
        anim.progress = Math.min(elapsed / 300, 1);

        // Flash effect
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - anim.progress)})`;

        for (const row of anim.rows) {
            if (row >= 0) {
                this.ctx.fillRect(
                    0,
                    row * this.cellSize,
                    this.boardWidth * this.cellSize,
                    this.cellSize
                );
            }
        }

        if (anim.progress >= 1) {
            this.lineClearAnimation = null;
        }
    }

    /**
     * Add particles for effects
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    addParticles(x, y, color, count = 10) {
        if (!config.get('visual.particleEffects')) return;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                color,
                life: 1,
                size: Math.random() * 4 + 2
            });
        }
    }

    /**
     * Update and draw particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.life -= 0.02;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw a mini tetromino (for hold/next display)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} type - Piece type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} cellSize - Cell size
     */
    drawMiniPiece(ctx, type, x, y, cellSize = 15) {
        const tetromino = TETROMINOES[type];
        if (!tetromino) return;

        const shape = tetromino.states[0];
        const color = tetromino.color;

        // Center the piece
        const width = shape[0].length * cellSize;
        const height = shape.length * cellSize;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const px = x + col * cellSize;
                    const py = y + row * cellSize;

                    ctx.fillStyle = color;
                    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

                    // Simple highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(px + 1, py + 1, cellSize - 2, 2);
                }
            }
        }
    }

    /**
     * Clean up
     */
    destroy() {
        window.removeEventListener('resize', this.resize);
    }
}

export default Renderer;
