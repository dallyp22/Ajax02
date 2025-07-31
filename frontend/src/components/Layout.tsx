import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemAvatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Home,
  Analytics,
  Settings,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', description: 'Portfolio Overview' },
    { text: 'Units', icon: <Home />, path: '/units', description: 'Unit Management' },
    { text: 'Analytics', icon: <Analytics />, path: '/analytics', description: 'Market Analysis' },
    { text: 'Settings', icon: <Settings />, path: '/settings', description: 'Configuration' },
  ];

  const BrandLogo = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        px: 2,
        background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.1) 0%, rgba(42, 157, 143, 0.1) 100%)',
        borderBottom: '1px solid rgba(1, 209, 209, 0.2)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #01D1D1, transparent)',
          opacity: 0.8,
        }
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            mx: 'auto',
            boxShadow: '0 8px 24px rgba(1, 209, 209, 0.3)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '-2px',
              background: 'linear-gradient(135deg, #01D1D1, #2A9D8F)',
              borderRadius: '14px',
              zIndex: -1,
              opacity: 0.3,
              filter: 'blur(8px)',
            }
          }}
        >
          <SpeedIcon sx={{ color: '#000', fontSize: 24, fontWeight: 'bold' }} />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700, 
            color: '#01D1D1',
            textShadow: '0 0 10px rgba(1, 209, 209, 0.5)',
            letterSpacing: '0.5px'
          }}
        >
          AI Rent Optimizer
        </Typography>
      </Box>
    </Box>
  );

  const StatusIndicator = () => (
    <Box sx={{ px: 2, py: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#2A9D8F',
              boxShadow: '0 0 8px #2A9D8F',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 8px #2A9D8F',
                },
                '50%': {
                  boxShadow: '0 0 16px #2A9D8F, 0 0 24px #2A9D8F',
                },
                '100%': {
                  boxShadow: '0 0 8px #2A9D8F',
                },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.7rem' }}>
            System Online
          </Typography>
        </Box>
        <Chip
          size="small"
          label="LIVE"
          sx={{
            backgroundColor: 'rgba(42, 157, 143, 0.2)',
            color: '#2A9D8F',
            fontSize: '0.6rem',
            height: 20,
            fontWeight: 600,
            border: '1px solid rgba(42, 157, 143, 0.3)',
          }}
        />
      </Box>
    </Box>
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <BrandLogo />
      <StatusIndicator />
      
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />
      
      <Box sx={{ flex: 1, py: 2 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, 
            color: 'rgba(255, 255, 255, 0.5)', 
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '1px'
          }}
        >
          NAVIGATION
        </Typography>
        <List sx={{ pt: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ px: 2, py: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) {
                      setMobileOpen(false);
                    }
                  }}
                  sx={{
                    borderRadius: '12px',
                    py: 1.5,
                    px: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(1, 209, 209, 0.08)',
                      transform: 'translateX(8px)',
                      '& .MuiListItemIcon-root': {
                        color: '#01D1D1',
                        filter: 'drop-shadow(0 0 8px rgba(1, 209, 209, 0.6))',
                      },
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(1, 209, 209, 0.15)',
                      borderLeft: '3px solid #01D1D1',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '3px',
                        background: 'linear-gradient(180deg, #01D1D1, #2A9D8F)',
                        boxShadow: '0 0 10px #01D1D1',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#01D1D1',
                        filter: 'drop-shadow(0 0 8px rgba(1, 209, 209, 0.8))',
                      },
                      '& .MuiListItemText-primary': {
                        color: '#01D1D1',
                        fontWeight: 600,
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(1, 209, 209, 0.2)',
                      },
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isActive ? '#01D1D1' : 'rgba(255, 255, 255, 0.7)',
                      minWidth: 40,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem',
                      color: isActive ? '#01D1D1' : 'rgba(255, 255, 255, 0.9)',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mx: 2 }} />
      
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            background: 'rgba(1, 209, 209, 0.05)',
            border: '1px solid rgba(1, 209, 209, 0.2)',
            borderRadius: '12px',
            p: 2,
            textAlign: 'center',
          }}
        >
          <VisibilityIcon sx={{ color: '#01D1D1', mb: 1, fontSize: 20 }} />
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block' }}>
            Real-time monitoring active
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            All systems operational
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ 
          background: 'rgba(42, 42, 48, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(1, 209, 209, 0.2)',
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(1, 209, 209, 0.1)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              letterSpacing: '0.5px'
            }}
          >
            AI Rent Optimization Command Center
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              size="small"
              label={user?.role?.toUpperCase() || "USER"}
              sx={{
                backgroundColor: 'rgba(42, 157, 143, 0.2)',
                color: '#2A9D8F',
                fontSize: '0.7rem',
                fontWeight: 600,
                border: '1px solid rgba(42, 157, 143, 0.3)',
              }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: { xs: 'none', sm: 'block' } }}>
                {user?.username}
              </Typography>
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(1, 209, 209, 0.1)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                    color: '#000',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Box>

            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  backgroundColor: 'rgba(42, 42, 48, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(1, 209, 209, 0.2)',
                  borderRadius: '12px',
                  mt: 1,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem disabled sx={{ opacity: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                      color: '#000',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                    {user?.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    {user?.role}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#F4A261',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 162, 97, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#F4A261' }}>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'rgba(31, 31, 35, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(1, 209, 209, 0.2)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'rgba(31, 31, 35, 0.98)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid rgba(1, 209, 209, 0.2)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1F1F23 0%, #1A1A1F 50%, #1F1F23 100%)',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout; 