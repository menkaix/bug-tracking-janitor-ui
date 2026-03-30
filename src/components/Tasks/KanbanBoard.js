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
  BugReport as BugReportIcon,
  FiberNew as FiberNewIcon,
  Tune as TuneIcon,
  Biotech as BiotechIcon,
} from '@mui/icons-material';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate } from '../../utils/dateUtils';
import { KANBAN_STATUS_OPTIONS, ISSUE_KANBAN_STATUS_OPTIONS, isIssue, ISSUE_SEVERITY_CONFIG, ISSUE_TYPE_CONFIG, normalizeStatusValue } from '../../models/task.model';
import { resolveAssigneeNames } from '../../utils/assigneeUtils';
import IssueDetailsPanel from '../Issues/IssueDetailsPanel';

const SEVERITY_BORDER = {
  CRITICAL: '#d32f2f',
  HIGH:     '#f57c00',
  MEDIUM:   '#1976d2',
  LOW:      '#757575',
  INFO:     '#9e9e9e',
};

/**
 * Composant pour une carte de tâche draggable
 */
const TaskCard = React.memo(({ task, persons, onEdit, onDelete, onStatusChange, isDragging = false }) => {
  const STATUS_OPTIONS = isIssue(task) ? ISSUE_KANBAN_STATUS_OPTIONS : KANBAN_STATUS_OPTIONS;
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

  const assigneesArray = task.assignees || [];
  const assigneeNames = getAssigneesNames(assigneesArray);
  const issueItem = isIssue(task);
  const severityBorder = issueItem ? (SEVERITY_BORDER[task.severity] || SEVERITY_BORDER.INFO) : null;
  const severityCfg = issueItem && task.severity ? ISSUE_SEVERITY_CONFIG[task.severity] : null;
  const typeCfg = issueItem && task.type ? ISSUE_TYPE_CONFIG[task.type] : null;

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
        borderLeft: issueItem ? `4px solid ${severityBorder}` : '4px solid transparent',
        backgroundColor: issueItem
          ? alpha(theme.palette.error.main, 0.03)
          : theme.palette.background.paper,
        '&:hover': {
          boxShadow: 3,
          backgroundColor: issueItem
            ? alpha(theme.palette.error.main, 0.07)
            : alpha(theme.palette.primary.main, 0.02),
        },
        transition: 'box-shadow 0.2s, background-color 0.2s',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack spacing={1.5}>

          {/* Badge issue : type + sévérité */}
          {issueItem && (
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
              <BugReportIcon sx={{ fontSize: '0.95rem', color: severityBorder, flexShrink: 0 }} />
              {typeCfg && (
                <Chip
                  label={typeCfg.label}
                  size="small"
                  color={typeCfg.color}
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                />
              )}
              {severityCfg && (
                <Chip
                  label={severityCfg.label}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', borderColor: severityBorder, color: severityBorder }}
                />
              )}
            </Stack>
          )}

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
            {task.dueDate && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CalendarIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(task.dueDate)}
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

          {/* Commentaires et liens (issues uniquement) */}
          {issueItem && (
            <Box onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <IssueDetailsPanel issueId={task.id} />
            </Box>
          )}

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

  /**
   * Colonnes unifiées Tasks + Issues.
   *
   * taskStatuses   : valeurs backend tâche (format normalisé, ex: 'in-progress')
   * issueStatuses  : valeurs backend issue (uppercase enum, ex: 'IN_PROGRESS')
   * defaultTask    : statut assigné lors d'un drop d'une tâche dans cette colonne
   * defaultIssue   : statut assigné lors d'un drop d'une issue (null = colonne non ciblable par les issues)
   *
   * Parallèle Task ↔ Issue :
   *   NEW/UNKNOWN  ↔  OPEN
   *   TO_STUDY     ↔  NEED_MORE_INFO
   *   TO_SPEC/SPEC ↔  (aucun)
   *   RND          ↔  (aucun)
   *   TODO         ↔  TRIAGED
   *   IN_PROGRESS  ↔  IN_PROGRESS
   *   TO_TEST/TEST ↔  IN_REVIEW
   *   DONE         ↔  RESOLVED
   *   PENDING      ↔  REOPENED
   *   CANCELED     ↔  WONT_FIX
   *   (aucun)      ↔  CLOSED      ← issue uniquement
   *   (aucun)      ↔  DUPLICATE   ← issue uniquement
   */
  const columns = [
    {
      id: 'new',
      label: 'Nouveau',
      color: 'default',
      icon: <FiberNewIcon fontSize="small" />,
      taskStatuses: ['new', 'unknown'],
      issueStatuses: ['OPEN'],
      defaultTask: 'new',
      defaultIssue: 'OPEN',
    },
    {
      id: 'to-study',
      label: 'À étudier',
      color: 'default',
      icon: <PsychologyIcon fontSize="small" />,
      taskStatuses: ['to-study'],
      issueStatuses: [],
      defaultTask: 'to-study',
      defaultIssue: 'NEED_MORE_INFO',
    },
    {
      id: 'to-spec',
      label: 'À spécifier',
      color: 'warning',
      icon: <TuneIcon fontSize="small" />,
      taskStatuses: ['to-spec', 'specifying'],
      issueStatuses: ['NEED_MORE_INFO'],
      defaultTask: 'to-spec',
      defaultIssue: 'NEED_MORE_INFO',
    },
    {
      id: 'rnd',
      label: 'R&D',
      color: 'secondary',
      icon: <BiotechIcon fontSize="small" />,
      taskStatuses: ['rnd'],
      issueStatuses: [],
      defaultTask: 'rnd',
      defaultIssue: 'NEED_MORE_INFO',
    },
    {
      id: 'todo',
      label: 'À faire',
      color: 'secondary',
      icon: <AssignmentIcon fontSize="small" />,
      taskStatuses: ['todo'],
      issueStatuses: ['TRIAGED'],
      defaultTask: 'todo',
      defaultIssue: 'TRIAGED',
    },
    {
      id: 'in-progress',
      label: 'En cours',
      color: 'info',
      icon: <ScheduleIcon fontSize="small" />,
      taskStatuses: ['in-progress'],
      issueStatuses: ['IN_PROGRESS'],
      defaultTask: 'in-progress',
      defaultIssue: 'IN_PROGRESS',
    },
    {
      id: 'in-test',
      label: 'En test',
      color: 'info',
      icon: <ScienceIcon fontSize="small" />,
      taskStatuses: ['to-test', 'testing'],
      issueStatuses: ['IN_REVIEW'],
      defaultTask: 'to-test',
      defaultIssue: 'IN_REVIEW',
    },
    {
      id: 'done',
      label: 'Terminé',
      color: 'success',
      icon: <CheckCircleIcon fontSize="small" />,
      taskStatuses: ['done'],
      issueStatuses: ['RESOLVED'],
      defaultTask: 'done',
      defaultIssue: 'RESOLVED',
    },
    {
      id: 'pending',
      label: 'En attente',
      color: 'warning',
      icon: <PendingIcon fontSize="small" />,
      taskStatuses: ['pending'],
      issueStatuses: ['REOPENED'],
      defaultTask: 'pending',
      defaultIssue: 'REOPENED',
    },
    {
      id: 'canceled',
      label: 'Annulé',
      color: 'error',
      icon: <BlockIcon fontSize="small" />,
      taskStatuses: ['canceled'],
      issueStatuses: ['WONT_FIX'],
      defaultTask: 'canceled',
      defaultIssue: 'WONT_FIX',
    },
    {
      id: 'others',
      label: 'Autres',
      color: 'default',
      icon: <MoreHorizIcon fontSize="small" />,
      taskStatuses: [],
      issueStatuses: ['CLOSED', 'DUPLICATE'],
      defaultTask: '',
      defaultIssue: null,
    },
  ];

  // Tâches avec overrides locaux appliqués pour le retour visuel immédiat
  const tasksWithOverrides = tasks.map(t =>
    localOverrides[t.id] !== undefined ? { ...t, status: localOverrides[t.id] } : t
  );

  // Organiser les tâches par colonne — route selon entityType
  const getTasksForColumn = (column) => {
    if (column.id === 'others') {
      const knownTaskStatuses = columns.filter(c => c.id !== 'others').flatMap(c => c.taskStatuses);
      const knownIssueStatuses = columns.filter(c => c.id !== 'others').flatMap(c => c.issueStatuses);
      return tasksWithOverrides.filter(task => {
        if (isIssue(task)) {
          const s = (task.status || '').toUpperCase();
          return !s || !knownIssueStatuses.includes(s);
        }
        const s = normalizeStatusValue(task.status || '');
        return !s || !knownTaskStatuses.includes(s);
      });
    }

    return tasksWithOverrides.filter(task => {
      if (isIssue(task)) {
        const s = (task.status || '').toUpperCase();
        return column.issueStatuses.includes(s);
      }
      const s = normalizeStatusValue(task.status || '');
      return column.taskStatuses.includes(s);
    });
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
      // Choisir le statut cible selon le type d'entité
      const newStatus = isIssue(task) ? targetColumn.defaultIssue : targetColumn.defaultTask;

      // null = colonne non accessible pour ce type (ex: issue sur 'À spécifier')
      if (newStatus == null) {
        setActiveId(null);
        return;
      }

      const currentNormalized = isIssue(task)
        ? (task.status || '').toUpperCase()
        : normalizeStatusValue(task.status || '');
      const targetNormalized = isIssue(task) ? newStatus.toUpperCase() : normalizeStatusValue(newStatus);

      if (currentNormalized !== targetNormalized) {
        setLocalOverrides(prev => ({ ...prev, [taskId]: newStatus }));
        onStatusChange(taskId, newStatus);
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
