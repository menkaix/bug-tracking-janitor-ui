import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  BugReport as BugReportIcon,
  ChatBubbleOutline as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useIssues } from '../hooks/useIssues';
import { ISSUE_STATUS_OPTIONS } from '../models/task.model';
import IssueBulkActions from '../components/Issues/IssueBulkActions';

// ─── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critique',  color: 'error',   icon: '🔴' },
  HIGH:     { label: 'Haute',     color: 'warning',  icon: '🟠' },
  MEDIUM:   { label: 'Moyenne',   color: 'info',     icon: '🟡' },
  LOW:      { label: 'Basse',     color: 'default',  icon: '🟢' },
  INFO:     { label: 'Info',      color: 'default',  icon: '⚪' },
};

// Source unique de vérité : dérivé de ISSUE_STATUS_OPTIONS
const STATUS_CONFIG = Object.fromEntries(
  ISSUE_STATUS_OPTIONS.map(({ value, label, color }) => [value, { label, color }])
);

const TYPE_CONFIG = {
  BUG:             { label: 'Bug',             color: 'error' },
  REGRESSION:      { label: 'Régression',      color: 'error' },
  VULNERABILITY:   { label: 'Vulnérabilité',   color: 'error' },
  INCIDENT:        { label: 'Incident',         color: 'warning' },
  PERFORMANCE:     { label: 'Performance',      color: 'warning' },
  FEATURE_REQUEST: { label: 'Demande feature', color: 'info' },
  IMPROVEMENT:     { label: 'Amélioration',    color: 'info' },
  QUESTION:        { label: 'Question',         color: 'default' },
  SUPPORT:         { label: 'Support',          color: 'default' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const ALL_TYPES = Object.keys(TYPE_CONFIG);
const ALL_SEVERITIES = Object.keys(SEVERITY_CONFIG);
const PRIORITIES = [
  { value: 'URGENT',   label: 'Urgent' },
  { value: 'HIGH',     label: 'Haute' },
  { value: 'NORMAL',   label: 'Normale' },
  { value: 'LOW',      label: 'Basse' },
  { value: 'DEFERRED', label: 'Différée' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TypeIcon = ({ type, fontSize = 'small' }) => {
  switch (type) {
    case 'BUG':
    case 'REGRESSION':
      return <BugReportIcon fontSize={fontSize} color="error" />;
    case 'VULNERABILITY':
      return <SecurityIcon fontSize={fontSize} color="error" />;
    case 'PERFORMANCE':
      return <SpeedIcon fontSize={fontSize} color="warning" />;
    case 'INCIDENT':
      return <ErrorIcon fontSize={fontSize} color="warning" />;
    case 'QUESTION':
    case 'SUPPORT':
      return <HelpIcon fontSize={fontSize} color="action" />;
    default:
      return <AddIcon fontSize={fontSize} color="info" />;
  }
};

const SeverityChip = ({ severity }) => {
  const config = SEVERITY_CONFIG[severity] || { label: severity, color: 'default', icon: '' };
  return (
    <Chip
      label={`${config.icon} ${config.label}`}
      color={config.color}
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );
};

const StatusChip = ({ status, onClick }) => {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      onClick={onClick}
      sx={{ cursor: onClick ? 'pointer' : 'default', fontWeight: 500 }}
    />
  );
};

const TypeChip = ({ type }) => {
  const config = TYPE_CONFIG[type] || { label: type, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" variant="outlined" />;
};

// ─── Comments tab (read-only, newest first) ───────────────────────────────────

const IssueCommentsTab = ({ comments = [] }) => {
  const theme = useTheme();
  const sorted = [...comments].sort((a, b) => new Date(b.createDate) - new Date(a.createDate));

  const initials = (author) =>
    (author || '').split(/[\s-_]/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  if (sorted.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <CommentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">Aucun commentaire</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {sorted.map((c, idx) => (
        <React.Fragment key={idx}>
          <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 1.5,
                mt: 0.5,
                fontSize: '0.72rem',
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              {initials(c.author)}
            </Avatar>
            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>{c.author}</Typography>
                  {c.createDate && (
                    <Typography variant="caption" color="text.disabled">
                      {new Date(c.createDate?.$date ?? c.createDate).toLocaleString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </Typography>
                  )}
                </Stack>
              }
              secondary={
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    '& p': { m: 0 },
                    '& p + p': { mt: 0.5 },
                    '& ul, & ol': { pl: 2, my: 0.25 },
                    '& li': { mb: 0 },
                    '& strong': { fontWeight: 600, color: 'text.primary' },
                    '& code': {
                      fontFamily: 'monospace',
                      fontSize: '0.8em',
                      bgcolor: 'action.hover',
                      px: 0.5,
                      borderRadius: 0.5,
                    },
                    '& a': { color: 'primary.main' },
                    '& blockquote': {
                      borderLeft: '3px solid',
                      borderColor: 'divider',
                      pl: 1,
                      ml: 0,
                      color: 'text.disabled',
                    },
                  }}
                >
                  <ReactMarkdown>{c.text}</ReactMarkdown>
                </Box>
              }
            />
          </ListItem>
          {idx < sorted.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

// ─── IssueForm Dialog ─────────────────────────────────────────────────────────

const IssueFormDialog = ({
  open,
  onClose,
  onSubmit,
  formData,
  onChange,
  editingIssue,
  isSaving,
  projects,
}) => {
  const [tab, setTab] = useState(0);
  const isEditing = Boolean(editingIssue);
  const showReproSteps = formData.type === 'BUG' || formData.type === 'REGRESSION';
  const comments = formData.comments || [];

  // Reset tab to 0 when dialog opens/closes
  React.useEffect(() => { if (!open) setTab(0); }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0 }}>
        <BugReportIcon color="error" />
        {isEditing ? "Modifier l'issue" : 'Nouvelle issue'}
      </DialogTitle>

      {isEditing && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            icon={<TuneIcon fontSize="small" />}
            iconPosition="start"
            label="Détails"
            sx={{ textTransform: 'none', minHeight: 44 }}
          />
          <Tab
            icon={<CommentIcon fontSize="small" />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>Commentaires</span>
                {comments.length > 0 && (
                  <Chip label={comments.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            }
            sx={{ textTransform: 'none', minHeight: 44 }}
          />
        </Tabs>
      )}

      <form onSubmit={onSubmit}>
        <DialogContent dividers sx={{ display: tab === 1 ? 'block' : undefined }}>

          {/* ── Onglet Détails ── */}
          {tab === 0 && (
            <Grid container spacing={2}>
              {/* Left column */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Titre"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  required
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Type</InputLabel>
                  <Select name="type" value={formData.type} onChange={onChange} label="Type">
                    {ALL_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{TYPE_CONFIG[t]?.label || t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Sévérité</InputLabel>
                  <Select name="severity" value={formData.severity} onChange={onChange} label="Sévérité">
                    {ALL_SEVERITIES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {SEVERITY_CONFIG[s]?.icon} {SEVERITY_CONFIG[s]?.label || s}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Priorité</InputLabel>
                  <Select name="priority" value={formData.priority} onChange={onChange} label="Priorité">
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {isEditing && (
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Statut</InputLabel>
                    <Select name="status" value={formData.status || 'OPEN'} onChange={onChange} label="Statut">
                      {ALL_STATUSES.map((s) => (
                        <MenuItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Projet</InputLabel>
                  <Select name="projectId" value={formData.projectId} onChange={onChange} label="Projet">
                    <MenuItem value=""><em>— Aucun —</em></MenuItem>
                    {(projects || []).map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.projectName || p.name} ({p.projectCode || p.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Right column */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Rapporteur (email)"
                  name="reporter"
                  value={formData.reporter}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Environnement"
                  name="environment"
                  value={formData.environment}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Plateforme"
                  name="platform"
                  value={formData.platform}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Composant"
                  name="component"
                  value={formData.component}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Version affectée"
                  name="affectedVersion"
                  value={formData.affectedVersion}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Corrigé en version"
                  name="fixedInVersion"
                  value={formData.fixedInVersion}
                  onChange={onChange}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Full width below */}
              {showReproSteps && (
                <Grid size={12}>
                  <TextField
                    label="Étapes de reproduction"
                    name="reproductionSteps"
                    value={formData.reproductionSteps}
                    onChange={onChange}
                    multiline
                    rows={4}
                    fullWidth
                    size="small"
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}
              <Grid size={12}>
                <TextField
                  label="Comportement attendu"
                  name="expectedBehavior"
                  value={formData.expectedBehavior}
                  onChange={onChange}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Comportement actuel"
                  name="actualBehavior"
                  value={formData.actualBehavior}
                  onChange={onChange}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Contournement"
                  name="workaround"
                  value={formData.workaround}
                  onChange={onChange}
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          )}

          {/* ── Onglet Commentaires ── */}
          {tab === 1 && <IssueCommentsTab comments={comments} />}

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Annuler</Button>
          {tab === 0 && (
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving || !formData.title}
              startIcon={isSaving ? <CircularProgress size={16} /> : null}
            >
              {isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ─── Quick Status Change Menu ─────────────────────────────────────────────────

const QuickStatusMenu = ({ issue, onStatusChange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status) => {
    onStatusChange(issue.id, status);
    handleClose();
  };

  return (
    <>
      <StatusChip status={issue.status} onClick={handleOpen} />
      <Dialog open={open} onClose={handleClose} maxWidth="xs">
        <DialogTitle variant="body1" sx={{ pb: 1 }}>
          Changer le statut
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ALL_STATUSES.map((s) => (
              <Button
                key={s}
                variant={issue.status === s ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleSelect(s)}
                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
              >
                {STATUS_CONFIG[s]?.label || s}
              </Button>
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const IssuesPage = () => {
  const {
    issues,
    allIssues,
    pagination,
    isLoading,
    isFetching,
    isError,
    isSaving,

    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    severityFilter, setSeverityFilter,
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    currentPage,
    handlePageChange,

    issuesQuery,
    projectsQuery,

    showModal,
    editingIssue,
    formData,

    handleCreateClick,
    handleReportBugClick,
    handleEditClick,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleStatusChange,

    selectedIssues,
    isSelected,
    handleSelectIssue,
    handleSelectAll,
    handleClearSelection,
    handleBulkDelete,
    handleBulkStatusChange,
    handleBulkProjectChange,
  } = useIssues();

  const projects = projectsQuery.data || [];
  const totalElements = issuesQuery.data?.totalElements ?? 0;
  const openCount = allIssues.filter((i) => i.status === 'OPEN' || i.status === 'REOPENED').length;
  const criticalCount = allIssues.filter((i) => i.severity === 'CRITICAL').length;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BugReportIcon color="error" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Gestion des Issues
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={`Total: ${totalElements}`}
                size="small"
                variant="outlined"
                color="default"
              />
              <Chip
                label={`Ouvertes: ${openCount}`}
                size="small"
                color="warning"
                icon={<WarningIcon />}
              />
              <Chip
                label={`Critiques: ${criticalCount}`}
                size="small"
                color="error"
                icon={<ErrorIcon />}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<BugReportIcon />}
            onClick={handleReportBugClick}
          >
            Signaler un bug
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Nouvelle issue
          </Button>
        </Box>
      </Box>

      {/* ── Filters bar ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
                <MenuItem value=""><em>Tous</em></MenuItem>
                {ALL_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{TYPE_CONFIG[t]?.label || t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sévérité</InputLabel>
              <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} label="Sévérité">
                <MenuItem value=""><em>Toutes</em></MenuItem>
                {ALL_SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>{SEVERITY_CONFIG[s]?.icon} {SEVERITY_CONFIG[s]?.label || s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
                <MenuItem value=""><em>Tous</em></MenuItem>
                {ALL_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Projet</InputLabel>
              <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} label="Projet">
                <MenuItem value=""><em>Tous</em></MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.projectName || p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Bulk Actions Bar ── */}
      <IssueBulkActions
        selectedCount={selectedIssues.length}
        projects={projects}
        onClearSelection={handleClearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkProjectChange={handleBulkProjectChange}
      />

      {/* ── Table ── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="error">Erreur lors du chargement des issues.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'action.hover' } }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIssues.length > 0 && selectedIssues.length < issues.length}
                    checked={issues.length > 0 && selectedIssues.length === issues.length}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell width={40}></TableCell>
                <TableCell>Titre</TableCell>
                <TableCell>Sévérité</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Projet</TableCell>
                <TableCell>Rapporteur</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Aucune issue trouvée</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    hover
                    selected={isSelected(issue.id)}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected(issue.id)}
                        onChange={() => handleSelectIssue(issue.id)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <TypeIcon type={issue.type} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {issue.title}
                      </Typography>
                      {issue.description && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {issue.description}
                        </Typography>
                      )}
                      {issue.comments?.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <CommentIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.disabled">
                            {issue.comments.length}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <SeverityChip severity={issue.severity} />
                    </TableCell>
                    <TableCell>
                      <QuickStatusMenu issue={issue} onStatusChange={handleStatusChange} />
                    </TableCell>
                    <TableCell>
                      <TypeChip type={issue.type} />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const proj = projects.find((p) => p.id === issue.projectId);
                        return proj ? (
                          <Typography variant="body2">
                            <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                              {proj.projectCode || proj.code}
                            </Box>
                            <Box component="span" color="text.secondary">
                              {proj.projectName || proj.name}
                            </Box>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {issue.reporter || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton size="small" onClick={() => handleEditClick(issue)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton size="small" color="error" onClick={() => handleDelete(issue.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
          <Button
            size="small"
            disabled={currentPage === 0 || isFetching}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Précédent
          </Button>
          <Typography variant="body2" color="text.secondary">
            Page {currentPage + 1} / {pagination.totalPages}
          </Typography>
          <Button
            size="small"
            disabled={currentPage >= pagination.totalPages - 1 || isFetching}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Suivant
          </Button>
        </Box>
      )}

      {/* ── Create / Edit Dialog ── */}
      <IssueFormDialog
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        editingIssue={editingIssue}
        isSaving={isSaving}
        projects={projects}
      />
    </Container>
  );
};

export default IssuesPage;
