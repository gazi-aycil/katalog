import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  IconButton,
  Avatar,
  Input,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Delete, CloudUpload, ExpandMore, ExpandLess, Close } from '@mui/icons-material';
import { uploadProductImages } from '../../services/api';

// Basit ID generator
const generateObjectId = () => {
  const hexChars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += hexChars[Math.floor(Math.random() * 16)];
  }
  return result;
};
// Basitleştirilmiş Alt Kategori Bileşeni
const SubcategoryItem = ({ 
  subcategory, 
  index, 
  onUpdate, 
  onDelete, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newChildName, setNewChildName] = useState('');
  const [uploading, setUploading] = useState(false);

  const levelColors = ['#1976d2', '#7b1fa2', '#388e3c', '#f57c00'];
  const currentColor = levelColors[level] || levelColors[3];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await uploadProductImages(formData);
      if (response.data.imageUrls?.[0]) {
        onUpdate(index, { ...subcategory, imageUrl: response.data.imageUrls[0] });
      }
    } catch (err) {
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleAddChild = () => {
    if (newChildName.trim()) {
      const newChild = {
        _id: generateObjectId(),
        name: newChildName.trim(),
        imageUrl: '',
        subcategories: []
      };

      const updatedSubcategory = {
        ...subcategory,
        subcategories: [...(subcategory.subcategories || []), newChild]
      };
      
      onUpdate(index, updatedSubcategory);
      setNewChildName('');
    }
  };

  const handleUpdateChild = (childIndex, updatedChild) => {
    const updatedChildren = [...(subcategory.subcategories || [])];
    updatedChildren[childIndex] = updatedChild;
    onUpdate(index, { ...subcategory, subcategories: updatedChildren });
  };

  const handleDeleteChild = (childIndex) => {
    const updatedChildren = (subcategory.subcategories || []).filter((_, i) => i !== childIndex);
    onUpdate(index, { ...subcategory, subcategories: updatedChildren });
  };

  return (
    <Box sx={{ mb: 1, ml: level * 2 }}>
      {/* Kategori Kartı */}
      <Card sx={{ borderLeft: `4px solid ${currentColor}`, mb: 1 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Üst Satır - İsim ve Kontroller */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <TextField
              size="small"
              value={subcategory.name}
              onChange={(e) => onUpdate(index, { ...subcategory, name: e.target.value })}
              placeholder={`Kategori adı...`}
              sx={{ flex: 1 }}
            />
            
            <Button
              component="label"
              size="small"
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
            >
              <Input type="file" hidden onChange={handleImageUpload} accept="image/*" />
            </Button>

            {(subcategory.subcategories?.length > 0 || level < 3) && (
              <IconButton 
                size="small" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}

            <IconButton size="small" color="error" onClick={() => onDelete(index)}>
              <Delete />
            </IconButton>
          </Box>

          {/* Resim Gösterimi */}
          {subcategory.imageUrl && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar src={subcategory.imageUrl} sx={{ width: 40, height: 40 }} />
              <Typography variant="body2" color="success.main">
                Resim yüklendi
              </Typography>
            </Box>
          )}

          {/* Alt Kategori Bilgisi */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Seviye {level + 1}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subcategory.subcategories?.length || 0} alt kategori
            </Typography>
          </Box>

          {/* Alt Kategoriler */}
          <Collapse in={isExpanded}>
            <Box sx={{ mt: 1 }}>
              {/* Mevcut Alt Kategoriler */}
              {(subcategory.subcategories || []).map((child, childIndex) => (
                <SubcategoryItem
                  key={child._id}
                  subcategory={child}
                  index={childIndex}
                  onUpdate={handleUpdateChild}
                  onDelete={handleDeleteChild}
                  level={level + 1}
                />
              ))}

              {/* Yeni Alt Kategori Ekleme */}
              {level < 3 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Yeni alt kategori..."
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleAddChild}
                    disabled={!newChildName.trim()}
                    startIcon={<Add />}
                  >
                    Ekle
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

// Ana Kategori Form Bileşeni
export default function CategoryForm({ category, onSave, onCancel, open = true }) {
  const [name, setName] = useState(category?.name || '');
  const [subcategories, setSubcategories] = useState(category?.subcategories || []);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [categoryImage, setCategoryImage] = useState(category?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('images', file);
      
      const response = await uploadProductImages(formData);
      if (response.data.imageUrls?.[0]) {
        setCategoryImage(response.data.imageUrls[0]);
      }
    } catch (err) {
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      const newSubcat = {
        _id: generateObjectId(),
        name: newSubcategory.trim(),
        imageUrl: '',
        subcategories: []
      };
      setSubcategories([...subcategories, newSubcat]);
      setNewSubcategory('');
    }
  };

  const handleUpdateSubcategory = (index, updatedSubcategory) => {
    const updated = [...subcategories];
    updated[index] = updatedSubcategory;
    setSubcategories(updated);
  };

  const handleDeleteSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const categoryData = {
      name: name.trim(),
      imageUrl: categoryImage,
      subcategories: subcategories
    };
    onSave(categoryData);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          
          {/* Ana Kategori */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ana Kategori
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
              <TextField
                label="Kategori Adı *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                size="small"
                sx={{ flex: 1 }}
              />
              
              <Button
                component="label"
                variant="outlined"
                size="small"
                disabled={uploading}
                startIcon={<CloudUpload />}
              >
                <Input type="file" hidden onChange={handleImageUpload} accept="image/*" />
              </Button>
            </Box>

            {categoryImage && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={categoryImage} sx={{ width: 40, height: 40 }} />
                <Typography variant="body2" color="success.main">
                  Ana kategori resmi yüklendi
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Alt Kategoriler */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alt Kategoriler
            </Typography>

            {/* Yeni Alt Kategori Ekleme */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Yeni alt kategori adı..."
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleAddSubcategory}
                disabled={!newSubcategory.trim()}
                startIcon={<Add />}
              >
                Ekle
              </Button>
            </Box>

            {/* Alt Kategori Listesi */}
            {subcategories.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {subcategories.map((subcat, index) => (
                  <SubcategoryItem
                    key={subcat._id}
                    subcategory={subcat}
                    index={index}
                    onUpdate={handleUpdateSubcategory}
                    onDelete={handleDeleteSubcategory}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                Henüz alt kategori eklenmemiş
              </Typography>
            )}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} color="error">
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!name.trim()}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}