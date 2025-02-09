// Функція для встановлення теми
const updateTheme = () => {
  try {
    // Перевіряємо чи підтримується prefers-color-scheme
    if (window.matchMedia) {
      const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const isDark = darkThemeQuery.matches;
      document.documentElement.classList.toggle('dark-theme', isDark);
      console.log('Dark theme applied:', isDark);

      // Підписуємось на зміни теми
      darkThemeQuery.addListener((e) => {
        document.documentElement.classList.toggle('dark-theme', e.matches);
        console.log('Theme changed, dark theme:', e.matches);
      });
    } else {
      console.log('matchMedia not supported');
    }
  } catch (error) {
    console.error('Error updating theme:', error);
  }
};

// Початкове встановлення теми
console.log('Initializing theme observer...');
updateTheme();
