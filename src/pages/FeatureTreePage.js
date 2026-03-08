import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import projectService from '../services/project.service';
import backlogService from '../services/backlog.service';
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

// ─── Sous-composants (tâches, features, stories, acteurs) ─────────────────────

const TaskList = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;
  return (
    <List dense disablePadding sx={{ pl: 2, mt: 1 }}>
      {tasks.map((task) => (
        <ListItem key={task.id} disableGutters sx={{ py: 0.25 }}>
          <ListItemIcon sx={{ minWidth: 28 }}>
            <TaskIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText
            primary={task.title}
            primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
          />
        </ListItem>
      ))}
    </List>
  );
};

const FeatureItem = ({ feature, onEdit }) => {
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
            <Chip
              label={`${feature.tasks.length} tâche${feature.tasks.length > 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </>
        )}
        <IconButton size="small" onClick={() => onEdit(feature)} color="primary">
          <EditIcon fontSize="small" />
        </IconButton>
      </Stack>
      {hasTasks && (
        <Collapse in={open}>
          <TaskList tasks={feature.tasks} />
        </Collapse>
      )}
    </Box>
  );
};

const StoryItem = ({ story, onAddFeature, onEditStory, onEditFeature }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const hasFeatures = story.features && story.features.length > 0;

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
                <FeatureItem key={feature.id} feature={feature} onEdit={onEditFeature} />
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

const ActorPanel = ({ actor, projectCode, defaultExpanded, onAddStory, onAddFeature, onEditStory, onEditFeature }) => {
  const isUser = actor.type === 'USER';
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
          <Box sx={{ flexGrow: 1 }} />
          <Button
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

// ─── Dialogs d'édition (AbstractEntity) ──────────────────────────────────────

const StoryEditDialog = ({ open, onClose, onSave, featureTypes }) => {
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
    else alert(`Erreur : ${r1.error || r2.error}`);
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
    else alert(`Erreur : ${result.error}`);
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

// ─── Page principale ──────────────────────────────────────────────────────────

const FeatureTreePage = () => {
  const theme = useTheme();
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

  // Dialog state — création
  const [actorDialog, setActorDialog] = useState(false);
  const [storyDialog, setStoryDialog] = useState({ open: false, actor: null });
  const [featureDialog, setFeatureDialog] = useState({ open: false, story: null });
  // Dialog state — édition
  const [editStoryDialog, setEditStoryDialog] = useState(null); // story object or null
  const [editFeatureDialog, setEditFeatureDialog] = useState(null); // feature object or null

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
    loadProjects();
    loadFeatureTypes();
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

  // ── Handlers création ──────────────────────────────────────────────────────

  const handleAddActor = async (form) => {
    setSubmitting(true);
    const result = await backlogService.addActor(treeData.code, form);
    setSubmitting(false);
    if (result.success) {
      setActorDialog(false);
      fetchTree(treeData.code);
    } else {
      alert(`Erreur : ${result.error}`);
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
      alert(`Erreur : ${result.error}`);
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
      alert(`Erreur : ${result.error}`);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalStories = treeData?.actors?.reduce((sum, a) => sum + (a.stories?.length || 0), 0) || 0;
  const totalFeatures =
    treeData?.actors?.reduce(
      (sum, a) => sum + (a.stories?.reduce((s, st) => s + (st.features?.length || 0), 0) || 0),
      0
    ) || 0;

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
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setActorDialog(true)}
                sx={{ borderRadius: 2, flexShrink: 0 }}
              >
                Acteur
              </Button>
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
    </Container>
  );
};

export default FeatureTreePage;
