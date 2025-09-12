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
      
      <Grid container spacing={4}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category._id}>
            <Card 
              sx={{ 
                cursor: 'pointer', 
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                }
              }}
              onClick={() => onCategorySelect(category)}
            >
              <CardMedia
                component="img"
                height="240"
                image={category.imageUrl || '/placeholder-category.jpg'}
                alt={category.name}
                sx={{ 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1
                  }}
                >
                  {category.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
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