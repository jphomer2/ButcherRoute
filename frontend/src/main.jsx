import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
console.log('%c ButcherRoute v2 (jwt-fix) ', 'background:#0F766E;color:white;font-size:14px;padding:4px 8px;border-radius:4px');
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useSession } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginScreen from './components/LoginScreen';
import App from './App.jsx';
import './index.css';

function ProtectedRoute({ children }) {
  const session  = useSession();
  const location = useLocation();
  if (session === undefined) return null;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"               element={<LandingPage />} />
          <Route path="/login"          element={<LoginScreen />} />
          <Route path="/app"            element={<ProtectedRoute><App /></ProtectedRoute>} />
          <Route path="/app/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="*"               element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
