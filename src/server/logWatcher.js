const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const { Tail } = require('tail');

// Parse command line arguments.
const args = process.argv.slice(2);
const getArg = (flag) => {
	const index = args.indexOf(flag);
	return index > -1 ? args[index + 1] : null;
};

const ERROR_LOG_PATH = getArg('--log') || 'C:/bin/laragon/tmp/php_errors.log';
const PORT = parseInt(getArg('--port')) || 8077;
const MAX_INITIAL_LINES = parseInt(getArg('--lines')) || 50;

// Log startup configuration.
console.log('Starting server with configuration:');
console.log(`Log path: ${ERROR_LOG_PATH}`);
console.log(`Port: ${PORT}`);
console.log(`Initial lines: ${MAX_INITIAL_LINES}`);

// Create HTTP server.
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

// Create WebSocket server attached to HTTP server.
const wss = new WebSocket.Server({ server });

// Function to read last N lines from file.
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

    // Send initial lines.
    const initialLines = getLastNLines(ERROR_LOG_PATH, MAX_INITIAL_LINES);
    ws.send(JSON.stringify(initialLines));

    // Create tail to track new lines.
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

// Start server.
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
