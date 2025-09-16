// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminLayout from './components/Layout/AdminLayout';
import ExcelImport from './components/Admin/ExcelImport';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCategories from './pages/Admin/Categories';
import Items from './pages/Admin/Items';
import CatalogHome from './pages/CatalogHome';
import NotFound from './pages/NotFound';

// Özel tema - Şık ve elit bir tasarım için
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50', // Şık bir koyu mavi
      light: '#34495e',
      dark: '#2c3e50',
    },
    secondary: {
      main: '#e74c3c', // Zarif bir kırmızı
      light: '#ec7063',
      dark: '#c0392b',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
      fontSize: '3.5rem',
    },
    h2: {
      fontWeight: 300,
      fontSize: '3rem',
    },
    h3: {
      fontWeight: 400,
      fontSize: '2.5rem',
    },
    h4: {
      fontWeight: 400,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Müşteri katalog sayfası - Ana sayfa */}
          <Route path="/" element={<CatalogHome />} />
          
          {/* Admin paneli */}
          <Route path="/excel-import" element={<ExcelImport />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="products" element={<Items />} />
          </Route>
          
          {/* 404 sayfası */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;