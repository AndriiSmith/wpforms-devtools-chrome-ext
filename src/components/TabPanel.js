import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { UtilsList } from './UtilsList';
import { LogsTable } from './LogsTable';
import { ErrorLog } from './ErrorLog';
import { EntriesTable } from './EntriesTable';
import { FormPanel } from './FormPanel';

/**
 * Generates the list of available tabs based on form ID presence.
 * Base tabs are always shown, while form-specific tabs appear only when formId exists.
 */
const getTabs = (formId) => {
	// Base tabs that are always available.
	const baseTabs = [
		{ id: 'utils', label: 'Utils' },
		{ id: 'logs', label: 'Logs' },
		{ id: 'errorLogs', label: 'Error log' },
	];

	if (formId) {
		return [
			...baseTabs,
			{ id: 'form', label: `Form #${formId}` },
			{ id: 'entries', label: 'Entries' },
		];
	}

	return baseTabs;
};

/**
 * Main tab panel component that manages the display of different sections.
 * Handles theme changes, form ID detection, and tab switching.
 */
export function TabPanel() {
	const [activeTab, setActiveTab] = useState('utils');
	const [isDarkTheme, setIsDarkTheme] = useState(false);
	const [formId, setFormId] = useState(null);

	// Track theme changes.
	useEffect(() => {
		if (window.matchMedia) {
			const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
			setIsDarkTheme(darkThemeQuery.matches);

			const themeListener = (e) => setIsDarkTheme(e.matches);
			darkThemeQuery.addListener(themeListener);
			
			// Cleanup theme listener on unmount.
			return () => darkThemeQuery.removeListener(themeListener);
		}
	}, []);

	/**
	 * Detects form ID from various sources in the inspected window.
	 * Checks URL parameters and hidden input fields.
	 */
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
				if (isException) {
					console.error('Error detecting form ID:', isException);
					resolve(null);
					return;
				}
				resolve(formId);
			});
		});
	};

	// Check for form ID changes every second.
	useEffect(() => {
		let mounted = true;

		const checkFormId = async () => {
			if (!mounted) return;
			
			const newFormId = await getFormId();
			if (mounted && newFormId !== formId) {
				setFormId(newFormId);
			}
		};

		checkFormId();
		const intervalId = setInterval(checkFormId, 1000);

		return () => {
			mounted = false;
			clearInterval(intervalId);
		};
	}, [formId]);

	// Switch to utils tab when form ID becomes unavailable.
	useEffect(() => {
		if (!formId && (activeTab === 'entries' || activeTab === 'form')) {
			setActiveTab('utils');
		}
	}, [formId, activeTab]);

	/**
	 * Renders the content for the active tab.
	 * Form-specific tabs are only rendered when formId is available.
	 */
	const renderTabContent = () => {
		switch (activeTab) {
			case 'utils':
				return <UtilsList />;
			case 'logs':
				return <LogsTable />;
			case 'errorLogs':
				return <ErrorLog isActive={activeTab === 'errorLogs'} />;
			case 'entries':
				return formId ? <EntriesTable formId={formId} /> : null;
			case 'form':
				return formId ? <FormPanel formId={formId} /> : null;
			default:
				return null;
		}
	};

	const tabs = getTabs(formId);

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
