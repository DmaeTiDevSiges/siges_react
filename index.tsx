// PRIMEIRO import: silencia o console antes de qualquer outro módulo carregar.
import './utils/consoleControl';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App';
import './index.css';
import './global.css';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { AuthProvider } from './contexts/AuthContext';
import { UiVersionProvider } from './contexts/UiVersionContext';
import { initClientDiagnostics } from './services/core/clientDiagnosticsService';

// Diagnóstico de recargas/fechamentos inesperados — antes de tudo.
initClientDiagnostics();

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* Hash (#/tela): igual no Android (Capacitor), Electron e web, sem depender do servidor. */}
    <HashRouter>
      <AuthProvider>
        <UiVersionProvider>
          <App />
        </UiVersionProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
