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

// --- Alt bileşen: Ekle/Düzenle popup ---
function CategoryDialog({ open, onClose, onSave, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('images', file);
      const res = await uploadProductImages(fd);
      if (res.data.imageUrls?.[0]) setImageUrl(res.data.imageUrls[0]);
    } catch {
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return alert('Kategori adı boş bırakılamaz.');
    onSave({ ...initialData, _id: initialData?._id || generateObjectId(), name, imageUrl });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialData ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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

            {imageUrl && <Avatar src={imageUrl} sx={{ width: 48, height: 48 }} />}
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
  const [rootCategory, setRootCategory] = useState(category || { name: '', subcategories: [] });
  const [currentPath, setCurrentPath] = useState([]); // breadcrumb zinciri
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // aktif gösterilen seviye
  const currentLevel = currentPath.reduce(
    (acc, c) => acc.subcategories?.find((x) => x._id === c._id) || acc,
    rootCategory
  );

  const handleAddCategory = (data) => {
    const updatedLevel = {
      ...currentLevel,
      subcategories: [...(currentLevel.subcategories || []), data],
    };

    const updateRecursive = (node) => {
      if (node === currentLevel) return updatedLevel;
      if (!node.subcategories) return node;
      return { ...node, subcategories: node.subcategories.map(updateRecursive) };
    };

    setRootCategory(updateRecursive(rootCategory));
    setDialogOpen(false);
  };

  const handleEditCategory = (updated) => {
    const updateRecursive = (node) => {
      if (node._id === updated._id) return updated;
      if (!node.subcategories) return node;
      return { ...node, subcategories: node.subcategories.map(updateRecursive) };
    };

    setRootCategory(updateRecursive(rootCategory));
    setDialogOpen(false);
    setEditItem(null);
  };

  const handleDeleteCategory = (id) => {
    const removeRecursive = (node) => {
      return {
        ...node,
        subcategories: (node.subcategories || [])
          .filter((c) => c._id !== id)
          .map(removeRecursive),
      };
    };
    setRootCategory(removeRecursive(rootCategory));
  };

  const handleOpenSubcategories = (item) => {
    setCurrentPath((prev) => [...prev, item]);
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleSaveAll = () => {
    // 🔹 Ana kategori adı zorunlu değil artık.
    // Yalnızca en az bir kategori eklenmişse kaydedelim.
    if (!rootCategory.subcategories?.length) {
      return alert('En az bir kategori eklemeniz gerekiyor.');
    }
    onSave(rootCategory);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>Kategori Yönetimi</DialogTitle>

      <DialogContent>
        {/* Breadcrumb */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color={currentPath.length === 0 ? 'text.primary' : 'inherit'}
            onClick={() => setCurrentPath([])}
            sx={{ cursor: 'pointer' }}
          >
            Ana Kategoriler
          </Link>
          {currentPath.map((cat, index) => (
            <Link
              key={cat._id}
              underline="hover"
              color={index === currentPath.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(index)}
              sx={{ cursor: 'pointer' }}
            >
              {cat.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Üst araç çubuğu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            {currentPath.length === 0
              ? 'Ana Kategoriler'
              : `${currentLevel.name} Alt Kategorileri`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditItem(null);
              setDialogOpen(true);
            }}
          >
            Yeni Kategori
          </Button>
        </Box>

        {/* Liste */}
        {(currentLevel.subcategories || []).length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            Henüz kategori eklenmemiş
          </Typography>
        ) : (
          <Stack spacing={1}>
            {currentLevel.subcategories.map((cat) => (
              <Paper
                key={cat._id}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { bgcolor: 'grey.50' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={cat.imageUrl} sx={{ width: 44, height: 44 }} />
                  <Typography>{cat.name}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleOpenSubcategories(cat)}
                  >
                    Alt Kategorilere Git
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditItem(cat);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteCategory(cat._id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {currentPath.length > 0 && (
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setCurrentPath((prev) => prev.slice(0, -1))}
          >
            Geri
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onCancel}>İptal</Button>
        <Button variant="contained" onClick={handleSaveAll}>
          Kaydet
        </Button>
      </DialogActions>

      {/* Popup */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditItem(null);
        }}
        onSave={editItem ? handleEditCategory : handleAddCategory}
        initialData={editItem}
      />
    </Dialog>
  );
}
