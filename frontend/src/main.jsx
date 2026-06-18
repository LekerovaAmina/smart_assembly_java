import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// ✅ Загрузка jsQR для QR-сканирования
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
script.async = true;
document.head.appendChild(script);

// ✅ Только ОДНА функция render!
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);