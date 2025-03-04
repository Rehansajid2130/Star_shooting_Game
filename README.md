# Star Shooter Game

A fun space-themed shooting game built with JavaScript and p5.js where players control a spaceship to shoot stars and enemies while collecting power-ups.

## How to Play

1. Use arrow keys to move your spaceship
2. Press SPACE to shoot
3. Collect power-ups to gain special abilities:
   - Rapid Fire: Shoot faster
   - Triple Shot: Fire three projectiles at once
   - Shield: Absorb one hit from enemies or stars

## Features

- Multiple enemy types with different behaviors
- Power-up system with various abilities
- Particle effects for explosions and trails
- Difficulty scaling based on score
- Online leaderboard system
- Local storage to remember player name

## Game Mechanics

### Enemies
- **Chasers**: Follow the player and move faster
- **Shooters**: Fire projectiles at the player
- **Zigzag**: Move in a zigzag pattern and have more health

### Difficulty Progression
- Under 50 points: Enemies spawn slowly and have only 1 health
- 50-100 points: Enemies move faster and spawn more frequently
- 100-300 points: Medium difficulty with gradually increasing spawn rates and health
- 300+ points: Hard difficulty with frequent enemy spawns and enemies requiring multiple hits

### Power-ups
Power-ups appear more frequently as your score increases, and enemies have a higher chance of dropping them at higher scores.

## Technologies Used

- JavaScript
- p5.js for graphics and game loop
- Supabase for leaderboard functionality

## Installation

1. Clone this repository
2. Open index.html in your browser
3. Enjoy the game!

## Future Improvements

- Add sound effects and music
- Implement more enemy types
- Add boss battles
- Create more power-ups
- Introduce achievements for reaching milestones

## Credits

Created by Rehan Sajid 