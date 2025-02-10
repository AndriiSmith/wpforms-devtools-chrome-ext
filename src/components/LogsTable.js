import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import '../styles/index.scss';

export function LogsTable() {
  const [logsTable, setLogsTable] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [wpformsAdmin, setWpformsAdmin] = useState(null);

  // Ефект для відстеження теми
  useEffect(() => {
    if (window.matchMedia) {
      const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkTheme(darkThemeQuery.matches);

      const themeListener = (e) => setIsDarkTheme(e.matches);
      darkThemeQuery.addListener(themeListener);
      
      return () => darkThemeQuery.removeListener(themeListener);
    }
  }, []);

  // Ефект для завантаження логів
  useEffect(() => {
    let intervalId;

    const getLogDetails = (logId, nonce) => {
      const script = `
        (function() {
          const domain = window.location.hostname;
          const url = new URL(\`https://\${domain}/wp-admin/admin-ajax.php\`);
          url.searchParams.append('action', 'wpforms_get_log_record');
          url.searchParams.append('nonce', '${nonce}');
          url.searchParams.append('recordId', '${logId}');
          
          fetch(url.toString())
            .then(response => response.json())
            .then(data => {
              console.log('Log details:', data);
            })
            .catch(error => console.error('Error fetching log details:', error));
        })();
      `;

      chrome.devtools.inspectedWindow.eval(script);
    };

    const processResponse = (content) => {
      console.log('Processing response...');
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Отримуємо дані з wpforms_admin
      const wpformsScript = doc.querySelector('script#wpforms-admin-js-extra');
      let nonce = null;
      
      if (wpformsScript) {
        try {
          const scriptContent = wpformsScript.textContent;
          const match = scriptContent.match(/var\s+wpforms_admin\s*=\s*({.*?});/s);
          if (match) {
            const adminData = JSON.parse(match[1]);
            setWpformsAdmin(adminData);
            nonce = adminData.nonce;
            console.log('WPForms Admin data:', adminData);
          }
        } catch (error) {
          console.error('Error parsing wpforms_admin:', error);
        }
      }

      const table = doc.querySelector('.wp-list-table');
      
      if (table) {
        // Додаємо обробники кліків на всі логи
        const logLinks = table.querySelectorAll('.js-single-log-target');
        logLinks.forEach(link => {
          const logId = link.getAttribute('data-log-id');
          if (logId && nonce) {
            link.onclick = (e) => {
              e.preventDefault();
              getLogDetails(logId, nonce);
            };
          }
        });

        console.log('Table found, setting content...');
        setLogsTable(table.outerHTML);
      } else {
        console.log('Table not found in response');
        setLogsTable('');
      }
    };

    const fetchLogs = () => {
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

    // Перший запит
    fetchLogs();

    // Встановлюємо інтервал
    intervalId = setInterval(fetchLogs, 30000);

    // Очищуємо інтервал при розмонтуванні
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Пустий масив залежностей

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
