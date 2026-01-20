/**
 * @fileoverview Menu system for Tetris game
 * Handles all menu screens and navigation
 */

import { globalEvents } from '../utils/EventEmitter.js';
import Storage from '../utils/Storage.js';
import config from '../utils/Config.js';
import { TETROMINOES } from '../engine/Piece.js';

/**
 * Menu screens enum
 */
export const MenuScreen = {
    MAIN: 'main',
    OPTIONS: 'options',
    CONTROLS: 'controls',
    HIGH_SCORES: 'highScores',
    GAME_OVER: 'gameOver',
    PAUSE: 'pause'
};

/**
 * Menu manager class
 */
export class Menu {
    /**
     * Create menu manager
     * @param {HTMLElement} container - Menu container element
     */
    constructor(container) {
        this.container = container;
        this.currentScreen = null;
        this.callbacks = {};
        this.debugPanel = null;

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);

        // Event listeners
        window.addEventListener('keydown', this.handleKeyDown);
    }

    /**
     * Set reference to debug panel
     * @param {DebugPanel} debugPanel
     */
    setDebugPanel(debugPanel) {
        this.debugPanel = debugPanel;
    }

    /**
     * Set callback for menu actions
     * @param {string} action - Action name
     * @param {Function} callback - Callback function
     */
    on(action, callback) {
        this.callbacks[action] = callback;
    }

    /**
     * Trigger a callback
     * @param {string} action - Action name
     * @param {...*} args - Arguments
     */
    trigger(action, ...args) {
        if (this.callbacks[action]) {
            this.callbacks[action](...args);
        }
    }

    /**
     * Handle keyboard navigation in menus
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        if (this.currentScreen === MenuScreen.PAUSE && e.code === 'Escape') {
            this.trigger('resume');
        }
    }

    /**
     * Show a menu screen
     * @param {string} screen - Screen name
     * @param {Object} data - Additional data
     */
    show(screen, data = {}) {
        this.currentScreen = screen;
        this.container.innerHTML = '';
        this.container.className = 'menu-container active';

        switch (screen) {
            case MenuScreen.MAIN:
                this.renderMainMenu();
                break;
            case MenuScreen.OPTIONS:
                this.renderOptionsMenu();
                break;
            case MenuScreen.CONTROLS:
                this.renderControlsMenu();
                break;
            case MenuScreen.HIGH_SCORES:
                this.renderHighScores();
                break;
            case MenuScreen.GAME_OVER:
                this.renderGameOver(data);
                break;
            case MenuScreen.PAUSE:
                this.renderPauseMenu();
                break;
        }
    }

    /**
     * Hide the menu
     */
    hide() {
        this.currentScreen = null;
        this.container.className = 'menu-container';
        this.container.innerHTML = '';
    }

    /**
     * Create a button element
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     * @param {string} className - Additional class
     * @returns {HTMLButtonElement}
     */
    createButton(text, onClick, className = '') {
        const button = document.createElement('button');
        button.className = `menu-button ${className}`;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Render main menu
     */
    renderMainMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu main-menu';

        // Logo
        const logo = document.createElement('h1');
        logo.className = 'game-logo';
        logo.innerHTML = '<span class="logo-t">T</span><span class="logo-e">E</span><span class="logo-t2">T</span><span class="logo-r">R</span><span class="logo-i">I</span><span class="logo-s">S</span>';
        menu.appendChild(logo);

        // Subtitle
        const subtitle = document.createElement('p');
        subtitle.className = 'game-subtitle';
        subtitle.textContent = 'Professional Edition';
        menu.appendChild(subtitle);

        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';

        buttons.appendChild(this.createButton('Nouvelle Partie', () => this.trigger('newGame'), 'primary'));
        buttons.appendChild(this.createButton('Options', () => this.show(MenuScreen.OPTIONS)));
        buttons.appendChild(this.createButton('Meilleurs Scores', () => this.show(MenuScreen.HIGH_SCORES)));
        buttons.appendChild(this.createButton('Contrôles', () => this.show(MenuScreen.CONTROLS)));

        menu.appendChild(buttons);

        // Instructions
        const controls = document.createElement('div');
        controls.className = 'menu-instructions';
        controls.innerHTML = `
      <p>← → Déplacer • ↑ Rotation • ↓ Descente • Espace Hard Drop • C Hold • P Pause</p>
    `;
        menu.appendChild(controls);

        this.container.appendChild(menu);
    }

    /**
     * Render options menu
     */
    renderOptionsMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu options-menu';

        const title = document.createElement('h2');
        title.textContent = 'Options';
        menu.appendChild(title);

        const options = document.createElement('div');
        options.className = 'options-list';

        // Theme option
        options.appendChild(this.createToggleOption(
            'Thème Sombre',
            config.get('visual.theme') === 'dark',
            (checked) => {
                config.set('visual.theme', checked ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', checked ? 'dark' : 'light');
                globalEvents.emit('themeChange', checked ? 'dark' : 'light');
            }
        ));

        // Ghost piece
        options.appendChild(this.createToggleOption(
            'Pièce Fantôme',
            config.get('game.ghostPiece'),
            (checked) => config.set('game.ghostPiece', checked)
        ));

        // Animations
        options.appendChild(this.createToggleOption(
            'Animations',
            config.get('visual.animations'),
            (checked) => config.set('visual.animations', checked)
        ));

        // Particles
        options.appendChild(this.createToggleOption(
            'Effets de Particules',
            config.get('visual.particleEffects'),
            (checked) => config.set('visual.particleEffects', checked)
        ));

        // Audio
        options.appendChild(this.createToggleOption(
            'Son Activé',
            config.get('audio.enabled'),
            (checked) => {
                config.set('audio.enabled', checked);
                globalEvents.emit('audioToggle', checked);
            }
        ));

        // Music volume
        options.appendChild(this.createSliderOption(
            'Volume Musique',
            config.get('audio.musicVolume') * 100,
            (value) => {
                config.set('audio.musicVolume', value / 100);
                globalEvents.emit('musicVolumeChange', value / 100);
            }
        ));

        // SFX volume
        options.appendChild(this.createSliderOption(
            'Volume Effets',
            config.get('audio.sfxVolume') * 100,
            (value) => {
                config.set('audio.sfxVolume', value / 100);
                globalEvents.emit('sfxVolumeChange', value / 100);
            }
        ));

        // DAS delay
        options.appendChild(this.createSliderOption(
            'DAS Délai (ms)',
            config.get('game.das.delay'),
            (value) => config.set('game.das.delay', value),
            50, 300
        ));

        // ARR interval
        options.appendChild(this.createSliderOption(
            'ARR Intervalle (ms)',
            config.get('game.das.interval'),
            (value) => config.set('game.das.interval', value),
            0, 100
        ));

        // Colorblind mode
        options.appendChild(this.createToggleOption(
            'Mode Daltonien',
            config.get('accessibility.colorblindMode'),
            (checked) => config.set('accessibility.colorblindMode', checked)
        ));

        // Debug Roguelite
        options.appendChild(this.createToggleOption(
            '🔧 Debug Roguelite',
            config.get('debug.roguelite') || false,
            (checked) => {
                if (this.debugPanel) {
                    if (checked) {
                        this.debugPanel.show();
                    } else {
                        this.debugPanel.hide();
                    }
                }
            }
        ));

        menu.appendChild(options);

        // Back button
        menu.appendChild(this.createButton('Retour', () => this.show(MenuScreen.MAIN), 'secondary'));

        this.container.appendChild(menu);
    }

    /**
     * Create a toggle option
     * @param {string} label - Option label
     * @param {boolean} checked - Initial state
     * @param {Function} onChange - Change handler
     * @returns {HTMLElement}
     */
    createToggleOption(label, checked, onChange) {
        const option = document.createElement('div');
        option.className = 'option-row';

        const labelEl = document.createElement('span');
        labelEl.className = 'option-label';
        labelEl.textContent = label;

        const toggle = document.createElement('label');
        toggle.className = 'toggle-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.addEventListener('change', () => onChange(input.checked));

        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        toggle.appendChild(input);
        toggle.appendChild(slider);

        option.appendChild(labelEl);
        option.appendChild(toggle);

        return option;
    }

    /**
     * Create a slider option
     * @param {string} label - Option label
     * @param {number} value - Initial value
     * @param {Function} onChange - Change handler
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {HTMLElement}
     */
    createSliderOption(label, value, onChange, min = 0, max = 100) {
        const option = document.createElement('div');
        option.className = 'option-row';

        const labelEl = document.createElement('span');
        labelEl.className = 'option-label';
        labelEl.textContent = label;

        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.value = value;
        input.className = 'slider';

        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'slider-value';
        valueDisplay.textContent = Math.round(value);

        input.addEventListener('input', () => {
            valueDisplay.textContent = input.value;
            onChange(parseInt(input.value));
        });

        sliderContainer.appendChild(input);
        sliderContainer.appendChild(valueDisplay);

        option.appendChild(labelEl);
        option.appendChild(sliderContainer);

        return option;
    }

    /**
     * Render controls menu
     */
    renderControlsMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu controls-menu';

        const title = document.createElement('h2');
        title.textContent = 'Contrôles';
        menu.appendChild(title);

        const controlsList = document.createElement('div');
        controlsList.className = 'controls-list';

        const controls = [
            { action: 'Déplacer Gauche', keys: '← ou A' },
            { action: 'Déplacer Droite', keys: '→ ou D' },
            { action: 'Rotation Horaire', keys: '↑ ou W' },
            { action: 'Rotation Anti-horaire', keys: 'Z' },
            { action: 'Descente Rapide', keys: '↓ ou S' },
            { action: 'Hard Drop', keys: 'Espace' },
            { action: 'Hold', keys: 'C' },
            { action: 'Pause', keys: 'P ou Échap' },
            { action: 'Muet', keys: 'M' },
        ];

        controls.forEach(({ action, keys }) => {
            const row = document.createElement('div');
            row.className = 'control-row';

            const actionEl = document.createElement('span');
            actionEl.className = 'control-action';
            actionEl.textContent = action;

            const keysEl = document.createElement('span');
            keysEl.className = 'control-keys';
            keysEl.textContent = keys;

            row.appendChild(actionEl);
            row.appendChild(keysEl);
            controlsList.appendChild(row);
        });

        menu.appendChild(controlsList);
        menu.appendChild(this.createButton('Retour', () => this.show(MenuScreen.MAIN), 'secondary'));

        this.container.appendChild(menu);
    }

    /**
     * Render high scores
     */
    renderHighScores() {
        const menu = document.createElement('div');
        menu.className = 'menu highscores-menu';

        const title = document.createElement('h2');
        title.textContent = 'Meilleurs Scores';
        menu.appendChild(title);

        const scores = Storage.getHighScores();
        const list = document.createElement('div');
        list.className = 'highscores-list';

        if (scores.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'no-scores';
            empty.textContent = 'Aucun score enregistré';
            list.appendChild(empty);
        } else {
            scores.forEach((score, index) => {
                const row = document.createElement('div');
                row.className = 'highscore-row';

                const rank = document.createElement('span');
                rank.className = 'score-rank';
                rank.textContent = `#${index + 1}`;

                const name = document.createElement('span');
                name.className = 'score-name';
                name.textContent = score.name || 'Anonyme';

                const value = document.createElement('span');
                value.className = 'score-value';
                value.textContent = score.score.toLocaleString();

                const details = document.createElement('span');
                details.className = 'score-details';
                details.textContent = `Niv.${score.level} • ${score.lines} lignes`;

                row.appendChild(rank);
                row.appendChild(name);
                row.appendChild(value);
                row.appendChild(details);
                list.appendChild(row);
            });
        }

        menu.appendChild(list);
        menu.appendChild(this.createButton('Retour', () => this.show(MenuScreen.MAIN), 'secondary'));

        this.container.appendChild(menu);
    }

    /**
     * Render game over screen
     * @param {Object} data - Game data
     */
    renderGameOver(data) {
        const menu = document.createElement('div');
        menu.className = 'menu gameover-menu';

        const title = document.createElement('h2');
        title.className = 'gameover-title';
        title.textContent = 'Game Over';
        menu.appendChild(title);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'gameover-stats';

        stats.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Score</span>
        <span class="stat-value score">${data.score?.toLocaleString() || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Niveau</span>
        <span class="stat-value">${data.level || 1}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Lignes</span>
        <span class="stat-value">${data.lines || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Pièces</span>
        <span class="stat-value">${data.stats?.piecesPlaced || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Tetrises</span>
        <span class="stat-value">${data.stats?.tetrises || 0}</span>
      </div>
    `;

        menu.appendChild(stats);

        // Check if high score
        if (Storage.isHighScore(data.score || 0)) {
            const highScoreNotice = document.createElement('div');
            highScoreNotice.className = 'highscore-notice';
            highScoreNotice.innerHTML = '🏆 <span>Nouveau record!</span>';
            menu.appendChild(highScoreNotice);

            // Save high score
            Storage.addHighScore({
                name: 'Joueur',
                score: data.score || 0,
                level: data.level || 1,
                lines: data.lines || 0
            });
        }

        // Update statistics
        Storage.updateStatistics({
            score: data.score || 0,
            level: data.level || 1,
            lines: data.lines || 0,
            piecesPlaced: data.stats?.piecesPlaced || 0,
            playTime: data.stats?.playTime || 0,
            singles: data.stats?.singles || 0,
            doubles: data.stats?.doubles || 0,
            triples: data.stats?.triples || 0,
            tetrises: data.stats?.tetrises || 0
        });

        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';
        buttons.appendChild(this.createButton('Rejouer', () => this.trigger('newGame'), 'primary'));
        buttons.appendChild(this.createButton('Menu Principal', () => this.show(MenuScreen.MAIN), 'secondary'));
        menu.appendChild(buttons);

        this.container.appendChild(menu);
    }

    /**
     * Render pause menu
     */
    renderPauseMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu pause-menu';

        const title = document.createElement('h2');
        title.textContent = 'Pause';
        menu.appendChild(title);

        const buttons = document.createElement('div');
        buttons.className = 'menu-buttons';

        buttons.appendChild(this.createButton('Reprendre', () => this.trigger('resume'), 'primary'));
        buttons.appendChild(this.createButton('Recommencer', () => this.trigger('restart')));
        buttons.appendChild(this.createButton('Options', () => this.show(MenuScreen.OPTIONS)));
        buttons.appendChild(this.createButton('Quitter', () => this.trigger('quit'), 'secondary'));

        menu.appendChild(buttons);

        const hint = document.createElement('p');
        hint.className = 'pause-hint';
        hint.textContent = 'Appuyez sur P ou Échap pour reprendre';
        menu.appendChild(hint);

        this.container.appendChild(menu);
    }

    /**
     * Clean up
     */
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}

export default Menu;
