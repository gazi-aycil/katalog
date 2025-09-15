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
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId || '');
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
    if (categoryId) {
      const selected = categories.find(c => c._id === categoryId);
      if (selected) {
        setCategory(selected.name);
        setSubcategories(selected.subcategories || []);
      }
    } else if (category) {
      const selected = categories.find(c => c.name === category);
      if (selected) {
        setCategoryId(selected._id);
        setSubcategories(selected.subcategories || []);
      }
    } else {
      setSubcategories([]);
    }
    setSubcategory('');
    setSubcategoryId('');
  }, [category, categoryId, categories]);

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
    
    // Kategori ID kontrolü
    if (!categoryId) {
      alert('Lütfen geçerli bir kategori seçin');
      return;
    }

    onSave({
      barcode,
      name,
      description,
      price: Number(price),
      category, // Kategori ismi
      categoryId, // Kategori ID - BU ARTIK ZORUNLU
      subcategory, // Alt kategori ismi
      subcategoryId, // Alt kategori ID
      specs,
      images
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 2 : 4 }}>
      {/* Temel Bilgiler Bölümü */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Temel Bilgiler
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Barkod"
              variant="outlined"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              required
              size="medium"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Ürün Adı"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              size="medium"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fiyat"
              type="number"
              variant="outlined"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              InputProps={{
                endAdornment: <Typography sx={{ ml: 1 }}>₺</Typography>,
                inputProps: { min: 0, step: 0.01 },
              }}
              size="medium"
            />
          </Grid>

          {/* Kategori Seçimi - ID bazlı */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Kategori</InputLabel>
              <Select
                value={categoryId}
                label="Kategori"
                onChange={(e) => setCategoryId(e.target.value)}
                required
                variant="outlined"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300
                    }
                  }
                }}
              >
                <MenuItem value="">Bir kategori seçin</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Alt Kategori Seçimi - ID bazlı */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Alt Kategori</InputLabel>
              <Select
                value={subcategoryId}
                label="Alt Kategori"
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!categoryId}
                variant="outlined"
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300
                    }
                  }
                }}
              >
                <MenuItem value="">
                  {categoryId ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}
                </MenuItem>
                {subcategories.map((subcat, i) => (
                  <MenuItem key={subcat._id || i} value={subcat._id}>
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
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              size="medium"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Özellikler Bölümü */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Özellikler
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          {specs.map((spec, index) => (
            <Chip
              key={index}
              label={spec}
              onDelete={() => handleRemoveSpec(index)}
              size="medium"
              sx={{ mr: 1, mb: 1 }}
              deleteIcon={<Delete fontSize="small" />}
            />
          ))}
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              label="Özellik Ekle"
              variant="outlined"
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              onClick={handleAddSpec}
              variant="contained"
              startIcon={<Add />}
              disabled={!newSpec.trim()}
              fullWidth
              size="large"
              sx={{ height: '56px' }}
            >
              Ekle
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Ürün Resimleri Bölümü */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
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
                        height: 150,
                        borderRadius: 2
                      }}
                      variant="rounded"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
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
                        bottom: 8,
                        left: 8,
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
          size="large"
          sx={{ py: 2 }}
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
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          {images.length < 10 
            ? `${10 - images.length} resim daha ekleyebilirsiniz` 
            : 'Maksimum 10 resim sınırına ulaşıldı'}
        </Typography>
      </Paper>

      {/* Form İşlemleri */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: 2,
        mt: 4
      }}>
        <Button 
          onClick={onCancel} 
          variant="outlined" 
          size="large"
          sx={{ width: 120 }}
        >
          İptal
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          size="large"
          sx={{ width: 160 }}
        >
          Ürünü Kaydet
        </Button>
      </Box>
    </Box>
  );
}