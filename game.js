(function () {
  const canvas = document.getElementById("snake-canvas");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const scoreValue = document.getElementById("score-value");
  const bestValue = document.getElementById("best-value");
  const speedValue = document.getElementById("speed-value");
  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const panel = document.querySelector(".game-panel");
  const startButton = document.getElementById("start-game");
  const pauseButton = document.getElementById("pause-game");
  const restartButton = document.getElementById("restart-game");
  const controlButtons = document.querySelectorAll(".control-button");

  const cellCount = 20;
  const cellSize = canvas.width / cellCount;
  const bestStorageKey = "snake-best-score";
  const directionMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    s: "down",
    d: "right",
    W: "up",
    A: "left",
    S: "down",
    D: "right"
  };
  const oppositeDirection = {
    up: "down",
    down: "up",
    left: "right",
    right: "left"
  };

  let snake;
  let direction;
  let queuedDirection;
  let food;
  let score;
  let bestScore = Number(window.localStorage.getItem(bestStorageKey) || 0);
  let timerId = null;
  let gameStarted = false;
  let gamePaused = false;
  let gameOver = false;

  function createInitialState() {
    snake = [
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 }
    ];
    direction = "right";
    queuedDirection = "right";
    food = spawnFood();
    score = 0;
    gameOver = false;
    gamePaused = false;
    scoreValue.textContent = "0";
    bestValue.textContent = String(bestScore);
    speedValue.textContent = "1x";
    setOverlay("Ready?", "Press Start or use any direction key to begin.", false);
    draw();
  }

  function spawnFood() {
    let candidate;
    do {
      candidate = {
        x: Math.floor(Math.random() * cellCount),
        y: Math.floor(Math.random() * cellCount)
      };
    } while (snake && snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y));
    return candidate;
  }

  function setOverlay(title, text, visible) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.classList.toggle("hidden", !visible);
  }

  function getSpeed() {
    return Math.max(80, 180 - score * 6);
  }

  function updateSpeedDisplay() {
    const ratio = (180 / getSpeed()).toFixed(1);
    speedValue.textContent = `${ratio}x`;
  }

  function startLoop() {
    if (timerId) {
      return;
    }
    timerId = window.setInterval(step, getSpeed());
  }

  function restartLoop() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    startLoop();
  }

  function stopLoop() {
    if (!timerId) {
      return;
    }
    window.clearInterval(timerId);
    timerId = null;
  }

  function updateBestScore() {
    if (score > bestScore) {
      bestScore = score;
      window.localStorage.setItem(bestStorageKey, String(bestScore));
      bestValue.textContent = String(bestScore);
      panel.classList.add("record-burst");
      window.setTimeout(() => panel.classList.remove("record-burst"), 700);
      setOverlay("New Record!", "Your pace just leveled up. Keep the streak alive.", true);
      window.setTimeout(() => {
        if (gameStarted && !gamePaused && !gameOver) {
          setOverlay("", "", false);
        }
      }, 700);
    }
  }

  function handleDirection(nextDirection) {
    if (!nextDirection) {
      return;
    }
    const current = queuedDirection || direction;
    if (oppositeDirection[current] === nextDirection) {
      return;
    }
    queuedDirection = nextDirection;
    if (!gameStarted) {
      startGame();
    }
  }

  function startGame() {
    if (gameOver) {
      createInitialState();
    }
    gameStarted = true;
    gamePaused = false;
    setOverlay("", "", false);
    startLoop();
  }

  function pauseGame() {
    if (!gameStarted || gameOver) {
      return;
    }
    if (gamePaused) {
      gamePaused = false;
      setOverlay("", "", false);
      startLoop();
    } else {
      gamePaused = true;
      stopLoop();
      setOverlay("Paused", "Press Pause again or use Start to continue.", true);
    }
  }

  function restartGame() {
    stopLoop();
    gameStarted = false;
    createInitialState();
  }

  function endGame() {
    gameOver = true;
    gameStarted = false;
    stopLoop();
    updateBestScore();
    setOverlay("Game Over", `Final score ${score}. Hit Restart to run again.`, true);
  }

  function step() {
    if (gamePaused || gameOver) {
      return;
    }

    direction = queuedDirection;
    const head = { ...snake[0] };

    if (direction === "up") {
      head.y -= 1;
    } else if (direction === "down") {
      head.y += 1;
    } else if (direction === "left") {
      head.x -= 1;
    } else if (direction === "right") {
      head.x += 1;
    }

    const hitWall = head.x < 0 || head.y < 0 || head.x >= cellCount || head.y >= cellCount;
    const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

    if (hitWall || hitSelf) {
      endGame();
      draw();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10;
      food = spawnFood();
      scoreValue.textContent = String(score);
      updateSpeedDisplay();
      restartLoop();
    } else {
      snake.pop();
    }

    draw();
  }

  function drawGridGlow() {
    ctx.save();
    ctx.strokeStyle = "rgba(103, 208, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let index = 0; index <= cellCount; index += 1) {
      const position = index * cellSize;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, position);
      ctx.lineTo(canvas.width, position);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, "#04111d");
    background.addColorStop(1, "#08182b");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGridGlow();

    ctx.fillStyle = "#ff7e89";
    ctx.shadowColor = "rgba(255, 101, 121, 0.55)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(food.x * cellSize + 4, food.y * cellSize + 4, cellSize - 8, cellSize - 8, 10);
    ctx.fill();

    snake.forEach((segment, index) => {
      const gradient = ctx.createLinearGradient(
        segment.x * cellSize,
        segment.y * cellSize,
        segment.x * cellSize + cellSize,
        segment.y * cellSize + cellSize
      );
      gradient.addColorStop(0, index === 0 ? "#87f8ff" : "#5de1d2");
      gradient.addColorStop(1, index === 0 ? "#4fb3ff" : "#2b70ff");
      ctx.fillStyle = gradient;
      ctx.shadowColor = "rgba(103, 208, 255, 0.45)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(segment.x * cellSize + 3, segment.y * cellSize + 3, cellSize - 6, cellSize - 6, 10);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
  }

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      pauseGame();
      return;
    }
    handleDirection(directionMap[event.key]);
  });

  controlButtons.forEach((button) => {
    button.addEventListener("click", () => handleDirection(button.dataset.dir));
  });

  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  restartButton.addEventListener("click", restartGame);

  createInitialState();
})();
