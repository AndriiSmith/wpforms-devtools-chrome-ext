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
      setTimeout(processMenuItems, 500); // Даємо час на завантаження DOM
    };

    // Підписуємось на події навігації та оновлення
    chrome.devtools.network.onNavigated.addListener(navigationListener);

    // Підписуємось на події ресурсів (включаючи перезавантаження)
    const resourceListener = (resource) => {
      if (resource.type === 'document' && resource.url === chrome.devtools.inspectedWindow.tabId) {
        setTimeout(processMenuItems, 500);
      }
    };
    chrome.devtools.network.onRequestFinished.addListener(resourceListener);

    // Додаємо обробник для події DOMContentLoaded
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
    
    chrome.devtools.inspectedWindow.eval(domLoadedScript);

    const messageListener = (event) => {
      if (event.data.type === 'WPF_UTILS_UPDATED') {
        processMenuItems();
      }
    };
    window.addEventListener('message', messageListener);

    return () => {
      chrome.devtools.network.onNavigated.removeListener(navigationListener);
      chrome.devtools.network.onRequestFinished.removeListener(resourceListener);
      window.removeEventListener('message', messageListener);
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
