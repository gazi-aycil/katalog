import React, { useState, useEffect } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardMedia,
  CardContent,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import CategoryGrid from './CategoryGrid';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import { getCategories, getProductsByCategory, getProductsBySubcategory, getItemById, searchProducts } from '../../services/catalogApi';

const CatalogFrontend = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [breadcrumbStack, setBreadcrumbStack] = useState([]);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔍 Arama için state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        let data = [];
        if (Array.isArray(response.data)) data = response.data;
        else if (response.data?.categories) data = response.data.categories;
        setCategories(data);
      } catch {
        setError('Kategoriler yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 🔍 Arama fonksiyonu
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length < 2) return;

    try {
      setLoading(true);
      const response = await searchProducts(value);
      setSearchResults(response.data.results || []);
      setView('search');
    } catch (err) {
      console.error('Arama hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔙 Geri butonu
  const handleBack = () => {
    if (view === 'search') {
      setView('home');
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    setView('home');
  };

  if (loading && view === 'home') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={2} sx={{ backgroundColor: '#383E42' }}>
        <Toolbar sx={{ gap: 2 }}>
          {view !== 'home' && (
            <IconButton edge="start" color="inherit" onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {view === 'home' ? 'Ravinzo Katalog' : 'Ürün Arama'}
          </Typography>

          <TextField
            variant="outlined"
            size="small"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={handleSearch}
            sx={{
              bgcolor: 'white',
              borderRadius: 1,
              minWidth: isMobile ? '60%' : '300px'
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {view === 'home' && (
          <CategoryGrid categories={categories} onCategorySelect={() => {}} />
        )}

        {view === 'search' && (
          <ProductGrid
            products={searchResults}
            category={null}
            subcategory={null}
            onProductSelect={() => {}}
            loading={loading}
          />
        )}
      </Container>
    </Box>
  );
};

export default CatalogFrontend;
