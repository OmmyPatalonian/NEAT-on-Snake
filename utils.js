/**
 * Utility functions for the Snake Neuroevolution demo
 */

// Storage utilities
const StorageUtils = {
    /**
     * Save the best genome to localStorage
     * @param {Object} genome - The genome to save
     * @param {Number} generation - The current generation
     * @param {Number} score - The score achieved
     */
    saveBestGenome: function(genome, generation, score) {
        try {
            const data = {
                genome: genome,
                generation: generation,
                score: score,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('snakeChampion', JSON.stringify(data));
            console.log(`Champion saved: Generation ${generation}, Score ${score}`);
            return true;
        } catch (e) {
            console.error("Failed to save champion:", e);
            return false;
        }
    },

    /**
     * Load the best genome from localStorage
     * @returns {Object|null} The saved genome data or null if none exists
     */
    loadBestGenome: function() {
        try {
            const data = localStorage.getItem('snakeChampion');
            if (!data) return null;
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to load champion:", e);
            return null;
        }
    },

    /**
     * Export the best genome as a downloadable JSON file
     * @param {Object} genome - The genome to export
     * @param {Number} generation - The current generation
     * @param {Number} score - The score achieved
     */
    exportGenome: function(genome, generation, score) {
        try {
            const data = {
                genome: genome,
                generation: generation,
                score: score,
                timestamp: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `snake-champion-gen${generation}-score${score}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (e) {
            console.error("Failed to export champion:", e);
            return false;
        }
    }
};

// Performance utilities
const PerformanceUtils = {
    /**
     * Throttle function for limiting update frequency
     * @param {Function} callback - The function to throttle
     * @param {Number} delay - Minimum time between calls in ms
     * @returns {Function} Throttled function
     */
    throttle: function(callback, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                callback.apply(this, args);
            }
        };
    },
    
    /**
     * Check if the page is visible
     * @returns {Boolean} Whether the page is visible
     */
    isPageVisible: function() {
        return !document.hidden;
    }
};

// Calculation utilities
const MathUtils = {
    /**
     * Normalize a value to range [0,1]
     * @param {Number} value - The value to normalize
     * @param {Number} min - Minimum possible value
     * @param {Number} max - Maximum possible value
     * @returns {Number} Normalized value
     */
    normalize: function(value, min, max) {
        return (value - min) / (max - min);
    },
    
    /**
     * Calculate Manhattan distance between two points
     * @param {Object} p1 - First point {x, y}
     * @param {Object} p2 - Second point {x, y}
     * @returns {Number} Manhattan distance
     */
    manhattanDistance: function(p1, p2) {
        return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    },
    
    /**
     * Generate a random integer between min and max (inclusive)
     * @param {Number} min - Minimum value
     * @param {Number} max - Maximum value
     * @returns {Number} Random integer
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// Export utilities for global use
if (typeof window !== 'undefined') {
    window.StorageUtils = StorageUtils;
    window.PerformanceUtils = PerformanceUtils;
    window.MathUtils = MathUtils;
}
