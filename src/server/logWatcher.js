const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const { Tail } = require('tail');

const ERROR_LOG_PATH = 'C:\\bin\\laragon\\tmp\\php_errors.log';
const MAX_INITIAL_LINES = 20;
const PORT = 8077;

// Створюємо HTTP сервер
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end('OK');
        return;
    }
    res.writeHead(404);
    res.end();
});

// Створюємо WebSocket сервер, прикріплений до HTTP сервера
const wss = new WebSocket.Server({ server });

// Функція для читання останніх N рядків з файлу
function getLastNLines(filePath, n) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        return lines.slice(-n);
    } catch (error) {
        console.error('Error reading log file:', error);
        return [];
    }
}

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Відправляємо початкові рядки
    const initialLines = getLastNLines(ERROR_LOG_PATH, MAX_INITIAL_LINES);
    ws.send(JSON.stringify(initialLines));

    // Створюємо tail для відстеження нових рядків
    const tail = new Tail(ERROR_LOG_PATH);

    tail.on('line', (data) => {
        ws.send(JSON.stringify([data]));
    });

    tail.on('error', (error) => {
        console.error('Error watching file:', error);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        tail.unwatch();
    });
});

// Запускаємо сервер
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
