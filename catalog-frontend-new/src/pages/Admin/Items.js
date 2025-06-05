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
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import ItemForm from '../../components/Admin/ItemForm';
import { getItems, createItem, updateItem, deleteItem } from '../../services/api';

export default function Items() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
        message: 'Ürünler yüklenirken hata oluştu',
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
          message: 'Ürün başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        await createItem(itemData);
        setSnackbar({
          open: true,
          message: 'Ürün başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      fetchItems();
      setOpenForm(false);
      setCurrentItem(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'İşlem başarısız oldu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem(itemToDelete._id);
      setSnackbar({
        open: true,
        message: 'Ürün başarıyla silindi',
        severity: 'success'
      });
      fetchItems();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Silme işlemi başarısız',
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
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? "h5" : "h4"}>Ürün Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCurrentItem(null);
            setOpenForm(true);
          }}
          size={isMobile ? "small" : "medium"}
        >
          {isMobile ? 'Yeni' : 'Yeni Ürün'}
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer 
          component={Paper} 
          sx={{ 
            maxWidth: '100%',
            overflowX: 'auto',
            boxShadow: 'none',
            border: '1px solid #eee'
          }}
        >
          <Table size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>Ürün Adı</TableCell>
                {!isMobile && <TableCell>Kategori</TableCell>}
                <TableCell>Fiyat</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell sx={{ maxWidth: isMobile ? 120 : 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </TableCell>
                  {!isMobile && <TableCell>{item.category}</TableCell>}
                  <TableCell>₺{item.price?.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => handleEdit(item)} 
                      size={isMobile ? "small" : "medium"}
                      sx={{ mr: 1 }}
                    >
                      <Edit fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteConfirm(true);
                      }} 
                      size={isMobile ? "small" : "medium"}
                      color="error"
                    >
                      <Delete fontSize={isMobile ? "small" : "medium"} />
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
        fullScreen={isMobile}
      >
        <DialogTitle>Ürün Silme</DialogTitle>
        <DialogContent>
          <Typography>
            "{itemToDelete?.name}" isimli ürünü silmek istediğinize emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>İptal</Button>
          <Button onClick={handleDelete} color="error">Sil</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openForm} 
        onClose={() => setOpenForm(false)} 
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{currentItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
        <DialogContent dividers>
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}