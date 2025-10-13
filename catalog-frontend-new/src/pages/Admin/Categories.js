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
import CategoryForm from '../../components/Admin/CategoryForm';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';

export default function Categories() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Kategoriler yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (categoryData) => {
    try {
      if (currentCategory) {
        await updateCategory(currentCategory._id, categoryData);
        setSnackbar({
          open: true,
          message: 'Kategori başarıyla güncellendi',
          severity: 'success'
        });
      } else {
        await createCategory(categoryData);
        setSnackbar({
          open: true,
          message: 'Kategori başarıyla oluşturuldu',
          severity: 'success'
        });
      }
      fetchCategories();
      setOpenForm(false);
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
      await deleteCategory(categoryToDelete._id);
      setSnackbar({
        open: true,
        message: 'Kategori başarıyla silindi',
        severity: 'success'
      });
      fetchCategories();
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
    fetchCategories();
  }, []);

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? "h5" : "h4"}>Kategori Yönetimi</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setCurrentCategory(null);
            setOpenForm(true);
          }}
          size={isMobile ? "small" : "medium"}
        >
          {isMobile ? 'Yeni' : 'Yeni Kategori'}
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
                <TableCell>Kategori Adı</TableCell>
                {!isMobile && <TableCell>Alt Kategoriler</TableCell>}
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category._id} hover>
                  <TableCell>{category.name}</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {category.subcategories?.map(sc => sc.name).join(', ')}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => {
                        setCurrentCategory(category);
                        setOpenForm(true);
                      }} 
                      size={isMobile ? "small" : "medium"}
                      sx={{ mr: 1 }}
                    >
                      <Edit fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                    <IconButton 
                      onClick={() => {
                        setCategoryToDelete(category);
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
        <DialogTitle>Kategori Silme</DialogTitle>
        <DialogContent>
          <Typography>
            "{categoryToDelete?.name}" isimli kategoriyi silmek istediğinize emin misiniz?
          </Typography>
          {categoryToDelete?.subcategories?.length > 0 && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Uyarı: Bu kategori altında {categoryToDelete.subcategories.length} alt kategori bulunmaktadır.
            </Typography>
          )}
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{currentCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
        <DialogContent dividers>
          <CategoryForm
            category={currentCategory}
            onSave={handleSave}
            onCancel={() => setOpenForm(false)}
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