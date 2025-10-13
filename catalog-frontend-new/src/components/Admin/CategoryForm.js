import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Avatar,
  Input,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogActions
} from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import { Add, Delete, CloudUpload, ExpandMore, ChevronRight } from '@mui/icons-material';
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

// Kategori ağacını oluşturmak için yardımcı fonksiyon
const renderTree = (nodes, handleSelect, selectedId) =>
  nodes.map((node) => (
    <TreeItem
      key={node._id}
      nodeId={node._id}
      label={node.name}
      onClick={() => handleSelect(node)}
      sx={{
        cursor: 'pointer',
        '& .MuiTreeItem-label': {
          bgcolor: node._id === selectedId ? 'primary.main' : 'transparent',
          color: node._id === selectedId ? 'white' : 'inherit',
          borderRadius: 1,
          px: 1,
        },
      }}
    >
      {Array.isArray(node.subcategories) && node.subcategories.length > 0
        ? renderTree(node.subcategories, handleSelect, selectedId)
        : null}
    </TreeItem>
  ));

export default function CategoryForm({ category, onSave, onCancel, open = true }) {
  const [rootCategory, setRootCategory] = useState(category || {
    _id: generateObjectId(),
    name: '',
    imageUrl: '',
    subcategories: [],
  });
  const [selectedCategory, setSelectedCategory] = useState(rootCategory);
  const [uploading, setUploading] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // ----------- Yardımcı Fonksiyonlar -----------

  const updateCategoryRecursive = (parent, updated) => {
    if (parent._id === updated._id) return updated;
    if (!parent.subcategories) return parent;
    return {
      ...parent,
      subcategories: parent.subcategories.map((child) =>
        updateCategoryRecursive(child, updated)
      ),
    };
  };

  const deleteCategoryRecursive = (parent, idToDelete) => {
    return {
      ...parent,
      subcategories: parent.subcategories
        .filter((child) => child._id !== idToDelete)
        .map((child) => deleteCategoryRecursive(child, idToDelete)),
    };
  };

  const handleSelect = (node) => {
    setSelectedCategory(node);
  };

  const handleUpdateCategory = (field, value) => {
    const updated = { ...selectedCategory, [field]: value };
    setSelectedCategory(updated);
    setRootCategory((prev) => updateCategoryRecursive(prev, updated));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('images', file);
      const response = await uploadProductImages(formData);
      if (response.data.imageUrls?.[0]) {
        handleUpdateCategory('imageUrl', response.data.imageUrls[0]);
      }
    } catch {
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim()) return;
    const newSub = {
      _id: generateObjectId(),
      name: newSubcategoryName.trim(),
      imageUrl: '',
      subcategories: [],
    };
    const updated = {
      ...selectedCategory,
      subcategories: [...(selectedCategory.subcategories || []), newSub],
    };
    setSelectedCategory(updated);
    setRootCategory((prev) => updateCategoryRecursive(prev, updated));
    setNewSubcategoryName('');
  };

  const handleDeleteCategory = () => {
    if (selectedCategory._id === rootCategory._id) {
      alert('Ana kategoriyi silemezsiniz.');
      return;
    }
    setRootCategory((prev) => deleteCategoryRecursive(prev, selectedCategory._id));
    setSelectedCategory(rootCategory);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(rootCategory);
  };

  // ----------- Arayüz -----------

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* Sol panel - Kategori ağacı */}
          <Grid item xs={4} sx={{ borderRight: '1px solid #eee', p: 2, height: '70vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Kategori Ağacı
            </Typography>

            {rootCategory ? (
              <TreeView
                defaultExpandAll
                defaultCollapseIcon={<ExpandMore />}
                defaultExpandIcon={<ChevronRight />}
                sx={{ flexGrow: 1, overflowY: 'auto' }}
              >
                {renderTree([rootCategory], handleSelect, selectedCategory._id)}
              </TreeView>
            ) : (
              <Typography color="text.secondary">Henüz kategori yok</Typography>
            )}
          </Grid>

          {/* Sağ panel - Kategori düzenleme */}
          <Grid item xs={8} sx={{ p: 3 }}>
            {selectedCategory ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedCategory._id === rootCategory._id
                    ? 'Ana Kategori Düzenleme'
                    : 'Alt Kategori Düzenleme'}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Kategori Adı"
                    value={selectedCategory.name}
                    onChange={(e) => handleUpdateCategory('name', e.target.value)}
                    fullWidth
                    size="small"
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      startIcon={
                        uploading ? <CircularProgress size={16} /> : <CloudUpload />
                      }
                      disabled={uploading}
                    >
                      Resim Yükle
                      <Input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                    </Button>
                    {selectedCategory.imageUrl && (
                      <Avatar src={selectedCategory.imageUrl} sx={{ width: 50, height: 50 }} />
                    )}
                  </Box>

                  <Divider />

                  {/* Alt kategori ekleme */}
                  <Typography variant="subtitle1">Alt Kategoriler</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Yeni alt kategori..."
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleAddSubcategory}
                      startIcon={<Add />}
                      disabled={!newSubcategoryName.trim()}
                    >
                      Ekle
                    </Button>
                  </Box>

                  {selectedCategory.subcategories?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                      {selectedCategory.subcategories.map((sub) => (
                        <Paper
                          key={sub._id}
                          sx={{
                            p: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'grey.100' },
                          }}
                          onClick={() => handleSelect(sub)}
                        >
                          <Typography>{sub.name}</Typography>
                          <Delete
                            fontSize="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = {
                                ...selectedCategory,
                                subcategories: selectedCategory.subcategories.filter(
                                  (s) => s._id !== sub._id
                                ),
                              };
                              setSelectedCategory(updated);
                              setRootCategory((prev) => updateCategoryRecursive(prev, updated));
                            }}
                          />
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary" variant="body2" mt={1}>
                      Alt kategori bulunmuyor.
                    </Typography>
                  )}

                  {selectedCategory._id !== rootCategory._id && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteCategory}
                      startIcon={<Delete />}
                      sx={{ mt: 2, alignSelf: 'flex-start' }}
                    >
                      Bu Kategoriyi Sil
                    </Button>
                  )}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary">Bir kategori seçin.</Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} color="error">
          İptal
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}
