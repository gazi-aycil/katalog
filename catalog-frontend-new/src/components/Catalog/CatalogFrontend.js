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
  const [breadcrumbStack, setBreadcrumbStack] = useState([]);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔍 Arama ile ilgili state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

  // 🔍 Arama fonksiyonu
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length < 2) {
      if (view === 'search') setView('home');
      return;
    }

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

  // Kategori seçimi
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
    } catch {
      setError('Ürünler yüklenirken hata oluştu.');
      setLoading(false);
    }
  };

  // Alt kategori seçimi
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
    } catch {
      setError('Alt kategori ürünleri yüklenirken hata oluştu.');
      setLoading(false);
    }
  };

  // Ürün seçimi
  const handleProductSelect = async (productId) => {
    try {
      setLoading(true);
      const response = await getItemById(productId);
      setSelectedProduct(response.data);
      setView('product');
      setLoading(false);
    } catch {
      setError('Ürün detayları yüklenirken hata oluştu.');
      setLoading(false);
    }
  };

  // Geri dönüş mantığı
  const handleBack = () => {
    if (view === 'product') {
      setView('category');
      setSelectedProduct(null);
      return;
    }
    if (view === 'search') {
      setSearchQuery('');
      setSearchResults([]);
      setView('home');
      return;
    }

    const newStack = [...breadcrumbStack];
    newStack.pop();

    if (newStack.length > 0) {
      const prev = newStack[newStack.length - 1];
      if (prev.type === 'subcategory') {
        setSelectedSubcategory(prev.data);
        setView('subcategories');
      } else if (prev.type === 'category') {
        setSelectedCategory(prev.data);
        if (prev.data.subcategories?.length > 0) {
          setView('subcategories');
        } else {
          setView('category');
          getProductsByCategory(prev.data._id, true).then(r =>
            setProducts(r.data.products || [])
          );
        }
      }
      setBreadcrumbStack(newStack);
    } else {
      handleHome();
    }
  };

  const handleHome = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedProduct(null);
    setBreadcrumbStack([]);
    setProducts([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderBreadcrumbs = () => {
    if (view === 'home' || view === 'search') return null;
    const items = [{ label: 'Ana Sayfa', onClick: handleHome }];
    breadcrumbStack.forEach((item, i) => items.push({
      label: item.data.name,
      onClick: () => handleBreadcrumbClick(i)
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

  const handleBreadcrumbClick = (index) => {
    const newStack = breadcrumbStack.slice(0, index + 1);
    setBreadcrumbStack(newStack);
    if (newStack.length === 0) return handleHome();

    const target = newStack[newStack.length - 1];
    if (target.type === 'category') {
      setSelectedCategory(target.data);
      if (target.data.subcategories?.length > 0) setView('subcategories');
      else {
        setView('category');
        getProductsByCategory(target.data._id, true).then(r => setProducts(r.data.products || []));
      }
    } else if (target.type === 'subcategory') {
      setSelectedSubcategory(target.data);
      if (target.data.subcategories?.length > 0) setView('subcategories');
      else {
        setView('category');
        getProductsBySubcategory(target.data._id, true).then(r => setProducts(r.data.products || []));
      }
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
            {view === 'home'
              ? 'Ravinzo Katalog'
              : view === 'search'
              ? 'Arama Sonuçları'
              : selectedProduct
              ? selectedProduct.name
              : selectedSubcategory
              ? selectedSubcategory.name
              : selectedCategory?.name}
          </Typography>

          {/* 🔍 Arama Alanı */}
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
        {renderBreadcrumbs()}

        {view === 'home' && (
          <CategoryGrid categories={categories} onCategorySelect={handleCategorySelect} />
        )}

        {view === 'subcategories' && selectedCategory && (
          <Box>
            <Typography variant="h4" align="center" gutterBottom>
              {selectedSubcategory ? selectedSubcategory.name : selectedCategory.name}
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {(selectedSubcategory?.subcategories || selectedCategory.subcategories || []).map((sub, i) => (
                <Grid item key={i}>
                  <Card
                    sx={{
                      width: 240,
                      height: 300,
                      cursor: 'pointer',
                      transition: 'all .3s ease',
                      '&:hover': { transform: 'translateY(-6px)', boxShadow: 4 }
                    }}
                    onClick={() => handleSubcategorySelect(sub)}
                  >
                    <CardMedia
                      component="img"
                      image={sub.imageUrl || '/placeholder-category.jpg'}
                      sx={{ height: 180 }}
                      alt={sub.name}
                    />
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" noWrap>{sub.name}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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

        {view === 'search' && (
          <ProductGrid
            products={searchResults}
            category={null}
            subcategory={null}
            onProductSelect={handleProductSelect}
            loading={loading}
          />
        )}
      </Container>
    </Box>
  );
};

export default CatalogFrontend;
