import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: string;
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app load
    const checkAuth = async () => {
      try {
        // Add minimum loading time to show loading circle
        const startTime = Date.now();
        const minLoadTime = 800; // Show loading for at least 800ms
        
        const authData = localStorage.getItem('rent_optimizer_auth');
        if (authData) {
          const userData = JSON.parse(authData);
          
          // Check if the session is still valid (24 hours)
          const loginTime = new Date(userData.loginTime);
          const now = new Date();
          const hoursDifference = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDifference < 24) {
            setUser(userData);
          } else {
            // Session expired
            localStorage.removeItem('rent_optimizer_auth');
          }
        }
        
        // Ensure minimum loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('rent_optimizer_auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    // The actual login logic is handled in LoginPage
    // This function is called after successful authentication
    const authData = localStorage.getItem('rent_optimizer_auth');
    if (authData) {
      const userData = JSON.parse(authData);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('rent_optimizer_auth');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 