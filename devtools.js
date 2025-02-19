// Function to check for WPForms element.
function checkForWPFormsElement() {
	chrome.devtools.inspectedWindow.eval(
		'document.querySelector("meta[name=\'wpf-chrome-ext\'], #wp-admin-bar-wpf-utils") !== null',
		(result, isException) => {
			if (!isException && result) {
				// Element found, create panel.
				chrome.devtools.panels.create(
					"WPForms",
					null,
					"panel.html",
					() => {
						console.log("WPForms panel created.");
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
	checkForWPFormsElement();
});
