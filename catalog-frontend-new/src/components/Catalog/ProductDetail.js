// src/components/Catalog/ProductDetail.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const ProductDetail = ({ product, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);

  // Fiyat görüntüleme fonksiyonu
  const renderPrice = (price) => {
    if (price === 'Fiyat Alınız') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label="Fiyat Alınız" 
            color="warning" 
            variant="filled"
            sx={{ 
              fontWeight: 600,
              fontSize: '1.1rem',
              px: 2,
              py: 1
            }}
          />
        </Box>
      );
    }
    
    // Sayısal fiyat için
    const priceValue = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(priceValue)) {
      return (
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          {priceValue.toFixed(2)} ₺
        </Typography>
      );
    }
    
    return (
      <Chip 
        label="Fiyat Bilgisi Yok" 
        color="error" 
        variant="outlined"
        sx={{ 
          fontWeight: 600,
          fontSize: '1rem',
          px: 2
        }}
      />
    );
  };

  // WhatsApp iletişim fonksiyonu
  const handleContact = () => {
    if (!product) return;
    
    const phoneNumber = "905326111641"; // Sabit numara
    const productName = product.name || "Ürün";
    const productBarcode = product.barcode === 'Fiyat Alınız' ? 'Fiyat Alınız' : `${product.price} ₺`;
    
    const message = `Merhaba, ${productName} (${productBarcode}) ürünü hakkında bilgi almak istiyorum. `;
    const encodedMessage = encodeURIComponent(message);
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        {/* Loading indicator buraya gelebilir */}
      </Box>
    );
  }

  if (!product) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Ürün bulunamadı</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: 2 }}>
      {/* Ürün Detay İçeriği */}
      <Grid container spacing={4}>
        {/* Ürün Görselleri - Sabit solda */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            position: 'sticky',
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            {/* Ana Görsel */}
            <Box sx={{ 
              position: 'relative',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#f8f9fa'
            }}>
              <Box
                component="img"
                src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: isMobile ? '300px' : '400px',
                  objectFit: 'contain',
                  p: 1,
                  display: 'block'
                }}
              />
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  '&:hover': {
                    backgroundColor: 'white'
                  }
                }}
                onClick={() => setZoomDialogOpen(true)}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>

            {/* Küçük Görseller */}
            {product.images && product.images.length > 1 && (
              <Grid container spacing={1}>
                {product.images.map((image, index) => (
                  <Grid item xs={3} key={index}>
                    <Box
                      component="img"
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      onClick={() => setSelectedImage(index)}
                      sx={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'contain',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid',
                        borderColor: selectedImage === index ? 'primary.main' : 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        p: 0.5,
                        transition: 'border-color 0.2s ease'
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Grid>

        {/* Ürün Bilgileri - Sabit sağda */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              {product.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={product.category} 
                color="primary" 
                variant="outlined" 
              />
              {product.subcategory && (
                <Chip 
                  label={product.subcategory} 
                  variant="outlined"
                  sx={{ 
                    borderColor: 'secondary.main',
                    color: 'secondary.main'
                  }}
                />
              )}
            </Box>

            {/* Fiyat Görüntüleme */}
            {renderPrice(product.price)}

            {product.barcode && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Barkod: {product.barcode}
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Ürün Açıklaması
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 3 }}>
              {product.description || 'Bu ürün için açıklama bulunmamaktadır.'}
            </Typography>

            {product.specs && product.specs.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Teknik Özellikler
                </Typography>
                <List dense sx={{ mb: 3 }}>
                  {product.specs.map((spec, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={spec}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {/* Buton container - içeriğin altında sabit */}
            <Box sx={{ mt: 'auto', pt: 3 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth={isMobile}
                sx={{ 
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  minWidth: isMobile ? '100%' : 'auto'
                }}
                onClick={handleContact}
              >
                {product.price === 'Fiyat Alınız' ? 'Fiyat Sorun' : 'İletişime Geçin'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Zoom Dialog */}
      <Dialog
        open={zoomDialogOpen}
        onClose={() => setZoomDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
            alt={product.name}
            sx={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProductDetail;