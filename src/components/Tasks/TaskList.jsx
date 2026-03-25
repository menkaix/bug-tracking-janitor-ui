import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { TASK_STATUS_OPTIONS, getTaskStatusInfo } from '../../models/task.model';
import { resolveAssigneeNames } from '../../utils/assigneeUtils';
import { formatDate } from '../../utils/dateUtils';

/**
 * Table des tâches (vue liste).
 * Composant purement présentationnel.
 */
const TaskList = ({
  tasks,
  projects,
  persons,
  selectedTasks,
  isLoading,
  isFetching,
  onSelectAll,
  onSelectTask,
  onStatusChange,
  onProjectChange,
  onAddAssignee,
  onRemoveAssignee,
  onEditTask,
  onDeleteTask,
}) => {
  const theme = useTheme();
  const isSelected = (id) => selectedTasks.includes(id);

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, mb: 4, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                indeterminate={selectedTasks.length > 0 && selectedTasks.length < tasks.length}
                checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                onChange={onSelectAll}
                inputProps={{ 'aria-label': 'select all tasks' }}
              />
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Titre</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Projet</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Assignés</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Échéance</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estimation</TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => {
            const itemSelected = isSelected(task.id);
            const statusInfo = getTaskStatusInfo(task.status);
            const assigneesArr = task.assignees || [];
            const assigneeNames = resolveAssigneeNames(assigneesArr, persons);

            return (
              <TableRow
                key={task.id}
                hover
                onClick={(e) => onSelectTask(e, task.id)}
                role="checkbox"
                aria-checked={itemSelected}
                selected={itemSelected}
                sx={{
                  cursor: 'pointer',
                  '&.Mui-selected': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                  '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12) },
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                  transition: 'background-color 0.2s',
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox color="primary" checked={itemSelected} inputProps={{ 'aria-labelledby': `task-checkbox-${task.id}` }} />
                </TableCell>

                <TableCell>
                  <Typography variant="body1" fontWeight={500}>{task.title}</Typography>
                  {task.trackingReference && (
                    <Typography variant="caption" color="text.secondary">{task.trackingReference}</Typography>
                  )}
                </TableCell>

                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={task.projectId || ''}
                      onChange={(e) => onProjectChange(task.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Aucun projet</MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.projectCode} - {project.projectName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    {assigneeNames.map((name, index) => {
                      const email = assigneesArr[index];
                      return (
                        <Chip
                          key={email}
                          label={name}
                          size="small"
                          onDelete={() => onRemoveAssignee(task.id, email)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ borderRadius: 2 }}
                        />
                      );
                    })}
                    {(!task.assignees || task.assignees.length === 0) && (
                      <Typography variant="caption" color="text.secondary">Non assigné</Typography>
                    )}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value=""
                        onChange={(e) => { if (e.target.value) onAddAssignee(task.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        displayEmpty
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="" disabled>+ Assigner</MenuItem>
                        {persons
                          .filter((p) => !assigneesArr.includes(p.email))
                          .map((person) => (
                            <MenuItem key={person.id} value={person.email}>
                              {person.firstName} {person.lastName}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </TableCell>

                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      value={task.status || ''}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ borderRadius: 2 }}
                      renderValue={(value) => {
                        const info = getTaskStatusInfo(value);
                        return (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ color: `${info.color}.main`, display: 'flex', alignItems: 'center' }}>{info.icon}</Box>
                            <Typography variant="body2" fontWeight={500}>{info.label}</Typography>
                          </Stack>
                        );
                      }}
                    >
                      <MenuItem value=""><Typography variant="body2" color="text.secondary">Aucun statut</Typography></MenuItem>
                      {TASK_STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ color: `${option.color}.main`, display: 'flex', alignItems: 'center' }}>{option.icon}</Box>
                            <Typography variant="body2" fontWeight={500}>{option.label}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                      {task.status && !TASK_STATUS_OPTIONS.find((o) => o.value === task.status.toLowerCase()) && (
                        <MenuItem value={task.status}><Typography variant="body2">{task.status}</Typography></MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{formatDate(task.dueDate)}</Typography>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{task.estimate || '-'}</Typography>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="Éditer">
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                        color="primary"
                        size="small"
                        sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        color="error"
                        size="small"
                        sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {tasks.length === 0 && !isLoading && !isFetching && (
        <Box sx={{ p: 8, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Aucune tâche trouvée</Typography>
        </Box>
      )}
    </TableContainer>
  );
};

export default TaskList;
