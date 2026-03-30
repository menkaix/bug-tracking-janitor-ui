import React from 'react';
import {
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ISSUE_STATUS_OPTIONS } from '../../models/task.model';

/**
 * Barre d'actions en masse pour les issues (sélection multiple).
 * Affiché uniquement quand des issues sont sélectionnées.
 */
const IssueBulkActions = ({
  selectedCount,
  projects,
  onClearSelection,
  onBulkDelete,
  onBulkStatusChange,
  onBulkProjectChange,
}) => {
  const theme = useTheme();

  if (selectedCount === 0) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="subtitle1" fontWeight={600} color="primary">
          {selectedCount} sélectionné(s)
        </Typography>
        <Tooltip title="Tout désélectionner">
          <IconButton size="small" onClick={onClearSelection}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160, backgroundColor: 'background.paper', borderRadius: 1 }}>
          <Select
            value=""
            displayEmpty
            onChange={(e) => onBulkStatusChange(e.target.value)}
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="" disabled>Changer statut...</MenuItem>
            {ISSUE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160, backgroundColor: 'background.paper', borderRadius: 1 }}>
          <Select
            value=""
            displayEmpty
            onChange={(e) => onBulkProjectChange(e.target.value)}
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="" disabled>Changer projet...</MenuItem>
            <MenuItem value={null}><em>— Aucun projet —</em></MenuItem>
            {(projects || []).map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.projectName || p.name} ({p.projectCode || p.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onBulkDelete}
          sx={{ borderRadius: 2 }}
        >
          Supprimer
        </Button>
      </Stack>
    </Paper>
  );
};

export default IssueBulkActions;
