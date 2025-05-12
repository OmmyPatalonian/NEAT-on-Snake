(function() {
    // Zero timeout implementation for smoother animations
    var timeouts = [];
    var messageName = "zero-timeout-message";

    function setZeroTimeout(fn) {
        timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event) {
        if (event.source == window && event.data == messageName) {
            event.stopPropagation();
            if (timeouts.length > 0) {
                var fn = timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener("message", handleMessage, true);
    window.setZeroTimeout = setZeroTimeout;
})();

// Global variables
var Neuvol;
var game;
var FPS = 30;  // Starting with slower speed to make it more visible
var maxScore = 0;

// Set the FPS for the game
function speed(fps) {
    FPS = parseInt(fps);
}

// Direction constants for better readability
const DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// Check whether a position is occupied by snake
function isPositionInSnake(x, y, snake) {
    for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === x && snake[i].y === y) {
            return true;
        }
    }
    return false;
}

// Snake class
function Snake(json) {
    // Snake body represented as array of segments
    this.body = [{x: 5, y: 5}]; 
    
    // Direction: 0 = UP, 1 = RIGHT, 2 = DOWN, 3 = LEFT
    this.direction = DIRECTION.RIGHT;
    
    // Snake is alive initially
    this.alive = true;
    
    // Score is the length of the snake minus the initial length
    this.score = 0;
    
    // Steps alive counter for fitness calculation
    this.stepsAlive = 0;
    
    // Steps without eating (for detecting stuck behavior)
    this.stepsWithoutEating = 0;
    
    // Maximum steps without eating before considering the snake stuck
    this.maxStepsWithoutEating = 100;
    
    // Initialize from JSON if provided
    this.init(json);
}

Snake.prototype.init = function(json) {
    for (var i in json) {
        this[i] = json[i];
    }
};

// Turn the snake left (counter-clockwise)
Snake.prototype.turnLeft = function() {
    this.direction = (this.direction + 3) % 4;
};

// Turn the snake right (clockwise)
Snake.prototype.turnRight = function() {
    this.direction = (this.direction + 1) % 4;
};

// Continue in current direction (no turn)
Snake.prototype.goStraight = function() {
    // Do nothing - just continue in current direction
};

// Update snake position
Snake.prototype.update = function(grid) {
    if (!this.alive) return;
    
    this.stepsAlive++;
    this.stepsWithoutEating++;
    
    // Check if snake is stuck in a loop
    if (this.stepsWithoutEating >= this.maxStepsWithoutEating) {
        this.alive = false;
        return;
    }
    
    // Get current head position
    var head = this.body[0];
    var newHead = {x: head.x, y: head.y};
    
    // Update head position based on direction
    switch (this.direction) {
        case DIRECTION.UP:
            newHead.y--;
            break;
        case DIRECTION.RIGHT:
            newHead.x++;
            break;
        case DIRECTION.DOWN:
            newHead.y++;
            break;
        case DIRECTION.LEFT:
            newHead.x--;
            break;
    }
    
    // Check collision with walls
    if (newHead.x < 0 || newHead.x >= grid.gridWidth || 
        newHead.y < 0 || newHead.y >= grid.gridHeight) {
        this.alive = false;
        return;
    }
    
    // Check collision with self (except tail which will move)
    for (var i = 0; i < this.body.length - 1; i++) {
        if (newHead.x === this.body[i].x && newHead.y === this.body[i].y) {
            this.alive = false;
            return;
        }
    }
    
    // Check collision with obstacles
    for (var i = 0; i < grid.obstacles.length; i++) {
        if (newHead.x === grid.obstacles[i].x && newHead.y === grid.obstacles[i].y) {
            this.alive = false;
            return;
        }
    }
    
    // Add new head to body
    this.body.unshift(newHead);
    
    // Check if food was eaten
    if (newHead.x === grid.food.x && newHead.y === grid.food.y) {
        // Increase score
        this.score++;
        
        // Reset steps without eating
        this.stepsWithoutEating = 0;
        
        // Generate new food
        grid.generateFood();
    } else {
        // Remove tail (snake doesn't grow)
        this.body.pop();
    }
};

// Game class
function Game() {
    // Grid dimensions
    this.gridWidth = 40;
    this.gridHeight = 30;
    this.tileSize = 15;
    
    // Canvas setup
    this.canvas = document.getElementById('snakeCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Calculate grid size based on canvas dimensions
    this.gridWidth = Math.floor(this.width / this.tileSize);
    this.gridHeight = Math.floor(this.height / this.tileSize);
    
    // Game state
    this.food = {x: 15, y: 15};
    this.obstacles = [];  // Array to store obstacle positions
    this.snakes = [];
    this.score = 0;
    this.maxScore = 0;
    this.generation = 0;
    this.alives = 0;
    this.gen = [];
    
    // Create some obstacles
    this.createObstacles();
}

// Generate food at a random empty position
Game.prototype.generateFood = function() {
    var empty = true;
    
    // Try to find an empty position
    do {
        empty = true;
        this.food.x = Math.floor(Math.random() * this.gridWidth);
        this.food.y = Math.floor(Math.random() * this.gridHeight);
        
        // Check if this position is occupied by any snake or obstacle
        for (var i = 0; i < this.snakes.length; i++) {
            if (isPositionInSnake(this.food.x, this.food.y, this.snakes[i].body)) {
                empty = false;
                break;
            }
        }
        for (var i = 0; i < this.obstacles.length; i++) {
            if (this.food.x === this.obstacles[i].x && this.food.y === this.obstacles[i].y) {
                empty = false;
                break;
            }
        }
    } while (!empty);
};

// Create obstacles in the game
Game.prototype.createObstacles = function() {
    // Clear previous obstacles
    this.obstacles = [];
    
    // Create a central wall with a small gap
    let centerX = Math.floor(this.gridWidth / 2);
    let gapY = Math.floor(this.gridHeight / 2);
    let gapSize = 3; // Size of the gap in the wall
    
    // Create vertical obstacle in the middle with a gap
    for (let y = 0; y < this.gridHeight; y++) {
        // Skip the gap area
        if (y >= gapY - Math.floor(gapSize/2) && y <= gapY + Math.floor(gapSize/2)) {
            continue;
        }
        this.obstacles.push({x: centerX, y: y});
    }
    
    // Add some random obstacles (3% of the grid)
    const obstacleCount = Math.floor(this.gridWidth * this.gridHeight * 0.03);
    for (let i = 0; i < obstacleCount; i++) {
        let x, y;
        let validPosition = false;
        
        // Try to find a position that's not already occupied
        while (!validPosition) {
            x = Math.floor(Math.random() * this.gridWidth);
            y = Math.floor(Math.random() * this.gridHeight);
            
            // Check if position is already an obstacle
            let isObstacle = false;
            for (let j = 0; j < this.obstacles.length; j++) {
                if (this.obstacles[j].x === x && this.obstacles[j].y === y) {
                    isObstacle = true;
                    break;
                }
            }
            
            // Don't place obstacles too close to the start position
            const tooCloseToStart = (Math.abs(x - 5) < 3 && Math.abs(y - 5) < 3);
            
            // Position is valid if it's not already an obstacle and not too close to start
            validPosition = !isObstacle && !tooCloseToStart;
        }
        
        this.obstacles.push({x: x, y: y});
    }
};

// Check if a position contains an obstacle
Game.prototype.isObstacle = function(x, y) {
    for (var i = 0; i < this.obstacles.length; i++) {
        if (this.obstacles[i].x === x && this.obstacles[i].y === y) {
            return true;
        }
    }
    return false;
};

// Start the game with a new generation
Game.prototype.start = function() {
    this.iteration = 0;
    
    // Apply configuration 
    if (window.CONFIG) {
        this.gridWidth = CONFIG.game.width || 40;
        this.gridHeight = CONFIG.game.height || 30;
        this.tileSize = CONFIG.game.snakeSize || 15;
        this.maxStepsWithoutFood = CONFIG.game.maxStepsWithoutFood || 100;
    }
    
    // Initialize Neuroevolution algorithm
    if (!Neuvol) {
        let inputs = window.CONFIG ? CONFIG.network.inputSize : 9;
        let hidden = window.CONFIG ? CONFIG.network.hiddenLayers : [16];
        let outputs = window.CONFIG ? CONFIG.network.outputSize : 3;
        let population = window.CONFIG ? CONFIG.evolution.populationSize : 100;
        let elitism = window.CONFIG ? CONFIG.evolution.elitismRate : 0.15;
        let randomBehaviour = window.CONFIG ? CONFIG.evolution.randomBehaviour : 0.2;
        let mutationRate = window.CONFIG ? CONFIG.evolution.mutationRate : 0.3;
        
        Neuvol = new Neuroevolution({
            population: population,
            network: [inputs, ...hidden, outputs],
            randomBehaviour: randomBehaviour,
            mutationRate: mutationRate,
            mutationRange: 0.5,
            elitism: elitism
        });
    }
    
    // Create obstacles if enabled
    this.obstacles = [];
    if (window.CONFIG && CONFIG.game.obstacles) {
        this.createObstacles();
    }
    
    // Reset game state
    this.generation = Neuvol.generation;
    this.alives = 0;
    this.score = 0;
    this.maxScore = 0;
    
    // Generate neural networks for snakes
    this.gen = Neuvol.nextGeneration();
    
    // Create snake objects
    this.snakes = [];
    for (let i = 0; i < Neuvol.options.population; i++) {
        let snake = new Snake();
        snake.brain = this.gen[i];
        snake.maxStepsWithoutFood = this.maxStepsWithoutFood;
        this.snakes.push(snake);
        this.alives++;
    }
    
    // Generate initial food
    this.generateFood();
    
    // Start game loop
    this.update();
};

// Add step function for manual stepping when paused
Game.prototype.step = function() {
    if (this.alives > 0) {
        // Update one frame
        this.iteration++;
        
        // Update each snake
        for (let i = 0; i < this.snakes.length; i++) {
            if (this.snakes[i].alive) {
                const inputs = this.getNetworkInputs(this.snakes[i]);
                const outputs = this.gen[i].compute(inputs);
                
                // Determine action based on neural network output
                if (outputs[0] > outputs[1] && outputs[0] > outputs[2]) {
                    this.snakes[i].turnLeft();
                } else if (outputs[2] > outputs[0] && outputs[2] > outputs[1]) {
                    this.snakes[i].turnRight();
                } else {
                    this.snakes[i].goStraight();
                }
                
                // Update snake position
                this.snakes[i].update(this);
                
                // Update score
                if (this.snakes[i].score > this.score) {
                    this.score = this.snakes[i].score;
                }
                
                // Update max score
                if (this.score > this.maxScore) {
                    this.maxScore = this.score;
                }
                
                // Check if snake is still alive
                if (!this.snakes[i].alive) {
                    this.alives--;
                }
            }
        }
        
        // Update the display
        this.display();
    } else {
        // All snakes are dead, start new generation
        this.start();
    }
};

// Modify the update method to respect pause state
Game.prototype.update = function() {
    if (window.gamePaused) {
        // If game is paused, just request next frame without updating
        if (FPS == 0) {
            setZeroTimeout(() => this.update());
        } else {
            setTimeout(() => this.update(), 1000/FPS);
        }
        return;
    }
    
    this.step();
    
    // Schedule next update
    if (FPS == 0) {
        setZeroTimeout(() => this.update());
    } else {
        setTimeout(() => this.update(), 1000/FPS);
    }
    
    // Update stats if the stats module is available
    if (window.gameStats) {
        window.gameStats.update({
            generation: this.generation,
            maxScore: this.maxScore,
            avgScore: this.getAverageScore(),
            alive: this.alives,
            population: this.snakes.length,
            newGeneration: this.alives === 0 || this.iteration === 1
        });
    }
};

// Check if the game is over (all snakes dead)
Game.prototype.isItEnd = function() {
    for (var i in this.snakes) {
        if (this.snakes[i].alive) {
            return false;
        }
    }
    return true;
};

// Get the best score of the current generation's alive snakes
Game.prototype.getBestCurrentScore = function() {
    var max = 0;
    for (var i in this.snakes) {
        if (this.snakes[i].alive && this.snakes[i].score > max) {
            max = this.snakes[i].score;
        }
    }
    return max;
};

// Process inputs for the neural network
Game.prototype.getNetworkInputs = function(snake) {
    var head = snake.body[0];
    
    // Relative food direction
    var foodDirX = this.food.x - head.x;
    var foodDirY = this.food.y - head.y;
    
    // Normalize to range [-1, 1]
    var normFoodDirX = foodDirX === 0 ? 0 : (foodDirX / Math.abs(foodDirX));
    var normFoodDirY = foodDirY === 0 ? 0 : (foodDirY / Math.abs(foodDirY));
    
    // Danger detection - check if there are obstacles (walls or snake body) in each direction
    // Get positions of squares in the left, front, and right directions relative to snake's current direction
    var checkPositions = this.getRelativeCheckPositions(snake);
    
    // For each position, check if there's a collision (wall, snake body, or obstacle)
    var dangerLeft = this.checkCollision(checkPositions.left.x, checkPositions.left.y, snake) ? 1 : 0;
    var dangerFront = this.checkCollision(checkPositions.front.x, checkPositions.front.y, snake) ? 1 : 0;
    var dangerRight = this.checkCollision(checkPositions.right.x, checkPositions.right.y, snake) ? 1 : 0;
    
    // Build the input array
    return [
        normFoodDirX, // Food X direction
        normFoodDirY, // Food Y direction
        dangerLeft,   // Danger on the left
        dangerFront,  // Danger in front
        dangerRight,  // Danger on the right
        
        // One-hot encoding of current direction
        snake.direction === DIRECTION.UP ? 1 : 0,
        snake.direction === DIRECTION.RIGHT ? 1 : 0,
        snake.direction === DIRECTION.DOWN ? 1 : 0,
        snake.direction === DIRECTION.LEFT ? 1 : 0
    ];
};

// Check if a position would result in collision
Game.prototype.checkCollision = function(x, y, snake) {
    // Check wall collision
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        return true;
    }
    
    // Check body collision (excluding the tail which will move)
    for (var i = 0; i < snake.body.length - 1; i++) {
        if (x === snake.body[i].x && y === snake.body[i].y) {
            return true;
        }
    }
    
    // Check obstacle collision
    for (var i = 0; i < this.obstacles.length; i++) {
        if (x === this.obstacles[i].x && y === this.obstacles[i].y) {
            return true;
        }
    }
    
    return false;
};

// Get check positions relative to current direction (left, front, right)
Game.prototype.getRelativeCheckPositions = function(snake) {
    var head = snake.body[0];
    var positions = {
        left: {x: head.x, y: head.y},
        front: {x: head.x, y: head.y},
        right: {x: head.x, y: head.y}
    };
    
    // Calculate positions based on current direction
    switch (snake.direction) {
        case DIRECTION.UP:
            positions.left.x -= 1;
            positions.front.y -= 1;
            positions.right.x += 1;
            break;
        case DIRECTION.RIGHT:
            positions.left.y -= 1;
            positions.front.x += 1;
            positions.right.y += 1;
            break;
        case DIRECTION.DOWN:
            positions.left.x += 1;
            positions.front.y += 1;
            positions.right.x -= 1;
            break;
        case DIRECTION.LEFT:
            positions.left.y += 1;
            positions.front.x -= 1;
            positions.right.y -= 1;
            break;
    }
    
    return positions;
};

// Render the game
Game.prototype.display = function() {
    var self = this;
    
    // Clear the canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Get config for UI elements
    const showGrid = window.CONFIG ? CONFIG.ui.showGrid : true;
    const showVision = window.CONFIG ? CONFIG.ui.showVision : true;
    const showAllSnakes = window.CONFIG ? !CONFIG.ui.showBestOnly : true;
    const showTopN = window.CONFIG ? CONFIG.ui.showTopN : 5;
    const gridColor = window.CONFIG ? CONFIG.ui.gridColor : 'rgba(50, 50, 50, 0.2)';
    const foodColor = window.CONFIG ? CONFIG.ui.foodColor : '#e74c3c';
    const obstacleColor = window.CONFIG ? CONFIG.ui.obstacleColor : '#34495e';
    const bestSnakeColor = window.CONFIG ? CONFIG.ui.bestSnakeColor : '#ff0000';
    const normalSnakeColor = window.CONFIG ? CONFIG.ui.normalSnakeColor : '#2ecc71';
    const ghostSnakeColor = window.CONFIG ? CONFIG.ui.ghostSnakeColor : 'rgba(200, 200, 200, 0.2)';
    
    // Find the best performing snake (highest score)
    let bestSnakeIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < this.snakes.length; i++) {
        if (this.snakes[i].alive && this.snakes[i].score > bestScore) {
            bestScore = this.snakes[i].score;
            bestSnakeIdx = i;
        }
    }
    
    // Background
    this.ctx.fillStyle = window.CONFIG ? CONFIG.ui.backgroundColor : '#141e30';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw the grid if enabled
    if (showGrid) {
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical grid lines
        for (let x = 0; x <= this.width; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal grid lines
        for (let y = 0; y <= this.height; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
    
    // Draw food
    this.ctx.fillStyle = foodColor;
    this.ctx.fillRect(
        this.food.x * this.tileSize,
        this.food.y * this.tileSize,
        this.tileSize,
        this.tileSize
    );
    
    // Add some glow effect to the food
    this.ctx.shadowColor = foodColor;
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.arc(
        (this.food.x + 0.5) * this.tileSize,
        (this.food.y + 0.5) * this.tileSize,
        this.tileSize / 2,
        0,
        Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // Draw obstacles
    this.ctx.fillStyle = obstacleColor;
    for (let i = 0; i < this.obstacles.length; i++) {
        this.ctx.fillRect(
            this.obstacles[i].x * this.tileSize,
            this.obstacles[i].y * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }
    
    // Draw all snakes with different visibility based on performance
    for (let i = 0; i < this.snakes.length; i++) {
        if (this.snakes[i].alive) {
            // Determine snake rendering style
            let isBestSnake = (i === bestSnakeIdx);
            let isTopPerformer = false;
            
            // Sort snakes by score to determine top performers
            if (!isBestSnake && showAllSnakes) {
                let snakeRank = 1;
                for (let j = 0; j < this.snakes.length; j++) {
                    if (j !== i && this.snakes[j].alive && this.snakes[j].score > this.snakes[i].score) {
                        snakeRank++;
                    }
                }
                isTopPerformer = (snakeRank <= showTopN);
            }
            
            // Only draw visible snakes (best, top performers, or all if configured)
            if (isBestSnake || isTopPerformer || showAllSnakes) {
                // Set color based on snake status
                let headColor, bodyColor;
                let opacity = 1.0;
                
                if (isBestSnake) {
                    // Best snake: bright red for head, orange-red gradient for body
                    headColor = bestSnakeColor;
                    bodyColor = '#ff6347'; // Tomato color for body
                } else if (isTopPerformer) {
                    // Top performers: normal color
                    headColor = normalSnakeColor;
                    bodyColor = '#27ae60'; // Darker green for body
                } else {
                    // Background snakes: transparent/ghosted
                    headColor = ghostSnakeColor;
                    bodyColor = ghostSnakeColor;
                    opacity = 0.2;
                }
                
                // Draw the snake body (segments)
                this.ctx.globalAlpha = opacity;
                for (let j = this.snakes[i].body.length - 1; j >= 0; j--) {
                    // For the best snake, create a gradient effect from body to head
                    if (isBestSnake) {
                        const gradientPos = j / this.snakes[i].body.length;
                        const r = Math.floor(255 - gradientPos * 50);
                        const g = Math.floor(99 - gradientPos * 80);
                        const b = Math.floor(71 - gradientPos * 50);
                        bodyColor = `rgb(${r}, ${g}, ${b})`;
                    }
                    
                    // Draw each segment
                    this.ctx.fillStyle = j === 0 ? headColor : bodyColor;
                    this.ctx.fillRect(
                        this.snakes[i].body[j].x * this.tileSize,
                        this.snakes[i].body[j].y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    
                    // Add details for head segment
                    if (j === 0) {
                        // Draw eyes
                        this.ctx.fillStyle = 'white';
                        
                        // Eye positions based on direction
                        const eyeSize = this.tileSize / 5;
                        const eyeOffset = this.tileSize / 3;
                        
                        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
                        
                        switch (this.snakes[i].direction) {
                            case DIRECTION.UP:
                                leftEyeX = this.snakes[i].body[j].x * this.tileSize + eyeOffset;
                                leftEyeY = this.snakes[i].body[j].y * this.tileSize + eyeOffset;
                                rightEyeX = this.snakes[i].body[j].x * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                rightEyeY = this.snakes[i].body[j].y * this.tileSize + eyeOffset;
                                break;
                            case DIRECTION.RIGHT:
                                leftEyeX = this.snakes[i].body[j].x * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                leftEyeY = this.snakes[i].body[j].y * this.tileSize + eyeOffset;
                                rightEyeX = this.snakes[i].body[j].x * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                rightEyeY = this.snakes[i].body[j].y * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                break;
                            case DIRECTION.DOWN:
                                leftEyeX = this.snakes[i].body[j].x * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                leftEyeY = this.snakes[i].body[j].y * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                rightEyeX = this.snakes[i].body[j].x * this.tileSize + eyeOffset;
                                rightEyeY = this.snakes[i].body[j].y * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                break;
                            case DIRECTION.LEFT:
                                leftEyeX = this.snakes[i].body[j].x * this.tileSize + eyeOffset;
                                leftEyeY = this.snakes[i].body[j].y * this.tileSize + this.tileSize - eyeOffset - eyeSize;
                                rightEyeX = this.snakes[i].body[j].x * this.tileSize + eyeOffset;
                                rightEyeY = this.snakes[i].body[j].y * this.tileSize + eyeOffset;
                                break;
                        }
                        
                        // Only draw eyes for best and top performers (not ghost snakes)
                        if (isBestSnake || isTopPerformer) {
                            this.ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
                            this.ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
                        }
                    }
                }
                
                // Reset opacity
                this.ctx.globalAlpha = 1.0;
                
                // For best snake, show vision lines and neural network inputs if enabled
                if (isBestSnake && showVision) {
                    this.drawVisionForSnake(this.snakes[i]);
                    
                    // Add label above best snake
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.fillStyle = 'white';
                    this.ctx.textAlign = 'center';
                    
                    // Get direction as string
                    let directionText = '';
                    switch (this.snakes[i].direction) {
                        case DIRECTION.UP: directionText = '↑'; break;
                        case DIRECTION.RIGHT: directionText = '→'; break;
                        case DIRECTION.DOWN: directionText = '↓'; break;
                        case DIRECTION.LEFT: directionText = '←'; break;
                    }
                    
                    // Draw text with shadow for better visibility
                    this.ctx.shadowColor = 'black';
                    this.ctx.shadowBlur = 4;
                    this.ctx.fillText(
                        `BEST SNAKE: ${directionText}`,
                        (this.snakes[i].body[0].x + 0.5) * this.tileSize,
                        this.snakes[i].body[0].y * this.tileSize - 5
                    );
                    this.ctx.shadowBlur = 0;
                }
            }
        }
    }
    
    // Continue rendering
    requestAnimationFrame(() => {
        this.display();
    });
};

// Check if a snake is the one with the highest score
Game.prototype.isBestSnake = function(snake) {
    if (!snake.alive) return false;
    
    var max = snake.score;
    for (var i in this.snakes) {
        if (this.snakes[i].alive && this.snakes[i].score > max) {
            return false;
        }
    }
    return true;
};

// Check if a position is dangerous (wall or snake collision)
Game.prototype.isDanger = function(x, y) {
    // Check wall collision
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
        return true;
    }
    
    // Check snake collision
    for (var i = 0; i < this.snakes.length; i++) {
        if (isPositionInSnake(x, y, this.snakes[i].body)) {
            return true;
        }
    }
    
    // Check obstacle collision
    for (var i = 0; i < this.obstacles.length; i++) {
        if (x === this.obstacles[i].x && y === this.obstacles[i].y) {
            return true;
        }
    }
    
    return false;
};

// Visualize the snake's vision (neural network inputs)
Game.prototype.drawVisionForSnake = function(snake) {
    // Get the head position
    const head = snake.body[0];
    const headX = (head.x + 0.5) * this.tileSize;
    const headY = (head.y + 0.5) * this.tileSize;
    
    // Get the food position
    const foodX = (this.food.x + 0.5) * this.tileSize;
    const foodY = (this.food.y + 0.5) * this.tileSize;
    
    // Draw a line to the food
    this.ctx.strokeStyle = 'rgba(231, 76, 60, 0.6)'; // Transparent red
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 3]); // Create a dashed line
    this.ctx.beginPath();
    this.ctx.moveTo(headX, headY);
    this.ctx.lineTo(foodX, foodY);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset to solid line
    
    // Draw vision rays in different directions
    const visionRayLength = 5 * this.tileSize; // Length of vision rays
    const directions = [
        { name: "left", angle: -Math.PI/4 },
        { name: "forward", angle: 0 },
        { name: "right", angle: Math.PI/4 }
    ];
    
    // Get the base angle based on snake direction
    let baseAngle;
    switch (snake.direction) {
        case DIRECTION.UP: baseAngle = -Math.PI/2; break;
        case DIRECTION.RIGHT: baseAngle = 0; break;
        case DIRECTION.DOWN: baseAngle = Math.PI/2; break;
        case DIRECTION.LEFT: baseAngle = Math.PI; break;
    }
    
    // Get the check positions
    const checkPositions = this.getRelativeCheckPositions(snake);
    const positions = [
        { name: "left", pos: checkPositions.left, dangerous: this.checkCollision(checkPositions.left.x, checkPositions.left.y, snake) },
        { name: "front", pos: checkPositions.front, dangerous: this.checkCollision(checkPositions.front.x, checkPositions.front.y, snake) },
        { name: "right", pos: checkPositions.right, dangerous: this.checkCollision(checkPositions.right.x, checkPositions.right.y, snake) }
    ];
    
    // Draw danger zones
    positions.forEach(position => {
        const centerX = (position.pos.x + 0.5) * this.tileSize;
        const centerY = (position.pos.y + 0.5) * this.tileSize;
        
        // Draw a circle at the position
        this.ctx.fillStyle = position.dangerous ? 'rgba(231, 76, 60, 0.5)' : 'rgba(46, 204, 113, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.tileSize * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw a ray to the position
        this.ctx.strokeStyle = position.dangerous ? 'rgba(231, 76, 60, 0.8)' : 'rgba(46, 204, 113, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(headX, headY);
        this.ctx.lineTo(centerX, centerY);
        this.ctx.stroke();
    });
    
    // For completeness, let's also draw extended vision rays beyond the immediate cells
    for (let i = 0; i < directions.length; i++) {
        const angle = baseAngle + directions[i].angle;
        const endX = headX + Math.cos(angle) * visionRayLength;
        const endY = headY + Math.sin(angle) * visionRayLength;
        
        // Draw extended vision ray
        this.ctx.strokeStyle = 'rgba(189, 195, 199, 0.2)'; // Very light gray
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]); // Dotted line
        this.ctx.beginPath();
        this.ctx.moveTo(headX, headY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset to solid line
    }
};

// Add method to calculate average score for stats display
Game.prototype.getAverageScore = function() {
    let total = 0;
    let count = 0;
    
    for (let i = 0; i < this.snakes.length; i++) {
        if (this.snakes[i].alive) {
            total += this.snakes[i].score;
            count++;
        }
    }
    
    return count > 0 ? total / count : 0;
};

// Initialize the game when the window loads
window.onload = function() {
    // Initialize the stats panel
    if (window.gameStats) {
        window.gameStats.initialize();
    }
    
    // Initialize Neuroevolution with configuration params
    let inputs = window.CONFIG ? CONFIG.network.inputs : 9;
    let hidden = window.CONFIG ? CONFIG.network.hiddenLayers : [16];
    let outputs = window.CONFIG ? CONFIG.network.outputs : 3;
    let population = window.CONFIG ? CONFIG.evolution.population : 100;
    let elitism = window.CONFIG ? CONFIG.evolution.elitism : 0.15;
    let randomBehaviour = window.CONFIG ? CONFIG.evolution.randomBehaviour : 0.2;
    let mutationRate = window.CONFIG ? CONFIG.evolution.mutationRate : 0.3;
    
    // Create Neuroevolution instance
    Neuvol = new Neuroevolution({
        population: population,
        network: [inputs, ...hidden, outputs],
        mutationRate: mutationRate,
        mutationRange: 0.5,
        elitism: elitism,
        randomBehaviour: randomBehaviour
    });
    
    // Create and start the game
    game = new Game();
    game.start();
    game.update();
};
