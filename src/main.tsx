/// <reference types="vite-plugin-pwa/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Optionally alert user or auto refresh
  },
  onOfflineReady() {
    console.log('PWA is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
