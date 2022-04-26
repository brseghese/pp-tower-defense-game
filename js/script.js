const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 900;
canvas.height = 600;

// global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let enemiesHard = 50;
let frame = 0;
let gameOver = false;
let score = 0;
let winningScore = 50;
let chosenDefender = 1;
let startNext = false;
let levelNext = false;
let startTime = 1;
let endTime = 3000;

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];
const resources = [];

const shot = new Audio("./assets/laser.mp3");
const music = new Audio("./assets/music.mp3");

music.addEventListener(
  "ended",
  function () {
    music.currentTime = 0;
    music.play();
  },
  false
);

// mouse
const mouse = {
  x: 10,
  y: 10,
  width: 0.1,
  height: 0.1,
  clicked: false,
};

canvas.addEventListener("mousedown", function () {
  mouse.clicked = true;
});

canvas.addEventListener("mouseup", function () {
  mouse.clicked = false;
});

let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener("mousemove", function (e) {
  mouse.x = e.x - canvasPosition.left;
  mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener("mouseleave", function () {
  mouse.x = undefined;
  mouse.y = undefined;
});

window.addEventListener("resize", function () {
  canvasPosition = canvas.getBoundingClientRect();
});

// game board
const controlsBar = {
  width: canvas.width,
  height: cellSize,
};

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
  }
  draw() {
    if (mouse.x && mouse.y && collision(this, mouse)) {
      ctx.strokeStyle = "gold";
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
}

function createGrid() {
  for (let y = cellSize; y < canvas.height; y += cellSize) {
    for (let x = 0; x < canvas.width; x += cellSize) {
      gameGrid.push(new Cell(x, y));
    }
  }
}
createGrid();

function handleGameGrid() {
  for (let i = 0; i < gameGrid.length; i++) {
    gameGrid[i].draw();
  }
}

// projectiles
const laser = new Image();
laser.src = "./assets/laser.png";

class Projectile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 10;
    this.power = 20;
    this.speed = 5;
  }
  update() {
    this.x += this.speed;
  }
  draw() {
    // ctx.fillStyle = "black";
    // ctx.beginPath();
    // ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
    // ctx.fill();
    ctx.drawImage(laser, this.x, this.y - 20, 40, 40);
  }
}

function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].update();
    projectiles[i].draw();

    for (let j = 0; j < enemies.length; j++) {
      if (
        enemies[j] &&
        projectiles[i] &&
        collision(projectiles[i], enemies[j])
      ) {
        enemies[j].health -= projectiles[i].power;
        projectiles.splice(i, 1);
        i--;
      }
    }

    if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}

// defenders
const defender1 = new Image();
defender1.src = "./assets/defender1.png";
const defender2 = new Image();
defender2.src = "./assets/defender2.png";

class Defender {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.shooting = false;
    this.shootingNow = false;
    this.health = 100;
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 150;
    this.spriteHeight = 120;
    this.minFrame = 0;
    this.maxFrame = 20;
    this.chosenDefender = chosenDefender;
  }
  draw() {
    // ctx.fillStyle = "blue";
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.font = "15px Orbitron";
    ctx.fillText(Math.floor(this.health), this.x + 14, this.y + 10);

    if (this.chosenDefender === 1) {
      ctx.drawImage(
        defender1,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.spriteWidth / 1.3,
        this.spriteHeight / 1.3
      );
    } else if (this.chosenDefender === 2) {
      ctx.drawImage(
        defender2,
        this.frameX * this.spriteWidth,
        0,
        this.spriteWidth,
        this.spriteHeight,
        this.x,
        this.y,
        this.spriteWidth / 1.3,
        this.spriteHeight / 1.3
      );
    }
  }
  update() {
    if (frame % 5 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
      if (this.frameX === 18) this.shootingNow = true;
    }
    if (this.shooting) {
      this.minFrame = 8;
      this.maxFrame = 20;
    } else {
      this.minFrame = 0;
      this.maxFrame = 8;
    }
    if (this.shooting && this.shootingNow) {
      projectiles.push(new Projectile(this.x + 100, this.y + 25));
      shot.play();
      this.shootingNow = false;
    }
  }
}

function handleDefenders() {
  for (let i = 0; i < defenders.length; i++) {
    defenders[i].draw();
    defenders[i].update();
    if (enemyPositions.indexOf(defenders[i].y) !== -1) {
      defenders[i].shooting = true;
    } else {
      defenders[i].shooting = false;
    }
    for (let j = 0; j < enemies.length; j++) {
      if (defenders[i] && collision(defenders[i], enemies[j])) {
        enemies[j].movement = 0;
        defenders[i].health -= 1;
      }
      if (defenders[i] && defenders[i].health <= 0) {
        defenders.splice(i, 1);
        i--;
        enemies[j].movement = enemies[j].speed;
      }
    }
  }
}

const card1 = {
  x: 710,
  y: 5,
  width: 70,
  height: 85,
};

const card2 = {
  x: 790,
  y: 5,
  width: 70,
  height: 85,
};

function chooseDefender() {
  let card1Stroke = "black";
  let card2Stroke = "black";

  if (collision(mouse, card1) && mouse.clicked) {
    chosenDefender = 1;
  } else if (collision(mouse, card2) && mouse.clicked) {
    chosenDefender = 2;
  }

  if (chosenDefender === 1) {
    card1Stroke = "gold";
    card2Stroke = "black";
  } else if (chosenDefender === 2) {
    card1Stroke = "black";
    card2Stroke = "gold";
  } else {
    card1Stroke = "black";
    card2Stroke = "black";
  }

  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
  ctx.strokeStyle = card1Stroke;
  ctx.strokeRect(card1.x, card1.y, card1.width, card1.height);
  ctx.drawImage(defender1, 0, 0, 150, 120, 706, -5, 115, 92);

  ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
  ctx.drawImage(defender2, 0, 0, 150, 120, 790, -5, 115, 92);
  ctx.strokeStyle = card2Stroke;
  ctx.strokeRect(card2.x, card2.y, card2.width, card2.height);
}

// floating messages
const floatingMessages = [];

class FloatingMessage {
  constructor(value, x, y, size, color) {
    this.value = value;
    this.x = x;
    this.y = y;
    this.size = size;
    this.lifeSpan = 0;
    this.color = color;
    this.opacity = 1;
  }
  update() {
    this.y -= 0.3;
    this.lifeSpan += 1;
    if (this.opacity > 0.03) this.opacity -= 0.03;
  }
  draw() {
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.font = this.size + "px Orbitron";
    ctx.fillText(this.value, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

function handleFloatingMessages() {
  for (let i = 0; i < floatingMessages.length; i++) {
    floatingMessages[i].update();
    floatingMessages[i].draw();
    if (floatingMessages[i].lifeSpan >= 50) {
      floatingMessages.splice(i, 1);
      i--;
    }
  }
}

// modal next level
const modalLevels = [];

class ModalNextLevel {
  constructor(
    modalX,
    modalY,
    modalWidth,
    modalHeight,
    buttonX,
    buttonY,
    buttonWidth,
    buttonHeight
  ) {
    this.modal = {
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight,
    };
    this.button = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
    };
  }
  draw() {
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(40, 40, 40, 1)";
    ctx.fillRect(
      this.modal.x,
      this.modal.y,
      this.modal.width,
      this.modal.height
    );
    ctx.strokeStyle = "black";
    ctx.strokeRect(
      this.modal.x,
      this.modal.y,
      this.modal.width,
      this.modal.height
    );
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.button.x,
      this.button.y,
      this.button.width,
      this.button.height
    );
    ctx.strokeStyle = "black";
    ctx.strokeRect(
      this.button.x,
      this.button.y,
      this.button.width,
      this.button.height
    );

    ctx.fillStyle = "gold";
    ctx.font = "30px Orbitron";
    ctx.fillText("Next Level", 355, 310);
  }
}

function handleModalNextLevel() {
  if (startTime >= endTime && enemies.length === 0) {
    levelNext = true;
    modalLevels[0].draw();

    if (collision(mouse, modalLevels[0].button) && mouse.clicked) {
      modalLevels.splice(0, 1);
      startTime = 1;
      winningScore += score;
      enemiesInterval = 600;
      enemiesHard += 10;
      numberOfResources += 300;

      for (let i = 0; i < defenders.length; i++) {
        defenders.splice(i, 1);
        i--;
      }
    }
  }
}

// enemies
const enemyTypes = [];
const enemy1 = new Image();
enemy1.src = "./assets/enemy1.png";
enemyTypes.push(enemy1);
const enemy2 = new Image();
enemy2.src = "./assets/enemy2.png";
enemyTypes.push(enemy2);
const enemy3 = new Image();
enemy3.src = "./assets/enemy3.png";
enemyTypes.push(enemy3);

class Enemy {
  constructor(verticalPosition) {
    this.x = canvas.width;
    this.y = verticalPosition;
    this.width = cellSize - cellGap * 2;
    this.height = cellSize - cellGap * 2;
    this.speed = Math.random() * 0.2 + 0.4;
    this.movement = this.speed;
    this.health = 100;
    this.maxHealth = this.health;
    this.enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    this.frameX = 0;
    this.frameY = 0;
    this.minFrame = 0;
    this.maxFrame = 5;
    this.spriteWidth = 60;
    this.spriteHeight = 130;
  }
  update() {
    this.x -= this.movement;
    if (frame % 10 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
    }
  }
  draw() {
    // ctx.fillStyle = "red";
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.font = "15px Orbitron";
    ctx.fillText(Math.floor(this.health), this.x + 9, this.y + 9);
    // ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dy);
    ctx.drawImage(
      this.enemyType,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y + 5,
      this.spriteWidth / 1.5,
      this.spriteHeight / 1.5
    );
  }
}

function handleEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].x < 0) {
      gameOver = true;
    }
    if (enemies[i].health <= 0) {
      let gainedResources = enemies[i].maxHealth / 10;
      floatingMessages.push(
        new FloatingMessage(
          "+" + gainedResources,
          enemies[i].x,
          enemies[i].y,
          30,
          "black"
        )
      );
      floatingMessages.push(
        new FloatingMessage("+" + gainedResources, 320, 80, 30, "gold")
      );
      numberOfResources += gainedResources;
      score += gainedResources;
      const findThisIndex = enemyPositions.indexOf(enemies[i].y);
      enemyPositions.splice(findThisIndex, 1);
      enemies.splice(i, 1);
      i--;
    }
  }

  if (frame % enemiesInterval === 0 && score < winningScore) {
    let verticalPosition =
      Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
    enemies.push(new Enemy(verticalPosition));
    enemyPositions.push(verticalPosition);
    if (enemiesInterval > 120) enemiesInterval -= enemiesHard;
  }
}

// resources
const amounts = [20, 30, 40];
const coin = new Image();
coin.src = "./assets/coins.png";

class Resources {
  constructor() {
    this.x = Math.random() * (canvas.width - cellSize);
    this.y = Math.floor(Math.random() * 5 + 1) * cellSize;
    this.width = cellSize;
    this.height = cellSize;
    this.amount = amounts[Math.floor(Math.random() * amounts.length)];
    this.timer = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.spriteWidth = 100;
    this.spriteHeight = 100;
    this.minFrame = 0;
    this.maxFrame = 4;
  }
  draw() {
    // ctx.fillStyle = "yellow";
    // ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "black";
    ctx.font = "15px Orbitron";
    ctx.fillText(this.amount, this.x + 20, this.y);

    ctx.drawImage(
      coin,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.spriteWidth / 1.5,
      this.spriteHeight / 1.5
    );
  }
  update() {
    if (frame % 7 === 0) {
      if (this.frameX < this.maxFrame) this.frameX++;
      else this.frameX = this.minFrame;
    }
  }
}

function handleResources() {
  if (frame % 500 === 0 && score < winningScore) {
    resources.push(new Resources());
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].draw();
    resources[i].update();
    if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
      numberOfResources += resources[i].amount;
      floatingMessages.push(
        new FloatingMessage(
          "+" + resources[i].amount,
          resources[i].x,
          resources[i].y,
          30,
          "black"
        )
      );
      floatingMessages.push(
        new FloatingMessage("+" + resources[i].amount, 320, 80, 30, "gold")
      );
      resources.splice(i, 1);
      i--;
    }
  }
}

// utilities

function handleGameStatus() {
  ctx.fillStyle = "gold";
  ctx.font = "30px Orbitron";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Resources: " + numberOfResources, 20, 80);
  if (gameOver) {
    ctx.fillStyle = "gold";
    ctx.font = "90px Orbitron";
    ctx.fillText("Game Over", 175, 250);
  }
  if (score >= winningScore && enemies.length === 0) {
    // ctx.fillStyle = "gold";
    // ctx.font = "60px Orbitron";
    // ctx.fillText("LEVEL COMPLETE", 130, 250);
    // ctx.font = "30px Orbitron";
    // ctx.fillText("You win with " + score + " points!", 134, 300);
    modalLevels.push(new ModalNextLevel(300, 200, 300, 200, 340, 260, 220, 80));
  }
}

canvas.addEventListener("click", function () {
  const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
  const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
  if (gridPositionY < cellSize) return;
  for (let i = 0; i < defenders.length; i++) {
    if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
      return;
  }
  let defenderCost = 100;
  if (
    numberOfResources >= defenderCost &&
    startNext === false &&
    levelNext === false
  ) {
    defenders.push(new Defender(gridPositionX, gridPositionY));
    numberOfResources -= defenderCost;
  } else if (startNext === false && levelNext === false) {
    floatingMessages.push(
      new FloatingMessage("Need More Resources", mouse.x, mouse.y, 20, "gold")
    );
  }
  startNext = false;
  levelNext = false;
});

// background
const back = new Image();
back.src = "./assets/background.png";
function background() {
  ctx.drawImage(back, 0, 100, 900, 500);
}

// game loop
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(40, 40, 40, 1)";
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  background();
  handleGameGrid();
  handleDefenders();
  handleResources();
  handleProjectiles();
  handleEnemies();
  chooseDefender();
  handleGameStatus();
  handleFloatingMessages();
  handleModalNextLevel();
  frame++;
  startTime++;
  if (!gameOver) requestAnimationFrame(animate);
}

// start game
const box = {
  x: 300,
  y: 200,
  width: 300,
  height: 200,
};

const button = {
  x: 340,
  y: 260,
  width: 220,
  height: 80,
};

function startButton() {
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(40, 40, 40, 1)";
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  ctx.fillStyle = "black";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(button.x, button.y, button.width, button.height);

  ctx.fillStyle = "gold";
  ctx.font = "30px Orbitron";
  ctx.fillText("Start Game", 355, 310);

  if (collision(mouse, button) && mouse.clicked) {
    startNext = true;
    music.play();
    animate();
  }
}

function startAnimate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(40, 40, 40, 1)";
  ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
  background();
  startButton();
  handleGameStatus();
  if (!startNext) requestAnimationFrame(startAnimate);
}

startAnimate();

function collision(first, second) {
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  )
    return true;
}
