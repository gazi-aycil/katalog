// src/components/Catalog/ProductDetail.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  Divider,
  useMediaQuery,
  useTheme,
  Grid
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'flex-start',
          gap: 4,
        }}
      >
        {/* SOL: SABİT GÖRSEL */}
        <Box
          sx={{
            width: 400,
            height: 400,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#f8f9fa',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
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

        {/* SAĞ: ÜRÜN BİLGİLERİ */}
        <Box
          sx={{
            flex: 1,
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
            }}
          >
            {product.name}
          </Typography>

          {/* KATEGORİLER */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
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
              overflow: 'visible',
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
        </Box>
      </Box>

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
