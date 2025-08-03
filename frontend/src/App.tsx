import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertySelectionProvider } from './contexts/PropertySelectionContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UnitsPage from './pages/UnitsPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketResearchPage from './pages/MarketResearchPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1F1F23 0%, #1A1A1F 50%, #1F1F23 100%)',
        }}
      >
        <CircularProgress 
          size={60} 
          sx={{
            color: '#01D1D1',
            filter: 'drop-shadow(0 0 8px rgba(1, 209, 209, 0.8))',
          }}
        />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/market-research" element={<MarketResearchPage />} />
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