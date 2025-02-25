/**
 * Gets the data object from the wpf-chrome-ext meta tag on the inspected page.
 * @returns {Promise<Object|null>} Parsed data object or null if meta tag not found.
 */
export const getWPFormsMetaData = () => {
	console.log('[WPF Debug] Getting meta data from page...');
	return new Promise((resolve) => {
		// Using chrome.devtools.inspectedWindow to execute script in page context.
		chrome.devtools.inspectedWindow.eval(
			`(function() {
				const meta = document.querySelector('meta[name="wpf-chrome-ext"]');
				const json = meta.getAttribute('content');
				return meta ? JSON.parse(json) : null;
			})()`,
			(result, isException) => {
				if (isException) {
					console.error('[WPF Debug] Failed to get WPForms meta data:', isException);
					resolve(null);
					return;
				}
				console.log('[WPF Debug] Meta data retrieved:', result);
				resolve(result);
			}
		);
	});
};
