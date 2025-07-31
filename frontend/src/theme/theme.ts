import { createTheme } from '@mui/material/styles';

// Command Center Color Palette
export const commandCenterPalette = {
  background: {
    primary: '#1F1F23',     // Deep charcoal
    surface: '#2A2A30',     // Darker gray for cards
    glass: 'rgba(255, 255, 255, 0.06)', // Glass morphism overlay
  },
  accent: {
    cyan: '#01D1D1',        // Vibrant cyan
    success: '#2A9D8F',     // Teal green
    warning: '#F4A261',     // Warm orange
    error: '#E76F51',       // Error red
  },
  text: {
    primary: '#FFFFFF',     // Pure white
    secondary: 'rgba(255, 255, 255, 0.8)', // 80% opacity
    tertiary: 'rgba(255, 255, 255, 0.6)',  // 60% opacity
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.1)',   // 10% white
    accent: 'rgba(1, 209, 209, 0.3)',      // Cyan with opacity
  }
};

export const commandCenterTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: commandCenterPalette.accent.cyan,
      light: '#33D9D9',
      dark: '#01A8A8',
      contrastText: '#000000',
    },
    secondary: {
      main: commandCenterPalette.accent.success,
      light: '#4DB3A3',
      dark: '#1E7C72',
      contrastText: '#FFFFFF',
    },
    error: {
      main: commandCenterPalette.accent.error,
      light: '#EB8F7A',
      dark: '#D54E2C',
    },
    warning: {
      main: commandCenterPalette.accent.warning,
      light: '#F6B584',
      dark: '#F18E3E',
    },
    success: {
      main: commandCenterPalette.accent.success,
      light: '#4DB3A3',
      dark: '#1E7C72',
    },
    background: {
      default: commandCenterPalette.background.primary,
      paper: commandCenterPalette.background.surface,
    },
    text: {
      primary: commandCenterPalette.text.primary,
      secondary: commandCenterPalette.text.secondary,
      disabled: commandCenterPalette.text.tertiary,
    },
    divider: commandCenterPalette.border.primary,
  },
  typography: {
    fontFamily: [
      'Inter',
      'Plex Sans',
      'Montserrat',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: 'Plex Sans, Montserrat, sans-serif',
      fontWeight: 500,
    },
    body1: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 400,
    },
    body2: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 400,
    },
    button: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(135deg, ${commandCenterPalette.background.primary} 0%, #1A1A1F 50%, ${commandCenterPalette.background.primary} 100%)`,
          backgroundAttachment: 'fixed',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: commandCenterPalette.background.surface,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: commandCenterPalette.accent.cyan,
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#33D9D9',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(42, 42, 48, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${commandCenterPalette.border.primary}`,
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(1, 209, 209, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${commandCenterPalette.accent.cyan}, transparent)`,
            opacity: 0.6,
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(1, 209, 209, 0.2)',
            borderColor: commandCenterPalette.border.accent,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          padding: '10px 24px',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${commandCenterPalette.accent.cyan} 0%, ${commandCenterPalette.accent.success} 100%)`,
          color: '#000000',
          boxShadow: `0 4px 16px rgba(1, 209, 209, 0.3)`,
          '&:hover': {
            boxShadow: `0 8px 24px rgba(1, 209, 209, 0.4)`,
            background: `linear-gradient(135deg, #33D9D9 0%, #4DB3A3 100%)`,
          },
        },
        outlined: {
          borderColor: commandCenterPalette.border.accent,
          color: commandCenterPalette.accent.cyan,
          backgroundColor: 'rgba(1, 209, 209, 0.05)',
          '&:hover': {
            backgroundColor: 'rgba(1, 209, 209, 0.1)',
            borderColor: commandCenterPalette.accent.cyan,
            boxShadow: `0 4px 16px rgba(1, 209, 209, 0.2)`,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          backdropFilter: 'blur(10px)',
        },
        colorSuccess: {
          backgroundColor: 'rgba(42, 157, 143, 0.2)',
          color: commandCenterPalette.accent.success,
          border: `1px solid rgba(42, 157, 143, 0.3)`,
        },
        colorWarning: {
          backgroundColor: 'rgba(244, 162, 97, 0.2)',
          color: commandCenterPalette.accent.warning,
          border: `1px solid rgba(244, 162, 97, 0.3)`,
        },
        colorError: {
          backgroundColor: 'rgba(231, 111, 81, 0.2)',
          color: commandCenterPalette.accent.error,
          border: `1px solid rgba(231, 111, 81, 0.3)`,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(42, 42, 48, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${commandCenterPalette.border.primary}`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(1, 209, 209, 0.1)',
          '& .MuiTableCell-root': {
            color: commandCenterPalette.text.primary,
            fontWeight: 600,
            borderBottom: `1px solid ${commandCenterPalette.border.accent}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          },
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(42, 42, 48, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${commandCenterPalette.border.primary}`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(31, 31, 35, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${commandCenterPalette.border.primary}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(1, 209, 209, 0.1)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(1, 209, 209, 0.2)',
            borderLeft: `3px solid ${commandCenterPalette.accent.cyan}`,
            '&:hover': {
              backgroundColor: 'rgba(1, 209, 209, 0.25)',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(42, 157, 143, 0.15)',
          border: `1px solid rgba(42, 157, 143, 0.3)`,
          color: commandCenterPalette.accent.success,
        },
        standardWarning: {
          backgroundColor: 'rgba(244, 162, 97, 0.15)',
          border: `1px solid rgba(244, 162, 97, 0.3)`,
          color: commandCenterPalette.accent.warning,
        },
        standardError: {
          backgroundColor: 'rgba(231, 111, 81, 0.15)',
          border: `1px solid rgba(231, 111, 81, 0.3)`,
          color: commandCenterPalette.accent.error,
        },
        standardInfo: {
          backgroundColor: 'rgba(1, 209, 209, 0.15)',
          border: `1px solid rgba(1, 209, 209, 0.3)`,
          color: commandCenterPalette.accent.cyan,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
        bar: {
          borderRadius: '4px',
          background: `linear-gradient(90deg, ${commandCenterPalette.accent.cyan}, ${commandCenterPalette.accent.success})`,
          boxShadow: `0 0 10px rgba(1, 209, 209, 0.5)`,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: commandCenterPalette.accent.cyan,
          filter: `drop-shadow(0 0 8px ${commandCenterPalette.accent.cyan})`,
        },
      },
    },
  },
});

export default commandCenterTheme; 