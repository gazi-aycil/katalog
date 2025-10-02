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
  CardContent
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import CategoryGrid from './CategoryGrid';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import { getCategories, getProductsByCategory, getProductsBySubcategory, getItemById } from '../../services/catalogApi';

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

  // Kategori seçildiğinde - GÜNCELLENMİŞ MANTIK
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      
      setBreadcrumbStack(prev => [...prev, { 
        type: 'category', 
        data: category 
      }]);

      // Alt kategorileri kontrol et
      if (category.subcategories && category.subcategories.length > 0) {
        setView('subcategories');
        setLoading(false);
      } else {
        console.log('🛒 Kategori ürünleri getiriliyor:', category.name);
        // ALT KATEGORİLER DAHİL EDİLEREK ÜRÜNLER GETİRİLİYOR
        const response = await getProductsByCategory(category._id, true);
        console.log('📦 Kategori ürünleri:', response.data.products);
        
        setProducts(response.data.products || []);
        setView('category');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Ürünler yüklenirken hata:', err);
      setError('Ürünler yüklenirken hata oluştu: ' + err.message);
      setLoading(false);
    }
  };

  // Alt kategori seçildiğinde - GÜNCELLENMİŞ MANTIK
  const handleSubcategorySelect = async (subcategory) => {
    try {
      setLoading(true);
      setSelectedSubcategory(subcategory);
      
      setBreadcrumbStack(prev => [...prev, { 
        type: 'subcategory', 
        data: subcategory 
      }]);

      console.log('🔄 Alt kategori seçildi:', subcategory.name);
      
      // Alt kategorinin alt kategorilerini kontrol et
      if (subcategory.subcategories && subcategory.subcategories.length > 0) {
        console.log('📁 Alt kategorinin alt kategorisi var');
        setView('subcategories');
        setLoading(false);
      } else {
        // ALT KATEGORİLER DAHİL EDİLEREK ÜRÜNLER GETİRİLİYOR
        console.log('🛒 Alt kategori ürünleri getiriliyor...');
        const response = await getProductsBySubcategory(subcategory._id, true);
        console.log('📦 Alt kategori ürünleri:', response.data.products);
        
        setProducts(response.data.products || []);
        setView('category');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Alt kategori ürünleri yüklenirken hata:', err);
      setError('Ürünler yüklenirken hata oluştu: ' + err.message);
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
      setSelectedProduct(null);
    } else if (view === 'category' || view === 'subcategories') {
      const newStack = [...breadcrumbStack];
      newStack.pop();
      
      if (newStack.length > 0) {
        const prevItem = newStack[newStack.length - 1];
        
        if (prevItem.type === 'subcategory') {
          setSelectedSubcategory(prevItem.data);
          setView('subcategories');
        } else if (prevItem.type === 'category') {
          setSelectedCategory(prevItem.data);
          setSelectedSubcategory(null);
          if (prevItem.data.subcategories && prevItem.data.subcategories.length > 0) {
            setView('subcategories');
          } else {
            setView('category');
            // Ürünleri tekrar yükle (alt kategoriler dahil)
            getProductsByCategory(prevItem.data._id, true).then(response => {
              setProducts(response.data.products || []);
            });
          }
        }
        
        setBreadcrumbStack(newStack);
      } else {
        handleHome();
      }
    }
  };

  // Ana sayfaya dön
  const handleHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedProduct(null);
    setBreadcrumbStack([]);
    setProducts([]);
  };

  // Breadcrumb'a tıklandığında
  const handleBreadcrumbClick = (index) => {
    const newStack = breadcrumbStack.slice(0, index + 1);
    setBreadcrumbStack(newStack);
    
    if (newStack.length === 0) {
      handleHome();
      return;
    }
    
    const targetItem = newStack[newStack.length - 1];
    
    if (targetItem.type === 'category') {
      setSelectedCategory(targetItem.data);
      setSelectedSubcategory(null);
      if (targetItem.data.subcategories && targetItem.data.subcategories.length > 0) {
        setView('subcategories');
      } else {
        setView('category');
        getProductsByCategory(targetItem.data._id, true).then(response => {
          setProducts(response.data.products || []);
        });
      }
    } else if (targetItem.type === 'subcategory') {
      setSelectedSubcategory(targetItem.data);
      if (targetItem.data.subcategories && targetItem.data.subcategories.length > 0) {
        setView('subcategories');
      } else {
        setView('category');
        getProductsBySubcategory(targetItem.data._id, true).then(response => {
          setProducts(response.data.products || []);
        });
      }
    }
  };

  // Alt Kategorileri Görüntüleme Bileşeni
  const renderSubcategories = () => {
    const currentCategory = selectedSubcategory || selectedCategory;
    if (!currentCategory || !currentCategory.subcategories) return null;

    return (
      <Box>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
            {currentCategory.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentCategory.subcategories.length} alt kategori
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {currentCategory.subcategories.map((subcategory, index) => (
            <Grid item xs={12} sm={6} md={3} key={subcategory._id || index}>
              <Card 
                sx={{ 
                  height: '350px',
                  cursor: 'pointer', 
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => handleSubcategorySelect(subcategory)}
              >
                <Box 
                  sx={{ 
                    height: '180px',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  <CardMedia
                    component="img"
                    image={subcategory.imageUrl || currentCategory.imageUrl || '/placeholder-category.jpg'}
                    alt={subcategory.name}
                    sx={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                    onError={(e) => {
                      if (currentCategory.imageUrl) {
                        e.target.src = currentCategory.imageUrl;
                      } else {
                        e.target.src = '/placeholder-category.jpg';
                      }
                    }}
                  />
                </Box>
                
                <CardContent 
                  sx={{ 
                    flex: 1,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    overflow: 'hidden',
                    minHeight: '170px'
                  }}
                >
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        hyphens: 'auto'
                      }}
                    >
                      {subcategory.name}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      mt: 2,
                      flexShrink: 0
                    }}
                  >
                    {subcategory.subcategories && subcategory.subcategories.length > 0 
                      ? `${subcategory.subcategories.length} alt kategori` 
                      : 'Ürünleri görüntüle'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Breadcrumb render
  const renderBreadcrumbs = () => {
    if (view === 'home') return null;

    const items = [
      { label: 'Ana Sayfa', onClick: handleHome }
    ];

    breadcrumbStack.forEach((item, index) => {
      items.push({
        label: item.data.name,
        onClick: () => handleBreadcrumbClick(index)
      });
    });

    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {items.map((item, index) => (
          index === items.length - 1 ? (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          ) : (
            <Link
              key={index}
              color="inherit"
              onClick={item.onClick}
              sx={{ 
                cursor: 'pointer', 
                textDecoration: 'none', 
                '&:hover': { 
                  textDecoration: 'underline' 
                } 
              }}
            >
              {item.label}
            </Link>
          )
        ))}
      </Breadcrumbs>
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
             view === 'subcategories' ? (selectedSubcategory ? selectedSubcategory.name : selectedCategory?.name) : 
             view === 'category' ? (selectedSubcategory ? selectedSubcategory.name : selectedCategory?.name) : 
             selectedProduct?.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {renderBreadcrumbs()}

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