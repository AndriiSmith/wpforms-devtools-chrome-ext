// Track if panel is already created.
let panelCreated = false;

// Function to check for WPForms element.
function checkForWPFormsElement() {
	chrome.devtools.inspectedWindow.eval(
		'document.querySelector("meta[name=\'wpf-chrome-ext\'], #wp-admin-bar-wpf-utils, form.wpforms-form") !== null',
		(result, isException) => {
			if (!isException && result && !panelCreated) {
				// Element found, create panel if not already created.
				chrome.devtools.panels.create(
					"WPForms",
					null,
					"panel.html",
					(panel) => {
						console.log("WPForms panel created.");
						panelCreated = true;
					}
				);
			}
		}
	);
}

// Check on the initial load.
checkForWPFormsElement();

// Check on page reload.
chrome.devtools.network.onNavigated.addListener(() => {
	panelCreated = false; // Reset panel state on navigation
	checkForWPFormsElement();
});

// Periodically check for WPForms elements to handle dynamic loading.
const checkInterval = setInterval(checkForWPFormsElement, 2000);

// Cleanup interval when devtools is closed.
window.addEventListener('unload', () => {
	clearInterval(checkInterval);
});
