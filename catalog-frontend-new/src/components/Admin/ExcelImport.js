import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Link
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Description
} from '@mui/icons-material';
import { exportProductsTemplate, importProductsExcel, exportProducts } from '../../services/api';

const ExcelImport = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDownloadTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exportProductsTemplate();
      
      // Blob'u indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'urun-sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError('Şablon indirilirken hata oluştu: ' + err.message);
    }
    setLoading(false);
  };

  const handleExportProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exportProducts();
      
      // Blob'u indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mevcut-urunler.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError('Ürünler export edilirken hata oluştu: ' + err.message);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await importProductsExcel(formData);
      setResult(response.data);
    } catch (err) {
      setError('Dosya yüklenirken hata oluştu: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Excel ile Toplu Ürün İşlemleri
      </Typography>

      <Grid container spacing={3}>
        {/* Şablon İndirme */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Şablon İndir
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Excel şablonunu indirerek ürünleri toplu olarak ekleyebilirsiniz.
                Şablon içinde kategori referansları ve yönergeler bulunmaktadır.
              </Typography>
              <Button
                variant="contained"
                startIcon={<CloudDownload />}
                onClick={handleDownloadTemplate}
                disabled={loading}
              >
                Şablon İndir
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Mevcut Ürünleri Export Etme */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Mevcut Ürünleri Dışa Aktar
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Mevcut tüm ürünleri Excel formatında dışa aktarabilirsiniz.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={handleExportProducts}
                disabled={loading}
              >
                Ürünleri Export Et
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Dosya Yükleme */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Excel Dosyası Yükle
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Doldurulmuş Excel şablonunu yükleyerek ürünleri toplu olarak ekleyebilirsiniz.
              </Typography>
              
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUpload />}
                disabled={loading}
              >
                Excel Dosyası Yükle
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls"
                />
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            İşlem Sonuçları
          </Typography>
          <Typography>
            Toplam: {result.results.total} kayıt<br />
            Başarılı: {result.results.success} kayıt<br />
            Hatalı: {result.results.skipped} kayıt
          </Typography>
          
          {result.results.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Hata Detayları:</Typography>
              {result.results.errors.slice(0, 5).map((error, index) => (
                <Typography key={index} variant="body2" color="error">
                  Satır {error.row}: {error.error}
                </Typography>
              ))}
              {result.results.errors.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  ...ve {result.results.errors.length - 5} daha fazla hata
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ExcelImport;