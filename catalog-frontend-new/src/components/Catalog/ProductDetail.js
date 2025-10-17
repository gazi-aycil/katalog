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
            px: 2,
            py: 1,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            textAlign: 'center',
          }}
        />
      );
    }
    const value = typeof price === 'string' ? parseFloat(price) : price;
    if (!isNaN(value)) {
      return (
        <Typography
          variant="h4"
          color="primary"
          gutterBottom
          sx={{
            fontWeight: 600,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
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
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          textAlign: 'center',
        }}
      />
    );
  };

  const handleContact = () => {
    const phone = "905326111641";
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

  return (
    <Box
      sx={{
        maxWidth: '1200px',
        margin: '0 auto',
        px: 2,
        py: 4,
      }}
    >
      <Grid
        container
        spacing={4}
        alignItems="flex-start"
        justifyContent="center"
      >
        {/* SOL TARAF: SABİT GÖRSEL */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: 400,
              height: 400,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#f8f9fa',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
              alt={product.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
              onError={(e) => (e.target.src = '/placeholder-product.jpg')}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:hover': { backgroundColor: 'white' },
              }}
              onClick={() => setZoomDialogOpen(true)}
            >
              <ZoomInIcon />
            </IconButton>
          </Box>

          {/* Küçük Görseller */}
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
                      backgroundColor: '#fff',
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* SAĞ TARAF: SABİT DÜZENLİ ALAN */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            wordBreak: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          {/* ÜRÜN ADI */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {product.name}
          </Typography>

          {/* KATEGORİLER */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1,
            }}
          >
            {product.category && (
              <Chip
                label={product.category}
                color="primary"
                variant="outlined"
                sx={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              />
            )}
            {product.subcategory && (
              <Chip
                label={product.subcategory}
                variant="outlined"
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              />
            )}
          </Box>

          {/* FİYAT */}
          {renderPrice(product.price)}

          {/* BARKOD */}
          {product.barcode && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                wordBreak: 'break-word',
              }}
            >
              Barkod: {product.barcode}
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* AÇIKLAMA */}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ürün Açıklaması
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              textAlign: 'justify',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {product.description || 'Bu ürün için açıklama bulunmamaktadır.'}
          </Typography>

          {/* TEKNİK ÖZELLİKLER */}
          {product.specs?.length > 0 && (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600, mt: 2 }}>
                Teknik Özellikler
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 2,
                  mt: 1,
                }}
              >
                {product.specs.map((spec, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      wordBreak: 'break-word',
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        mt: '7px',
                        borderRadius: '50%',
                        backgroundColor: theme.palette.text.primary,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}
                    >
                      {spec}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          {/* İLETİŞİM BUTONU */}
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
                '&:hover': { backgroundColor: '#1f2d3a' },
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}
            >
              {product.price === 'Fiyat Alınız' ? 'Fiyat Sorun' : 'İletişime Geçin'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* ZOOM DİYALOG */}
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
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProductDetail;
