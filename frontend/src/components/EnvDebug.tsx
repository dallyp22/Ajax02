import React from 'react';

const EnvDebug: React.FC = () => {
  const envVars = {
    VITE_AUTH0_DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN,
    VITE_AUTH0_CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID,
    VITE_AUTH0_AUDIENCE: import.meta.env.VITE_AUTH0_AUDIENCE,
    VITE_AUTH0_REDIRECT_URI: import.meta.env.VITE_AUTH0_REDIRECT_URI,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
    VITE_BYPASS_AUTH: import.meta.env.VITE_BYPASS_AUTH,
    VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      fontSize: '12px', 
      borderRadius: '4px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h4>Environment Variables Debug</h4>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key} style={{ marginBottom: '4px' }}>
          <strong>{key}:</strong> {value || '❌ MISSING'}
        </div>
      ))}
    </div>
  );
};

export default EnvDebug;
