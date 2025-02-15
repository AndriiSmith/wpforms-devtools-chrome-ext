import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';

export function EntriesTable() {
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

	// Get form ID from various possible sources.
	const getFormId = () => {
		const script = `
			(function() {
				// Try to get form_id from URL parameters.
				const urlParams = new URLSearchParams(window.location.search);
				let formId = urlParams.get('form_id');

				if (formId) {
					return formId;
				}

				// Try to get from preview parameter.
				formId = urlParams.get('wpforms_form_preview');
				if (formId) {
					return formId;
				}

				// Try to get from hidden input field.
				const hiddenInput = document.querySelector('input[name="wpforms[id]"]');
				if (hiddenInput) {
					return hiddenInput.value;
				}

				return null;
			})();
		`;

		return new Promise((resolve) => {
			chrome.devtools.inspectedWindow.eval(script, (formId, isException) => {
				resolve(isException ? null : formId);
			});
		});
	};

	// Fetch entries table content.
	const fetchEntriesTable = async () => {
		const formId = await getFormId();
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
							
							setEntriesTable(table.outerHTML);
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

	// Fetch entries when component mounts.
	useEffect(() => {
		fetchEntriesTable();
	}, []);

	// Handle table updates.
	useEffect(() => {
		if (tableRef.current && entriesTable) {
			tableRef.current.innerHTML = entriesTable;

			// Add dark theme class if needed.
			if (isDarkTheme) {
				tableRef.current.classList.add('wpforms-dark-mode');
			} else {
				tableRef.current.classList.remove('wpforms-dark-mode');
			}
		}
	}, [entriesTable, isDarkTheme]);

	return (
		<div className={classNames('wpforms-entries-table-wrapper', { 'dark-theme': isDarkTheme })}>
			<div ref={tableRef} className="wpforms-entries-table" />
		</div>
	);
}
