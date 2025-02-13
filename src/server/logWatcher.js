const WebSocket = require('ws');
const fs = require('fs');
const { Tail } = require('tail');

const ERROR_LOG_PATH = 'C:\\bin\\laragon\\tmp\\php_errors.log';
const MAX_INITIAL_LINES = 20;

const wss = new WebSocket.Server({ port: 8077 });

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
