import React from 'react';
import ReactDOM from 'react-dom';
import { TabPanel } from './components/TabPanel';

function App() {
  return <TabPanel />;
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
