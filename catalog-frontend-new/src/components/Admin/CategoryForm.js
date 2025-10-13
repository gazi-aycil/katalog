import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Paper,
  Stack,
  Breadcrumbs,
  Link,
  Input,
  CircularProgress,
} from '@mui/material';
import { Add, ArrowBack, CloudUpload, Delete, Edit } from '@mui/icons-material';
import { uploadProductImages } from '../../services/api';

// Basit ObjectId generator
const generateObjectId = () => {
  const chars = 'abcdef0123456789';
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// --- Ekle / Düzenle Dialog ---
function CategoryDialog({ open, onClose, onSave, initialData, isRootCreation }) {
  const [name, setName] = useState(initialData?.name || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setName(initialData?.name || '');
    setImageUrl(initialData?.imageUrl || '');
  }, [initialData, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('images', file);
      const res = await uploadProductImages(fd);
      if (res?.data?.imageUrls?.[0]) setImageUrl(res.data.imageUrls[0]);
    } catch {
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return alert('Kategori adı boş bırakılamaz.');
    onSave({
      ...initialData,
      _id: initialData?._id || generateObjectId(),
      name: name.trim(),
      imageUrl: imageUrl || '',
      subcategories: initialData?.subcategories || [],
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? 'Kategoriyi Düzenle' : isRootCreation ? 'Kök Kategori Oluştur' : 'Yeni Kategori Ekle'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 320 }}>
          <TextField
            label="Kategori Adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            fullWidth
            required
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
              disabled={uploading}
            >
              Görsel Yükle
              <Input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </Button>

            {imageUrl ? <Avatar src={imageUrl} sx={{ width: 48, height: 48 }} /> : <Avatar sx={{ width: 48, height: 48 }} />}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// --- Ana bileşen ---
export default function CategoryForm({ category, onSave, onCancel, open = true }) {
  const [rootCategory, setRootCategory] = useState(category || null);
  const [currentPath, setCurrentPath] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isRootCreation, setIsRootCreation] = useState(false);

  // Aktif seviye
  const currentLevel = (() => {
    if (!rootCategory) return { subcategories: [] };
    if (currentPath.length === 0) return rootCategory;
    let node = rootCategory;
    for (const p of currentPath) {
      node = node.subcategories?.find((s) => s._id === p._id) || node;
    }
    return node;
  })();

  // Recursive update
  const updateById = (node, updated) => {
    if (!node) return node;
    if (node._id === updated._id) return updated;
    if (!node.subcategories) return node;
    return { ...node, subcategories: node.subcategories.map((c) => updateById(c, updated)) };
  };

  // Recursive remove
  const removeById = (node, idToRemove) => {
    if (!node) return node;
    return {
      ...node,
      subcategories: (node.subcategories || [])
        .filter((c) => c._id !== idToRemove)
        .map((c) => removeById(c, idToRemove)),
    };
  };

  // --- Handlers ---
  const handleAddCategory = (newCat) => {
    if (!rootCategory && isRootCreation) {
      setRootCategory({ ...newCat, subcategories: newCat.subcategories || [] });
      setDialogOpen(false);
      setIsRootCreation(false);
      setCurrentPath([]);
      return;
    }

    const updatedLevel = {
      ...currentLevel,
      subcategories: [...(currentLevel.subcategories || []), { ...newCat, subcategories: newCat.subcategories || [] }],
    };

    const updatedRoot = updateById(rootCategory, updatedLevel);
    setRootCategory(updatedRoot);
    setDialogOpen(false);
  };

  const handleEditCategory = (updated) => {
    if (rootCategory && updated._id === rootCategory._id) {
      setRootCategory({ ...updated });
    } else {
      const updatedRoot = updateById(rootCategory, updated);
      setRootCategory(updatedRoot);
    }

    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDeleteCategory = (id) => {
    if (rootCategory && rootCategory._id === id) {
      setRootCategory(null);
      setCurrentPath([]);
      return;
    }

    const updatedRoot = removeById(rootCategory, id);
    setRootCategory(updatedRoot);

    const indexInPath = currentPath.findIndex((p) => p._id === id);
    if (indexInPath >= 0) setCurrentPath((prev) => prev.slice(0, indexInPath));
  };

  const handleOpenSubcategories = (item) => {
    setCurrentPath((prev) => [...prev, item]);
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleSaveAll = () => {
    if (!rootCategory) return alert('Kök kategori oluşturmanız gerekiyor.');
    onSave(rootCategory);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Kategori Yönetimi</DialogTitle>

      <DialogContent>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link underline="hover" color="text.primary" onClick={() => setCurrentPath([])} sx={{ cursor: 'pointer' }}>
            Ana Kategori
          </Link>

          {rootCategory && (
            <Link underline="hover" color={currentPath.length === 0 ? 'text.primary' : 'inherit'} onClick={() => setCurrentPath([])} sx={{ cursor: 'pointer' }}>
              {rootCategory.name}
            </Link>
          )}

          {currentPath.map((cat, index) => (
            <Link key={cat._id} underline="hover" color={index === currentPath.length - 1 ? 'text.primary' : 'inherit'} onClick={() => handleBreadcrumbClick(index)} sx={{ cursor: 'pointer' }}>
              {cat.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Üst araç çubuğu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {!rootCategory
              ? 'Henüz kök kategori yok'
              : currentPath.length === 0
              ? `${rootCategory.name} Alt Kategorileri`
              : `${currentLevel.name} Alt Kategorileri`}
          </Typography>

          <Box>
            {!rootCategory ? (
              <Button variant="contained" startIcon={<Add />} onClick={() => { setIsRootCreation(true); setEditItem(null); setDialogOpen(true); }}>
                Kök Kategori Oluştur
              </Button>
            ) : (
              <Button variant="contained" startIcon={<Add />} onClick={() => { setIsRootCreation(false); setEditItem(null); setDialogOpen(true); }}>
                Yeni Kategori
              </Button>
            )}
          </Box>
        </Box>

        {/* Liste */}
        <Box>
          {!rootCategory ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" gutterBottom>
                Henüz bir kök kategori oluşturulmamış. Lütfen önce kök kategori oluşturun.
              </Typography>
              <Button variant="outlined" onClick={() => { setIsRootCreation(true); setDialogOpen(true); }}>
                Kök Kategori Oluştur
              </Button>
            </Paper>
          ) : (
            <>
              {(currentLevel.subcategories || []).length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  Bu seviyede henüz kategori yok.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {currentLevel.subcategories.map((cat) => (
                    <Paper key={cat._id} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { bgcolor: 'grey.50' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={cat.imageUrl} sx={{ width: 44, height: 44 }} />
                        <Typography>{cat.name}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" onClick={() => handleOpenSubcategories(cat)}>
                          Alt Kategorilere Git
                        </Button>

                        <IconButton size="small" onClick={() => { setEditItem(cat); setIsRootCreation(false); setDialogOpen(true); }}>
                          <Edit fontSize="small" />
                        </IconButton>

                        <IconButton size="small" color="error" onClick={() => handleDeleteCategory(cat._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        {currentPath.length > 0 && (
          <Button startIcon={<ArrowBack />} onClick={() => setCurrentPath((prev) => prev.slice(0, -1))}>
            Geri
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onCancel}>İptal</Button>
        <Button variant="contained" onClick={handleSaveAll} disabled={!rootCategory}>
          Kaydet
        </Button>
      </DialogActions>

      {/* Popup */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditItem(null); setIsRootCreation(false); }}
        onSave={editItem ? handleEditCategory : handleAddCategory}
        initialData={editItem}
        isRootCreation={isRootCreation}
      />
    </Dialog>
  );
}
