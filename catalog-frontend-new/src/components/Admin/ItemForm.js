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
  useTheme,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import { Add, Delete, CloudUpload, Close, ImportExport } from '@mui/icons-material';
import { getCategories, uploadProductImages } from '../../services/api';
import ExcelImport from './ExcelImport';

export default function ItemForm({ item, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State'ler - ID bazlı seçim için güncellendi
  const [barcode, setBarcode] = useState(item?.barcode || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [askForPrice, setAskForPrice] = useState(item?.price === 'Fiyat Alınız' || false);
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
  const [excelImportOpen, setExcelImportOpen] = useState(false);

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

  // Mevcut ürün verilerini yükle
  useEffect(() => {
    if (item) {
      setBarcode(item.barcode || '');
      setName(item.name || '');
      setDescription(item.description || '');
      
      // Fiyat ve "Fiyat Alınız" durumunu kontrol et
      if (item.price === 'Fiyat Alınız' || item.price === 'Fiyat Alınız') {
        setAskForPrice(true);
        setPrice(0);
      } else {
        setAskForPrice(false);
        setPrice(item.price || 0);
      }
      
      setCategory(item.category || '');
      setCategoryId(item.categoryId || '');
      setSubcategory(item.subcategory || '');
      setSubcategoryId(item.subcategoryId || '');
      setSpecs(item.specs || []);
      setImages(item.images || []);
      
      console.log('Mevcut ürün yüklendi:', {
        price: item.price,
        askForPrice: item.price === 'Fiyat Alınız'
      });
    }
  }, [item]);

  // Alt kategorileri güncelle
  useEffect(() => {
    if (categoryId) {
      const selectedCategory = categories.find(c => c._id === categoryId);
      if (selectedCategory) {
        setCategory(selectedCategory.name);
        setSubcategories(selectedCategory.subcategories || []);
        
        // Mevcut alt kategoriyi kontrol et
        if (item?.subcategoryId) {
          const existingSubcategory = selectedCategory.subcategories.find(
            sub => sub._id === item.subcategoryId
          );
          if (existingSubcategory) {
            setSubcategory(existingSubcategory.name);
            setSubcategoryId(existingSubcategory._id);
          }
        }
      }
    } else {
      setSubcategories([]);
      setSubcategory('');
      setSubcategoryId('');
    }
  }, [categoryId, categories, item]);

  // "Fiyat Alınız" checkbox'ı değiştiğinde
  const handleAskForPriceChange = (event) => {
    const isChecked = event.target.checked;
    setAskForPrice(isChecked);
    
    if (isChecked) {
      setPrice(0); // Fiyatı sıfırla
    }
  };

  // Fiyat değiştiğinde
  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Eğer "Fiyat Alınız" seçiliyse fiyat girişini engelle
    if (!askForPrice) {
      setPrice(value);
    }
  };

  // Excel Import dialog'ları
  const handleOpenExcelImport = () => {
    setExcelImportOpen(true);
  };

  const handleCloseExcelImport = () => {
    setExcelImportOpen(false);
  };

  // Kategori seçimi değiştiğinde
  const handleCategoryChange = (event) => {
    const selectedCategoryId = event.target.value;
    setCategoryId(selectedCategoryId);
    setSubcategoryId('');
    setSubcategory('');
    
    const selectedCategory = categories.find(c => c._id === selectedCategoryId);
    if (selectedCategory) {
      setCategory(selectedCategory.name);
    }
  };

  // Alt kategori seçimi değiştiğinde
  const handleSubcategoryChange = (event) => {
    const selectedSubcategoryId = event.target.value;
    setSubcategoryId(selectedSubcategoryId);
    
    const selectedSubcategory = subcategories.find(s => s._id === selectedSubcategoryId);
    if (selectedSubcategory) {
      setSubcategory(selectedSubcategory.name);
    }
  };

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
    
    // Fiyat değerini belirle
    const finalPrice = askForPrice ? 'Fiyat Alınız' : Number(price);
    
    // Backend'in beklediği veri yapısı
    const formData = {
      barcode,
      name,
      description,
      price: finalPrice,
      category,
      categoryId,
      subcategory,
      subcategoryId,
      specs,
      images
    };

    // Eğer update işlemiyse, ID'yi de ekle
    if (item && item._id) {
      formData._id = item._id;
    }

    console.log('Gönderilen veri:', formData);
    onSave(formData);
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 2 : 4 }}>
        {/* Temel Bilgiler Bölümü */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Temel Bilgiler
          </Typography>
          
          <Grid container spacing={3}>
            {/* Barkod */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Barkod"
                variant="outlined"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
 {/* Ürün Adı */}
 <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ürün Adı"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            {/* Kategori - ID bazlı seçim */}
            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth 
                size="medium"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              >
                <InputLabel 
                  shrink={!!categoryId}
                  sx={{
                    backgroundColor: 'white',
                    px: 1,
                    ml: -1,
                    transform: categoryId ? 'translate(14px, -6px) scale(0.75)' : 'translate(14px, 20px) scale(1)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    }
                  }}
                >
                  Kategori
                </InputLabel>
                <Select
                  value={categoryId}
                  label="Kategori"
                  onChange={handleCategoryChange}
                  required
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography color="textSecondary">Bir kategori seçin</Typography>;
                    }
                    const selectedCategory = categories.find(c => c._id === selected);
                    return selectedCategory?.name || '';
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        borderRadius: 2,
                        mt: 1,
                      }
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography color="textSecondary">Bir kategori seçin</Typography>
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {cat.name}
                        </Typography>
                        {cat.description && (
                          <Typography variant="caption" color="textSecondary">
                            {cat.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {!categoryId && (
                  <FormHelperText>Ürün için bir kategori seçin</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Alt Kategori - ID bazlı seçim */}
            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth 
                size="medium"
                disabled={!categoryId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              >
                <InputLabel 
                  shrink={!!subcategoryId}
                  sx={{
                    backgroundColor: 'white',
                    px: 1,
                    ml: -1,
                    transform: subcategoryId ? 'translate(14px, -6px) scale(0.75)' : 'translate(14px, 20px) scale(1)',
                    '&.Mui-focused': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                    }
                  }}
                >
                  Alt Kategori
                </InputLabel>
                <Select
                  value={subcategoryId}
                  label="Alt Kategori"
                  onChange={handleSubcategoryChange}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <Typography color={categoryId ? "textSecondary" : "text.disabled"}>
                          {categoryId ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}
                        </Typography>
                      );
                    }
                    const selectedSubcategory = subcategories.find(s => s._id === selected);
                    return selectedSubcategory?.name || '';
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        borderRadius: 2,
                        mt: 1,
                      }
                    }
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography color="textSecondary">
                      {categoryId ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}
                    </Typography>
                  </MenuItem>
                  {subcategories.map((subcat) => (
                    <MenuItem key={subcat._id} value={subcat._id}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {subcat.name}
                        </Typography>
                        {subcat.description && (
                          <Typography variant="caption" color="textSecondary">
                            {subcat.description}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {categoryId && !subcategoryId && (
                  <FormHelperText>İsteğe bağlı olarak bir alt kategori seçin</FormHelperText>
                )}
              </FormControl>
            </Grid>

           

            {/* Fiyat ve Fiyat Alınız */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <TextField
                  fullWidth
                  label={askForPrice ? "Fiyat Alınız" : "Fiyat"}
                  type="number"
                  variant="outlined"
                  value={askForPrice ? "" : price}
                  onChange={handlePriceChange}
                  required={!askForPrice}
                  disabled={askForPrice}
                  InputProps={{
                    endAdornment: !askForPrice ? <Typography sx={{ ml: 1 }}>₺</Typography> : null,
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#d32f2f',
                      fontWeight: 'bold'
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={askForPrice}
                      onChange={handleAskForPriceChange}
                      color="primary"
                    />
                  }
                  label="Fiyat Alınız"
                  sx={{ 
                    whiteSpace: 'nowrap',
                    mt: 1,
                    '& .MuiFormControlLabel-label': {
                      fontWeight: askForPrice ? 'bold' : 'normal',
                      color: askForPrice ? '#d32f2f' : 'inherit'
                    }
                  }}
                />
              </Box>
              {askForPrice && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  Bu ürün için fiyat bilgisi "Fiyat Alınız" olarak kaydedilecektir.
                </Typography>
              )}
            </Grid>

            {/* Açıklama */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                size="large"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
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
                size="large"
                sx={{ 
                  mr: 1, 
                  mb: 1,
                  borderRadius: 1,
                  fontWeight: 'medium'
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSpec();
                  }
                }}
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
                sx={{ 
                  height: '56px',
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
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
                          borderRadius: 2,
                          boxShadow: 2
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
                          borderRadius: 1,
                          fontSize: '0.7rem'
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
            sx={{ 
              py: 2,
              borderRadius: 2,
              borderStyle: 'dashed',
              borderWidth: 2
            }}
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
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
            {images.length < 10 
              ? `${10 - images.length} resim daha ekleyebilirsiniz` 
              : 'Maksimum 10 resim sınırına ulaşıldı'}
          </Typography>
        </Paper>

        {/* Form İşlemleri */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 4,
          p: 3,
          bgcolor: 'grey.50',
          borderRadius: 2,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <ButtonGroup sx={{ order: isMobile ? 2 : 1 }}>
            <Button 
              onClick={onCancel} 
              variant="outlined" 
              size="large"
              sx={{ 
                width: 120,
                borderRadius: 2
              }}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size="large"
              sx={{ 
                width: 160,
                borderRadius: 2,
                fontWeight: 'bold'
              }}
              disabled={!categoryId}
            >
              {item ? 'Ürünü Güncelle' : 'Ürünü Kaydet'}
            </Button>
          </ButtonGroup>

          {/* Excel Import Butonu */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ImportExport />}
            onClick={handleOpenExcelImport}
            size="large"
            sx={{ 
              order: isMobile ? 1 : 2,
              borderWidth: 2,
              borderRadius: 2,
              fontWeight: 'bold',
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Excel Import
          </Button>
        </Box>
      </Box>

      {/* Excel Import Dialog */}
      <Dialog
        open={excelImportOpen}
        onClose={handleCloseExcelImport}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxWidth: '1200px',
            width: '95%',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white',
          m: 0,
          p: 2,
          borderRadius: '8px 8px 0 0'
        }}>
          <Typography variant="h6" component="div" fontWeight="bold">
            📊 Excel ile Toplu Ürün İşlemleri
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseExcelImport}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <ExcelImport onBack={handleCloseExcelImport} />
        </DialogContent>
      </Dialog>
    </>
  );
}