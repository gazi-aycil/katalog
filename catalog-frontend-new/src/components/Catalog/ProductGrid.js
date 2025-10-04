import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';

const ProductGrid = ({ products, category, subcategory, onProductSelect, loading }) => {

  const renderPrice = (price) => {
    if (price === 'Fiyat Alınız') {
      return (
        <Chip 
          label="Fiyat Alınız" 
          size="small" 
          color="warning" 
          variant="filled"
          sx={{ fontWeight: 600, fontSize: '0.9rem', px: 1 }}
        />
      );
    }
    
    const priceValue = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(priceValue)) {
      return (
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          {priceValue.toFixed(2)} ₺
        </Typography>
      );
    }
    
    return (
      <Chip label="Fiyat Bilgisi Yok" size="small" color="error" variant="outlined" />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 300 }}>
          {subcategory ? subcategory.name : category?.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {products.length} ürün
        </Typography>
      </Box>

      {products.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            Bu kategoride henüz ürün bulunmamaktadır.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product._id}>
              <Card 
                sx={{ 
                  height: '350px', // TÜM KARTLAR AYNI
                  width: '100%',
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 8,
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => onProductSelect(product._id)}
              >
                {/* GÖRSEL - KESİN AYNI BOYUT */}
                <Box 
                  sx={{ 
                    height: '200px', // TÜM GÖRSELLER AYNI
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  <CardMedia
                    component="img"
                    image={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    sx={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      maxWidth: '80%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {product.subcategory || product.category || 'Kategori'}
                  </Box>
                </Box>

                {/* İÇERİK - KESİN AYNI BOYUT */}
                <CardContent 
                  sx={{ 
                    height: '150px', // TÜM İÇERİKLER AYNI
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  {/* ÜRÜN ADI - KESİN AYNI BOYUT */}
                  <Box sx={{ height: '50px', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      component="h2"
                      sx={{ 
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                        fontSize: '1rem'
                      }}
                    >
                      {product.name}
                    </Typography>
                  </Box>
                  
                  {/* AÇIKLAMA - KESİN AYNI BOYUT */}
                  <Box sx={{ height: '40px', mb: 2, flex: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                        fontSize: '0.8rem'
                      }}
                    >
                      {product.description || 'Açıklama bulunmamaktadır.'}
                    </Typography>
                  </Box>
                  
                  {/* FİYAT VE BİLGİLER */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 'auto'
                  }}>
                    {renderPrice(product.price)}
                    
                    <Chip 
                      label={product.subcategory || product.category || 'Kategori'} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', maxWidth: '100px' }}
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

export default ProductGrid;