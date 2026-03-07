import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as TasksIcon,
  Folder as ProjectsIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  BugReport as BugReportIcon,
  AccountTree as TreeIcon,
} from '@mui/icons-material';
import { apiService } from '../../services/api.service';

/**
 * Barre de navigation principale - Style Material UI 2025
 */
const Navbar = ({ onLogout }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    apiService.clearApiKey();
    onLogout();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/', label: 'Tableau de bord', icon: <DashboardIcon /> },
    { path: '/tasks', label: 'Tâches', icon: <TasksIcon /> },
    { path: '/projects', label: 'Projets', icon: <ProjectsIcon /> },
    { path: '/persons', label: 'Personnes', icon: <PeopleIcon /> },
    { path: '/feature-tree', label: 'Arbre Features', icon: <TreeIcon /> },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReportIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h6" fontWeight={700} color="primary">
          Bug Tracker
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={isActive(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 1 }}>
                {item.icon}
                <ListItemText primary={item.label} />
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Déconnexion
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
            {/* Logo et titre */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: { xs: 1, md: 0 } }}>
              <BugReportIcon
                sx={{
                  color: 'primary.main',
                  fontSize: { xs: 32, md: 36 },
                }}
              />
              <Typography
                variant="h5"
                component={Link}
                to="/"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textDecoration: 'none',
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                }}
              >
                Bug Tracker
              </Typography>
            </Box>

            {/* Menu desktop */}
            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, ml: 6 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    variant={isActive(item.path) ? 'contained' : 'text'}
                    sx={{
                      color: isActive(item.path) ? 'white' : 'text.primary',
                      px: 2.5,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: isActive(item.path) ? 600 : 500,
                      textTransform: 'none',
                      fontSize: '0.9375rem',
                      '&:hover': {
                        backgroundColor: isActive(item.path)
                          ? 'primary.dark'
                          : 'action.hover',
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Bouton déconnexion desktop */}
            {!isMobile && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  },
                }}
              >
                Déconnexion
              </Button>
            )}

            {/* Menu hamburger mobile */}
            {isMobile && (
              <IconButton
                color="primary"
                aria-label="open drawer"
                edge="end"
                onClick={handleDrawerToggle}
                sx={{ ml: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Drawer mobile */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
