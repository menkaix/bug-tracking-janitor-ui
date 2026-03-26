import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  BugReport as BugReportIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useIssues } from '../hooks/useIssues';
import { ISSUE_STATUS_OPTIONS } from '../models/task.model';

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
  statusesQuery,
}) => {
  const isEditing = Boolean(editingIssue);
  const showReproSteps = formData.type === 'BUG' || formData.type === 'REGRESSION';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BugReportIcon color="error" />
        {isEditing ? "Modifier l'issue" : 'Nouvelle issue'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent dividers>
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
                    <MenuItem key={t} value={t}>
                      {TYPE_CONFIG[t]?.label || t}
                    </MenuItem>
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
                      <MenuItem key={s} value={s}>
                        {STATUS_CONFIG[s]?.label || s}
                      </MenuItem>
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>Annuler</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !formData.title}
            startIcon={isSaving ? <CircularProgress size={16} /> : null}
          >
            {isSaving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Aucune issue trouvée</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
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
                      <Typography variant="body2" color="text.secondary">
                        {issue.projectId || '—'}
                      </Typography>
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
