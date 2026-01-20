/**
 * @fileoverview Configuration system for Tetris game
 * Manages default and user configurations with persistence
 */

export const DEFAULT_CONFIG = {
  game: {
    initialLevel: 1,
    boardWidth: 10,
    boardHeight: 20,
    hiddenRows: 2,
    lockDelay: 500,
    lockMoveLimit: 15,
    das: { delay: 150, interval: 50 },
    nextPreview: 5,
    ghostPiece: true,
    randomBag: true,
  },
  controls: {
    left: ['ArrowLeft'],
    right: ['ArrowRight'],
    rotateRight: ['ArrowUp'],
    rotateLeft: ['KeyZ'],
    softDrop: ['ArrowDown'],
    hardDrop: ['Space'],
    hold: ['KeyC'],
    pause: ['KeyP', 'Escape'],
    mute: ['KeyM'],
  },
  audio: {
    enabled: true,
    musicVolume: 0,  // Disabled by default - too robotic
    sfxVolume: 0.7,
  },
  visual: {
    theme: 'dark',
    animations: true,
    particleEffects: true,
    gridOpacity: 0.15,
    ghostOpacity: 0.3,
  },
  accessibility: {
    colorblindMode: false,
    highContrast: false,
    reducedMotion: false,
  }
};

/**
 * Configuration manager class
 */
export class Config {
  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from localStorage or use defaults
   * @returns {Object} Configuration object
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('tetris_config');
      if (saved) {
        return this.mergeDeep(DEFAULT_CONFIG, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load config:', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Save current configuration to localStorage
   */
  saveConfig() {
    try {
      localStorage.setItem('tetris_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save config:', e);
    }
  }

  /**
   * Get a configuration value by path
   * @param {string} path - Dot-separated path (e.g., 'game.das.delay')
   * @returns {*} Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Set a configuration value by path
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);
    target[lastKey] = value;
    this.saveConfig();
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  mergeDeep(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = this.mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }
}

export default new Config();
