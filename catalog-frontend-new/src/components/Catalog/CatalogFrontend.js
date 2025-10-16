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
        let categoriesData = [];

        if (response.data) {
          if (Array.isArray(response.data)) categoriesData = response.data;
          else if (response.data.categories) categoriesData = response.data.categories;
          else if (response.data.data) categoriesData = response.data.data;
        }

        setCategories(categoriesData);
        setLoading(false);
      } catch (err) {
        setError('Kategoriler yüklenirken hata oluştu.');
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Kategori seçildiğinde
  const handleCategorySelect = async (category) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setBreadcrumbStack(prev => [...prev, { type: 'category', data: category }]);

      if (category.subcategories && category.subcategories.length > 0) {
        setView('subcategories');
        setLoading(false);
      } else {
        const response = await getProductsByCategory(category._id, true);
        setProducts(response.data.products || []);
        setView('category');
        setLoading(false);
      }
    } catch (err) {
      setError('Ürünler yüklenirken hata oluştu.');
      setLoading(false);
    }
  };

  // Alt kategori seçildiğinde
  const handleSubcategorySelect = async (subcategory) => {
    try {
      setLoading(true);
      setSelectedSubcategory(subcategory);
      setBreadcrumbStack(prev => [...prev, { type: 'subcategory', data: subcategory }]);

      if (subcategory.subcategories && subcategory.subcategories.length > 0) {
        setView('subcategories');
        setLoading(false);
      } else {
        const response = await getProductsBySubcategory(subcategory._id, true);
        setProducts(response.data.products || []);
        setView('category');
        setLoading(false);
      }
    } catch (err) {
      setError('Alt kategori ürünleri yüklenirken hata oluştu.');
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
    } catch {
      setError('Ürün detayları yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  // Geri tuşu
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
          if (prevItem.data.subcategories?.length > 0) {
            setView('subcategories');
          } else {
            setView('category');
            getProductsByCategory(prevItem.data._id, true).then(response => {
              setProducts(response.data.products || []);
            });
          }
        }
        setBreadcrumbStack(newStack);
      } else handleHome();
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

  // Breadcrumb tıklama
  const handleBreadcrumbClick = (index) => {
    const newStack = breadcrumbStack.slice(0, index + 1);
    setBreadcrumbStack(newStack);
    if (newStack.length === 0) return handleHome();

    const target = newStack[newStack.length - 1];
    if (target.type === 'category') {
      setSelectedCategory(target.data);
      setSelectedSubcategory(null);
      if (target.data.subcategories?.length > 0) setView('subcategories');
      else {
        setView('category');
        getProductsByCategory(target.data._id, true).then(response => setProducts(response.data.products || []));
      }
    } else if (target.type === 'subcategory') {
      setSelectedSubcategory(target.data);
      if (target.data.subcategories?.length > 0) setView('subcategories');
      else {
        setView('category');
        getProductsBySubcategory(target.data._id, true).then(response => setProducts(response.data.products || []));
      }
    }
  };

  // Breadcrumb render
  const renderBreadcrumbs = () => {
    if (view === 'home') return null;
    const items = [{ label: 'Ana Sayfa', onClick: handleHome }];
    breadcrumbStack.forEach((item, i) => items.push({
      label: item.data.name, onClick: () => handleBreadcrumbClick(i)
    }));

    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        {items.map((item, i) =>
          i === items.length - 1 ? (
            <Typography key={i} color="text.primary">{item.label}</Typography>
          ) : (
            <Link
              key={i}
              color="inherit"
              onClick={item.onClick}
              sx={{ cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {item.label}
            </Link>
          )
        )}
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
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        position: 'relative',
        // 🌆 Arka plan resmi + %50 gölge
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          zIndex: -2
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // %50 karartma
          zIndex: -1
        }
      }}
    >
      <AppBar position="sticky" elevation={2} sx={{ backgroundColor: '#383E42' }}>
        <Toolbar>
          {view !== 'home' && (
            <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" align="center" sx={{ flexGrow: 1 }}>
            {view === 'home'
              ? 'Ravinzo Katalog'
              : view === 'subcategories'
              ? (selectedSubcategory ? selectedSubcategory.name : selectedCategory?.name)
              : view === 'category'
              ? (selectedSubcategory ? selectedSubcategory.name : selectedCategory?.name)
              : selectedProduct?.name}
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

        {view === 'subcategories' && (
          <Box>
            <Typography align="center" variant="h5" sx={{ color: '#fff' }}>
              Alt Kategoriler
            </Typography>
          </Box>
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
          <Box sx={{ backgroundColor: '#ffffff', borderRadius: 2, p: 3 }}>
            <ProductDetail product={selectedProduct} loading={loading} />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CatalogFrontend;
