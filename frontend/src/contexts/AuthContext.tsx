import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth0, Auth0Provider, User } from '@auth0/auth0-react';

// Extend Auth0 User type to include our custom claims
interface ExtendedUser extends User {
  'https://rentroll-ai.com/roles'?: string[];
  'https://rentroll-ai.com/client_id'?: string;
}

interface AuthContextType {
  user: ExtendedUser | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithRedirect: () => void;
  logout: () => void;
  getAccessTokenSilently: () => Promise<string>;
  // Custom properties
  userRoles: string[];
  clientId: string | null;
  isSuperAdmin: boolean;
  isClientAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth0 configuration
const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || '',
    scope: 'openid profile email'
  },
  // Enable development mode for localhost
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: true,
  // Additional development configurations
  ...(window.location.hostname === 'localhost' && {
    skipRedirectCallback: false,
    advancedOptions: {
      defaultScope: 'openid profile email'
    }
  })
};

// Auth0 Provider wrapper
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider {...auth0Config}>
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
}

// Enhanced context provider that adds our custom logic
function AuthContextProvider({ children }: { children: ReactNode }) {
  const auth0 = useAuth0();

  // Extract custom claims from user
  const extendedUser = auth0.user as ExtendedUser;
  const userRoles = extendedUser?.['https://rentroll-ai.com/roles'] || [];
  const clientId = extendedUser?.['https://rentroll-ai.com/client_id'] || null;
  
  // Role checks
  const isSuperAdmin = userRoles.includes('super_admin');
  const isClientAdmin = userRoles.includes('client_admin') || isSuperAdmin;

  const contextValue: AuthContextType = {
    ...auth0,
    user: extendedUser,
    userRoles,
    clientId,
    isSuperAdmin,
    isClientAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, loginWithRedirect } = useAuth();

    if (isLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      );
    }

    if (!isAuthenticated) {
      loginWithRedirect();
      return null;
    }

    return <Component {...props} />;
  };
}

// Hook for API calls with automatic token inclusion
export function useApiClient() {
  const { getAccessTokenSilently } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  return { apiCall };
}

// Role-based component wrapper
interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: 'super_admin' | 'client_admin' | 'client_user';
  fallback?: ReactNode;
}

export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const { userRoles, isSuperAdmin, isClientAdmin } = useAuth();

  let hasAccess = true;

  if (requiredRole === 'super_admin') {
    hasAccess = isSuperAdmin;
  } else if (requiredRole === 'client_admin') {
    hasAccess = isClientAdmin;
  } else if (requiredRole === 'client_user') {
    hasAccess = userRoles.length > 0; // Any authenticated user with roles
  }

  if (!hasAccess) {
    return fallback || (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Access Denied</h3>
        <p>You don't have permission to view this content.</p>
      </div>
    );
  }

  return <>{children}</>;
}