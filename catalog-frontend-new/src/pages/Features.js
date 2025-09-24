import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';

const FEATURES_STORAGE_KEY = 'product_features';

// Özellik türleri
const FEATURE_TYPES = {
  USAGE_AREA: 'usage_area',
  PRODUCT_MEASUREMENTS: 'product_measurements'
};

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [featureType, setFeatureType] = useState(FEATURE_TYPES.USAGE_AREA);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);

  // Özellikleri localStorage'dan yükle
  useEffect(() => {
    const loadFeatures = () => {
      try {
        const savedFeatures = localStorage.getItem(FEATURES_STORAGE_KEY);
        if (savedFeatures) {
          setFeatures(JSON.parse(savedFeatures));
        }
      } catch (error) {
        console.error('Özellikler yüklenirken hata:', error);
      }
    };
    loadFeatures();
  }, []);

  // Özellikleri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(FEATURES_STORAGE_KEY, JSON.stringify(features));
  }, [features]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Tab değiştiğinde özellik türünü de güncelle
    setFeatureType(newValue === 0 ? FEATURE_TYPES.USAGE_AREA : FEATURE_TYPES.PRODUCT_MEASUREMENTS);
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) {
      showAlert('Özellik adı boş olamaz', 'error');
      return;
    }

    if (features.some(f => f.name.toLowerCase() === newFeatureName.toLowerCase() && f.type === featureType)) {
      showAlert('Bu özellik zaten mevcut', 'error');
      return;
    }

    const newFeature = {
      id: Date.now().toString(),
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim(),
      type: featureType,
      hasValue: featureType === FEATURE_TYPES.PRODUCT_MEASUREMENTS, // Ölçüler için value alanı
      createdAt: new Date().toISOString()
    };

    setFeatures(prev => [...prev, newFeature]);
    setNewFeatureName('');
    setNewFeatureDesc('');
    showAlert('Özellik başarıyla eklendi', 'success');
  };

  const handleDeleteFeature = (id) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
    showAlert('Özellik silindi', 'info');
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert(prev => ({ ...prev, open: false })), 3000);
  };

  // Kullanım alanlarını filtrele
  const usageAreaFeatures = features.filter(f => f.type === FEATURE_TYPES.USAGE_AREA);
  const measurementFeatures = features.filter(f => f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS);

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Özellik Ayarları
      </Typography>

      {alert.open && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Yeni Özellik Ekleme Formu */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Yeni Özellik Ekle
        </Typography>
        
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Özellik Türü</InputLabel>
              <Select
                value={featureType}
                label="Özellik Türü"
                onChange={(e) => setFeatureType(e.target.value)}
                size="medium"
              >
                <MenuItem value={FEATURE_TYPES.USAGE_AREA}>Kullanım Alanları</MenuItem>
                <MenuItem value={FEATURE_TYPES.PRODUCT_MEASUREMENTS}>Ürün Ölçüleri</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Özellik Adı"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder={
                featureType === FEATURE_TYPES.USAGE_AREA 
                  ? "Örn: Mutfak, Banyo, Ofis..." 
                  : "Örn: Genişlik, Yükseklik, Ağırlık..."
              }
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Açıklama (Opsiyonel)"
              value={newFeatureDesc}
              onChange={(e) => setNewFeatureDesc(e.target.value)}
              placeholder="Özellik açıklaması..."
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddFeature}
              fullWidth
              size="large"
              disabled={!newFeatureName.trim()}
            >
              Ekle
            </Button>
          </Grid>
        </Grid>
        
        {featureType === FEATURE_TYPES.PRODUCT_MEASUREMENTS && (
          <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
            💡 Bu özellik ürün ekleme/güncelleme formunda değer (value) alanı ile birlikte görünecektir.
          </Typography>
        )}
      </Paper>

      {/* Tab Panel */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 'bold' }
          }}
        >
          <Tab 
            label={`Kullanım Alanları (${usageAreaFeatures.length})`} 
          />
          <Tab 
            label={`Ürün Ölçüleri (${measurementFeatures.length})`} 
          />
        </Tabs>

        {/* Kullanım Alanları Tab'ı */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            {usageAreaFeatures.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Henüz kullanım alanı eklenmemiş
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Örneğin: "Mutfak", "Banyo", "Ofis", "Bahçe" gibi kullanım alanları ekleyin.
                </Typography>
              </Box>
            ) : (
              <List>
                {usageAreaFeatures.map((feature, index) => (
                  <React.Fragment key={feature.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {feature.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                bgcolor: 'primary.light', 
                                color: 'white', 
                                px: 1, 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            >
                              Kullanım Alanı
                            </Typography>
                          </Box>
                        }
                        secondary={
                          feature.description ? (
                            <Typography variant="body2" color="textSecondary">
                              {feature.description}
                            </Typography>
                          ) : null
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteFeature(feature.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < usageAreaFeatures.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Ürün Ölçüleri Tab'ı */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            {measurementFeatures.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Henüz ürün ölçüsü eklenmemiş
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Örneğin: "Genişlik", "Yükseklik", "Derinlik", "Ağırlık" gibi ölçü birimleri ekleyin.
                </Typography>
              </Box>
            ) : (
              <List>
                {measurementFeatures.map((feature, index) => (
                  <React.Fragment key={feature.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {feature.name}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                bgcolor: 'secondary.light', 
                                color: 'white', 
                                px: 1, 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            >
                              Ölçü Birimi
                            </Typography>
                            {feature.hasValue && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  bgcolor: 'success.light', 
                                  color: 'white', 
                                  px: 1, 
                                  borderRadius: 1,
                                  fontSize: '0.7rem'
                                }}
                              >
                                Değer Alanı
                              </Typography>
                            )}
                          </Box>
                        }
                        secondary={
                          feature.description ? (
                            <Typography variant="body2" color="textSecondary">
                              {feature.description}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              Bu özellik ürün formunda değer girişi gerektirir.
                            </Typography>
                          )
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteFeature(feature.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < measurementFeatures.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>

      {/* Bilgi Notu */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Bilgi:</strong> 
          <br />• <strong>Kullanım Alanları:</strong> Checkbox ile seçilir (örn: Mutfak, Banyo)
          <br />• <strong>Ürün Ölçüleri:</strong> Değer girişi ile kullanılır (örn: Genişlik: 120cm, Ağırlık: 15kg)
        </Typography>
      </Alert>
    </Box>
  );
}