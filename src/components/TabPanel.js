import React, { useState, useEffect } from 'react';
import classNames from 'classnames';

const tabs = [
  { id: 'utils', label: 'Utils' },
  { id: 'logs', label: 'Logs' },
  { id: 'entries', label: 'Entries' }
];

export function TabPanel() {
  const [activeTab, setActiveTab] = useState('utils');
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    // Перевіряємо чи підтримується prefers-color-scheme
    if (window.matchMedia) {
      const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Початкова перевірка теми
      setIsDarkTheme(darkThemeQuery.matches);

      // Підписка на зміни теми
      const themeListener = (e) => setIsDarkTheme(e.matches);
      darkThemeQuery.addListener(themeListener);
      
      // Відписка при розмонтуванні
      return () => darkThemeQuery.removeListener(themeListener);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'utils':
        return <div className="tab-content">Utils Content</div>;
      case 'logs':
        return <div className="tab-content">Logs Content</div>;
      case 'entries':
        return <div className="tab-content">Entries Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className={classNames('tab-panel', { 'dark-theme': isDarkTheme })}>
      <div className="tab-panel__header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={classNames('tab-panel__tab', {
              'tab-panel__tab--active': activeTab === tab.id
            })}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel__content">
        {renderTabContent()}
      </div>
    </div>
  );
}
