// Function to check for WPForms element.
function checkForWPFormsElement() {
  chrome.devtools.inspectedWindow.eval(
    'document.querySelector("meta[name=\'wpf-chrome-ext\']") !== null',
    (result, isException) => {
      if (!isException && result) {
        // Element found, create panel.
        chrome.devtools.panels.create(
          "WPForms",
          null,
          "panel.html",
          (panel) => {
            console.log("WPForms panel created.");
          }
        );
      }
    }
  );
}

// Check on initial load.
checkForWPFormsElement();

// Check on page reload.
chrome.devtools.network.onNavigated.addListener(() => {
  checkForWPFormsElement();
});
