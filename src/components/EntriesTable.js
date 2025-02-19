import React, { useState, useEffect, useRef } from 'react';
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

	// Fetch entries when component mounts.
	useEffect(() => {
		console.log('EntriesTable: Component mounted, setting up observers...');

		// Function to fetch entries table content.
		const fetchEntriesTable = async () => {
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
							// Extract entries table from the HTML response.
							const parser = new DOMParser();
							const doc = parser.parseFromString(html, 'text/html');
							const table = doc.querySelector('.wp-list-table');
							
							if (table) {
								// Remove specified elements.
								table.querySelectorAll('.check-column, .column-indicators, .column-primary .toggle-row').forEach(el => {
									el.remove();
								});

								// Add ID column header.
								const headerRow = table.querySelector('thead tr');
								const idHeader = doc.createElement('th');
								idHeader.textContent = 'ID';
								idHeader.className = 'column-id';
								headerRow.insertBefore(idHeader, headerRow.firstChild);

								// Add ID column cells.
								table.querySelectorAll('tbody tr').forEach(row => {
									const viewLink = row.querySelector('a.view');
									let entryId = '';

									if (viewLink) {
										const href = viewLink.getAttribute('href');
										const match = href.match(/[?&]entry_id=(\d+)/);
										if (match) {
											entryId = match[1];
										}
									}

									const idCell = doc.createElement('td');
									idCell.textContent = entryId;
									idCell.className = 'column-id';
									row.insertBefore(idCell, row.firstChild);
								});

								// Modify href attributes for spam and trash links.
								const script = `
									(function() {
										const domain = window.location.hostname;
										const protocol = window.location.protocol;
										return \`\${protocol}//\${domain}\`;
									})();
								`;

								chrome.devtools.inspectedWindow.eval(script, (baseUrl, isException) => {
									if (!isException && baseUrl) {
										table.querySelectorAll('a.mark-spam, a.trash').forEach(link => {
											const href = link.getAttribute('href');
											if (href && !href.startsWith('http')) {
												link.setAttribute('href', baseUrl + href);
											}
										});
										setEntriesTable(table.outerHTML);
									} else {
										console.error('Failed to get base URL:', isException);
										setEntriesTable('');
									}
								});
							} else {
								console.error('Entries table not found in response.');
								setEntriesTable('');
							}
						})
						.catch(error => {
							console.error('Error fetching entries:', error);
							setEntriesTable('');
						});
				} else {
					console.error('Failed to get entries URL:', isException);
					setEntriesTable('');
				}
			});
		};

		// Function to setup the confirmation container monitoring.
		const setupConfirmationMonitoring = () => {
			console.log('Setting up confirmation monitoring...');

			const script = `
				(function() {
					console.log('Setting up MutationObserver for confirmation container...');
					
					// Remove any existing observers.
					if (window._wpformsObserver) {
						console.log('Disconnecting existing observer...');
						window._wpformsObserver.disconnect();
					}
					
					const observer = new MutationObserver((mutations) => {
						console.log('MutationObserver: Detected DOM changes', mutations.length);
						
						for (const mutation of mutations) {
							console.log('Checking mutation:', {
								type: mutation.type,
								addedNodes: mutation.addedNodes.length
							});
							
							for (const node of mutation.addedNodes) {
								if (node.nodeType === 1) {
									console.log('Checking added node:', {
										tagName: node.tagName,
										classes: node.className,
										hasMatch: node.matches?.('.wpforms-confirmation-container-full'),
										hasChild: node.querySelector?.('.wpforms-confirmation-container-full')
									});
									
									if (node.matches?.('.wpforms-confirmation-container-full') ||
										node.querySelector?.('.wpforms-confirmation-container-full')
									) {
										console.log('Found confirmation container! Notifying extension...');
										document.body.setAttribute('data-wpforms-confirmation-shown', 'true');
										return;
									}
								}
							}
						}
					});

					observer.observe(document.body, {
						childList: true,
						subtree: true
					});
					
					// Store the observer reference for cleanup.
					window._wpformsObserver = observer;
					
					console.log('MutationObserver: Started observing document.body');
					return 'Observer setup complete';
				})();
			`;

			chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
				console.log('Script evaluation result:', { result, isException });
			});
		};

		// Initial setup.
		fetchEntriesTable();
		setupConfirmationMonitoring();

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
			`, (result, isException) => {
				console.log('Cleanup result:', { result, isException });
			});
		};
	}, [formId]);

	// Handle action links click events.
	const handleActionClick = (e) => {
		const link = e.target.closest('.column-actions a');
		if (link) {
			e.preventDefault();
			window.open(link.href, '_blank');
		}
	};

	// Handle table updates.
	useEffect(() => {
		if (tableRef.current && entriesTable) {
			tableRef.current.innerHTML = entriesTable;

			// Store the current table element
			const table = tableRef.current;
			
			if (isDarkTheme) {
				table.classList.add('wpforms-dark-mode');
			} else {
				table.classList.remove('wpforms-dark-mode');
			}

			// Add click handler for action links.
			table.addEventListener('click', handleActionClick);

			// Cleanup event listener on unmount.
			return () => {
				table?.removeEventListener('click', handleActionClick);
			};
		}
	}, [entriesTable, isDarkTheme]);

	return (
		<div className={classNames('wpforms-entries-table-wrapper', { 'dark-theme': isDarkTheme })}>
			<div ref={tableRef} className="wpforms-entries-table" />
		</div>
	);
}
