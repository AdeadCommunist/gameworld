// Global navigation and theme management
const pageSections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('nav a[href^="#"], nav button[id^="tutorialButton"]');
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');

function showPage(pageId) {
    pageSections.forEach(section => {
        section.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
         targetPage.classList.remove('hidden');
    } else {
        document.getElementById('home').classList.remove('hidden');
    }
    if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
    }
    window.scrollTo(0, 0);
}

navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        if (href) {
             const pageId = href.substring(1);
             if (document.getElementById(pageId)) {
                event.preventDefault();
                showPage(pageId);
                history.pushState(null, '', `#${pageId}`);
            }
        } else if (link.id.includes('tutorialButton')) {
             event.preventDefault();
             openTutorialModal();
        }
    });
});
        
function handlePageNavigation() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    } else {
        showPage('home');
    }
}

window.addEventListener('popstate', handlePageNavigation);
mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

// Tutorial Modal
const tutorialModal = document.getElementById('tutorialModal');
const closeTutorialButton = document.getElementById('closeTutorialButton');
const understandButton = document.getElementById('understandButton');
const tutorialButton = document.getElementById('tutorialButton');
const tutorialButtonMobile = document.getElementById('tutorialButtonMobile');

function openTutorialModal() { tutorialModal.style.display = 'block'; }
function closeTutorialModal() { tutorialModal.style.display = 'none'; }
[closeTutorialButton, understandButton, tutorialButton, tutorialButtonMobile].forEach(btn => btn.addEventListener('click', (e) => {
    if(e.currentTarget.id.includes('tutorialButton')) openTutorialModal();
    else closeTutorialModal();
}));
window.addEventListener('click', (event) => { if (event.target == tutorialModal) closeTutorialModal(); });

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const themeToggleMobile = document.getElementById('themeToggleMobile');
const body = document.body;

function setTheme(isDarkMode) {
    body.classList.toggle('dark', isDarkMode);
    const iconClass = isDarkMode ? 'fa-moon' : 'fa-sun';
    themeToggle.innerHTML = `<i class="fas ${iconClass}"></i>`;
    themeToggleMobile.innerHTML = `<i class="fas ${iconClass}"></i>`;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Redraw games
    if(typeof drawSnakeGame === 'function' && isSnakeGameRunning) drawSnakeGame();
    if(typeof drawTetrisGrid === 'function' && isTetrisGameRunning) { drawTetrisGrid(); drawCurrentPiece(currentTetrisPiece); drawNextTetrisPiece(); }
    if(typeof draw2048Board === 'function' && is2048GameRunning) draw2048Board();
    if(typeof drawMatch3Board === 'function' && isMatch3GameRunning) drawMatch3Board();
    if(typeof drawSaperBoard === 'function' && isSaperGameRunning) drawSaperBoard();
    if(typeof drawMemoryBoard === 'function' && isMemoryGameRunning) drawMemoryBoard();
}

function applySavedTheme() {
    setTheme(localStorage.getItem('theme') === 'dark');
}

[themeToggle, themeToggleMobile].forEach(btn => btn.addEventListener('click', () => setTheme(!body.classList.contains('dark'))));

function updateProfileRecords() {
    document.getElementById('snakeProfileRecord').textContent = localStorage.getItem('highestSnakeScore') || '0';
    document.getElementById('tetrisProfileRecord').textContent = localStorage.getItem('highestTetrisScore') || '0';
    document.getElementById('game2048ProfileRecord').textContent = localStorage.getItem('highest2048Score') || '0';
    document.getElementById('match3ProfileRecord').textContent = localStorage.getItem('highestMatch3Score') || '0';
    document.getElementById('saperProfileRecord').textContent = localStorage.getItem('bestSaperTime') ? `${localStorage.getItem('bestSaperTime')} сек` : 'Нет';
    document.getElementById('memoryProfileRecord').textContent = localStorage.getItem('bestMemoryAttempts') ? `${localStorage.getItem('bestMemoryAttempts')} попыток` : 'Нет';
}

// --- SNAKE GAME (Fixed) --- //
const snakeCanvas = document.getElementById('snakeCanvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeScoreElement = document.getElementById('snakeScoreDisplay');
const snakeStartButton = document.getElementById('snakeStartButton');
const snakePauseButton = document.getElementById('snakePauseButton');
const snakeGameOverMessage = document.getElementById('snakeGameOverMessage');
const SNAKE_GRID_SIZE = 20;
const SNAKE_TILE_COUNT = snakeCanvas.width / SNAKE_GRID_SIZE;
const SNAKE_INITIAL_SPEED = 150;
let snake = [], snakeFood = {}, snakeVelocity = {}, currentSnakeScore = 0, snakeGameInterval, isSnakePaused = false, isSnakeGameRunning = false;
function drawSnakeGame() {
    const bgColor = body.classList.contains('dark') ? '#121212' : '#e0f2fe';
    snakeCtx.fillStyle = bgColor;
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    if (!isSnakeGameRunning) { return; }
    snakeCtx.fillStyle = '#ef4444';
    snakeCtx.beginPath();
    snakeCtx.arc(snakeFood.x * SNAKE_GRID_SIZE + SNAKE_GRID_SIZE / 2, snakeFood.y * SNAKE_GRID_SIZE + SNAKE_GRID_SIZE / 2, SNAKE_GRID_SIZE / 2 - 2, 0, 2 * Math.PI);
    snakeCtx.fill();
    snake.forEach((segment, index) => {
        snakeCtx.fillStyle = index === 0 ? (body.classList.contains('dark') ? '#03DAC6' : '#1e3a8a') : (body.classList.contains('dark') ? '#BB86FC' : '#3b82f6');
        snakeCtx.fillRect(segment.x * SNAKE_GRID_SIZE, segment.y * SNAKE_GRID_SIZE, SNAKE_GRID_SIZE - 1, SNAKE_GRID_SIZE - 1);
    });
}
function updateSnakeGame() {
     if (!isSnakeGameRunning || isSnakePaused) return;
     if (snakeVelocity.x === 0 && snakeVelocity.y === 0) return; // Fix: Don't move until first key press
     const head = { x: snake[0].x + snakeVelocity.x, y: snake[0].y + snakeVelocity.y };
     if (head.x < 0 || head.x >= SNAKE_TILE_COUNT || head.y < 0 || head.y >= SNAKE_TILE_COUNT || snake.some(s => s.x === head.x && s.y === head.y)) {
         return handleSnakeGameOver();
     }
     snake.unshift(head);
     if (head.x === snakeFood.x && head.y === snakeFood.y) {
         currentSnakeScore += 10;
         snakeScoreElement.textContent = currentSnakeScore;
         generateSnakeFood();
     } else {
         snake.pop();
     }
     drawSnakeGame();
}
function generateSnakeFood() {
    do {
        snakeFood = { x: Math.floor(Math.random() * SNAKE_TILE_COUNT), y: Math.floor(Math.random() * SNAKE_TILE_COUNT) };
    } while (snake.some(segment => segment.x === snakeFood.x && segment.y === snakeFood.y));
}
function startSnakeGame() {
    if(snakeGameInterval) clearInterval(snakeGameInterval);
    isSnakeGameRunning = true; isSnakePaused = false;
    snakeGameOverMessage.classList.add('hidden'); snakePauseButton.disabled = false; snakeStartButton.textContent = 'Перезапустить';
    snake = [{ x: 10, y: 10 }]; snakeVelocity = { x: 0, y: 0 }; currentSnakeScore = 0; snakeScoreElement.textContent = 0;
    generateSnakeFood();
    snakeGameInterval = setInterval(updateSnakeGame, SNAKE_INITIAL_SPEED);
    drawSnakeGame();
}
function toggleSnakePause() {
    if (!isSnakeGameRunning) return;
    isSnakePaused = !isSnakePaused;
    snakePauseButton.textContent = isSnakePaused ? 'Продолжить' : 'Пауза';
}
function handleSnakeGameOver() {
    clearInterval(snakeGameInterval);
    isSnakeGameRunning = false;
    snakeGameOverMessage.classList.remove('hidden'); snakePauseButton.disabled = true; snakeStartButton.textContent = 'Начать Игру';
    if (currentSnakeScore > (localStorage.getItem('highestSnakeScore') || 0)) {
        localStorage.setItem('highestSnakeScore', currentSnakeScore);
        updateProfileRecords();
    }
}
snakeStartButton.addEventListener('click', startSnakeGame);
snakePauseButton.addEventListener('click', toggleSnakePause);

// --- TETRIS GAME (Fixed Rotation) --- //
const tetrisCanvas = document.getElementById('tetrisCanvas');
const tetrisCtx = tetrisCanvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const tetrisScoreDisplay = document.getElementById('tetrisScoreDisplay');
const tetrisLinesDisplay = document.getElementById('tetrisLinesDisplay');
const tetrisLevelDisplay = document.getElementById('tetrisLevelDisplay');
const tetrisStartButton = document.getElementById('tetrisStartButton');
const tetrisPauseButton = document.getElementById('tetrisPauseButton');
const tetrisGameOverMessage = document.getElementById('tetrisGameOverMessage');
const TETRIS_COLS = 10, TETRIS_ROWS = 20, TETRIS_BLOCK_SIZE = 30;
tetrisCtx.canvas.width = TETRIS_COLS * TETRIS_BLOCK_SIZE; tetrisCtx.canvas.height = TETRIS_ROWS * TETRIS_BLOCK_SIZE;
nextPieceCtx.canvas.width = 4 * TETRIS_BLOCK_SIZE; nextPieceCtx.canvas.height = 4 * TETRIS_BLOCK_SIZE;

const TETROMINOS = {
    'I': { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#38bdf8' },
    'O': { shape: [[1,1],[1,1]], color: '#facc15' },
    'T': { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#c084fc' },
    'J': { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#60a5fa' },
    'L': { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#fb923c' },
    'S': { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#4ade80' },
    'Z': { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#f87171' }
};
const TETROMINO_KEYS = Object.keys(TETROMINOS);
let tetrisBoard, currentTetrisPiece, nextTetrisPiece;
let tetrisScore = 0, tetrisLines = 0, tetrisLevel = 1, tetrisDropSpeed, tetrisDropSpeedStart = 1000;
let isTetrisPaused = false, isTetrisGameRunning = false;
let tetrisLastTime = 0, tetrisDropCounter = 0, tetrisRequestId;
        
function createTetrisBoard() { return Array(TETRIS_ROWS).fill(0).map(() => Array(TETRIS_COLS).fill(0)); }
function getRandomTetromino() {
    const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
    const piece = TETROMINOS[key];
    return { shape: piece.shape, color: piece.color, x: Math.floor(TETRIS_COLS/2) - 2, y: 0 };
}
function drawTetrisGrid() {
    tetrisCtx.clearRect(0, 0, tetrisCtx.canvas.width, tetrisCtx.canvas.height);
    tetrisCtx.fillStyle = body.classList.contains('dark') ? '#121212' : '#f0f9ff';
    tetrisCtx.fillRect(0, 0, tetrisCtx.canvas.width, tetrisCtx.canvas.height);
    for(let r=0; r<TETRIS_ROWS; r++) for(let c=0; c<TETRIS_COLS; c++) {
        if(tetrisBoard[r][c]) drawTetrisBlock(tetrisCtx, c, r, tetrisBoard[r][c]);
    }
}
function drawTetrisBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x*TETRIS_BLOCK_SIZE, y*TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);
    ctx.strokeStyle = body.classList.contains('dark') ? '#1E1E1E' : '#9ca3af';
    ctx.strokeRect(x*TETRIS_BLOCK_SIZE, y*TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);
}
function drawCurrentPiece() {
    if(!currentTetrisPiece) return;
    currentTetrisPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value) drawTetrisBlock(tetrisCtx, currentTetrisPiece.x+x, currentTetrisPiece.y+y, currentTetrisPiece.color);
        });
    });
}
function drawNextTetrisPiece() {
    nextPieceCtx.fillStyle = body.classList.contains('dark') ? '#121212' : '#f0f9ff';
    nextPieceCtx.fillRect(0,0,nextPieceCtx.canvas.width, nextPieceCtx.canvas.height);
    if(!nextTetrisPiece) return;
    nextTetrisPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if(value) drawTetrisBlock(nextPieceCtx, x, y, nextTetrisPiece.color, TETRIS_BLOCK_SIZE);
        });
    });
}
function rotate(matrix) {
    const N = matrix.length;
    const newMatrix = matrix.map((_, i) => matrix.map(col => col[i]).reverse());
    return newMatrix;
}
function rotateTetrisPiece() {
    const newShape = rotate(currentTetrisPiece.shape);
    const originalX = currentTetrisPiece.x;
    const kickOffsets = [0, 1, -1, 2, -2]; // Wall kick offsets

    for (const offset of kickOffsets) {
        currentTetrisPiece.x = originalX + offset;
        if (!checkCollision(newShape, currentTetrisPiece.x, currentTetrisPiece.y)) {
            currentTetrisPiece.shape = newShape;
            return;
        }
    }
    currentTetrisPiece.x = originalX; // Revert if no valid position found
}
function checkCollision(shape, x, y) {
    for(let r=0; r<shape.length; r++) for(let c=0; c<shape[r].length; c++){
        if(!shape[r][c]) continue;
        let newX = x + c;
        let newY = y + r;
        if(newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS || (newY >= 0 && tetrisBoard[newY] && tetrisBoard[newY][newX])) return true;
    }
    return false;
}
function mergeTetrisPiece() {
    currentTetrisPiece.shape.forEach((row, y) => row.forEach((val, x) => {
        if(val) tetrisBoard[currentTetrisPiece.y+y][currentTetrisPiece.x+x] = currentTetrisPiece.color;
    }));
}
function removeFullLines() {
    let linesCleared = 0;
    outer: for(let r=TETRIS_ROWS-1; r>=0; r--) {
        for(let c=0; c<TETRIS_COLS; c++) if(!tetrisBoard[r][c]) continue outer;
        linesCleared++;
        tetrisBoard.splice(r, 1);
        tetrisBoard.unshift(Array(TETRIS_COLS).fill(0));
        r++;
    }
    if(linesCleared > 0) {
        tetrisLines += linesCleared;
        tetrisScore += Math.pow(linesCleared, 2) * 10 * tetrisLevel;
        if(tetrisLines >= tetrisLevel*10) { tetrisLevel++; tetrisDropSpeed *= 0.9; }
        updateTetrisUI();
    }
}
function updateTetrisUI(){ tetrisScoreDisplay.textContent=tetrisScore; tetrisLinesDisplay.textContent=tetrisLines; tetrisLevelDisplay.textContent=tetrisLevel; }
        
function startTetrisGame() {
    if(tetrisRequestId) cancelAnimationFrame(tetrisRequestId);
    isTetrisGameRunning = true; isTetrisPaused = false;
    tetrisGameOverMessage.classList.add('hidden'); tetrisPauseButton.disabled=false; tetrisStartButton.textContent = 'Перезапустить';
    tetrisBoard = createTetrisBoard();
    tetrisScore=0; tetrisLines=0; tetrisLevel=1; tetrisDropSpeed = tetrisDropSpeedStart;
    updateTetrisUI();
    currentTetrisPiece = getRandomTetromino(); nextTetrisPiece = getRandomTetromino();
    drawNextTetrisPiece();
    tetrisLastTime = 0;
    tetrisGameLoop();
}
function tetrisPieceFall() {
    if(isTetrisPaused) return;
    if (checkCollision(currentTetrisPiece.shape, currentTetrisPiece.x, currentTetrisPiece.y + 1)) {
        mergeTetrisPiece();
        removeFullLines();
        currentTetrisPiece = nextTetrisPiece;
        nextTetrisPiece = getRandomTetromino();
        drawNextTetrisPiece();
        if(checkCollision(currentTetrisPiece.shape, currentTetrisPiece.x, currentTetrisPiece.y)) handleTetrisGameOver();
    } else {
         currentTetrisPiece.y++;
    }
}
function tetrisGameLoop(time = 0) {
    if(!isTetrisGameRunning) return;
    if(!isTetrisPaused){
        const deltaTime = time - tetrisLastTime;
        tetrisLastTime = time;
        tetrisDropCounter += deltaTime;
        if(tetrisDropCounter > tetrisDropSpeed) { tetrisPieceFall(); tetrisDropCounter=0; }
        drawTetrisGrid(); drawCurrentPiece();
    }
    tetrisRequestId = requestAnimationFrame(tetrisGameLoop);
}
function handleTetrisGameOver() {
    cancelAnimationFrame(tetrisRequestId);
    isTetrisGameRunning=false;
    tetrisGameOverMessage.classList.remove('hidden');
    if (tetrisScore > (localStorage.getItem('highestTetrisScore') || 0)) {
        localStorage.setItem('highestTetrisScore', tetrisScore);
        updateProfileRecords();
    }
}
tetrisStartButton.addEventListener('click', startTetrisGame);
tetrisPauseButton.addEventListener('click', () => { if(isTetrisGameRunning) isTetrisPaused = !isTetrisPaused; });

// --- 2048 GAME (No changes) --- //
const game2048BoardElement = document.getElementById('game2048Board');
const score2048Display = document.getElementById('score2048Display');
const start2048Button = document.getElementById('start2048Button');
const game2048OverMessageElement = document.getElementById('game2048OverMessage');
const restart2048Button = document.getElementById('restart2048Button');
const GRID_SIZE_2048 = 4;
let board2048 = [], score2048 = 0, is2048GameRunning = false;
function init2048Game() {
    is2048GameRunning = true;
    board2048 = Array(GRID_SIZE_2048).fill().map(() => Array(GRID_SIZE_2048).fill(0));
    score2048 = 0; game2048OverMessageElement.classList.add('hidden');
    addRandomTile2048(); addRandomTile2048();
    updateScore2048Display(); draw2048Board();
}
function draw2048Board() { game2048BoardElement.innerHTML = ''; board2048.forEach(row => row.forEach(val => { const cell = document.createElement('div'); cell.className = 'game2048-cell'; cell.dataset.value = val; cell.textContent = val > 0 ? val : ''; game2048BoardElement.appendChild(cell); })); }
function addRandomTile2048() { let empty = []; for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(board2048[r][c]===0)empty.push({r,c}); if(empty.length > 0) { const pos = empty[Math.floor(Math.random()*empty.length)]; board2048[pos.r][pos.c] = Math.random() > 0.1 ? 2 : 4; } }
function updateScore2048Display(){ score2048Display.textContent = score2048; }
function moveTiles(dir){ if(!is2048GameRunning) return; const prevBoard = JSON.stringify(board2048); if(dir === 'ArrowUp' || dir === 'ArrowDown'){ for(let c=0; c<4; c++){ let col = board2048.map(r => r[c]); let newCol = transformLine(col, dir === 'ArrowUp'); newCol.forEach((v, r) => board2048[r][c]=v); } } else { for(let r=0; r<4; r++){ board2048[r] = transformLine(board2048[r], dir === 'ArrowLeft'); } } if(JSON.stringify(board2048) !== prevBoard) { addRandomTile2048(); draw2048Board(); if(check2048GameOver()) handle2048GameOver(); } }
function transformLine(line, towardStart) { let filtered = line.filter(v=>v); let result = []; if(!towardStart) filtered.reverse(); for(let i=0; i<filtered.length; i++) { if(i<filtered.length-1 && filtered[i] === filtered[i+1]){ result.push(filtered[i]*2); score2048+=filtered[i]*2; i++; } else { result.push(filtered[i]); } } while(result.length < 4) result.push(0); if(!towardStart) result.reverse(); updateScore2048Display(); return result; }
function check2048GameOver(){ for(let r=0; r<4; r++)for(let c=0;c<4;c++){ if(board2048[r][c]===0)return false; if(r<3 && board2048[r][c]===board2048[r+1][c])return false; if(c<3 && board2048[r][c]===board2048[r][c+1])return false; } return true; }
function handle2048GameOver(){ is2048GameRunning=false; game2048OverMessageElement.classList.remove('hidden'); if(score2048 > (localStorage.getItem('highest2048Score')||0)) {localStorage.setItem('highest2048Score', score2048); updateProfileRecords();} }
start2048Button.addEventListener('click', init2048Game); restart2048Button.addEventListener('click', init2048Game);
        
// --- MATCH 3 GAME (Fixed) --- //
const match3ScoreDisplay = document.getElementById('match3ScoreDisplay');
const match3MovesDisplay = document.getElementById('match3MovesDisplay');
const match3StartButton = document.getElementById('match3StartButton');
const match3GameOverMessage = document.getElementById('match3GameOverMessage');
const match3GameBoard = document.getElementById('match3GameBoard');
const MATCH3_GRID_SIZE = 8;
const MATCH3_ELEMENT_TYPES = ['🍓', '🍇', '🍊', '🍋', '🍒', '🍍'];
let match3Board, match3Score, match3Moves;
let isMatch3GameRunning = false, isMatch3Checking = false, selectedMatch3Element = null;

function startMatch3Game() {
    isMatch3GameRunning = true;
    match3Score = 0; match3Moves = 30;
    match3GameOverMessage.classList.add('hidden'); match3StartButton.textContent = 'Перезапустить';
    do {
        match3Board = Array(MATCH3_GRID_SIZE).fill().map(() => Array(MATCH3_GRID_SIZE).fill().map(() => MATCH3_ELEMENT_TYPES[Math.floor(Math.random() * MATCH3_ELEMENT_TYPES.length)]));
    } while (findMatches().length > 0);
    updateMatch3UI(); drawMatch3Board();
}
function drawMatch3Board() {
    match3GameBoard.innerHTML = '';
    match3GameBoard.style.gridTemplateColumns = `repeat(${MATCH3_GRID_SIZE}, 1fr)`;
    match3Board.forEach((row, r) => row.forEach((el, c) => {
        const cell = document.createElement('div');
        cell.className = 'match3-cell'; cell.textContent = el;
        cell.dataset.r = r; cell.dataset.c = c;
        if(selectedMatch3Element && selectedMatch3Element.r === r && selectedMatch3Element.c === c) cell.classList.add('selected');
        cell.onclick = () => onMatch3CellClick(r, c);
        match3GameBoard.appendChild(cell);
    }));
}
function updateMatch3UI() { match3ScoreDisplay.textContent = match3Score; match3MovesDisplay.textContent = match3Moves; }
        
async function onMatch3CellClick(r, c) {
    if (!isMatch3GameRunning || isMatch3Checking) return;
    if (!selectedMatch3Element) {
        selectedMatch3Element = {r, c};
        drawMatch3Board(); return;
    }
    const { r: r1, c: c1 } = selectedMatch3Element;
    if (Math.abs(r1 - r) + Math.abs(c1 - c) !== 1) {
        selectedMatch3Element = null; drawMatch3Board(); return;
    }
    isMatch3Checking = true;
    swapElements(r1, c1, r, c);
    drawMatch3Board();
    await new Promise(res => setTimeout(res, 200));

    let matches = findMatches();
    if (matches.length === 0) {
        swapElements(r1, c1, r, c); // swap back
        drawMatch3Board();
    } else {
        match3Moves--;
        updateMatch3UI();
        while(matches.length > 0){
            await handleMatches(matches);
            matches = findMatches();
        }
        if (match3Moves <= 0) handleMatch3GameOver();
    }
    selectedMatch3Element = null; isMatch3Checking = false;
}

function swapElements(r1, c1, r2, c2) { const temp = match3Board[r1][c1]; match3Board[r1][c1] = match3Board[r2][c2]; match3Board[r2][c2] = temp; }

function findMatches() {
    const matches = new Set();
    for(let r=0; r<8; r++) for(let c=0; c<6; c++) if(match3Board[r][c]&&match3Board[r][c]===match3Board[r][c+1]&&match3Board[r][c]===match3Board[r][c+2]) matches.add(`${r}-${c}`).add(`${r}-${c+1}`).add(`${r}-${c+2}`);
    for(let c=0; c<8; c++) for(let r=0; r<6; r++) if(match3Board[r][c]&&match3Board[r][c]===match3Board[r+1][c]&&match3Board[r][c]===match3Board[r+2][c]) matches.add(`${r}-${c}`).add(`${r+1}-${c}`).add(`${r+2}-${c}`);
    return Array.from(matches).map(s => ({ r: parseInt(s.split('-')[0]), c: parseInt(s.split('-')[1]) }));
}

async function handleMatches(matches) {
    match3Score += matches.length * 10; updateMatch3UI();
    matches.forEach(({r, c}) => match3Board[r][c] = null);
    drawMatch3Board(); await new Promise(res => setTimeout(res, 300));
    // Drop & Refill
    for(let c=0; c<8; c++) { let emptyCount=0; for(let r=7; r>=0; r--) { if(!match3Board[r][c]) emptyCount++; else if(emptyCount>0) swapElements(r,c, r+emptyCount, c); } }
    for(let r=0; r<8; r++) for(let c=0; c<8; c++) if(!match3Board[r][c]) match3Board[r][c] = MATCH3_ELEMENT_TYPES[Math.floor(Math.random()*6)];
    drawMatch3Board(); await new Promise(res => setTimeout(res, 200));
}

function handleMatch3GameOver() {
    isMatch3GameRunning = false;
    match3GameOverMessage.classList.remove('hidden');
    if(match3Score > (localStorage.getItem('highestMatch3Score') || 0)) {
        localStorage.setItem('highestMatch3Score', match3Score);
        updateProfileRecords();
    }
}
match3StartButton.addEventListener('click', startMatch3Game);
        
// --- SAPER GAME (Fixed) --- //
const saperBoardElement = document.getElementById('saperBoard');
const saperBombsDisplay = document.getElementById('saperBombsDisplay');
const saperTimeDisplay = document.getElementById('saperTimeDisplay');
const saperStartButton = document.getElementById('saperStartButton');
const saperGameOverMessage = document.getElementById('saperGameOverMessage');
const SAPER_GRID_SIZE = 10, SAPER_BOMB_COUNT = 15;
let saperBoard, saperTime, saperTimer;
let isSaperGameRunning = false, firstClick = true;

function getNumberColor(num) {
    const colors = ['#1e40af', '#16a34a', '#b91c1c', '#7e22ce', '#854d0e', '#155e75', '#1f2937', '#4b5563'];
    return colors[num - 1] || 'black';
}

function startSaperGame() {
    isSaperGameRunning = true; firstClick = true;
    saperTime = 0; if(saperTimer) clearInterval(saperTimer);
    saperTimer = setInterval(() => { saperTime++; updateSaperUI(); }, 1000);
    saperGameOverMessage.classList.add('hidden'); saperStartButton.textContent = 'Перезапустить';
    saperBoard = Array(SAPER_GRID_SIZE).fill().map(() => Array(SAPER_GRID_SIZE).fill().map(() => ({ isBomb: false, isRevealed: false, isFlagged: false, neighborBombs: 0 })));
    updateSaperUI(); drawSaperBoard();
}
function generateSaperBombs(firstR, firstC) {
    let bombs = 0;
    while(bombs < SAPER_BOMB_COUNT) {
        const r = Math.floor(Math.random() * SAPER_GRID_SIZE);
        const c = Math.floor(Math.random() * SAPER_GRID_SIZE);
        if (!saperBoard[r][c].isBomb && (r !== firstR || c !== firstC)) {
            saperBoard[r][c].isBomb = true; bombs++;
        }
    }
    for(let r=0; r<10; r++) for(let c=0; c<10; c++) if(!saperBoard[r][c].isBomb) for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(r+dr>=0&&r+dr<10&&c+dc>=0&&c+dc<10&&saperBoard[r+dr][c+dc].isBomb) saperBoard[r][c].neighborBombs++;
}
function drawSaperBoard() {
    saperBoardElement.innerHTML = ''; saperBoardElement.style.gridTemplateColumns = `repeat(${SAPER_GRID_SIZE}, 1fr)`;
    saperBoard.forEach((row, r) => row.forEach((cell, c) => {
        const el = document.createElement('div'); el.className = 'saper-cell'; el.dataset.r=r; el.dataset.c=c;
        if(cell.isRevealed) {
            el.classList.add('revealed');
            if(cell.isBomb) { el.textContent = '💣'; el.classList.add('bomb'); }
            else if(cell.neighborBombs > 0) { el.textContent = cell.neighborBombs; el.style.color = getNumberColor(cell.neighborBombs); }
        } else if(cell.isFlagged) { el.textContent = '🚩'; el.classList.add('flagged'); }
        el.onclick = () => onSaperClick(r,c); el.oncontextmenu = (e) => { e.preventDefault(); onSaperRightClick(r,c); };
        saperBoardElement.appendChild(el);
    }));
}
function onSaperClick(r,c){
    if(!isSaperGameRunning || saperBoard[r][c].isRevealed || saperBoard[r][c].isFlagged) return;
    if(firstClick) { generateSaperBombs(r,c); firstClick=false; }
    if(saperBoard[r][c].isBomb) { handleSaperGameOver(false); return; }
    revealCell(r,c);
    if(checkSaperWin()) handleSaperGameOver(true);
}
function onSaperRightClick(r,c){ if(!isSaperGameRunning || saperBoard[r][c].isRevealed) return; saperBoard[r][c].isFlagged = !saperBoard[r][c].isFlagged; updateSaperUI(); drawSaperBoard(); }
function revealCell(r,c) {
    if(r<0||r>=10||c<0||c>=10||saperBoard[r][c].isRevealed) return;
    saperBoard[r][c].isRevealed = true;
    if(saperBoard[r][c].neighborBombs === 0) for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)revealCell(r+dr,c+dc);
    drawSaperBoard();
}
function checkSaperWin() { return saperBoard.flat().filter(c => !c.isBomb).every(c => c.isRevealed); }
function handleSaperGameOver(win) {
    clearInterval(saperTimer); isSaperGameRunning=false;
    saperGameOverMessage.textContent = win ? "Победа!" : "БУМ! Проигрыш."; saperGameOverMessage.classList.remove('hidden');
    saperBoard.flat().forEach(c => c.isRevealed = true); drawSaperBoard();
    if(win && (!localStorage.getItem('bestSaperTime') || saperTime < localStorage.getItem('bestSaperTime'))) { localStorage.setItem('bestSaperTime', saperTime); updateProfileRecords(); }
}
function updateSaperUI(){ saperTimeDisplay.textContent = saperTime; saperBombsDisplay.textContent = SAPER_BOMB_COUNT - saperBoard.flat().filter(c=>c.isFlagged).length; }
saperStartButton.addEventListener('click', startSaperGame);

// --- MEMORY GAME (Fixed) --- //
const memoryGameBoard = document.getElementById('memoryGameBoard');
const memoryScoreDisplay = document.getElementById('memoryScoreDisplay');
const memoryAttemptsDisplay = document.getElementById('memoryAttemptsDisplay');
const memoryStartButton = document.getElementById('memoryStartButton');
const memoryWinMessage = document.getElementById('memoryWinMessage');
const MEMORY_CARD_IMAGES = ['🍎','🍌','🍇','🍓','🍒','🍑','🍍','🍊'];
let memoryBoard, memoryScore, memoryAttempts;
let isMemoryGameRunning = false, flippedCards = [], isCheckingMatch = false;
        
function startMemoryGame() {
    isMemoryGameRunning = true; memoryScore=0; memoryAttempts=0; flippedCards=[]; isCheckingMatch=false;
    memoryWinMessage.classList.add('hidden'); memoryStartButton.textContent = 'Перезапустить';
    const pairs = [...MEMORY_CARD_IMAGES, ...MEMORY_CARD_IMAGES];
    memoryBoard = pairs.map((val, id) => ({ val, id, isFlipped: false, isMatched: false })).sort(() => Math.random() - 0.5);
    updateMemoryUI(); drawMemoryBoard();
}
function drawMemoryBoard() {
    memoryGameBoard.innerHTML = '';
    memoryBoard.forEach((card, index) => {
        const el = document.createElement('div'); el.className = 'memory-card'; el.dataset.index = index;
        if(card.isFlipped || card.isMatched) el.classList.add('flipped');
        if(card.isMatched) el.classList.add('matched');
        el.innerHTML = `<div class="memory-card-face card-back">?</div><div class="memory-card-face card-front" style="font-size: 2.5em;">${card.val}</div>`;
        el.onclick = () => onMemoryCardClick(index);
        memoryGameBoard.appendChild(el);
    });
}
function onMemoryCardClick(index) {
    const card = memoryBoard[index];
    if(!isMemoryGameRunning || isCheckingMatch || card.isFlipped || flippedCards.length >= 2) return;
    card.isFlipped=true; flippedCards.push(card); drawMemoryBoard();
    if(flippedCards.length === 2) { isCheckingMatch=true; memoryAttempts++; updateMemoryUI(); setTimeout(checkMemoryMatch, 800); }
}
function checkMemoryMatch() {
    const [c1, c2] = flippedCards;
    if(c1.val === c2.val) { c1.isMatched=true; c2.isMatched=true; memoryScore+=100; }
    else { c1.isFlipped=false; c2.isFlipped=false; }
    flippedCards = []; isCheckingMatch = false; updateMemoryUI(); drawMemoryBoard();
    if(memoryBoard.every(c => c.isMatched)) handleMemoryWin();
}
function handleMemoryWin() {
    isMemoryGameRunning=false; memoryWinMessage.classList.remove('hidden');
    if(!localStorage.getItem('bestMemoryAttempts') || memoryAttempts < localStorage.getItem('bestMemoryAttempts')) { localStorage.setItem('bestMemoryAttempts', memoryAttempts); updateProfileRecords(); }
}
function updateMemoryUI(){ memoryScoreDisplay.textContent = memoryScore; memoryAttemptsDisplay.textContent = memoryAttempts; }
memoryStartButton.addEventListener('click', startMemoryGame);

// --- General Initialization & Keyboard --- //
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme(); handlePageNavigation(); updateProfileRecords();
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    // Improved Dark Theme Palette
                    dark: {
                        background: '#121212',
                        surface: '#1E1E1E',
                        primary: '#BB86FC',
                        secondary: '#03DAC6',
                        text: '#E0E0E0',
                        'text-secondary': '#A0A0A0',
                        border: '#333333',
                    }
                }
            }
        }
    }
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    let dropdownTimeout;

    dropdown.addEventListener('mouseenter', () => {
        clearTimeout(dropdownTimeout);
        dropdownMenu.style.display = 'block';
    });

    dropdown.addEventListener('mouseleave', () => {
        dropdownTimeout = setTimeout(() => {
            dropdownMenu.style.display = 'none';
        }, 200); // Задержка 200 мс перед сворачиванием
    });

    dropdownMenu.addEventListener('mouseenter', () => {
        clearTimeout(dropdownTimeout);
    });

    dropdownMenu.addEventListener('mouseleave', () => {
        dropdownTimeout = setTimeout(() => {
            dropdownMenu.style.display = 'none';
        }, 200);
    });
});
document.addEventListener('keydown', (e) => {
    const activePage = document.querySelector('.page-section:not(.hidden)')?.id;
    if (!activePage) return;
    switch(activePage) {
        case 'snake':
            if(!isSnakeGameRunning || isSnakePaused) return;
            e.preventDefault();
            if(e.key==='ArrowUp'&&snakeVelocity.y===0) snakeVelocity={x:0,y:-1}; else if(e.key==='ArrowDown'&&snakeVelocity.y===0) snakeVelocity={x:0,y:1}; else if(e.key==='ArrowLeft'&&snakeVelocity.x===0) snakeVelocity={x:-1,y:0}; else if(e.key==='ArrowRight'&&snakeVelocity.x===0) snakeVelocity={x:1,y:0}; else if(e.key===' ') toggleSnakePause();
            break;
        case 'tetris':
            if(!isTetrisGameRunning || isTetrisPaused || !currentTetrisPiece) return;
            e.preventDefault();
            if(e.key==='ArrowLeft'){ if(!checkCollision(currentTetrisPiece.shape, currentTetrisPiece.x - 1, currentTetrisPiece.y)) currentTetrisPiece.x--; }
            else if(e.key==='ArrowRight'){ if(!checkCollision(currentTetrisPiece.shape, currentTetrisPiece.x + 1, currentTetrisPiece.y)) currentTetrisPiece.x++; }
            else if(e.key==='ArrowDown') tetrisPieceFall();
            else if(e.key.toLowerCase()==='x' || e.key.toLowerCase()==='w' || e.key==='ArrowUp') rotateTetrisPiece();
            else if(e.key===' ') isTetrisPaused = !isTetrisPaused;
            drawTetrisGrid(); drawCurrentPiece();
            break;
        case '2048':
            if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){ e.preventDefault(); moveTiles(e.key); }
            break;
    }
});