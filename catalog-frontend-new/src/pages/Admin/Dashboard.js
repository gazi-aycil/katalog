import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { getCategories, getItems } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    categories: 0,
    items: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [categoriesRes, itemsRes] = await Promise.all([
          getCategories(),
          getItems()
        ]);
        setStats({
          categories: categoriesRes.data.length,
          items: itemsRes.data.length,
          loading: false,
          error: null
        });
      } catch (err) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load dashboard statistics'
        }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Box mt={4}>
        <Typography color="error">{stats.error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ravinzo Katalog Admin Panel
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Kategoriler</Typography>
              <Typography variant="h3">{stats.categories}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Ürünler</Typography>
              <Typography variant="h3">{stats.items}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;