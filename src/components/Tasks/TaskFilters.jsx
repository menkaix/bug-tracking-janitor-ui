import React from 'react';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Menu,
  Checkbox,
  Chip,
  Stack,
  Typography,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { TASK_STATUS_OPTIONS } from '../../models/task.model';

/**
 * Barre de filtres pour la page des tâches.
 * Composant purement présentationnel — toute la logique vient du hook useTasks.
 */
const TaskFilters = ({
  searchTerm, onSearchChange,
  projectFilter, onToggleProject, onClearProject,
  statusFilter, onToggleStatus, onClearStatus,
  assigneeFilter, onToggleAssignee, onClearAssignee,
  projects,
  persons,
}) => {
  const theme = useTheme();
  const [projectAnchorEl, setProjectAnchorEl] = React.useState(null);
  const [statusAnchorEl, setStatusAnchorEl] = React.useState(null);
  const [assigneeAnchorEl, setAssigneeAnchorEl] = React.useState(null);

  return (
    <Paper
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 3,
        boxShadow: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
      }}
    >
      <Stack spacing={2.5}>
        {/* Recherche */}
        <TextField
          fullWidth
          placeholder="Rechercher une tâche par titre, description ou référence..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 24 }} />,
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => onSearchChange('')} sx={{ mr: -1 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              backgroundColor: 'background.paper',
            },
          }}
        />

        {/* Filtres projet + statut + assigné */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
          {/* Filtre Projet */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33%' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FolderIcon />}
              endIcon={projectFilter.length > 0 && (
                <Chip label={projectFilter.length} size="small" color="primary" sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.75 } }} />
              )}
              onClick={(e) => setProjectAnchorEl(e.currentTarget)}
              sx={{
                height: 56, borderRadius: 2, justifyContent: 'space-between', px: 2,
                backgroundColor: 'background.paper',
                borderColor: projectFilter.length > 0 ? 'primary.main' : 'error.main',
                borderWidth: 2,
                fontWeight: projectFilter.length > 0 ? 600 : 400,
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                {projectFilter.length === 0
                  ? 'Sélectionner un projet *'
                  : projectFilter.length === 1
                    ? projects.find((p) => p.id === projectFilter[0])?.projectCode || projectFilter[0]
                    : `${projectFilter.length} projets sélectionnés`}
              </Box>
            </Button>
            <Menu
              anchorEl={projectAnchorEl}
              open={Boolean(projectAnchorEl)}
              onClose={() => setProjectAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 320, mt: 1, boxShadow: 4 } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                <Typography variant="subtitle2" fontWeight={700}>Sélectionner les projets</Typography>
                {projectFilter.length > 0 && (
                  <Button size="small" onClick={onClearProject} sx={{ minWidth: 'auto' }}>Effacer</Button>
                )}
              </Box>
              {projects.map((project) => (
                <MenuItem key={project.id} onClick={() => onToggleProject(project.id)} sx={{ py: 1.5 }}>
                  <Checkbox checked={projectFilter.includes(project.id)} sx={{ mr: 1 }} />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={project.projectCode} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Typography variant="body2">{project.projectName}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Filtre Statut */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33%' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterListIcon />}
              endIcon={statusFilter.length > 0 && (
                <Chip label={statusFilter.length} size="small" color="primary" sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.75 } }} />
              )}
              onClick={(e) => setStatusAnchorEl(e.currentTarget)}
              sx={{
                height: 56, borderRadius: 2, justifyContent: 'space-between', px: 2,
                backgroundColor: 'background.paper',
                borderColor: statusFilter.length > 0 ? 'primary.main' : 'divider',
                borderWidth: statusFilter.length > 0 ? 2 : 1,
                fontWeight: statusFilter.length > 0 ? 600 : 400,
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                {statusFilter.length === 0 ? 'Filtrer par statut'
                  : statusFilter.length === 1 ? TASK_STATUS_OPTIONS.find((o) => o.value === statusFilter[0])?.label
                  : `${statusFilter.length} statuts sélectionnés`}
              </Box>
            </Button>
            <Menu
              anchorEl={statusAnchorEl}
              open={Boolean(statusAnchorEl)}
              onClose={() => setStatusAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 280, mt: 1, boxShadow: 4 } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                <Typography variant="subtitle2" fontWeight={700}>Filtrer par statut</Typography>
                {statusFilter.length > 0 && (
                  <Button size="small" onClick={onClearStatus} sx={{ minWidth: 'auto' }}>Effacer</Button>
                )}
              </Box>
              {TASK_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} onClick={() => onToggleStatus(option.value)} sx={{ py: 1.5 }}>
                  <Checkbox checked={statusFilter.includes(option.value)} sx={{ mr: 1 }} />
                  <Chip icon={option.icon} label={option.label} color={option.color} size="small" sx={{ fontWeight: 500 }} />
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Filtre Assigné */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 33%' } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonIcon />}
              endIcon={assigneeFilter.length > 0 && (
                <Chip label={assigneeFilter.length} size="small" color="primary" sx={{ height: 20, minWidth: 20, '& .MuiChip-label': { px: 0.75 } }} />
              )}
              onClick={(e) => setAssigneeAnchorEl(e.currentTarget)}
              sx={{
                height: 56, borderRadius: 2, justifyContent: 'space-between', px: 2,
                backgroundColor: 'background.paper',
                borderColor: assigneeFilter.length > 0 ? 'primary.main' : 'divider',
                borderWidth: assigneeFilter.length > 0 ? 2 : 1,
                fontWeight: assigneeFilter.length > 0 ? 600 : 400,
              }}
            >
              <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                {assigneeFilter.length === 0 ? 'Filtrer par assigné'
                  : assigneeFilter.length === 1
                    ? (() => { const p = persons.find((x) => x.email === assigneeFilter[0]); return p ? `${p.firstName} ${p.lastName}` : assigneeFilter[0]; })()
                  : `${assigneeFilter.length} assignés sélectionnés`}
              </Box>
            </Button>
            <Menu
              anchorEl={assigneeAnchorEl}
              open={Boolean(assigneeAnchorEl)}
              onClose={() => setAssigneeAnchorEl(null)}
              PaperProps={{ sx: { borderRadius: 2, minWidth: 280, mt: 1, boxShadow: 4 } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider', backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                <Typography variant="subtitle2" fontWeight={700}>Filtrer par assigné</Typography>
                {assigneeFilter.length > 0 && (
                  <Button size="small" onClick={onClearAssignee} sx={{ minWidth: 'auto' }}>Effacer</Button>
                )}
              </Box>
              {persons.map((person) => (
                <MenuItem key={person.id} onClick={() => onToggleAssignee(person.email)} sx={{ py: 1.5 }}>
                  <Checkbox checked={assigneeFilter.includes(person.email)} sx={{ mr: 1 }} />
                  <Chip icon={<PersonIcon />} label={`${person.firstName} ${person.lastName}`} size="small" sx={{ fontWeight: 500 }} />
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Stack>

        {/* Chips filtres actifs */}
        {(searchTerm || projectFilter.length > 0 || statusFilter.length > 0 || assigneeFilter.length > 0) && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>Filtres actifs :</Typography>
            {searchTerm && (
              <Chip label={`Recherche: "${searchTerm}"`} size="small" onDelete={() => onSearchChange('')} color="primary" variant="outlined" icon={<SearchIcon />} />
            )}
            {projectFilter.map((id) => {
              const project = projects.find((p) => p.id === id);
              return (
                <Chip
                  key={id}
                  label={`Projet: ${project?.projectCode || id}`}
                  size="small"
                  onDelete={() => onToggleProject(id)}
                  color="primary"
                  variant="outlined"
                  icon={<FolderIcon />}
                />
              );
            })}
            {statusFilter.map((status) => {
              const info = TASK_STATUS_OPTIONS.find((o) => o.value === status) || { label: status, color: 'default', icon: null };
              return (
                <Chip key={status} label={info.label} size="small" icon={info.icon} onDelete={() => onToggleStatus(status)} color={info.color} variant="outlined" />
              );
            })}
            {assigneeFilter.map((email) => {
              const p = persons.find((x) => x.email === email);
              return (
                <Chip key={email} label={`Assigné: ${p ? `${p.firstName} ${p.lastName}` : email}`} size="small" icon={<PersonIcon />} onDelete={() => onToggleAssignee(email)} color="primary" variant="outlined" />
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default TaskFilters;
