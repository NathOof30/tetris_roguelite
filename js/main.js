/**
 * @fileoverview Main application entry point
 * Initializes and coordinates all game systems
 */

import { Game, GameState } from './engine/Game.js';
import { Keyboard } from './input/Keyboard.js';
import { Touch } from './input/Touch.js';
import { Renderer } from './ui/Renderer.js';
import { Menu, MenuScreen } from './ui/Menu.js';
import { Stats } from './ui/Stats.js';
import { AudioManager } from './audio/AudioManager.js';
import config from './utils/Config.js';
import { globalEvents } from './utils/EventEmitter.js';
import { RogueliteSystem } from './roguelite/RogueliteSystem.js';
import { RogueliteHUD } from './ui/RogueliteHUD.js';
import { DebugPanel } from './ui/DebugPanel.js';

/**
 * Main Tetris Application
 */
class TetrisApp {
    constructor() {
        this.game = null;
        this.keyboard = null;
        this.touch = null;
        this.renderer = null;
        this.menu = null;
        this.stats = null;
        this.audio = null;
        this.roguelite = null;
        this.rogueliteHUD = null;
        this.debugPanel = null;

        this.elements = {};

        // Bind methods
        this.init = this.init.bind(this);
        this.startGame = this.startGame.bind(this);
        this.handleRender = this.handleRender.bind(this);
    }

    /**
     * Initialize the application
     */
    init() {
        // Get DOM elements
        this.elements = {
            gameContainer: document.getElementById('game-container'),
            gameCanvas: document.getElementById('game-canvas'),
            menuContainer: document.getElementById('menu-container'),
            holdCanvas: document.getElementById('hold-canvas'),
            nextContainer: document.getElementById('next-container'),
            score: document.getElementById('score-value'),
            level: document.getElementById('level-value'),
            lines: document.getElementById('lines-value'),
            notification: document.getElementById('notification'),
        };

        // Apply theme
        const theme = config.get('visual.theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);

        // Initialize game
        this.game = new Game();

        // Initialize input
        this.keyboard = new Keyboard(this.game);
        this.touch = new Touch(this.game, this.elements.gameCanvas);

        // Initialize renderer
        this.renderer = new Renderer(this.elements.gameCanvas, {
            boardWidth: config.get('game.boardWidth'),
            boardHeight: config.get('game.boardHeight')
        });

        // Initialize stats display
        this.stats = new Stats({
            holdCanvas: this.elements.holdCanvas,
            nextContainer: this.elements.nextContainer,
            score: this.elements.score,
            level: this.elements.level,
            lines: this.elements.lines,
            notification: this.elements.notification
        });

        // Initialize audio
        this.audio = new AudioManager();

        // Initialize menu
        this.menu = new Menu(this.elements.menuContainer);
        this.setupMenuCallbacks();

        // Initialize roguelite system
        this.roguelite = new RogueliteSystem({
            dealThreshold: 10  // Force malus after 10 pieces without clear
        });
        this.roguelite.init(this.game);
        this.game.rogueliteSystem = this.roguelite;

        // Initialize roguelite HUD (deal gauge + active modifiers)
        this.rogueliteHUD = new RogueliteHUD(this.elements.gameContainer);

        // Initialize debug panel (hidden by default)
        this.debugPanel = new DebugPanel(this.roguelite, this.game);
        this.menu.setDebugPanel(this.debugPanel);

        // Set up global event listeners
        this.setupEventListeners();

        // Show main menu
        this.showMainMenu();

        // Initialize audio on first click
        document.addEventListener('click', () => {
            this.audio.init();
        }, { once: true });

        document.addEventListener('keydown', () => {
            this.audio.init();
        }, { once: true });
    }

    /**
     * Set up menu callbacks
     */
    setupMenuCallbacks() {
        this.menu.on('newGame', () => this.startGame());
        this.menu.on('resume', () => this.resumeGame());
        this.menu.on('restart', () => this.startGame());
        this.menu.on('quit', () => this.quitGame());
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        // Render event
        globalEvents.on('render', this.handleRender);

        // Game events
        globalEvents.on('gameOver', (data) => {
            this.keyboard.disable();
            this.touch.disable();
            this.elements.gameContainer.classList.remove('playing');
            this.menu.show(MenuScreen.GAME_OVER, data);
        });

        globalEvents.on('paused', () => {
            this.menu.show(MenuScreen.PAUSE);
        });

        globalEvents.on('resumed', () => {
            this.menu.hide();
        });

        globalEvents.on('linesCleared', (data) => {
            this.stats.showLineClear(data.count, data.points);
            this.renderer.startLineClearAnimation(data.rows);
        });

        globalEvents.on('levelUp', (level) => {
            this.stats.showLevelUp(level);
        });

        globalEvents.on('hold', (pieceType) => {
            this.stats.updateHold(pieceType, false);
        });

        globalEvents.on('pieceSpawned', () => {
            const state = this.game.getRenderState();
            this.stats.updateHold(state.holdPiece, state.canHold);
            this.stats.updateNext(state.nextPieces);
        });

        globalEvents.on('themeChange', (theme) => {
            this.renderer.updateTheme();
        });
    }

    /**
     * Handle render event
     */
    handleRender() {
        if (!this.game || this.game.state === GameState.MENU) return;

        const state = this.game.getRenderState();

        // Update renderer
        this.renderer.render(state);

        // Update stats
        this.stats.update(state);
    }

    /**
     * Show main menu
     */
    showMainMenu() {
        this.elements.gameContainer.classList.remove('playing');
        this.menu.show(MenuScreen.MAIN);
        this.keyboard.disable();
        this.touch.disable();
    }

    /**
     * Start a new game
     */
    startGame() {
        this.menu.hide();
        this.elements.gameContainer.classList.add('playing');

        // Reset stats display
        this.stats.reset();

        // Enable input
        this.keyboard.enable();
        this.touch.enable();

        // Start game
        this.game.start();

        // Update initial displays
        const state = this.game.getRenderState();
        this.stats.updateNext(state.nextPieces);
    }

    /**
     * Resume game from pause
     */
    resumeGame() {
        this.menu.hide();
        this.game.togglePause();
    }

    /**
     * Quit to main menu
     */
    quitGame() {
        this.game.destroy();
        this.roguelite.destroy();
        this.debugPanel.destroy();

        this.game = new Game();
        this.keyboard.game = this.game;
        this.touch.game = this.game;

        // Reinitialize roguelite for new game
        this.roguelite = new RogueliteSystem({
            dealThreshold: 10
        });
        this.roguelite.init(this.game);
        this.game.rogueliteSystem = this.roguelite;

        // Reinitialize debug panel with new references
        this.debugPanel = new DebugPanel(this.roguelite, this.game);
        this.menu.setDebugPanel(this.debugPanel);

        this.showMainMenu();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new TetrisApp();
    app.init();

    // Expose for debugging
    window.tetrisApp = app;
});
