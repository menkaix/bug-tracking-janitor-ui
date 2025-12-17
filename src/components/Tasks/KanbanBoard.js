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
import { format } from 'date-fns';

/**
 * Composant pour une carte de tâche draggable
 */
const TaskCard = ({ task, persons, onEdit, onDelete, isDragging = false }) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const assigneeToArray = (assigneeString) => {
    if (!assigneeString) return [];
    return assigneeString.split(',').map(e => e.trim()).filter(e => e);
  };

  const getAssigneesNames = (assignees) => {
    if (!assignees || assignees.length === 0) return [];
    return assignees
      .map(email => {
        const person = persons.find(p => p.email === email);
        return person ? person.firstName : email;
      })
      .filter(name => name);
  };

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
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Composant pour une colonne Kanban
 */
const KanbanColumn = ({ status, label, icon, color, tasks, persons, onEdit, onDelete }) => {
  const theme = useTheme();
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

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
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              persons={persons}
              onEdit={onEdit}
              onDelete={onDelete}
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
      </Box>
    </Paper>
  );
};

/**
 * Composant principal du Kanban Board
 */
const KanbanBoard = ({ tasks, persons, onEditTask, onDeleteTask, onStatusChange }) => {
  const [activeId, setActiveId] = useState(null);

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
      id: 'todo',
      label: 'À faire',
      color: 'secondary',
      icon: <AssignmentIcon fontSize="small" />,
      statusValues: ['todo'],
    },
    {
      id: 'pending',
      label: 'En attente',
      color: 'warning',
      icon: <PendingIcon fontSize="small" />,
      statusValues: ['pending'],
    },
    {
      id: 'in-progress',
      label: 'En cours',
      color: 'info',
      icon: <ScheduleIcon fontSize="small" />,
      statusValues: ['in-progress'],
    },
    {
      id: 'to-study',
      label: 'À étudier',
      color: 'default',
      icon: <PsychologyIcon fontSize="small" />,
      statusValues: ['to-study'],
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
      id: 'canceled',
      label: 'Annulé',
      color: 'error',
      icon: <BlockIcon fontSize="small" />,
      statusValues: ['canceled'],
    },
    {
      id: 'others',
      label: 'Autres',
      color: 'default',
      icon: <MoreHorizIcon fontSize="small" />,
      statusValues: ['no-status', 'other'], // Sera calculé dynamiquement
    },
  ];

  // Organiser les tâches par colonne
  const getTasksForColumn = (column) => {
    if (column.id === 'others') {
      // Colonne "Autres" : tâches sans statut ou avec statut non standard
      const standardStatuses = columns
        .filter(c => c.id !== 'others')
        .flatMap(c => c.statusValues);

      return tasks.filter(task => {
        const taskStatus = task.status || '';
        return !taskStatus || !standardStatuses.includes(taskStatus);
      });
    }

    return tasks.filter(task => column.statusValues.includes(task.status));
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
      // Déterminer le nouveau statut
      let newStatus;
      if (targetColumn.id === 'others') {
        newStatus = ''; // Pas de statut
      } else if (targetColumn.statusValues.length === 1) {
        newStatus = targetColumn.statusValues[0];
      } else {
        // Si la colonne a plusieurs statuts, prendre le premier
        newStatus = targetColumn.statusValues[0];
      }

      // Mettre à jour le statut si différent
      if (task.status !== newStatus) {
        onStatusChange(taskId, newStatus);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

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
