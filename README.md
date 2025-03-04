# Star Shooting Game

A mobile-friendly space shooter game where you control a spaceship, shoot enemies, collect powerups, and compete for high scores!

## Features

- 🚀 Smooth touch controls for mobile devices
- 💥 Multiple enemy types with unique behaviors:
  - Chasers (Red): Follow your ship
  - Shooters (Blue): Fire projectiles at you
  - Zigzag (Orange): Move in a zigzag pattern
- ⭐ Collect stars for points
- 🎮 Progressive difficulty - game gets harder as your score increases
- 🛡️ Power-ups:
  - Shield: Protects from one hit
  - Triple Shot: Fire three projectiles at once
  - Rapid Fire: Increased firing rate
- 🏆 Online leaderboard system
- 🌟 Particle effects and visual feedback
- 📱 Responsive design for all screen sizes

## How to Play

1. **Starting the Game**
   - Tap the "START" button to begin
   - Your spaceship appears at the bottom of the screen

2. **Controls**
   - Drag anywhere on the screen to move your spaceship
   - Touch and hold your spaceship to shoot
   - Avoid colliding with enemies and their projectiles

3. **Scoring**
   - Collect stars: +1 point
   - Destroy enemies: +5 points
   - Try to survive as long as possible!

4. **Power-ups**
   - Green Lightning: Rapid Fire
   - Blue Triple: Triple Shot
   - Purple Arc: Shield

5. **Game Over**
   - Enter your name to save your score
   - View the leaderboard to see how you rank
   - Tap "RESTART" to play again

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Open the project directory:
   ```bash
   cd Star_shooting_Game
   ```

3. Serve the files using a local web server. You can use any of these methods:
   - Python: `python -m http.server`
   - Node.js: `npx serve`
   - PHP: `php -S localhost:8000`

4. Open in your browser:
   - Navigate to `http://localhost:8000` (or whatever port your server uses)
   - For mobile access, make sure your device is on the same network and use your computer's local IP address

## Technologies Used

- HTML5 Canvas
- p5.js for graphics and interaction
- Supabase for leaderboard functionality
- JavaScript ES6+

## Credits

Created by Rehan
Special thanks to the p5.js community and Supabase team.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 