import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Avatar,
  Input,
  FormControl,
  Typography,
  Divider,
  Stack,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';
import { uploadProductImages } from '../../services/api';

export default function CategoryForm({ category, onSave, onCancel }) {
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
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Ana Kategori Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Kategori Bilgileri
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Kategori Adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    size="small"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Yükleniyor...
                      </>
                    ) : (
                      'Kategori Resmi Yükle'
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
                        sx={{ width: 40, height: 40, mr: 1 }}
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
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Alt Kategoriler
            </Typography>
            
            {/* Mevcut Alt Kategoriler */}
            {subcategories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Mevcut Alt Kategoriler
                </Typography>
                <Grid container spacing={2}>
                  {subcategories.map((subcat, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        {subcat.imageUrl && (
                          <Avatar 
                            src={subcat.imageUrl} 
                            sx={{ width: 40, height: 40, mr: 2 }}
                            variant="rounded"
                          />
                        )}
                        <Typography sx={{ flexGrow: 1 }}>{subcat.name}</Typography>
                        <IconButton 
                          onClick={() => setSubcategories(subcategories.filter((_, i) => i !== index))}
                          size="small"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Yeni Alt Kategori Ekle */}
            <Typography variant="subtitle2" gutterBottom>
              Yeni Alt Kategori Ekle
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Alt Kategori Adı"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                  size="small"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Yükleniyor...
                    </>
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
              <Grid item xs={12} md={2}>
                <Button
                  onClick={handleAddSubcategory}
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!newSubcategory.trim() || uploading}
                  fullWidth
                  size="small"
                >
                  Ekle
                </Button>
              </Grid>
            </Grid>
            {newSubcategoryImage && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={newSubcategoryImage} 
                  sx={{ width: 30, height: 30, mr: 1 }}
                  variant="rounded"
                />
                <Typography variant="caption">Resim hazır</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Form İşlemleri */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel} variant="outlined" size="large">
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size="large"
              disabled={uploading}
            >
              Kategoriyi Kaydet
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}