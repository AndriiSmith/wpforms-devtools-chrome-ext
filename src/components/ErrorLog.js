import React, { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import '../styles/ErrorLog.scss';

// WebSocket server port.
const WS_PORT = 8077;

export function ErrorLog( { isActive } ) {
	const [ logLines, setLogLines ] = useState( [] );
	const [ isConnected, setIsConnected ] = useState( false );
	const contentRef = useRef( null );
	const ws = useRef( null );
	const checkInterval = useRef( null );
	const scrollTimeout = useRef( null );

	// Scroll to the bottom of the log content with a delay to ensure content is rendered.
	const scrollToBottom = useCallback(() => {
		// Clear any existing scroll timeout.
		if ( scrollTimeout.current ) {
			clearTimeout( scrollTimeout.current );
		}

		// Set new timeout to scroll after content is rendered.
		scrollTimeout.current = setTimeout( () => {
			if ( contentRef.current ) {
				contentRef.current.scrollTop = contentRef.current.scrollHeight;
			}
		}, 100 );
	}, []);

	// Establish WebSocket connection and set up event handlers.
	const connectWebSocket = useCallback(() => {
		if ( ws.current?.readyState === WebSocket.OPEN ) return;

		ws.current = new WebSocket( `ws://localhost:${WS_PORT}` );

		// Handle successful connection.
		ws.current.onopen = () => {
			setIsConnected( true );
			if ( checkInterval.current ) {
				clearInterval( checkInterval.current );
				checkInterval.current = null;
			}
		};

		// Handle connection loss and start checking for server availability.
		ws.current.onclose = () => {
			setIsConnected( false );
			if ( !checkInterval.current ) {
				checkInterval.current = setInterval( checkServer, 2000 );
			}
		};

		// Handle incoming log messages.
		ws.current.onmessage = ( event ) => {
			const newLines = JSON.parse( event.data );
			setLogLines( ( prevLines ) => [ ...prevLines, ...newLines ] );

			if ( isActive ) {
				scrollToBottom();
			}
		};
	}, [checkServer, isActive, scrollToBottom]);

	// Check if the WebSocket server is running by making a health check request.
	const checkServer = useCallback(async () => {
		try {
			const response = await fetch( `http://localhost:${WS_PORT}/health` );
			if ( response.ok ) {
				connectWebSocket();
			}
		} catch ( error ) {
			setIsConnected( false );
		}
	}, [connectWebSocket]);

	// Scroll to bottom when tab becomes active and there are log lines.
	useEffect(() => {
		if (isActive && logLines.length > 0) {
			scrollToBottom();
		}
	}, [isActive, logLines, scrollToBottom]);

	// Initialize server check and cleanup on unmount.
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
			if (scrollTimeout.current) {
				clearTimeout(scrollTimeout.current);
			}
		};
	}, [checkServer]);

	// Show instructions if not connected to the server.
	if ( !isConnected ) {
		return (
			<div className="error-log__content">
				<div className="server-instructions">
					<p>To view error log, run the following command in terminal:</p>
					<pre className="command-line">
						cd c:/www/DevTools.ext && node src/server/logWatcher.js
					</pre>
				</div>
			</div>
		);
	}

	// Render log content.
	return (
		<div className="error-log__content" ref={contentRef}>
			{logLines.map( ( line, index ) => (
				<pre
					key={index}
					className={classNames( 'log-line', {
						'new-line': index >= logLines.length - 1,
					} )}
				>
					{line}
				</pre>
			) )}
		</div>
	);
}
