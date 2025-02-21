import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * Settings popup component for configuring application settings.
 */
export function Settings({ 
	onClose, 
	errorLogPath, 
	onErrorLogPathChange,
	extensionDirPath,
	onExtensionDirPathChange
}) {
	return (
		<div className="tab-panel__settings-overlay">
			<div className="tab-panel__settings-popup">
				<div className="tab-panel__settings-header">
					<h2>Settings</h2>
					<button 
						className="tab-panel__icon-button"
						onClick={onClose}
						title="Close"
					>
						<FontAwesomeIcon icon={faTimes} />
					</button>
				</div>
				<div className="tab-panel__settings-content">
					<div className="tab-panel__setting-item">
						<label htmlFor="extensionDirPath">Extension Directory Path:</label>
						<input
							type="text"
							id="extensionDirPath"
							className="tab-panel__text-input"
							value={extensionDirPath}
							onChange={onExtensionDirPathChange}
							placeholder="Enter path to extension directory"
						/>
					</div>
                    <div className="tab-panel__setting-item">
						<label htmlFor="errorLogPath">Error Log File Path:</label>
						<input
							type="text"
							id="errorLogPath"
							className="tab-panel__text-input"
							value={errorLogPath}
							onChange={onErrorLogPathChange}
							placeholder="Enter path to error log file"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
