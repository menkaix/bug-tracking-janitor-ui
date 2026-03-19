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
import { TASK_STATUS_OPTIONS } from '../../models/task.model';

/**
 * Barre d'actions en masse (sélection multiple).
 * Affiché uniquement quand des tâches sont sélectionnées.
 */
const TaskBulkActions = ({ selectedCount, persons, onClearSelection, onBulkDelete, onBulkStatusChange, onBulkAssign }) => {
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

      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'background.paper', borderRadius: 1 }}>
          <Select
            value=""
            displayEmpty
            onChange={(e) => onBulkStatusChange(e.target.value)}
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="" disabled>Changer statut...</MenuItem>
            {TASK_STATUS_OPTIONS.filter((o) => o.value !== 'no-status').map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'background.paper', borderRadius: 1 }}>
          <Select
            value=""
            displayEmpty
            onChange={(e) => onBulkAssign(e.target.value)}
            sx={{ borderRadius: 1 }}
          >
            <MenuItem value="" disabled>Assigner à...</MenuItem>
            {persons.map((person) => (
              <MenuItem key={person.id} value={person.email}>
                {person.firstName} {person.lastName}
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

export default TaskBulkActions;
