import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, useMediaQuery } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';
import AdminLayout from './components/Layout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCategories from './pages/Admin/Categories';
import Items from './pages/Admin/Items';
import NotFound from './pages/NotFound';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width:600px)');

  // Create a responsive theme instance
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: prefersDarkMode ? 'dark' : 'light',
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#dc004e',
        },
      },
      typography: {
        fontSize: isMobile ? 14 : 16,
        h1: {
          fontSize: isMobile ? '2rem' : '3rem',
        },
        h2: {
          fontSize: isMobile ? '1.75rem' : '2.5rem',
        },
        h3: {
          fontSize: isMobile ? '1.5rem' : '2rem',
        },
      },
      components: {
        MuiButton: {
          defaultProps: {
            size: isMobile ? 'small' : 'medium',
          },
          styleOverrides: {
            root: {
              borderRadius: 8,
              textTransform: 'none',
              padding: isMobile ? '6px 12px' : '8px 16px',
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            size: isMobile ? 'small' : 'medium',
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              padding: isMobile ? '16px' : '24px',
            },
          },
        },
      },
    }),
    [prefersDarkMode, isMobile]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes with Main Layout */}
          { /*    <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog/:category" element={<CatalogPage />} />
            <Route path="catalog/:category/:subcategory" element={<CatalogPage />} />
            <Route path="product/:id" element={<ProductPage />} />
          </Route> */}

          {/* Admin Routes with Admin Layout */}
          <Route path="/admin" element={<AdminLayout isMobile={isMobile} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="products" element={<Items />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound isMobile={isMobile} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;