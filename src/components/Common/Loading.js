import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Composant de chargement réutilisable - Style Material UI 2025
 */
const Loading = ({ message = 'Chargement...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      <CircularProgress size={48} thickness={4} />
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 2, fontWeight: 500 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
