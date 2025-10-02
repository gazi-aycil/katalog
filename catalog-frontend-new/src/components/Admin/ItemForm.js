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
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Tabs,
  Tab,
  Breadcrumbs,
  Alert,
  Collapse
} from '@mui/material';
import { Add, Delete, CloudUpload, Close, NavigateNext } from '@mui/icons-material';
import { getCategories, uploadProductImages, getFeatures } from '../../services/api';

// Özellik türleri
const FEATURE_TYPES = {
  USAGE_AREA: 'usage_area',
  PRODUCT_MEASUREMENTS: 'product_measurements',
  PRODUCT_PROPERTIES: 'product_properties'
};

// Kategori seviye renkleri (ANA KATEGORİ + 4 SEVİYE)
const CATEGORY_LEVEL_COLORS = {
  0: { bg: '#ffebee', border: '#c62828', text: '#b71c1c' },
  1: { bg: '#e3f2fd', border: '#1976d2', text: '#1565c0' },
  2: { bg: '#f3e5f5', border: '#7b1fa2', text: '#6a1b9a' },
  3: { bg: '#e8f5e8', border: '#388e3c', text: '#2e7d32' },
  4: { bg: '#fff3e0', border: '#f57c00', text: '#ef6c00' }
};

export default function ItemForm({ item, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State'ler
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [askForPrice, setAskForPrice] = useState(false);
  const [specs, setSpecs] = useState([]);
  const [newSpec, setNewSpec] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [showExcelSection, setShowExcelSection] = useState(false);
  
  // Kategori state'leri
  const [selectedCategories, setSelectedCategories] = useState({
    main: { id: '', name: '', data: null },
    level1: { id: '', name: '', data: null },
    level2: { id: '', name: '', data: null },
    level3: { id: '', name: '', data: null },
    level4: { id: '', name: '', data: null }
  });
  
  const [availableSubcategories, setAvailableSubcategories] = useState({
    main: [],
    level1: [],
    level2: [],
    level3: [],
    level4: []
  });
  
  // Özellik state'leri
  const [availableFeatures, setAvailableFeatures] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showFeatureSelection, setShowFeatureSelection] = useState(false);
  const [measurementValues, setMeasurementValues] = useState({});
  const [featureTabValue, setFeatureTabValue] = useState(0);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  // Özellikleri API'dan yükle
  const loadFeaturesFromAPI = async () => {
    setLoadingFeatures(true);
    try {
      const response = await getFeatures();
      setAvailableFeatures(response.data || []);
    } catch (error) {
      console.error('Özellikler yüklenirken hata:', error);
      setError('Özellikler yüklenirken hata oluştu');
    } finally {
      setLoadingFeatures(false);
    }
  };

  // Kategori hiyerarşisini bulan fonksiyon
  const findCategoryHierarchy = (cats, targetId, currentPath = []) => {
    for (const category of cats) {
      const newPath = [...currentPath, category];
      
      if (category._id === targetId) {
        return newPath;
      }
      
      if (category.subcategories && category.subcategories.length > 0) {
        const result = findCategoryHierarchy(category.subcategories, targetId, newPath);
        if (result) return result;
      }
    }
    return null;
  };

  // Özellikleri API'dan yükle
  useEffect(() => {
    loadFeaturesFromAPI();
  }, []);

  // Kategorileri yükle
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
        setAvailableSubcategories(prev => ({
          ...prev,
          main: response.data
        }));
      } catch (err) {
        console.error('Kategoriler alınırken hata oluştu', err);
        setError('Kategoriler yüklenirken hata oluştu');
      }
    };
    fetchCategories();
  }, []);

  // Kategoriler yüklendiğinde mevcut ürünün kategorisini ayarla
  useEffect(() => {
    if (item && categories.length > 0) {
      setupCategoriesFromItem(item);
    }
  }, [categories, item]);

  // Mevcut ürün verilerini yükle
  useEffect(() => {
    if (item) {
      setBarcode(item.barcode || '');
      setName(item.name || '');
      setDescription(item.description || '');
      
      if (item.price === 'Fiyat Alınız') {
        setAskForPrice(true);
        setPrice(0);
      } else {
        setAskForPrice(false);
        setPrice(item.price || 0);
      }
      
      setSpecs(item.specs || []);
      setImages(item.images || []);

      if (categories.length > 0) {
        setupCategoriesFromItem(item);
        setupFeaturesAndMeasurements(item.specs || []);
      }
    } else {
      resetForm();
    }
  }, [item]);

  // Ürün verilerinden kategori bilgilerini ayarla
  const setupCategoriesFromItem = (product) => {
    if (!product.categoryId) return;

    const hierarchy = findCategoryHierarchy(categories, product.categoryId);
    
    if (hierarchy) {
      const newSelectedCategories = {
        main: { id: '', name: '', data: null },
        level1: { id: '', name: '', data: null },
        level2: { id: '', name: '', data: null },
        level3: { id: '', name: '', data: null },
        level4: { id: '', name: '', data: null }
      };

      if (hierarchy.length > 0) {
        newSelectedCategories.main = {
          id: hierarchy[0]._id,
          name: hierarchy[0].name,
          data: hierarchy[0]
        };
      }

      hierarchy.forEach((category, index) => {
        if (index > 0) {
          const levelKey = `level${index}`;
          if (newSelectedCategories[levelKey]) {
            newSelectedCategories[levelKey] = {
              id: category._id,
              name: category.name,
              data: category
            };
          }
        }
      });

      setSelectedCategories(newSelectedCategories);
      updateAvailableSubcategories(newSelectedCategories);
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setBarcode('');
    setName('');
    setDescription('');
    setPrice(0);
    setAskForPrice(false);
    setSpecs([]);
    setImages([]);
    setSelectedFeatures([]);
    setMeasurementValues({});
    setSelectedCategories({
      main: { id: '', name: '', data: null },
      level1: { id: '', name: '', data: null },
      level2: { id: '', name: '', data: null },
      level3: { id: '', name: '', data: null },
      level4: { id: '', name: '', data: null }
    });
    setError('');
  };

  // Özellikleri ve ölçü değerlerini ayarla
  const setupFeaturesAndMeasurements = (productSpecs) => {
    if (!productSpecs || productSpecs.length === 0) {
      setSelectedFeatures([]);
      setMeasurementValues({});
      return;
    }

    const selected = [];
    const values = {};

    productSpecs.forEach(spec => {
      if (spec.includes(':')) {
        const [namePart, valuePart] = spec.split(':').map(s => s.trim());
        const feature = availableFeatures.find(f => 
          f.name === namePart && f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS
        );
        if (feature) {
          selected.push(feature);
          values[feature._id] = valuePart;
        }
      } else {
        const feature = availableFeatures.find(f => f.name === spec);
        if (feature) {
          selected.push(feature);
        }
      }
    });

    setSelectedFeatures(selected);
    setMeasurementValues(values);
  };

  // Kategori seçildiğinde
  const handleCategorySelect = (level, category) => {
    const newSelectedCategories = { ...selectedCategories };
    
    const levels = ['main', 'level1', 'level2', 'level3', 'level4'];
    const startIndex = levels.indexOf(level);
    
    for (let i = startIndex; i < levels.length; i++) {
      const levelKey = levels[i];
      if (i > startIndex) {
        newSelectedCategories[levelKey] = { id: '', name: '', data: null };
      } else {
        newSelectedCategories[levelKey] = {
          id: category._id,
          name: category.name,
          data: category
        };
      }
    }
    
    setSelectedCategories(newSelectedCategories);
    updateAvailableSubcategories(newSelectedCategories);
    setError('');
  };

  // Kategori temizle
  const handleClearCategory = (level) => {
    const newSelectedCategories = { ...selectedCategories };
    
    const levels = ['main', 'level1', 'level2', 'level3', 'level4'];
    const startIndex = levels.indexOf(level);
    
    for (let i = startIndex; i < levels.length; i++) {
      const levelKey = levels[i];
      newSelectedCategories[levelKey] = { id: '', name: '', data: null };
    }
    
    setSelectedCategories(newSelectedCategories);
    updateAvailableSubcategories(newSelectedCategories);
    setError('');
  };

  // Mevcut kategorilere göre alt kategorileri güncelle
  const updateAvailableSubcategories = (currentSelected) => {
    const newAvailable = {
      main: categories,
      level1: [],
      level2: [],
      level3: [],
      level4: []
    };

    if (currentSelected.main.data && currentSelected.main.data.subcategories) {
      newAvailable.level1 = currentSelected.main.data.subcategories;
    }

    if (currentSelected.level1.data && currentSelected.level1.data.subcategories) {
      newAvailable.level2 = currentSelected.level1.data.subcategories;
    }

    if (currentSelected.level2.data && currentSelected.level2.data.subcategories) {
      newAvailable.level3 = currentSelected.level2.data.subcategories;
    }

    if (currentSelected.level3.data && currentSelected.level3.data.subcategories) {
      newAvailable.level4 = currentSelected.level3.data.subcategories;
    }

    setAvailableSubcategories(newAvailable);
  };

  // Tab değişimi
  const handleFeatureTabChange = (event, newValue) => {
    setFeatureTabValue(newValue);
  };

  // Ölçü değerini güncelle
  const handleMeasurementValueChange = (featureId, value) => {
    setMeasurementValues(prev => ({
      ...prev,
      [featureId]: value
    }));
  };

  // Özellik seçimini toggle et
  const handleFeatureToggle = (feature) => {
    setSelectedFeatures(prev => {
      const isSelected = prev.find(f => f._id === feature._id);
      if (isSelected) {
        setMeasurementValues(prev => {
          const newValues = { ...prev };
          delete newValues[feature._id];
          return newValues;
        });
        return prev.filter(f => f._id !== feature._id);
      } else {
        return [...prev, feature];
      }
    });
  };

  // Seçilen özellikleri specs'e ekle
  const applySelectedFeatures = () => {
    const featureEntries = selectedFeatures.map(f => {
      if (f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS && measurementValues[f._id]) {
        return `${f.name}: ${measurementValues[f._id]}`;
      }
      return f.name;
    });
    
    const manualSpecs = specs.filter(spec => {
      const specName = spec.split(':')[0].trim();
      return !availableFeatures.some(f => f.name === specName);
    });
    
    setSpecs([...manualSpecs, ...featureEntries]);
    setShowFeatureSelection(false);
  };

  // Özellik seçim dialogunu aç
  const handleOpenFeatureSelection = () => {
    loadFeaturesFromAPI();
    setShowFeatureSelection(true);
  };

  // "Fiyat Alınız" checkbox'ı değiştiğinde
  const handleAskForPriceChange = (event) => {
    const isChecked = event.target.checked;
    setAskForPrice(isChecked);
    
    if (isChecked) {
      setPrice(0);
    }
  };

  // Fiyat değiştiğinde
  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!askForPrice) {
      setPrice(value);
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
      setError('Resim yüklenirken hata oluştu');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const finalPrice = askForPrice ? 'Fiyat Alınız' : Number(price);
    
    let finalCategoryId = '';
    let finalCategoryName = '';
    
    const levels = ['level4', 'level3', 'level2', 'level1', 'main'];
    for (const level of levels) {
      if (selectedCategories[level].id) {
        finalCategoryId = selectedCategories[level].id;
        finalCategoryName = selectedCategories[level].name;
        break;
      }
    }
    
    if (!finalCategoryId) {
      setError('Lütfen bir kategori seçin');
      return;
    }

    const formData = {
      barcode: barcode.trim(),
      name: name.trim(),
      description: description.trim(),
      price: finalPrice,
      category: finalCategoryName,
      categoryId: finalCategoryId,
      specs: specs.filter(spec => spec.trim() !== ''),
      images: images
    };

    if (item && item._id) {
      formData.id = item._id;
    }

    try {
      await onSave(formData);
    } catch (err) {
      console.error('❌ Ürün kaydetme hatası:', err);
      setError(`Ürün kaydedilirken hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    }
  };

  // Kategori seviye component'i
  const CategoryLevelSelect = ({ level, categories, selectedCategory, onSelect, onClear, disabled, isMain = false }) => {
    const levelNumber = isMain ? 0 : parseInt(level.replace('level', ''));
    const levelColor = CATEGORY_LEVEL_COLORS[levelNumber];
    
    return (
      <FormControl 
        fullWidth 
        size="medium"
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: levelColor.bg,
            borderColor: levelColor.border,
          }
        }}
      >
        <InputLabel 
          shrink={!!selectedCategory.id}
          sx={{
            backgroundColor: 'white',
            px: 1,
            ml: -1,
            transform: selectedCategory.id ? 'translate(14px, -6px) scale(0.75)' : 'translate(14px, 20px) scale(1)',
          }}
        >
          {isMain ? '🏠 ANA KATEGORİ' : `Seviye ${levelNumber}`} {disabled ? '(Önce üst kategori seçin)' : ''}
        </InputLabel>
        <Select
          value={selectedCategory.id}
          label=""
          onChange={(e) => {
            const selected = categories.find(cat => cat._id === e.target.value);
            if (selected) {
              onSelect(selected);
            }
          }}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Typography color={disabled ? "text.disabled" : "textSecondary"}>
                  {disabled ? 'Önce üst kategori seçin' : (isMain ? 'ANA KATEGORİ seçin' : `Seviye ${levelNumber} seçin`)}
                </Typography>
              );
            }
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography fontWeight="medium" color={levelColor.text}>
                  {selectedCategory.name}
                </Typography>
                {!disabled && (
                  <Chip 
                    label={`${categories.length} kategori`} 
                    size="small" 
                    sx={{ 
                      backgroundColor: levelColor.border,
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                )}
              </Box>
            );
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
              {disabled ? 'Önce üst kategori seçin' : (isMain ? 'ANA KATEGORİ seçin' : `Seviye ${levelNumber} seçin`)}
            </Typography>
          </MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {cat.name}
                  </Typography>
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                      ({cat.subcategories.length} alt kategori)
                    </Typography>
                  )}
                </Box>
                <NavigateNext sx={{ color: 'text.secondary' }} />
              </Box>
            </MenuItem>
          ))}
        </Select>
        
        {selectedCategory.id && !disabled && (
          <FormHelperText>
            <Button 
              size="small" 
              onClick={() => onClear(isMain ? 'main' : level)}
              sx={{ 
                color: 'error.main',
                textTransform: 'none',
                p: 0,
                minWidth: 'auto'
              }}
            >
              Seçimi temizle
            </Button>
          </FormHelperText>
        )}
      </FormControl>
    );
  };

  // Kategori breadcrumb component'i
  const CategoryBreadcrumb = () => {
    const breadcrumbItems = [];
    
    if (selectedCategories.main.id) {
      breadcrumbItems.push({
        level: 0,
        name: selectedCategories.main.name,
        id: selectedCategories.main.id,
        isMain: true
      });
    }
    
    for (let i = 1; i <= 4; i++) {
      const levelKey = `level${i}`;
      if (selectedCategories[levelKey].id) {
        breadcrumbItems.push({
          level: i,
          name: selectedCategories[levelKey].name,
          id: selectedCategories[levelKey].id,
          isMain: false
        });
      }
    }
    
    if (breadcrumbItems.length === 0) {
      return null;
    }
    
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
        <Typography variant="subtitle2" fontWeight="bold" color="textSecondary" sx={{ mb: 1 }}>
          📍 Seçili Kategori Yolu:
        </Typography>
        <Breadcrumbs separator="›" aria-label="category-breadcrumb">
          {breadcrumbItems.map((item, index) => (
            <Box
              key={item.level}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                backgroundColor: CATEGORY_LEVEL_COLORS[item.level].bg,
                border: `1px solid ${CATEGORY_LEVEL_COLORS[item.level].border}`,
                borderRadius: 2,
                color: CATEGORY_LEVEL_COLORS[item.level].text,
                fontWeight: 'medium'
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {item.isMain ? '🏠 ANA' : `S${item.level}`}
              </Typography>
              <Typography variant="body2">
                {item.name}
              </Typography>
              {index === breadcrumbItems.length - 1 && (
                <Chip 
                  label="Seçili" 
                  size="small" 
                  sx={{ 
                    backgroundColor: CATEGORY_LEVEL_COLORS[item.level].border,
                    color: 'white',
                    fontSize: '0.6rem',
                    height: 20
                  }}
                />
              )}
            </Box>
          ))}
        </Breadcrumbs>
      </Paper>
    );
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 2 : 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Temel Bilgiler Bölümü */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Temel Bilgiler
          </Typography>
          
          <Grid container spacing={3}>
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
                    width: '350px'
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    width: '600px'
                  }
                }}
              />
            </Grid>

            {/* Kategori Seçimi - ANA KATEGORİ + 4 SEVİYE */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                🗂️ Kategori Seçimi (ANA KATEGORİ + 4 Seviye)
                <p>Lütfen alt kategori içeren seviyede ürün eklemeyiniz. Bir seviye içinde hem ürün hem alt kategori bulunamaz.</p>
              </Typography>
              
              <CategoryBreadcrumb />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <CategoryLevelSelect
                    level="main"
                    categories={availableSubcategories.main}
                    selectedCategory={selectedCategories.main}
                    onSelect={(category) => handleCategorySelect('main', category)}
                    onClear={handleClearCategory}
                    disabled={false}
                    isMain={true}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <CategoryLevelSelect
                    level="level1"
                    categories={availableSubcategories.level1}
                    selectedCategory={selectedCategories.level1}
                    onSelect={(category) => handleCategorySelect('level1', category)}
                    onClear={handleClearCategory}
                    disabled={!selectedCategories.main.id}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <CategoryLevelSelect
                    level="level2"
                    categories={availableSubcategories.level2}
                    selectedCategory={selectedCategories.level2}
                    onSelect={(category) => handleCategorySelect('level2', category)}
                    onClear={handleClearCategory}
                    disabled={!selectedCategories.level1.id}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <CategoryLevelSelect
                    level="level3"
                    categories={availableSubcategories.level3}
                    selectedCategory={selectedCategories.level3}
                    onSelect={(category) => handleCategorySelect('level3', category)}
                    onClear={handleClearCategory}
                    disabled={!selectedCategories.level2.id}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <CategoryLevelSelect
                    level="level4"
                    categories={availableSubcategories.level4}
                    selectedCategory={selectedCategories.level4}
                    onSelect={(category) => handleCategorySelect('level4', category)}
                    onClear={handleClearCategory}
                    disabled={!selectedCategories.level3.id}
                  />
                </Grid>
              </Grid>
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
                  }}
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
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
                />
              </Box>
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
                    width: '600px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Özellikler Bölümü */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Özellikler
            </Typography>
            
            <Button
              variant="outlined"
              onClick={handleOpenFeatureSelection}
              disabled={loadingFeatures}
              sx={{ borderRadius: 2 }}
            >
              {loadingFeatures ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                  Yükleniyor...
                </>
              ) : (
                `Özellik Seç (${availableFeatures.length})`
              )}
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
                fullWidth
                variant="contained"
                onClick={handleAddSpec}
                disabled={!newSpec.trim()}
                sx={{ 
                  borderRadius: 2,
                  height: '56px'
                }}
              >
                <Add sx={{ mr: 1 }} />
                Ekle
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Resimler Bölümü */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Resimler
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              disabled={uploading || images.length >= 10}
              sx={{ borderRadius: 2 }}
            >
              {uploading ? 'Yükleniyor...' : 'Resim Yükle (Max 10)'}
              <Input
                type="file"
                inputProps={{ 
                  accept: 'image/*',
                  multiple: true
                }}
                onChange={handleImageUpload}
                sx={{ display: 'none' }}
              />
            </Button>
            <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
              {images.length}/10 resim yüklendi
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            {images.map((image, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    variant="rounded"
                    src={image}
                    sx={{ 
                      width: '100%', 
                      height: 120,
                      borderRadius: 2
                    }}
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
                        backgroundColor: 'rgba(0,0,0,0.7)',
                      }
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

   

        {/* İşlem Butonları */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: 2,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{ 
              borderRadius: 2,
              flex: isMobile ? 1 : 'none'
            }}
          >
            İptal
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            sx={{ 
              borderRadius: 2,
              minWidth: 120,
              flex: isMobile ? 1 : 'none'
            }}
          >
            {item ? 'Güncelle' : 'Oluştur'}
          </Button>
        </Box>
      </Box>

      {/* Özellik Seçim Dialog'u */}
      <Dialog 
        open={showFeatureSelection} 
        onClose={() => setShowFeatureSelection(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Özellik Seçimi
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={featureTabValue} onChange={handleFeatureTabChange} sx={{ mb: 3 }}>
            <Tab label="Kullanım Alanları" />
            <Tab label="Ürün Ölçüleri" />
            <Tab label="Ürün Özellikleri" />
          </Tabs>
          
          {loadingFeatures ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {availableFeatures
                .filter(feature => {
                  if (featureTabValue === 0) return feature.type === FEATURE_TYPES.USAGE_AREA;
                  if (featureTabValue === 1) return feature.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS;
                  if (featureTabValue === 2) return feature.type === FEATURE_TYPES.PRODUCT_PROPERTIES;
                  return true;
                })
                .map(feature => (
                  <Grid item xs={12} sm={6} md={4} key={feature._id}>
                    <Paper
                      elevation={selectedFeatures.find(f => f._id === feature._id) ? 3 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedFeatures.find(f => f._id === feature._id) ? 2 : 1,
                        borderColor: selectedFeatures.find(f => f._id === feature._id) ? 'primary.main' : 'divider',
                        backgroundColor: selectedFeatures.find(f => f._id === feature._id) ? 'white' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: selectedFeatures.find(f => f._id === feature._id) ? 'white' : 'grey.50',
                        }
                      }}
                      onClick={() => handleFeatureToggle(feature)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight="medium">
                          {feature.name}
                        </Typography>
                        <Checkbox
                          checked={!!selectedFeatures.find(f => f._id === feature._id)}
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      {feature.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS && 
                       selectedFeatures.find(f => f._id === feature._id) && (
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={`${feature.name} değeri`}
                          value={measurementValues[feature._id] || ''}
                          onChange={(e) => handleMeasurementValueChange(feature._id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Paper>
                  </Grid>
                ))
              }
            </Grid>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={() => setShowFeatureSelection(false)}>
              İptal
            </Button>
            <Button 
              variant="contained" 
              onClick={applySelectedFeatures}
              disabled={loadingFeatures}
            >
              Seçilenleri Uygula ({selectedFeatures.length})
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}