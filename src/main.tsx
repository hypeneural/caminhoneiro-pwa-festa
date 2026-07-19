import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './index.css';

// Router future flags
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div>Algo deu errado ao abrir o app.</div>}>
      <BrowserRouter future={routerFutureConfig}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
