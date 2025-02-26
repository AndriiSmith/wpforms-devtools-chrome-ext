import React, {useState, useEffect, useRef, useCallback} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCopy} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import '../styles/ErrorLog.scss';

// WebSocket server port.
const WS_PORT = 8077;

/**
 * ErrorLog component for displaying PHP error logs in real-time.
 */
export function ErrorLog( {isActive, errorLogPath, extensionDirPath} ) {
	const [ logLines, setLogLines ] = useState( [] );
	const [ isConnected, setIsConnected ] = useState( false );
	const contentRef = useRef( null );
	const [ scrollToBottom, setScrollToBottom ] = useState( true );
	const [ copySuccess, setCopySuccess ] = useState( false );
	const ws = useRef( null );
	const checkInterval = useRef( null );
	const scrollTimeout = useRef( null );

	// Scroll to the bottom of the log content with a delay to ensure content is rendered.
	const scrollToBottomCallback = useCallback( () => {
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
	}, [] );

	// Listen for messages from the extension.
	useEffect( () => {
		const handleMessage = ( event ) => {
			if ( event.data.type === 'clearErrorLogs' ) {
				setLogLines( [] );
			}
		};

		window.addEventListener( 'message', handleMessage );
		return () => window.removeEventListener( 'message', handleMessage );
	}, [] );

	// Initialize WebSocket connection and set up event handlers.
	const initWebSocket = useCallback( () => {
		if ( ws.current?.readyState === WebSocket.OPEN ) {
			return;
		}

		ws.current = new WebSocket( `ws://localhost:${ WS_PORT }` );

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
			if ( ! checkInterval.current ) {
				checkInterval.current = setInterval( () => {
					fetch( `http://localhost:${ WS_PORT }/health` )
						.then( response => {
							if ( response.ok ) {
								initWebSocket();
							}
						} )
						.catch( () => {
							setIsConnected( false );
						} );
				}, 2000 );
			}
		};

		// Handle incoming log messages.
		ws.current.onmessage = ( event ) => {
			const newLines = JSON.parse( event.data );
			setLogLines( ( prevLines ) => [ ...prevLines, ...newLines ] );

			if ( isActive ) {
				scrollToBottomCallback();
			}
		};
	}, [ isActive, scrollToBottomCallback ] );

	// Initialize connection on mount.
	useEffect( () => {
		// Initial connection attempt.
		fetch( `http://localhost:${ WS_PORT }/health` )
			.then( response => {
				if ( response.ok ) {
					initWebSocket();
				}
			} )
			.catch( () => {
				setIsConnected( false );
				if ( ! checkInterval.current ) {
					checkInterval.current = setInterval( () => {
						fetch( `http://localhost:${ WS_PORT }/health` )
							.then( response => {
								if ( response.ok ) {
									initWebSocket();
								}
							} )
							.catch( () => {
								setIsConnected( false );
							} );
					}, 2000 );
				}
			} );

		// Cleanup on unmount.
		return () => {
			if ( checkInterval.current ) {
				clearInterval( checkInterval.current );
			}
			if ( ws.current ) {
				ws.current.close();
			}
			if ( scrollTimeout.current ) {
				clearTimeout( scrollTimeout.current );
			}
		};
	}, [ initWebSocket ] );

	// Scroll to bottom when tab becomes active and there are log lines.
	useEffect( () => {
		if ( isActive && logLines.length > 0 ) {
			scrollToBottomCallback();
		}
	}, [ isActive, logLines, scrollToBottomCallback ] );

	const getStartCommand = () => {
		return `cd ${ extensionDirPath || '/path/to/extension' } && node server/logWatcher.js --log ${ errorLogPath || '/path/to/php_errors.log' }`;
	};

	const handleCopyCommand = async () => {
		try {
			// Create a temporary textarea element
			const textArea = document.createElement( 'textarea' );
			textArea.value = getStartCommand();
			document.body.appendChild( textArea );

			// Select and copy the text
			textArea.select();
			document.execCommand( 'copy' );

			// Clean up
			document.body.removeChild( textArea );

			// Show success state briefly
			setCopySuccess( true );
			setTimeout( () => setCopySuccess( false ), 2000 );
		} catch ( err ) {
			console.error( 'Failed to copy text: ', err );
		}
	};

	// Show instructions if not connected to the server.
	if ( ! isConnected ) {
		return (
			<div className="error-log__content">
				<div className="server-instructions">
					<p>To view error log, run the following command in terminal:</p>
					<div className="command-line-wrapper">
						<pre className="command-line">{ getStartCommand() }</pre>
						<button
							className={ classNames( 'copy-button', {'copy-success': copySuccess} ) }
							onClick={ handleCopyCommand }
							title={ copySuccess ? 'Copied!' : 'Copy to clipboard' }
						>
							<FontAwesomeIcon icon={ faCopy }/>
						</button>
					</div>
				</div>
			</div>
		);
	}

	// Render log content.
	return (
		<div className="error-log__content" ref={ contentRef }>
			{ logLines.map( ( line, index ) => (
				<pre
					key={ index }
					className={ classNames( 'log-line', {
						'new-line': index >= logLines.length - 1,
					} ) }
				>
					{ line }
				</pre>
			) ) }
		</div>
	);
}
