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
        <Grid container spacing={3} justifyContent="center">
          {products.map((product) => (
            <Grid 
              item 
              key={product._id}
              sx={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Card 
                sx={{ 
                  width: 260,               // SABİT GENİŞLİK
                  height: 360,              // SABİT YÜKSEKLİK
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    borderColor: 'primary.main'
                  }
                }}
                onClick={() => onProductSelect(product._id)}
              >
                {/* FOTOĞRAF */}
                <Box 
                  sx={{ 
                    height: 180,             // SABİT FOTOĞRAF YÜKSEKLİĞİ
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <CardMedia
                    component="img"
                    image={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    sx={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',    // ORANI KORUYARAK KIRP
                      objectPosition: 'center'
                    }}
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
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
                      fontWeight: 600,
                      maxWidth: '80%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {product.subcategory || product.category || 'Kategori'}
                  </Box>
                </Box>

                {/* METİN ALANI */}
                <CardContent 
                  sx={{ 
                    flexGrow: 1,
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {/* ÜRÜN ADI */}
                  <Typography 
                    variant="h6" 
                    component="h2"
                    sx={{ 
                      fontWeight: 600,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordBreak: 'break-word',
                      fontSize: '1rem',
                      mb: 1
                    }}
                  >
                    {product.name}
                  </Typography>

                  {/* AÇIKLAMA */}
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
                      fontSize: '0.8rem',
                      mb: 1
                    }}
                  >
                    {product.description || 'Açıklama bulunmamaktadır.'}
                  </Typography>

                  {/* FİYAT & ETİKET */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 'auto'
                    }}
                  >
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
