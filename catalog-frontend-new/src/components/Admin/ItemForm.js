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
  Tabs,
  Tab, // ✅ Eksik import eklendi
} from '@mui/material';
import { Add, Delete, CloudUpload, Close, ImportExport } from '@mui/icons-material';
import { getCategories, uploadProductImages } from '../../services/api';
import ExcelImport from './ExcelImport';

// Özellik ayarları için localStorage key
const FEATURES_STORAGE_KEY = 'product_features';

// Özellik türleri
const FEATURE_TYPES = {
  USAGE_AREA: 'usage_area',
  PRODUCT_MEASUREMENTS: 'product_measurements'
};

// Özellikleri localStorage'dan yükleyen fonksiyon
const loadFeaturesFromStorage = () => {
  try {
    const savedFeatures = localStorage.getItem(FEATURES_STORAGE_KEY);
    return savedFeatures ? JSON.parse(savedFeatures) : [];
  } catch (error) {
    console.error('Özellikler yüklenirken hata:', error);
    return [];
  }
};

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
  
  // Özellik ayarları state'leri
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showFeatureSelection, setShowFeatureSelection] = useState(false);
  const [measurementValues, setMeasurementValues] = useState({}); // ✅ Eksik state eklendi
  const [featureTabValue, setFeatureTabValue] = useState(0); // ✅ Tab state'i eklendi

  // Özellikleri yeniden yükleme fonksiyonu
  const refreshFeatures = () => {
    const features = loadFeaturesFromStorage();
    setAvailableFeatures(features);
    
    // Mevcut ürünün özelliklerini seçili hale getir
    if (item?.specs && item.specs.length > 0) {
      const selected = features.filter(feature => 
        item.specs.some(spec => spec.includes(feature.name))
      );
      setSelectedFeatures(selected);
    }
  };

  // Kayıtlı özellikleri localStorage'dan yükle
  useEffect(() => {
    refreshFeatures();
  }, [item]);

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
      
      // Ölçü değerlerini ayarla
      if (item.specs) {
        const values = {};
        item.specs.forEach(spec => {
          if (spec.includes(':')) {
            const [name, value] = spec.split(':').map(s => s.trim());
            const feature = availableFeatures.find(f => f.name === name && f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS);
            if (feature) {
              values[feature.id] = value;
            }
          }
        });
        setMeasurementValues(values);
      }
    }
  }, [item, availableFeatures]);

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

  // ✅ Eksik fonksiyonlar eklendi
  const handleFeatureTabChange = (event, newValue) => {
    setFeatureTabValue(newValue);
  };

  const handleMeasurementValueChange = (featureId, value) => {
    setMeasurementValues(prev => ({
      ...prev,
      [featureId]: value
    }));
  };

  // Özellik seçimini toggle et
  const handleFeatureToggle = (feature) => {
    setSelectedFeatures(prev => {
      const isSelected = prev.find(f => f.id === feature.id);
      if (isSelected) {
        // Seçimi kaldırırsa, ölçü değerini de temizle
        setMeasurementValues(prev => {
          const newValues = { ...prev };
          delete newValues[feature.id];
          return newValues;
        });
        return prev.filter(f => f.id !== feature.id);
      } else {
        return [...prev, feature];
      }
    });
  };

  // Seçilen özellikleri specs'e ekle
  const applySelectedFeatures = () => {
    const featureEntries = selectedFeatures.map(f => {
      if (f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS && measurementValues[f.id]) {
        return `${f.name}: ${measurementValues[f.id]}`;
      }
      return f.name;
    });
    
    setSpecs(prev => {
      // Mevcut özellikleri koru, sadece çakışmaları önle
      const existingSpecs = prev.filter(spec => {
        const specName = spec.split(':')[0].trim();
        return !featureEntries.some(fn => fn.split(':')[0].trim() === specName);
      });
      return [...existingSpecs, ...featureEntries];
    });
    
    setShowFeatureSelection(false);
  };

  // Özellik seçim dialogunu aç
  const handleOpenFeatureSelection = () => {
    // Dialog açılmadan önce özellikleri yeniden yükle
    refreshFeatures();
    setShowFeatureSelection(true);
  };

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
        {/* ... Diğer form bölümleri aynı kalacak ... */}
        
        {/* Özellikler Bölümü */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Özellikler
            </Typography>
            
            {/* Buton her zaman görünsün, sadece özellik yoksa disabled olsun */}
            <Button
              variant="outlined"
              onClick={handleOpenFeatureSelection}
              disabled={availableFeatures.length === 0}
              sx={{ borderRadius: 2 }}
            >
              Özellik Seç ({availableFeatures.length})
            </Button>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            {specs.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                Henüz özellik eklenmemiş
              </Typography>
            ) : (
              specs.map((spec, index) => (
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
              ))
            )}
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

          {/* Bilgi mesajı */}
          {availableFeatures.length === 0 && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Özellik seçmek için önce "Özellik Ayarları" sayfasından özellik ekleyin.
            </Typography>
          )}
        </Paper>

        {/* ... Diğer form bölümleri aynı kalacak ... */}
      </Box>

      {/* ✅ DÜZELTİLMİŞ: Özellik Seçim Dialog */}
      <Dialog
        open={showFeatureSelection}
        onClose={() => setShowFeatureSelection(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Özellik Seçimi
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Tabs value={featureTabValue} onChange={handleFeatureTabChange} sx={{ mb: 2 }}>
            <Tab label="Kullanım Alanları" />
            <Tab label="Ürün Ölçüleri" />
          </Tabs>

          <Grid container spacing={3}>
            {/* Kullanım Alanları */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Kullanım Alanları
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {availableFeatures.filter(f => f.type === FEATURE_TYPES.USAGE_AREA).length > 0 ? (
                  availableFeatures.filter(f => f.type === FEATURE_TYPES.USAGE_AREA).map((feature) => (
                    <FormControlLabel
                      key={feature.id}
                      control={
                        <Checkbox
                          checked={selectedFeatures.some(f => f.id === feature.id)}
                          onChange={() => handleFeatureToggle(feature)}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {feature.name}
                          </Typography>
                          {feature.description && (
                            <Typography variant="caption" color="textSecondary">
                              {feature.description}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{ width: '100%', mb: 1, display: 'block' }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    Henüz kullanım alanı eklenmemiş
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Ürün Ölçüleri */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Ürün Ölçüleri (Değerli Özellikler)
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {availableFeatures.filter(f => f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS).length > 0 ? (
                  availableFeatures.filter(f => f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS).map((feature) => (
                    <Box key={feature.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedFeatures.some(f => f.id === feature.id)}
                            onChange={() => handleFeatureToggle(feature)}
                            color="secondary"
                          />
                        }
                        label={
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="body1" fontWeight="medium">
                              {feature.name}
                            </Typography>
                            {feature.description && (
                              <Typography variant="caption" color="textSecondary">
                                {feature.description}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{ width: '100%', mb: 1 }}
                      />
                      {selectedFeatures.some(f => f.id === feature.id) && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={`${feature.name} değerini girin`}
                          value={measurementValues[feature.id] || ''}
                          onChange={(e) => handleMeasurementValueChange(feature.id, e.target.value)}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    Henüz ürün ölçüsü eklenmemiş
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={() => setShowFeatureSelection(false)} variant="outlined">
              İptal
            </Button>
            <Button onClick={applySelectedFeatures} variant="contained" disabled={selectedFeatures.length === 0}>
              Seçilenleri Ekle ({selectedFeatures.length})
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog (Aynı kalacak) */}
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