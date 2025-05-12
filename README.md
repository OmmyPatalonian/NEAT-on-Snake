# Snake Game with Neuroevolution for Week of 4/10 - 4/16 in Info Science Serve and Sys

This project demonstrates the application of neuroevolution to teach AI agents how to play the classic Snake game. It uses a genetic algorithm approach to evolve neural networks that control the snakes.

## How It Works

### The Game

The classic Snake game where:
- The snake moves continuously in a grid
- The snake grows when it eats food
- The snake dies if it hits a wall or itself
- The goal is to grow as long as possible

### Neuroevolution

Neuroevolution combines neural networks with genetic algorithms to evolve increasingly better AI players:

1. **Population**: We create a population of neural networks (snakes)
2. **Neural Network Structure**:
   - **Inputs** (9 neurons):
     - Food direction X & Y relative to the snake's head
     - Danger detection in three directions (left, front, right)
     - Current direction (one-hot encoded)
   - **Hidden Layer** (16 neurons)
   - **Outputs** (3 neurons):
     - Turn left
     - Go straight
     - Turn right

3. **Fitness Function**: Snakes are evaluated based on:
   - Their final length (primary factor)
   - How long they survived (small bonus)

4. **Selection & Breeding**: The best-performing snakes are:
   - Selected for breeding
   - Combined using genetic crossover
   - Mutated slightly to explore new solutions

5. **Evolution**: Over generations, snakes learn to:
   - Avoid walls and their own body
   - Seek food efficiently
   - Grow longer and maximize their score

## Implementation Details

- Written in JavaScript for browser-based visualization
- Uses a feed-forward neural network architecture
- Implements a genetic algorithm with elitism, crossover, and mutation
- Visualizes both the game and evolution progress

## Controls

- **x1**: Normal speed
- **x2**: Double speed
- **x5**: 5x speed
- **MAX**: Maximum possible speed (useful for fast training)

## Modifications and Extensions

Possible extensions to this project:
- Add more complex environments with obstacles
- Visualize the neural network's decision-making
- Implement different network architectures
- Add interactive controls to modify evolution parameters
