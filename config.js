/**
 * Configuration settings for the Snake Neuroevolution demo
 * Centralizes all hyperparameters for easy tweaking
 */
const CONFIG = {
    // Neural Network Settings
    network: {
        inputs: 9,            // Number of input neurons
        hiddenLayers: [16],   // Array of hidden layer sizes
        outputs: 3,           // Number of output neurons
        activation: "sigmoid" // Activation function ('sigmoid', 'tanh', 'relu')
    },
    
    // Evolution Settings
    evolution: {
        population: 100,       // Number of snakes per generation
        elitism: 0.15,         // Percentage of top performers to keep unchanged
        randomBehaviour: 0.2,  // Percentage of population to randomize each generation
        mutationRate: 0.3,     // Probability of weight mutation
        mutationRange: 0.5,    // Maximum range of weight mutation
        adaptiveMutation: true // Whether to reduce mutation as fitness improves
    },
    
    // Game Settings
    game: {
        width: 40,            // Grid width
        height: 30,           // Grid height
        tileSize: 15,         // Size of each grid tile in pixels
        maxStepsWithoutFood: 100,  // Maximum steps before considering snake stuck
        initialFPS: 30,       // Starting game speed
        foodValue: 1,         // Score increase per food
        proximityReward: 0.1  // Reward for moving closer to food
    },
    
    // UI Settings
    ui: {
        showGrid: true,        // Whether to show grid lines
        championColor: "#ff0000", // Color for best snake head
        championBodyColor: "#ff6347", // Color for best snake body
        regularColor: "#2ecc71", // Color for regular snakes' heads
        regularBodyColor: "#27ae60", // Color for regular snakes' bodies
        foodColor: "#e74c3c",   // Color for food
        obstacleColor: "#34495e", // Color for obstacles
        showAllSnakes: false,   // Whether to show all snakes or just samples
        sampleRate: 10         // If not showing all, show 1 out of X snakes
    }
};

// Don't overwrite CONFIG if it exists (allows runtime changes to persist)
if (typeof window !== 'undefined') {
    window.CONFIG = window.CONFIG || CONFIG;
}
