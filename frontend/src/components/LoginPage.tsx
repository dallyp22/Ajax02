import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Speed as SpeedIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Simple team credentials - in production, this would be handled by a proper auth service
  const validCredentials = [
    { username: 'admin', password: 'rentroll2024', role: 'Administrator' },
    { username: 'dallas', password: 'optimizer', role: 'Manager' },
    { username: 'team', password: 'demo123', role: 'Analyst' },
    { username: 'demo', password: 'demo', role: 'Viewer' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = validCredentials.find(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );

    if (user) {
      localStorage.setItem('rent_optimizer_auth', JSON.stringify({
        username: user.username,
        role: user.role,
        loginTime: new Date().toISOString(),
      }));
      onLogin();
    } else {
      setError('Invalid credentials. Please try again.');
    }
    
    setLoading(false);
  };

  const handleInputChange = (field: keyof typeof credentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
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

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={credentials.username}
              onChange={handleInputChange('username')}
              margin="normal"
              required
              autoComplete="username"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(1, 209, 209, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#01D1D1',
                    boxShadow: '0 0 10px rgba(1, 209, 209, 0.3)',
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleInputChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(1, 209, 209, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#01D1D1',
                    boxShadow: '0 0 10px rgba(1, 209, 209, 0.3)',
                  },
                },
              }}
            />

            {error && (
              <Alert
                severity="error"
                sx={{
                  mt: 2,
                  backgroundColor: 'rgba(231, 111, 81, 0.15)',
                  border: '1px solid rgba(231, 111, 81, 0.3)',
                  borderRadius: '8px',
                }}
              >
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
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
              {loading ? 'Authenticating...' : 'Access Command Center'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage; 