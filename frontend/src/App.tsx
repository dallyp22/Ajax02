import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertySelectionProvider } from './contexts/PropertySelectionContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UnitsPage from './pages/UnitsPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketResearchPage from './pages/MarketResearchPage';
import UploadsPage from './pages/UploadsPage';
import AdminPage from './pages/AdminPage';
import Auth0Debug from './components/Auth0Debug';
import EnvDebug from './components/EnvDebug';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth();
  
  // Development bypass for testing
  const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';
  const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1F1F23 0%, #1A1A1F 50%, #1F1F23 100%)',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 8px 32px rgba(1, 209, 209, 0.3)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '-3px',
              background: 'linear-gradient(135deg, #01D1D1, #2A9D8F)',
              borderRadius: '19px',
              zIndex: -1,
              opacity: 0.3,
              filter: 'blur(8px)',
            },
          }}
        >
          <Box
            sx={{
              fontSize: 32,
              color: '#000',
              fontWeight: 'bold',
            }}
          >
            ⚡
          </Box>
        </Box>
        <CircularProgress 
          size={60} 
          sx={{
            color: '#01D1D1',
            filter: 'drop-shadow(0 0 8px rgba(1, 209, 209, 0.8))',
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          AI Rent Optimizer
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textAlign: 'center',
          }}
        >
          Initializing Command Center...
        </Typography>
      </Box>
    );
  }

  // Allow access to debug page without authentication
  if (window.location.pathname === '/debug') {
    return <Auth0Debug />;
  }

  if (!isAuthenticated && !BYPASS_AUTH) {
    return <LoginPage onLogin={loginWithRedirect} />;
  }

  return (
    <Layout>
      <EnvDebug />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/market-research" element={<MarketResearchPage />} />
        <Route path="/uploads" element={<UploadsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/callback" element={<div>Loading...</div>} />
        <Route path="/debug" element={<Auth0Debug />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <PropertySelectionProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PropertySelectionProvider>
  );
}

export default App; 