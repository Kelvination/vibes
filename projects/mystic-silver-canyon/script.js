// Game state
let gameState = {
    board: Array(16).fill(null), // 4x4 board
    currentPlayer: 1,
    selectedPiece: null,
    gameOver: false,
    phase: 'selecting' // 'selecting' or 'placing'
};

// Piece attributes: [height, color, shape, fill]
// height: 0=short, 1=tall
// color: 0=light, 1=dark
// shape: 0=square, 1=circle
// fill: 0=solid, 1=hollow
const pieces = [
    [0, 0, 0, 0], // Short, Light, Square, Solid
    [0, 0, 0, 1], // Short, Light, Square, Hollow
    [0, 0, 1, 0], // Short, Light, Circle, Solid
    [0, 0, 1, 1], // Short, Light, Circle, Hollow
    [0, 1, 0, 0], // Short, Dark, Square, Solid
    [0, 1, 0, 1], // Short, Dark, Square, Hollow
    [0, 1, 1, 0], // Short, Dark, Circle, Solid
    [0, 1, 1, 1], // Short, Dark, Circle, Hollow
    [1, 0, 0, 0], // Tall, Light, Square, Solid
    [1, 0, 0, 1], // Tall, Light, Square, Hollow
    [1, 0, 1, 0], // Tall, Light, Circle, Solid
    [1, 0, 1, 1], // Tall, Light, Circle, Hollow
    [1, 1, 0, 0], // Tall, Dark, Square, Solid
    [1, 1, 0, 1], // Tall, Dark, Square, Hollow
    [1, 1, 1, 0], // Tall, Dark, Circle, Solid
    [1, 1, 1, 1]  // Tall, Dark, Circle, Hollow
];

let usedPieces = new Set();

// Initialize the game
function initGame() {
    gameState = {
        board: Array(16).fill(null),
        currentPlayer: 1,
        selectedPiece: null,
        gameOver: false,
        phase: 'selecting'
    };
    usedPieces.clear();

    renderBoard();
    renderPieces();
    updateStatus();
}

// Render the game board
function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        if (gameState.board[i] !== null) {
            const piece = createPieceVisual(pieces[gameState.board[i]]);
            cell.appendChild(piece);
            cell.classList.add('disabled');
        } else if (gameState.phase === 'placing') {
            cell.addEventListener('click', () => placePiece(i));
        } else {
            cell.classList.add('disabled');
        }

        boardElement.appendChild(cell);
    }
}

// Render available pieces
function renderPieces() {
    const piecesElement = document.getElementById('pieces');
    piecesElement.innerHTML = '';

    pieces.forEach((piece, index) => {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'piece';
        pieceDiv.dataset.index = index;

        if (usedPieces.has(index)) {
            pieceDiv.classList.add('used');
        } else if (gameState.phase === 'selecting' && !gameState.gameOver) {
            pieceDiv.addEventListener('click', () => selectPiece(index));
        }

        if (gameState.selectedPiece === index) {
            pieceDiv.classList.add('selected');
        }

        const visual = createPieceVisual(piece);
        pieceDiv.appendChild(visual);
        piecesElement.appendChild(pieceDiv);
    });
}

// Create visual representation of a piece
function createPieceVisual(piece) {
    const visual = document.createElement('div');
    visual.className = 'piece-visual';

    // Add classes based on attributes
    visual.classList.add(piece[0] === 1 ? 'tall' : 'short');
    visual.classList.add(piece[1] === 1 ? 'dark' : 'light');
    visual.classList.add(piece[2] === 1 ? 'circle' : 'square');
    visual.classList.add(piece[3] === 1 ? 'hollow' : 'solid');

    return visual;
}

// Select a piece for the opponent
function selectPiece(index) {
    if (gameState.gameOver || usedPieces.has(index) || gameState.phase !== 'selecting') {
        return;
    }

    gameState.selectedPiece = index;
    gameState.phase = 'placing';
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;

    updateStatus();
    renderBoard();
    renderPieces();
}

// Place the selected piece on the board
function placePiece(cellIndex) {
    if (gameState.gameOver || gameState.board[cellIndex] !== null ||
        gameState.selectedPiece === null || gameState.phase !== 'placing') {
        return;
    }

    // Place the piece
    gameState.board[cellIndex] = gameState.selectedPiece;
    usedPieces.add(gameState.selectedPiece);

    // Check for win
    if (checkWin()) {
        gameState.gameOver = true;
        updateStatus(true);
        renderBoard();
        renderPieces();
        return;
    }

    // Check for draw (board full)
    if (usedPieces.size === 16) {
        gameState.gameOver = true;
        updateStatus(false, true);
        renderBoard();
        renderPieces();
        return;
    }

    // Reset selected piece and switch phase
    gameState.selectedPiece = null;
    gameState.phase = 'selecting';

    updateStatus();
    renderBoard();
    renderPieces();
}

// Check if there's a winning combination
function checkWin() {
    const lines = [
        // Rows
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
        // Columns
        [0, 4, 8, 12],
        [1, 5, 9, 13],
        [2, 6, 10, 14],
        [3, 7, 11, 15],
        // Diagonals
        [0, 5, 10, 15],
        [3, 6, 9, 12]
    ];

    for (const line of lines) {
        const piecesInLine = line
            .map(i => gameState.board[i])
            .filter(p => p !== null);

        if (piecesInLine.length === 4) {
            if (hasCommonAttribute(piecesInLine.map(i => pieces[i]))) {
                return true;
            }
        }
    }

    return false;
}

// Check if pieces share at least one common attribute
function hasCommonAttribute(piecesArray) {
    // Check each attribute (0-3)
    for (let attr = 0; attr < 4; attr++) {
        const firstValue = piecesArray[0][attr];
        if (piecesArray.every(piece => piece[attr] === firstValue)) {
            return true;
        }
    }
    return false;
}

// Update status message
function updateStatus(won = false, draw = false) {
    const statusElement = document.getElementById('status');

    if (draw) {
        statusElement.textContent = "Game Over - It's a draw!";
        statusElement.classList.add('winner-message');
        return;
    }

    if (won) {
        statusElement.textContent = `Player ${gameState.currentPlayer} wins!`;
        statusElement.classList.add('winner-message');
        return;
    }

    statusElement.classList.remove('winner-message');

    if (gameState.phase === 'selecting') {
        const opponent = gameState.currentPlayer === 1 ? 2 : 1;
        statusElement.textContent = `Player ${opponent}: Select a piece for Player ${gameState.currentPlayer}`;
    } else {
        statusElement.textContent = `Player ${gameState.currentPlayer}: Place your piece on the board`;
    }
}

// Reset button
document.getElementById('resetBtn').addEventListener('click', initGame);

// Initialize game on load
initGame();
