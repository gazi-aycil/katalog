// src/components/Catalog/CatalogFrontend.js
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
  useTheme
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import CategoryGrid from './CategoryGrid';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import { getCategories, getItemsByCategory, getItemById } from '../../services/catalogApi';

const CatalogFrontend = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState('home'); // home, category, product
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories();
        setCategories(response.data);
        setLoading(false);
      } catch (err) {
        setError('Kategoriler yüklenirken hata oluştu');
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Kategori seçildiğinde
  const handleCategorySelect = async (category, subcategory = null) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      
      const response = await getItemsByCategory(category.id, subcategory?.id);
      setProducts(response.data.products || []);
      setView('category');
      setLoading(false);
    } catch (err) {
      setError('Ürünler yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  // Ürün seçildiğinde
  const handleProductSelect = async (productId) => {
    try {
      setLoading(true);
      const response = await getItemById(productId);
      setSelectedProduct(response.data);
      setView('product');
      setLoading(false);
    } catch (err) {
      setError('Ürün detayları yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  // Geri düğmesi
  const handleBack = () => {
    if (view === 'product') {
      setView('category');
    } else if (view === 'category') {
      setView('home');
    }
  };

  // Ana sayfaya dön
  const handleHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedProduct(null);
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
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Üst Navigasyon Çubuğu */}
      <AppBar position="sticky" elevation={2} sx={{ backgroundColor: '#2c3e50' }}>
        <Toolbar>
          {view !== 'home' && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <HomeIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {view === 'home' ? 'Ravinzo Katalog' : selectedCategory?.name}
          </Typography>
          
          {isMobile && (
            <IconButton color="inherit">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* İçerik Alanı */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb (İçerik gezintisi) */}
        {view !== 'home' && (
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link
              color="inherit"
              onClick={handleHome}
              sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Ana Sayfa
            </Link>
            {selectedCategory && view !== 'product' && (
              <Typography color="text.primary">{selectedCategory.name}</Typography>
            )}
            {selectedSubcategory && (
              <Typography color="text.primary">{selectedSubcategory.name}</Typography>
            )}
            {view === 'product' && selectedProduct && (
              <Typography color="text.primary">{selectedProduct.name}</Typography>
            )}
          </Breadcrumbs>
        )}

        {/* İçerik Görünümleri */}
        {view === 'home' && (
          <CategoryGrid 
            categories={categories} 
            onCategorySelect={handleCategorySelect} 
          />
        )}

        {view === 'category' && (
          <ProductGrid 
            products={products}
            category={selectedCategory}
            subcategory={selectedSubcategory}
            onProductSelect={handleProductSelect}
            loading={loading}
          />
        )}

        {view === 'product' && selectedProduct && (
          <ProductDetail 
            product={selectedProduct}
            loading={loading}
          />
        )}
      </Container>
    </Box>
  );
};

export default CatalogFrontend;