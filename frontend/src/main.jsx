import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
console.log('%c ButcherRoute v2 (jwt-fix) ', 'background:#0F766E;color:white;font-size:14px;padding:4px 8px;border-radius:4px');
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<LandingPage />} />
          <Route path="/app"            element={<App />} />
          <Route path="/app/analytics"  element={<AnalyticsPage />} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
