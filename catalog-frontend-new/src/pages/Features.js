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
  Card,
  CardContent,
} from '@mui/material';
import { Delete, Add, PlaylistAdd } from '@mui/icons-material';

const FEATURES_STORAGE_KEY = 'product_features';

// Özellik türleri
const FEATURE_TYPES = {
  USAGE_AREA: 'usage_area',
  PRODUCT_MEASUREMENTS: 'product_measurements',
  PRODUCT_PROPERTIES: 'product_properties'
};

// Excel'den alınan özellikler
const EXCEL_FEATURES = {
  USAGE_AREAS: {
    DIS_CEPH: [
      "Dış Cephe Kaplama",
      "Bina Temel Alın Kısmı Kaplama",
      "Çatı Saçak Alın Kısmı",
      "Çatı Saçak Altı",
      "Dış Cephe Pencere Kenar Söve",
      "Havuz Kenarları Döşeme",
      "Havuz İçi Döşeme",
      "Kamelya Yapımı",
      "Bahçe Yürüyüş Yolu Döşeme",
      "Bina Giriş Üstü Markizlerinizde",
      "Villa Giriş Üstü Markizlerinizde",
      "Bahçe Duvarı Kaplama & Döşeme"
    ],
    IC_CEPH: [
      "Mutfak İçi Duvar Döşeme",
      "Tezgah Alın Kısmı Döşeme",
      "Lavabo & WC Duvarı",
      "Banyo İçi Duvar Döşeme",
      "TV Ünite Arkası",
      "Yatak Odası Yatak Başı Duvarı",
      "Mağaza Vitrin Döşeme",
      "Ev ve İşyeri Taban Döşemeleri",
      "Ev ve İşyeri İç Mekan Taban Döşemeleri Dekor Amaçlı",
      "Mağaza Ara Bölmelerde",
      "Bina Girişleri Taban Döşeme",
      "Bina Giriş Holü Duvar Döşeme",
      "Villa Giriş Holü Duvar Kaplama",
      "Salon Duvar Döşeme",
      "Ada Mutfak Yan Döşeme",
      "İç Mekan Tavan Döşemelerinde"
    ]
  },
  MEASUREMENTS: [
    { name: "En - Boy", description: "Ürün en ve boy ölçüleri" },
    { name: "1 m2 Adet Sayısı", description: "1 metrekaredeki adet sayısı" },
    { name: "1 m2 Kilogram", description: "1 metrekarenin kilogram cinsinden ağırlığı" },
    { name: "1 Palet Metrekare", description: "1 paletteki toplam metrekare" },
    { name: "1 Paket Adet Sayısı", description: "1 paketteki adet sayısı" },
    { name: "1 Paket Metrekare", description: "1 paketteki toplam metrekare" }
  ],
  PROPERTIES: [
    "Yüzeyi Kaplamadır",
    "Solma Yapmaz",
    "Tekrar Boyanabilir",
    "Güneşten Solar",
    "Isıdan Etkilenmez",
    "Sudan Etkilenmez",
    "Sudan Etkilenir",
    "Isı Yalıtım Özelliği Yoktur",
    "Isı Yalıtım Özelliği vardır"
  ]
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
    const types = [FEATURE_TYPES.USAGE_AREA, FEATURE_TYPES.PRODUCT_MEASUREMENTS, FEATURE_TYPES.PRODUCT_PROPERTIES];
    setFeatureType(types[newValue]);
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
      hasValue: featureType === FEATURE_TYPES.PRODUCT_MEASUREMENTS,
      createdAt: new Date().toISOString()
    };

    setFeatures(prev => [...prev, newFeature]);
    setNewFeatureName('');
    setNewFeatureDesc('');
    showAlert('Özellik başarıyla eklendi', 'success');
  };

  // Excel'den özellikleri toplu ekle
  const handleAddExcelFeatures = (category) => {
    let featuresToAdd = [];
    
    switch (category) {
      case 'dis_ceph':
        featuresToAdd = EXCEL_FEATURES.USAGE_AREAS.DIS_CEPH.map(name => ({
          id: `dis_ceph_${Date.now()}_${Math.random()}`,
          name,
          description: 'Dış Cephe Kullanım Alanı',
          type: FEATURE_TYPES.USAGE_AREA,
          hasValue: false,
          createdAt: new Date().toISOString()
        }));
        break;
        
      case 'ic_ceph':
        featuresToAdd = EXCEL_FEATURES.USAGE_AREAS.IC_CEPH.map(name => ({
          id: `ic_ceph_${Date.now()}_${Math.random()}`,
          name,
          description: 'İç Cephe Kullanım Alanı',
          type: FEATURE_TYPES.USAGE_AREA,
          hasValue: false,
          createdAt: new Date().toISOString()
        }));
        break;
        
      case 'measurements':
        featuresToAdd = EXCEL_FEATURES.MEASUREMENTS.map(item => ({
          id: `measure_${Date.now()}_${Math.random()}`,
          name: item.name,
          description: item.description,
          type: FEATURE_TYPES.PRODUCT_MEASUREMENTS,
          hasValue: true,
          createdAt: new Date().toISOString()
        }));
        break;
        
      case 'properties':
        featuresToAdd = EXCEL_FEATURES.PROPERTIES.map(name => ({
          id: `prop_${Date.now()}_${Math.random()}`,
          name,
          description: 'Ürün Özelliği',
          type: FEATURE_TYPES.PRODUCT_PROPERTIES,
          hasValue: false,
          createdAt: new Date().toISOString()
        }));
        break;
        
      default:
        return;
    }
    
    // Sadece mevcut olmayan özellikleri ekle
    const existingNames = features.map(f => f.name.toLowerCase());
    const newFeatures = featuresToAdd.filter(f => !existingNames.includes(f.name.toLowerCase()));
    
    if (newFeatures.length === 0) {
      showAlert('Tüm özellikler zaten mevcut', 'info');
      return;
    }
    
    setFeatures(prev => [...prev, ...newFeatures]);
    showAlert(`${newFeatures.length} yeni özellik eklendi`, 'success');
  };

  const handleDeleteFeature = (id) => {
    setFeatures(prev => prev.filter(f => f.id !== id));
    showAlert('Özellik silindi', 'info');
  };

  const handleDeleteAllFeatures = (type) => {
    setFeatures(prev => prev.filter(f => f.type !== type));
    showAlert('Tüm özellikler silindi', 'info');
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
    setTimeout(() => setAlert(prev => ({ ...prev, open: false })), 3000);
  };

  // Kullanım alanlarını filtrele
  const usageAreaFeatures = features.filter(f => f.type === FEATURE_TYPES.USAGE_AREA);
  const measurementFeatures = features.filter(f => f.type === FEATURE_TYPES.PRODUCT_MEASUREMENTS);
  const propertyFeatures = features.filter(f => f.type === FEATURE_TYPES.PRODUCT_PROPERTIES);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Özellik Ayarları
      </Typography>

      {alert.open && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Excel Özellikleri Toplu Ekleme */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'primary.50' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
          📊 Excel'den Toplu Özellik Ekleme
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Kullanım Alanları - Dış Cephe
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {EXCEL_FEATURES.USAGE_AREAS.DIS_CEPH.length} özellik
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={() => handleAddExcelFeatures('dis_ceph')}
                  fullWidth
                  size="small"
                >
                  Dış Cephe Özelliklerini Ekle
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Kullanım Alanları - İç Cephe
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {EXCEL_FEATURES.USAGE_AREAS.IC_CEPH.length} özellik
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={() => handleAddExcelFeatures('ic_ceph')}
                  fullWidth
                  size="small"
                >
                  İç Cephe Özelliklerini Ekle
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Ürün Ölçüleri
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {EXCEL_FEATURES.MEASUREMENTS.length} özellik
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={() => handleAddExcelFeatures('measurements')}
                  fullWidth
                  size="small"
                >
                  Ölçü Özelliklerini Ekle
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Ürün Özellikleri
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {EXCEL_FEATURES.PROPERTIES.length} özellik
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PlaylistAdd />}
                  onClick={() => handleAddExcelFeatures('properties')}
                  fullWidth
                  size="small"
                >
                  Genel Özellikleri Ekle
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Yeni Özellik Ekleme Formu */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Manuel Özellik Ekle
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
                <MenuItem value={FEATURE_TYPES.PRODUCT_PROPERTIES}>Ürün Özellikleri</MenuItem>
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
                  : featureType === FEATURE_TYPES.PRODUCT_MEASUREMENTS
                  ? "Örn: Genişlik, Yükseklik, Ağırlık..."
                  : "Örn: Su Geçirmez, Ateşe Dayanıklı..."
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
          <Tab label={`Kullanım Alanları (${usageAreaFeatures.length})`} />
          <Tab label={`Ürün Ölçüleri (${measurementFeatures.length})`} />
          <Tab label={`Ürün Özellikleri (${propertyFeatures.length})`} />
        </Tabs>

        {/* Kullanım Alanları Tab'ı */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Kullanım Alanları</Typography>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={() => handleDeleteAllFeatures(FEATURE_TYPES.USAGE_AREA)}
                disabled={usageAreaFeatures.length === 0}
              >
                Tümünü Sil
              </Button>
            </Box>
            
            {usageAreaFeatures.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Henüz kullanım alanı eklenmemiş
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ürün Ölçüleri</Typography>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={() => handleDeleteAllFeatures(FEATURE_TYPES.PRODUCT_MEASUREMENTS)}
                disabled={measurementFeatures.length === 0}
              >
                Tümünü Sil
              </Button>
            </Box>
            
            {measurementFeatures.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Henüz ürün ölçüsü eklenmemiş
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

        {/* Ürün Özellikleri Tab'ı */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Ürün Özellikleri</Typography>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={() => handleDeleteAllFeatures(FEATURE_TYPES.PRODUCT_PROPERTIES)}
                disabled={propertyFeatures.length === 0}
              >
                Tümünü Sil
              </Button>
            </Box>
            
            {propertyFeatures.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="textSecondary">
                  Henüz ürün özelliği eklenmemiş
                </Typography>
              </Box>
            ) : (
              <List>
                {propertyFeatures.map((feature, index) => (
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
                                bgcolor: 'warning.light', 
                                color: 'white', 
                                px: 1, 
                                borderRadius: 1,
                                fontSize: '0.7rem'
                              }}
                            >
                              Ürün Özelliği
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
                    {index < propertyFeatures.length - 1 && <Divider variant="inset" component="li" />}
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
          <br />• <strong>Ürün Ölçüleri:</strong> Değer girişi ile kullanılır (örn: Genişlik: 120cm)
          <br />• <strong>Ürün Özellikleri:</strong> Checkbox ile seçilir (örn: Su Geçirmez, Ateşe Dayanıklı)
        </Typography>
      </Alert>
    </Box>
  );
}