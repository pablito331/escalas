import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global safety net for unhandled promise rejections or uncaught errors
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled rejection captured:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Unhandled window error captured:', event.error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

