import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Suppress harmless browser extension timeouts and ResizeObserver loop notifications
if (typeof window !== 'undefined') {
  const isIgnorableError = (msg: string, src: string, stack: string) => {
    const combined = `${msg} ${src} ${stack}`.toLowerCase();
    return (
      combined.includes('chrome: call method') ||
      combined.includes('call method" timed out') ||
      combined.includes('chrome-extension://') ||
      combined.includes('moz-extension://') ||
      combined.includes('safari-extension://') ||
      combined.includes('resizeobserver loop completed with undelivered notifications') ||
      combined.includes('resizeobserver loop limit exceeded')
    );
  };

  window.addEventListener('error', (e) => {
    const msg = e.message || (e.error && e.error.message) || '';
    const src = e.filename || '';
    const stack = (e.error && e.error.stack) || '';
    if (isIgnorableError(msg, src, stack)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = reason ? (reason.message || String(reason)) : '';
    const stack = reason ? (reason.stack || '') : '';
    if (isIgnorableError(msg, '', stack)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

