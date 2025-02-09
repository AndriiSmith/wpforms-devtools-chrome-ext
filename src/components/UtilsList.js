import React, { useState, useEffect } from 'react';
import { MenuItem } from './MenuItem';

export function UtilsList() {
  const [utils, setUtils] = useState([]);

  useEffect(() => {
    // Рекурсивна функція для обробки елементів меню
    const processMenuItems = () => {
      const script = `
        function getMenuItems(element) {
          return Array.from(element.children).map(li => {
            const link = li.querySelector('a');
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

      chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
        if (!isException && Array.isArray(result)) {
          setUtils(result);
        }
      });
    };

    // Отримуємо дані при першому завантаженні
    processMenuItems();

    // Підписуємось на оновлення сторінки
    const navigationListener = () => {
      processMenuItems();
    };
    chrome.devtools.network.onNavigated.addListener(navigationListener);

    // Періодично оновлюємо статус чекбоксів
    const checkboxInterval = setInterval(processMenuItems, 1000);

    return () => {
      chrome.devtools.network.onNavigated.removeListener(navigationListener);
      clearInterval(checkboxInterval);
    };
  }, []);

  if (utils.length === 0) {
    return <div className="utils-list utils-list--empty">No utilities found</div>;
  }

  return (
    <div className="utils-list">
      <ul className="utils-list__items">
        {utils.map((item, index) => (
          <MenuItem key={item.id || index} item={item} />
        ))}
      </ul>
    </div>
  );
}
