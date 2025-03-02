// Global variables
let spaceshipX, spaceshipY;
let projectiles = [];
let stars = [];
let enemies = [];
let powerups = [];
let particles = [];
let activePowerups = {};
let score = 0;
let gameState = "start";
let bg;
let lastShotFrame = 0;
let level = 1;
let MAX_PARTICLES = 300; // Add particle limit

// Leaderboard variables
let playerName = ""; // Start with empty name
let showLeaderboard = false;
let leaderboardData = [];
let formSubmitted = false;
let supabase; // Supabase client

// New variables for cursor blinking and auto leaderboard display
let autoShowLeaderboard = true;
let isEnteringName = false; // Flag to track if user is entering name
let nameSubmitted = false; // Flag to track if name has been submitted

function setup() {
  createCanvas(400, 600);
  
  // Initialize spaceship position
  spaceshipX = width / 2;
  spaceshipY = height - 50;
  
  // Create starry background
  bg = createGraphics(400, 600);
  bg.background(0); // Black space
  bg.fill(255); // White stars
  for (let i = 0; i < 100; i++) {
    let x = random(400);
    let y = random(600);
    bg.ellipse(x, y, 2, 2); // Small dots for stars
  }
  
  // Initialize Supabase client
  initSupabase();
  
  // Load player data from local storage if available
  loadPlayerData();
}

function draw() {
  try {
    console.log("Draw frame");
    // Display background
    image(bg, 0, 0);
    
    if (gameState === "start") {
      // Start screen
      fill(255);
      textSize(24);
      textAlign(CENTER, CENTER);
      text("Star Shooting Game\nPress Space to Start", width / 2, height / 2);
    } else if (gameState === "playing") {
      // Game logic
      handleSpaceship();
      handleProjectiles();
      handleStars();
      handleEnemies();
      handlePowerups();
      handleParticles();
      checkCollisions();
      displayScore();
      displayActivePowerups();
    } else if (gameState === "gameover") {
      // First ask for name if not submitted
      if (!nameSubmitted) {
        displayNameInput();
      } 
      // Then show leaderboard or game over screen
      else if (!formSubmitted) {
        submitScore();
        formSubmitted = true;
      }
      
      if (nameSubmitted) {
        if (autoShowLeaderboard) {
          displayLeaderboard();
        } else {
          // Game over screen
          fill(255);
          textSize(24);
          textAlign(CENTER, CENTER);
          text("Game Over\nFinal Score: " + score, width / 2, height / 2 - 40);
          
          // Make restart instructions more prominent
          fill(0, 200, 255);
          textSize(20);
          text("Press SPACE to Restart", width / 2, height / 2 + 40);
          
          fill(200);
          textSize(16);
          text("Press L to toggle Leaderboard", width / 2, height / 2 + 80);
        }
      }
    }
  } catch (e) {
    console.error("Error in draw:", e);
    // Try to show something on screen
    background(0);
    fill(255, 0, 0);
    textSize(20);
    textAlign(CENTER);
    text("Game Error! Check console.", width/2, height/2);
  }
}

// Initialize Supabase client
function initSupabase() {
  const SUPABASE_URL = 'https://gxaojpnjhxjghuadedxs.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4YW9qcG5qaHhqZ2h1YWRlZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4OTg5ODEsImV4cCI6MjA1NjQ3NDk4MX0.7U-egSyRH4C1Rk2oo2LZs0nLpc68ISU5HXlRE5jQN04';
  
  try {
    // Direct initialization without the wrapper
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    // Create a dummy client to prevent further errors
    supabase = {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: "Supabase not available" }),
        select: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null })
          })
        })
      })
    };
  }
}

// Load player data from local storage
function loadPlayerData() {
  if (localStorage.getItem('playerName')) {
    playerName = localStorage.getItem('playerName');
    // If we already have a name saved, we can skip the name input next time
    if (playerName.trim() !== "") {
      nameSubmitted = true;
    }
  }
}

// Save player data to local storage
function savePlayerData() {
  localStorage.setItem('playerName', playerName);
}

// Simplify the keyPressed function
function keyPressed() {
  // Handle name input
  if (gameState === "gameover" && !nameSubmitted && isEnteringName) {
    // Backspace to delete characters
    if (keyCode === BACKSPACE && playerName.length > 0) {
      playerName = playerName.substring(0, playerName.length - 1);
      return false;
    }
    // Enter to submit
    else if (keyCode === ENTER && playerName.trim() !== "") {
      nameSubmitted = true;
      isEnteringName = false;
      localStorage.setItem('playerName', playerName); // Save for future games
      return false;
    }
  }
  
  // Game controls
  if (keyCode === 32) { // Spacebar
    if (gameState === "start") {
      gameState = "playing";
    } else if (gameState === "gameover" && nameSubmitted) {
      resetGame();
      gameState = "start";
    }
    return false;
  }
  
  // L key to toggle leaderboard
  if (keyCode === 76 && gameState === "gameover" && nameSubmitted) { // L key
    autoShowLeaderboard = !autoShowLeaderboard;
    if (autoShowLeaderboard) {
      fetchLeaderboard();
    }
    return false;
  }
}

// Update the mouseClicked function to handle only the back button
function mouseClicked() {
  if (gameState === "gameover" && autoShowLeaderboard) {
    // Back button in leaderboard view
    if (mouseX > 150 && mouseX < 250 && mouseY > 450 && mouseY < 480) {
      autoShowLeaderboard = false;
    }
  }
}

// Simplify the submitScore function
async function submitScore() {
  try {
    console.log("Submitting score:", playerName, score); // Add debugging
    const { data, error } = await supabase
      .from('leaderboard')
      .insert([
        { 
          name: playerName, 
          score: score 
        }
      ]);
    
    if (error) {
      console.error('Error submitting score:', error);
    } else {
      console.log('Score submitted successfully');
      fetchLeaderboard(); // Refresh leaderboard data
    }
  } catch (err) {
    console.error('Failed to submit score:', err);
  }
}

// Update the fetchLeaderboard function to not use email
async function fetchLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else {
      leaderboardData = data;
    }
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err);
  }
}

// Update the displayLeaderboard function
function displayLeaderboard() {
  // Draw leaderboard background
  fill(0, 0, 0, 230);
  rect(50, 100, 300, 400, 10);
  
  fill(255);
  textSize(24);
  textAlign(CENTER);
  text("Leaderboard", width / 2, 130);
  
  // Add your score prominently
  fill(255, 255, 0);
  textSize(14);
  text("Your Score: " + score, width / 2, 155);
  
  // Display loading if data is not yet loaded
  if (leaderboardData.length === 0) {
    textSize(16);
    text("Loading...", width / 2, 250);
  } else {
    // Header
    textSize(16);
    textAlign(LEFT);
    fill(200);
    text("Rank", 70, 170);
    text("Player", 120, 170);
    text("Score", 280, 170);
    
    // Draw divider line
    stroke(150);
    line(70, 180, 330, 180);
    noStroke();
    
    // Display leaderboard entries
    textSize(14);
    fill(255);
    for (let i = 0; i < leaderboardData.length; i++) {
      const entry = leaderboardData[i];
      const y = 210 + i * 30;
      
      // Highlight player's score
      if (entry.name === playerName) {
        fill(255, 255, 0, 50);
        rect(60, y - 15, 280, 22, 5);
        fill(255, 255, 0);
      } else {
        fill(255);
      }
      
      text(`${i + 1}`, 70, y);
      
      // Truncate long names
      const displayName = entry.name.length > 15 ? entry.name.substring(0, 12) + "..." : entry.name;
      text(displayName, 120, y);
      text(entry.score, 280, y);
    }
  }
  
  // Make back button more visible
  fill(0, 150, 255);
  rect(150, 450, 100, 30, 5);
  
  fill(255);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("Back", 200, 465);
  
  // Make restart instruction clearer
  fill(0, 255, 100);
  textSize(16);
  text("Press SPACE to Restart", width / 2, 490);
}

// Spaceship movement and drawing
function handleSpaceship() {
  // Movement with arrow keys
  if (keyIsDown(LEFT_ARROW) && spaceshipX > 10) {
    spaceshipX -= 5;
  }
  if (keyIsDown(RIGHT_ARROW) && spaceshipX < width - 10) {
    spaceshipX += 5;
  }
  if (keyIsDown(UP_ARROW) && spaceshipY > 20) {
    spaceshipY -= 5;
  }
  if (keyIsDown(DOWN_ARROW) && spaceshipY < height - 20) {
    spaceshipY += 5;
  }
  
  // Shooting with spacebar (with cooldown)
  if (keyIsDown(32)) { // Space key
    let cooldown = activePowerups.rapidfire ? 5 : 10; // Faster shooting with powerup
    
    if (frameCount - lastShotFrame > cooldown) {
      if (activePowerups.tripleshot) {
        // Triple shot pattern
        projectiles.push({ x: spaceshipX, y: spaceshipY - 10 });
        projectiles.push({ x: spaceshipX - 8, y: spaceshipY - 5 });
        projectiles.push({ x: spaceshipX + 8, y: spaceshipY - 5 });
      } else {
        projectiles.push({ x: spaceshipX, y: spaceshipY - 10 });
      }
      lastShotFrame = frameCount;
    }
  }
  
  // Draw spaceship
  fill(150); // Gray body
  triangle(spaceshipX, spaceshipY - 10, spaceshipX - 10, spaceshipY + 10, spaceshipX + 10, spaceshipY + 10);
  fill(255, 0, 0); // Red cockpit
  ellipse(spaceshipX, spaceshipY, 5, 5);
  
  // Draw shield if active
  if (activePowerups.shield) {
    noFill();
    stroke(255, 0, 255, 150);
    ellipse(spaceshipX, spaceshipY, 30, 30);
    noStroke();
  }
  
  // Add engine trail
  if (frameCount % 3 === 0) {
    createTrail(spaceshipX, spaceshipY + 10, "engine");
  }
}

// Handle projectiles
function handleProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    // Move projectile up
    projectiles[i].y -= 10;
    
    // Add trail effect
    if (frameCount % 2 === 0) {
      createTrail(projectiles[i].x, projectiles[i].y, "projectile");
    }
    
    // Draw projectile
    fill(255);
    rect(projectiles[i].x - 1, projectiles[i].y - 5, 2, 10);
    
    // Remove if off-screen
    if (projectiles[i].y < 0) {
      projectiles.splice(i, 1);
    }
  }
}

// Handle stars (targets)
function handleStars() {
  // Spawn new star every 60 frames
  if (frameCount % 60 === 0) {
    stars.push({ x: random(20, width - 20), y: 0, size: random(10, 20) });
  }
  
  for (let i = stars.length - 1; i >= 0; i--) {
    let star = stars[i];
    
    // Move star
    if (star.isEnemyProjectile) {
      // Move according to velocity
      star.x += star.speedX;
      star.y += star.speedY;
      
      // Draw enemy projectile
      fill(255, 0, 0);
      ellipse(star.x, star.y, star.size, star.size);
    } else {
      // Normal star behavior
      star.y += 2;
      
      // Draw normal star
      fill(255, 255, 0);
      ellipse(star.x, star.y, star.size, star.size);
      stroke(255, 255, 0, 100);
      line(star.x, star.y - star.size / 2, star.x, star.y + star.size / 2);
      line(star.x - star.size / 2, star.y, star.x + star.size / 2, star.y);
      noStroke();
    }
    
    // Remove if off-screen
    if (star.y > height || star.y < 0 || star.x < 0 || star.x > width) {
      stars.splice(i, 1);
    }
  }
}

// Handle enemies
function handleEnemies() {
  // Spawn rate increases dramatically with score
  let baseSpawnRate = 180; // Slow at the beginning
  let minSpawnRate = 30;   // Maximum spawn frequency (lower = more enemies)
  
  // More aggressive scaling based on score
  let spawnRate;
  if (score < 100) {
    // Slow and steady at the beginning
    spawnRate = baseSpawnRate;
  } else if (score < 300) {
    // Medium difficulty
    spawnRate = Math.max(baseSpawnRate - Math.floor((score-100)/20) * 15, 100);
  } else {
    // Hard difficulty
    spawnRate = Math.max(100 - Math.floor((score-300)/50) * 10, minSpawnRate);
  }
  
  if (frameCount % spawnRate === 0) {
    let type = random(["chaser", "shooter", "zigzag"]);
    
    // Enemy health increases more significantly with score
    let baseHealth;
    if (score < 100) {
      baseHealth = 1; // Easy to kill at the beginning
    } else if (score < 300) {
      baseHealth = 1 + Math.floor((score-100)/50); // Gradually tougher
    } else {
      baseHealth = 5 + Math.floor((score-300)/100); // Very tough at high scores
    }
    
    // Zigzag enemies are always tougher
    let health = type === "zigzag" ? baseHealth + 2 : baseHealth;
    
    enemies.push({ 
      x: random(30, width - 30), 
      y: 0, 
      type: type,
      health: health,
      size: type === "shooter" ? 25 : 20,
      speedX: type === "zigzag" ? (random() > 0.5 ? 1.5 : -1.5) : 0,
      speedY: type === "chaser" ? 2.5 : 1.5,
      lastShot: frameCount
    });
  }
  
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    // Move enemy based on type
    if (enemy.type === "chaser") {
      // Chase the player
      if (enemy.x < spaceshipX) enemy.x += 1;
      if (enemy.x > spaceshipX) enemy.x -= 1;
      enemy.y += enemy.speedY;
    } else if (enemy.type === "shooter") {
      // Moves slower but shoots
      enemy.y += enemy.speedY;
      
      // Shoot every 120 frames
      if (frameCount - enemy.lastShot > 120) {
        let angle = atan2(spaceshipY - enemy.y, spaceshipX - enemy.x);
        stars.push({ 
          x: enemy.x, 
          y: enemy.y, 
          size: 10,
          speedX: cos(angle) * 3,
          speedY: sin(angle) * 3,
          isEnemyProjectile: true
        });
        enemy.lastShot = frameCount;
      }
    } else if (enemy.type === "zigzag") {
      // Zig-zag movement
      enemy.x += enemy.speedX;
      enemy.y += enemy.speedY;
      
      // Bounce off walls
      if (enemy.x < 20 || enemy.x > width - 20) {
        enemy.speedX *= -1;
      }
    }
    
    // Draw enemy
    drawEnemy(enemy);
    
    // Remove if off-screen
    if (enemy.y > height) {
      enemies.splice(i, 1);
    }
  }
}

function drawEnemy(enemy) {
  push();
  if (enemy.type === "chaser") {
    fill(255, 0, 0); // Red for chaser
    triangle(enemy.x, enemy.y - 10, enemy.x - 10, enemy.y + 10, enemy.x + 10, enemy.y + 10);
  } else if (enemy.type === "shooter") {
    fill(0, 0, 255); // Blue for shooter
    ellipse(enemy.x, enemy.y, enemy.size, enemy.size);
    fill(255);
    ellipse(enemy.x, enemy.y, 10, 10); // "gun"
  } else if (enemy.type === "zigzag") {
    fill(255, 165, 0); // Orange for zigzag
    beginShape();
    vertex(enemy.x, enemy.y - 10);
    vertex(enemy.x + 10, enemy.y);
    vertex(enemy.x, enemy.y + 10);
    vertex(enemy.x - 10, enemy.y);
    endShape(CLOSE);
  }
  pop();
}

// Handle powerups
function handlePowerups() {
  // Powerup spawn rate increases with score
  let powerupSpawnRate = Math.max(300 - Math.floor(score/75) * 20, 120); // More powerups as score increases
  
  if (frameCount % powerupSpawnRate === 0) {
    let type = random(["rapidfire", "tripleshot", "shield"]);
    powerups.push({ 
      x: random(20, width - 20), 
      y: 0, 
      type: type,
      size: 15 
    });
  }
  
  // Update powerup timers
  for (let type in activePowerups) {
    activePowerups[type].duration--;
    if (activePowerups[type].duration <= 0) {
      delete activePowerups[type];
    }
  }
  
  for (let i = powerups.length - 1; i >= 0; i--) {
    // Move powerup down
    powerups[i].y += 1.5;
    
    // Draw powerup
    drawPowerup(powerups[i]);
    
    // Remove if off-screen
    if (powerups[i].y > height) {
      powerups.splice(i, 1);
    }
  }
}

function drawPowerup(powerup) {
  push();
  
  // Common glow effect for all powerups
  noFill();
  stroke(255, 255, 255, 100 + sin(frameCount * 0.1) * 50);
  strokeWeight(2);
  let glowSize = powerup.size + 5 + sin(frameCount * 0.1) * 3;
  ellipse(powerup.x, powerup.y, glowSize, glowSize);
  
  // Draw specific shape based on powerup type
  if (powerup.type === "rapidfire") {
    // Lightning bolt for rapid fire
    fill(0, 255, 0); // Green
    
    // Draw lightning bolt
    beginShape();
    vertex(powerup.x, powerup.y - powerup.size);  // Top
    vertex(powerup.x - powerup.size/3, powerup.y - powerup.size/3);  // Upper left
    vertex(powerup.x, powerup.y);  // Middle
    vertex(powerup.x - powerup.size/3, powerup.y + powerup.size/3);  // Lower left
    vertex(powerup.x, powerup.y + powerup.size);  // Bottom
    vertex(powerup.x + powerup.size/3, powerup.y + powerup.size/3);  // Lower right
    vertex(powerup.x, powerup.y);  // Middle again
    vertex(powerup.x + powerup.size/3, powerup.y - powerup.size/3);  // Upper right
    endShape(CLOSE);
    
  } else if (powerup.type === "tripleshot") {
    // Three small projectiles for triple shot
    fill(0, 0, 255); // Blue
    
    // Draw center projectile
    rect(powerup.x - 1, powerup.y - powerup.size/2, 2, powerup.size);
    
    // Draw left projectile
    rect(powerup.x - powerup.size/2 - 1, powerup.y - powerup.size/3, 2, powerup.size/1.5);
    
    // Draw right projectile
    rect(powerup.x + powerup.size/2 - 1, powerup.y - powerup.size/3, 2, powerup.size/1.5);
    
    // Draw a connecting line
    ellipse(powerup.x, powerup.y + powerup.size/3, powerup.size, powerup.size/3);
    
  } else if (powerup.type === "shield") {
    // Shield shape
    fill(255, 0, 255); // Purple
    
    // Draw shield body
    arc(powerup.x, powerup.y, powerup.size*1.5, powerup.size*1.5, PI + QUARTER_PI, TWO_PI + QUARTER_PI);
    
    // Draw shield rim
    noFill();
    stroke(255, 0, 255);
    strokeWeight(2);
    arc(powerup.x, powerup.y, powerup.size*1.8, powerup.size*1.8, PI + QUARTER_PI, TWO_PI + QUARTER_PI);
    
    // Draw shield center detail
    fill(255);
    noStroke();
    ellipse(powerup.x, powerup.y, powerup.size/3, powerup.size/3);
  }
  
  strokeWeight(1);
  pop();
}

function displayActivePowerups() {
  let y = 60;
  for (let type in activePowerups) {
    fill(255);
    textAlign(LEFT);
    textSize(12);
    text(type + ": " + Math.ceil(activePowerups[type].duration / 60) + "s", 10, y);
    y += 20;
  }
}

// Handle particles with limit
function handleParticles() {
  // Limit total particles to prevent lag
  while (particles.length > MAX_PARTICLES) {
    particles.shift(); // Remove oldest particles when limit is reached
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Update position
    p.x += p.vx;
    p.y += p.vy;
    
    // Apply gravity or resistance
    p.vy += p.gravity;
    p.life -= p.decay;
    
    // Draw particle
    if (p.type === "explosion") {
      fill(p.r, p.g, p.b, p.life * 255);
      ellipse(p.x, p.y, p.size * p.life, p.size * p.life);
    } else if (p.type === "trail") {
      fill(p.r, p.g, p.b, p.life * 255);
      ellipse(p.x, p.y, p.size * p.life, p.size * p.life);
    }
    
    // Remove dead particles
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Create explosion particles with limit check
function createExplosion(x, y, color, count = 20) {
  // Limit explosion size if we're near max particles
  if (particles.length > MAX_PARTICLES - 20) {
    count = 5; // Smaller explosions when near limit
  }
  
  for (let i = 0; i < count; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.5, 2);
    let r, g, b;
    
    if (color === "yellow") {
      r = 255; g = 255; b = 0;
    } else if (color === "red") {
      r = 255; g = random(50, 150); b = 0;
    } else if (color === "blue") {
      r = 0; g = 100; b = 255;
    } else {
      r = random(200, 255); g = random(200, 255); b = random(200, 255);
    }
    
    particles.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(3, 8),
      life: 1,
      decay: random(0.01, 0.03),
      gravity: 0.01,
      r: r, g: g, b: b,
      type: "explosion"
    });
  }
}

// Create trail particles with limit check
function createTrail(x, y, color) {
  // Skip creating trail particles if we're near the limit
  if (particles.length > MAX_PARTICLES - 10) {
    return;
  }
  
  let r, g, b;
  
  if (color === "engine") {
    r = 255; g = random(100, 200); b = 0;
  } else if (color === "projectile") {
    r = 100; g = 100; b = 255;
  }
  
  particles.push({
    x: x + random(-2, 2),
    y: y + random(-2, 2),
    vx: random(-0.3, 0.3),
    vy: random(-0.3, 0.3),
    size: random(2, 4),
    life: 1,
    decay: random(0.05, 0.1),
    gravity: 0,
    r: r, g: g, b: b,
    type: "trail"
  });
}

// Collision detection
function checkCollisions() {
  // Projectile vs Star/Enemy
  for (let i = projectiles.length - 1; i >= 0; i--) {
    // Skip if this projectile was already removed
    if (!projectiles[i]) continue;
    
    // Check against stars
    for (let j = stars.length - 1; j >= 0; j--) {
      // Skip if this star was already removed
      if (!stars[j]) continue;
      
      let d = dist(projectiles[i].x, projectiles[i].y, stars[j].x, stars[j].y);
      if (d < stars[j].size / 2 + 5) {
        // Create explosion effect
        createExplosion(stars[j].x, stars[j].y, "yellow", 10);
        
        stars.splice(j, 1);
        projectiles.splice(i, 1);
        score += 1;
        break; // Exit inner loop after hit
      }
    }
    
    // Skip the enemies check if projectile was already removed
    if (!projectiles[i]) continue;
    
    // Check against enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      // Skip if this enemy was already removed
      if (!enemies[j]) continue;
      
      let d = dist(projectiles[i].x, projectiles[i].y, enemies[j].x, enemies[j].y);
      if (d < enemies[j].size / 2 + 5) {
        enemies[j].health -= 1;
        
        // Smaller hit effect
        createExplosion(projectiles[i].x, projectiles[i].y, "red", 5);
        
        if (enemies[j].health <= 0) {
          // Big explosion effect
          createExplosion(enemies[j].x, enemies[j].y, "red", 20);
          
          // Drop powerup with increasing probability based on score
          let dropChance = 0.2 + Math.min(score/500, 0.3); // Max 50% chance at high scores
          if (random() < dropChance) {
            let type = random(["rapidfire", "tripleshot", "shield"]);
            powerups.push({ 
              x: enemies[j].x, 
              y: enemies[j].y, 
              type: type,
              size: 15 
            });
          }
          
          enemies.splice(j, 1);
          score += 5;
        }
        projectiles.splice(i, 1);
        break;
      }
    }
  }
  
  // Powerup vs Spaceship
  for (let i = powerups.length - 1; i >= 0; i--) {
    // Skip if powerup was removed
    if (!powerups[i]) continue;
    
    let d = dist(spaceshipX, spaceshipY, powerups[i].x, powerups[i].y);
    if (d < powerups[i].size / 2 + 10) { // Collision with spaceship
      // Activate powerup
      activePowerups[powerups[i].type] = { duration: 600 }; // 10 seconds (60fps * 10)
      powerups.splice(i, 1);
    }
  }
  
  // Star vs Spaceship
  for (let i = stars.length - 1; i >= 0; i--) {
    // Skip if star was removed
    if (!stars[i]) continue;
    
    let d = dist(spaceshipX, spaceshipY, stars[i].x, stars[i].y);
    if (d < stars[i].size / 2 + 10) { // Collision with spaceship
      if (activePowerups.shield) {
        // Shield absorbs one hit
        delete activePowerups.shield;
        stars.splice(i, 1);
      } else {
        gameState = "gameover";
      }
    }
  }
  
  // Enemy vs Spaceship
  for (let i = enemies.length - 1; i >= 0; i--) {
    // Skip if enemy was removed
    if (!enemies[i]) continue;
    
    let d = dist(spaceshipX, spaceshipY, enemies[i].x, enemies[i].y);
    if (d < enemies[i].size / 2 + 10) {
      if (activePowerups.shield) {
        delete activePowerups.shield;
        enemies.splice(i, 1);
      } else {
        gameState = "gameover";
      }
    }
  }
}

// Display score
function displayScore() {
  fill(255);
  textSize(20);
  textAlign(CENTER);
  text("Score: " + score, width / 2, 30);
}

// Reset game variables
function resetGame() {
  spaceshipX = width / 2;
  spaceshipY = height - 50;
  projectiles = [];
  stars = [];
  enemies = [];
  powerups = [];
  particles = []; // Make sure particles are cleared
  activePowerups = {};
  score = 0;
  lastShotFrame = 0;
  level = 1;
  formSubmitted = false;
  nameSubmitted = false; // Reset name submission
  autoShowLeaderboard = true;
  
  // Don't reset playerName so they don't have to type it again
  // But if they haven't entered a name yet, generate a random one
  if (playerName.trim() === "") {
    playerName = "Player" + Math.floor(Math.random() * 10000);
  }
}

// Simple name input display
function displayNameInput() {
  // Background
  fill(0, 0, 0, 200);
  rect(50, 200, 300, 200, 10);
  
  // Title
  fill(255);
  textSize(24);
  textAlign(CENTER);
  text("Enter Your Name", width / 2, 230);
  
  // Name input box
  fill(isEnteringName ? 220 : 200);
  rect(70, 260, 260, 40, 5);
  
  // Name text with cursor
  fill(0);
  textAlign(LEFT);
  textSize(18);
  text(playerName + (isEnteringName && frameCount % 30 < 15 ? "|" : ""), 80, 285);
  
  // Submit button
  if (playerName.trim() !== "") {
    fill(0, 150, 255);
  } else {
    fill(150);
  }
  rect(150, 320, 100, 40, 5);
  
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Submit", 200, 340);
  
  // Instructions
  fill(200);
  textSize(12);
  text("Click to type, then Submit", width / 2, 380);
}

// Handle mouse clicks for the name input
function mousePressed() {
  if (gameState === "gameover" && !nameSubmitted) {
    // Name field click
    if (mouseX > 70 && mouseX < 330 && mouseY > 260 && mouseY < 300) {
      isEnteringName = true;
    }
    // Submit button click
    else if (mouseX > 150 && mouseX < 250 && mouseY > 320 && mouseY < 360) {
      if (playerName.trim() !== "") {
        nameSubmitted = true;
        isEnteringName = false;
        localStorage.setItem('playerName', playerName); // Save for future games
      }
    }
    // Click elsewhere to deselect
    else {
      isEnteringName = false;
    }
  } else if (gameState === "gameover" && autoShowLeaderboard) {
    // Back button in leaderboard view
    if (mouseX > 150 && mouseX < 250 && mouseY > 450 && mouseY < 480) {
      autoShowLeaderboard = false;
    }
  }
}

// Handle keyboard input for name
function keyTyped() {
  if (gameState === "gameover" && !nameSubmitted && isEnteringName) {
    // Add character to name if it's a printable character
    if (key.length === 1 && playerName.length < 20) {
      playerName += key;
      return false;
    }
  }
  return true;
}

// Add a simple error handler to catch any global errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Game error:", message, "at line", lineno);
  
  // Try to display error on canvas
  if (typeof fill === 'function' && typeof textSize === 'function') {
    fill(255, 0, 0);
    textSize(14);
    textAlign(CENTER);
    text("Error: " + message, width/2, height/2);
  }
  
  return true; // Prevents the default error handling
};