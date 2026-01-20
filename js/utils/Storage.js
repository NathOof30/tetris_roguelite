/**
 * @fileoverview Storage utilities for game data persistence
 * Handles high scores, statistics, and achievements
 */

const STORAGE_KEYS = {
    HIGH_SCORES: 'tetris_highscores',
    STATISTICS: 'tetris_stats',
    ACHIEVEMENTS: 'tetris_achievements',
};

/**
 * Storage manager class
 */
export class Storage {
    /**
     * Get high scores list
     * @returns {Array} Array of high score objects
     */
    static getHighScores() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Failed to load high scores:', e);
            return [];
        }
    }

    /**
     * Add a new high score
     * @param {Object} score - Score object { name, score, level, lines, date }
     * @returns {number} Rank of the new score (1-based) or -1 if not in top 10
     */
    static addHighScore(score) {
        const scores = this.getHighScores();
        const newScore = {
            ...score,
            date: new Date().toISOString(),
        };

        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);

        // Keep only top 10
        const topScores = scores.slice(0, 10);

        try {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(topScores));
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }

        // Return rank if in top 10
        const rank = topScores.findIndex(s => s === newScore);
        return rank !== -1 ? rank + 1 : -1;
    }

    /**
     * Check if score qualifies for high score list
     * @param {number} score - Score to check
     * @returns {boolean} True if score is a high score
     */
    static isHighScore(score) {
        const scores = this.getHighScores();
        return scores.length < 10 || score > scores[scores.length - 1].score;
    }

    /**
     * Get game statistics
     * @returns {Object} Statistics object
     */
    static getStatistics() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.STATISTICS);
            return data ? JSON.parse(data) : this.getDefaultStats();
        } catch (e) {
            console.warn('Failed to load statistics:', e);
            return this.getDefaultStats();
        }
    }

    /**
     * Update game statistics
     * @param {Object} gameStats - Stats from completed game
     */
    static updateStatistics(gameStats) {
        const stats = this.getStatistics();

        stats.gamesPlayed++;
        stats.totalScore += gameStats.score;
        stats.totalLines += gameStats.lines;
        stats.totalPiecesPlaced += gameStats.piecesPlaced;
        stats.totalPlayTime += gameStats.playTime;
        stats.maxScore = Math.max(stats.maxScore, gameStats.score);
        stats.maxLevel = Math.max(stats.maxLevel, gameStats.level);
        stats.maxLines = Math.max(stats.maxLines, gameStats.lines);

        // Line clear stats
        stats.singles += gameStats.singles || 0;
        stats.doubles += gameStats.doubles || 0;
        stats.triples += gameStats.triples || 0;
        stats.tetrises += gameStats.tetrises || 0;

        try {
            localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats));
        } catch (e) {
            console.warn('Failed to save statistics:', e);
        }
    }

    /**
     * Get default statistics object
     * @returns {Object} Default stats
     */
    static getDefaultStats() {
        return {
            gamesPlayed: 0,
            totalScore: 0,
            totalLines: 0,
            totalPiecesPlaced: 0,
            totalPlayTime: 0,
            maxScore: 0,
            maxLevel: 0,
            maxLines: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
        };
    }

    /**
     * Get achievements
     * @returns {Object} Achievements object
     */
    static getAchievements() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.warn('Failed to load achievements:', e);
            return {};
        }
    }

    /**
     * Unlock an achievement
     * @param {string} id - Achievement ID
     * @returns {boolean} True if newly unlocked
     */
    static unlockAchievement(id) {
        const achievements = this.getAchievements();

        if (achievements[id]) {
            return false; // Already unlocked
        }

        achievements[id] = {
            unlockedAt: new Date().toISOString(),
        };

        try {
            localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
        } catch (e) {
            console.warn('Failed to save achievement:', e);
        }

        return true;
    }

    /**
     * Clear all stored data
     */
    static clearAll() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

export default Storage;
