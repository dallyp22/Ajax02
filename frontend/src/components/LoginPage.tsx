import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await onLogin(); // This will trigger Auth0 redirect
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1F1F23 0%, #1A1A1F 50%, #1F1F23 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(1, 209, 209, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(42, 157, 143, 0.1) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: '100%',
          backgroundColor: 'rgba(42, 42, 48, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(1, 209, 209, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #01D1D1, transparent)',
            opacity: 0.8,
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                color: '#000',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 24px rgba(1, 209, 209, 0.3)',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: '-3px',
                  background: 'linear-gradient(135deg, #01D1D1, #2A9D8F)',
                  borderRadius: '50%',
                  zIndex: -1,
                  opacity: 0.3,
                  filter: 'blur(8px)',
                },
              }}
            >
              <SpeedIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              AI Rent Optimizer
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              Command Center Access Portal
            </Typography>
          </Box>

          {/* Auth0 Login */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                mb: 2,
              }}
            >
              Secure Enterprise Authentication
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              <Chip
                icon={<SecurityIcon />}
                label="Auth0 Protected"
                size="small"
                sx={{
                  backgroundColor: 'rgba(1, 209, 209, 0.1)',
                  color: '#01D1D1',
                  border: '1px solid rgba(1, 209, 209, 0.3)',
                }}
              />
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              background: loading 
                ? 'rgba(1, 209, 209, 0.3)' 
                : 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
              color: '#000',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(1, 209, 209, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #33D9D9 0%, #4DB3A3 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 32px rgba(1, 209, 209, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(1, 209, 209, 0.3)',
                color: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            {loading ? 'Redirecting to Auth0...' : 'Sign In with Auth0'}
          </Button>
          
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              mt: 2,
            }}
          >
            Multi-Tenant SaaS Platform • Secure Data Isolation
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage; 