import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import ItemForm from '../../components/Admin/ItemForm';
import { getItems, createItem, updateItem, deleteItem } from '../../services/api';

export default function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await getItems();
      setItems(response.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch products',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData) => {
    try {
      if (currentItem) {
        await updateItem(currentItem._id, itemData);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      } else {
        await createItem(itemData);
        setSnackbar({
          open: true,
          message: 'Product created successfully',
          severity: 'success'
        });
      }
      fetchItems();
      setOpenForm(false);
      setCurrentItem(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to save product',
        severity: 'error'
      });
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setOpenForm(true);
  };

  const handleDeleteConfirm = (item) => {
    setItemToDelete(item);
    setDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteItem(itemToDelete._id);
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      });
      fetchItems();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete product',
        severity: 'error'
      });
    } finally {
      setDeleteConfirm(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Ürünler</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCurrentItem(null);
            setOpenForm(true);
          }}
        >
          Ürün Ekle
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>İsim</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Fiyat</TableCell>
                <TableCell>İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>₺{item.price?.toFixed(2)}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(item)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteConfirm(item)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
      >
        <DialogTitle>Ürünü Sil</DialogTitle>
        <DialogContent>
          "{itemToDelete?.name}" ürününü silmek istediğinizden emin misiniz?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error">Sil</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openForm} 
        onClose={() => setOpenForm(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{currentItem ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
        <DialogContent>
          <ItemForm 
            onSave={handleSave} 
            onCancel={() => {
              setOpenForm(false);
              setCurrentItem(null);
            }}
            item={currentItem}
          />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}