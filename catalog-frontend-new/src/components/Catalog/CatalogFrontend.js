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
  Chip
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import CategoryGrid from './CategoryGrid';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import { getCategories, getProductsByCategoryId, getItemById } from '../../services/catalogApi';

const CatalogFrontend = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState('home');
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

  // Kategori seçildiğinde (ID ile)
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      
      // Alt kategorileri kontrol et
      if (category.subcategories && category.subcategories.length > 0) {
        setView('subcategories');
        setLoading(false);
      } else {
        // Alt kategori yoksa doğrudan ürünleri getir
        console.log('Alt kategori yok, ürünler getiriliyor - Kategori ID:', category._id);
        const response = await getProductsByCategoryId(category._id);
        console.log('Ürünler response:', response.data);
        setProducts(response.data.products || []);
        setView('category');
        setLoading(false);
      }
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
      setError('Ürünler yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  // Alt kategori seçildiğinde (ID ile)
  const handleSubcategorySelect = async (subcategory) => {
    try {
      setLoading(true);
      setSelectedSubcategory(subcategory);
      
      console.log('Alt kategori seçildi - Kategori ID:', selectedCategory._id, 'Alt Kategori ID:', subcategory._id);
      const response = await getProductsByCategoryId(selectedCategory._id, subcategory._id);
      console.log('Alt kategori ürünleri:', response.data);
      setProducts(response.data.products || []);
      setView('category');
      setLoading(false);
    } catch (err) {
      console.error('Alt kategori ürünleri yüklenirken hata:', err);
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
      if (selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
        setView('subcategories');
      } else {
        setView('home');
      }
    } else if (view === 'subcategories') {
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

  // Alt Kategorileri Görüntüleme Bileşeni
  const renderSubcategories = () => {
    if (!selectedCategory || !selectedCategory.subcategories) return null;

    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
            {selectedCategory.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Alt kategorileri görüntüleyin
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {selectedCategory.subcategories.map((subcategory, index) => (
            <Grid item xs={12} sm={6} md={4} key={subcategory._id || index}>
              <Card 
                sx={{ 
                  cursor: 'pointer', 
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderRadius: 2,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                  }
                }}
                onClick={() => handleSubcategorySelect(subcategory)}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={subcategory.imageUrl || selectedCategory.imageUrl || '/placeholder-category.jpg'}
                  alt={subcategory.name}
                  sx={{ 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                  onError={(e) => {
                    if (selectedCategory.imageUrl) {
                      e.target.src = selectedCategory.imageUrl;
                    } else {
                      e.target.src = '/placeholder-category.jpg';
                    }
                  }}
                />
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {subcategory.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    Ürünleri görüntüle
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
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
            {view === 'home' ? 'Ravinzo Katalog' : 
             view === 'subcategories' ? selectedCategory.name : 
             view === 'category' ? (selectedSubcategory ? selectedSubcategory.name : selectedCategory.name) : 
             selectedProduct?.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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

        {view === 'home' && (
          <CategoryGrid 
            categories={categories} 
            onCategorySelect={handleCategorySelect} 
          />
        )}

        {view === 'subcategories' && renderSubcategories()}

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