import { Outlet, Link } from 'react-router-dom';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const drawerWidth = 240;

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin">
                <ListItemText primary="Anasayfa" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/categories">
                <ListItemText primary="Kategoriler" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/admin/products">
                <ListItemText primary="Ürünler" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}