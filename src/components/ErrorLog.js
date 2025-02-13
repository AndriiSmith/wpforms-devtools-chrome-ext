import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import '../styles/ErrorLog.scss';

const ERROR_LOG_PATH = 'C:\\bin\\laragon\\tmp\\php_errors.log';
const MAX_LINES = 20;

export function ErrorLog() {
    const [logLines, setLogLines] = useState([]);
    const contentRef = useRef(null);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:8077');

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

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

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
