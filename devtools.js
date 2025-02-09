// Функція для перевірки наявності елемента
function checkForWPFormsElement() {
  chrome.devtools.inspectedWindow.eval(
    'document.querySelector("#wp-admin-bar-wpf-utils") !== null',
    (result, isException) => {
      if (!isException && result) {
        // Елемент знайдено, створюємо панель
        chrome.devtools.panels.create(
          "WPForms",
          null,
          "panel.html",
          (panel) => {
            console.log("WPForms panel created");
          }
        );
      }
    }
  );
}

// Перевіряємо при першому завантаженні
checkForWPFormsElement();

// Перевіряємо при оновленні сторінки
chrome.devtools.network.onNavigated.addListener(() => {
  checkForWPFormsElement();
});
