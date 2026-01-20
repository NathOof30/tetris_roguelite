/**
 * @fileoverview Game board management and collision detection
 * Handles the 10x20 playfield with 2 hidden rows
 */

import { globalEvents } from '../utils/EventEmitter.js';

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

        // Initialize empty grid
        // Using 2D array for clarity (TypedArray would be faster for large grids)
        this.grid = this.createEmptyGrid();

        // Color storage for rendering locked pieces
        this.colors = this.createEmptyGrid();
        this.patterns = this.createEmptyGrid();
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
     * Reset the board to empty state
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.colors = this.createEmptyGrid();
        this.patterns = this.createEmptyGrid();
    }

    /**
     * Check if a cell is valid and empty
     * @param {number} x - Column
     * @param {number} y - Row
     * @returns {boolean} True if cell is valid and empty
     */
    isValidCell(x, y) {
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
     * @returns {boolean} True if lock was successful (not game over)
     */
    lockPiece(piece) {
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

                    this.grid[cellY][cellX] = 1;
                    this.colors[cellY][cellX] = piece.color;
                    this.patterns[cellY][cellX] = piece.pattern;
                }
            }
        }

        // Game over if any part of piece is above visible area
        return !aboveVisible;
    }

    /**
     * Clear completed lines
     * @returns {{ count: number, rows: number[] }} Number of lines cleared and their indices
     */
    clearLines() {
        const completedRows = [];

        // Find completed rows
        for (let row = this.totalHeight - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell)) {
                completedRows.push(row);
            }
        }

        if (completedRows.length === 0) {
            return { count: 0, rows: [] };
        }

        // Emit event for animation
        globalEvents.emit('linesClearing', completedRows);

        // CRITICAL FIX: Sort rows in descending order to avoid index shifting issues
        // When removing rows, we must start from the bottom to prevent indices from changing
        completedRows.sort((a, b) => b - a);

        // Remove completed rows and add empty rows at top
        for (const row of completedRows) {
            this.grid.splice(row, 1);
            this.colors.splice(row, 1);
            this.patterns.splice(row, 1);

            this.grid.unshift(Array(this.width).fill(null));
            this.colors.unshift(Array(this.width).fill(null));
            this.patterns.unshift(Array(this.width).fill(null));
        }

        return { count: completedRows.length, rows: completedRows };
    }

    /**
     * Get cell data at position
     * @param {number} x - Column
     * @param {number} y - Row (including hidden rows)
     * @returns {{ filled: boolean, color: string, pattern: string } | null}
     */
    getCell(x, y) {
        if (y < 0 || y >= this.totalHeight || x < 0 || x >= this.width) {
            return null;
        }

        if (this.grid[y][x]) {
            return {
                filled: true,
                color: this.colors[y][x],
                pattern: this.patterns[y][x]
            };
        }

        return { filled: false, color: null, pattern: null };
    }

    /**
     * Get visible grid data (excluding hidden rows)
     * @returns {{ grid: any[][], colors: any[][], patterns: any[][] }}
     */
    getVisibleGrid() {
        return {
            grid: this.grid.slice(this.hiddenRows),
            colors: this.colors.slice(this.hiddenRows),
            patterns: this.patterns.slice(this.hiddenRows)
        };
    }

    /**
     * Check if game is over (blocks in hidden rows)
     * @returns {boolean}
     */
    isGameOver() {
        for (let row = 0; row < this.hiddenRows; row++) {
            if (this.grid[row].some(cell => cell)) {
                return true;
            }
        }
        return false;
    }
}

export default Board;
