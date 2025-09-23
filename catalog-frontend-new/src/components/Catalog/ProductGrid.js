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
import { useTheme, useMediaQuery } from '@mui/material';

const ProductGrid = ({ products, category, subcategory, onProductSelect, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fiyat görüntüleme fonksiyonu
  const renderPrice = (price) => {
    if (price === 'Fiyat Alınız') {
      return (
        <Chip 
          label="Fiyat Alınız" 
          size="small" 
          color="warning" 
          variant="filled"
          sx={{ 
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 1
          }}
        />
      );
    }
    
    // Sayısal fiyat için
    const priceValue = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(priceValue)) {
      return (
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          {priceValue.toFixed(2)} ₺
        </Typography>
      );
    }
    
    return (
      <Chip 
        label="Fiyat Bilgisi Yok" 
        size="small" 
        color="error" 
        variant="outlined"
      />
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
            <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
              <Card 
                sx={{ 
                  height: '100%', 
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
                    boxShadow: theme.shadows[8],
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => onProductSelect(product._id)}
              >
                <CardMedia
                  component="img"
                  height="240"
                  image={product.images?.[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  sx={{ 
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg';
                  }}
                />
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="h2"
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      minHeight: '64px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.3
                    }}
                  >
                    {product.name}
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    paragraph
                    sx={{
                      mb: 2,
                      minHeight: '60px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.4
                    }}
                  >
                    {product.description || 'Açıklama bulunmamaktadır.'}
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 'auto',
                    flexWrap: 'wrap',
                    gap: 1
                  }}>
                    {renderPrice(product.price)}
                    <Chip 
                      label={product.subcategory || product.category} 
                      size="small" 
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.7rem',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    />
                  </Box>

                  {/* Barkod bilgisi - sadece debug için */}
                  {process.env.NODE_ENV === 'development' && (
                    <Typography 
                      variant="caption" 
                      color="text.disabled" 
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Barkod: {product.barcode}
                    </Typography>
                  )}
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