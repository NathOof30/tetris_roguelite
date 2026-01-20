/**
 * @fileoverview Tetromino piece definitions and SRS rotation system
 * Implements all 7 standard pieces with wall kick data
 */

/**
 * Tetromino shapes in all rotation states
 * Each piece has 4 rotation states (0, 1, 2, 3)
 * Shapes are defined as [row][col] where 1 = filled
 */
export const TETROMINOES = {
    I: {
        color: '#00f5ff', // Cyan
        pattern: 'stripe',
        states: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
        ]
    },
    O: {
        color: '#ffea00', // Yellow
        pattern: 'dots',
        states: [
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
        ]
    },
    T: {
        color: '#b24bf3', // Purple
        pattern: 'cross',
        states: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
        ]
    },
    S: {
        color: '#4ade80', // Green
        pattern: 'zigzag',
        states: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
        ]
    },
    Z: {
        color: '#f43f5e', // Red
        pattern: 'zigzag-reverse',
        states: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
            [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
        ]
    },
    J: {
        color: '#3b82f6', // Blue
        pattern: 'corner',
        states: [
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
        ]
    },
    L: {
        color: '#f97316', // Orange
        pattern: 'corner-reverse',
        states: [
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
        ]
    }
};

/**
 * SRS Wall Kick Data
 * Defines offset tests for rotation
 * Format: [currentState][targetState] = [[dx, dy], ...]
 */
const WALL_KICKS = {
    // For J, L, S, T, Z pieces
    JLSTZ: {
        '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    },
    // For I piece (different offsets)
    I: {
        '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    },
    // O piece doesn't rotate visibly
    O: {
        '0>1': [[0, 0]], '1>0': [[0, 0]],
        '1>2': [[0, 0]], '2>1': [[0, 0]],
        '2>3': [[0, 0]], '3>2': [[0, 0]],
        '3>0': [[0, 0]], '0>3': [[0, 0]],
    }
};

/**
 * Piece class representing an active tetromino
 */
export class Piece {
    /**
     * Create a new piece
     * @param {string} type - Piece type (I, O, T, S, Z, J, L)
     */
    constructor(type) {
        const tetromino = TETROMINOES[type];
        if (!tetromino) {
            throw new Error(`Unknown piece type: ${type}`);
        }

        this.type = type;
        this.color = tetromino.color;
        this.pattern = tetromino.pattern;
        this.states = tetromino.states;
        this.rotation = 0;

        // Special piece flags for roguelite modifiers
        this.isGold = false;        // Gold piece (score multiplier, disables hold)
        this.isUnstable = false;    // Unstable piece (granular gravity)
        this.hasCleaner = false;    // Has cleaner pixel
        this.isStone = false;       // Stone piece (health = 2)

        // Starting position (centered, above visible board)
        const shape = this.getShape();
        this.x = Math.floor((10 - shape[0].length) / 2);
        this.y = type === 'I' ? -1 : 0;
    }

    /**
     * Get current shape matrix
     * @returns {number[][]} Shape matrix
     */
    getShape() {
        return this.states[this.rotation];
    }

    /**
     * Get wall kick data for rotation
     * @param {number} fromState - Current rotation state
     * @param {number} toState - Target rotation state
     * @returns {number[][]} Array of [dx, dy] offsets to try
     */
    getWallKicks(fromState, toState) {
        const kickData = this.type === 'I' ? WALL_KICKS.I :
            this.type === 'O' ? WALL_KICKS.O :
                WALL_KICKS.JLSTZ;
        return kickData[`${fromState}>${toState}`] || [[0, 0]];
    }

    /**
     * Rotate piece (returns new rotation state, doesn't modify)
     * @param {boolean} clockwise - True for clockwise rotation
     * @returns {number} New rotation state
     */
    getRotatedState(clockwise = true) {
        if (clockwise) {
            return (this.rotation + 1) % 4;
        }
        return (this.rotation + 3) % 4;
    }

    /**
     * Get piece cells with absolute positions
     * @returns {{ x: number, y: number }[]} Array of cell positions
     */
    getCells() {
        const cells = [];
        const shape = this.getShape();

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    cells.push({
                        x: this.x + col,
                        y: this.y + row
                    });
                }
            }
        }

        return cells;
    }

    /**
     * Get ghost piece position (where piece would land)
     * @param {function} isValidPosition - Function to check position validity
     * @returns {number} Y position where piece would land
     */
    getGhostY(isValidPosition) {
        let ghostY = this.y;

        while (isValidPosition(this.x, ghostY + 1, this.getShape())) {
            ghostY++;
        }

        return ghostY;
    }

    /**
     * Clone the piece
     * @returns {Piece} Cloned piece
     */
    clone() {
        const piece = new Piece(this.type);
        piece.x = this.x;
        piece.y = this.y;
        piece.rotation = this.rotation;
        return piece;
    }
}

/**
 * Random bag generator for fair piece distribution
 */
export class PieceBag {
    constructor() {
        this.pieces = [];
        this.refill();
    }

    /**
     * Refill the bag with all 7 pieces shuffled
     */
    refill() {
        const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

        // Fisher-Yates shuffle
        for (let i = types.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [types[i], types[j]] = [types[j], types[i]];
        }

        this.pieces.push(...types);
    }

    /**
     * Get next piece type
     * @returns {string} Piece type
     */
    next() {
        if (this.pieces.length < 7) {
            this.refill();
        }
        return this.pieces.shift();
    }

    /**
     * Preview upcoming pieces
     * @param {number} count - Number of pieces to preview
     * @returns {string[]} Array of piece types
     */
    preview(count = 5) {
        while (this.pieces.length < count) {
            this.refill();
        }
        // CRITICAL FIX: Return a copy to prevent live updates during rendering
        // Without this, the display would change as the bag refills during gameplay
        return [...this.pieces.slice(0, count)];
    }
}

export default Piece;
