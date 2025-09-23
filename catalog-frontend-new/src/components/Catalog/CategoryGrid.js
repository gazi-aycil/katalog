import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';

const CategoryGrid = ({ categories, onCategorySelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box>
      <Typography 
        variant="h4" 
        align="center" 
        gutterBottom 
        sx={{ 
          mb: 6, 
          fontWeight: 300,
          color: '#2c3e50'
        }}
      >
        Ürün Kataloğu
      </Typography>
      
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={3} key={category._id}>
            <Card 
              sx={{ 
                height: '380px', // Sabit yükseklik
                cursor: 'pointer', 
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => onCategorySelect(category)}
            >
              {/* Görsel Container - Sabit Boyut */}
              <Box 
                sx={{ 
                  height: '200px', // Sabit görsel yüksekliği
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0 // Görsel boyutunun sabit kalmasını sağlar
                }}
              >
                <CardMedia
                  component="img"
                  image={category.imageUrl || '/placeholder-category.jpg'}
                  alt={category.name}
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
                    e.target.src = '/placeholder-category.jpg';
                  }}
                />
                {/* Alt kategori sayısı badge */}
                {category.subcategories?.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {category.subcategories.length} alt kategori
                  </Box>
                )}
              </Box>
              
              {/* İçerik Alanı - Sabit Yükseklik ve Text Wrap */}
              <CardContent 
                sx={{ 
                  flex: 1,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  overflow: 'hidden',
                  minHeight: '180px' // Minimum içerik yüksekliği
                }}
              >
                {/* Kategori Adı - Text Wrap Özellikli */}
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      display: '-webkit-box',
                      WebkitLineClamp: 3, // Maksimum 3 satır
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                      wordBreak: 'break-word', // Uzun kelimeleri böler
                      hyphens: 'auto' // Tire ile kelime bölme
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
                
                {/* Alt Kategori Bilgisi - Sabit Alt Alan */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    flexShrink: 0 // Alt alanın sabit kalmasını sağlar
                  }}
                >
                  {category.subcategories?.length > 0 
                    ? `${category.subcategories.length} alt kategori` 
                    : 'Ürünleri görüntüle'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CategoryGrid;