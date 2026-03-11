import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import projectService from '../services/project.service';
import taskService from '../services/task.service';
import backlogService from '../services/backlog.service';
import AbstractEntityEditor from '../components/Common/AbstractEntityEditor';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { calculateProjectStatus, getProjectStatusInfo } from '../utils/projectStatus';

const formatDate = (date) => {
  if (!date) return null;
  try {
    return format(new Date(date), 'dd MMM yyyy', { locale: fr });
  } catch {
    return null;
  }
};

/**
 * Page de gestion des projets - Material UI 2025
 */
const ProjectsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    description: '',
    comments: [],
    links: [],
  });

  const loadProjects = async (page = 0) => {
    setLoading(true);
    setError('');

    try {
      const [projectsResult, tasksResult] = await Promise.all([
        projectService.getAllProjects(page, pagination.size, searchTerm),
        taskService.getAllTasks(0, 10000),
      ]);

      if (projectsResult.success) {
        setProjects(projectsResult.data.content || []);
        setPagination({
          currentPage: projectsResult.data.currentPage,
          totalPages: projectsResult.data.totalPages,
          totalElements: projectsResult.data.totalElements,
          size: projectsResult.data.size,
        });
      } else {
        setError(projectsResult.error || 'Impossible de charger les projets');
      }

      if (tasksResult.success) {
        setTasks(tasksResult.data.content || []);
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects(0);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchTerm]);

  const handlePageChange = (page) => {
    loadProjects(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize }));
    loadProjects(0); // Retourner à la première page lors du changement de taille
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({ projectName: '', projectCode: '', description: '', comments: [], links: [] });
    setShowModal(true);
  };

  const handleEditProject = async (project) => {
    setEditingProject(project);
    setFormData({
      projectName: project.projectName || '',
      projectCode: project.projectCode || '',
      description: project.description || '',
      comments: [],
      links: [],
    });
    setShowModal(true);
    // Charger les commentaires et liens depuis le backend
    const result = await backlogService.getEntity('projects', project.id);
    if (result.success) {
      setFormData((prev) => ({
        ...prev,
        comments: result.data.comments || [],
        links: result.data.links || [],
      }));
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    const result = await projectService.deleteProject(id);
    if (result.success) {
      // Si on supprime le dernier projet de la page et qu'on n'est pas sur la première page,
      // revenir à la page précédente
      const willBeEmpty = projects.length === 1;
      const notFirstPage = pagination.currentPage > 0;
      const targetPage = willBeEmpty && notFirstPage ? pagination.currentPage - 1 : pagination.currentPage;
      loadProjects(targetPage);
    } else {
      enqueueSnackbar('Erreur lors de la suppression du projet', { variant: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let result;
    if (editingProject) {
      result = await projectService.updateProject(editingProject.id, formData);
      // PATCH comments et liens séparément
      if (result.success) {
        await backlogService.patchEntity('projects', editingProject.id, {
          comments: formData.comments,
          links: formData.links,
        });
      }
    } else {
      result = await projectService.createProject(formData);
    }

    if (result.success) {
      setShowModal(false);
      loadProjects(pagination.currentPage);
    } else {
      enqueueSnackbar('Erreur lors de la sauvegarde du projet', { variant: 'error' });
    }
  };

  const handleViewTasks = (projectId) => {
    navigate(`/tasks?projectId=${projectId}`);
  };

  // Fonction pour obtenir le statut calculé d'un projet
  const getCalculatedStatus = (projectId) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    return calculateProjectStatus(projectTasks);
  };

  if (loading && projects.length === 0) return <Loading message="Chargement des projets..." />;

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
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProject}
          size="medium"
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            fontWeight: 500,
          }}
        >
          Nouveau Projet
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {error && <ErrorMessage message={error} onRetry={() => loadProjects(pagination.currentPage)} />}

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
        {projects.map((project) => (
          <Card
            key={project.id}
            sx={{
              height: 420, // Hauteur fixe pour toutes les cartes
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              },
            }}
          >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip
                      icon={<FolderIcon />}
                      label={project.projectCode}
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    />
                    {project.clientName && (
                      <Chip
                        icon={<BusinessIcon />}
                        label={project.clientName}
                        color="secondary"
                        sx={{
                          fontWeight: 700,
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditProject(project)}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteProject(project.id)}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: 'error.main',
                        },
                      }}
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
                    height: '3.2em', // Hauteur fixe pour max 2 lignes
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
                    height: '4.5em', // Hauteur fixe pour 3 lignes
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

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
                  {(() => {
                    const calculatedStatus = getCalculatedStatus(project.id);
                    const statusInfo = getProjectStatusInfo(calculatedStatus);
                    return (
                      <Chip
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color}
                      />
                    );
                  })()}
                  {(project.links?.length > 0) && (
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

              <CardActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewTasks(project.id)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  Voir les tâches
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<TreeIcon />}
                  onClick={() => navigate(`/feature-tree?projectCode=${project.projectCode}`)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  Afficher l'arbre
                </Button>
              </CardActions>
            </Card>
        ))}
      </Box>

      {projects.length === 0 && !loading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 3,
          }}
        >
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
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
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
                InputProps={{
                  startAdornment: <FolderIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
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
                  InputProps={{
                    startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
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
            <Button type="submit" variant="contained" size="large" startIcon={editingProject ? <EditIcon /> : <AddIcon />}>
              {editingProject ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ProjectsPage;
