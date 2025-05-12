/**
 * Handles the statistics display and charts for the Snake Neuroevolution demo
 */

class StatsPanel {
    constructor() {
        this.initialized = false;
        this.historyLength = 50; // How many generations to show in charts
        this.fitnessHistory = [];
        this.generationHistory = [];
        this.averageFitnessHistory = [];
        
        // Chart contexts
        this.fitnessChart = null;
        
        // Current stats
        this.currentGeneration = 0;
        this.maxFitness = 0;
        this.averageFitness = 0;
        this.aliveCount = 0;
        this.populationSize = 0;
    }
    
    /**
     * Initialize the stats panel
     */
    initialize() {
        if (this.initialized) return;
        
        // Create stats panel container if it doesn't exist
        if (!document.getElementById('stats-panel')) {
            const gameContainer = document.querySelector('.game-container');
            
            // Create the stats panel
            const statsPanel = document.createElement('div');
            statsPanel.id = 'stats-panel';
            statsPanel.className = 'stats-panel';
            
            // Structure for the stats panel
            statsPanel.innerHTML = `
                <div class="stats-header">
                    <h3>Neuroevolution Stats</h3>
                    <div class="controls">
                        <button id="save-champion">💾 Save</button>
                        <button id="load-champion">📂 Load</button>
                        <button id="export-champion">⤓ Export</button>
                        <button id="toggle-chart">📊 Toggle Chart</button>
                    </div>
                </div>
                <div class="stats-content">
                    <div class="stats-metrics">
                        <div class="metric">
                            <span class="label">Generation:</span>
                            <span id="stat-generation" class="value">0</span>
                        </div>
                        <div class="metric">
                            <span class="label">Max Score:</span>
                            <span id="stat-max-score" class="value">0</span>
                        </div>
                        <div class="metric">
                            <span class="label">Avg Score:</span>
                            <span id="stat-avg-score" class="value">0</span>
                        </div>
                        <div class="metric">
                            <span class="label">Alive:</span>
                            <span id="stat-alive" class="value">0</span>/<span id="stat-population" class="value">0</span>
                        </div>
                    </div>
                    <div id="chart-container" class="chart-container">
                        <canvas id="fitness-chart" width="300" height="150"></canvas>
                    </div>
                </div>
                <style>
                    .stats-panel {
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        margin-top: 20px;
                        padding: 15px;
                        width: 100%;
                    }
                    .stats-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid #e0e0e0;
                        padding-bottom: 10px;
                        margin-bottom: 10px;
                    }
                    .stats-header h3 {
                        margin: 0;
                        color: #333;
                    }
                    .controls button {
                        background-color: #f1f1f1;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        padding: 5px 10px;
                        margin-left: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background-color 0.2s;
                    }
                    .controls button:hover {
                        background-color: #e0e0e0;
                    }
                    .stats-content {
                        display: flex;
                        flex-direction: column;
                    }
                    .stats-metrics {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                        gap: 10px;
                        margin-bottom: 15px;
                    }
                    .metric {
                        background-color: #fff;
                        border-radius: 4px;
                        padding: 8px 12px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    .metric .label {
                        color: #666;
                        font-size: 12px;
                        display: block;
                    }
                    .metric .value {
                        color: #333;
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .chart-container {
                        background-color: #fff;
                        border-radius: 4px;
                        padding: 10px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        height: 170px;
                    }
                </style>
            `;
            
            // Append the stats panel after the game container
            gameContainer.parentNode.insertBefore(statsPanel, gameContainer.nextSibling);
            
            // Set up event listeners for buttons
            document.getElementById('save-champion').addEventListener('click', () => {
                if (window.game && window.Neuvol) {
                    const bestGenome = this.getBestGenome();
                    if (bestGenome) {
                        StorageUtils.saveBestGenome(
                            bestGenome,
                            this.currentGeneration,
                            this.maxFitness
                        );
                    }
                }
            });
            
            document.getElementById('load-champion').addEventListener('click', () => {
                if (window.game && window.Neuvol) {
                    const savedData = StorageUtils.loadBestGenome();
                    if (savedData) {
                        this.loadSavedGenome(savedData);
                    }
                }
            });
            
            document.getElementById('export-champion').addEventListener('click', () => {
                if (window.game && window.Neuvol) {
                    const bestGenome = this.getBestGenome();
                    if (bestGenome) {
                        StorageUtils.exportGenome(
                            bestGenome,
                            this.currentGeneration,
                            this.maxFitness
                        );
                    }
                }
            });
            
            document.getElementById('toggle-chart').addEventListener('click', () => {
                const chartContainer = document.getElementById('chart-container');
                chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
            });
            
            // Initialize chart if a charting library is available
            this.initChart();
        }
        
        this.initialized = true;
    }
    
    /**
     * Initialize the fitness chart
     */
    initChart() {
        // Check if Chart.js is available, if not load it
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.createChart();
            document.head.appendChild(script);
        } else {
            this.createChart();
        }
    }
    
    /**
     * Create the fitness chart
     */
    createChart() {
        if (typeof Chart !== 'undefined') {
            const ctx = document.getElementById('fitness-chart').getContext('2d');
            this.fitnessChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.generationHistory,
                    datasets: [
                        {
                            label: 'Max Fitness',
                            data: this.fitnessHistory,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.4
                        },
                        {
                            label: 'Average Fitness',
                            data: this.averageFitnessHistory,
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    animation: {
                        duration: 0 // Disable animations for performance
                    }
                }
            });
        }
    }
    
    /**
     * Update the stats display
     * @param {Object} data - Current game statistics
     */
    update(data) {
        if (!this.initialized) {
            this.initialize();
        }
        
        // Update current stats
        this.currentGeneration = data.generation;
        this.maxFitness = data.maxScore;
        this.averageFitness = data.avgScore;
        this.aliveCount = data.alive;
        this.populationSize = data.population;
        
        // Update the DOM
        document.getElementById('stat-generation').textContent = this.currentGeneration;
        document.getElementById('stat-max-score').textContent = this.maxFitness;
        document.getElementById('stat-avg-score').textContent = this.averageFitness.toFixed(2);
        document.getElementById('stat-alive').textContent = this.aliveCount;
        document.getElementById('stat-population').textContent = this.populationSize;
        
        // Update history arrays for the chart
        if (data.newGeneration) {
            // Limit history length
            if (this.fitnessHistory.length >= this.historyLength) {
                this.fitnessHistory.shift();
                this.generationHistory.shift();
                this.averageFitnessHistory.shift();
            }
            
            this.fitnessHistory.push(this.maxFitness);
            this.generationHistory.push(this.currentGeneration);
            this.averageFitnessHistory.push(this.averageFitness);
            
            // Update chart if it exists
            this.updateChart();
        }
    }
    
    /**
     * Update the fitness chart
     */
    updateChart() {
        if (this.fitnessChart) {
            this.fitnessChart.data.labels = this.generationHistory;
            this.fitnessChart.data.datasets[0].data = this.fitnessHistory;
            this.fitnessChart.data.datasets[1].data = this.averageFitnessHistory;
            this.fitnessChart.update();
        }
    }
    
    /**
     * Get the best genome from the current generation
     * @returns {Object|null} The best genome or null if not available
     */
    getBestGenome() {
        if (window.Neuvol && window.Neuvol.generations && 
            window.Neuvol.generations.generations.length > 0) {
            const currentGen = window.Neuvol.generations.generations[window.Neuvol.generations.generations.length - 1];
            if (currentGen.genomes.length > 0) {
                return currentGen.genomes[0].network;
            }
        }
        return null;
    }
    
    /**
     * Load a saved genome into the game
     * @param {Object} savedData - The saved genome data
     */
    loadSavedGenome(savedData) {
        console.log(`Loading champion from generation ${savedData.generation} with score ${savedData.score}`);
        
        // TODO: Implement loading logic based on your game's architecture
        // This is a simplified example - you'll need to adapt it to your game
        
        if (window.Neuvol && window.game) {
            // Reset current game
            window.game.start();
            
            // Replace first genome with the loaded champion
            if (window.game.gen.length > 0) {
                // Create a new Network object
                const network = new window.Neuvol.network();
                
                // Apply the saved weights and structure
                network.setSave(savedData.genome);
                
                // Replace the first genome
                window.game.gen[0] = network;
                
                console.log("Champion loaded successfully!");
            }
        }
    }
}

// Create global stats instance
if (typeof window !== 'undefined') {
    window.gameStats = new StatsPanel();
}
