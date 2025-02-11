import React from 'react';
import { createRoot } from 'react-dom/client';
import { TabPanel } from './components/TabPanel';
import './styles/index.scss';

function App() {
  return <TabPanel />;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
