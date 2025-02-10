import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import '../styles/index.scss';

export function LogsTable() {
  const [logsTable, setLogsTable] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (window.matchMedia) {
      const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkTheme(darkThemeQuery.matches);

      const themeListener = (e) => setIsDarkTheme(e.matches);
      darkThemeQuery.addListener(themeListener);
      
      return () => darkThemeQuery.removeListener(themeListener);
    }
  }, []);

  useEffect(() => {
    const fetchLogs = () => {
      const processResponse = (content) => {
        console.log('Processing response...');
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const table = doc.querySelector('.wp-list-table');
        
        if (table) {
          console.log('Table found, setting content...');
          setLogsTable(table.outerHTML);
        } else {
          console.log('Table not found in response');
          setLogsTable('');
        }
      };

      const script = `
        (function() {
          const domain = window.location.hostname;
          return \`https://\${domain}/wp-admin/admin.php?page=wpforms-tools&view=logs\`;
        })();
      `;

      chrome.devtools.inspectedWindow.eval(script, (logsUrl, isException) => {
        if (!isException && logsUrl) {
          console.log('Logs URL:', logsUrl);
          
          const xhr = new XMLHttpRequest();
          xhr.open('GET', logsUrl, true);
          
          xhr.onload = function() {
            if (xhr.status === 200) {
              console.log('Got response, length:', xhr.responseText.length);
              processResponse(xhr.responseText);
            } else {
              console.error('Failed to fetch logs:', xhr.status);
              setLogsTable('');
            }
          };
          
          xhr.onerror = function() {
            console.error('Error fetching logs');
            setLogsTable('');
          };
          
          xhr.send();
        } else {
          console.error('Failed to get logs URL:', isException);
          setLogsTable('');
        }
      });
    };

    fetchLogs();

    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!logsTable || logsTable.length === 0) {
    return (
      <div className={classNames('logs-table logs-table--empty', { 'dark-theme': isDarkTheme })}>
        Loading logs...
      </div>
    );
  }

  return (
    <div className={classNames('logs-table', { 'dark-theme': isDarkTheme })}>
      <div dangerouslySetInnerHTML={{ __html: logsTable }} />
    </div>
  );
}
