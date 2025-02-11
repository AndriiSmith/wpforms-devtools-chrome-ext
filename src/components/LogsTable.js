import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';

export function LogsTable() {
    const [logsTable, setLogsTable] = useState('');
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [wpformsAdmin, setWpformsAdmin] = useState(null);
    const [logDetails, setLogDetails] = useState(null);
    const tableRef = useRef(null);

    // Track theme changes.
    useEffect(() => {
        if (window.matchMedia) {
            const darkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            setIsDarkTheme(darkThemeQuery.matches);

            const themeListener = (e) => setIsDarkTheme(e.matches);
            darkThemeQuery.addListener(themeListener);
            
            return () => darkThemeQuery.removeListener(themeListener);
        }
    }, []);

    // Handle table click events.
    const handleTableClick = (e) => {
        console.log('Click event:', e.target);
        
        // Check if clicked element has the required class.
        const target = e.target.closest('.js-single-log-target');
        console.log('Found target:', target);
        
        if (!target) {
            console.log('No target element found.');
            return;
        }
        
        if (!wpformsAdmin || !wpformsAdmin.nonce) {
            console.log('No wpformsAdmin data:', { wpformsAdmin });
            return;
        }

        e.preventDefault();
        const logId = target.getAttribute('data-log-id');
        console.log('Log ID:', logId);
        
        if (!logId) {
            console.log('No log ID found.');
            return;
        }

        console.log('Sending request for log details:', {
            logId,
            nonce: wpformsAdmin.nonce
        });

        const script = `
            (function() {
                const domain = window.location.hostname;
                const protocol = window.location.protocol;
                const url = new URL(\`\${protocol}//\${domain}/wp-admin/admin-ajax.php\`);
                
                url.searchParams.append('action', 'wpforms_get_log_record');
                url.searchParams.append('nonce', '${wpformsAdmin.nonce}');
                url.searchParams.append('recordId', '${logId}');
                
                return url.toString();
            })();
        `;

        chrome.devtools.inspectedWindow.eval(script, (url, isException) => {
            if (!isException && url) {
                console.log('Logs URL:', url);
                
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                
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
                    console.error('Error fetching logs.');
                    setLogsTable('');
                };
                
                xhr.send();
            } else {
                console.error('Failed to get logs URL:', isException);
                setLogsTable('');
            }
        });
    };

    // Listen for log details messages.
    useEffect(() => {
        const handleMessage = (event) => {
            console.log('Got message:', event.data);
            if (event.data.type === 'WPF_LOG_DETAILS') {
                console.log('Setting log details:', event.data.data);
                setLogDetails(event.data.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Track log details changes.
    useEffect(() => {
        console.log('Log details updated:', logDetails);
    }, [logDetails]);

    // Fetch logs on mount and periodically.
    useEffect(() => {
        let intervalId;

        const processResponse = (content) => {
            console.log('Processing response...');
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            
            // Get wpforms_admin data from script tag.
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
                console.log('Table found, setting content...');
                setLogsTable(table.outerHTML);
            } else {
                console.log('Table not found in response.');
                setLogsTable('');
            }
        };

        const fetchLogs = () => {
            const script = `
                (function() {
                    const domain = window.location.hostname;
                    const protocol = window.location.protocol;
                    return \`\${protocol}//\${domain}/wp-admin/admin.php?page=wpforms-tools&view=logs\`;
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
                        console.error('Error fetching logs.');
                        setLogsTable('');
                    };
                    
                    xhr.send();
                } else {
                    console.error('Failed to get logs URL:', isException);
                    setLogsTable('');
                }
            });
        };

        // Initial fetch.
        fetchLogs();

        // Set up interval.
        intervalId = setInterval(fetchLogs, 30000);

        // Clean up interval on unmount.
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []); // Empty dependency array.

    if (!logsTable || logsTable.length === 0) {
        return (
            <div className={classNames('logs-table logs-table--empty', { 'dark-theme': isDarkTheme })}>
                Loading logs...
            </div>
        );
    }

    return (
        <div 
            ref={tableRef}
            className={classNames('logs-table', { 'dark-theme': isDarkTheme })}
            onClick={handleTableClick}
        >
            <div className="logs-table__content" dangerouslySetInnerHTML={{ __html: logsTable }} />
            <div 
                className={classNames('logs-table__details', { 
                    'logs-table__details--visible': logDetails 
                })}
                style={{ display: logDetails ? 'block' : 'none' }}
            >
                {logDetails && (
                    <>
                        <h3>Log Details</h3>
                        <pre>{JSON.stringify(logDetails.data, null, 2)}</pre>
                    </>
                )}
            </div>
        </div>
    );
}
