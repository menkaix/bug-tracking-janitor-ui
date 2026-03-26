import React, { useMemo, useState } from 'react';
import { useQueries, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Tooltip,
  useTheme,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  Stack,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Assignment as AssignmentIcon,
  SentimentDissatisfied as EmptyIcon,
  Add as AddIcon,
  Close as CloseIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import taskService from '../../services/task.service';
import issueService from '../../services/issue.service';
import backlogService from '../../services/backlog.service';
import TaskForm from '../Tasks/TaskForm';
import { EMPTY_TASK_FORM, isIssue, normalizeStatusValue } from '../../models/task.model';
import { toDateInputValue, fromDateInputValue } from '../../utils/dateUtils';

const STATUS_META = {
  'todo':        { label: 'À faire',           color: 'secondary' },
  'pending':     { label: 'En attente',         color: 'warning'   },
  'in-progress': { label: 'En cours',           color: 'info'      },
  'to-study':    { label: 'À étudier',          color: 'default'   },
  'done':        { label: 'Terminé',            color: 'success'   },
  'to-test':     { label: 'À tester',           color: 'info'      },
  'testing':     { label: 'En cours de test',   color: 'info'      },
  'canceled':    { label: 'Annulé',             color: 'error'     },
};

const getStatusMeta = (status) =>
  STATUS_META[(status || '').toLowerCase()] || { label: status || '—', color: 'default' };

const ACTIVE_STATUSES = new Set(['todo', 'in-progress', 'to-study', 'to-test', 'testing', 'pending']);

const ACTIVE_ISSUE_STATUSES = new Set(['OPEN', 'TRIAGED', 'IN_PROGRESS', 'IN_REVIEW', 'REOPENED', 'NEED_MORE_INFO']);

const ISSUE_SEVERITY_META = {
  'CRITICAL': { label: 'Critique', color: 'error' },
  'HIGH':     { label: 'Haute',    color: 'error' },
  'MEDIUM':   { label: 'Moyenne',  color: 'warning' },
  'LOW':      { label: 'Basse',    color: 'info' },
  'INFO':     { label: 'Info',     color: 'default' },
};
const getIssueSeverityMeta = (severity) =>
  ISSUE_SEVERITY_META[(severity || '').toUpperCase()] || { label: severity || '—', color: 'default' };

const STATUS_ORDER = { 'in-progress': 0, 'testing': 1, 'to-test': 2, 'todo': 3, 'to-study': 4, 'pending': 5 };
const sortByStatus = (a, b) => {
  const orderA = STATUS_ORDER[(a.status || '').toLowerCase()] ?? 99;
  const orderB = STATUS_ORDER[(b.status || '').toLowerCase()] ?? 99;
  return orderA - orderB;
};

// Fonction pure extraite pour éviter sa recréation à chaque render
const getInitials = (person) => {
  const first = person.firstName?.[0] || '';
  const last = person.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
};

const CreatePersonTaskDialog = ({ open, person, projects, onClose, onCreated }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ title: '', description: '', projectId: '' });
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setForm({ title: '', description: '', projectId: '' });
    onClose();
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const result = await taskService.createTask({
      title: form.title.trim(),
      description: form.description.trim(),
      status: 'todo',
      assignees: [person.email],
      projectId: form.projectId || undefined,
    });
    setSaving(false);
    if (result.success) {
      enqueueSnackbar('Tâche créée', { variant: 'success' });
      onCreated();
      handleClose();
    } else {
      enqueueSnackbar(`Erreur : ${result.error}`, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Nouvelle tâche</Typography>
            {person && (
              <Typography variant="caption" color="text.secondary">
                Assignée à {person.firstName} {person.lastName}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Titre"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            required
            fullWidth
            autoFocus
            size="small"
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
            size="small"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Projet</InputLabel>
            <Select
              value={form.projectId}
              label="Projet"
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <MenuItem value=""><em>Aucun</em></MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.projectCode || p.code} — {p.projectName || p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">Annuler</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!form.title.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : <AddIcon />}
        >
          Créer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OccupationMap = ({ persons = [], projects = [] }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [createDialog, setCreateDialog] = useState(null); // person object or null

  // ── État édition tâche / issue ──────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({ ...EMPTY_TASK_FORM });

  const saveMutation = useMutation({
    mutationFn: async ({ id, taskData, comments, links }) => {
      const isIssueItem = isIssue(editingItem);
      const result = isIssueItem
        ? await issueService.updateIssue(id, taskData)
        : await taskService.updateTask(id, taskData);
      if (!result.success) throw new Error('Erreur lors de la sauvegarde');
      if (!isIssueItem) {
        await backlogService.patchEntity('tasks', id, { comments, links });
      }
      return result.data;
    },
    onSuccess: (_, { taskData }) => {
      setShowEditModal(false);
      // Invalide les queries by-assignee pour toutes les personnes concernées
      const assignees = taskData.assignees || [];
      assignees.forEach(email => {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'by-assignee', email] });
        queryClient.invalidateQueries({ queryKey: ['issues', 'by-assignee', email] });
      });
      // Invalide aussi pour l'item original (en cas de changement d'assignés)
      if (editingItem?.assignees) {
        editingItem.assignees.forEach(email => {
          queryClient.invalidateQueries({ queryKey: ['tasks', 'by-assignee', email] });
          queryClient.invalidateQueries({ queryKey: ['issues', 'by-assignee', email] });
        });
      }
      enqueueSnackbar('Sauvegardé', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la sauvegarde', { variant: 'error' }),
  });

  const handleEditItem = async (item) => {
    setEditingItem(item);
    setEditFormData({
      ...EMPTY_TASK_FORM,
      title: item.title || '',
      description: item.description || '',
      projectId: item.projectId || '',
      status: isIssue(item) ? (item.status || 'OPEN') : (normalizeStatusValue(item.status) || 'todo'),
      estimate: item.estimate || '',
      trackingReference: item.trackingReference || '',
      plannedStart: toDateInputValue(item.plannedStart),
      dueDate: toDateInputValue(item.dueDate),
      assignees: item.assignees || [],
    });
    setShowEditModal(true);
    if (!isIssue(item)) {
      const result = await backlogService.getEntity('tasks', item.id);
      if (result.success) {
        setEditFormData(prev => ({ ...prev, comments: result.data.comments || [], links: result.data.links || [] }));
      }
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const taskData = {
      ...editFormData,
      plannedStart: fromDateInputValue(editFormData.plannedStart),
      dueDate: fromDateInputValue(editFormData.dueDate),
    };
    saveMutation.mutate({ id: editingItem?.id, taskData, comments: editFormData.comments, links: editFormData.links });
  };

  const handleAssigneeToggle = (email) => {
    setEditFormData(prev => {
      const current = prev.assignees || [];
      const next = current.includes(email) ? current.filter(e => e !== email) : [...current, email];
      return { ...prev, assignees: next };
    });
  };

  const projectCodeMap = useMemo(() =>
    Object.fromEntries(projects.map(p => [p.id, p.projectCode || p.code || ''])),
  [projects]);

  // Récupère les tâches de chaque personne via l'endpoint dédié (sans limite de pagination)
  const taskQueries = useQueries({
    queries: persons.map(person => ({
      queryKey: ['tasks', 'by-assignee', person.email],
      queryFn: () => taskService.getTasksByAssignee(person.email),
      enabled: !!person.email,
      staleTime: 5 * 60 * 1000,
      select: (result) => result.success ? (result.data || []) : [],
    })),
  });

  // Récupère les issues de chaque personne
  const issueQueries = useQueries({
    queries: persons.map(person => ({
      queryKey: ['issues', 'by-assignee', person.email],
      queryFn: () => issueService.getIssuesByAssignee(person.email),
      enabled: !!person.email,
      staleTime: 5 * 60 * 1000,
      select: (result) => result.success ? (result.data || []) : [],
    })),
  });

  const isLoading = taskQueries.some(q => q.isLoading || q.isFetching) || issueQueries.some(q => q.isLoading || q.isFetching);

  const rows = useMemo(() => {
    return persons
      .map((person, i) => {
        const personTasks = taskQueries[i]?.data || [];
        const activeTasks = personTasks
          .filter(t => ACTIVE_STATUSES.has((t.status || '').toLowerCase()))
          .sort(sortByStatus);
        const personIssues = issueQueries[i]?.data || [];
        const activeIssues = personIssues
          .filter(issue => ACTIVE_ISSUE_STATUSES.has((issue.status || '').toUpperCase()));
        return { ...person, activeTasks, totalTasks: personTasks.length, activeIssues };
      })
      .sort((a, b) => (b.activeTasks.length + b.activeIssues.length) - (a.activeTasks.length + a.activeIssues.length));
  }, [persons, taskQueries, issueQueries]); // eslint-disable-line react-hooks/exhaustive-deps

  if (persons.length === 0) {
    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <EmptyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">Aucune personne trouvée</Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
    <Grid container spacing={2}>
      {rows.map(person => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={person.id}>
          <Card
            elevation={0}
            variant="outlined"
            sx={{
              height: '100%',
              borderColor: person.activeTasks.length > 0
                ? alpha(theme.palette.primary.main, 0.3)
                : theme.palette.divider,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: theme.shadows[3] },
            }}
          >
            <CardContent>
              {/* En-tête personne */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: person.activeTasks.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.action.disabledBackground,
                    width: 40,
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(person)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {person.firstName} {person.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {person.email || ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip
                    label={person.activeTasks.length}
                    size="small"
                    color={person.activeTasks.length > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 600, minWidth: 28 }}
                  />
                  {person.activeIssues.length > 0 && (
                    <Chip
                      icon={<BugIcon sx={{ fontSize: '0.8rem !important' }} />}
                      label={person.activeIssues.length}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 600, minWidth: 28 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Liste des tâches actives */}
              {person.activeTasks.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                  <AssignmentIcon fontSize="small" />
                  <Typography variant="body2">Aucune tâche en cours</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {person.activeTasks.map(task => {
                    const meta = getStatusMeta(task.status);
                    const projectCode = projectCodeMap[task.projectId] || '';
                    return (
                      <Tooltip
                        key={task.id}
                        title={
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {task.title}
                            </Typography>
                            {task.trackingReference && (
                              <Typography variant="caption" display="block">
                                Réf : {task.trackingReference}
                              </Typography>
                            )}
                            {projectCode && (
                              <Typography variant="caption" display="block">
                                Projet : {projectCode}
                              </Typography>
                            )}
                            {(task.deadLine || task.dueDate) && (
                              <Typography variant="caption" display="block">
                                Échéance : {new Date(task.deadLine || task.dueDate).toLocaleDateString('fr-FR')}
                              </Typography>
                            )}
                          </Box>
                        }
                      >
                        <Box
                          onClick={() => handleEditItem(task)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: alpha(theme.palette.action.hover, 0.5),
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                          }}
                        >
                          <Chip
                            label={meta.label}
                            size="small"
                            color={meta.color}
                            sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                          />
                          {projectCode && (
                            <Chip
                              label={projectCode}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                            />
                          )}
                          <Typography variant="caption" sx={{ flex: 1 }}>
                            {task.title?.length > 32 ? `${task.title.slice(0, 32)}…` : task.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}

              {/* Issues affectées */}
              {person.activeIssues.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                    <BugIcon sx={{ fontSize: '0.85rem', color: 'error.main' }} />
                    <Typography variant="caption" fontWeight={600} color="error.main">
                      Issues ({person.activeIssues.length})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {person.activeIssues.map(issue => {
                      const severityMeta = getIssueSeverityMeta(issue.severity);
                      const projectCode = projectCodeMap[issue.projectId] || '';
                      return (
                        <Tooltip
                          key={issue.id}
                          title={
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {issue.title}
                              </Typography>
                              {issue.type && (
                                <Typography variant="caption" display="block">
                                  Type : {issue.type}
                                </Typography>
                              )}
                              {issue.severity && (
                                <Typography variant="caption" display="block">
                                  Sévérité : {issue.severity}
                                </Typography>
                              )}
                              {projectCode && (
                                <Typography variant="caption" display="block">
                                  Projet : {projectCode}
                                </Typography>
                              )}
                              {issue.status && (
                                <Typography variant="caption" display="block">
                                  Statut : {issue.status}
                                </Typography>
                              )}
                            </Box>
                          }
                        >
                          <Box
                            onClick={() => handleEditItem(issue)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 0.75,
                              borderRadius: 1,
                              cursor: 'pointer',
                              bgcolor: alpha(theme.palette.error.main, 0.05),
                              border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) },
                            }}
                          >
                            <BugIcon sx={{ fontSize: '0.8rem', color: 'error.main', flexShrink: 0 }} />
                            <Chip
                              label={severityMeta.label}
                              size="small"
                              color={severityMeta.color}
                              sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                            />
                            {projectCode && (
                              <Chip
                                label={projectCode}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                              />
                            )}
                            <Typography variant="caption" sx={{ flex: 1 }}>
                              {issue.title?.length > 30 ? `${issue.title.slice(0, 30)}…` : issue.title}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Bouton ajouter une tâche */}
              <Box sx={{ mt: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialog(person)}
                  sx={{ borderRadius: 2, fontSize: '0.72rem', width: '100%' }}
                >
                  Ajouter une tâche
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

    {/* Dialog création de tâche */}
    <CreatePersonTaskDialog
      open={Boolean(createDialog)}
      person={createDialog}
      projects={projects}
      onClose={() => setCreateDialog(null)}
      onCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'by-assignee', createDialog?.email] });
        setCreateDialog(null);
      }}
    />

    {/* Dialog édition tâche / issue (même que Kanban) */}
    <TaskForm
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      onSubmit={handleEditSubmit}
      formData={editFormData}
      onFormChange={setEditFormData}
      onAssigneeToggle={handleAssigneeToggle}
      editingTask={editingItem}
      projects={projects}
      persons={persons}
    />
    </>
  );
};

export default OccupationMap;
