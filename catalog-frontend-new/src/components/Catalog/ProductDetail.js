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
import { ZoomIn as ZoomInIcon } from '@mui/icons-material';

const ProductDetail = ({ product, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);

  const renderPrice = (price) => {
    if (price === 'Fiyat Alınız') {
      return (
        <Chip
          label="Fiyat Alınız"
          color="warning"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            width: 160,
            height: 48,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        />
      );
    }
    const value = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(value)) {
      return (
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
          {value.toFixed(2)} ₺
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
          width: 160,
          height: 48,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    );
  };

  const handleContact = () => {
    const phone = '905326111641';
    const message = `Merhaba, ${product.name} (${product.price} ₺) ürünü hakkında bilgi almak istiyorum.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading || !product) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Yükleniyor...</Typography>
      </Box>
    );
  }

  const specs = product.specs || [];
  const midIndex = Math.ceil(specs.length / 2);
  const leftSpecs = specs.slice(0, midIndex);
  const rightSpecs = specs.slice(midIndex);

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: 2 }}>
      <Grid
        container
        spacing={4}
        alignItems="flex-start"
        justifyContent="center"
        sx={{ flexWrap: 'nowrap', [theme.breakpoints.down('md')]: { flexWrap: 'wrap' } }}
      >
        {/* SOL TARAF: GÖRSEL */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              width: '100%',
              aspectRatio: '1 / 1', // oran sabit, kare görünüm
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
              alt={product.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
              onError={(e) => (e.target.src = '/placeholder-product.jpg')}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'white' }
              }}
              onClick={() => setZoomDialogOpen(true)}
            >
              <ZoomInIcon />
            </IconButton>
          </Box>

          {/* ALT GÖRSELLER */}
          {product.images && product.images.length > 1 && (
            <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              {product.images.map((img, i) => (
                <Grid item key={i}>
                  <Box
                    component="img"
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    onClick={() => setSelectedImage(i)}
                    sx={{
                      width: 70,
                      height: 70,
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: selectedImage === i ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                      backgroundColor: '#fff'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* SAĞ TARAF: DETAYLAR */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {product.name}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {product.category && <Chip label={product.category} color="primary" variant="outlined" />}
              {product.subcategory && (
                <Chip
                  label={product.subcategory}
                  variant="outlined"
                  sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
                />
              )}
            </Box>

            {renderPrice(product.price)}

            {product.barcode && (
              <Typography variant="body2" color="text.secondary">
                Barkod: {product.barcode}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ürün Açıklaması
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {product.description || 'Bu ürün için açıklama bulunmamaktadır.'}
            </Typography>

            {specs.length > 0 && (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
                  Teknik Özellikler
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      {leftSpecs.map((spec, i) => (
                        <ListItem key={`left-${i}`} sx={{ px: 0 }}>
                          <ListItemText primary={spec} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      {rightSpecs.map((spec, i) => (
                        <ListItem key={`right-${i}`} sx={{ px: 0 }}>
                          <ListItemText primary={spec} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </>
            )}

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth={isMobile}
                onClick={handleContact}
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                  backgroundColor: '#2c3e50',
                  '&:hover': { backgroundColor: '#1f2d3a' }
                }}
              >
                {product.price === 'Fiyat Alınız' ? 'Fiyat Sorun' : 'İletişime Geçin'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* 🔍 Zoom Görsel */}
      <Dialog open={zoomDialogOpen} onClose={() => setZoomDialogOpen(false)} maxWidth="lg" fullWidth>
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
