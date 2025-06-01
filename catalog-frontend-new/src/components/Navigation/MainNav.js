import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@mui/material';

export default function MainNav() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Home</Button>
        <Button color="inherit" component={Link} to="/admin">Admin</Button>
      </Toolbar>
    </AppBar>
  );
}