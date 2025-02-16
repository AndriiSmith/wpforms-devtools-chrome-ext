import React, { useState } from 'react';

export function FormPanel({ formId }) {
	const [activeMenuItem, setActiveMenuItem] = useState('form_data');

	if (!formId) {
		return null;
	}

	const menuItems = [
		{ id: 'form_data', label: 'Form Data' },
        //{ id: 'test', label: 'Test' },
	];

	return (
		<div className="form-panel">
			<div className="sidebar">
				<ul className="menu">
					{menuItems.map(item => (
						<li 
							key={item.id}
							className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
							onClick={() => setActiveMenuItem(item.id)}
						>
							{item.label}
						</li>
					))}
				</ul>
			</div>
			<div className="content">
				{/* Content will be rendered here based on activeMenuItem */}
			</div>
		</div>
	);
}
