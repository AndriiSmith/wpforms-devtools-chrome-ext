import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import '../styles/index.scss';

export function LogsTable() {
  const [logsTable, setLogsTable] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [wpformsAdmin, setWpformsAdmin] = useState(null);

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
    const processResponse = (content) => {
      console.log('Processing response...');
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      // Отримуємо дані з wpforms_admin
      const wpformsScript = doc.querySelector('script#wpforms-admin-js-extra');
      
      if (wpformsScript) {
        try {
          const scriptContent = wpformsScript.textContent;
          const match = scriptContent.match(/var\s+wpforms_admin\s*=\s*({.*?});/s);
          if (match) {
            const adminData = JSON.parse(match[1]);
            setWpformsAdmin(adminData);
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
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const logId = link.getAttribute('data-log-id');
            if (logId) {
              getLogDetails(logId);
            }
          });
        });

        console.log('Table found, setting content...');
        setLogsTable(table.outerHTML);
      } else {
        console.log('Table not found in response');
        setLogsTable('');
      }
    };

    const getLogDetails = (logId) => {
      if (!wpformsAdmin || !wpformsAdmin.nonce) {
        console.error('WPForms admin data not available');
        return;
      }

      const script = `
        (function() {
          const domain = window.location.hostname;
          const url = new URL(\`https://\${domain}/wp-admin/admin-ajax.php\`);
          url.searchParams.append('action', 'wpforms_get_log_record');
          url.searchParams.append('nonce', '${wpformsAdmin.nonce}');
          url.searchParams.append('recordId', '${logId}');
          
          fetch(url.toString())
            .then(response => response.json())
            .then(data => {
              console.log('Log details:', data);
              // Тут можна додати обробку отриманих даних
            })
            .catch(error => console.error('Error fetching log details:', error));
        })();
      `;

      chrome.devtools.inspectedWindow.eval(script);
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

    fetchLogs();

    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [wpformsAdmin]);

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
