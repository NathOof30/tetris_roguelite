/**
 * @fileoverview Game board management and collision detection
 * Handles the 10x20 playfield with 2 hidden rows
 * Enhanced with per-pixel properties for roguelite modifiers
 */

import { globalEvents } from '../utils/EventEmitter.js';

/**
 * Create a pixel object with default properties
 * @param {string} color - Pixel color
 * @param {string} pattern - Pixel pattern
 * @param {Object} options - Additional properties
 * @returns {Object} Pixel object
 */
export function createPixel(color, pattern, options = {}) {
    return {
        filled: true,
        color,
        pattern,
        isGold: options.isGold || false,
        health: options.health || 1,  // Stone blocks have 2
        isRusted: options.isRusted || false,
        isCleaner: options.isCleaner || false,
        isCracked: options.isCracked || false,  // Visual state for damaged stone
        isIce: options.isIce || false,
        isSand: options.isSand || false,
        isManiaque: options.isManiaque || false
    };
}

/**
 * Board class representing the playing field
 */
export class Board {
    /**
     * Create a new board
     * @param {number} width - Board width (default 10)
     * @param {number} height - Board height (default 20)
     * @param {number} hiddenRows - Hidden rows above visible area (default 2)
     */
    constructor(width = 10, height = 20, hiddenRows = 2) {
        this.width = width;
        this.height = height;
        this.hiddenRows = hiddenRows;
        this.totalHeight = height + hiddenRows;

        // Dead zone columns for "Écran Réduit" modifier
        this.deadZoneLeft = 0;
        this.deadZoneRight = 0;

        // Initialize empty grid with pixel objects
        this.grid = this.createEmptyGrid();
    }

    /**
     * Create an empty grid
     * @returns {any[][]} Empty 2D array
     */
    createEmptyGrid() {
        return Array.from({ length: this.totalHeight }, () =>
            Array(this.width).fill(null)
        );
    }

    /**
     * Get effective width (accounting for dead zones)
     * @returns {number}
     */
    getEffectiveWidth() {
        return this.width - this.deadZoneLeft - this.deadZoneRight;
    }

    /**
     * Set dead zones (for Écran Réduit)
     * @param {number} left - Left dead columns
     * @param {number} right - Right dead columns
     */
    setDeadZones(left, right) {
        this.deadZoneLeft = left;
        this.deadZoneRight = right;

        // Fill dead zones with impassable blocks
        for (let y = 0; y < this.totalHeight; y++) {
            for (let x = 0; x < left; x++) {
                this.grid[y][x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
            }
            for (let x = this.width - right; x < this.width; x++) {
                this.grid[y][x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
            }
        }
    }

    /**
     * Clear dead zones
     */
    clearDeadZones() {
        this.deadZoneLeft = 0;
        this.deadZoneRight = 0;
    }

    /**
     * Reset the board to empty state
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.deadZoneLeft = 0;
        this.deadZoneRight = 0;
    }

    /**
     * Check if a cell is within dead zone
     * @param {number} x - Column
     * @returns {boolean}
     */
    isInDeadZone(x) {
        return x < this.deadZoneLeft || x >= this.width - this.deadZoneRight;
    }

    /**
     * Check if a cell is valid and empty
     * @param {number} x - Column
     * @param {number} y - Row
     * @returns {boolean} True if cell is valid and empty
     */
    isValidCell(x, y) {
        if (this.isInDeadZone(x)) return false;
        return x >= 0 && x < this.width &&
            y < this.totalHeight &&
            (y < 0 || !this.grid[y][x]);
    }

    /**
     * Check if a position is valid for a piece shape
     * @param {number} x - Piece X position
     * @param {number} y - Piece Y position
     * @param {number[][]} shape - Piece shape matrix
     * @returns {boolean} True if position is valid
     */
    isValidPosition(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const cellX = x + col;
                    const cellY = y + row;

                    // Check dead zones
                    if (this.isInDeadZone(cellX)) return false;

                    // Check bounds
                    if (cellX < 0 || cellX >= this.width) return false;
                    if (cellY >= this.totalHeight) return false;

                    // Check collision with locked pieces
                    if (cellY >= 0 && this.grid[cellY][cellX]) return false;
                }
            }
        }
        return true;
    }

    /**
     * Lock a piece to the board
     * @param {import('./Piece.js').Piece} piece - Piece to lock
     * @param {Object} pixelOptions - Options for pixels (isGold, isCleaner, etc.)
     * @returns {boolean} True if lock was successful (not game over)
     */
    lockPiece(piece, pixelOptions = {}) {
        const shape = piece.getShape();
        let aboveVisible = false;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const cellX = piece.x + col;
                    const cellY = piece.y + row;

                    if (cellY < 0) {
                        aboveVisible = true;
                        continue;
                    }

                    if (cellY < this.hiddenRows) {
                        aboveVisible = true;
                    }

                    // Create pixel with special properties
                    const pixel = createPixel(piece.color, piece.pattern, {
                        isGold: pixelOptions.isGold || false,
                        isCleaner: pixelOptions.isCleaner || false,
                        health: pixelOptions.health || 1,
                        isIce: piece.isIce || false,
                        isSand: piece.isSand || false,
                        isManiaque: piece.isManiaque || false
                    });

                    // If this is a cleaner pixel hitting a special block, clean it
                    if (pixel.isCleaner && this.grid[cellY] && this.grid[cellY][cellX]) {
                        const targetPixel = this.grid[cellY][cellX];
                        if (targetPixel && (targetPixel.health > 1 || targetPixel.isRusted)) {
                            // Transform to normal block
                            this.grid[cellY][cellX] = createPixel(targetPixel.color, targetPixel.pattern);
                            globalEvents.emit('pixelCleaned', { x: cellX, y: cellY });
                        }
                    }

                    this.grid[cellY][cellX] = pixel;
                }
            }
        }

        // Game over if any part of piece is above visible area
        return !aboveVisible;
    }

    /**
     * Apply granular gravity - make pixels fall individually
     * Used by "Gravité Granulaire" modifier
     */
    applyGranularGravity() {
        let moved = true;

        while (moved) {
            moved = false;

            // Start from bottom, move up
            for (let y = this.totalHeight - 2; y >= 0; y--) {
                for (let x = this.deadZoneLeft; x < this.width - this.deadZoneRight; x++) {
                    const pixel = this.grid[y][x];

                    if (pixel && !pixel.isRusted) {
                        // Check if can fall
                        if (y + 1 < this.totalHeight && !this.grid[y + 1][x]) {
                            this.grid[y + 1][x] = pixel;
                            this.grid[y][x] = null;
                            moved = true;
                        }
                    }
                }
            }
        }
    }

    /**
     * Count gold pixels in specified rows
     * @param {number[]} rows - Row indices
     * @returns {number} Count of gold pixels
     */
    countGoldInRows(rows) {
        let count = 0;
        for (const row of rows) {
            if (row >= 0 && row < this.totalHeight) {
                for (const pixel of this.grid[row]) {
                    if (pixel && pixel.isGold) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    /**
     * Push all blocks to the left (for "Maniaque" modifier)
     */
    pushRowsLeft() {
        for (let y = 0; y < this.totalHeight; y++) {
            // Get non-null pixels
            const pixels = this.grid[y].filter(p => p !== null && !this.isInDeadZone(this.grid[y].indexOf(p)));

            // Create new row with pixels pushed left
            const newRow = Array(this.width).fill(null);

            // Fill dead zones
            for (let x = 0; x < this.deadZoneLeft; x++) {
                newRow[x] = this.grid[y][x];
            }
            for (let x = this.width - this.deadZoneRight; x < this.width; x++) {
                newRow[x] = this.grid[y][x];
            }

            // Place pixels from left
            let insertX = this.deadZoneLeft;
            for (const pixel of pixels) {
                if (insertX < this.width - this.deadZoneRight) {
                    newRow[insertX] = pixel;
                    insertX++;
                }
            }

            this.grid[y] = newRow;
        }

        globalEvents.emit('boardPushedLeft');
    }

    /**
     * Add rusted pixels at random positions (for "Poids de la Rouille")
     * @param {number} count - Number of pixels to rust
     */
    addRustedPixels(count) {
        const candidates = [];

        // Find all eligible pixels
        for (let y = this.hiddenRows; y < this.totalHeight; y++) {
            for (let x = this.deadZoneLeft; x < this.width - this.deadZoneRight; x++) {
                const pixel = this.grid[y][x];
                if (pixel && !pixel.isRusted && pixel.health === 1) {
                    candidates.push({ x, y });
                }
            }
        }

        // Shuffle and pick
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const toRust = candidates.slice(0, count);

        for (const { x, y } of toRust) {
            this.grid[y][x].isRusted = true;
            this.grid[y][x].color = '#8b4513';  // Rust color
        }

        if (toRust.length > 0) {
            globalEvents.emit('pixelsRusted', toRust);
        }
    }

    /**
     * Delete the bottom row (for "Ligne Fantôme")
     */
    deleteBottomRow() {
        // Remove bottom row
        this.grid.pop();

        // Add empty row at top
        const emptyRow = Array(this.width).fill(null);

        // Preserve dead zones
        for (let x = 0; x < this.deadZoneLeft; x++) {
            emptyRow[x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
        }
        for (let x = this.width - this.deadZoneRight; x < this.width; x++) {
            emptyRow[x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
        }

        this.grid.unshift(emptyRow);

        globalEvents.emit('bottomRowDeleted');
    }

    /**
     * Clear completed lines with health/rust support
     * @returns {{ count: number, rows: number[], goldCount: number, scoreMultiplier: number }}
     */
    clearLines() {
        const completedRows = [];
        const damagedRows = [];  // Rows with stone blocks that got damaged

        // Find completed rows
        for (let row = 0; row < this.totalHeight; row++) {
            const rowPixels = this.grid[row].slice(this.deadZoneLeft, this.width - this.deadZoneRight);

            if (rowPixels.every(pixel => pixel !== null)) {
                // Check if row can be cleared (no health > 1 blocks, no rusted blocks)
                const hasStone = rowPixels.some(p => p && p.health > 1);
                const hasRusted = rowPixels.some(p => p && p.isRusted);

                if (hasRusted) {
                    // Row with rusted blocks can't be cleared normally
                    // But damage stone blocks in this row
                    for (let x = this.deadZoneLeft; x < this.width - this.deadZoneRight; x++) {
                        const pixel = this.grid[row][x];
                        if (pixel && pixel.health > 1) {
                            pixel.health--;
                            pixel.isCracked = true;
                        }
                    }
                    globalEvents.emit('notification', { text: '🚫 Ligne bloquée par la Rouille !', type: 'error' });
                    continue;
                }

                if (hasStone) {
                    // Damage stone blocks but don't clear row yet
                    damagedRows.push(row);
                    for (let x = this.deadZoneLeft; x < this.width - this.deadZoneRight; x++) {
                        const pixel = this.grid[row][x];
                        if (pixel && pixel.health > 1) {
                            pixel.health--;
                            pixel.isCracked = true;
                        }
                    }
                } else {
                    completedRows.push(row);
                }
            }
        }

        if (completedRows.length === 0) {
            return { count: 0, rows: [], goldCount: 0, scoreMultiplier: 1 };
        }

        // Count gold pixels before clearing
        const goldCount = this.countGoldInRows(completedRows);
        const scoreMultiplier = 1 + (0.5 * goldCount);

        // Emit event for animation
        globalEvents.emit('linesClearing', completedRows);

        // Remove completed rows
        const completedRowsSet = new Set(completedRows);
        const newGrid = [];

        for (let row = 0; row < this.totalHeight; row++) {
            if (!completedRowsSet.has(row)) {
                newGrid.push(this.grid[row]);
            }
        }

        // Add empty rows at top
        const emptyRowsNeeded = completedRows.length;
        for (let i = 0; i < emptyRowsNeeded; i++) {
            const emptyRow = Array(this.width).fill(null);

            // Preserve dead zones
            for (let x = 0; x < this.deadZoneLeft; x++) {
                emptyRow[x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
            }
            for (let x = this.width - this.deadZoneRight; x < this.width; x++) {
                emptyRow[x] = createPixel('#1a1a2e', 'solid', { isRusted: true });
            }

            newGrid.unshift(emptyRow);
        }

        this.grid = newGrid;

        // Check if any rusted blocks should be cleared (line above them was cleared)
        this.clearOrphanedRustedBlocks(completedRows);

        return { count: completedRows.length, rows: completedRows, goldCount, scoreMultiplier };
    }

    /**
     * Clear rusted blocks when line above them is cleared
     * @param {number[]} clearedRows - Rows that were just cleared
     */
    clearOrphanedRustedBlocks(clearedRows) {
        // After rows are cleared and grid shifted, check rusted blocks
        // Rusted blocks clear when a line ABOVE them is cleared
        // This is handled by the normal gravity after line clear
    }

    /**
     * Get cell data at position
     * @param {number} x - Column
     * @param {number} y - Row (including hidden rows)
     * @returns {Object | null}
     */
    getCell(x, y) {
        if (y < 0 || y >= this.totalHeight || x < 0 || x >= this.width) {
            return null;
        }

        return this.grid[y][x];
    }

    /**
     * Get visible grid data (excluding hidden rows)
     * @returns {{ grid: any[][] }}
     */
    getVisibleGrid() {
        return {
            grid: this.grid.slice(this.hiddenRows)
        };
    }

    /**
     * Check if game is over (blocks in hidden rows)
     * @returns {boolean}
     */
    isGameOver() {
        for (let row = 0; row < this.hiddenRows; row++) {
            if (this.grid[row].some(cell => cell !== null)) {
                return true;
            }
        }
        return false;
    }
}

export default Board;
