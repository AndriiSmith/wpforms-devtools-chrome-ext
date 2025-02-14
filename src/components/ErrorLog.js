import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import '../styles/ErrorLog.scss';

const ERROR_LOG_PATH = 'C:\\bin\\laragon\\tmp\\php_errors.log';
const MAX_LINES = 20;
const WS_PORT = 8077;

export function ErrorLog() {
    const [logLines, setLogLines] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const contentRef = useRef(null);
    const ws = useRef(null);
    const checkInterval = useRef(null);

    const checkServer = async () => {
        try {
            const response = await fetch(`http://localhost:${WS_PORT}/health`);
            if (response.ok) {
                connectWebSocket();
            }
        } catch (error) {
            setIsConnected(false);
        }
    };

    const connectWebSocket = () => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        ws.current = new WebSocket(`ws://localhost:${WS_PORT}`);

        ws.current.onopen = () => {
            setIsConnected(true);
            if (checkInterval.current) {
                clearInterval(checkInterval.current);
                checkInterval.current = null;
            }
        };

        ws.current.onclose = () => {
            setIsConnected(false);
            if (!checkInterval.current) {
                checkInterval.current = setInterval(checkServer, 2000);
            }
        };

        ws.current.onmessage = (event) => {
            const newLines = JSON.parse(event.data);
            setLogLines(prevLines => {
                const updatedLines = [...prevLines, ...newLines];
                return updatedLines.slice(-MAX_LINES);
            });

            if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }
        };
    };

    useEffect(() => {
        checkServer();
        checkInterval.current = setInterval(checkServer, 2000);

        return () => {
            if (checkInterval.current) {
                clearInterval(checkInterval.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    if (!isConnected) {
        return (
            <div className="error-log__content">
                <div className="server-instructions">
                    <p>To view error log, run the following command in terminal:</p>
                    <pre className="command-line">
                        cd [path to extension dir] && node src/server/logWatcher.js
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <div className="error-log__content" ref={contentRef}>
            {logLines.map((line, index) => (
                <pre 
                    key={index} 
                    className={classNames('log-line', {
                        'new-line': index >= logLines.length - 1
                    })}
                >
                    {line}
                </pre>
            ))}
        </div>
    );
}
