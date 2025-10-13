// src/components/Admin/CategoryForm.js
import React, { useState, useEffect } from 'react';
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
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import {
  Add,
  Delete,
  CloudUpload,
  ExpandMore,
  ExpandLess,
  ChevronRight
} from '@mui/icons-material';
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

// Recursive list renderer (MUI List + Collapse) - no @mui/lab
const NestedList = ({ nodes, onSelect, selectedId, expandedIds, toggleExpand }) => {
  return (
    <List disablePadding>
      {nodes.map((node) => {
        const hasChildren = Array.isArray(node.subcategories) && node.subcategories.length > 0;
        const isOpen = expandedIds.includes(node._id);

        return (
          <Box key={node._id}>
            <ListItem
              sx={{
                pl: (node._depth || 0) * 2,
                '&:hover': { bgcolor: 'grey.50' },
                bgcolor: node._id === selectedId ? 'primary.light' : 'transparent',
                borderRadius: 1,
                mb: 0.5
              }}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {hasChildren && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node._id);
                      }}
                      aria-label={isOpen ? 'collapse' : 'expand'}
                    >
                      {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                  )}
                </Box>
              }
            >
              <ListItemButton
                onClick={() => onSelect(node)}
                sx={{ px: 1, mr: 1 }}
                aria-current={node._id === selectedId}
              >
                <ListItemAvatar>
                  <Avatar src={node.imageUrl || ''} sx={{ width: 34, height: 34 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography noWrap variant="body2">{node.name || '(isim yok)'}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{(node.subcategories?.length || 0) + ' alt'}</Typography>}
                />
              </ListItemButton>
            </ListItem>

            {hasChildren && (
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 2 }}>
                  <NestedList
                    nodes={node.subcategories.map((c) => ({ ...c, _depth: (node._depth || 0) + 1 }))}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    expandedIds={expandedIds}
                    toggleExpand={toggleExpand}
                  />
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </List>
  );
};

export default function CategoryForm({ category, onSave, onCancel, open = true }) {
  // rootCategory holds the whole tree
  const [rootCategory, setRootCategory] = useState(() => category || {
    _id: generateObjectId(),
    name: '',
    imageUrl: '',
    subcategories: []
  });

  const [selectedCategory, setSelectedCategory] = useState(rootCategory);
  const [uploading, setUploading] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);

  useEffect(() => {
    // if category prop updates, reflect
    if (category) {
      setRootCategory(category);
      setSelectedCategory(category);
    }
  }, [category]);

  // recursive updater
  const updateNode = (nodeToUpdate) => {
    const recur = (node) => {
      if (node._id === nodeToUpdate._id) return nodeToUpdate;
      if (!node.subcategories) return node;
      return { ...node, subcategories: node.subcategories.map(recur) };
    };
    setRootCategory((prev) => recur(prev));
  };

  const deleteNodeById = (idToDelete) => {
    // can't delete root
    if (idToDelete === rootCategory._id) return;
    const recur = (node) => {
      if (!node.subcategories) return node;
      return {
        ...node,
        subcategories: node.subcategories
          .filter((c) => c._id !== idToDelete)
          .map(recur)
      };
    };
    setRootCategory((prev) => recur(prev));
    // after deletion, reset selection to root
    setSelectedCategory((prev) => (prev._id === idToDelete ? rootCategory : prev));
  };

  const handleSelect = (node) => {
    setSelectedCategory(node);
    // Auto-expand parent chain heuristic: ensure selected node is visible by expanding its id
    if (!expandedIds.includes(node._id)) setExpandedIds((s) => [...s, node._id]);
  };

  const handleUpdateField = (key, value) => {
    const updated = { ...selectedCategory, [key]: value };
    setSelectedCategory(updated);
    updateNode(updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('images', file);
      const res = await uploadProductImages(fd);
      if (res?.data?.imageUrls?.[0]) {
        handleUpdateField('imageUrl', res.data.imageUrls[0]);
      }
    } catch {
      alert('Resim yüklenirken hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSub = () => {
    if (!newSubName.trim()) return;
    const newSub = {
      _id: generateObjectId(),
      name: newSubName.trim(),
      imageUrl: '',
      subcategories: []
    };
    const updated = {
      ...selectedCategory,
      subcategories: [...(selectedCategory.subcategories || []), newSub]
    };
    setNewSubName('');
    setSelectedCategory(updated);
    updateNode(updated);
    // expand parent to show new child
    if (!expandedIds.includes(selectedCategory._id)) setExpandedIds((s) => [...s, selectedCategory._id]);
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDeleteSelected = () => {
    if (selectedCategory._id === rootCategory._id) {
      alert('Ana kategori silinemez.');
      return;
    }
    deleteNodeById(selectedCategory._id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // minimal validation
    if (!rootCategory.name?.trim()) {
      alert('Ana kategori adı boş bırakılamaz.');
      return;
    }
    onSave(rootCategory);
  };

  // Render
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          {/* LEFT: Compact nested list */}
          <Grid item xs={12} md={4} sx={{ borderRight: { md: '1px solid #eee' }, p: 2, height: { md: '72vh' }, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Kategoriler
            </Typography>

            <Paper variant="outlined" sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Yeni ana/üst kategori..."
                  value={rootCategory._editingName || ''}
                  onChange={(e) => setRootCategory((r) => ({ ...r, name: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    // if root has no name, treat current textfield as root name
                    if (!rootCategory.name?.trim() && rootCategory._editingName?.trim()) {
                      setRootCategory((r) => ({ ...r, name: r._editingName, _editingName: undefined }));
                      setSelectedCategory((r) => ({ ...r, name: rootCategory._editingName }));
                    } else {
                      // else create a new top-level sibling (we keep the structure as single-root for simplicity)
                      const newTop = {
                        _id: generateObjectId(),
                        name: 'Yeni Kategori',
                        imageUrl: '',
                        subcategories: []
                      };
                      // add as subcategory of root (app keeps single root)
                      const updatedRoot = { ...rootCategory, subcategories: [...(rootCategory.subcategories || []), newTop] };
                      setRootCategory(updatedRoot);
                    }
                  }}
                >
                  Oluştur
                </Button>
              </Box>

              <Divider />

              <Box sx={{ mt: 1 }}>
                <NestedList
                  nodes={[{ ...rootCategory, _depth: 0 }]}
                  onSelect={handleSelect}
                  selectedId={selectedCategory?._id}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              </Box>
            </Paper>
          </Grid>

          {/* RIGHT: Edit panel */}
          <Grid item xs={12} md={8} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedCategory?._id === rootCategory._id ? 'Ana Kategori' : 'Kategori Düzenle'}
            </Typography>

            {selectedCategory ? (
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Kategori Adı"
                  value={selectedCategory.name || ''}
                  onChange={(e) => handleUpdateField('name', e.target.value)}
                  size="small"
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
                    Resim Yükle
                    <Input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                  </Button>

                  {selectedCategory.imageUrl ? (
                    <Avatar src={selectedCategory.imageUrl} sx={{ width: 56, height: 56 }} />
                  ) : (
                    <Chip label="Resim yok" size="small" />
                  )}
                </Box>

                <Divider />

                <Typography variant="subtitle2">Alt Kategoriler</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Yeni alt kategori..."
                    size="small"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddSub}
                    disabled={!newSubName.trim()}
                  >
                    Ekle
                  </Button>
                </Box>

                <Box>
                  {selectedCategory.subcategories?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      {selectedCategory.subcategories.map((s) => (
                        <Paper
                          key={s._id}
                          variant="outlined"
                          sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={s.imageUrl || ''} sx={{ width: 32, height: 32 }} />
                            <Typography variant="body2">{s.name}</Typography>
                          </Box>
                          <Box>
                            <Button
                              size="small"
                              onClick={() => {
                                // select child to edit it
                                setSelectedCategory(s);
                              }}
                            >
                              Düzenle
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => {
                                // delete child
                                const updated = {
                                  ...selectedCategory,
                                  subcategories: selectedCategory.subcategories.filter((c) => c._id !== s._id)
                                };
                                setSelectedCategory(updated);
                                updateNode(updated);
                              }}
                              aria-label="delete-sub"
                            >
                              <Delete fontSize="small" color="error" />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Alt kategori yok.
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {selectedCategory._id !== rootCategory._id && (
                    <Button variant="outlined" color="error" onClick={handleDeleteSelected} startIcon={<Delete />}>
                      Kategoriyi Sil
                    </Button>
                  )}
                  <Box sx={{ flex: 1 }} />
                  <Button onClick={onCancel} color="inherit">İptal</Button>
                  <Button type="submit" variant="contained">Kaydet</Button>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">Soldan bir kategori seçin.</Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto', pl: 2 }}>
          Görsel: avatar — hiyerarşi: katlanabilir liste
        </Typography>
      </DialogActions>
    </Dialog>
  );
}
