import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Chip,
  alpha,
  useTheme,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FolderSpecial as FolderIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Link as LinkIcon,
  AccountTree as TreeIcon,
  WorkspacePremium as PhaseIcon,
  Group as TeamIcon,
  Sync as SyncIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { formatDateLong } from '../utils/dateUtils';
import AbstractEntityEditor from '../components/Common/AbstractEntityEditor';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { getProjectStatusInfo, getProjectPhaseInfo, PROJECT_STATE_OPTIONS, PROJECT_PHASE_OPTIONS } from '../utils/projectStatus';
import { useProjects } from '../hooks/useProjects';

const formatDate = formatDateLong;

/**
 * Page de gestion des projets — délègue toute la logique à useProjects.
 */
const ProjectsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const {
    projects,
    loading,
    error,
    pagination,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    showModal,
    setShowModal,
    editingProject,
    formData,
    setFormData,
    loadProjects,
    handlePageChange,
    handlePageSizeChange,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    handleSubmit,
    handleViewTasks,
    getCalculatedStatus,
    handlePhaseChange,
    teamDialogProject,
    allPersonsForTeam,
    loadingPersons,
    handleOpenTeamDialog,
    handleCloseTeamDialog,
    handleAddTeamMember,
    handleRemoveTeamMember,
    handleRefreshMemberSkills,
  } = useProjects();

  if (loading && projects.length === 0) return <Loading message="Chargement des projets..." />;

  const visibleProjects = statusFilter
    ? projects.filter((p) => getCalculatedStatus(p.id) === statusFilter)
    : projects;

  const SKILL_LEVEL_LABELS = {
    NEVER_HEARD: 'Jamais entendu', HEARD_OF: 'Entendu parler',
    THEORETICAL: 'Théorique', POC: 'PoC réalisé',
    ONE_PROJECT: '1 projet', SEVERAL_PROJECTS: 'Plusieurs projets',
    REGULAR_USE: 'Usage régulier',
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Gestion des Projets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination.totalElements} projet(s) au total
            {statusFilter && ` · ${visibleProjects.length} affiché(s)`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
          size="medium"
          sx={{ borderRadius: 2, px: 2, py: 1, fontWeight: 500 }}
        >
          Nouveau Projet
        </Button>
      </Box>

      {/* Barre de recherche + filtre statut */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <TextField
          fullWidth
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ maxWidth: 500, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, val) => setStatusFilter(val ?? '')}
          size="small"
          sx={{ flexShrink: 0 }}
        >
          {PROJECT_STATE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value} sx={{ borderRadius: 2, px: 2 }}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {error && <ErrorMessage message={error} onRetry={loadProjects} />}

      {/* Grille des projets */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(auto-fill, minmax(350px, 1fr))',
            md: 'repeat(auto-fill, minmax(380px, 1fr))',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {visibleProjects.map((project) => {
          const calculatedStatus = getCalculatedStatus(project.id);
          const statusInfo = getProjectStatusInfo(calculatedStatus);
          const phaseInfo = getProjectPhaseInfo(project.phase);
          return (
            <Card
              key={project.id}
              sx={{
                height: 420,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                transition: 'all 0.3s ease-in-out',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 },
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<FolderIcon />}
                      label={project.projectCode}
                      color="primary"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                    />
                    {project.clientName && (
                      <Chip
                        icon={<BusinessIcon />}
                        label={project.clientName}
                        color="secondary"
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditProject(project)}
                      sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' } }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProject(project.id)}
                      sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1), color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  sx={{
                    height: '3.2em',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {project.projectName}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    height: '4.5em',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 2,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {project.description || 'Aucune description pour ce projet.'}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }} flexWrap="wrap" useFlexGap>
                  <Chip label={statusInfo.label} size="small" color={statusInfo.color} />
                  {project.phase && project.phase !== 'INCONNUE' && (
                    <Chip
                      icon={<PhaseIcon sx={{ fontSize: '0.75rem !important' }} />}
                      label={phaseInfo.label}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  )}
                  {project.links?.length > 0 && (
                    <Chip
                      icon={<LinkIcon sx={{ fontSize: '0.8rem !important' }} />}
                      label={project.links.length}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  )}
                </Stack>

                <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                  {formatDate(project.creationDate) && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <CalendarIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        Créé le {formatDate(project.creationDate)}
                      </Typography>
                    </Stack>
                  )}
                  {formatDate(project.lastUpdateDate) && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <UpdateIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        Mis à jour le {formatDate(project.lastUpdateDate)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </CardContent>

              <CardActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewTasks(project.id)}
                  sx={{ borderRadius: 2, fontWeight: 600, flex: '1 1 auto' }}
                >
                  Tâches
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<TeamIcon />}
                  onClick={() => handleOpenTeamDialog(project)}
                  sx={{ borderRadius: 2, fontWeight: 600, flex: '1 1 auto' }}
                >
                  Équipe {project.team?.length > 0 && `(${project.team.length})`}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<TreeIcon />}
                  onClick={() => navigate(`/feature-tree?projectCode=${project.projectCode}`)}
                  sx={{ borderRadius: 2, fontWeight: 600, flex: '1 1 auto' }}
                >
                  Arbre
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {visibleProjects.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 12, px: 3 }}>
          <FolderIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Aucun projet trouvé
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Commencez par créer votre premier projet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProject}
            size="large"
            sx={{ borderRadius: 3, px: 4 }}
          >
            Créer votre premier projet
          </Button>
        </Box>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalElements={pagination.totalElements}
        pageSize={pagination.size}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Modal de création/édition */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
            </Typography>
            <IconButton onClick={() => setShowModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nom du projet"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Ex: Système d'authentification"
                required
                InputProps={{ startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
              <Box>
                <TextField
                  fullWidth
                  label="Code du projet"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="Ex: AUTH"
                  required
                  disabled={!!editingProject}
                  InputProps={{ startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                />
                {editingProject && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Le code du projet ne peut pas être modifié
                  </Typography>
                )}
              </Box>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={5}
                placeholder="Décrivez votre projet..."
                required
              />
              <FormControl fullWidth>
                <InputLabel>Phase du projet</InputLabel>
                <Select
                  value={formData.phase || 'INCONNUE'}
                  label="Phase du projet"
                  onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                >
                  {PROJECT_PHASE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {editingProject && (
                <>
                  <Divider />
                  <AbstractEntityEditor
                    comments={formData.comments}
                    links={formData.links}
                    onChangeComments={(c) => setFormData({ ...formData, comments: c })}
                    onChangeLinks={(l) => setFormData({ ...formData, links: l })}
                  />
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setShowModal(false)} variant="outlined" size="large">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={editingProject ? <EditIcon /> : <AddIcon />}
            >
              {editingProject ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Dialog de gestion de l'équipe projet */}
      <Dialog
        open={Boolean(teamDialogProject)}
        onClose={handleCloseTeamDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <TeamIcon color="info" />
              <Typography variant="h5" fontWeight={700}>
                Équipe — {teamDialogProject?.projectName}
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseTeamDialog} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {/* Membres actuels */}
          {!teamDialogProject?.team?.length ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <TeamIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Aucun membre dans l'équipe</Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mb: 3 }}>
              {(teamDialogProject?.team || []).map((member) => (
                <Box key={member.personId} sx={{
                  p: 2, borderRadius: 2, border: 1, borderColor: 'divider',
                }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                        {(member.skills || []).map((ps) => (
                          <Chip
                            key={ps.skillId}
                            label={`${ps.skillName} · ${SKILL_LEVEL_LABELS[ps.level] || ps.level}`}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1, fontSize: '0.7rem' }}
                          />
                        ))}
                        {(!member.skills || member.skills.length === 0) && (
                          <Typography variant="caption" color="text.disabled">Aucune compétence</Typography>
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Synchroniser les compétences">
                        <IconButton size="small" color="primary"
                          onClick={() => handleRefreshMemberSkills(member.personId)}>
                          <SyncIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Retirer de l'équipe">
                        <IconButton size="small" color="error"
                          onClick={() => handleRemoveTeamMember(member.personId)}
                          sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Ajouter un membre */}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Ajouter un membre</Typography>
          {loadingPersons ? (
            <LinearProgress sx={{ borderRadius: 2 }} />
          ) : (
            <Autocomplete
              options={allPersonsForTeam.filter(
                (p) => !(teamDialogProject?.team || []).some((m) => m.personId === p.id)
              )}
              getOptionLabel={(p) => `${p.firstName || ''} ${p.lastName || ''} (${p.email})`}
              onChange={(_, person) => { if (person) handleAddTeamMember(person.id); }}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher une personne" placeholder="Prénom, Nom ou email…"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              )}
              noOptionsText="Aucune personne disponible"
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseTeamDialog} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ProjectsPage;
