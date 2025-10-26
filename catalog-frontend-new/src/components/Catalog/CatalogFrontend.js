import React, { useState, useEffect } from 'react';
import {
  Container, AppBar, Toolbar, Typography, Box,
  IconButton, CircularProgress, useMediaQuery,
  useTheme, TextField, InputAdornment
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Search as SearchIcon } from '@mui/icons-material';
import CategoryGrid from './CategoryGrid';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import {
  getCategories,
  getProductsByCategory,
  getProductsBySubcategory,
  getItemById,
  searchProducts
} from '../../services/catalogApi';

const CatalogFrontend = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔍 Arama state’leri
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // 🟢 Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await getCategories();
        const data = res.data.categories || res.data || [];
        setCategories(data);
      } catch {
        setError('Kategoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // 🔎 Arama
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Boşsa ana sayfaya dön
    if (value.trim() === '') {
      setSearchResults([]);
      setIsSearchMode(false);
      setView('home');
      return;
    }

    // 2 karakterden azsa bekle
    if (value.trim().length < 2) return;

    try {
      setLoading(true);
      const res = await searchProducts(value);
      setSearchResults(res.data.results || []);
      setIsSearchMode(true);
    } catch (err) {
      console.error('Arama hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      const res = await getProductsByCategory(category._id, true);
      setProducts(res.data.products || []);
      setSelectedCategory(category);
      setView('category');
    } catch {
      setError('Ürünler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategorySelect = async (subcategory) => {
    try {
      setLoading(true);
      const res = await getProductsBySubcategory(subcategory._id, true);
      setProducts(res.data.products || []);
      setSelectedSubcategory(subcategory);
      setView('category');
    } catch {
      setError('Alt kategori ürünleri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (id) => {
    try {
      setLoading(true);
      const res = await getItemById(id);
      setSelectedProduct(res.data);
      setView('product');
    } catch {
      setError('Ürün detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'product') {
      setView('category');
      setSelectedProduct(null);
    } else {
      setView('home');
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setProducts([]);
      setIsSearchMode(false);
      setSearchQuery('');
    }
  };

  if (loading && view === 'home') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={2} sx={{ backgroundColor: '#383E42' }}>
        <Toolbar>
          {view !== 'home' && (
            <IconButton color="inherit" onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {isSearchMode
              ? 'Arama Sonuçları'
              : view === 'home'
              ? 'Ravinzo Katalog'
              : selectedProduct
              ? selectedProduct.name
              : selectedCategory?.name || 'Katalog'}
          </Typography>

          {/* 🔍 Arama Kutusu */}
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
        {/* 🔎 Arama aktifse */}
        {isSearchMode ? (
          <ProductGrid
            products={searchResults}
            onProductSelect={handleProductSelect}
            loading={loading}
          />
        ) : view === 'home' ? (
          <CategoryGrid
            categories={categories}
            onCategorySelect={handleCategorySelect}
          />
        ) : view === 'category' ? (
          <ProductGrid
            products={products}
            category={selectedCategory}
            subcategory={selectedSubcategory}
            onProductSelect={handleProductSelect}
            loading={loading}
          />
        ) : view === 'product' && selectedProduct ? (
          <ProductDetail product={selectedProduct} loading={loading} />
        ) : null}
      </Container>
    </Box>
  );
};

export default CatalogFrontend;
