// Navigation System
let racingInterval = null;
let snakeInterval = null;
let zombieInterval = null;

function openGame(gameId) {
    const app = document.getElementById('arcadeApp');
    if (app) app.classList.add('arcade-playing');
    document.querySelectorAll('.game-screen').forEach(screen => screen.classList.remove('active'));
    const screen = document.getElementById(gameId);
    if (screen) screen.classList.add('active');

    if (gameId === 'game-racing') initRacing();
    if (gameId === 'game-snake') initSnake();
    if (gameId === 'game-zombie') initZombie();
    if (gameId === 'game-ttt') resetTTT();
    if (gameId === 'game-quiz') resetQuiz();
    if (gameId === 'game-guess') initGuess();
    if (gameId === 'game-rps') initRPS();
}

function closeGame() {
    const app = document.getElementById('arcadeApp');
    if (app) app.classList.remove('arcade-playing');
    document.querySelectorAll('.game-screen').forEach(screen => screen.classList.remove('active'));
    clearInterval(racingInterval);
    clearInterval(snakeInterval);
    clearInterval(zombieInterval);
    racingInterval = snakeInterval = zombieInterval = null;

    // Leaving Guess Number must discard the old secret number.
    // A completely fresh number is generated the next time the game opens.
    if (document.getElementById('game-guess')) {
        guessTarget = 0;
        const guessInput = document.getElementById('guess-input');
        const guessRes = document.getElementById('guess-res');
        if (guessInput) guessInput.value = '';
        if (guessRes) guessRes.innerText = '';
    }
}

// -------------------------------------------------------------
// 1. GUESS THE NUMBER
// -------------------------------------------------------------
let guessMax = 10;
let guessTarget = Math.floor(Math.random() * guessMax) + 1;

function initGuess() {
    // Always generate a new secret number whenever Guess Number is opened.
    guessTarget = Math.floor(Math.random() * guessMax) + 1;

    const range = document.getElementById('guess-range-txt');
    const input = document.getElementById('guess-input');
    const res = document.getElementById('guess-res');

    if (range) range.innerText = `Guess a number between 1 to ${guessMax}`;
    if (input) {
        input.value = '';
        input.focus();
    }
    if (res) {
        res.innerText = '🎲 New secret number generated!';
        res.style.color = '#38bdf8';
    }
}

function setGuessDiff(mode, button) {
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');

    if (mode === 'easy') guessMax = 10;
    else if (mode === 'normal') guessMax = 100;
    else if (mode === 'hard') guessMax = 100000;

    document.getElementById('guess-range-txt').innerText =
        `Guess a number between 1 to ${guessMax}`;

    guessTarget = Math.floor(Math.random() * guessMax) + 1;
    document.getElementById('guess-input').value = "";
    document.getElementById('guess-res').innerText = "";
}

function playGuess() {
    if (!guessTarget) guessTarget = Math.floor(Math.random() * guessMax) + 1;

    const inputEl = document.getElementById('guess-input');
    const res = document.getElementById('guess-res');
    const input = Number(inputEl.value);

    if (!Number.isInteger(input) || input < 1 || input > guessMax) {
        res.innerText = `Enter a whole number from 1 to ${guessMax}!`;
        res.style.color = "#f87171";
        return;
    }

    if (input === guessTarget) {
        res.innerText = "🎯 Spot On! You guessed it!";
        res.style.color = "#4ade80";
        guessTarget = Math.floor(Math.random() * guessMax) + 1;
    } else if (input < guessTarget) {
        res.innerText = "📉 Too Low! Go Higher.";
        res.style.color = "#facc15";
    } else {
        res.innerText = "📈 Too High! Go Lower.";
        res.style.color = "#facc15";
    }
}

// -------------------------------------------------------------
// 2. TIC TAC TOE // NEXUS MODES
// -------------------------------------------------------------
let board = Array(9).fill(null);
let tttActive = true;
let tttMode = 'bot';
let tttDifficulty = 'easy';
let tttTurn = 'X';
let tttScores = { X: 0, O: 0, draw: 0 };
let tttBotTimer = null;

const TTT_WINS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

function setTTTMode(mode, button) {
    tttMode = mode;
    document.querySelectorAll('.ttt-mode-card').forEach(b => b.classList.remove('active'));
    if (button) button.classList.add('active');

    const diffWrap = document.getElementById('ttt-difficulty-wrap');
    const xLabel = document.getElementById('ttt-x-label');
    const oLabel = document.getElementById('ttt-o-label');
    const tip = document.getElementById('ttt-tip-text');
    if (diffWrap) diffWrap.style.display = mode === 'bot' ? 'flex' : 'none';
    if (xLabel) xLabel.textContent = mode === 'bot' ? 'YOU' : 'PLAYER 1';
    if (oLabel) oLabel.textContent = mode === 'bot' ? 'CYBER BOT' : 'PLAYER 2';
    if (tip) tip.textContent = mode === 'bot' ? 'Beat the bot. Good luck, commander.' : 'Pass the device after every turn. Play fair.';
    resetTTT();
}

function setTTTDifficulty(level, button) {
    tttDifficulty = level;
    document.querySelectorAll('.ttt-diff').forEach(b => b.classList.remove('active'));
    if (button) button.classList.add('active');
    resetTTT();
}

function resetTTTScore() {
    tttScores = { X: 0, O: 0, draw: 0 };
    updateTTTScore();
    resetTTT();
}

function resetTTT() {
    if (tttBotTimer) clearTimeout(tttBotTimer);
    board = Array(9).fill(null);
    tttActive = true;
    tttTurn = 'X';
    const res = document.getElementById('ttt-res');
    if (res) res.textContent = tttMode === 'bot' ? 'YOUR TURN • Choose a cell' : 'PLAYER 1 • Your turn (X)';
    updateTTTScore();
    updateTTTTurn();
    renderBoard();
}

function updateTTTScore() {
    const x = document.getElementById('ttt-x-score');
    const o = document.getElementById('ttt-o-score');
    if (x) x.textContent = tttScores.X;
    if (o) o.textContent = tttScores.O;
}

function updateTTTTurn() {
    const turn = document.getElementById('ttt-turn');
    if (!turn) return;
    if (!tttActive) return;
    if (tttMode === 'bot') {
        turn.textContent = tttTurn === 'X' ? 'YOUR TURN • X' : 'BOT THINKING • O';
    } else {
        turn.textContent = tttTurn === 'X' ? 'PLAYER 1 • X' : 'PLAYER 2 • O';
    }
    turn.classList.toggle('bot-turn', tttTurn === 'O' && tttMode === 'bot');
}

function renderBoard(highlight = []) {
    const boardEl = document.getElementById('ttt-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    board.forEach((cell, idx) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ttt-cell';
        button.dataset.index = idx;
        button.setAttribute('aria-label', cell ? `Cell ${idx + 1}: ${cell}` : `Empty cell ${idx + 1}`);
        if (cell) {
            button.innerHTML = `<span class="ttt-mark ${cell === 'X' ? 'mark-x' : 'mark-o'}">${cell}</span>`;
            button.classList.add('filled', cell === 'X' ? 'x-cell' : 'o-cell');
        } else {
            button.innerHTML = `<span class="ttt-cell-number">${idx + 1}</span>`;
        }
        if (highlight.includes(idx)) button.classList.add('winning-cell');
        button.onclick = () => userTTTMove(idx);
        boardEl.appendChild(button);
    });
}

function userTTTMove(idx) {
    if (!tttActive || board[idx]) return;
    if (tttMode === 'bot' && tttTurn !== 'X') return;

    board[idx] = tttTurn;
    const current = tttTurn;
    renderBoard();

    const win = getWinningCombo(board, current);
    if (win) return finishTTT(current, win);
    if (board.every(Boolean)) return finishTTT('draw');

    tttTurn = current === 'X' ? 'O' : 'X';
    updateTTTTurn();

    if (tttMode === 'bot' && tttTurn === 'O') {
        const res = document.getElementById('ttt-res');
        if (res) res.textContent = '🤖 Cyber Bot is calculating...';
        tttBotTimer = setTimeout(botTTTMove, 350 + Math.random() * 300);
    } else {
        const res = document.getElementById('ttt-res');
        if (res) res.textContent = 'PLAYER 2 • Make your move (O)';
    }
}

function botTTTMove() {
    if (!tttActive || tttMode !== 'bot' || tttTurn !== 'O') return;
    let move = chooseBotMove();
    if (move < 0) return;
    board[move] = 'O';
    renderBoard();

    const win = getWinningCombo(board, 'O');
    if (win) return finishTTT('O', win);
    if (board.every(Boolean)) return finishTTT('draw');

    tttTurn = 'X';
    updateTTTTurn();
    const res = document.getElementById('ttt-res');
    if (res) res.textContent = 'YOUR TURN • Find the winning line.';
}

function chooseBotMove() {
    const empty = board.map((v,i) => v ? -1 : i).filter(i => i >= 0);
    if (!empty.length) return -1;
    if (tttDifficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];

    // PRO: win, block, then use strong positional play with a little variation.
    const winMove = findTacticalMove('O');
    if (winMove >= 0) return winMove;
    const blockMove = findTacticalMove('X');
    if (blockMove >= 0) return blockMove;

    if (tttDifficulty === 'pro') {
        const preferred = [4,0,2,6,8,1,3,5,7].filter(i => board[i] === null);
        const pool = preferred.slice(0, Math.min(3, preferred.length));
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // IMPOSSIBLE: full minimax, with deterministic best score.
    let bestScore = -Infinity;
    let bestMoves = [];
    for (const i of empty) {
        board[i] = 'O';
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) { bestScore = score; bestMoves = [i]; }
        else if (score === bestScore) bestMoves.push(i);
    }
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function findTacticalMove(player) {
    for (let i = 0; i < 9; i++) {
        if (board[i] !== null) continue;
        board[i] = player;
        const win = checkWin(board, player);
        board[i] = null;
        if (win) return i;
    }
    return -1;
}

function getWinningCombo(b, player) {
    return TTT_WINS.find(combo => combo.every(i => b[i] === player)) || null;
}

function checkWin(b, player) { return !!getWinningCombo(b, player); }

function minimax(b, depth, isMaximizing) {
    if (checkWin(b, 'O')) return 10 - depth;
    if (checkWin(b, 'X')) return depth - 10;
    if (b.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (b[i] === null) {
                b[i] = 'O';
                bestScore = Math.max(bestScore, minimax(b, depth + 1, false));
                b[i] = null;
            }
        }
        return bestScore;
    }
    let bestScore = Infinity;
    for (let i = 0; i < 9; i++) {
        if (b[i] === null) {
            b[i] = 'X';
            bestScore = Math.min(bestScore, minimax(b, depth + 1, true));
            b[i] = null;
        }
    }
    return bestScore;
}

function finishTTT(result, combo = []) {
    tttActive = false;
    if (tttBotTimer) clearTimeout(tttBotTimer);
    if (result === 'draw') {
        tttScores.draw++;
        const res = document.getElementById('ttt-res');
        if (res) res.textContent = '🤝 DRAW • Perfect defense!';
        renderBoard();
    } else {
        tttScores[result]++;
        renderBoard(combo);
        const res = document.getElementById('ttt-res');
        if (res) {
            if (tttMode === 'bot') res.textContent = result === 'X' ? '🏆 YOU WIN • Bot defeated!' : '🤖 BOT WINS • Rematch?';
            else res.textContent = result === 'X' ? '🏆 PLAYER 1 WINS!' : '🏆 PLAYER 2 WINS!';
        }
    }
    updateTTTScore();
    const turn = document.getElementById('ttt-turn');
    if (turn) turn.textContent = result === 'draw' ? 'ROUND COMPLETE • DRAW' : 'ROUND COMPLETE • GG';
}

// -------------------------------------------------------------
// 3. CAR RACING
// -------------------------------------------------------------
const racingCanvas = document.getElementById('racingCanvas');
const rCtx = racingCanvas.getContext('2d');
const carLanes = [30, 120, 210];
let playerLane = 1;
let obstacles = [];
let racingScore = 0;
let racingGameOver = false;

function initRacing() {
    clearInterval(racingInterval);
    playerLane = 1;
    obstacles = [];
    racingScore = 0;
    racingGameOver = false;
    updateRacingHUD();
    racingInterval = setInterval(updateRacing, 30);
}

function updateRacingHUD() {
    const el = document.getElementById('racing-score');
    if (el) el.innerText = racingScore;
}

function moveCar(dir) {
    if (racingGameOver) return;
    if (dir === -1 && playerLane > 0) playerLane--;
    if (dir === 1 && playerLane < 2) playerLane++;
}

function updateRacing() {
    if (racingGameOver) return;

    const W = 300, H = 390;
    rCtx.clearRect(0, 0, W, H);

    // Cyber road
    const road = rCtx.createLinearGradient(0, 0, 0, H);
    road.addColorStop(0, '#172033');
    road.addColorStop(1, '#0b1020');
    rCtx.fillStyle = road;
    rCtx.fillRect(0, 0, W, H);

    // Side glow
    rCtx.fillStyle = 'rgba(56,189,248,.08)';
    rCtx.fillRect(0, 0, 5, H);
    rCtx.fillRect(W - 5, 0, 5, H);

    // Lane separators
    rCtx.strokeStyle = 'rgba(125,211,252,.28)';
    rCtx.lineWidth = 3;
    rCtx.setLineDash([22, 20]);
    rCtx.lineDashOffset = -(performance.now() / 10) % 42;
    rCtx.beginPath();
    rCtx.moveTo(100, 0); rCtx.lineTo(100, H);
    rCtx.moveTo(200, 0); rCtx.lineTo(200, H);
    rCtx.stroke();
    rCtx.setLineDash([]);

    // Keep ONLY 2 traffic cars on the road at a time.
    // A new pair appears only after the previous pair has left the screen.
    // Their lanes and colors are randomized independently.
    if (obstacles.length === 0 && Math.random() < 0.035) {
        const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, 2);
        const trafficColors = [
            '#f43f5e', '#fb7185', '#ef4444', '#f97316',
            '#f59e0b', '#a855f7', '#8b5cf6', '#ec4899',
            '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
        ];

        lanes.forEach((lane, i) => {
            const color = trafficColors[Math.floor(Math.random() * trafficColors.length)];
            obstacles.push({
                lane,
                // Slightly stagger the two cars so they do not overlap.
                y: -65 - (i * 105),
                counted: false,
                color
            });
        });
    }

    // Traffic
    for (const obstacle of obstacles) {
        obstacle.y += 5.2;
        drawDetailedCar(carLanes[obstacle.lane], obstacle.y, obstacle.color);

        if (!obstacle.counted && obstacle.y > H) {
            obstacle.counted = true;
            racingScore++;
            updateRacingHUD();
        }

        if (
            obstacle.lane === playerLane &&
            obstacle.y < 345 &&
            obstacle.y + 52 > 315
        ) {
            endRacingGame();
            return;
        }
    }

    obstacles = obstacles.filter(o => o.y < H + 30);

    // Player
    drawDetailedCar(carLanes[playerLane], 325, '#22d3ee');
}

function endRacingGame() {
    racingGameOver = true;
    clearInterval(racingInterval);
    racingInterval = null;

    const W = 300, H = 390;
    rCtx.fillStyle = 'rgba(3,7,18,.72)';
    rCtx.fillRect(0, 0, W, H);

    rCtx.fillStyle = 'rgba(15,23,42,.96)';
    rCtx.strokeStyle = 'rgba(248,113,113,.35)';
    rCtx.lineWidth = 1;
    rCtx.beginPath();
    rCtx.roundRect(45, 125, 210, 135, 22);
    rCtx.fill();
    rCtx.stroke();

    rCtx.textAlign = 'center';
    rCtx.shadowBlur = 16;
    rCtx.shadowColor = '#ef4444';
    rCtx.fillStyle = '#fb7185';
    rCtx.font = '900 24px Plus Jakarta Sans';
    rCtx.fillText('CRASHED!', 150, 170);

    rCtx.shadowBlur = 0;
    rCtx.fillStyle = '#e2e8f0';
    rCtx.font = '800 15px Plus Jakarta Sans';
    rCtx.fillText(`Score  ${racingScore}`, 150, 202);

    rCtx.fillStyle = '#64748b';
    rCtx.font = '700 10px Plus Jakarta Sans';
    rCtx.fillText('Tap “Restart Race” to go again', 150, 230);
    rCtx.textAlign = 'start';
}

function drawDetailedCar(x, y, color) {
    rCtx.save();

    // Neon shadow
    rCtx.shadowBlur = 16;
    rCtx.shadowColor = color;

    // Body
    rCtx.fillStyle = color;
    rCtx.beginPath();
    rCtx.roundRect(x + 9, y, 32, 52, 7);
    rCtx.fill();

    rCtx.shadowBlur = 0;

    // Windshield
    rCtx.fillStyle = '#07111f';
    rCtx.beginPath();
    rCtx.roundRect(x + 14, y + 8, 22, 15, 4);
    rCtx.fill();

    // Lights
    rCtx.fillStyle = '#fef08a';
    rCtx.fillRect(x + 12, y + 3, 6, 4);
    rCtx.fillRect(x + 32, y + 3, 6, 4);

    // Wheels
    rCtx.fillStyle = '#020617';
    rCtx.fillRect(x + 3, y + 7, 6, 13);
    rCtx.fillRect(x + 41, y + 7, 6, 13);
    rCtx.fillRect(x + 3, y + 35, 6, 13);
    rCtx.fillRect(x + 41, y + 35, 6, 13);

    // Rear glow
    rCtx.fillStyle = '#fb7185';
    rCtx.fillRect(x + 14, y + 46, 7, 3);
    rCtx.fillRect(x + 29, y + 46, 7, 3);

    rCtx.restore();
}

// -------------------------------------------------------------
// 4. NEON SNAKE PRO
// -------------------------------------------------------------
const sCanvas = document.getElementById('snakeCanvas');
const sCtx = sCanvas.getContext('2d');
let snake = [];
let food = {x: 60, y: 60};
let sDir = 'RIGHT';
let nextSnakeDir = 'RIGHT';
let snakeScore = 0;
let snakeGameOver = false;

function initSnake() {
    clearInterval(snakeInterval);
    snake = [{x: 140, y: 140}, {x: 120, y: 140}];
    sDir = 'RIGHT';
    nextSnakeDir = 'RIGHT';
    snakeScore = 0;
    snakeGameOver = false;
    spawnFood();
    updateSnakeHUD();
    renderSnake();
    snakeInterval = setInterval(updateSnake, 120);
}

function updateSnakeHUD() {
    const el = document.getElementById('snake-score');
    if (el) el.innerText = snakeScore;
}

function changeSnakeDir(dir) {
    const opposite = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT'
    };
    if (dir !== opposite[sDir]) nextSnakeDir = dir;
}

function spawnFood() {
    const freeCells = [];
    for (let x = 0; x < 280; x += 20) {
        for (let y = 0; y < 280; y += 20) {
            if (!snake.some(s => s.x === x && s.y === y)) {
                freeCells.push({x, y});
            }
        }
    }

    if (freeCells.length) {
        food = freeCells[Math.floor(Math.random() * freeCells.length)];
    }
}

function updateSnake() {
    if (snakeGameOver) return;

    sDir = nextSnakeDir;
    const head = {...snake[0]};

    if (sDir === 'UP') head.y -= 20;
    if (sDir === 'DOWN') head.y += 20;
    if (sDir === 'LEFT') head.x -= 20;
    if (sDir === 'RIGHT') head.x += 20;

    const eating = head.x === food.x && head.y === food.y;
    const bodyToCheck = eating ? snake : snake.slice(0, -1);

    if (
        head.x < 0 || head.x >= 280 ||
        head.y < 0 || head.y >= 280 ||
        bodyToCheck.some(s => s.x === head.x && s.y === head.y)
    ) {
        endSnakeGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        snakeScore++;
        spawnFood();
        updateSnakeHUD();
    } else {
        snake.pop();
    }

    renderSnake();
}

function renderSnake() {
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 280, 280);

    sCtx.fillStyle = '#f43f5e';
    sCtx.beginPath();
    sCtx.arc(food.x + 10, food.y + 10, 8, 0, Math.PI * 2);
    sCtx.fill();

    snake.forEach((part, index) => {
        sCtx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
        sCtx.beginPath();
        sCtx.roundRect(part.x + 1, part.y + 1, 18, 18, 6);
        sCtx.fill();
    });
}

function endSnakeGame() {
    snakeGameOver = true;
    clearInterval(snakeInterval);
    snakeInterval = null;

    sCtx.fillStyle = 'rgba(0,0,0,0.8)';
    sCtx.fillRect(0, 0, 280, 280);
    sCtx.fillStyle = '#ef4444';
    sCtx.font = 'bold 20px Plus Jakarta Sans';
    sCtx.textAlign = 'center';
    sCtx.fillText("GAME OVER", 140, 135);
    sCtx.fillStyle = '#fff';
    sCtx.font = 'bold 14px Plus Jakarta Sans';
    sCtx.fillText(`Score: ${snakeScore}`, 140, 165);
    sCtx.textAlign = 'start';
}

// -------------------------------------------------------------
// 5. ZOMBIE SURVIVAL
// -------------------------------------------------------------
const zCanvas = document.getElementById('zombieCanvas');
const zCtx = zCanvas.getContext('2d');
let zPlayerX = 130;
let zombies = [];
let bullets = [];
let powerups = [];
let zScore = 0;
let zAmmo = 15;
let activeWeapon = 'Pistol';
let zombieGameOver = false;
let zombieWave = 1;
let zombieKills = 0;
let zombieParticles = [];
let zombieFlash = 0;

function initZombie() {
    clearInterval(zombieInterval);
    zPlayerX = 130;
    zombies = [];
    bullets = [];
    powerups = [];
    zScore = 0;
    zAmmo = 15;
    activeWeapon = 'Pistol';
    zombieGameOver = false;
    zombieWave = 1;
    zombieKills = 0;
    zombieParticles = [];
    zombieFlash = 0;
    updateHUD();
    renderZombieFrame();
    zombieInterval = setInterval(updateZombieGame, 30);
}

function updateHUD() {
    document.getElementById('zombie-score').innerText = zScore;
    document.getElementById('zombie-ammo').innerText = zAmmo;
    document.getElementById('zombie-weapon').innerText = activeWeapon.toUpperCase();
    const waveEl = document.getElementById('zombie-wave');
    if (waveEl) waveEl.innerText = zombieWave;
    const ammoBar = document.getElementById('zombie-ammo-bar');
    if (ammoBar) ammoBar.style.width = `${Math.max(0, Math.min(100, (zAmmo / 30) * 100))}%`;
}

function moveZombiePlayer(dir) {
    if (zombieGameOver) return;
    zPlayerX = Math.max(10, Math.min(250, zPlayerX + dir));
}

function selectZombieWeapon(weapon, button) {
    if (zombieGameOver) return;
    activeWeapon = weapon;
    document.querySelectorAll('.weapon-btn').forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');
    updateHUD();
}

function shootZombie() {
    if (zombieGameOver || zAmmo <= 0) return;

    zAmmo--;

    if (activeWeapon === 'Pistol') {
        bullets.push({ x: zPlayerX + 10, y: 280, type: 'normal', damage: 1 });
    } else if (activeWeapon === 'Shotgun') {
        bullets.push(
            { x: zPlayerX + 5, y: 280, type: 'spread', dx: -2, damage: 1 },
            { x: zPlayerX + 10, y: 280, type: 'spread', dx: 0, damage: 1 },
            { x: zPlayerX + 15, y: 280, type: 'spread', dx: 2, damage: 1 }
        );
    } else if (activeWeapon === 'Laser') {
        bullets.push({ x: zPlayerX + 10, y: 280, type: 'laser', damage: 2 });
    }

    updateHUD();
}

function updateZombieGame() {
    if (zombieGameOver) return;

    const W = 300, H = 360;
    zCtx.clearRect(0, 0, W, H);

    // Night city background
    const bg = zCtx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#050816');
    bg.addColorStop(.6, '#0b1020');
    bg.addColorStop(1, '#111827');
    zCtx.fillStyle = bg;
    zCtx.fillRect(0, 0, W, H);

    // Skyline
    zCtx.fillStyle = 'rgba(30,41,59,.65)';
    for (let x = 0; x < W; x += 32) {
        const h = 30 + ((x * 17) % 75);
        zCtx.fillRect(x, 250 - h, 25, h);
        zCtx.fillStyle = 'rgba(250,204,21,.18)';
        for (let wy = 260 - h; wy < 245; wy += 13) {
            zCtx.fillRect(x + 5, wy, 4, 5);
            zCtx.fillRect(x + 15, wy, 4, 5);
        }
        zCtx.fillStyle = 'rgba(30,41,59,.65)';
    }

    // Ground
    zCtx.fillStyle = '#0f172a';
    zCtx.fillRect(0, 275, W, 85);
    zCtx.strokeStyle = 'rgba(56,189,248,.12)';
    zCtx.lineWidth = 1;
    for (let x = 0; x <= W; x += 30) {
        zCtx.beginPath(); zCtx.moveTo(x, 275); zCtx.lineTo(x + 55, H); zCtx.stroke();
    }
    for (let y = 290; y < H; y += 18) {
        zCtx.beginPath(); zCtx.moveTo(0, y); zCtx.lineTo(W, y); zCtx.stroke();
    }

    // Wave progression
    zombieWave = 1 + Math.floor(zScore / 100);

    // Spawn zombies, gradually faster.
    const spawnChance = Math.min(0.055, 0.022 + zombieWave * 0.002);
    if (Math.random() < spawnChance) {
        const typeRand = Math.random();
        let type = 'green', hp = 1, speed = 1.25 + zombieWave * 0.03, color = '#22c55e';

        if (typeRand > 0.62 && typeRand <= 0.9) {
            type = 'orange'; hp = 3; speed = 0.9 + zombieWave * 0.025; color = '#f97316';
        } else if (typeRand > 0.9) {
            type = 'red'; hp = 6; speed = 0.65 + zombieWave * 0.02; color = '#ef4444';
        }

        zombies.push({
            x: 10 + Math.random() * 260,
            y: -24, type, hp, maxHp: hp, speed, color,
            bob: Math.random() * Math.PI * 2
        });
    }

    // Powerups
    if (Math.random() < 0.0045) {
        const pTypes = ['Shotgun', 'Laser', 'Ammo'];
        const type = pTypes[Math.floor(Math.random() * pTypes.length)];
        powerups.push({ x: 15 + Math.random() * 265, y: -12, type, pulse: 0 });
    }

    // Powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += 1.3;
        p.pulse += .12;

        zCtx.save();
        zCtx.shadowBlur = 15;
        zCtx.shadowColor = '#a855f7';
        zCtx.fillStyle = 'rgba(168,85,247,.22)';
        zCtx.beginPath();
        zCtx.arc(p.x, p.y, 13 + Math.sin(p.pulse) * 2, 0, Math.PI * 2);
        zCtx.fill();
        zCtx.shadowBlur = 0;
        zCtx.fillStyle = '#e9d5ff';
        zCtx.font = 'bold 11px Plus Jakarta Sans';
        zCtx.textAlign = 'center';
        zCtx.fillText(p.type === 'Ammo' ? 'AMMO' : p.type.toUpperCase(), p.x, p.y + 4);
        zCtx.restore();

        if (p.y > 275 && Math.abs(p.x - zPlayerX) < 30) {
            if (p.type === 'Ammo') zAmmo += 15;
            else activeWeapon = p.type;
            powerups.splice(i, 1);
            updateHUD();
        } else if (p.y > H + 20) {
            powerups.splice(i, 1);
        }
    }

    // Bullets
    for (let bIdx = bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = bullets[bIdx];
        b.y -= b.type === 'laser' ? 10 : 8;
        if (b.dx) b.x += b.dx;

        zCtx.save();
        zCtx.shadowBlur = b.type === 'laser' ? 20 : 10;
        zCtx.shadowColor = b.type === 'laser' ? '#c084fc' : '#facc15';
        zCtx.fillStyle = b.type === 'laser' ? '#e9d5ff' : '#fde047';
        zCtx.fillRect(b.x - 2, b.y, b.type === 'laser' ? 5 : 4, b.type === 'laser' ? 20 : 9);
        zCtx.restore();

        let consumed = false;

        for (let zIdx = zombies.length - 1; zIdx >= 0; zIdx--) {
            const z = zombies[zIdx];
            if (Math.abs(b.x - (z.x + 10)) < 22 && Math.abs(b.y - (z.y + 10)) < 23) {
                z.hp -= b.damage;
                zombieFlash = 3;

                for (let p = 0; p < 5; p++) {
                    zombieParticles.push({
                        x: z.x + 10, y: z.y + 10,
                        vx: (Math.random() - .5) * 2.5,
                        vy: (Math.random() - .5) * 2.5,
                        life: 14 + Math.random() * 10
                    });
                }

                if (z.hp <= 0) {
                    zScore += z.maxHp * 10;
                    zombieKills++;
                    zombies.splice(zIdx, 1);
                    updateHUD();
                }

                if (b.type !== 'laser') {
                    consumed = true;
                    break;
                }
            }
        }

        if (consumed || b.y < -30 || b.x < -30 || b.x > W + 30) bullets.splice(bIdx, 1);
    }

    // Particles
    for (let i = zombieParticles.length - 1; i >= 0; i--) {
        const p = zombieParticles[i];
        p.x += p.vx; p.y += p.vy; p.life--;

        zCtx.fillStyle = `rgba(250,204,21,${Math.max(0, p.life / 24)})`;
        zCtx.fillRect(p.x, p.y, 3, 3);
        if (p.life <= 0) zombieParticles.splice(i, 1);
    }

    // Zombies
    for (let zIdx = zombies.length - 1; zIdx >= 0; zIdx--) {
        const z = zombies[zIdx];
        z.y += z.speed;
        z.bob += .08;
        const bobX = Math.sin(z.bob) * 1.5;

        zCtx.save();
        zCtx.translate(bobX, 0);
        zCtx.shadowBlur = 12;
        zCtx.shadowColor = z.color;
        zCtx.fillStyle = z.color;
        zCtx.beginPath();
        zCtx.roundRect(z.x, z.y, 22, 23, 6);
        zCtx.fill();
        zCtx.shadowBlur = 0;

        zCtx.fillStyle = '#07111f';
        zCtx.fillRect(z.x + 4, z.y + 6, 4, 4);
        zCtx.fillRect(z.x + 14, z.y + 6, 4, 4);
        zCtx.fillStyle = '#fca5a5';
        zCtx.fillRect(z.x + 7, z.y + 15, 9, 3);
        zCtx.restore();

        // HP bar
        zCtx.fillStyle = 'rgba(15,23,42,.9)';
        zCtx.fillRect(z.x, z.y - 7, 22, 3);
        zCtx.fillStyle = z.color;
        zCtx.fillRect(z.x, z.y - 7, 22 * (z.hp / z.maxHp), 3);

        const hitsPlayer =
            z.y + 23 >= 294 &&
            z.y <= 320 &&
            Math.abs((z.x + 11) - (zPlayerX + 10)) < 25;

        if (hitsPlayer || z.y > H + 5) {
            endZombieGame();
            return;
        }
    }

    // Player soldier
    zCtx.save();
    if (zombieFlash > 0) zombieFlash--;
    zCtx.shadowBlur = 18;
    zCtx.shadowColor = '#22d3ee';
    zCtx.fillStyle = '#22d3ee';
    zCtx.beginPath();
    zCtx.roundRect(zPlayerX, 306, 20, 27, 6);
    zCtx.fill();
    zCtx.shadowBlur = 0;

    zCtx.fillStyle = '#0b1020';
    zCtx.beginPath();
    zCtx.arc(zPlayerX + 10, 302, 7, 0, Math.PI * 2);
    zCtx.fill();

    zCtx.fillStyle = '#e2e8f0';
    zCtx.fillRect(zPlayerX + 8, 297, 4, 4);
    zCtx.restore();

    // Aim line
    zCtx.strokeStyle = 'rgba(34,211,238,.16)';
    zCtx.setLineDash([4,7]);
    zCtx.beginPath();
    zCtx.moveTo(zPlayerX + 10, 280);
    zCtx.lineTo(zPlayerX + 10, 70);
    zCtx.stroke();
    zCtx.setLineDash([]);

    if (zombieFlash > 0) {
        zCtx.fillStyle = 'rgba(250,204,21,.12)';
        zCtx.fillRect(0, 0, W, H);
    }
}

function renderZombieFrame() {
    zCtx.fillStyle = '#050816';
    zCtx.fillRect(0, 0, 300, 360);
    zCtx.fillStyle = 'rgba(34,211,238,.12)';
    zCtx.font = '900 11px Plus Jakarta Sans';
    zCtx.textAlign = 'center';
    zCtx.fillText('NIGHTFALL // READY', 150, 170);
    zCtx.fillStyle = '#64748b';
    zCtx.font = '700 9px Plus Jakarta Sans';
    zCtx.fillText('SELECT WEAPON  •  PRESS FIRE', 150, 190);
    zCtx.textAlign = 'start';
}

function endZombieGame() {
    zombieGameOver = true;
    clearInterval(zombieInterval);
    zombieInterval = null;

    const W = 300, H = 360;
    zCtx.fillStyle = 'rgba(3,7,18,.78)';
    zCtx.fillRect(0, 0, W, H);

    zCtx.fillStyle = 'rgba(15,23,42,.96)';
    zCtx.strokeStyle = 'rgba(239,68,68,.38)';
    zCtx.lineWidth = 1;
    zCtx.beginPath();
    zCtx.roundRect(30, 105, 240, 160, 24);
    zCtx.fill();
    zCtx.stroke();

    zCtx.textAlign = 'center';
    zCtx.shadowBlur = 18;
    zCtx.shadowColor = '#ef4444';
    zCtx.fillStyle = '#fb7185';
    zCtx.font = '900 21px Plus Jakarta Sans';
    zCtx.fillText('MISSION FAILED', 150, 150);

    zCtx.shadowBlur = 0;
    zCtx.fillStyle = '#e2e8f0';
    zCtx.font = '800 14px Plus Jakarta Sans';
    zCtx.fillText(`Score  ${zScore}   •   Kills  ${zombieKills}`, 150, 180);
    zCtx.fillStyle = '#c084fc';
    zCtx.font = '800 12px Plus Jakarta Sans';
    zCtx.fillText(`Wave ${zombieWave}`, 150, 203);

    zCtx.fillStyle = '#64748b';
    zCtx.font = '700 10px Plus Jakarta Sans';
    zCtx.fillText('Tap “Restart Mission” to deploy again', 150, 230);
    zCtx.textAlign = 'start';
}

// -------------------------------------------------------------
// OTHER MINI GAMES
// -------------------------------------------------------------
// -------------------------------------------------------------
// CODE QUIZ - 100 QUESTIONS
// -------------------------------------------------------------
const quizQuestions = [
    {"category": "Python", "question": "What keyword is used to define a function?", "answer": "def"},
    {"category": "Python", "question": "Which function displays output on the screen?", "answer": "print"},
    {"category": "Python", "question": "What is the file extension for a Python file?", "answer": ".py"},
    {"category": "Python", "question": "Which symbol starts a comment in Python?", "answer": "#"},
    {"category": "Python", "question": "Which data type stores True or False?", "answer": "bool"},
    {"category": "Python", "question": "Which keyword is used to create a loop over items?", "answer": "for"},
    {"category": "Python", "question": "Which keyword repeats a loop while a condition is true?", "answer": "while"},
    {"category": "Python", "question": "Which collection stores ordered, changeable items?", "answer": "list"},
    {"category": "Python", "question": "Which collection stores unique items?", "answer": "set"},
    {"category": "Python", "question": "Which collection stores key-value pairs?", "answer": "dictionary"},
    {"category": "Python", "question": "What does len() return?", "answer": "length"},
    {"category": "Python", "question": "Which operator is used for exponentiation?", "answer": "**"},
    {"category": "Python", "question": "Which keyword is used to import a module?", "answer": "import"},
    {"category": "Python", "question": "Which keyword handles exceptions?", "answer": "try"},
    {"category": "Python", "question": "Which keyword is used to define a class?", "answer": "class"},
    {"category": "Python", "question": "What is the Boolean value for false?", "answer": "false"},
    {"category": "Python", "question": "Which method adds an item to the end of a list?", "answer": "append"},
    {"category": "Python", "question": "Which function returns the largest item?", "answer": "max"},
    {"category": "Python", "question": "Which function returns the smallest item?", "answer": "min"},
    {"category": "Python", "question": "Which function converts a value to an integer?", "answer": "int"},
    {"category": "Python", "question": "Which function converts a value to a string?", "answer": "str"},
    {"category": "Python", "question": "Which keyword exits a loop immediately?", "answer": "break"},
    {"category": "Python", "question": "Which keyword skips to the next loop iteration?", "answer": "continue"},
    {"category": "Python", "question": "Which operator checks equality?", "answer": "=="},
    {"category": "Python", "question": "Which value represents no value in Python?", "answer": "none"},
    {"category": "HTML", "question": "What does HTML stand for?", "answer": "hypertext markup language"},
    {"category": "HTML", "question": "Which tag creates the largest heading?", "answer": "h1"},
    {"category": "HTML", "question": "Which tag creates a paragraph?", "answer": "p"},
    {"category": "HTML", "question": "Which tag creates a hyperlink?", "answer": "a"},
    {"category": "HTML", "question": "Which attribute specifies a link destination?", "answer": "href"},
    {"category": "HTML", "question": "Which tag inserts an image?", "answer": "img"},
    {"category": "HTML", "question": "Which attribute provides alternative image text?", "answer": "alt"},
    {"category": "HTML", "question": "Which tag creates an unordered list?", "answer": "ul"},
    {"category": "HTML", "question": "Which tag creates an ordered list?", "answer": "ol"},
    {"category": "HTML", "question": "Which tag creates a list item?", "answer": "li"},
    {"category": "HTML", "question": "Which tag creates a line break?", "answer": "br"},
    {"category": "HTML", "question": "Which tag creates a form?", "answer": "form"},
    {"category": "HTML", "question": "Which tag creates a text input?", "answer": "input"},
    {"category": "HTML", "question": "Which attribute gives an element a unique identifier?", "answer": "id"},
    {"category": "HTML", "question": "Which attribute assigns one or more classes?", "answer": "class"},
    {"category": "HTML", "question": "Which tag defines the document title?", "answer": "title"},
    {"category": "HTML", "question": "Which tag contains visible page content?", "answer": "body"},
    {"category": "HTML", "question": "Which tag contains metadata and links?", "answer": "head"},
    {"category": "HTML", "question": "Which tag is used to create a table?", "answer": "table"},
    {"category": "HTML", "question": "Which tag defines a table row?", "answer": "tr"},
    {"category": "HTML", "question": "Which tag defines a table cell?", "answer": "td"},
    {"category": "HTML", "question": "Which tag defines a table header cell?", "answer": "th"},
    {"category": "HTML", "question": "Which tag embeds JavaScript in an HTML page?", "answer": "script"},
    {"category": "HTML", "question": "Which tag links an external CSS file?", "answer": "link"},
    {"category": "HTML", "question": "Which declaration defines an HTML5 document?", "answer": "<!doctype html>"},
    {"category": "CSS", "question": "What does CSS stand for?", "answer": "cascading style sheets"},
    {"category": "CSS", "question": "Which property changes text color?", "answer": "color"},
    {"category": "CSS", "question": "Which property changes the background color?", "answer": "background-color"},
    {"category": "CSS", "question": "Which property changes font size?", "answer": "font-size"},
    {"category": "CSS", "question": "Which property makes text bold?", "answer": "font-weight"},
    {"category": "CSS", "question": "Which property centers text horizontally?", "answer": "text-align"},
    {"category": "CSS", "question": "Which property adds space inside an element?", "answer": "padding"},
    {"category": "CSS", "question": "Which property adds space outside an element?", "answer": "margin"},
    {"category": "CSS", "question": "Which property changes an element's width?", "answer": "width"},
    {"category": "CSS", "question": "Which property changes an element's height?", "answer": "height"},
    {"category": "CSS", "question": "Which property rounds corners?", "answer": "border-radius"},
    {"category": "CSS", "question": "Which declaration creates a flex container?", "answer": "display: flex"},
    {"category": "CSS", "question": "Which declaration creates a grid container?", "answer": "display: grid"},
    {"category": "CSS", "question": "Which property controls the gap between flex/grid items?", "answer": "gap"},
    {"category": "CSS", "question": "Which property controls transparency?", "answer": "opacity"},
    {"category": "CSS", "question": "Which property changes the font family?", "answer": "font-family"},
    {"category": "CSS", "question": "Which property changes an element's border?", "answer": "border"},
    {"category": "CSS", "question": "Which property controls shadow around a box?", "answer": "box-shadow"},
    {"category": "CSS", "question": "Which property controls an element's position?", "answer": "position"},
    {"category": "CSS", "question": "Which property controls stacking order?", "answer": "z-index"},
    {"category": "CSS", "question": "Which selector targets an element by id?", "answer": "#"},
    {"category": "CSS", "question": "Which selector targets an element by class?", "answer": "."},
    {"category": "CSS", "question": "Which property controls how an image fits inside a box?", "answer": "object-fit"},
    {"category": "CSS", "question": "Which property hides overflow content?", "answer": "overflow"},
    {"category": "CSS", "question": "Which at-rule is commonly used for responsive media queries?", "answer": "@media"},
    {"category": "Java", "question": "Which keyword is used to define a class in Java?", "answer": "class"},
    {"category": "Java", "question": "Which method is the entry point of a Java application?", "answer": "main"},
    {"category": "Java", "question": "What is the file extension for Java source code?", "answer": ".java"},
    {"category": "Java", "question": "Which keyword creates a new object?", "answer": "new"},
    {"category": "Java", "question": "Which keyword is used for inheritance?", "answer": "extends"},
    {"category": "Java", "question": "Which keyword implements an interface?", "answer": "implements"},
    {"category": "Java", "question": "Which primitive type stores true or false?", "answer": "boolean"},
    {"category": "Java", "question": "Which primitive type stores whole numbers commonly used for general integers?", "answer": "int"},
    {"category": "Java", "question": "Which primitive type stores a single character?", "answer": "char"},
    {"category": "Java", "question": "Which primitive type stores single-precision decimal numbers?", "answer": "float"},
    {"category": "Java", "question": "Which primitive type stores double-precision decimal numbers?", "answer": "double"},
    {"category": "Java", "question": "Which keyword prevents a variable from being reassigned?", "answer": "final"},
    {"category": "Java", "question": "Which keyword refers to the current object?", "answer": "this"},
    {"category": "Java", "question": "Which keyword refers to the parent class?", "answer": "super"},
    {"category": "Java", "question": "Which keyword handles an exception?", "answer": "try"},
    {"category": "Java", "question": "Which keyword catches an exception?", "answer": "catch"},
    {"category": "Java", "question": "Which keyword always runs after try/catch?", "answer": "finally"},
    {"category": "Java", "question": "Which interface/collection type stores key-value pairs?", "answer": "map"},
    {"category": "Java", "question": "Which collection does not allow duplicate elements?", "answer": "set"},
    {"category": "Java", "question": "Which collection is commonly used for a resizable ordered list?", "answer": "arraylist"},
    {"category": "Java", "question": "Which method prints text with a newline?", "answer": "println"},
    {"category": "Java", "question": "Which package contains ArrayList?", "answer": "java.util"},
    {"category": "Java", "question": "Which operator compares primitive values for equality?", "answer": "=="},
    {"category": "Java", "question": "Which keyword returns a value from a method?", "answer": "return"},
    {"category": "Java", "question": "Which keyword is used to create an interface?", "answer": "interface"}
];

let quizPool = [...quizQuestions];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizCategoryFilter = 'all';

function normalizeQuizAnswer(value) {
    return value.trim().toLowerCase()
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/\s+/g, ' ');
}

function setQuizCategory(category, button) {
    document.querySelectorAll('.quiz-cat').forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');
    quizCategoryFilter = category;
    quizPool = category === 'all' ? [...quizQuestions] : quizQuestions.filter(q => q.category === category);
    quizPool.sort(() => Math.random() - 0.5);
    quizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-score').innerText = quizScore;
    showQuizQuestion();
}

function showQuizQuestion() {
    const current = quizPool[quizIndex];
    document.getElementById('quiz-progress').innerText = `Question ${quizIndex + 1} / ${quizPool.length}`;
    document.getElementById('quiz-category').innerText = current.category;
    document.getElementById('quiz-q').innerText = current.question;
    document.getElementById('quiz-a').value = '';
    document.getElementById('quiz-a').disabled = false;
    document.getElementById('quiz-res').innerText = '';
    document.getElementById('quiz-res').className = 'quiz-result';
    document.getElementById('quiz-next').style.display = 'none';
    document.querySelector('.quiz-submit').disabled = false;
    quizAnswered = false;
}

function resetQuiz() {
    quizPool = quizCategoryFilter === 'all' ? [...quizQuestions] : quizQuestions.filter(q => q.category === quizCategoryFilter);
    quizPool.sort(() => Math.random() - 0.5);
    quizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-score').innerText = '0';
    showQuizQuestion();
}

function checkQuiz() {
    if (quizAnswered) return;
    const input = normalizeQuizAnswer(document.getElementById('quiz-a').value);
    const current = quizPool[quizIndex];
    const accepted = current.answer.split('|').map(normalizeQuizAnswer);
    const result = document.getElementById('quiz-res');
    quizAnswered = true;

    if (accepted.includes(input)) {
        quizScore++;
        document.getElementById('quiz-score').innerText = quizScore;
        result.innerText = '✅ Correct!';
        result.className = 'quiz-result correct';
    } else {
        result.innerText = `❌ Wrong! Correct answer: ${current.answer.split('|')[0]}`;
        result.className = 'quiz-result wrong';
    }

    document.getElementById('quiz-a').disabled = true;
    document.querySelector('.quiz-submit').disabled = true;

    if (quizIndex < quizPool.length - 1) {
        document.getElementById('quiz-next').style.display = 'block';
    } else {
        result.innerText += `  🎉 Final Score: ${quizScore} / ${quizPool.length}`;
    }
}

function nextQuizQuestion() {
    if (!quizAnswered || quizIndex >= quizPool.length - 1) return;
    quizIndex++;
    showQuizQuestion();
}

let rpsYouScore = 0;
let rpsBotScore = 0;
let rpsRound = 1;

function initRPS() {
    rpsYouScore = 0;
    rpsBotScore = 0;
    rpsRound = 1;
    const ids = {
        'rps-you-score': '0', 'rps-bot-score': '0', 'rps-round': '1',
        'rps-player-hand': '?', 'rps-bot-hand': '?',
        'rps-player-name': 'READY', 'rps-bot-name': 'SCANNING',
        'rps-result-badge': 'READY?', 'rps-res': 'Choose a move to start the duel.'
    };
    Object.entries(ids).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    });
    const arena = document.getElementById('rps-arena');
    if (arena) arena.classList.remove('rps-win','rps-lose','rps-tie','rps-shake');
    document.querySelectorAll('.rps-choice').forEach(b => b.classList.remove('selected'));
}

function playRPS(user) {
    const moves = ['rock', 'paper', 'scissors'];
    const icons = { rock: '✊', paper: '✋', scissors: '✌️' };
    const bot = moves[Math.floor(Math.random() * moves.length)];
    const playerName = user.toUpperCase();
    const botName = bot.toUpperCase();
    const arena = document.getElementById('rps-arena');
    const badge = document.getElementById('rps-result-badge');
    const result = document.getElementById('rps-res');

    document.querySelectorAll('.rps-choice').forEach(b => b.classList.remove('selected'));
    const chosen = document.querySelector('.rps-choice.' + user);
    if (chosen) chosen.classList.add('selected');
    arena.classList.remove('rps-win','rps-lose','rps-tie','rps-shake');
    void arena.offsetWidth;
    arena.classList.add('rps-shake');

    document.getElementById('rps-player-hand').innerText = icons[user];
    document.getElementById('rps-bot-hand').innerText = icons[bot];
    document.getElementById('rps-player-name').innerText = playerName;
    document.getElementById('rps-bot-name').innerText = botName;

    let outcome;
    if (user === bot) outcome = 'tie';
    else if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) outcome = 'win';
    else outcome = 'lose';

    if (outcome === 'win') {
        rpsYouScore++;
        badge.innerText = 'YOU WIN';
        result.innerText = `⚡ ${playerName} beats ${botName} — clean hit!`;
    } else if (outcome === 'lose') {
        rpsBotScore++;
        badge.innerText = 'BOT WINS';
        result.innerText = `☠ ${botName} counters ${playerName} — rematch!`;
    } else {
        badge.innerText = 'DRAW';
        result.innerText = `◈ Both chose ${playerName}. No damage dealt.`;
    }

    arena.classList.add('rps-' + outcome);
    document.getElementById('rps-you-score').innerText = rpsYouScore;
    document.getElementById('rps-bot-score').innerText = rpsBotScore;
    rpsRound++;
    document.getElementById('rps-round').innerText = rpsRound;
}

// -------------------------------------------------------------
// KEYBOARD CONTROLS
// -------------------------------------------------------------
document.addEventListener('keydown', (e) => {
    const activeScreen = document.querySelector('.game-screen.active');
    if (!activeScreen) return;

    if (activeScreen.id === 'game-racing') {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            e.preventDefault();
            moveCar(-1);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            e.preventDefault();
            moveCar(1);
        }
    }

    if (activeScreen.id === 'game-snake') {
        const keys = {
            ArrowUp: 'UP', w: 'UP',
            ArrowDown: 'DOWN', s: 'DOWN',
            ArrowLeft: 'LEFT', a: 'LEFT',
            ArrowRight: 'RIGHT', d: 'RIGHT'
        };
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (keys[key]) {
            e.preventDefault();
            changeSnakeDir(keys[key]);
        }
    }

    if (activeScreen.id === 'game-zombie') {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            e.preventDefault();
            moveZombiePlayer(-20);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            e.preventDefault();
            moveZombiePlayer(20);
        } else if (e.code === 'Space') {
            e.preventDefault();
            shootZombie();
        }
    }
});

document.addEventListener('keydown', (e) => {
    const activeScreen = document.querySelector('.game-screen.active');
    if (!activeScreen) return;
    if (activeScreen.id === 'game-quiz' && e.key === 'Enter') {
        e.preventDefault();
        const next = document.getElementById('quiz-next');
        if (next && next.style.display !== 'none') nextQuizQuestion();
        else checkQuiz();
    }
});

// About / Profile modal
function openProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('open');
}

function closeProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('open');
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeProfile();
});
