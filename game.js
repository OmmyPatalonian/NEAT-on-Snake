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
var FPS = 60;
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
    if (newHead.x < 0 || newHead.x >= grid.width || 
        newHead.y < 0 || newHead.y >= grid.height) {
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
    this.gridWidth = 20;
    this.gridHeight = 20;
    this.tileSize = 20;
    
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
    this.snakes = [];
    this.score = 0;
    this.maxScore = 0;
    this.generation = 0;
    this.alives = 0;
    this.gen = [];
}

// Generate food at a random empty position
Game.prototype.generateFood = function() {
    var empty = true;
    
    // Try to find an empty position
    do {
        empty = true;
        this.food.x = Math.floor(Math.random() * this.gridWidth);
        this.food.y = Math.floor(Math.random() * this.gridHeight);
        
        // Check if this position is occupied by any snake
        for (var i = 0; i < this.snakes.length; i++) {
            if (isPositionInSnake(this.food.x, this.food.y, this.snakes[i].body)) {
                empty = false;
                break;
            }
        }
    } while (!empty);
};

// Start the game with a new generation
Game.prototype.start = function() {
    this.snakes = [];
    this.gen = Neuvol.nextGeneration();
    
    for (var i in this.gen) {
        this.snakes.push(new Snake());
    }
    
    this.generation++;
    this.alives = this.snakes.length;
    this.generateFood();
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

// Normalize a value between min and max to range [0,1]
function normalize(value, min, max) {
    return (value - min) / (max - min);
}

// Update game state
Game.prototype.update = function() {
    // Skip if no snakes
    if (this.snakes.length === 0) return;
    
    // Update each snake
    for (var i in this.snakes) {
        if (this.snakes[i].alive) {
            // Prepare inputs for neural network:
            // 1. Direction of food relative to snake head (normalized)
            // 2. Dangers in different directions
            var inputs = this.getNetworkInputs(this.snakes[i]);
            
            // Get neural network's decision: [goLeft, goStraight, goRight]
            var res = this.gen[i].compute(inputs);
            
            // Determine action based on the highest output value
            var maxIndex = 0;
            for (var j = 1; j < res.length; j++) {
                if (res[j] > res[maxIndex]) {
                    maxIndex = j;
                }
            }
            
            // Apply the action
            switch (maxIndex) {
                case 0: // Turn left
                    this.snakes[i].turnLeft();
                    break;
                case 1: // Go straight
                    this.snakes[i].goStraight();
                    break;
                case 2: // Turn right
                    this.snakes[i].turnRight();
                    break;
            }
            
            // Update snake position
            this.snakes[i].update(this);
            
            // Check if snake died after update
            if (!this.snakes[i].alive) {
                this.alives--;
                // Calculate final fitness: score (length) + small bonus for steps alive
                var fitness = this.snakes[i].score + (this.snakes[i].stepsAlive * 0.01);
                
                // Send the score to Neuroevolution
                Neuvol.networkScore(this.gen[i], fitness);
                
                // If all snakes are dead, start next generation
                if (this.isItEnd()) {
                    this.start();
                }
            }
            
            // Update max score
            if (this.snakes[i].score > this.maxScore) {
                this.maxScore = this.snakes[i].score;
                
                // Update UI
                document.getElementById('maxScore').textContent = this.maxScore;
            }
        }
    }
    
    // Update UI
    document.getElementById('currentScore').textContent = this.getBestCurrentScore();
    document.getElementById('generation').textContent = this.generation;
    document.getElementById('alive').textContent = this.alives;
    document.getElementById('population').textContent = Neuvol.options.population;
    
    // Schedule next update based on FPS
    var self = this;
    if (FPS === 0) {
        setZeroTimeout(function() {
            self.update();
        });
    } else {
        setTimeout(function() {
            self.update();
        }, 1000 / FPS);
    }
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
    
    // For each position, check if there's a collision (wall or snake body)
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
    
    // Draw the grid (optional)
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (var x = 0; x <= this.width; x += this.tileSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (var y = 0; y <= this.height; y += this.tileSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
    }
    
    // Draw food
    this.ctx.fillStyle = '#e74c3c';
    this.ctx.fillRect(
        this.food.x * this.tileSize,
        this.food.y * this.tileSize,
        this.tileSize,
        this.tileSize
    );
    
    // Draw all snakes
    for (var i in this.snakes) {
        if (this.snakes[i].alive) {
            // Choose colors based on whether it's the best snake
            var isTopSnake = this.isBestSnake(this.snakes[i]);
            var headColor = isTopSnake ? '#3498db' : '#2ecc71';
            var bodyColor = isTopSnake ? '#2980b9' : '#27ae60';
            
            // Draw snake body
            for (var j = 0; j < this.snakes[i].body.length; j++) {
                var segment = this.snakes[i].body[j];
                
                // Head has different color than body
                this.ctx.fillStyle = j === 0 ? headColor : bodyColor;
                
                // Draw segment
                this.ctx.fillRect(
                    segment.x * this.tileSize,
                    segment.y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
                
                // Draw a border around each segment
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(
                    segment.x * this.tileSize,
                    segment.y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
    }
    
    // Continue rendering
    requestAnimationFrame(function() {
        self.display();
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

// Initialize the game when the window loads
window.onload = function() {
    // Initialize Neuroevolution with 9 inputs:
    // - Food direction X (-1 to 1)
    // - Food direction Y (-1 to 1)
    // - Danger left (0 or 1)
    // - Danger front (0 or 1)
    // - Danger right (0 or 1)
    // - Current direction one-hot encoded (4 values)
    Neuvol = new Neuroevolution({
        population: 50,
        network: [9, [12], 3], // 9 inputs, 1 hidden layer with 12 neurons, 3 outputs (left, straight, right)
        mutationRate: 0.2,
        mutationRange: 0.5,
        elitism: 0.1,
        randomBehaviour: 0.2
    });
    
    // Create and start the game
    game = new Game();
    game.start();
    game.update();
    game.display();
};
