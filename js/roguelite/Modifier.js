/**
 * @fileoverview Base Modifier class/interface for roguelite system
 * All modifiers should extend this class
 */

/**
 * Rarity levels for modifiers
 */
export const ModifierRarity = {
    COMMON: 'common',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

/**
 * Modifier types
 */
export const ModifierType = {
    BONUS: 'bonus',
    MALUS: 'malus',
    MIXED: 'mixed'
};

/**
 * Base Modifier class
 * Extend this class to create custom modifiers
 */
export class Modifier {
    /**
     * @param {Object} config - Modifier configuration
     * @param {string} config.id - Unique identifier
     * @param {string} config.name - Display name
     * @param {string} config.description - User-facing description
     * @param {string} config.rarity - Rarity level (common, rare, epic, legendary)
     * @param {string} config.type - Modifier type (bonus, malus, mixed)
     * @param {string} config.icon - Emoji or icon identifier for display
     */
    constructor({ id, name, description, rarity = ModifierRarity.COMMON, type = ModifierType.BONUS, icon = '❓' }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.rarity = rarity;
        this.type = type;
        this.icon = icon;
        this.isActive = false;
    }

    /**
     * Called once when the modifier is activated
     * @param {Game} game - Game instance
     */
    onApply(game) {
        this.isActive = true;
    }

    /**
     * Called when the modifier is removed
     * @param {Game} game - Game instance
     */
    onRemove(game) {
        this.isActive = false;
    }

    /**
     * Called when a piece is locked to the board
     * @param {Game} game - Game instance
     * @param {Piece} piece - The piece that was locked
     */
    onPieceDrop(game, piece) {
        // Override in subclass
    }

    /**
     * Called when lines are cleared
     * @param {Game} game - Game instance
     * @param {number} count - Number of lines cleared
     * @param {number[]} rows - Row indices that were cleared
     */
    onLineClear(game, count, rows) {
        // Override in subclass
    }

    /**
     * Modify piece spawn weights
     * @param {Object} weights - Current weights { I: 1, O: 1, T: 1, S: 1, Z: 1, J: 1, L: 1 }
     * @returns {Object} Modified weights
     */
    modifyPieceWeights(weights) {
        // Override in subclass
        return weights;
    }

    /**
     * Modify drop interval (fall speed)
     * @param {number} interval - Current drop interval in ms
     * @returns {number} Modified interval
     */
    modifyDropInterval(interval) {
        // Override in subclass
        return interval;
    }

    /**
     * Called every frame
     * @param {Game} game - Game instance
     * @param {number} deltaTime - Time since last frame in ms
     */
    onUpdate(game, deltaTime) {
        // Override in subclass
    }

    /**
     * Get color based on rarity
     * @returns {string} CSS color value
     */
    getRarityColor() {
        switch (this.rarity) {
            case ModifierRarity.COMMON: return '#9ca3af';    // Gray
            case ModifierRarity.RARE: return '#3b82f6';      // Blue
            case ModifierRarity.EPIC: return '#a855f7';      // Purple
            case ModifierRarity.LEGENDARY: return '#f59e0b'; // Gold
            default: return '#9ca3af';
        }
    }
}

export default Modifier;
