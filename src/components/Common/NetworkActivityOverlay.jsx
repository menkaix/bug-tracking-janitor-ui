import React, { useSyncExternalStore } from 'react';
import { Box, Paper, Typography, LinearProgress, Stack, Chip } from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { networkActivityStore } from '../../services/networkActivity';

/**
 * Overlay fixe en bas à droite affichant les communications réseau en cours.
 * Chaque activité reste visible 5s après sa complétion avec l'issue (succès/échec).
 */
const NetworkActivityOverlay = () => {
  const activities = useSyncExternalStore(
    networkActivityStore.subscribe,
    networkActivityStore.getSnapshot
  );

  if (activities.length === 0) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 320,
        maxHeight: 320,
        overflowY: 'auto',
        zIndex: 2000,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Activité réseau
        </Typography>
      </Box>

      <Stack spacing={0} divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
        {activities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </Stack>
    </Paper>
  );
};

const ActivityRow = ({ activity }) => {
  const isPending = activity.status === 'pending';
  const isSuccess = activity.status === 'success';
  const isError = activity.status === 'error';

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={500}
            noWrap
            sx={{ color: isError ? 'error.main' : 'text.primary' }}
          >
            {activity.label}
          </Typography>
          {isPending && (
            <LinearProgress
              variant="indeterminate"
              sx={{ mt: 0.5, height: 2, borderRadius: 1 }}
            />
          )}
        </Box>

        {isPending && (
          <SyncIcon
            fontSize="small"
            sx={{
              color: 'primary.main',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
              flexShrink: 0,
            }}
          />
        )}
        {isSuccess && (
          <CheckIcon fontSize="small" sx={{ color: 'success.main', flexShrink: 0 }} />
        )}
        {isError && (
          <ErrorIcon fontSize="small" sx={{ color: 'error.main', flexShrink: 0 }} />
        )}
      </Stack>

      {!isPending && (
        <Chip
          label={isSuccess ? 'Succès' : 'Échec'}
          size="small"
          color={isSuccess ? 'success' : 'error'}
          variant="outlined"
          sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
        />
      )}
    </Box>
  );
};

export default NetworkActivityOverlay;
