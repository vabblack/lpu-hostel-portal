import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { Spinner } from './components/common/Spinner';

// Pages
import { HomePage } from './pages/HomePage';
import { HostelsPage } from './pages/HostelsPage';
import { HostelDetailPage } from './pages/HostelDetailPage';
import { RoomCatalogPage } from './pages/RoomCatalogPage';
import { RoommatesPage } from './pages/RoommatesPage';
import { ApplyPage } from './pages/ApplyPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner label="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hostels" element={<HostelsPage />} />
            <Route path="/hostels/:id" element={<HostelDetailPage />} />
            <Route path="/rooms" element={<RoomCatalogPage />} />
            
            {/* Protected Routes */}
            <Route
              path="/roommates"
              element={
                <ProtectedRoute>
                  <RoommatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/apply"
              element={
                <ProtectedRoute>
                  <ApplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
