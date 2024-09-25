
document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Adjust canvas size dynamically
    function resizeCanvas() {
        const maxGridSize = 500;  // Max grid size for desktop
        const screenHeight = window.innerHeight * 0.5; // Adjust canvas height to be 50% of screen height
        const screenWidth = window.innerWidth;

        // Scale down the canvas to fit on screen
        if (screenWidth < maxGridSize) {
            const newSize = Math.min(screenWidth * 0.9, screenHeight);  // Ensure it fits the screen and maintains aspect ratio
            canvas.style.width = `${newSize}px`;
            canvas.style.height = `${newSize}px`;
        } else {
            const newSize = Math.min(maxGridSize, screenHeight);
            canvas.style.width = `${newSize}px`;
            canvas.style.height = `${newSize}px`;
        }

        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const origin = { x: canvas.width / 2, y: canvas.height / 2 };
    const gridSpacing = Math.round(canvas.width / 10);  // Dynamically calculate grid spacing based on canvas size
    const initialUnitVectorX = { x: gridSpacing, y: 0 };
    const initialUnitVectorY = { x: 0, y: -gridSpacing };
    let unitVectorX = { ...initialUnitVectorX };
    let unitVectorY = { ...initialUnitVectorY };

    let dragging = null;
    let moveCounter = 0;
    let gameWon = false;
    let gameStarted = false;
    let timer = null;
    let elapsedTime = 0;
    let isPaused = false;

    function gridToCanvas(point) {
        return { x: origin.x + point.x * gridSpacing, y: origin.y - point.y * gridSpacing };
    }

    function canvasToGrid(point) {
        return { x: Math.round((point.x - origin.x) / gridSpacing), y: Math.round((origin.y - point.y) / gridSpacing) };
    }

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'lightgray';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let i = 0; i <= canvas.width; i += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let j = 0; j <= canvas.height; j += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(canvas.width, j);
            ctx.stroke();
        }
    }

    function drawAxes() {
        ctx.beginPath();
        ctx.moveTo(0, origin.y);  // Draw x-axis
        ctx.lineTo(canvas.width, origin.y);
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(origin.x, 0);  // Draw y-axis
        ctx.lineTo(origin.x, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.font = '10px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText('X', canvas.width - 10, origin.y - 10);
        ctx.fillText('Y', origin.x + 10, 10);
    }

    function drawArrow(start, end, color, label = '') {
        const headLength = 7;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fill();

        if (label) {
            ctx.font = '10px Arial';
            ctx.fillStyle = color;
            ctx.fillText(label, end.x + 5, end.y - 5);
        }
    }

    function drawBasisVectors() {
        // Draw standard black basis vectors
        drawArrow(origin, { x: origin.x + initialUnitVectorX.x, y: origin.y + initialUnitVectorX.y }, 'black', 'i');
        drawArrow(origin, { x: origin.x + initialUnitVectorY.x, y: origin.y + initialUnitVectorY.y }, 'black', 'j');

        // Draw draggable green basis vectors
        drawArrow(origin, { x: origin.x + unitVectorX.x, y: origin.y + unitVectorX.y }, 'green', "i'");
        drawArrow(origin, { x: origin.x + unitVectorY.x, y: origin.y + unitVectorY.y }, 'green', "j'");
    }

    function drawPoints() {
        let redCanvasPoint = gridToCanvas({ x: 3, y: 2 });  // Example red point
        ctx.beginPath();
        ctx.arc(redCanvasPoint.x, redCanvasPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();

        let blueCanvasPoint = gridToCanvas({ x: -2, y: -1 });  // Example blue point
        ctx.beginPath();
        ctx.arc(blueCanvasPoint.x, blueCanvasPoint.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();

        drawArrow(origin, blueCanvasPoint, 'blue');
    }

    function initializeGame() {
        moveCounter = 0;
        gameWon = false;
        gameStarted = false;
        document.getElementById('moveCounter').innerText = '0';
        drawGrid();
        drawAxes();
        drawBasisVectors();  // Draw standard and green basis vectors
        drawPoints();
    }

    // Handling buttons and game controls
    document.getElementById('goButton').addEventListener('click', () => {
        if (gameWon) return;
        if (!gameStarted) {
            gameStarted = true;
            draw();
        }
        moveCounter += 1;
        document.getElementById('moveCounter').innerText = `${moveCounter}`;
        drawTransformedVector(); // Show the transformed vector on Go click
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        initializeGame();
    });

    document.getElementById('pauseButton').addEventListener('click', () => {
        togglePause();
    });

    function togglePause() {
        if (gameWon) return;

        if (isPaused) {
            isPaused = false;
            document.getElementById('pauseButton').innerText = 'Pause';
            draw();
        } else {
            isPaused = true;
            document.getElementById('pauseButton').innerText = 'Resume';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawAxes();
        }
    }

    // Dragging functionality for green vectors
    canvas.addEventListener('mousedown', (event) => {
        if (gameWon || isPaused) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const clickPoint = { x: x, y: y };

        if (isOnVector(clickPoint, unitVectorX)) {
            dragging = 'unitVectorX';
        } else if (isOnVector(clickPoint, unitVectorY)) {
            dragging = 'unitVectorY';
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (dragging && !isPaused) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const gridPoint = canvasToGrid({ x, y });

            const snappedX = Math.round(gridPoint.x) * gridSpacing;
            const snappedY = Math.round(gridPoint.y) * -gridSpacing;

            if (dragging === 'unitVectorX') {
                unitVectorX = { x: snappedX, y: snappedY };
            } else if (dragging === 'unitVectorY') {
                unitVectorY = { x: snappedX, y: snappedY };
            }

            drawGrid();
            drawAxes();
            drawBasisVectors();
            drawPoints();
        }
    });

    canvas.addEventListener('mouseup', () => { dragging = null; });

    initializeGame();  // Start the game when the page loads
});
