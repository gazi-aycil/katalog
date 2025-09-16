// ExcelImport.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  CloudUpload,
  CloudDownload,
  Description,
  Close,
  Error,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { exportProductsTemplate, importProductsExcel, exportProducts } from '../../services/api';

const steps = [
  'Şablon İndir',
  'Excel Dosyasını Düzenle',
  'Dosyayı Yükle'
];

const ExcelImport = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleDownloadTemplate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exportProductsTemplate();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'urun-sablonu.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      handleNext(); // Sonraki adıma geç
    } catch (err) {
      setError('Şablon indirilirken hata oluştu: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleExportProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exportProducts();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mevcut-urunler-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (err) {
      setError('Ürünler export edilirken hata oluştu: ' + (err.message || err));
    }
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Sadece Excel dosyaları (.xlsx, .xls) yükleyebilirsiniz');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await importProductsExcel(formData);
      setResult(response.data);
      setActiveStep(3); // Tamamlandı adımına geç
    } catch (err) {
      setError('Dosya yüklenirken hata oluştu: ' + (err.message || err));
    }
    setLoading(false);
    event.target.value = '';
  };

  return (
    <Box>
      {/* Geri Dön Butonu */}
      {onBack && (
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 3 }}
        >
          Ürün Formuna Dön
        </Button>
      )}

      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        📊 Excel ile Toplu Ürün İşlemleri
      </Typography>

      {/* Adım Adım Kılavuz */}
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step}>
            <StepLabel>{step}</StepLabel>
            <StepContent>
              {index === 0 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Excel şablonunu indirerek ürünleri toplu olarak ekleyebilirsiniz.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleDownloadTemplate}
                    disabled={loading}
                    startIcon={<CloudDownload />}
                  >
                    Şablonu İndir
                  </Button>
                </Box>
              )}
              {index === 1 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    İndirdiğiniz şablonu Excel'de açıp ürün bilgilerini doldurun.
                  </Typography>
                  <Button variant="outlined" onClick={handleBack} sx={{ mr: 1 }}>
                    Geri
                  </Button>
                  <Button variant="contained" onClick={handleNext}>
                    Devam Et
                  </Button>
                </Box>
              )}
              {index === 2 && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Doldurduğunuz Excel dosyasını yükleyin.
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
                  <Button onClick={handleBack} sx={{ ml: 1 }}>
                    Geri
                  </Button>
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Hızlı Erişim Kartları */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CloudDownload color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Şablon İndir
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Excel şablonunu indirerek ürünleri toplu olarak ekleyebilirsiniz.
              </Typography>
              <Button
                variant="contained"
                onClick={handleDownloadTemplate}
                disabled={loading}
                fullWidth
              >
                Şablon İndir
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Description color="secondary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Mevcut Ürünleri Dışa Aktar
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Mevcut tüm ürünleri Excel formatında dışa aktarın.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleExportProducts}
                disabled={loading}
                fullWidth
              >
                Ürünleri Export Et
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Yükleme Durumu */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4} alignItems="center" flexDirection="column">
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            İşlem yapılıyor, lütfen bekleyin...
          </Typography>
        </Box>
      )}

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Sonuçlar */}
      {result && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary">
              ⚡ İşlem Tamamlandı
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{result.results.total}</Typography>
                <Typography variant="body2">Toplam Kayıt</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{result.results.success}</Typography>
                <Typography variant="body2">Başarılı</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: result.results.skipped > 0 ? 'error.main' : 'grey.500', color: 'white', borderRadius: 2 }}>
                <Typography variant="h4">{result.results.skipped}</Typography>
                <Typography variant="body2">Hatalı</Typography>
              </Box>
            </Grid>
          </Grid>

          {result.results.errors.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Error />}
                onClick={() => setErrorDialogOpen(true)}
              >
                Hata Detaylarını Görüntüle ({result.results.errors.length} hata)
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Hata Detayları Dialog */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Hata Detayları
          <IconButton
            aria-label="close"
            onClick={() => setErrorDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <List>
            {result?.results.errors.map((error, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`Satır ${error.row}: ${error.error}`}
                  secondary={JSON.stringify(error.data, null, 2)}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExcelImport;