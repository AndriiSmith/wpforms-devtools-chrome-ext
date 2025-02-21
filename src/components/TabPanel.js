import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faCog, faTimes } from '@fortawesome/free-solid-svg-icons';
import { UtilsList } from './UtilsList';
import { LogsTable } from './LogsTable';
import { ErrorLog } from './ErrorLog';
import { EntriesTable } from './EntriesTable';
import { FormPanel } from './FormPanel';
import { Settings } from './Settings';

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
	const [showSettings, setShowSettings] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [errorLogPath, setErrorLogPath] = useState('');
	const [extensionDirPath, setExtensionDirPath] = useState('');

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
				const hiddenInput = document.querySelector('input[name="wpforms[id]"], input[name="form_id"]');
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

	// Load settings from storage.
	useEffect(() => {
		chrome.storage.local.get(['errorLogPath', 'extensionDirPath'], (result) => {
			if (result.errorLogPath) {
				setErrorLogPath(result.errorLogPath);
			}
			if (result.extensionDirPath) {
				setExtensionDirPath(result.extensionDirPath);
			}
		});
	}, []);

	const handleErrorLogPathChange = (e) => {
		setErrorLogPath(e.target.value);
		// Save to storage.
		chrome.storage.local.set({ errorLogPath: e.target.value });
	};

	const handleExtensionDirPathChange = (e) => {
		setExtensionDirPath(e.target.value);
		// Save to storage.
		chrome.storage.local.set({ extensionDirPath: e.target.value });
	};

	/**
	 * Renders the content for the active tab.
	 * Form-specific tabs are only rendered when formId is available.
	 */
	const renderTabContent = () => {
		switch (activeTab) {
			case 'utils':
				return <UtilsList key={reloadKey} />;
			case 'logs':
				return <LogsTable key={reloadKey} />;
			case 'errorLogs':
				return <ErrorLog 
					key={reloadKey} 
					isActive={activeTab === 'errorLogs'} 
					errorLogPath={errorLogPath}
					extensionDirPath={extensionDirPath}
				/>;
			case 'entries':
				return formId ? <EntriesTable key={reloadKey} formId={formId} /> : null;
			case 'form':
				return formId ? <FormPanel key={reloadKey} formId={formId} /> : null;
			default:
				return null;
		}
	};

	const tabs = getTabs(formId);

	return (
		<div className={classNames('tab-panel', { 'dark-theme': isDarkTheme })}>
			<div className="tab-panel__header">
				<div className="tab-panel__toolbar tab-panel__toolbar--tabs">
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
				<div className="tab-panel__toolbar tab-panel__toolbar--actions">
					<button 
						className="tab-panel__icon-button" 
						title="Reload"
						onClick={() => setReloadKey(prev => prev + 1)}
					>
						<FontAwesomeIcon icon={faSync} />
					</button>
				</div>
				<div className="tab-panel__toolbar tab-panel__toolbar--settings">
					<button 
						className="tab-panel__icon-button"
						onClick={() => setShowSettings(true)}
						title="Settings"
					>
						<FontAwesomeIcon icon={faCog} />
					</button>
				</div>
			</div>
			<div className="tab-panel__content">
				{renderTabContent()}
				{showSettings && (
					<Settings
						onClose={() => setShowSettings(false)}
						errorLogPath={errorLogPath}
						onErrorLogPathChange={handleErrorLogPathChange}
						extensionDirPath={extensionDirPath}
						onExtensionDirPathChange={handleExtensionDirPathChange}
					/>
				)}
			</div>
		</div>
	);
}
