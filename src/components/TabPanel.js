import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { UtilsList } from './UtilsList';
import { LogsTable } from './LogsTable';
import { ErrorLog } from './ErrorLog';
import { EntriesTable } from './EntriesTable';

const tabs = [
	{ id: 'utils', label: 'Utils' },
	{ id: 'logs', label: 'Logs' },
	{ id: 'errorLogs', label: 'Error log' },
	{ id: 'entries', label: 'Entries' },
];

export function TabPanel() {
	const [activeTab, setActiveTab] = useState('utils');
	const [isDarkTheme, setIsDarkTheme] = useState(false);
	const [formId, setFormId] = useState(null);

	useEffect(() => {
		// Check if prefers-color-scheme is supported.
		if (window.matchMedia) {
			const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
			
			// Initial theme check.
			setIsDarkTheme(darkThemeQuery.matches);

			// Subscribe to theme changes.
			const themeListener = (e) => setIsDarkTheme(e.matches);
			darkThemeQuery.addListener(themeListener);
			
			// Cleanup on unmount.
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
				resolve(formId);
			});
		});
	};

	useEffect(() => {
		if (activeTab === 'entries') {
			getFormId().then(id => setFormId(id));
		}
	}, [activeTab]);

	const renderTabContent = () => {
		switch (activeTab) {
			case 'utils':
				return <UtilsList />;
			case 'logs':
				return <LogsTable />;
			case 'errorLogs':
				return <ErrorLog isActive={activeTab === 'errorLogs'} />;
			case 'entries':
				return <EntriesTable formId={formId} />;
			default:
				return null;
		}
	};

	return (
		<div className={classNames('tab-panel', { 'dark-theme': isDarkTheme })}>
			<div className="tab-panel__header">
				{tabs.map(tab => (
					<button
						key={tab.id}
						className={classNames('tab-panel__tab', {
							'tab-panel__tab--active': activeTab === tab.id
						})}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="tab-panel__content">
				{renderTabContent()}
			</div>
		</div>
	);
}
