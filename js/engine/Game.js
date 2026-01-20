/**
 * @fileoverview Main game controller and loop
 * Manages game state, timing, and coordinates all systems
 */

import { Board } from './Board.js';
import { Piece, PieceBag } from './Piece.js';
import { EventEmitter, globalEvents } from '../utils/EventEmitter.js';
import config from '../utils/Config.js';

/**
 * Game states enum
 */
export const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LINE_CLEAR: 'lineClear'
};

/**
 * Main game class
 */
export class Game extends EventEmitter {
    constructor() {
        super();

        this.board = null;
        this.currentPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        this.pieceBag = null;

        // Game state
        this.state = GameState.MENU;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.backToBack = false;

        // Statistics
        this.stats = {
            piecesPlaced: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            hardDrops: 0,
            softDropCells: 0,
            startTime: null,
            playTime: 0
        };

        // Timing
        this.lastTime = 0;
        this.dropTimer = 0;
        this.lockTimer = 0;
        this.lockMoves = 0;
        this.lineClearTimer = 0;

        // Animation frame ID
        this.animationId = null;

        // Roguelite system reference (set externally)
        this.rogueliteSystem = null;

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Get drop interval based on level (NES Tetris formula)
     * @returns {number} Drop interval in milliseconds
     */
    getDropInterval() {
        // NES Tetris speed curve approximation
        const framesPerDrop = [
            48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
            5, 5, 5, 4, 4, 4, 3, 3, 3, 2,
            2, 2, 2, 2, 2, 2, 2, 2, 2, 1
        ];
        const levelIndex = Math.min(this.level - 1, framesPerDrop.length - 1);
        // Convert frames (60fps) to milliseconds
        let interval = (framesPerDrop[levelIndex] / 60) * 1000;

        // Apply roguelite modifiers if available
        if (this.rogueliteSystem) {
            interval = this.rogueliteSystem.getModifiedDropInterval(interval);
        }

        return interval;
    }

    /**
     * Start a new game
     */
    start() {
        // Initialize board
        this.board = new Board(
            config.get('game.boardWidth'),
            config.get('game.boardHeight'),
            config.get('game.hiddenRows')
        );

        // Initialize piece bag
        this.pieceBag = new PieceBag();

        // Reset state
        this.score = 0;
        this.level = config.get('game.initialLevel') || 1;
        this.lines = 0;
        this.combo = 0;
        this.backToBack = false;
        this.holdPiece = null;
        this.canHold = true;

        // Reset stats
        this.stats = {
            piecesPlaced: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            hardDrops: 0,
            softDropCells: 0,
            startTime: Date.now(),
            playTime: 0
        };

        // Spawn first piece
        this.spawnPiece();

        // Start game loop
        this.state = GameState.PLAYING;
        this.lastTime = performance.now();
        this.dropTimer = 0;
        this.lockTimer = 0;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animationId = requestAnimationFrame(this.gameLoop);

        this.emit('gameStart');
        globalEvents.emit('gameStart');
    }

    /**
     * Main game loop
     * @param {number} timestamp - Current timestamp
     */
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.state === 'frozen') {
            // Do nothing but render static frame
        } else if (this.state === GameState.PLAYING) {
            this.update(deltaTime);
        } else if (this.state === GameState.LINE_CLEAR) {
            this.lineClearTimer -= deltaTime;
            if (this.lineClearTimer <= 0) {
                // Only switch to PLAYING if not frozen externally
                if (this.state !== 'frozen') {
                    this.state = GameState.PLAYING;
                    this.spawnPiece();
                }
            }
        }

        this.emit('render');
        globalEvents.emit('render');

        this.animationId = requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.currentPiece) return;

        // Update drop timer
        this.dropTimer += deltaTime;

        const dropInterval = this.getDropInterval();

        if (this.dropTimer >= dropInterval) {
            this.dropTimer -= dropInterval;

            // Try to move piece down
            if (this.canMove(0, 1)) {
                this.currentPiece.y++;
                this.lockTimer = 0;
                this.emit('pieceMoved');
            } else {
                // Piece can't move down, start lock timer
                this.lockTimer += deltaTime;

                const lockDelay = config.get('game.lockDelay');
                const lockMoveLimit = config.get('game.lockMoveLimit');

                if (this.lockTimer >= lockDelay || this.lockMoves >= lockMoveLimit) {
                    this.lockPiece();
                }
            }
        }

        // Check if piece is on ground (for lock timer in between drops)
        if (!this.canMove(0, 1)) {
            this.lockTimer += deltaTime;
            const lockDelay = config.get('game.lockDelay');
            if (this.lockTimer >= lockDelay) {
                this.lockPiece();
            }
        }
    }

    /**
     * Spawn a new piece
     */
    spawnPiece() {
        const type = this.pieceBag.next();
        this.currentPiece = new Piece(type);
        this.canHold = true;
        this.lockTimer = 0;
        this.lockMoves = 0;

        // Check if spawn position is valid
        if (!this.board.isValidPosition(
            this.currentPiece.x,
            this.currentPiece.y,
            this.currentPiece.getShape()
        )) {
            this.gameOver();
            return;
        }

        this.emit('pieceSpawned', this.currentPiece);
        globalEvents.emit('pieceSpawned', this.currentPiece);
    }

    /**
     * Lock current piece to board
     */
    lockPiece() {
        if (!this.currentPiece) return;

        // Verglas effect: Slide piece before locking
        if (this.iceSlide) {
            const slideDir = Math.random() > 0.5 ? 1 : -1;
            if (this.canMove(slideDir, 0)) {
                this.currentPiece.x += slideDir;
                globalEvents.emit('notification', { text: '🧊 Glissade !', type: 'info' });
            } else if (this.canMove(-slideDir, 0)) {
                this.currentPiece.x -= slideDir;
                globalEvents.emit('notification', { text: '🧊 Glissade !', type: 'info' });
            }
        }

        // Prepare pixel options based on piece flags
        const pixelOptions = {
            isGold: this.currentPiece.isGold || false,
            isCleaner: this.currentPiece.hasCleaner || false,
            health: this.currentPiece.isStone ? 2 : 1
        };

        const success = this.board.lockPiece(this.currentPiece, pixelOptions);
        this.stats.piecesPlaced++;

        // Apply granular gravity if piece was unstable
        if (this.currentPiece.isUnstable) {
            this.board.applyGranularGravity();
        }

        this.emit('pieceLocked', this.currentPiece);
        globalEvents.emit('pieceLocked', this.currentPiece);

        if (!success || this.board.isGameOver()) {
            this.gameOver();
            return;
        }

        // Check for line clears
        const { count, rows, goldCount, scoreMultiplier } = this.board.clearLines();

        if (count > 0) {
            this.handleLineClears(count, rows, goldCount, scoreMultiplier);
        } else {
            this.combo = 0;
            this.spawnPiece();
        }
    }

    /**
     * Handle line clears and scoring
     * @param {number} count - Number of lines cleared
     * @param {number[]} rows - Row indices that were cleared
     * @param {number} goldCount - Number of gold pixels in cleared lines
     * @param {number} scoreMultiplier - Score multiplier from gold pixels
     */
    handleLineClears(count, rows, goldCount = 0, scoreMultiplier = 1) {
        // Update stats
        if (count === 1) this.stats.singles++;
        else if (count === 2) this.stats.doubles++;
        else if (count === 3) this.stats.triples++;
        else if (count === 4) this.stats.tetrises++;

        // Calculate score
        let baseScore;
        switch (count) {
            case 1: baseScore = 100; break;
            case 2: baseScore = 300; break;
            case 3: baseScore = 500; break;
            case 4: baseScore = 800; break;
            default: baseScore = 0;
        }

        let points = baseScore * this.level;

        // Back-to-back bonus for Tetris
        if (count === 4) {
            if (this.backToBack) {
                points = Math.floor(points * 1.5);
            }
            this.backToBack = true;
        } else {
            this.backToBack = false;
        }

        // Combo bonus
        if (this.combo > 0) {
            points += 50 * this.combo * this.level;
        }
        this.combo++;

        // Apply gold multiplier
        if (scoreMultiplier > 1) {
            points = Math.floor(points * scoreMultiplier);
            globalEvents.emit('goldBonus', { goldCount, multiplier: scoreMultiplier, points });
        }

        this.score += points;
        this.lines += count;

        // Check for level up
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.emit('levelUp', this.level);
            globalEvents.emit('levelUp', this.level);
        }

        this.emit('linesCleared', { count, rows, points, goldCount });
        globalEvents.emit('linesCleared', { count, rows, points, goldCount });

        // Line clear animation delay
        this.state = GameState.LINE_CLEAR;
        this.lineClearTimer = 300; // 300ms animation
    }

    /**
     * Check if current piece can move by offset
     * @param {number} dx - X offset
     * @param {number} dy - Y offset
     * @returns {boolean}
     */
    canMove(dx, dy) {
        if (!this.currentPiece) return false;

        return this.board.isValidPosition(
            this.currentPiece.x + dx,
            this.currentPiece.y + dy,
            this.currentPiece.getShape()
        );
    }

    /**
     * Move piece left
     * @returns {boolean} Success
     */
    moveLeft() {
        if (this.state !== GameState.PLAYING || !this.currentPiece) return false;

        if (this.canMove(-1, 0)) {
            this.currentPiece.x--;
            this.resetLockTimer();
            this.emit('pieceMoved');
            globalEvents.emit('pieceMoved');
            return true;
        }
        return false;
    }

    /**
     * Move piece right
     * @returns {boolean} Success
     */
    moveRight() {
        if (this.state !== GameState.PLAYING || !this.currentPiece) return false;

        if (this.canMove(1, 0)) {
            this.currentPiece.x++;
            this.resetLockTimer();
            this.emit('pieceMoved');
            globalEvents.emit('pieceMoved');
            return true;
        }
        return false;
    }

    /**
     * Soft drop (move down one cell)
     * @returns {boolean} Success
     */
    softDrop() {
        if (this.state !== GameState.PLAYING || !this.currentPiece) return false;

        if (this.canMove(0, 1)) {
            this.currentPiece.y++;
            this.dropTimer = 0;
            this.score += 1;
            this.stats.softDropCells++;
            this.emit('pieceMoved');
            globalEvents.emit('softDrop');
            return true;
        }
        return false;
    }

    /**
     * Hard drop (instant drop)
     */
    hardDrop() {
        if (this.state !== GameState.PLAYING || !this.currentPiece) return false;

        let dropDistance = 0;

        while (this.canMove(0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }

        this.score += dropDistance * 2;
        this.stats.hardDrops++;

        this.emit('hardDrop', dropDistance);
        globalEvents.emit('hardDrop', dropDistance);

        this.lockPiece();
        return true;
    }

    /**
     * Rotate piece
     * @param {boolean} clockwise - True for clockwise
     * @returns {boolean} Success
     */
    rotate(clockwise = true) {
        if (this.state !== GameState.PLAYING || !this.currentPiece) return false;

        const currentState = this.currentPiece.rotation;
        const newState = this.currentPiece.getRotatedState(clockwise);
        const newShape = this.currentPiece.states[newState];
        const wallKicks = this.currentPiece.getWallKicks(currentState, newState);

        // Try each wall kick offset
        for (const [dx, dy] of wallKicks) {
            if (this.board.isValidPosition(
                this.currentPiece.x + dx,
                this.currentPiece.y - dy, // SRS uses inverted Y for kicks
                newShape
            )) {
                this.currentPiece.x += dx;
                this.currentPiece.y -= dy;
                this.currentPiece.rotation = newState;
                this.resetLockTimer();
                this.emit('pieceRotated');
                globalEvents.emit('pieceRotated');
                return true;
            }
        }

        return false;
    }

    /**
     * Hold current piece
     * @returns {boolean} Success
     */
    hold() {
        if (this.state !== GameState.PLAYING || !this.currentPiece) {
            return false;
        }

        // Bloc d'Or: disable hold on gold pieces
        if (this.currentPiece.isGold) {
            globalEvents.emit('notification', { text: '💰 Hold désactivé (pièce dorée)', type: 'warning' });
            return false;
        }

        // Check if hold is allowed (unless infinite or double hold)
        if (!this.canHold && !this.infiniteHold && !this.allowDoubleHold) {
            return false;
        }

        const currentType = this.currentPiece.type;

        if (this.holdPiece) {
            // Swap with held piece
            this.currentPiece = new Piece(this.holdPiece);
        } else {
            // No held piece, spawn new one
            this.currentPiece = null;
            this.spawnPiece();
        }

        this.holdPiece = currentType;

        // Réserve Infinie: always allow hold
        if (!this.infiniteHold) {
            // Échangeur Risqué: allow double hold (2 in a row)
            if (this.allowDoubleHold) {
                this._holdUseCount = (this._holdUseCount || 0) + 1;
                if (this._holdUseCount >= 2) {
                    this.canHold = false;
                    this._holdUseCount = 0;
                }
            } else {
                this.canHold = false;
            }
        }

        this.lockTimer = 0;
        this.lockMoves = 0;

        this.emit('hold', this.holdPiece);
        globalEvents.emit('hold', this.holdPiece);

        // If we swapped, spawn the held piece
        if (this.currentPiece === null) {
            this.spawnPiece();
        }

        return true;
    }

    /**
     * Reset lock timer (called on movement)
     */
    resetLockTimer() {
        if (!this.canMove(0, 1)) {
            this.lockMoves++;
            this.lockTimer = 0;
        }
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.emit('paused');
            globalEvents.emit('paused');
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.lastTime = performance.now();
            this.emit('resumed');
            globalEvents.emit('resumed');
        }
    }

    /**
     * Handle game over
     */
    gameOver() {
        this.state = GameState.GAME_OVER;
        this.stats.playTime = Date.now() - this.stats.startTime;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        const gameData = {
            score: this.score,
            level: this.level,
            lines: this.lines,
            stats: { ...this.stats }
        };

        this.emit('gameOver', gameData);
        globalEvents.emit('gameOver', gameData);
    }

    /**
     * Get preview of next pieces
     * @param {number} count - Number of pieces to preview
     * @returns {string[]} Array of piece types
     */
    getNextPieces(count = 5) {
        return this.pieceBag.preview(count);
    }

    /**
     * Get ghost piece Y position
     * @returns {number} Y position where piece would land
     */
    getGhostY() {
        if (!this.currentPiece) return 0;

        return this.currentPiece.getGhostY(
            (x, y, shape) => this.board.isValidPosition(x, y, shape)
        );
    }

    /**
     * Get current game state for rendering
     * @returns {Object} Game state
     */
    getRenderState() {
        return {
            board: this.board?.getVisibleGrid(),
            currentPiece: this.currentPiece,
            ghostY: this.getGhostY(),
            holdPiece: this.holdPiece,
            canHold: this.canHold,
            nextPieces: this.getNextPieces(config.get('game.nextPreview')),
            score: this.score,
            level: this.level,
            lines: this.lines,
            state: this.state
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.removeAllListeners();
    }
}

export default Game;
