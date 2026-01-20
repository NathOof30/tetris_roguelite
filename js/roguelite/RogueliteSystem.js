/**
 * @fileoverview Roguelite System - Main coordinator
 * Orchestrates all roguelite components: modifiers, deals, and UI
 */

import { ModifierManager } from './ModifierManager.js';
import { ModifierPool } from './ModifierPool.js';
import { DealSystem } from './DealSystem.js';
import { PieceGenerator } from './PieceGenerator.js';
import { ModifierUI } from '../ui/ModifierUI.js';
import { globalEvents } from '../utils/EventEmitter.js';
import { GameState } from '../engine/Game.js';

/**
 * RogueliteSystem - Main coordinator for roguelite mechanics
 */
export class RogueliteSystem {
    /**
     * @param {Object} options - Configuration
     * @param {number} options.bonusThreshold - Score threshold for bonus offers
     * @param {number} options.dealThreshold - Pieces without clear for deal trigger
     */
    constructor({ bonusThreshold = 1000, dealThreshold = 10 } = {}) {
        this.bonusThreshold = bonusThreshold;
        this.dealThreshold = dealThreshold;

        this.modifierManager = new ModifierManager();
        this.modifierPool = new ModifierPool();
        this.dealSystem = new DealSystem({ threshold: dealThreshold });
        this.pieceGenerator = null; // Set after game init

        this.game = null;
        this.ui = null;

        this.lastBonusLevel = 0; // Track bonus level, not score
        this.isShowingModal = false; // Separate flag for modal state
        this._savedGameState = null; // Save game state during modal

        // Bind handlers
        this.handleScoreChange = this.handleScoreChange.bind(this);
        this.handleDealTriggered = this.handleDealTriggered.bind(this);
        this.handleGameStart = this.handleGameStart.bind(this);
    }

    /**
     * Initialize the roguelite system
     * @param {Game} game - Game instance
     */
    init(game) {
        this.game = game;

        // Initialize components
        this.modifierManager.init(game);
        this.dealSystem.init();
        this.pieceGenerator = new PieceGenerator(this.modifierManager);
        this.ui = new ModifierUI();

        // Subscribe to events
        globalEvents.on('render', this.handleScoreChange);
        globalEvents.on('dealTriggered', this.handleDealTriggered);
        globalEvents.on('gameStart', this.handleGameStart);

        // Replace game's piece bag with weighted generator
        this.injectPieceGenerator();

        console.log('[RogueliteSystem] Initialized');
    }

    /**
     * Inject weighted piece generator into game
     */
    injectPieceGenerator() {
        if (this.game && this.game.pieceBag) {
            // Replace the pieceBag methods
            const generator = this.pieceGenerator;
            this.game.pieceBag.next = () => generator.next();
            this.game.pieceBag.preview = (count) => generator.preview(count);
        }
    }

    /**
     * Handle game start - reset systems
     */
    handleGameStart() {
        this.lastBonusLevel = 0;
        this.isShowingModal = false;
        this._savedGameState = null;
        this.modifierManager.clearAll();
        this.dealSystem.reset();
        this.pieceGenerator?.reset();
        this.injectPieceGenerator();

        // Emit initial state for HUD
        globalEvents.emit('activeModifiersUpdate', []);
    }

    /**
     * Check for bonus threshold and offer modifiers
     */
    handleScoreChange() {
        if (!this.game || this.isShowingModal) return;
        if (this.game.state !== GameState.PLAYING) return;

        const currentScore = this.game.score;
        const threshold = this.bonusThreshold;

        // Calculate current bonus level
        const currentLevel = Math.floor(currentScore / threshold);

        // Check if we crossed a new threshold
        if (currentLevel > this.lastBonusLevel) {
            this.lastBonusLevel = currentLevel;
            console.log(`[RogueliteSystem] Bonus threshold reached! Level ${currentLevel}, Score: ${currentScore}`);
            this.offerBonusModifiers();
        }
    }

    /**
     * Offer bonus modifiers to player
     */
    async offerBonusModifiers() {
        if (this.isShowingModal) return;

        // Freeze the game
        this.freezeGame();

        try {
            // Get active modifier IDs to exclude
            const excludeIds = this.modifierManager.getActiveModifiers().map(m => m.id);

            // Get random bonus modifiers
            const modifiers = this.modifierPool.getBonusModifiers(3, excludeIds);

            if (modifiers.length === 0) {
                console.log('[RogueliteSystem] No more bonus modifiers available');
                this.unfreezeGame();
                return;
            }

            console.log('[RogueliteSystem] Showing bonus modifiers:', modifiers.map(m => m.name));

            // Show selection UI
            const selected = await this.ui.show(modifiers, {
                title: '🎁 Bonus ! Choisissez un modificateur',
                isDeal: false
            });

            // Apply selected modifier
            this.modifierManager.addModifier(selected);

            // Emit update for HUD
            globalEvents.emit('activeModifiersUpdate', this.modifierManager.getActiveModifiers());
        } catch (e) {
            console.error('[RogueliteSystem] Error in offerBonusModifiers:', e);
        } finally {
            // Always unfreeze game
            this.unfreezeGame();
        }
    }

    /**
     * Handle deal triggered - force malus selection
     */
    async handleDealTriggered() {
        if (this.isShowingModal) return;

        // Freeze the game
        this.freezeGame();

        try {
            // Get active modifier IDs to exclude
            const excludeIds = this.modifierManager.getActiveModifiers().map(m => m.id);

            // Get malus modifiers
            let modifiers = this.modifierPool.getMalusModifiers(3, excludeIds);

            if (modifiers.length === 0) {
                console.log('[RogueliteSystem] No more modifiers available');
                this.dealSystem.reset();
                this.unfreezeGame();
                return;
            }

            console.log('[RogueliteSystem] Showing deal modifiers:', modifiers.map(m => m.name));

            // Show selection UI (forced malus)
            const selected = await this.ui.show(modifiers, {
                title: '💀 Deal ! Choisissez un malus',
                isDeal: true
            });

            // Apply selected modifier
            this.modifierManager.addModifier(selected);

            // Emit update for HUD
            globalEvents.emit('activeModifiersUpdate', this.modifierManager.getActiveModifiers());

            // Reset deal gauge
            this.dealSystem.reset();
        } catch (e) {
            console.error('[RogueliteSystem] Error in handleDealTriggered:', e);
        } finally {
            // Always unfreeze game
            this.unfreezeGame();
        }
    }

    /**
     * Freeze the game for modifier selection
     * This doesn't use the game's pause - just sets a custom state
     */
    freezeGame() {
        this.isShowingModal = true;
        if (this.game && this.game.state === GameState.PLAYING) {
            this._savedGameState = this.game.state;
            // Set to a paused-like state but don't emit 'paused' event
            this.game.state = 'frozen'; // Custom state
        }
    }

    /**
     * Unfreeze the game after modifier selection
     */
    unfreezeGame() {
        this.isShowingModal = false;
        if (this.game && this.game.state === 'frozen') {
            this.game.state = this._savedGameState || GameState.PLAYING;
            this.game.lastTime = performance.now(); // Reset timing
        }
        this._savedGameState = null;
    }

    /**
     * Get modified drop interval
     * @param {number} baseInterval - Base drop interval
     * @returns {number} Modified interval
     */
    getModifiedDropInterval(baseInterval) {
        return this.modifierManager.getModifiedDropInterval(baseInterval);
    }

    /**
     * Get active modifiers list
     * @returns {Modifier[]}
     */
    getActiveModifiers() {
        return this.modifierManager.getActiveModifiers();
    }

    /**
     * Get piece weights for debug display
     * @returns {Object}
     */
    getPieceWeights() {
        return this.modifierManager.getPieceWeights();
    }

    /**
     * Get deal system state for debug display
     * @returns {Object}
     */
    getDealState() {
        return {
            piecesWithoutClear: this.dealSystem.piecesWithoutClear,
            threshold: this.dealSystem.threshold,
            percentage: this.dealSystem.getPercentage()
        };
    }

    /**
     * Clean up
     */
    destroy() {
        globalEvents.off('render', this.handleScoreChange);
        globalEvents.off('dealTriggered', this.handleDealTriggered);
        globalEvents.off('gameStart', this.handleGameStart);

        this.modifierManager.destroy();
        this.dealSystem.destroy();
    }
}

export default RogueliteSystem;
