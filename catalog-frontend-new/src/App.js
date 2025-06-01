import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AdminLayout from './components/Layout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCategories from './pages/Admin/Categories';
import Items from './pages/Admin/Items';


import NotFound from './pages/NotFound';


// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
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
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
           {/*    <Route path="products" element={<AdminProducts />} />*/}
           // Add this route to your existing routes
          <Route path="/admin/products" element={<Items />} />
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;