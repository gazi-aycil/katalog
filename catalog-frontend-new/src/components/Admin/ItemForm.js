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
} from '@mui/material';
import { Add, Delete, CloudUpload, Close, ImportExport } from '@mui/icons-material';
import { getCategories, uploadProductImages } from '../../services/api';
import ExcelImport from './ExcelImport';

export default function ItemForm({ item, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State'ler - YENİ: categoryId ve subcategoryId eklendi
  const [barcode, setBarcode] = useState(item?.barcode || '');
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [category, setCategory] = useState(item?.category || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || ''); // YENİ
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [subcategoryId, setSubcategoryId] = useState(item?.subcategoryId || ''); // YENİ
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
      setPrice(item.price || 0);
      setCategory(item.category || '');
      setCategoryId(item.categoryId || '');
      setSubcategory(item.subcategory || '');
      setSubcategoryId(item.subcategoryId || '');
      setSpecs(item.specs || []);
      setImages(item.images || []);
    }
  }, [item]);

  // Alt kategorileri güncelle
  useEffect(() => {
    if (categoryId) {
      const selectedCategory = categories.find(c => c._id === categoryId);
      if (selectedCategory) {
        setCategory(selectedCategory.name);
        setSubcategories(selectedCategory.subcategories || []);
      }
    } else {
      setSubcategories([]);
    }
    setSubcategory('');
    setSubcategoryId('');
  }, [categoryId, categories]);

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
    
    // Backend'in beklediği veri yapısı
    const formData = {
      barcode,
      name,
      description,
      price: Number(price),
      category,           // kategori adı
      categoryId,         // kategori ID - ZORUNLU
      subcategory,        // alt kategori adı
      subcategoryId,      // alt kategori ID
      specs,
      images
    };

    console.log('Gönderilen veri:', formData); // Debug için
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
              />
            </Grid>

            {/* Kategori - GÜNCELLENDİ: ID bazlı seçim */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={categoryId}
                  label="Kategori"
                  onChange={handleCategoryChange}
                  required
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

            {/* Alt Kategori - GÜNCELLENDİ: ID bazlı seçim */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel>Alt Kategori</InputLabel>
                <Select
                  value={subcategoryId}
                  label="Alt Kategori"
                  onChange={handleSubcategoryChange}
                  disabled={!categoryId}
                >
                  <MenuItem value="">
                    {categoryId ? 'Bir alt kategori seçin' : 'Önce kategori seçin'}
                  </MenuItem>
                  {subcategories.map((subcat) => (
                    <MenuItem key={subcat._id} value={subcat._id}>
                      {subcat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              />
            </Grid>

            {/* Fiyat */}
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
                size="medium"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ... (Diğer bölümler aynı kalacak) ... */}

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
              disabled={!categoryId} // Kategori seçilmeden gönderilemez
            >
              Ürünü Kaydet
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
            width: '95%'
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
          p: 2
        }}>
          <Typography variant="h6" component="div">
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