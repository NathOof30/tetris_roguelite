/**
 * @fileoverview Weighted piece generator for roguelite system
 * Replaces standard 7-bag with probability-based selection
 */

/**
 * PieceGenerator - Weighted random piece selection
 * Respects modifier weight adjustments
 */
export class PieceGenerator {
    /**
     * @param {ModifierManager} modifierManager - Modifier manager instance
     */
    constructor(modifierManager) {
        this.modifierManager = modifierManager;
        this.pieceTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        // Preview queue for upcoming pieces
        this.queue = [];
        this.fillQueue(10);
    }

    /**
     * Fill the preview queue
     * @param {number} count - Number of pieces to generate
     */
    fillQueue(count) {
        while (this.queue.length < count) {
            this.queue.push(this.generateWeightedPiece());
        }
    }

    /**
     * Generate a piece using weighted random selection
     * @returns {string} Piece type
     */
    generateWeightedPiece() {
        const weights = this.modifierManager
            ? this.modifierManager.getPieceWeights()
            : { I: 1, O: 1, T: 1, S: 1, Z: 1, J: 1, L: 1 };

        // Calculate total weight
        let totalWeight = 0;
        for (const type of this.pieceTypes) {
            totalWeight += weights[type] || 1;
        }

        // Random value in range [0, totalWeight)
        let random = Math.random() * totalWeight;

        // Find the piece
        for (const type of this.pieceTypes) {
            random -= weights[type] || 1;
            if (random <= 0) {
                return type;
            }
        }

        // Fallback (shouldn't happen)
        return this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
    }

    /**
     * Get next piece type
     * @returns {string} Piece type
     */
    next() {
        this.fillQueue(10);
        return this.queue.shift();
    }

    /**
     * Preview upcoming pieces
     * @param {number} count - Number of pieces to preview
     * @returns {string[]} Array of piece types
     */
    preview(count = 5) {
        this.fillQueue(count + 5);
        return [...this.queue.slice(0, count)];
    }

    /**
     * Reset the generator
     */
    reset() {
        this.queue = [];
        this.fillQueue(10);
    }
}

export default PieceGenerator;
