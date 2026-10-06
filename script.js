const SIZE = 4;
const STORAGE_BEST = "game2048-best";

let grid = [];
let score = 0;
let best = Number(localStorage.getItem(STORAGE_BEST)) || 0;
let gameOver = false;

const tileContainer = document.getElementById("tile-container");
const gridBackground = document.getElementById("grid-background");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const gameMessage = document.getElementById("game-message");
const messageText = document.getElementById("message-text");

function buildGridBackground() {
  gridBackground.innerHTML = "";
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    gridBackground.appendChild(cell);
  }
}

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getEmptyCells() {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
}

function addRandomTile() {
  const empties = getEmptyCells();
  if (empties.length === 0) return;
  const { r, c } = empties[Math.floor(Math.random() * empties.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function startGame() {
  grid = emptyGrid();
  score = 0;
  gameOver = false;
  gameMessage.classList.remove("show");
  addRandomTile();
  addRandomTile();
  updateScore();
  render();
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    localStorage.setItem(STORAGE_BEST, String(best));
  }
  bestScoreEl.textContent = best;
}

function render() {
  tileContainer.innerHTML = "";
  const cellSize = tileContainer.clientWidth / SIZE;
  const gap = 10;
  const step = (tileContainer.clientWidth - gap * (SIZE - 1)) / SIZE;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c];
      if (value === 0) continue;
      const tile = document.createElement("div");
      tile.className = `tile tile-${value > 2048 ? 2048 : value}`;
      tile.textContent = value;
      tile.style.width = `${step}px`;
      tile.style.height = `${step}px`;
      tile.style.top = `${r * (step + gap)}px`;
      tile.style.left = `${c * (step + gap)}px`;
      tileContainer.appendChild(tile);
    }
  }
}

function slideRowLeft(row) {
  const filtered = row.filter((v) => v !== 0);
  const result = [];
  let gained = 0;
  let moved = filtered.length !== row.length;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] !== 0 && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      gained += merged;
      i++;
      moved = true;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);

  for (let i = 0; i < SIZE; i++) {
    if (row[i] !== result[i]) moved = true;
  }

  return { row: result, gained, moved };
}

function reverse(arr) {
  return [...arr].reverse();
}

function transpose(g) {
  const t = emptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      t[c][r] = g[r][c];
    }
  }
  return t;
}

function move(direction) {
  if (gameOver) return;
  let moved = false;
  let totalGained = 0;

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < SIZE; r++) {
      let row = grid[r];
      if (direction === "right") row = reverse(row);
      const { row: newRow, gained, moved: rowMoved } = slideRowLeft(row);
      totalGained += gained;
      if (rowMoved) moved = true;
      grid[r] = direction === "right" ? reverse(newRow) : newRow;
    }
  } else {
    let t = transpose(grid);
    for (let r = 0; r < SIZE; r++) {
      let row = t[r];
      if (direction === "down") row = reverse(row);
      const { row: newRow, gained, moved: rowMoved } = slideRowLeft(row);
      totalGained += gained;
      if (rowMoved) moved = true;
      t[r] = direction === "down" ? reverse(newRow) : newRow;
    }
    grid = transpose(t);
  }

  if (moved) {
    score += totalGained;
    updateScore();
    addRandomTile();
    render();
    checkGameState();
  }
}

function canMove() {
  if (getEmptyCells().length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (c < SIZE - 1 && grid[r][c + 1] === v) return true;
      if (r < SIZE - 1 && grid[r + 1][c] === v) return true;
    }
  }
  return false;
}

function hasWon() {
  return grid.some((row) => row.some((v) => v >= 2048));
}

function checkGameState() {
  if (hasWon() && !gameOver) {
    gameOver = true;
    messageText.textContent = "بردی! 🎉";
    gameMessage.classList.add("show");
    return;
  }
  if (!canMove()) {
    gameOver = true;
    messageText.textContent = "باختی! بازی تمام شد.";
    gameMessage.classList.add("show");
  }
}

document.addEventListener("keydown", (e) => {
  const map = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

let touchStartX = 0;
let touchStartY = 0;

tileContainer.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

tileContainer.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}, { passive: true });

document.getElementById("new-game-btn").addEventListener("click", startGame);
document.getElementById("try-again-btn").addEventListener("click", startGame);

window.addEventListener("resize", render);

buildGridBackground();
bestScoreEl.textContent = best;
startGame();
