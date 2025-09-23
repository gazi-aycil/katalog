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
            px: 1,
            whiteSpace: 'nowrap'
          }}
        />
      );
    }
    
    // Sayısal fiyat için
    const priceValue = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(priceValue)) {
      return (
        <Typography variant="h6" color="primary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
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
        sx={{ whiteSpace: 'nowrap' }}
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
                  height: '520px', // Sabit yükseklik
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
                {/* Görsel Container - Sabit Boyut */}
                <Box 
                  sx={{ 
                    height: '240px', // Sabit görsel yüksekliği
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
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  {/* Kategori Etiketi */}
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
                    {product.subcategory || product.category}
                  </Box>
                </Box>

                {/* İçerik Alanı - Sabit Yükseklik ve Text Wrap */}
                <CardContent 
                  sx={{ 
                    flex: 1,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    minHeight: '280px'
                  }}
                >
                  {/* Ürün Adı - Text Wrap Özellikli */}
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="h2"
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      minHeight: '64px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      flexShrink: 0
                    }}
                  >
                    {product.name}
                  </Typography>
                  
                  {/* Açıklama - Text Wrap Özellikli */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    paragraph
                    sx={{
                      mb: 2,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    {product.description || 'Açıklama bulunmamaktadır.'}
                  </Typography>
                  
                  {/* Fiyat ve Bilgiler - Sabit Alt Alan */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    gap: 1,
                    flexShrink: 0,
                    mt: 'auto'
                  }}>
                    {renderPrice(product.price)}
                    
                    {/* Kategori/Alt Kategori - Text Wrap Özellikli */}
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
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    />
                  </Box>

                  {/* Barkod bilgisi - sadece debug için */}
                  {process.env.NODE_ENV === 'development' && (
                    <Typography 
                      variant="caption" 
                      color="text.disabled" 
                      sx={{ 
                        mt: 1, 
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
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