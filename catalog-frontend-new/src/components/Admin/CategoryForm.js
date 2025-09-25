import React, { useState, useEffect } from 'react';
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
  useTheme,
  MenuItem,
  Select,
  FormHelperText
} from '@mui/material';
import { Add, Delete, CloudUpload, ExpandMore, ExpandLess } from '@mui/icons-material';
import { uploadProductImages, getCategories } from '../../services/api';

export default function CategoryForm({ category, onSave, onCancel }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parentId: category?.parentId || '',
    imageUrl: category?.imageUrl || '',
    sortOrder: category?.sortOrder || 0
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Kategorileri yükle
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories('/api/categories/tree');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await uploadProductImages(formData);
      if (response.data.imageUrls && response.data.imageUrls.length > 0) {
        setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrls[0] }));
      }
    } catch (err) {
      console.error('Resim yükleme hatası:', err);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Özyinelemeli kategori render fonksiyonu
  const renderCategoryTree = (categoryList, level = 0) => {
    return categoryList.map(cat => {
      const hasChildren = cat.subcategories && cat.subcategories.length > 0;
      const isExpanded = expandedCategories.has(cat._id);
      const isCurrentCategory = category && category._id === cat._id;
      
      return (
        <Box key={cat._id} sx={{ ml: level * 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            py: 0.5,
            backgroundColor: isCurrentCategory ? 'action.hover' : 'transparent'
          }}>
            {hasChildren && (
              <IconButton 
                size="small" 
                onClick={() => toggleCategoryExpand(cat._id)}
                sx={{ mr: 0.5 }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 32 }} />}
            
            <MenuItem 
              value={cat._id}
              disabled={isCurrentCategory}
              sx={{ 
                flexGrow: 1,
                justifyContent: 'flex-start',
                pl: hasChildren ? 0 : 4
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                width: '100%'
              }}>
                <span style={{ 
                  marginLeft: `${level * 8}px`,
                  fontWeight: level === 0 ? 600 : 400
                }}>
                  {cat.name}
                </span>
              </Box>
            </MenuItem>
          </Box>
          
          {hasChildren && isExpanded && (
            <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', ml: 2 }}>
              {renderCategoryTree(cat.subcategories, level + 1)}
            </Box>
          )}
        </Box>
      );
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parent kategori validasyonu (kendini seçemez)
    if (category && formData.parentId === category._id) {
      alert('Kategori kendisinin üst kategorisi olamaz');
      return;
    }

    onSave(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: isMobile ? 1 : 3 }}>
      <Grid container spacing={isMobile ? 1 : 3}>
        {/* Ana Kategori Bilgileri */}
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
                  label="Kategori Adı *"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sıralama"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                  size={isMobile ? "small" : "medium"}
                  helperText="Küçük sayılar önce gösterilir"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Açıklama"
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Typography variant="body2" gutterBottom>
                    Üst Kategori
                  </Typography>
                  <Select
                    value={formData.parentId || ''}
                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                    displayEmpty
                    size={isMobile ? "small" : "medium"}
                    renderValue={(selected) => {
                      if (!selected) return 'Kök Kategori (Üst Kategori Yok)';
                      const findCategory = (cats, id) => {
                        for (let cat of cats) {
                          if (cat._id === id) return cat;
                          if (cat.subcategories) {
                            const found = findCategory(cat.subcategories, id);
                            if (found) return found;
                          }
                        }
                        return null;
                      };
                      const selectedCat = findCategory(categories, selected);
                      return selectedCat ? selectedCat.name : 'Kategori bulunamadı';
                    }}
                  >
                    <MenuItem value="">
                      <em>Kök Kategori (Üst Kategori Yok)</em>
                    </MenuItem>
                    {renderCategoryTree(categories)}
                  </Select>
                  <FormHelperText>
                    {formData.parentId ? 'Alt kategori olarak eklenecek' : 'Kök kategori olarak eklenecek'}
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
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
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </Button>
                  {formData.imageUrl && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={formData.imageUrl} 
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
              disabled={uploading || !formData.name.trim()}
              fullWidth={isMobile}
            >
              {category ? 'Kategoriyi Güncelle' : 'Kategoriyi Oluştur'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}