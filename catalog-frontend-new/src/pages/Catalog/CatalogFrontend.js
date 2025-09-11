// CatalogFrontend.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getItemsByCategory, getCategories, getItems } from './api';

// Özel tema
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3e50', // Şık bir koyu mavi
    },
    secondary: {
      main: '#e74c3c', // Zarif bir kırmızı
    },
    background: {
      default: '#f8f9fa', // Açık gri arkaplan
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function CatalogFrontend() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState('home'); // home, category, product
  const [loading, setLoading] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState('');

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse] = await Promise.all([
        getCategories()
      ]);
      setCategories(categoriesResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Veri yüklenirken hata oluştu:', error);
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category, subcategory = null) => {
    try {
      setLoading(true);
      setSelectedCategory(category);
      setSelectedSubcategory(subcategory);
      
      const response = await getItemsByCategory(category.name, subcategory?.name);
      setProducts(response.data.products || []);
      setView('category');
      setLoading(false);
    } catch (error) {
      console.error('Kategori ürünleri yüklenirken hata oluştu:', error);
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setView('product');
  };

  const handleZoomImage = (imageUrl) => {
    setZoomedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const renderHome = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        Katalog
      </Typography>
      <Grid container spacing={4}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category._id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 3
                }
              }}
              onClick={() => handleCategoryClick(category)}
            >
              <CardMedia
                component="img"
                height="240"
                image={category.imageUrl || '/placeholder-category.jpg'}
                alt={category.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" component="div">
                  {category.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {category.subcategories?.length || 0} alt kategori
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCategory = () => {
    const currentCategory = categories.find(cat => cat.name === selectedCategory?.name);
    const subcategories = currentCategory?.subcategories || [];

    return (
      <Box>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            onClick={() => setView('home')}
            sx={{ cursor: 'pointer' }}
          >
            Ana Sayfa
          </Link>
          <Typography color="text.primary">{selectedCategory.name}</Typography>
          {selectedSubcategory && (
            <Typography color="text.primary">{selectedSubcategory.name}</Typography>
          )}
        </Breadcrumbs>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {selectedCategory.name}
          </Typography>
          {selectedSubcategory && (
            <Typography variant="h5" color="primary" gutterBottom>
              {selectedSubcategory.name}
            </Typography>
          )}
        </Box>

        {subcategories.length > 0 && !selectedSubcategory && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Alt Kategoriler
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {subcategories.map((subcat) => (
                <Chip
                  key={subcat.name}
                  label={subcat.name}
                  onClick={() => handleCategoryClick(selectedCategory, subcat)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Typography variant="h6" gutterBottom>
          Ürünler ({products.length})
        </Typography>

        {products.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
            Bu kategoride henüz ürün bulunmamaktadır.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleProductClick(product)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {product.description?.length > 100 
                        ? `${product.description.substring(0, 100)}...` 
                        : product.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        {product.price.toFixed(2)} TL
                      </Typography>
                      <Chip 
                        label={product.subcategory || product.category} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  const renderProduct = () => (
    <Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          color="inherit"
          onClick={() => setView('home')}
          sx={{ cursor: 'pointer' }}
        >
          Ana Sayfa
        </Link>
        <Link
          color="inherit"
          onClick={() => handleCategoryClick({ name: selectedProduct.category })}
          sx={{ cursor: 'pointer' }}
        >
          {selectedProduct.category}
        </Link>
        {selectedProduct.subcategory && (
          <Link
            color="inherit"
            onClick={() => handleCategoryClick(
              { name: selectedProduct.category }, 
              { name: selectedProduct.subcategory }
            )}
            sx={{ cursor: 'pointer' }}
          >
            {selectedProduct.subcategory}
          </Link>
        )}
        <Typography color="text.primary">{selectedProduct.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image={selectedProduct.images?.[0] || '/placeholder-product.jpg'}
              alt={selectedProduct.name}
              sx={{ borderRadius: 1, width: '100%' }}
            />
            {selectedProduct.images?.[0] && (
              <IconButton
                sx={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)' }}
                onClick={() => handleZoomImage(selectedProduct.images[0])}
                size="small"
              >
                <ZoomInIcon />
              </IconButton>
            )}
          </Box>
          
          {selectedProduct.images && selectedProduct.images.length > 1 && (
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {selectedProduct.images.slice(1).map((image, index) => (
                <Grid item xs={4} key={index}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={image}
                      alt={`${selectedProduct.name} ${index + 2}`}
                      sx={{ borderRadius: 1, height: 100, width: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      sx={{ 
                        position: 'absolute', 
                        bottom: 4, 
                        right: 4, 
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        width: 24,
                        height: 24
                      }}
                      onClick={() => handleZoomImage(image)}
                      size="small"
                    >
                      <ZoomInIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {selectedProduct.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Chip 
              label={selectedProduct.category} 
              sx={{ mr: 1 }} 
              color="primary" 
              variant="outlined" 
            />
            {selectedProduct.subcategory && (
              <Chip 
                label={selectedProduct.subcategory} 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Typography variant="h5" color="primary" gutterBottom>
            {selectedProduct.price.toFixed(2)} TL
          </Typography>
          
          <Typography variant="body1" paragraph>
            {selectedProduct.description}
          </Typography>
          
          {selectedProduct.barcode && (
            <Typography variant="body2" color="text.secondary" paragraph>
              Barkod: {selectedProduct.barcode}
            </Typography>
          )}
          
          {selectedProduct.specs && selectedProduct.specs.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Özellikler
              </Typography>
              <ul style={{ paddingLeft: '20px' }}>
                {selectedProduct.specs.map((spec, index) => (
                  <li key={index}>
                    <Typography variant="body2">{spec}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        <AppBar position="static" elevation={2}>
          <Toolbar>
            {view !== 'home' && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => {
                  if (view === 'product') {
                    setView('category');
                  } else if (view === 'category') {
                    setView('home');
                  }
                }}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {view === 'home' ? 'Katalog' : selectedCategory?.name}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {view === 'home' && renderHome()}
              {view === 'category' && renderCategory()}
              {view === 'product' && renderProduct()}
            </>
          )}
        </Container>

        <Dialog 
          open={imageDialogOpen} 
          onClose={() => setImageDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Ürün Görseli</DialogTitle>
          <DialogContent>
            <img 
              src={zoomedImage} 
              alt="Zoomed product" 
              style={{ width: '100%', height: 'auto' }}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default CatalogFrontend;