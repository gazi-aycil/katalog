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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
          <Grid item xs={12} sm={6} md={3} key={category._id}> {/* Her satırda 4 kart */}
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
                  position: 'relative'
                }}
              >
                <CardMedia
                  component="img"
                  image={category.imageUrl || '/placeholder-category.jpg'}
                  alt={category.name}
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover', // Görseli container'a sığdır
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
              
              {/* İçerik Alanı - Sabit Yükseklik */}
              <CardContent 
                sx={{ 
                  flexGrow: 1,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    minHeight: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {category.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    mt: 'auto'
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