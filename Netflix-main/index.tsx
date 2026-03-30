import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Console cleaner - runs in both dev and production
import './lib/devConsole';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {

      })
      .catch((registrationError) => {

      });
  });
}
