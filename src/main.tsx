import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global safety net
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled rejection captured:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('Unhandled window error captured:', event.error);
});

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/escalas/sw.js', { scope: '/escalas/' })
      .then((reg) => {
        // Quando há nova versão disponível, ativa imediatamente
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage('SKIP_WAITING');
              }
            });
          }
        });
      })
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
