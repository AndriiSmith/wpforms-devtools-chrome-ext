import React, { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';

export function EntriesTable({ formId }) {
	const [entriesTable, setEntriesTable] = useState('');
	const [isDarkTheme, setIsDarkTheme] = useState(false);
	const tableRef = useRef(null);

	// Track theme changes.
	useEffect(() => {
		if (window.matchMedia) {
			const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
			setIsDarkTheme(darkThemeQuery.matches);

			const themeListener = (e) => setIsDarkTheme(e.matches);
			darkThemeQuery.addListener(themeListener);
			
			return () => darkThemeQuery.removeListener(themeListener);
		}
	}, []);

	// Fetch entries table content.
	const fetchEntriesTable = useCallback(async () => {
		if (!formId) {
			console.error('Form ID not found.');
			return;
		}

		const script = `
			(function() {
				const domain = window.location.hostname;
				const protocol = window.location.protocol;
				const url = new URL(\`\${protocol}//\${domain}/wp-admin/admin.php\`);
				
				url.searchParams.append('page', 'wpforms-entries');
				url.searchParams.append('view', 'list');
				url.searchParams.append('form_id', '${formId}');
				
				return url.toString();
			})();
		`;

		chrome.devtools.inspectedWindow.eval(script, (url, isException) => {
			if (!isException && url) {
				console.log('Entries URL:', url);
				
				fetch(url)
					.then(response => {
						if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}`);
						}
						return response.text();
					})
					.then(html => {
						const parser = new DOMParser();
						const doc = parser.parseFromString(html, 'text/html');
						const table = doc.querySelector('.wpforms-table-list');
						
						if (table) {
							setEntriesTable(table.outerHTML);
						} else {
							console.error('Entries table not found in the response.');
						}
					})
					.catch(error => {
						console.error('Error fetching entries:', error);
					});
			}
		});
	}, [formId]);

	// Setup confirmation monitoring.
	const setupConfirmationMonitoring = useCallback(() => {
		console.log('Setting up confirmation monitoring...');

		// Setup polling for the confirmation flag.
		const checkConfirmationInterval = setInterval(() => {
			chrome.devtools.inspectedWindow.eval(`
				document.body.hasAttribute('data-wpforms-confirmation-shown')
			`, (hasConfirmation) => {
				if (hasConfirmation) {
					console.log('Confirmation detected, refreshing entries table.');
					fetchEntriesTable();
					
					// Remove the flag.
					chrome.devtools.inspectedWindow.eval(`
						document.body.removeAttribute('data-wpforms-confirmation-shown');
					`);
				}
			});
		}, 1000);

		// Setup navigation monitoring.
		const handleNavigated = () => {
			console.log('Page navigation detected, restarting monitoring...');
			setTimeout(() => {
				setupConfirmationMonitoring();
			}, 1000); // Wait for the new page to load.
		};

		chrome.devtools.network.onNavigated.addListener(handleNavigated);

		// Cleanup.
		return () => {
			console.log('EntriesTable: Component unmounting, cleaning up...');
			clearInterval(checkConfirmationInterval);
			chrome.devtools.network.onNavigated.removeListener(handleNavigated);
			
			chrome.devtools.inspectedWindow.eval(`
				(function() {
					console.log('Cleaning up observers...');
					if (window._wpformsObserver) {
						window._wpformsObserver.disconnect();
						window._wpformsObserver = null;
					}
					document.body.removeAttribute('data-wpforms-confirmation-shown');
					return 'Observers disconnected';
				})();
			`, (result) => {
				console.log('Cleanup result:', { result });
			});
		};
	}, [fetchEntriesTable]);

	// Handle action links click events.
	const handleActionClick = useCallback((e) => {
		const link = e.target.closest('.column-actions a');
		if (link) {
			e.preventDefault();
			window.open(link.href, '_blank');
		}
	}, []);

	// Handle table updates.
	useEffect(() => {
		if (!tableRef.current || !entriesTable) {
			return;
		}

		const currentTable = tableRef.current;
		currentTable.innerHTML = entriesTable;

		// Add dark theme class if needed.
		if (isDarkTheme) {
			currentTable.classList.add('wpforms-dark-mode');
		} else {
			currentTable.classList.remove('wpforms-dark-mode');
		}

		// Add click handler for action links.
		currentTable.addEventListener('click', handleActionClick);

		// Cleanup event listener on unmount.
		return () => {
			currentTable?.removeEventListener('click', handleActionClick);
		};
	}, [entriesTable, isDarkTheme, handleActionClick]);

	// Setup confirmation monitoring and fetch entries.
	useEffect(() => {
		setupConfirmationMonitoring();
		fetchEntriesTable();
	}, [setupConfirmationMonitoring, fetchEntriesTable]);

	return (
		<div className={classNames('wpforms-entries-table-wrapper', { 'dark-theme': isDarkTheme })}>
			<div ref={tableRef} className="wpforms-entries-table"></div>
		</div>
	);
}
