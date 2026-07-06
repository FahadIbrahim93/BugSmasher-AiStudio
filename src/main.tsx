import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressionManager } from './game/ProgressionManager';
import { StoryManager } from './game/StoryManager';
import './index.css';

// Gracefully handle browser/sandbox environments where window.fetch is read-only
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (desc?.configurable) {
      let activeFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        get() { return activeFetch; },
        set(val) { activeFetch = val; },
        configurable: true,
        enumerable: true
      });
    }
  } catch (err) {
    console.warn('[main.tsx] Skipped global fetch redefinition:', err);
  }

  // Intercept and absorb unhandled read-only / getter-only fetch errors
  const isFetchError = (err: unknown) => {
    const msg = String(err instanceof Error ? err.message : err || '');
    return msg.includes('fetch') && (msg.includes('getter') || msg.includes('read only') || msg.includes('redefine'));
  };

  window.addEventListener('error', (event) => {
    if (isFetchError(event.error) || isFetchError(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isFetchError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

void ProgressionManager.initCloudSync();
StoryManager.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

