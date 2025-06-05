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
  CircularProgress,
  Input,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Delete, CloudUpload, Close } from '@mui/icons-material';
import { getCategories, uploadProductImages } from '../../services/api';

export default function ItemForm({ item, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State'ler
  const [barcode, setBarcode] = useState(item?.barcode || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [category, setCategory] = useState(item?.category || '');
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [specs, setSpecs] = useState(item?.specs || []);
  const [newSpec, setNewSpec] = useState('');
  const [images, setImages] = useState(item?.images || []);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Kategorileri yükle
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

  // Alt kategorileri güncelle
  useEffect(() => {
    if (category) {
      const selected = categories.find(c => c.name === category);
      setSubcategories(selected?.subcategories || []);
    } else {
      setSubcategories([]);
    }
    setSubcategory('');
  }, [category, categories]);

  // Resim yükleme
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

  // Diğer fonksiyonlar...
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    if (newSpec.trim()) {
      setSpecs([...specs, newSpec.trim()]);
      setNewSpec('');
    }
  };

  const handleRemoveSpec = (index) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

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
    <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 1 : 3 }}>
      <Grid container spacing={isMobile ? 1 : 3}>
        {/* Temel Bilgiler */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2 : 3, 
            border: '1px solid #eee',
            borderRadius: isMobile ? 1 : 2
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
              Temel Bilgiler
            </Typography>
            
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Barkod"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  required
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Ürün Adı"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  size={isMobile ? "small" : "medium"}
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
                    endAdornment: <Typography sx={{ ml: 1 }}>₺</Typography>,
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Kategori</InputLabel>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <MenuItem value="">Bir kategori seçin</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Alt Kategori</InputLabel>
                  <Select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    disabled={!category}
                  >
                    <MenuItem value="">
                      {category ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}
                    </MenuItem>
                    {subcategories.map((subcat, i) => (
                      <MenuItem key={i} value={subcat.name}>
                        {subcat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={isMobile ? 3 : 4}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ürün Resimleri */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2 : 3, 
            border: '1px solid #eee',
            borderRadius: isMobile ? 1 : 2
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
              Ürün Resimleri ({images.length}/10)
            </Typography>

            {images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={isMobile ? 1 : 2}>
                  {images.map((img, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={img}
                          sx={{ 
                            width: '100%', 
                            height: isMobile ? 100 : 120,
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
              size={isMobile ? "medium" : "large"}
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

        {/* Özellikler */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: isMobile ? 2 : 3, 
            border: '1px solid #eee',
            borderRadius: isMobile ? 1 : 2
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom sx={{ fontWeight: 600 }}>
              Özellikler
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {specs.map((spec, index) => (
                <Chip
                  key={index}
                  label={spec}
                  onDelete={() => handleRemoveSpec(index)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
            
            <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Özellik Ekle"
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  onClick={handleAddSpec}
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!newSpec.trim()}
                  fullWidth
                  size={isMobile ? "medium" : "large"}
                >
                  Ekle
                </Button>
              </Grid>
            </Grid>
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
              fullWidth={isMobile}
            >
              Ürünü Kaydet
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}