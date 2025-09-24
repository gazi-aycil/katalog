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
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';

const FEATURES_STORAGE_KEY = 'product_features';

export default function Features() {
  const [features, setFeatures] = useState([]);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

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

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) {
      showAlert('Özellik adı boş olamaz', 'error');
      return;
    }

    if (features.some(f => f.name.toLowerCase() === newFeatureName.toLowerCase())) {
      showAlert('Bu özellik zaten mevcut', 'error');
      return;
    }

    const newFeature = {
      id: Date.now().toString(),
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim(),
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

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
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
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Özellik Adı"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder="Örn: Renk, Boyut, Malzeme..."
              size="medium"
            />
          </Grid>
          <Grid item xs={12} md={5}>
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
      </Paper>

      {/* Mevcut Özellikler Listesi */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Mevcut Özellikler ({features.length})
          </Typography>
        </Box>
        
        <Divider />
        
        {features.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              Henüz özellik eklenmemiş
            </Typography>
          </Box>
        ) : (
          <List>
            {features.map((feature, index) => (
              <React.Fragment key={feature.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="medium">
                        {feature.name}
                      </Typography>
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
                      onClick={() => handleDelete