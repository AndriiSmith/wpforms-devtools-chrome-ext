import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { UtilsList } from './UtilsList';
import { LogsTable } from './LogsTable';
import { ErrorLog } from './ErrorLog';

const tabs = [
	{ id: 'utils', label: 'Utils' },
	{ id: 'logs', label: 'Logs' },
	//{ id: 'entries', label: 'Entries' },
	{ id: 'errorLogs', label: 'Error log' }
];

export function TabPanel() {
	const [activeTab, setActiveTab] = useState('utils');
	const [isDarkTheme, setIsDarkTheme] = useState(false);

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

	const renderTabContent = () => {
		switch (activeTab) {
			case 'utils':
				return <UtilsList />;
			case 'logs':
				return <LogsTable />;
			case 'errorLogs':
				return <ErrorLog isActive={activeTab === 'errorLogs'} />;
			// case 'entries':
			// 		return <div className="tab-content">Entries Content.</div>;
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
