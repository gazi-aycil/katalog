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
  const safeCategories = Array.isArray(categories) ? categories : [];

  console.log('📊 CategoryGrid - Kategori Sayısı:', safeCategories.length);

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

      {/* KATEGORİ GRID */}
      <Grid 
        container 
        spacing={3} 
        justifyContent="center"
      >
        {safeCategories.map((category, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={3} 
            key={category._id || index}
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Card 
              sx={{ 
                width: 260,               // SABİT GENİŞLİK
                height: 340,              // SABİT YÜKSEKLİK
                cursor: 'pointer', 
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => onCategorySelect(category)}
            >
              {/* FOTOĞRAF ALANI */}
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
                  image={category.imageUrl || '/placeholder-category.jpg'}
                  alt={category.name}
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',    // ORANI KORUYARAK KIRP
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-category.jpg';
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
                      fontWeight: 600,
                      zIndex: 1
                    }}
                  >
                    {category.subcategories.length} alt kategori
                  </Box>
                )}
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
                {/* KATEGORİ İSMİ */}
                <Typography 
                  variant="h6" 
                  component="div" 
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
                  {category.name}
                </Typography>

                {/* ALT KATEGORİ BİLGİSİ */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word'
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
