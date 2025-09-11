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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
       
      </Box>
    );
  }

  return (
    <Box>
      {/* Ürün Detay İçeriği */}
      <Grid container spacing={6}>
        {/* Ürün Görselleri */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
              alt={product.name}
              sx={{
                width: '100%',
                height: isMobile ? '300px' : '500px',
                objectFit: 'cover',
                borderRadius: 2,
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
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
            <Grid container spacing={1} sx={{ mt: 2 }}>
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
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: selectedImage === index ? '2px solid' : '1px solid',
                      borderColor: selectedImage === index ? 'primary.main' : 'divider',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Ürün Bilgileri */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 300, mb: 2 }}>
              {product.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Chip 
                label={product.category} 
                sx={{ mr: 1 }} 
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

            <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              {product.price?.toFixed(2)} ₺
            </Typography>

            {product.barcode && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Barkod: {product.barcode}
              </Typography>
            )}

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Ürün Açıklaması
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, mb: 4 }}>
              {product.description || 'Bu ürün için açıklama bulunmamaktadır.'}
            </Typography>

            {product.specs && product.specs.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                  Teknik Özellikler
                </Typography>
                <List dense>
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

            <Button
              variant="contained"
              size="large"
              sx={{ 
                mt: 4,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem'
              }}
            >
              İletişime Geçin
            </Button>
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