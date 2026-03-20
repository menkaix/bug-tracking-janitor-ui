import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  Psychology as PsychologyIcon,
  Block as BlockIcon,
  FactCheck as FactCheckIcon,
  Science as ScienceIcon,
  RemoveDone as RemoveDoneIcon,
  MoreHoriz as MoreHorizIcon,
} from '@mui/icons-material';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate } from '../../utils/dateUtils';
import { KANBAN_STATUS_OPTIONS } from '../../models/task.model';
import { assigneeToArray, resolveAssigneeNames } from '../../utils/assigneeUtils';

/**
 * Composant pour une carte de tâche draggable
 */
const STATUS_OPTIONS = KANBAN_STATUS_OPTIONS;

const TaskCard = React.memo(({ task, persons, onEdit, onDelete, onStatusChange, isDragging = false }) => {
  const theme = useTheme();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const getAssigneesNames = (assignees) => resolveAssigneeNames(assignees, persons);

  const assigneesArray = assigneeToArray(task.assignee);
  const assigneeNames = getAssigneesNames(assigneesArray);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: 2,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? 4 : 1,
        '&:hover': {
          boxShadow: 3,
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        },
        transition: 'box-shadow 0.2s, background-color 0.2s',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>
          {/* Titre */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
            {task.title}
          </Typography>

          {/* Référence */}
          {task.trackingReference && (
            <Chip
              label={task.trackingReference}
              size="small"
              variant="outlined"
              sx={{ alignSelf: 'flex-start', fontSize: '0.7rem', height: 20 }}
            />
          )}

          {/* Assignés */}
          {assigneeNames.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {assigneeNames.map((name, index) => (
                <Chip
                  key={assigneesArray[index]}
                  label={name}
                  size="small"
                  icon={<PersonIcon sx={{ fontSize: '0.9rem' }} />}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    '& .MuiChip-icon': { ml: 0.5 },
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Footer avec dates et actions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            {/* Date d'échéance */}
            {task.deadLine && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(task.deadLine)}
                </Typography>
              </Stack>
            )}
            <Box sx={{ flex: 1 }} />

            {/* Actions */}
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Éditer">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  sx={{
                    padding: 0.5,
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                  }}
                >
                  <EditIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Supprimer">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  sx={{
                    padding: 0.5,
                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Sélecteur de statut */}
          <Box
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Select
              value={task.status || ''}
              onChange={(e) => onStatusChange(task.id, e.target.value)}
              size="small"
              fullWidth
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                '& .MuiSelect-select': { py: 0.5, px: 1 },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.5),
                },
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
});

/**
 * Composant pour une colonne Kanban
 */
const COLUMN_PAGE_SIZE = 20;

const KanbanColumn = React.memo(({ status, label, icon, color, tasks, persons, onEdit, onDelete, onStatusChange }) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  const [visibleCount, setVisibleCount] = useState(COLUMN_PAGE_SIZE);

  const visibleTasks = tasks.slice(0, visibleCount);
  const hasMore = tasks.length > visibleCount;

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        minWidth: 300,
        maxWidth: 350,
        p: 2,
        backgroundColor: isOver
          ? alpha(theme.palette.primary.main, 0.1)
          : alpha(theme.palette.background.paper, 0.8),
        borderRadius: 2,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 300px)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.2s',
        border: isOver ? `2px dashed ${theme.palette.primary.main}` : '2px solid transparent',
      }}
    >
      {/* En-tête de la colonne */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box sx={{ color: `${color}.main`, display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {label}
        </Typography>
        <Chip
          label={tasks.length}
          size="small"
          sx={{
            height: 20,
            minWidth: 20,
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      </Stack>

      {/* Liste des tâches */}
      <Box sx={{ overflowY: 'auto', flex: 1 }}>
        <SortableContext items={visibleTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              persons={persons}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary',
            }}
          >
            <Typography variant="caption">Aucune tâche</Typography>
          </Box>
        )}

        {hasMore && (
          <Button
            size="small"
            fullWidth
            onClick={() => setVisibleCount(c => c + COLUMN_PAGE_SIZE)}
            sx={{ mt: 1, fontSize: '0.75rem' }}
          >
            Voir plus ({tasks.length - visibleCount} restantes)
          </Button>
        )}
      </Box>
    </Paper>
  );
});

/**
 * Composant principal du Kanban Board
 */
const KanbanBoard = ({ tasks, persons, onEditTask, onDeleteTask, onStatusChange }) => {
  const [activeId, setActiveId] = useState(null);
  // Optimistic local state : appliqué immédiatement pendant le drag, avant que le parent confirme
  const [localOverrides, setLocalOverrides] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Permet un petit mouvement avant d'activer le drag
      },
    })
  );

  // Définition des colonnes
  const columns = [
    {
      id: 'others',
      label: 'Autres',
      color: 'default',
      icon: <MoreHorizIcon fontSize="small" />,
      statusValues: ['no-status', 'other'], // Sera calculé dynamiquement
    },
    {
      id: 'to-study',
      label: 'À étudier',
      color: 'default',
      icon: <PsychologyIcon fontSize="small" />,
      statusValues: ['to-study'],
    },
    {
      id: 'todo',
      label: 'À faire',
      color: 'secondary',
      icon: <AssignmentIcon fontSize="small" />,
      statusValues: ['todo'],
    },
    {
      id: 'in-progress',
      label: 'En cours',
      color: 'info',
      icon: <ScheduleIcon fontSize="small" />,
      statusValues: ['in-progress'],
    },
    {
      id: 'to-test',
      label: 'À tester',
      color: 'info',
      icon: <FactCheckIcon fontSize="small" />,
      statusValues: ['to-test', 'testing'],
    },
    {
      id: 'done',
      label: 'Terminé',
      color: 'success',
      icon: <CheckCircleIcon fontSize="small" />,
      statusValues: ['done'],
    },
    {
      id: 'pending',
      label: 'En attente',
      color: 'warning',
      icon: <PendingIcon fontSize="small" />,
      statusValues: ['pending'],
    },
    {
      id: 'canceled',
      label: 'Annulé',
      color: 'error',
      icon: <BlockIcon fontSize="small" />,
      statusValues: ['canceled'],
    },
  ];

  // Tâches avec overrides locaux appliqués pour le retour visuel immédiat
  const tasksWithOverrides = tasks.map(t =>
    localOverrides[t.id] !== undefined ? { ...t, status: localOverrides[t.id] } : t
  );

  // Organiser les tâches par colonne
  const getTasksForColumn = (column) => {
    if (column.id === 'others') {
      const standardStatuses = columns
        .filter(c => c.id !== 'others')
        .flatMap(c => c.statusValues);

      return tasksWithOverrides.filter(task => {
        const taskStatus = (task.status || '').toLowerCase();
        return !taskStatus || !standardStatuses.includes(taskStatus);
      });
    }

    return tasksWithOverrides.filter(task => column.statusValues.includes((task.status || '').toLowerCase()));
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const taskId = active.id;
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      setActiveId(null);
      return;
    }

    // Déterminer la colonne de destination
    let targetColumn = null;

    // Vérifier si on a droppé sur une autre tâche
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) {
      // Trouver la colonne de la tâche sur laquelle on a droppé
      targetColumn = columns.find(col => {
        const colTasks = getTasksForColumn(col);
        return colTasks.some(t => t.id === over.id);
      });
    } else {
      // On a droppé directement sur une colonne
      targetColumn = columns.find(col => col.id === over.id);
    }

    if (targetColumn) {
      let newStatus;
      if (targetColumn.id === 'others') {
        newStatus = '';
      } else if (targetColumn.statusValues.length === 1) {
        newStatus = targetColumn.statusValues[0];
      } else {
        newStatus = targetColumn.statusValues[0];
      }

      if (task.status !== newStatus) {
        // Retour visuel immédiat (avant confirmation backend)
        setLocalOverrides(prev => ({ ...prev, [taskId]: newStatus }));
        onStatusChange(taskId, newStatus);
        // Nettoyer l'override local après que le parent a mis à jour son état
        setTimeout(() => setLocalOverrides(prev => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        }), 2000);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasksWithOverrides.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          px: 1,
        }}
      >
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column);
          return (
            <Box key={column.id}>
              <KanbanColumn
                status={column.id}
                label={column.label}
                icon={column.icon}
                color={column.color}
                tasks={columnTasks}
                persons={persons}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onStatusChange}
              />
            </Box>
          );
        })}
      </Box>

      <DragOverlay>
        {activeTask ? (
          <Box sx={{ opacity: 0.8, transform: 'rotate(3deg)' }}>
            <TaskCard
              task={activeTask}
              persons={persons}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
