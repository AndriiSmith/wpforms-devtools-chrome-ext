/******/ (() => { // webpackBootstrap
// Function to update theme.
const updateTheme = () => {
  try {
    // Check if prefers-color-scheme is supported.
    if (window.matchMedia) {
      const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const isDark = darkThemeQuery.matches;
      document.documentElement.classList.toggle('dark-theme', isDark);
      console.log('Dark theme applied:', isDark);

      // Subscribe to theme changes.
      darkThemeQuery.addListener(e => {
        document.documentElement.classList.toggle('dark-theme', e.matches);
        console.log('Theme changed, dark theme:', e.matches);
      });
    } else {
      console.log('matchMedia not supported.');
    }
  } catch (error) {
    console.error('Error updating theme:', error);
  }
};

// Initial theme setup.
console.log('Initializing theme observer...');
updateTheme();
/******/ })()
;
//# sourceMappingURL=themeObserver.js.map