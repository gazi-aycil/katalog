import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Chip,
  IconButton,
  Avatar,
  Input,
  FormControl,
  Typography,
  Divider,
  Stack,
  Paper,
  Grid
} from '@mui/material';
import { Add, Delete, CloudUpload } from '@mui/icons-material';

export default function CategoryForm({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.name || '');
  const [subcategories, setSubcategories] = useState(
    category?.subcategories?.map(sc => ({ 
      name: sc.name, 
      imageUrl: sc.imageUrl || '' 
    })) || []
  );
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newSubcategoryImage, setNewSubcategoryImage] = useState(null);
  const [categoryImage, setCategoryImage] = useState(category?.imageUrl || '');

  const handleImageUpload = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      setSubcategories([...subcategories, {
        name: newSubcategory.trim(),
        imageUrl: newSubcategoryImage || ''
      }]);
      setNewSubcategory('');
      setNewSubcategoryImage(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name,
      imageUrl: categoryImage,
      subcategories
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Main Category Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Category Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Category Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    fullWidth
                    size="small"
                  >
                    Upload Category Image
                    <Input
                      type="file"
                      hidden
                      onChange={(e) => handleImageUpload(e, setCategoryImage)}
                      accept="image/*"
                    />
                  </Button>
                  {categoryImage && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={categoryImage} 
                        sx={{ width: 40, height: 40, mr: 1 }}
                        variant="rounded"
                      />
                      <Typography variant="caption">Image selected</Typography>
                    </Box>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Subcategories Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #eee' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Subcategories
            </Typography>
            
            {/* Existing Subcategories */}
            {subcategories.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Subcategories
                </Typography>
                <Grid container spacing={2}>
                  {subcategories.map((subcat, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                        {subcat.imageUrl && (
                          <Avatar 
                            src={subcat.imageUrl} 
                            sx={{ width: 40, height: 40, mr: 2 }}
                            variant="rounded"
                          />
                        )}
                        <Typography sx={{ flexGrow: 1 }}>{subcat.name}</Typography>
                        <IconButton 
                          onClick={() => setSubcategories(subcategories.filter((_, i) => i !== index))}
                          size="small"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Add New Subcategory */}
            <Typography variant="subtitle2" gutterBottom>
              Add New Subcategory
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Subcategory Name"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  fullWidth
                  size="small"
                >
                  Upload Image
                  <Input
                    type="file"
                    hidden
                    onChange={(e) => handleImageUpload(e, setNewSubcategoryImage)}
                    accept="image/*"
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  onClick={handleAddSubcategory}
                  variant="contained"
                  startIcon={<Add />}
                  disabled={!newSubcategory.trim()}
                  fullWidth
                  size="small"
                >
                  Add
                </Button>
              </Grid>
            </Grid>
            {newSubcategoryImage && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={newSubcategoryImage} 
                  sx={{ width: 30, height: 30, mr: 1 }}
                  variant="rounded"
                />
                <Typography variant="caption">Image ready</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Form Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel} variant="outlined" size="large">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              size="large"
            >
              Save Category
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}