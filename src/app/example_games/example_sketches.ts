export const bouncingShapeSketch = `
  return function(p) {
    let ball;
    let paddle;
    let bricks = [];
    let score = 0;

    p.setup = function() {
      p.createCanvas(600, 400);
      
      // Initialize ball
      ball = {
        x: p.width/2,
        y: p.height/2,
        diameter: 20,
        speedX: 5,
        speedY: -5
      };
      
      // Initialize paddle
      paddle = {
        x: p.width/2 - 50,
        y: p.height - 30,
        width: 100,
        height: 15,
        speed: 8  // Add paddle movement speed
      };
      
      // Create bricks
      let BrickRows = 4;
      let BrickCols = 8;
      let brickWidth = p.width/BrickCols;
      let brickHeight = 30;
      
      for (let i = 0; i < BrickRows; i++) {
        for (let j = 0; j < BrickCols; j++) {
          bricks.push({
            x: j * brickWidth,
            y: i * brickHeight,
            width: brickWidth,
            height: brickHeight,
            visible: true
          });
        }
      }
    };

    p.draw = function() {
      p.background(0);
      
      // Draw and update ball
      drawBall();
      updateBall();
      
      // Draw and update paddle
      drawPaddle();
      updatePaddle();
      
      // Draw bricks
      drawBricks();
      
      // Display score
      p.fill(255);
      p.textSize(20);
      p.text(\`Score: \${score}\`, 10, 30);
    };

    function drawBall() {
      p.fill(255);
      p.noStroke();
      p.circle(ball.x, ball.y, ball.diameter);
    }

    function updateBall() {
      ball.x += ball.speedX;
      ball.y += ball.speedY;
      
      // Wall collision
      if (ball.x + ball.diameter/2 > p.width || ball.x - ball.diameter/2 < 0) {
        ball.speedX *= -1;
      }
      if (ball.y - ball.diameter/2 < 0) {
        ball.speedY *= -1;
      }
      
      // Paddle collision
      if (ball.y + ball.diameter/2 > paddle.y && 
          ball.x > paddle.x && 
          ball.x < paddle.x + paddle.width) {
        ball.speedY *= -1;
        let hitPos = (ball.x - paddle.x) / paddle.width;
        ball.speedX = 10 * (hitPos - 0.5);
      }
      
      // Brick collision
      for (let brick of bricks) {
        if (brick.visible && 
            ball.x + ball.diameter/2 > brick.x && 
            ball.x - ball.diameter/2 < brick.x + brick.width &&
            ball.y + ball.diameter/2 > brick.y &&
            ball.y - ball.diameter/2 < brick.y + brick.height) {
          brick.visible = false;
          ball.speedY *= -1;
          score += 10;
        }
      }
      
      // Game over condition
      if (ball.y > p.height) {
        gameOver();
      }
    }

    function drawPaddle() {
      p.fill(255);
      p.noStroke();
      p.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    function updatePaddle() {
      // Move paddle based on arrow key input
      if (p.keyIsDown(p.LEFT_ARROW)) {
        paddle.x -= paddle.speed;
      }
      if (p.keyIsDown(p.RIGHT_ARROW)) {
        paddle.x += paddle.speed;
      }
      
      // Keep paddle within canvas bounds
      if (paddle.x < 0) paddle.x = 0;
      if (paddle.x + paddle.width > p.width) paddle.x = p.width - paddle.width;
    }

    function drawBricks() {
      p.fill(255, 0, 0);
      p.noStroke();
      for (let brick of bricks) {
        if (brick.visible) {
          p.rect(brick.x, brick.y, brick.width - 2, brick.height - 2);
        }
      }
    }

    function gameOver() {
      p.noLoop();
      p.fill(255);
      p.textSize(32);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(\`Game Over!\\nScore: \${score}\\nClick to restart\`, p.width/2, p.height/2);
    }

    p.mousePressed = function() {
      if (!p.isLooping()) {
        resetGame();
        p.loop();
      }
    };

    function resetGame() {
      ball.x = p.width/2;
      ball.y = p.height/2;
      ball.speedX = 5;
      ball.speedY = -5;
      score = 0;
      for (let brick of bricks) {
        brick.visible = true;
      }
    }
  }
`;

export const platformerGameSketch = `
return function(p) {
  let player;
  let platforms = [];
  let coins = [];
  let score = 0;
  let gravity = 0.5;
  let cameraOffsetY = 0;
  let gameOver = false;
  
  p.setup = function() {
    p.createCanvas(800, 600, p.WEBGL);
    resetGame();
  };
  
  p.draw = function() {
    p.background(100, 180, 240);
    
    if (!gameOver) {
      updateGame();
      drawGame();
    } else {
      drawGameOver();
    }
  };

  function updateGame() {
    updatePlayer();
    checkCollisions();
  }

  function drawGame() {
    p.push();
    p.translate(-player.x, -player.y + cameraOffsetY, -400);
    
    // Draw platforms
    for (let platform of platforms) {
      p.push();
      p.translate(platform.x, platform.y, platform.z);
      p.fill(100, 200, 100);
      p.box(platform.width, platform.height, 40);
      p.pop();
    }

    // Draw coins
    for (let coin of coins) {
      p.push();
      p.translate(coin.x, coin.y, coin.z);
      p.fill(255, 215, 0);
      p.sphere(10);
      p.pop();
    }
    
    // Draw player
    drawPlayer();
    
    p.pop();
    
    // UI Overlay
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Score: " + score, -p.width / 2 + 20, -p.height / 2 + 20);
  }

  function drawPlayer() {
    p.push();
    p.translate(player.x, player.y, player.z);
    p.fill(50, 150, 255);
    p.box(player.width, player.height, 30);
    p.pop();
  }

  function updatePlayer() {
    if (p.keyIsDown(p.LEFT_ARROW) || p.keyIsDown(65)) {
      player.x -= player.speed;
    }
    if (p.keyIsDown(p.RIGHT_ARROW) || p.keyIsDown(68)) {
      player.x += player.speed;
    }
    if ((p.keyIsDown(p.UP_ARROW) || p.keyIsDown(87)) && player.onGround) {
      player.velocityY = -12;
      player.onGround = false;
    }
    
    // Gravity and movement
    player.velocityY += gravity;
    player.y += player.velocityY;
    
    // Check collision with platforms
    for (let platform of platforms) {
      if (player.x > platform.x - platform.width / 2 &&
          player.x < platform.x + platform.width / 2 &&
          player.y + player.height / 2 > platform.y - platform.height / 2 &&
          player.y < platform.y) {
        player.y = platform.y - player.height / 2;
        player.velocityY = 0;
        player.onGround = true;
      }
    }
  }

  function checkCollisions() {
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      let d = p.dist(player.x, player.y, player.z, coin.x, coin.y, coin.z);
      if (d < 20) {
        score += 10;
        coins.splice(i, 1);
      }
    }
  }

  function resetGame() {
    player = { x: 0, y: -50, z: 0, width: 30, height: 50, velocityY: 0, speed: 5, onGround: false };
    platforms = [
      { x: 0, y: 0, z: 0, width: 200, height: 20 },
      { x: 200, y: -100, z: 0, width: 150, height: 20 },
      { x: 400, y: -200, z: 0, width: 150, height: 20 }
    ];
    coins = [
      { x: 200, y: -120, z: 0 },
      { x: 400, y: -220, z: 0 }
    ];
    score = 0;
    gameOver = false;
  }

  function drawGameOver() {
    p.fill(0, 0, 0, 150);
    p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
    
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Game Over", 0, -50);
    p.text("Score: " + score, 0, 0);
    p.text("Press SPACE to Restart", 0, 50);
    
    if (p.keyIsDown(32)) {
      resetGame();
    }
  }
}
`;

export const shootingGameSketch = `
return function(p) {
  // Game variables
  let player;
  let bullets = [];
  let enemies = [];
  let particles = [];
  let bloodSplats = [];
  let score = 0;
  let gameOver = false;
  let powerUps = [];
  let lastEnemySpawn = 0;
  
  // Colors
  const COLORS = {
    background: [10, 15, 30],
    player: [50, 150, 255],
    playerGlow: [30, 100, 200],
    bullet: [255, 240, 120],
    bulletGlow: [255, 200, 50, 100],
    enemy: [255, 70, 70],
    enemyGlow: [200, 40, 40, 100],
    blood: [180, 0, 0],
    darkBlood: [120, 0, 0],
    text: [255, 255, 255],
    healthBar: [255, 60, 60],
    powerUp: [120, 255, 150]
  };
  
  p.setup = function() {
    p.createCanvas(800, 600);
    p.smooth();
    resetGame();
  };
  
  function resetGame() {
    // Initialize player
    player = {
      x: p.width / 2,
      y: p.height / 2,
      size: 32,
      speed: 4.5,
      health: 100,
      maxHealth: 100,
      rotation: 0,
      powerUpTime: 0,
      fireRate: 10,
      lastShot: 0
    };
    
    // Clear arrays
    bullets = [];
    enemies = [];
    particles = [];
    bloodSplats = [];
    powerUps = [];
    score = 0;
    gameOver = false;
    lastEnemySpawn = p.frameCount;
  }
  
  p.draw = function() {
    // Draw starry background
    p.background(COLORS.background);
    drawStars();
    
    // Draw blood splats (permanent on the ground)
    drawBloodSplats();
    
    if (!gameOver) {
      updateGame();
      drawGame();
    } else {
      drawGameOver();
    }
  };
  
  function updateGame() {
    // Player movement
    let moving = false;
    let dx = 0, dy = 0;
    
    if (p.keyIsDown(87)) { dy -= 1; moving = true; } // W
    if (p.keyIsDown(83)) { dy += 1; moving = true; } // S
    if (p.keyIsDown(65)) { dx -= 1; moving = true; } // A
    if (p.keyIsDown(68)) { dx += 1; moving = true; } // D
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071; // 1/sqrt(2)
      dy *= 0.7071;
    }
    
    player.x += dx * player.speed;
    player.y += dy * player.speed;
    
    // Update player rotation to face mouse
    player.rotation = p.atan2(p.mouseY - player.y, p.mouseX - player.x);
    
    // Keep player in bounds
    player.x = p.constrain(player.x, player.size/2, p.width - player.size/2);
    player.y = p.constrain(player.y, player.size/2, p.height - player.size/2);
    
    // Update power-up timer
    if (player.powerUpTime > 0) {
      player.powerUpTime--;
      if (player.powerUpTime <= 0) {
        player.fireRate = 10; // Reset fire rate
      }
    }
    
    // Auto-fire if mouse is pressed
    if (p.mouseIsPressed && p.frameCount - player.lastShot >= player.fireRate) {
      fireBullet();
      player.lastShot = p.frameCount;
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      let bullet = bullets[i];
      bullet.x += bullet.speedX;
      bullet.y += bullet.speedY;
      bullet.life--;
      
      // Remove bullets that are off screen or expired
      if (bullet.x < 0 || bullet.x > p.width || bullet.y < 0 || bullet.y > p.height || bullet.life <= 0) {
        bullets.splice(i, 1);
        continue;
      }
      
      // Check for bullet hitting enemies
      for (let j = enemies.length - 1; j >= 0; j--) {
        let enemy = enemies[j];
        let d = p.dist(bullet.x, bullet.y, enemy.x, enemy.y);
        if (d < enemy.size / 2 + bullet.size / 2) {
          // Create explosion particles
          createExplosion(enemy.x, enemy.y, COLORS.enemy, 15);
          
          // Create blood splatter
          createBloodSplatter(enemy.x, enemy.y, 20);
          
          // Add permanent blood splat on the ground
          addBloodSplat(enemy.x, enemy.y);
          
          // Sometimes drop a power-up
          if (p.random() < 0.1) {
            powerUps.push({
              x: enemy.x,
              y: enemy.y,
              size: 20,
              type: 'rapidFire',
              pulsePhase: 0
            });
          }
          
          enemies.splice(j, 1);
          bullets.splice(i, 1);
          score += 10;
          break;
        }
      }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];
      
      // Move enemy towards player
      let angle = p.atan2(player.y - enemy.y, player.x - enemy.x);
      enemy.rotation = angle;
      enemy.x += p.cos(angle) * enemy.speed;
      enemy.y += p.sin(angle) * enemy.speed;
      
      // Update enemy animation
      enemy.phase = (enemy.phase + 0.1) % p.TWO_PI;
      
      // Check for collision with player
      let d = p.dist(player.x, player.y, enemy.x, enemy.y);
      if (d < player.size / 2 + enemy.size / 2) {
        player.health -= 15;
        createExplosion(enemy.x, enemy.y, COLORS.enemy, 20);
        createBloodSplatter(enemy.x, enemy.y, 30);
        addBloodSplat(enemy.x, enemy.y);
        enemies.splice(i, 1);
        
        if (player.health <= 0) {
          createExplosion(player.x, player.y, COLORS.player, 40);
          createBloodSplatter(player.x, player.y, 50);
          addBloodSplat(player.x, player.y, 2);
          gameOver = true;
        }
      }
    }
    
    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      let powerUp = powerUps[i];
      powerUp.pulsePhase = (powerUp.pulsePhase + 0.05) % p.TWO_PI;
      
      // Check for collision with player
      let d = p.dist(player.x, player.y, powerUp.x, powerUp.y);
      if (d < player.size / 2 + powerUp.size / 2) {
        if (powerUp.type === 'rapidFire') {
          player.fireRate = 3; // Faster fire rate
          player.powerUpTime = 300; // 5 seconds
        }
        powerUps.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      let particle = particles[i];
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life -= particle.decay;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Spawn enemies - fixed spawn system
    let currentTime = p.frameCount;
    let spawnDelay = p.max(10, 60 - score/100);
    
    if (currentTime - lastEnemySpawn >= spawnDelay) {
      spawnEnemy();
      lastEnemySpawn = currentTime;
    }
  }
  
  function drawGame() {
    // Draw particles behind everything
    drawParticles();
    
    // Draw power-ups
    for (let powerUp of powerUps) {
      let pulseSize = 1 + p.sin(powerUp.pulsePhase) * 0.2;
      
      // Glow effect
      p.noStroke();
      p.fill(...COLORS.powerUp, 100);
      p.circle(powerUp.x, powerUp.y, powerUp.size * 2 * pulseSize);
      
      // Power-up
      p.fill(COLORS.powerUp);
      p.circle(powerUp.x, powerUp.y, powerUp.size * pulseSize);
      
      // Symbol
      p.fill(255);
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("F", powerUp.x, powerUp.y);
    }
    
    // Draw bullets
    for (let bullet of bullets) {
      // Bullet glow
      p.noStroke();
      p.fill(COLORS.bulletGlow);
      p.circle(bullet.x, bullet.y, bullet.size * 2);
      
      // Bullet core
      p.fill(COLORS.bullet);
      p.circle(bullet.x, bullet.y, bullet.size);
    }
    
    // Draw enemies
    for (let enemy of enemies) {
      p.push();
      p.translate(enemy.x, enemy.y);
      p.rotate(enemy.rotation);
      
      // Enemy glow
      p.noStroke();
      p.fill(COLORS.enemyGlow);
      p.circle(0, 0, enemy.size * 1.5);
      
      // Enemy body
      p.fill(COLORS.enemy);
      p.circle(0, 0, enemy.size);
      
      // Enemy details
      p.fill(40);
      p.ellipse(enemy.size/4, -enemy.size/6, enemy.size/3, enemy.size/6);
      p.ellipse(enemy.size/4, enemy.size/6, enemy.size/3, enemy.size/6);
      
      // Enemy "legs"
      let legLength = enemy.size/2 * (0.8 + p.sin(enemy.phase) * 0.2);
      p.stroke(COLORS.enemy);
      p.strokeWeight(3);
      for (let i = 0; i < 3; i++) {
        let angle = p.PI/2 + p.PI/8 * (i-1);
        p.line(0, 0, -p.cos(angle) * legLength, p.sin(angle) * legLength);
      }
      
      p.pop();
    }
    
    // Draw player
    p.push();
    p.translate(player.x, player.y);
    p.rotate(player.rotation);
    
    // Player glow
    p.noStroke();
    p.fill(COLORS.playerGlow[0], COLORS.playerGlow[1], COLORS.playerGlow[2], 100);
    p.circle(0, 0, player.size * 1.5);
    
    // Player ship body
    p.fill(COLORS.player);
    p.beginShape();
    p.vertex(player.size/2, 0);
    p.vertex(-player.size/2, player.size/3);
    p.vertex(-player.size/3, 0);
    p.vertex(-player.size/2, -player.size/3);
    p.endShape(p.CLOSE);
    
    // Thruster
    if (p.keyIsDown(87) || p.keyIsDown(65) || p.keyIsDown(83) || p.keyIsDown(68)) {
      p.fill(255, 150, 50, 200 + p.random(-50, 50));
      p.beginShape();
      p.vertex(-player.size/3, 0);
      p.vertex(-player.size/2 - p.random(5, 15), player.size/5);
      p.vertex(-player.size/2 - p.random(5, 15), -player.size/5);
      p.endShape(p.CLOSE);
    }
    
    // Power-up indicator
    if (player.powerUpTime > 0) {
      p.noFill();
      p.strokeWeight(2);
      p.stroke(COLORS.powerUp[0], COLORS.powerUp[1], COLORS.powerUp[2], 
               150 + 100 * p.sin(p.frameCount * 0.1));
      p.circle(0, 0, player.size * 2);
    }
    
    p.pop();
    
    // Draw UI
    drawUI();
  }
  
  function drawUI() {
    // Health bar background
    p.noStroke();
    p.fill(40);
    p.rect(20, 20, 200, 15, 5);
    
    // Health bar
    let healthPercent = player.health / player.maxHealth;
    p.fill(COLORS.healthBar);
    p.rect(20, 20, 200 * healthPercent, 15, 5);
    
    // Health text
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(Math.ceil(player.health) + "/" + player.maxHealth, 120, 28);
    
    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(24);
    p.text("SCORE: " + score, p.width - 20, 20);
    
    // Enemy count
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("ENEMIES: " + enemies.length, p.width - 20, 50);
    
    // Power-up indicator
    if (player.powerUpTime > 0) {
      p.textAlign(p.LEFT, p.TOP);
      p.fill(COLORS.powerUp);
      p.text("RAPID FIRE: " + Math.ceil(player.powerUpTime / 60) + "s", 20, 50);
    }
  }
  
  function drawGameOver() {
    // Update particles even in game over
    drawParticles();
    for (let i = particles.length - 1; i >= 0; i--) {
      let particle = particles[i];
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.life -= particle.decay;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, p.width, p.height);
    
    // Game over text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(64);
    p.text("GAME OVER", p.width/2, p.height/2 - 60);
    
    p.textSize(32);
    p.text("FINAL SCORE: " + score, p.width/2, p.height/2 + 20);
    
    // Blinking restart text
    if (p.frameCount % 60 < 40) {
      p.textSize(24);
      p.text("PRESS SPACE TO RESTART", p.width/2, p.height/2 + 80);
    }
    
    if (p.keyIsDown(32)) { // SPACE
      resetGame();
    }
  }
  
  function drawStars() {
    // Draw stars in the background using perlin noise
    p.noStroke();
    
    for (let i = 0; i < 100; i++) {
      let x = (p.noise(i * 0.1, p.frameCount * 0.0005) * p.width * 1.5) % p.width;
      let y = (p.noise(i * 0.1 + 100, p.frameCount * 0.0005) * p.height * 1.5) % p.height;
      let size = p.noise(i * 0.1 + 200) * 3 + 1;
      let brightness = 150 + p.noise(i * 0.1 + 300, p.frameCount * 0.02) * 105;
      
      p.fill(brightness);
      p.circle(x, y, size);
    }
  }
  
  function drawParticles() {
    p.noStroke();
    for (let particle of particles) {
      p.fill(particle.color[0], particle.color[1], particle.color[2], particle.life);
      p.circle(particle.x, particle.y, particle.size);
    }
  }
  
  function drawBloodSplats() {
    p.noStroke();
    for (let splat of bloodSplats) {
      p.fill(splat.color[0], splat.color[1], splat.color[2], splat.alpha);
      p.circle(splat.x, splat.y, splat.size);
    }
  }
  
  function fireBullet() {
    let angle = p.atan2(p.mouseY - player.y, p.mouseX - player.x);
    let bulletSpeed = 12;
    let offsetDist = player.size / 2;
    
    // Create bullet at the tip of the ship
    bullets.push({
      x: player.x + p.cos(angle) * offsetDist,
      y: player.y + p.sin(angle) * offsetDist,
      speedX: p.cos(angle) * bulletSpeed,
      speedY: p.sin(angle) * bulletSpeed,
      size: 6,
      life: 60
    });
    
    // Create muzzle flash particles
    for (let i = 0; i < 5; i++) {
      let particleAngle = angle + p.random(-0.3, 0.3);
      particles.push({
        x: player.x + p.cos(angle) * offsetDist,
        y: player.y + p.sin(angle) * offsetDist,
        speedX: p.cos(particleAngle) * p.random(1, 3),
        speedY: p.sin(particleAngle) * p.random(1, 3),
        size: p.random(3, 8),
        life: p.random(20, 40),
        decay: p.random(1, 3),
        color: COLORS.bullet
      });
    }
  }
  
  function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      let angle = p.random(p.TWO_PI);
      let speed = p.random(0.5, 4);
      
      particles.push({
        x: x,
        y: y,
        speedX: p.cos(angle) * speed,
        speedY: p.sin(angle) * speed,
        size: p.random(3, 10),
        life: p.random(30, 100),
        decay: p.random(1, 3),
        color: color
      });
    }
  }
  
  function createBloodSplatter(x, y, count) {
    for (let i = 0; i < count; i++) {
      let angle = p.random(p.TWO_PI);
      let speed = p.random(1, 6);
      let darkBlood = p.random() > 0.5;
      
      particles.push({
        x: x,
        y: y,
        speedX: p.cos(angle) * speed,
        speedY: p.sin(angle) * speed,
        size: p.random(3, 12),
        life: p.random(50, 200),
        decay: p.random(0.5, 2),
        color: darkBlood ? COLORS.darkBlood : COLORS.blood
      });
    }
  }
  
  function addBloodSplat(x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      // Limit the maximum number of blood splats to prevent performance issues
      if (bloodSplats.length > 100) {
        bloodSplats.shift(); // Remove the oldest splat
      }
      
      bloodSplats.push({
        x: x + p.random(-20, 20),
        y: y + p.random(-20, 20),
        size: p.random(15, 40),
        color: p.random() > 0.3 ? COLORS.blood : COLORS.darkBlood,
        alpha: p.random(100, 180)
      });
    }
  }
  
  function spawnEnemy() {
    let enemy = {
      size: p.random(25, 40),
      speed: p.random(1, 1.5 + score/500),
      phase: p.random(p.TWO_PI),
      rotation: 0
    };
    
    // Spawn from edges
    let side = p.floor(p.random(4));
    switch(side) {
      case 0: // top
        enemy.x = p.random(p.width);
        enemy.y = -enemy.size;
        break;
      case 1: // right
        enemy.x = p.width + enemy.size;
        enemy.y = p.random(p.height);
        break;
      case 2: // bottom
        enemy.x = p.random(p.width);
        enemy.y = p.height + enemy.size;
        break;
      case 3: // left
        enemy.x = -enemy.size;
        enemy.y = p.random(p.height);
        break;
    }
    
    enemies.push(enemy);
  }
  
  p.mousePressed = function() {
    if (!gameOver) {
      fireBullet();
      player.lastShot = p.frameCount;
    }
  };
  
  p.keyPressed = function() {
    // Restart game with space
    if (gameOver && p.keyCode === 32) {
      resetGame();
    }
  };
};

`;