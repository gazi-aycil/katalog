import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box
} from '@mui/material';

const CategoryGrid = ({ categories, onCategorySelect }) => {
  // categories prop'unu kontrol et ve güvenli hale getir
  const safeCategories = Array.isArray(categories) ? categories : [];

  console.log('📊 CategoryGrid - Kategori Sayısı:', safeCategories.length);
  console.log('🔍 CategoryGrid - Kategori Verisi:', safeCategories);

  // Eğer kategori yoksa mesaj göster
  if (safeCategories.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h6" color="text.secondary">
          Kategori bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Henüz hiç kategori eklenmemiş.
        </Typography>
      </Box>
    );
  }

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
        {safeCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={3} key={category._id || index}>
            <Card 
              sx={{ 
                height: '350px',
                width: '100%',
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
              {/* GÖRSEL */}
              <Box 
                sx={{ 
                  height: '200px',
                  width: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0
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
                  }}
                />
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
              
              {/* İÇERİK */}
              <CardContent 
                sx={{ 
                  height: '150px',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ 
                  height: '70px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ 
                      fontWeight: 600,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
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