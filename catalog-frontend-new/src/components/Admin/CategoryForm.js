import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  IconButton,
  Avatar,
  Input,
  FormControl,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';
import { uploadProductImages } from '../../services/api';

export default function CategoryForm({ category, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [name, setName] = useState(category?.name || '');
  const [subcategories, setSubcategories] = useState(
    category?.subcategories?.map(sc => ({ 
      name: sc.name, 
      imageUrl: sc.imageUrl || '' 
    })) || []
  );
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newSubcategoryImage, setNewSubcategoryImage] = useState(null);
  const [categoryImage, setCategoryImage] = useState(category?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e, setImage) => {
    const file = e.target.files[0];
    if (!file) return;
  
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await uploadProductImages(formData);
      if (response.data.imageUrls && response.data.imageUrls.length > 0) {
        setImage(response.data.imageUrls[0]);
      }
    } catch (err) {
      console.error('Resim yükleme hatası:', err);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      setSubcategories([...subcategories, {
        name: newSubcategory.trim(),
        imageUrl: newSubcategoryImage || ''
      }]);
      setNewSubcategory('');
      setNewSubcategoryImage(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      imageUrl: categoryImage,
      subcategories
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 1 : 3 }}>
      <Grid container spacing={isMobile ? 1 : 3}>
        {/* Ana Kategori Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2 : 3, 
            border: '1px solid #eee',
            borderRadius: isMobile ? 1 : 2
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
              Kategori Bilgileri
            </Typography>
            
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kategori Adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    disabled={uploading}
                    sx={{ py: isMobile ? 1 : undefined }}
                  >
                    {uploading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        {!isMobile && 'Yükleniyor...'}
                      </Box>
                    ) : (
                      isMobile ? 'Resim Yükle' : 'Kategori Resmi Yükle'
                    )}
                    <Input
                      type="file"
                      hidden
                      onChange={(e) => handleImageUpload(e, setCategoryImage)}
                      accept="image/*"
                    />
                  </Button>
                  {categoryImage && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={categoryImage} 
                        sx={{ 
                          width: isMobile ? 32 : 40, 
                          height: isMobile ? 32 : 40, 
                          mr: 1 
                        }}
                        variant="rounded"
                      />
                      <Typography variant="caption">Resim seçildi</Typography>
                    </Box>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Alt Kategoriler Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2 : 3, 
            border: '1px solid #eee',
            borderRadius: isMobile ? 1 : 2
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
              Alt Kategoriler
            </Typography>
            
            {subcategories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Mevcut Alt Kategoriler
                </Typography>
                <Grid container spacing={isMobile ? 1 : 2}>
                  {subcategories.map((subcat, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper sx={{ 
                        p: isMobile ? 1 : 2, 
                        display: 'flex', 
                        alignItems: 'center',
                        borderRadius: isMobile ? 1 : 2
                      }}>
                        {subcat.imageUrl && (
                          <Avatar 
                            src={subcat.imageUrl} 
                            sx={{ 
                              width: isMobile ? 32 : 40, 
                              height: isMobile ? 32 : 40, 
                              mr: isMobile ? 1 : 2 
                            }}
                            variant="rounded"
                          />
                        )}
                        <Typography sx={{ flexGrow: 1, fontSize: isMobile ? '0.875rem' : '1rem' }}>
                          {subcat.name}
                        </Typography>
                        <IconButton 
                          onClick={() => setSubcategories(subcategories.filter((_, i) => i !== index))}
                          size={isMobile ? "small" : "medium"}
                          color="error"
                        >
                          <Delete fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Typography variant="body2" gutterBottom>
              Yeni Alt Kategori Ekle
            </Typography>
            <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Alt Kategori Adı"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  disabled={uploading}
                  sx={{ py: isMobile ? 1 : undefined }}
                >
                  {uploading ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    'Resim Yükle'
                  )}
                  <Input
                    type="file"
                    hidden
                    onChange={(e) => handleImageUpload(e, setNewSubcategoryImage)}
                    accept="image/*"
                  />
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  onClick={handleAddSubcategory}
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!newSubcategory.trim() || uploading}
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  sx={{ py: isMobile ? 1 : undefined }}
                >
                  {isMobile ? '+' : 'Ekle'}
                </Button>
              </Grid>
            </Grid>
            {newSubcategoryImage && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={newSubcategoryImage} 
                  sx={{ 
                    width: isMobile ? 28 : 32, 
                    height: isMobile ? 28 : 32, 
                    mr: 1 
                  }}
                  variant="rounded"
                />
                <Typography variant="caption">Resim hazır</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Form İşlemleri */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: isMobile ? 1 : 2,
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <Button 
              onClick={onCancel} 
              variant="outlined" 
              size={isMobile ? "medium" : "large"}
              fullWidth={isMobile}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size={isMobile ? "medium" : "large"}
              disabled={uploading}
              fullWidth={isMobile}
            >
              Kategoriyi Kaydet
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}