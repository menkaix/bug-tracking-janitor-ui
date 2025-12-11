import React from 'react';
import { Box, Alert, AlertTitle, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

/**
 * Composant d'affichage d'erreur réutilisable - Style Material UI 2025
 */
const ErrorMessage = ({ message, onRetry }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Alert
        severity="error"
        sx={{
          maxWidth: 600,
          width: '100%',
          borderRadius: 2,
          boxShadow: 1,
        }}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Réessayer
            </Button>
          )
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Erreur</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorMessage;
