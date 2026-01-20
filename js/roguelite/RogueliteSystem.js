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
     * @param {number} options.dealThreshold - Pieces without clear for deal trigger
     */
    constructor({ dealThreshold = 10 } = {}) {
        this.dealThreshold = dealThreshold;

        this.modifierManager = new ModifierManager();
        this.modifierPool = new ModifierPool();
        this.dealSystem = new DealSystem({ threshold: dealThreshold });
        this.pieceGenerator = null;

        this.game = null;
        this.ui = null;

        this.lastLevel = 1;  // Track level for bonus triggers
        this.isShowingModal = false;
        this._savedGameState = null;

        // Bind handlers
        this.handleLevelUp = this.handleLevelUp.bind(this);
        this.handleDealTriggered = this.handleDealTriggered.bind(this);
        this.handleGameStart = this.handleGameStart.bind(this);
        this.handlePieceSpawned = this.handlePieceSpawned.bind(this);
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
        globalEvents.on('levelUp', this.handleLevelUp);
        globalEvents.on('dealTriggered', this.handleDealTriggered);
        globalEvents.on('gameStart', this.handleGameStart);
        globalEvents.on('pieceSpawned', this.handlePieceSpawned);

        // Replace game's piece bag with weighted generator
        this.injectPieceGenerator();

        console.log('[RogueliteSystem] Initialized');
    }

    /**
     * Inject weighted piece generator into game
     */
    injectPieceGenerator() {
        if (this.game && this.game.pieceBag) {
            const generator = this.pieceGenerator;
            this.game.pieceBag.next = () => generator.next();
            this.game.pieceBag.preview = (count) => generator.preview(count);
        }
    }

    /**
     * Handle game start - reset systems
     */
    handleGameStart() {
        this.lastLevel = 1;
        this.isShowingModal = false;
        this._savedGameState = null;
        this.modifierManager.clearAll();
        this.dealSystem.reset();
        this.pieceGenerator?.reset();
        this.injectPieceGenerator();

        globalEvents.emit('activeModifiersUpdate', []);
    }

    /**
     * Apply modifier effects to spawned piece
     * @param {Piece} piece - The spawned piece
     */
    handlePieceSpawned(piece) {
        // Let modifiers modify the piece
        this.modifierManager.applyToPiece(piece);
    }

    /**
     * Handle level up - offer bonus/mixed modifiers
     * @param {number} newLevel - New level
     */
    handleLevelUp(newLevel) {
        if (this.isShowingModal) return;
        if (newLevel <= this.lastLevel) return;

        this.lastLevel = newLevel;
        console.log(`[RogueliteSystem] Level up to ${newLevel}! Offering modifiers...`);
        this.offerBonusModifiers();
    }

    /**
     * Offer bonus/mixed modifiers to player (on level up)
     */
    async offerBonusModifiers() {
        if (this.isShowingModal) return;

        this.freezeGame();

        try {
            const excludeIds = this.modifierManager.getActiveModifiers().map(m => m.id);
            const modifiers = this.modifierPool.getBonusModifiers(3, excludeIds);

            if (modifiers.length === 0) {
                console.log('[RogueliteSystem] No more bonus modifiers available');
                this.unfreezeGame();
                return;
            }

            console.log('[RogueliteSystem] Showing bonus modifiers:', modifiers.map(m => m.name));

            const selected = await this.ui.show(modifiers, {
                title: '🎁 Niveau supérieur ! Choisissez un modificateur',
                isDeal: false
            });

            this.modifierManager.addModifier(selected);
            globalEvents.emit('activeModifiersUpdate', this.modifierManager.getActiveModifiers());
        } catch (e) {
            console.error('[RogueliteSystem] Error in offerBonusModifiers:', e);
        } finally {
            this.unfreezeGame();
        }
    }

    /**
     * Handle deal triggered - force MALUS selection only
     */
    async handleDealTriggered() {
        if (this.isShowingModal) return;

        this.freezeGame();

        try {
            const excludeIds = this.modifierManager.getActiveModifiers().map(m => m.id);

            // MALUS ONLY for deals
            let modifiers = this.modifierPool.getMalusModifiers(3, excludeIds);

            if (modifiers.length === 0) {
                console.log('[RogueliteSystem] No more malus modifiers available');
                this.dealSystem.reset();
                this.unfreezeGame();
                return;
            }

            console.log('[RogueliteSystem] Showing deal (malus) modifiers:', modifiers.map(m => m.name));

            const selected = await this.ui.show(modifiers, {
                title: '💀 Deal ! Choisissez un malus',
                isDeal: true
            });

            this.modifierManager.addModifier(selected);
            globalEvents.emit('activeModifiersUpdate', this.modifierManager.getActiveModifiers());
            this.dealSystem.reset();
        } catch (e) {
            console.error('[RogueliteSystem] Error in handleDealTriggered:', e);
        } finally {
            this.unfreezeGame();
        }
    }

    /**
     * Freeze the game for modifier selection
     */
    freezeGame() {
        this.isShowingModal = true;
        if (this.game && this.game.state === GameState.PLAYING) {
            this._savedGameState = this.game.state;
            this.game.state = 'frozen';
        }
    }

    /**
     * Unfreeze the game after modifier selection
     */
    unfreezeGame() {
        this.isShowingModal = false;
        if (this.game && this.game.state === 'frozen') {
            this.game.state = this._savedGameState || GameState.PLAYING;
            this.game.lastTime = performance.now();
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
        globalEvents.off('levelUp', this.handleLevelUp);
        globalEvents.off('dealTriggered', this.handleDealTriggered);
        globalEvents.off('gameStart', this.handleGameStart);
        globalEvents.off('pieceSpawned', this.handlePieceSpawned);

        this.modifierManager.destroy();
        this.dealSystem.destroy();
    }
}

export default RogueliteSystem;
