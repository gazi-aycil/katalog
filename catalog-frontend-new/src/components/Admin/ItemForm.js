import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  Avatar,
  Paper,
  Stack,
  CircularProgress,
  Input
} from '@mui/material';
import { Add, Delete, CloudUpload, Close } from '@mui/icons-material';
import { getCategories, uploadProductImages } from '../../services/api';

export default function ItemForm({ item, onSave, onCancel }) {
  // Temel alanlar
  const [barcode, setBarcode] = useState(item?.barcode || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [category, setCategory] = useState(item?.category || '');
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [specs, setSpecs] = useState(item?.specs || []);
  const [newSpec, setNewSpec] = useState('');

  // Resim yönetimi
  const [images, setImages] = useState(item?.images || []);
  const [uploading, setUploading] = useState(false);

  // Kategori verileri
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Bileşen yüklendiğinde kategorileri getir
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Kategoriler alınırken hata oluştu', err);
      }
    };
    fetchCategories();
  }, []);

  // Kategori değiştiğinde alt kategorileri güncelle
  useEffect(() => {
    if (category) {
      const selected = categories.find(c => c.name === category);
      setSubcategories(selected?.subcategories || []);
    } else {
      setSubcategories([]);
    }
    setSubcategory('');
  }, [category, categories]);

  // Resim yükleme işleyicisi
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - images.length);
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      const response = await uploadProductImages(formData);
      setImages(prev => [...prev, ...response.data.imageUrls]);
    } catch (err) {
      console.error('Yükleme başarısız:', err);
    } finally {
      setUploading(false);
    }
  };

  // Resmi kaldır
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Özellik yönetimi
  const handleAddSpec = () => {
    if (newSpec.trim()) {
      setSpecs([...specs, newSpec.trim()]);
      setNewSpec('');
    }
  };

  const handleRemoveSpec = (index) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  // Form gönderimi
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      barcode,
      name,
      description,
      price: Number(price),
      category,
      subcategory,
      specs,
      images
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Temel Bilgiler Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Temel Bilgiler
            </Typography>
            
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Barkod"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '60px',
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                      transform: name ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Ürün Adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '60px',
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                      transform: name ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fiyat"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <Typography sx={{ ml: 1 }}>TRY</Typography>
                    ),
                    inputProps: { min: 0, step: 0.01 },
                    sx: {
                      height: '60px',
                      fontSize: '1.1rem',
                      '& input': {
                        textAlign: 'right'
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { 
                      fontSize: '1rem',
                      transform: price ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel 
                    sx={{ 
                      fontSize: '1rem',
                      transform: category ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }}
                    shrink={Boolean(category)}
                  >
                    Kategori
                  </InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    displayEmpty
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '16px 14px',
                        fontSize: '1.1rem',
                        height: '60px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        top: 0
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    <MenuItem disabled value="">
                      <em>Bir kategori seçin</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem 
                        key={cat._id} 
                        value={cat.name} 
                        sx={{ 
                          fontSize: '1rem',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel 
                    sx={{ 
                      fontSize: '1rem',
                      transform: subcategory ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }}
                    shrink={Boolean(subcategory)}
                  >
                    Alt Kategori
                  </InputLabel>
                  <Select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    disabled={!category}
                    displayEmpty
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '16px 14px',
                        fontSize: '1.1rem',
                        height: '60px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        top: 0
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    <MenuItem disabled value="">
                      <em>{category ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}</em>
                    </MenuItem>
                    {subcategories.map((subcat, i) => (
                      <MenuItem 
                        key={i} 
                        value={subcat.name}
                        sx={{ 
                          fontSize: '1rem',
                          height: '48px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {subcat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      height: '60px',
                      fontSize: '1.1rem'
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                      transform: description ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 20px)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ürün Resimleri Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Ürün Resimleri ({images.length}/10)
            </Typography>

            {images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  {images.map((img, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={img}
                          sx={{ 
                            width: '100%', 
                            height: 120,
                            borderRadius: 1
                          }}
                          variant="rounded"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0,0,0,0.7)'
                            }
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                        <Typography 
                          variant="caption" 
                          sx={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            px: 1,
                            borderRadius: 1
                          }}
                        >
                          Resim {index + 1}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              disabled={images.length >= 10 || uploading}
              fullWidth
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Yükleniyor...
                </>
              ) : (
                'Resim Ekle'
              )}
              <Input
                type="file"
                hidden
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                disabled={images.length >= 10 || uploading}
              />
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {images.length < 10 
                ? `${10 - images.length} resim daha ekleyebilirsiniz` 
                : 'Maksimum 10 resim sınırına ulaşıldı'}
            </Typography>
          </Paper>
        </Grid>

        {/* Özellikler Bölümü */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Özellikler
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {specs.map((spec, index) => (
                <Chip
                  key={index}
                  label={spec}
                  onDelete={() => handleRemoveSpec(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Özellik Ekle"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  onClick={handleAddSpec}
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!newSpec.trim()}
                  fullWidth
                >
                  Ekle
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Form İşlemleri */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onCancel} variant="outlined" size="large">
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size="large"
            >
              Ürünü Kaydet
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}