import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  alpha,
  useTheme,
  Autocomplete,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Menu,
  Avatar,
  Checkbox,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  AccountTree as TreeIcon,
  Monitor as ScreenIcon,
  Settings as ProcedureIcon,
  Visibility as DisplayIcon,
  Cloud as RestApiIcon,
  Http as RestClientIcon,
  Task as TaskIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  EditNote as BulkEditIcon,
  Refresh as RefreshIcon,
  AddLink as LinkIcon,
} from '@mui/icons-material';
import projectService from '../services/project.service';
import backlogService from '../services/backlog.service';
import taskService from '../services/task.service';
import personService from '../services/person.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import AbstractEntityEditor from '../components/Common/AbstractEntityEditor';

// ─── Constantes ──────────────────────────────────────────────────────────────

// Config d'affichage statique pour les chips (icônes / couleurs)
const FEATURE_TYPE_DISPLAY = {
  screen:       { label: 'Écran',       icon: <ScreenIcon fontSize="small" />,    color: 'primary' },
  procedure:    { label: 'Procédure',   icon: <ProcedureIcon fontSize="small" />, color: 'secondary' },
  display:      { label: 'Affichage',   icon: <DisplayIcon fontSize="small" />,   color: 'info' },
  'rest-api':   { label: 'REST API',    icon: <RestApiIcon fontSize="small" />,   color: 'success' },
  'rest-client':{ label: 'REST Client', icon: <RestClientIcon fontSize="small" />,color: 'warning' },
};

const ACTOR_TYPES = [
  { value: 'USER', label: 'Utilisateur' },
  { value: 'SYSTEM', label: 'Système' },
];

const getFeatureConfig = (type) =>
  FEATURE_TYPE_DISPLAY[type] || { label: type, icon: <ChevronRightIcon fontSize="small" />, color: 'default' };

// ─── Helpers tâches ───────────────────────────────────────────────────────────

const CLOSED_STATUSES = ['done'];
const ACTIVE_STATUSES = ['in-progress', 'to-test', 'testing'];

const TASK_STATUS_COLOR = {
  'todo':        '#7c4dff',
  'pending':     '#ff9800',
  'in-progress': '#2196f3',
  'to-study':    '#9c27b0',
  'done':        '#4caf50',
  'to-test':     '#00bcd4',
  'testing':     '#03a9f4',
  'canceled':    '#f44336',
  'no-status':   '#9e9e9e',
};

const TASK_STATUS_LABEL = {
  'todo':        'À faire',
  'pending':     'En attente',
  'in-progress': 'En cours',
  'to-study':    'À étudier',
  'done':        'Terminé',
  'to-test':     'À tester',
  'testing':     'En test',
  'canceled':    'Annulé',
  'no-status':   'Sans statut',
};

/** Collecte toutes les tâches depuis un tableau de features */
const tasksFromFeatures = (features) =>
  (features || []).flatMap((f) => f.tasks || []);

/** Collecte toutes les tâches depuis un tableau de stories */
const tasksFromStories = (stories) =>
  (stories || []).flatMap((s) => tasksFromFeatures(s.features || []));

/** Collecte toutes les tâches depuis un tableau d'acteurs */
const tasksFromActors = (actors) =>
  (actors || []).flatMap((a) => tasksFromStories(a.stories || []));

const normalizeStatus = (status) => (status || '').toLowerCase();

const computeStats = (tasks) => {
  const total = tasks.length;
  const done = tasks.filter((t) => CLOSED_STATUSES.includes(normalizeStatus(t.status))).length;
  const active = tasks.filter((t) => ACTIVE_STATUSES.includes(normalizeStatus(t.status))).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, active, pct };
};

// Ordre d'affichage des segments dans la barre (du plus "avancé" au moins avancé)
const STATUS_DISPLAY_ORDER = ['done', 'testing', 'to-test', 'in-progress', 'to-study', 'pending', 'todo', 'canceled', 'no-status'];

/** Barre de progression segmentée multicolore avec tooltip détaillé */
const TaskProgress = ({ tasks, size = 'small' }) => {
  if (!tasks || tasks.length === 0) return null;
  const { total, done, pct } = computeStats(tasks);

  // Grouper par statut normalisé ('no-status' pour les tâches sans statut)
  const countByStatus = tasks.reduce((acc, t) => {
    const s = normalizeStatus(t.status) || 'no-status';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Segments ordonnés (statuts connus en premier, puis inconnus)
  const knownSegments = STATUS_DISPLAY_ORDER
    .filter((s) => countByStatus[s])
    .map((s) => [s, countByStatus[s]]);
  const unknownSegments = Object.entries(countByStatus)
    .filter(([s]) => !STATUS_DISPLAY_ORDER.includes(s));
  const segments = [...knownSegments, ...unknownSegments];

  const barHeight = size === 'large' ? 8 : 5;

  const tooltipContent = (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
        {done}/{total} tâche{total > 1 ? 's' : ''} terminée{done > 1 ? 's' : ''} ({pct}%)
      </Typography>
      {segments.map(([s, count]) => (
        <Stack key={s} direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[s] || '#9e9e9e', flexShrink: 0 }} />
          <Typography variant="caption">
            {TASK_STATUS_LABEL[s] || s} : {count} ({Math.round((count / total) * 100)}%)
          </Typography>
        </Stack>
      ))}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: size === 'large' ? 180 : 120 }}>
        <Box
          sx={{
            flexGrow: 1,
            height: barHeight,
            borderRadius: barHeight / 2,
            overflow: 'hidden',
            display: 'flex',
            bgcolor: 'action.hover',
          }}
        >
          {segments.map(([s, count]) => (
            <Box
              key={s}
              sx={{
                width: `${(count / total) * 100}%`,
                bgcolor: TASK_STATUS_COLOR[s] || '#9e9e9e',
                transition: 'width 0.3s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.7rem' }}>
          {done}/{total}
        </Typography>
      </Stack>
    </Tooltip>
  );
};

// ─── Mise à jour de statut ────────────────────────────────────────────────────

/** Select compact pour changer le statut d'une tâche individuelle */
const TaskStatusSelect = ({ task, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(normalizeStatus(task.status) || 'todo');

  useEffect(() => {
    setLocalStatus(normalizeStatus(task.status) || 'todo');
  }, [task.status]);

  const handleChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    setLocalStatus(newStatus); // mise à jour optimiste immédiate
    setLoading(true);
    await taskService.patchTask(task.id, { status: newStatus }, task);
    setLoading(false);
    onRefresh();
  };

  return (
    <Select
      value={localStatus}
      onChange={handleChange}
      size="small"
      variant="standard"
      disabled={loading}
      onClick={(e) => e.stopPropagation()}
      sx={{ fontSize: '0.72rem', minWidth: 110, '& .MuiSelect-select': { py: 0.25 } }}
    >
      {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
        <MenuItem key={value} value={value} sx={{ fontSize: '0.8rem' }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[value], flexShrink: 0 }} />
            <span>{label}</span>
          </Stack>
        </MenuItem>
      ))}
    </Select>
  );
};

/** Bouton + menu pour appliquer un statut en lot à un ensemble de tâches */
const BulkStatusMenu = ({ tasks, onRefresh, label }) => {
  const [anchor, setAnchor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async (status) => {
    setAnchor(null);
    setLoading(true);
    await Promise.all(tasks.map((t) => taskService.patchTask(t.id, { status }, t)));
    setLoading(false);
    onRefresh();
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <>
      <Tooltip title={`Appliquer un statut aux ${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}>
        <Chip
          size="small"
          variant="outlined"
          icon={loading ? <CircularProgress size={12} /> : <BulkEditIcon sx={{ fontSize: '0.85rem !important' }} />}
          label={label || `${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
          onClick={(e) => { e.stopPropagation(); if (!loading) setAnchor(e.currentTarget); }}
          sx={{ fontSize: '0.72rem', cursor: loading ? 'default' : 'pointer' }}
        />
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block', fontWeight: 600 }}>
          Appliquer à {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
          <MenuItem key={value} onClick={() => handleApply(value)} sx={{ fontSize: '0.85rem' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[value], flexShrink: 0 }} />
              <span>{label}</span>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

/** Bouton + menu pour affecter en lot un ensemble de tâches à une personne */
const BulkAssignMenu = ({ tasks, persons, onRefresh }) => {
  const [anchor, setAnchor] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async (email) => {
    setAnchor(null);
    setLoading(true);
    await Promise.all(tasks.map((t) => {
      const current = t.assignees || [];
      if (current.includes(email)) return Promise.resolve();
      return taskService.patchTask(t.id, { assignees: [...current, email] }, t);
    }));
    setLoading(false);
    onRefresh();
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <>
      <Tooltip title={`Affecter les ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} à une personne`}>
        <Chip
          size="small"
          variant="outlined"
          color="secondary"
          icon={loading ? <CircularProgress size={12} /> : <PersonIcon sx={{ fontSize: '0.85rem !important' }} />}
          label="Affecter"
          onClick={(e) => { e.stopPropagation(); if (!loading) setAnchor(e.currentTarget); }}
          sx={{ fontSize: '0.72rem', cursor: loading ? 'default' : 'pointer' }}
        />
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', display: 'block', fontWeight: 600 }}>
          Affecter {tasks.length} tâche{tasks.length > 1 ? 's' : ''} à
        </Typography>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleAssign('')} sx={{ fontSize: '0.85rem' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'action.disabledBackground' }}>—</Avatar>
            <Typography variant="body2" color="text.secondary">Non affecté</Typography>
          </Stack>
        </MenuItem>
        {(persons || []).map((p) => (
          <MenuItem key={p.id} onClick={() => handleAssign(p.email)} sx={{ fontSize: '0.85rem' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                {p.firstName?.[0]}{p.lastName?.[0]}
              </Avatar>
              <Typography variant="body2">{p.firstName} {p.lastName}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// ─── Sous-composants (tâches, features, stories, acteurs) ─────────────────────

const TaskList = ({ tasks, onRefresh, onEditTask }) => {
  if (!tasks || tasks.length === 0) return null;
  return (
    <List dense disablePadding sx={{ pl: 2, mt: 1 }}>
      {tasks.map((task) => (
        <ListItem key={task.id} disableGutters sx={{ py: 0.25 }}>
          <ListItemIcon sx={{ minWidth: 24 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: TASK_STATUS_COLOR[normalizeStatus(task.status) || 'no-status'] || '#9e9e9e',
                mt: '1px',
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary={task.title}
            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
          />
          <TaskStatusSelect task={task} onRefresh={onRefresh} />
          <IconButton size="small" onClick={() => onEditTask(task)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};

const FeatureItem = ({ feature, onEdit, onCreateTask, onLinkTasks, onRefresh, persons, onEditTask }) => {
  const theme = useTheme();
  const config = getFeatureConfig(feature.type);
  const [open, setOpen] = useState(false);
  const hasTasks = feature.tasks && feature.tasks.length > 0;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        px: 1.5,
        py: 1,
        backgroundColor: alpha(theme.palette[config.color]?.main || theme.palette.grey[500], 0.05),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Chip
          icon={config.icon}
          label={config.label}
          size="small"
          color={config.color}
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {feature.name}
        </Typography>
        {feature.comments?.length > 0 && (
          <Chip label={`${feature.comments.length} 💬`} size="small" variant="outlined" />
        )}
        {feature.links?.length > 0 && (
          <Chip label={`${feature.links.length} 🔗`} size="small" variant="outlined" />
        )}
        {hasTasks && (
          <>
            <TaskProgress tasks={feature.tasks} />
            <BulkStatusMenu tasks={feature.tasks} onRefresh={onRefresh} />
            <BulkAssignMenu tasks={feature.tasks} persons={persons} onRefresh={onRefresh} />
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </>
        )}
        <Button
          size="small"
          startIcon={<LinkIcon />}
          variant="outlined"
          color="info"
          onClick={(e) => { e.stopPropagation(); onLinkTasks(feature); }}
          sx={{ borderRadius: 2, fontSize: '0.72rem', py: 0.25, px: 1, whiteSpace: 'nowrap' }}
        >
          Associer
        </Button>
        <Button
          size="small"
          startIcon={<AddIcon />}
          variant="outlined"
          color="success"
          onClick={(e) => { e.stopPropagation(); onCreateTask(feature); }}
          sx={{ borderRadius: 2, fontSize: '0.72rem', py: 0.25, px: 1, whiteSpace: 'nowrap' }}
        >
          Tâche
        </Button>
        <IconButton size="small" onClick={() => onEdit(feature)} color="primary">
          <EditIcon fontSize="small" />
        </IconButton>
      </Stack>
      {hasTasks && (
        <Collapse in={open}>
          <TaskList tasks={feature.tasks} onRefresh={onRefresh} onEditTask={onEditTask} />
        </Collapse>
      )}
    </Box>
  );
};

const StoryItem = ({ story, onAddFeature, onEditStory, onEditFeature, onCreateTask, onLinkTasks, onRefresh, persons, onEditTask }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const hasFeatures = story.features && story.features.length > 0;
  const storyTasks = tasksFromFeatures(story.features);

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          backgroundColor: open ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }} onClick={() => setOpen(!open)}>
          <ChevronRightIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              transform: open ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {story.action}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center" onClick={(e) => e.stopPropagation()}>
          {hasFeatures && (
            <Chip
              label={`${story.features.length} feature${story.features.length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {storyTasks.length > 0 && <TaskProgress tasks={storyTasks} />}
          {storyTasks.length > 0 && <BulkStatusMenu tasks={storyTasks} onRefresh={onRefresh} />}
          {storyTasks.length > 0 && <BulkAssignMenu tasks={storyTasks} persons={persons} onRefresh={onRefresh} />}
          {story.comments?.length > 0 && (
            <Chip label={`${story.comments.length} 💬`} size="small" variant="outlined" />
          )}
          {story.links?.length > 0 && (
            <Chip label={`${story.links.length} 🔗`} size="small" variant="outlined" />
          )}
          <IconButton size="small" onClick={() => onEditStory(story)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => onAddFeature(story)}
            sx={{ borderRadius: 2, fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            Feature
          </Button>
        </Stack>
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 2, pt: 1 }}>
          {story.scenario && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mb: 1.5,
                fontStyle: 'italic',
                borderLeft: 3,
                borderColor: 'divider',
                pl: 1.5,
              }}
            >
              {story.scenario}
            </Typography>
          )}
          {hasFeatures ? (
            <Stack spacing={1}>
              {story.features.map((feature) => (
                <FeatureItem key={feature.id} feature={feature} onEdit={onEditFeature} onCreateTask={onCreateTask} onLinkTasks={onLinkTasks} onRefresh={onRefresh} persons={persons} onEditTask={onEditTask} />
              ))}
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Aucune feature pour cette story.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const ActorPanel = ({ actor, projectCode, defaultExpanded, onAddStory, onAddFeature, onEditStory, onEditFeature, onCreateTask, onLinkTasks, onRefresh, persons, onEditTask }) => {
  const isUser = actor.type === 'USER';
  const actorTasks = tasksFromStories(actor.stories);
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      sx={{ borderRadius: '12px !important', '&:before': { display: 'none' }, mb: 1 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, mr: 1 }}>
          {isUser ? <PersonIcon color="primary" /> : <ComputerIcon color="secondary" />}
          <Typography fontWeight={600}>{actor.name}</Typography>
          <Chip
            label={isUser ? 'Utilisateur' : 'Système'}
            size="small"
            color={isUser ? 'primary' : 'secondary'}
            variant="outlined"
          />
          <Chip
            label={`${actor.stories?.length || 0} stor${(actor.stories?.length || 0) > 1 ? 'ies' : 'y'}`}
            size="small"
            variant="outlined"
          />
          {actorTasks.length > 0 && <TaskProgress tasks={actorTasks} size="large" />}
          {actorTasks.length > 0 && <BulkStatusMenu tasks={actorTasks} onRefresh={onRefresh} />}
          {actorTasks.length > 0 && <BulkAssignMenu tasks={actorTasks} persons={persons} onRefresh={onRefresh} />}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            component="span"
            size="small"
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); onAddStory(actor); }}
            sx={{ borderRadius: 2, fontSize: '0.75rem', py: 0.25, px: 1 }}
          >
            Story
          </Button>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {actor.stories && actor.stories.length > 0 ? (
          <Stack spacing={1}>
            {actor.stories.map((story) => (
              <StoryItem
                key={story.id}
                story={story}
                onAddFeature={onAddFeature}
                onEditStory={onEditStory}
                onEditFeature={onEditFeature}
                onCreateTask={onCreateTask}
                onLinkTasks={onLinkTasks}
                onRefresh={onRefresh}
                persons={persons}
                onEditTask={onEditTask}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucune user story pour cet acteur.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// ─── Dialogs ─────────────────────────────────────────────────────────────────

const LinkTasksDialog = ({ open, feature, projectCode, onClose, onLinked }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!open || !projectCode) return;
    setSelected([]);
    setLoading(true);
    taskService.getTasksByProjectRef(projectCode).then((result) => {
      if (result.success) {
        setTasks((result.data || []).filter((t) =>
          !t.featureId &&
          !t.reference &&
          !t.idReference &&
          !['done', 'canceled'].includes(normalizeStatus(t.status))
        ));
      }
      setLoading(false);
    });
  }, [open, projectCode]);

  const handleToggle = (taskId) => {
    setSelected((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleLink = async () => {
    if (selected.length === 0) return;
    setLinking(true);
    const selectedTasks = tasks.filter((t) => selected.includes(t.id));
    await Promise.all(
      selectedTasks.map((t) => backlogService.assignTaskToFeature(feature.id, t.id))
    );
    setLinking(false);
    enqueueSnackbar(
      `${selected.length} tâche${selected.length > 1 ? 's' : ''} associée${selected.length > 1 ? 's' : ''} à "${feature.name}"`,
      { variant: 'success' }
    );
    onLinked();
  };

  const handleClose = () => {
    setSelected([]);
    setTasks([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Associer des tâches</Typography>
            {feature && (
              <Typography variant="caption" color="text.secondary">
                Feature : {feature.name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : tasks.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            Aucune tâche sans feature pour ce projet.
          </Typography>
        ) : (
          <List dense disablePadding>
            {tasks.map((task) => (
              <ListItem
                key={task.id}
                disableGutters
                sx={{ py: 0.5, cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, px: 1 }}
                onClick={() => handleToggle(task.id)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={selected.includes(task.id)}
                    size="small"
                    disableRipple
                    tabIndex={-1}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={task.title}
                  secondary={
                    <Stack direction="row" spacing={0.75} alignItems="center" component="span">
                      <Box
                        component="span"
                        sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[normalizeStatus(task.status)] || '#9e9e9e', display: 'inline-block', flexShrink: 0 }}
                      />
                      <span>{TASK_STATUS_LABEL[normalizeStatus(task.status)] || task.status}</span>
                    </Stack>
                  }
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ component: 'div', variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {selected.length} tâche{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
        </Typography>
        <Button onClick={handleClose} variant="outlined">Annuler</Button>
        <Button
          onClick={handleLink}
          variant="contained"
          disabled={selected.length === 0 || linking}
          startIcon={linking ? <CircularProgress size={16} /> : <LinkIcon />}
        >
          Associer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Dialogs d'édition (AbstractEntity) ──────────────────────────────────────

const StoryEditDialog = ({ open, onClose, onSave, featureTypes }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ action: '', scenario: '', objective: '', comments: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyId, setStoryId] = useState(null);

  useEffect(() => {
    if (!open) return;
    // open est l'objet story (id + champs DTO de l'arbre) ou null
    if (open?.id) {
      setLoading(true);
      setStoryId(open.id);
      backlogService.getEntity('stories', open.id).then((result) => {
        if (result.success) {
          const d = result.data;
          setForm({
            action: d.action || '',
            scenario: d.scenario || '',
            objective: d.objective || '',
            comments: d.comments || [],
            links: d.links || [],
          });
        }
        setLoading(false);
      });
    }
  }, [open]);

  const handleClose = () => { setForm({ action: '', scenario: '', objective: '', comments: [], links: [] }); onClose(); };

  const handleSave = async () => {
    setSaving(true);
    // Story command update (FullStoryDTO + comments/links via patch)
    const storyDTO = { id: storyId, action: form.action, scenario: form.scenario, objective: form.objective };
    const r1 = await backlogService.updateStory(storyDTO);
    // PATCH pour comments + links
    const r2 = await backlogService.patchEntity('stories', storyId, { comments: form.comments, links: form.links });
    setSaving(false);
    if (r1.success) { onSave(); handleClose(); }
    else enqueueSnackbar(`Erreur : ${r1.error || r2.error}`, { variant: 'error' });
  };

  return (
    <Dialog open={!!open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Modifier la user story</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={3}>
            <TextField fullWidth label="Action (je voudrais...)" value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })} required />
            <TextField fullWidth label="Scénario" value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })} multiline rows={4} />
            <TextField fullWidth label="Objectif" value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })} />
            <Divider />
            <AbstractEntityEditor
              comments={form.comments}
              links={form.links}
              onChangeComments={(c) => setForm({ ...form, comments: c })}
              onChangeLinks={(l) => setForm({ ...form, links: l })}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={16} /> : <EditIcon />}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FeatureEditDialog = ({ open, onClose, onSave, featureTypes, featureTypesLoading }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ name: '', description: '', type: '', comments: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [featureId, setFeatureId] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (open?.id) {
      setLoading(true);
      setFeatureId(open.id);
      backlogService.getEntity('features', open.id).then((result) => {
        if (result.success) {
          const d = result.data;
          setForm({
            name: d.name || '',
            description: d.description || '',
            type: d.type || '',
            comments: d.comments || [],
            links: d.links || [],
          });
        }
        setLoading(false);
      });
    }
  }, [open]);

  const handleClose = () => { setForm({ name: '', description: '', type: '', comments: [], links: [] }); onClose(); };

  const handleSave = async () => {
    setSaving(true);
    const result = await backlogService.patchEntity('features', featureId, {
      name: form.name,
      description: form.description,
      type: form.type,
      comments: form.comments,
      links: form.links,
    });
    setSaving(false);
    if (result.success) { onSave(); handleClose(); }
    else enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
  };

  return (
    <Dialog open={!!open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Modifier la feature</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={3}>
            <TextField fullWidth label="Nom" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={featureTypesLoading}>
                {(featureTypes || []).map((t) => {
                  const cfg = getFeatureConfig(t);
                  return (
                    <MenuItem key={t} value={t}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {cfg.icon}<span>{cfg.label}</span>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField fullWidth label="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
            <Divider />
            <AbstractEntityEditor
              comments={form.comments}
              links={form.links}
              onChangeComments={(c) => setForm({ ...form, comments: c })}
              onChangeLinks={(l) => setForm({ ...form, links: l })}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={16} /> : <EditIcon />}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddActorDialog = ({ open, onClose, onSubmit, submitting }) => {
  const [form, setForm] = useState({ name: '', type: 'USER' });

  const handleClose = () => { setForm({ name: '', type: 'USER' }); onClose(); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Nouvel acteur</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Nom de l'acteur"
              placeholder="Ex: client, dispatcher..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {ACTOR_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}>
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const AddStoryDialog = ({ open, onClose, onSubmit, submitting, actorName }) => {
  const [form, setForm] = useState({ action: '', scenario: '', objective: '' });

  const handleClose = () => { setForm({ action: '', scenario: '', objective: '' }); onClose(); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Nouvelle user story</Typography>
            {actorName && (
              <Typography variant="caption" color="text.secondary">Acteur : {actorName}</Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Action (je voudrais...)"
              placeholder="Ex: réserver une course"
              value={form.action}
              onChange={(e) => setForm({ ...form, action: e.target.value })}
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Scénario"
              placeholder="Décrivez le scénario..."
              value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="Objectif (optionnel)"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}>
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const AddFeatureDialog = ({ open, onClose, onSubmit, submitting, storyAction, featureTypes, featureTypesLoading }) => {
  const [form, setForm] = useState({ name: '', description: '', type: '' });

  useEffect(() => {
    if (featureTypes && featureTypes.length > 0) {
      setForm((f) => ({ ...f, type: f.type || featureTypes[0] }));
    }
  }, [featureTypes]);

  const handleClose = () => { setForm({ name: '', description: '', type: featureTypes?.[0] || '' }); onClose(); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Nouvelle feature</Typography>
            {storyAction && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Story : {storyAction}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Nom de la feature"
              placeholder="Ex: écran de connexion"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                disabled={featureTypesLoading}
                startAdornment={featureTypesLoading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              >
                {(featureTypes || []).map((t) => {
                  const config = getFeatureConfig(t);
                  return (
                    <MenuItem key={t} value={t}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {config.icon}
                        <span>{config.label}</span>
                      </Stack>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description (optionnel)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting || featureTypesLoading} startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}>
            Ajouter
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const CreateTaskDialog = ({ open, onClose, onSave, feature, persons, submitting }) => {
  const [form, setForm] = useState({ title: '', status: 'todo', assignee: '' });

  const handleClose = () => { setForm({ title: '', status: 'todo', assignee: '' }); onClose(); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  return (
    <Dialog open={!!open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Nouvelle tâche</Typography>
            {feature?.name && (
              <Typography variant="caption" color="text.secondary">Feature : {feature.name}</Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Titre de la tâche"
              placeholder="Ex: Implémenter le formulaire de connexion"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select label="Statut" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[value], flexShrink: 0 }} />
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assigné à</InputLabel>
              <Select label="Assigné à" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                <MenuItem value=""><em>Non assigné</em></MenuItem>
                {(persons || []).map((p) => (
                  <MenuItem key={p.id} value={p.email}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </Avatar>
                      <span>{p.firstName} {p.lastName}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined">Annuler</Button>
          <Button type="submit" variant="contained" disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : <AddIcon />}>
            Créer
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const TaskEditDialog = ({ open, onClose, onSave, persons, projectId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ title: '', status: 'todo', assignee: '', description: '', comments: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taskId, setTaskId] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (open?.id) {
      setLoading(true);
      setTaskId(open.id);
      taskService.getTaskById(open.id).then((result) => {
        if (result.success) {
          const d = result.data;
          setForm({
            title: d.title || '',
            status: normalizeStatus(d.status) || 'todo',
            assignee: d.assignee || '',
            description: d.description || '',
            comments: d.comments || [],
            links: d.links || [],
          });
        }
        setLoading(false);
      });
    }
  }, [open]);

  const handleClose = () => {
    setForm({ title: '', status: 'todo', assignee: '', description: '', comments: [], links: [] });
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    const patch = {
      title: form.title,
      status: form.status,
      assignee: form.assignee,
      description: form.description,
      comments: form.comments,
      links: form.links,
    };
    if (projectId) patch.projectId = projectId;
    const result = await taskService.patchTask(taskId, patch);
    setSaving(false);
    if (result.success) { onSave(); handleClose(); }
    else enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
  };

  return (
    <Dialog open={!!open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={700}>Modifier la tâche</Typography>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Stack spacing={3}>
            <TextField fullWidth label="Titre" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select label="Statut" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: TASK_STATUS_COLOR[value], flexShrink: 0 }} />
                      <span>{label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Assigné à</InputLabel>
              <Select label="Assigné à" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                <MenuItem value=""><em>Non assigné</em></MenuItem>
                {(persons || []).map((p) => (
                  <MenuItem key={p.id} value={p.email}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </Avatar>
                      <span>{p.firstName} {p.lastName}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField fullWidth label="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
            <Divider />
            <AbstractEntityEditor
              comments={form.comments}
              links={form.links}
              onChangeComments={(c) => setForm({ ...form, comments: c })}
              onChangeLinks={(l) => setForm({ ...form, links: l })}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">Annuler</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={16} /> : <EditIcon />}>
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const FeatureTreePage = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectCode, setProjectCode] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [featureTypesLoading, setFeatureTypesLoading] = useState(true);
  const [persons, setPersons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog state — création
  const [actorDialog, setActorDialog] = useState(false);
  const [storyDialog, setStoryDialog] = useState({ open: false, actor: null });
  const [featureDialog, setFeatureDialog] = useState({ open: false, story: null });
  const [createTaskDialog, setCreateTaskDialog] = useState(null); // feature object or null
  const [linkTasksDialog, setLinkTasksDialog] = useState(null); // feature object or null
  // Dialog state — édition
  const [editStoryDialog, setEditStoryDialog] = useState(null); // story object or null
  const [editFeatureDialog, setEditFeatureDialog] = useState(null); // feature object or null
  const [editTaskDialog, setEditTaskDialog] = useState(null); // task object or null

  useEffect(() => {
    const loadProjects = async () => {
      const result = await projectService.getAllProjects(0, 1000);
      if (result.success) {
        const list = result.data.content || [];
        setProjects(list);

        const codeFromUrl = searchParams.get('projectCode');
        if (codeFromUrl) {
          const found = list.find((p) => p.projectCode === codeFromUrl);
          if (found) {
            setSelectedProject(found);
            setProjectCode(found.projectCode);
            fetchTree(found.projectCode);
          } else {
            setProjectCode(codeFromUrl.toUpperCase());
            fetchTree(codeFromUrl.toUpperCase());
          }
        }
      }
      setProjectsLoading(false);
    };
    const loadFeatureTypes = async () => {
      const result = await backlogService.getFeatureTypes();
      if (result.success) {
        const types = Array.isArray(result.data)
          ? result.data.map((t) => (typeof t === 'string' ? t : t.name))
          : Object.keys(result.data || {});
        setFeatureTypes(types);
      }
      setFeatureTypesLoading(false);
    };
    const loadPersons = async () => {
      const result = await personService.getAllPersons(0, 1000);
      if (result.success) setPersons(result.data.content || []);
    };
    loadProjects();
    loadFeatureTypes();
    loadPersons();
  }, []);

  const fetchTree = async (code) => {
    if (!code) return;
    setLoading(true);
    setError('');
    setTreeData(null);
    const result = await projectService.getProjectTree(code);
    if (result.success) {
      setTreeData(result.data);
    } else {
      setError(result.error || "Impossible de charger l'arbre des fonctionnalités");
    }
    setLoading(false);
  };

  const handleProjectChange = (_, project) => {
    setSelectedProject(project);
    if (project) {
      setProjectCode(project.projectCode);
      fetchTree(project.projectCode);
    } else {
      setProjectCode('');
      setTreeData(null);
    }
  };

  const handleManualSearch = () => {
    if (projectCode.trim()) fetchTree(projectCode.trim().toUpperCase());
  };

  const handleRefreshTree = async () => {
    if (!projectCode || refreshing) return;
    setRefreshing(true);
    const result = await projectService.getProjectTree(projectCode);
    if (result.success) {
      setTreeData(result.data);
    } else {
      enqueueSnackbar(`Erreur lors du rafraîchissement : ${result.error}`, { variant: 'error' });
    }
    setRefreshing(false);
  };

  // ── Handlers création ──────────────────────────────────────────────────────

  const handleAddActor = async (form) => {
    setSubmitting(true);
    const result = await backlogService.addActor(treeData.code, form);
    setSubmitting(false);
    if (result.success) {
      setActorDialog(false);
      fetchTree(treeData.code);
    } else {
      enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
    }
  };

  const handleAddStory = async (form) => {
    setSubmitting(true);
    const result = await backlogService.addStory(treeData.code, storyDialog.actor.name, form);
    setSubmitting(false);
    if (result.success) {
      setStoryDialog({ open: false, actor: null });
      fetchTree(treeData.code);
    } else {
      enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
    }
  };

  const handleAddFeature = async (form) => {
    setSubmitting(true);
    const result = await backlogService.addFeature(featureDialog.story.id, form);
    setSubmitting(false);
    if (result.success) {
      setFeatureDialog({ open: false, story: null });
      fetchTree(treeData.code);
    } else {
      enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
    }
  };

  const handleCreateTask = async (form) => {
    setSubmitting(true);
    const featureId = createTaskDialog?.id;
    const result = await taskService.createTask({
      title: form.title,
      status: form.status,
      assignee: form.assignee || '',
      featureId,
      projectId: selectedProject?.id,
      reference: `feature/${featureId}/dev`,
      idReference: `feature/${featureId}`,
    });
    setSubmitting(false);
    if (result.success) {
      setCreateTaskDialog(null);
      fetchTree(treeData.code);
    } else {
      enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalStories = treeData?.actors?.reduce((sum, a) => sum + (a.stories?.length || 0), 0) || 0;
  const totalFeatures =
    treeData?.actors?.reduce(
      (sum, a) => sum + (a.stories?.reduce((s, st) => s + (st.features?.length || 0), 0) || 0),
      0
    ) || 0;
  const allTasks = tasksFromActors(treeData?.actors);
  const globalStats = computeStats(allTasks);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <TreeIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={600}>
            Arbre des Fonctionnalités
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Visualisez et gérez la hiérarchie des acteurs, user stories et features d'un projet
        </Typography>
      </Box>

      {/* Sélecteur de projet */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: 1, borderColor: 'divider' }} elevation={0}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Sélectionner un projet
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <Autocomplete
            options={projects}
            getOptionLabel={(p) => `${p.projectCode} - ${p.projectName}`}
            value={selectedProject}
            onChange={handleProjectChange}
            loading={projectsLoading}
            sx={{ minWidth: 340 }}
            renderInput={(params) => (
              <TextField {...params} label="Choisir un projet" placeholder="Rechercher..." size="small" />
            )}
          />
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            ou
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Code projet"
              placeholder="Ex: VTCU"
              size="small"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              sx={{ width: 180 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleManualSearch}
              disabled={!projectCode.trim() || loading}
              sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
            >
              Charger
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {error && <ErrorMessage message={error} onRetry={() => fetchTree(projectCode)} />}
      {loading && <Loading message="Chargement de l'arbre des fonctionnalités..." />}

      {/* Résultat */}
      {treeData && !loading && (
        <Box>
          {/* Info projet */}
          <Paper
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
              border: 1,
              borderColor: 'divider',
            }}
            elevation={0}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Chip label={treeData.code} color="primary" sx={{ fontWeight: 700 }} />
                  {treeData.clientName && (
                    <Chip label={treeData.clientName} color="secondary" variant="outlined" />
                  )}
                </Stack>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                  {treeData.name}
                </Typography>
                {treeData.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 800 }}>
                    {treeData.description}
                  </Typography>
                )}
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Stack direction="row" spacing={3} sx={{ flexShrink: 0 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {treeData.actors?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Acteurs</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="secondary">
                    {totalStories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">User Stories</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {totalFeatures}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Features</Typography>
                </Box>
                {allTasks.length > 0 && (
                  <Box sx={{ textAlign: 'center', minWidth: 120 }}>
                    <Typography variant="h4" fontWeight={700} color={globalStats.pct === 100 ? 'success.main' : 'text.primary'}>
                      {globalStats.pct}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {globalStats.done}/{allTasks.length} tâches
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={globalStats.pct}
                      sx={{ mt: 0.5, height: 4, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                    />
                  </Box>
                )}
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Tooltip title="Récupérer la dernière version depuis le serveur">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                      onClick={handleRefreshTree}
                      disabled={refreshing}
                      sx={{ borderRadius: 2 }}
                    >
                      Rafraîchir
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setActorDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Acteur
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Arbre */}
          {treeData.actors && treeData.actors.length > 0 ? (
            treeData.actors.map((actor, idx) => (
              <ActorPanel
                key={actor.id}
                actor={actor}
                projectCode={treeData.code}
                defaultExpanded={idx === 0}
                onAddStory={(a) => setStoryDialog({ open: true, actor: a })}
                onAddFeature={(s) => setFeatureDialog({ open: true, story: s })}
                onEditStory={(s) => setEditStoryDialog(s)}
                onEditFeature={(f) => setEditFeatureDialog(f)}
                onCreateTask={(f) => setCreateTaskDialog(f)}
                onLinkTasks={(f) => setLinkTasksDialog(f)}
                onEditTask={(t) => setEditTaskDialog(t)}
                onRefresh={() => fetchTree(projectCode)}
                persons={persons}
              />
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Aucun acteur pour ce projet.
              </Typography>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setActorDialog(true)}>
                Ajouter le premier acteur
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* État vide initial */}
      {!treeData && !loading && !error && (
        <Box sx={{ textAlign: 'center', py: 12 }}>
          <TreeIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Sélectionnez un projet pour visualiser son arbre
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choisissez un projet dans la liste ou entrez un code projet manuellement
          </Typography>
        </Box>
      )}

      {/* Dialogs */}
      <AddActorDialog
        open={actorDialog}
        onClose={() => setActorDialog(false)}
        onSubmit={handleAddActor}
        submitting={submitting}
      />
      <AddStoryDialog
        open={storyDialog.open}
        onClose={() => setStoryDialog({ open: false, actor: null })}
        onSubmit={handleAddStory}
        submitting={submitting}
        actorName={storyDialog.actor?.name}
      />
      <AddFeatureDialog
        open={featureDialog.open}
        onClose={() => setFeatureDialog({ open: false, story: null })}
        onSubmit={handleAddFeature}
        submitting={submitting}
        storyAction={featureDialog.story?.action}
        featureTypes={featureTypes}
        featureTypesLoading={featureTypesLoading}
      />

      <CreateTaskDialog
        open={!!createTaskDialog}
        onClose={() => setCreateTaskDialog(null)}
        onSave={handleCreateTask}
        feature={createTaskDialog}
        persons={persons}
        submitting={submitting}
      />

      <TaskEditDialog
        open={editTaskDialog}
        onClose={() => setEditTaskDialog(null)}
        onSave={() => { setEditTaskDialog(null); fetchTree(treeData?.code); }}
        persons={persons}
        projectId={selectedProject?.id}
      />

      {/* Dialogs d'édition */}
      <StoryEditDialog
        open={editStoryDialog}
        onClose={() => setEditStoryDialog(null)}
        onSave={() => { setEditStoryDialog(null); fetchTree(treeData?.code); }}
        featureTypes={featureTypes}
      />
      <FeatureEditDialog
        open={editFeatureDialog}
        onClose={() => setEditFeatureDialog(null)}
        onSave={() => { setEditFeatureDialog(null); fetchTree(treeData?.code); }}
        featureTypes={featureTypes}
        featureTypesLoading={featureTypesLoading}
      />

      <LinkTasksDialog
        open={Boolean(linkTasksDialog)}
        feature={linkTasksDialog}
        projectCode={treeData?.code}
        onClose={() => setLinkTasksDialog(null)}
        onLinked={() => { setLinkTasksDialog(null); fetchTree(treeData?.code); }}
      />
    </Container>
  );
};

export default FeatureTreePage;
