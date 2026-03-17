import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

// Load Inter font
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(link);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#4678d8' },
    secondary:  { main: '#6c5ce7' },
    success:    { main: '#00d68f' },
    warning:    { main: '#ffaa00' },
    error:      { main: '#ff4757' },
    info:       { main: '#00d2d3' },
    background: {
      default: '#0b1220',
      paper:   '#14161c',
    },
    text: {
      primary:   '#e6e6e6',
      secondary: '#8a8fa8',
    },
    divider: '#2e3345',
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h1: { color: '#ffffff' },
    h2: { color: '#ffffff' },
    h3: { color: '#ffffff' },
    h4: { color: '#ffffff' },
    h5: { color: '#ffffff' },
    h6: { color: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  shadows: Array(25).fill('none').map((_, i) =>
    i === 0 ? 'none' : `0 ${i}px ${i * 3}px rgba(0,0,0,0.35)`
  ),
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0b1220',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0b1220',
          border: '1px solid #FFFFFF22',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#14161c',
          borderRight: '1px solid #2e3345',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: 'rgba(46,51,69,.5)',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          color: '#8a8fa8',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.85rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
