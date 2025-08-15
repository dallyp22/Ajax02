import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Auth0Debug: React.FC = () => {
  const config = {
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE,
    redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Auth0 Configuration Debug
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Environment Variables
          </Typography>
          <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expected Auth0 Settings
          </Typography>
          <Typography variant="body2" component="div">
            In your Auth0 Dashboard, these should be set:
            <ul>
              <li><strong>Allowed Callback URLs:</strong> {config.redirectUri}</li>
              <li><strong>Allowed Logout URLs:</strong> http://localhost:3000</li>
              <li><strong>Allowed Web Origins:</strong> http://localhost:3000</li>
              <li><strong>Allowed Origins (CORS):</strong> http://localhost:3000</li>
              <li><strong>Application Type:</strong> Native Application</li>
              <li><strong>Grant Types:</strong> Authorization Code, Refresh Token</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Troubleshooting Steps
          </Typography>
          <Typography variant="body2" component="div">
            <ol>
              <li>Verify all Auth0 settings match exactly</li>
              <li>Make sure you clicked "Save Changes" in Auth0</li>
              <li>Wait 1-2 minutes for settings to propagate</li>
              <li>Clear browser cache and cookies</li>
              <li>Check browser console for specific errors</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Auth0Debug;
