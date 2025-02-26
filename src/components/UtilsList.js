import React, {useState, useEffect} from 'react';
import {MenuItem} from './MenuItem';

export function UtilsList() {
	const [ utils, setUtils ] = useState( [] );

	useEffect( () => {
		// Recursive function to process menu items.
		const processMenuItems = () => {
			const script = `
				function getMenuItems(element) {
					return Array.from(element.children).map(li => {
						const link = li.querySelector('.ab-empty-item, .ab-item');
						const checkbox = li.querySelector('input[type="checkbox"]');
						const submenu = li.querySelector('.ab-submenu');
						const item = {
							id: li.id,
							text: link ? link.textContent.trim() : li.textContent.trim(),
							href: link ? link.href : '',
							checked: checkbox ? checkbox.checked : null
						};
						
						if (submenu) {
							item.children = getMenuItems(submenu);
						}
						
						return item;
					});
				}
				
				getMenuItems(document.querySelector('#wp-admin-bar-wpf-utils-default'));
			`;

			chrome.devtools.inspectedWindow.eval( script, ( result, isException ) => {
				if ( ! isException && Array.isArray( result ) ) {
					setUtils( result );
				}
			} );
		};

		// Get data on initial load.
		processMenuItems();

		// Subscribe to page updates.
		const navigationListener = () => {
			setTimeout( processMenuItems, 500 ); // Give time for DOM to load.
		};

		// Subscribe to navigation and update events.
		chrome.devtools.network.onNavigated.addListener( navigationListener );

		// Subscribe to resource events (including reloads).
		const resourceListener = ( resource ) => {
			if ( resource.type === 'document' && resource.url === chrome.devtools.inspectedWindow.tabId ) {
				setTimeout( processMenuItems, 500 );
			}
		};
		chrome.devtools.network.onRequestFinished.addListener( resourceListener );

		// Add handler for DOMContentLoaded event.
		const domLoadedScript = `
			const observer = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					if (mutation.target.id === 'wp-admin-bar-wpf-utils-default') {
						window.postMessage({ type: 'WPF_UTILS_UPDATED' }, '*');
					}
				}
			});
			
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
		`;

		chrome.devtools.inspectedWindow.eval( domLoadedScript );

		const messageListener = ( event ) => {
			if ( event.data.type === 'WPF_UTILS_UPDATED' ) {
				processMenuItems();
			}
		};
		window.addEventListener( 'message', messageListener );

		return () => {
			chrome.devtools.network.onNavigated.removeListener( navigationListener );
			chrome.devtools.network.onRequestFinished.removeListener( resourceListener );
			window.removeEventListener( 'message', messageListener );
		};
	}, [] );

	// Render loading state if no utils.
	if ( utils.length === 0 ) {
		return <div className="utils-list utils-list--empty">No utilities found.</div>;
	}

	console.log( 'Utils:', utils );

	return (
		<div className="utils-list">
			<ul className="utils-list__items">
				{ utils.map( ( item, index ) => (
					<MenuItem key={ item.id || index } item={ item }/>
				) ) }
			</ul>
		</div>
	);
}
