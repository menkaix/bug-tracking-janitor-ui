import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useConfirm } from './useConfirm';
import projectService from '../services/project.service';
import taskService from '../services/task.service';
import backlogService from '../services/backlog.service';
import { calculateProjectStatus } from '../utils/projectStatus';

const EMPTY_PROJECT_FORM = {
  projectName: '',
  projectCode: '',
  description: '',
  phase: 'INCONNUE',
  comments: [],
  links: [],
};

/**
 * Controller hook pour la page Projets — React Query + useMutation.
 */
export const useProjects = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PROJECT_FORM });
  const [statusFilter, setStatusFilter] = useState('');

  // Gestion de l'équipe
  const [teamDialogProject, setTeamDialogProject] = useState(null);
  const [allPersonsForTeam, setAllPersonsForTeam] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(false);

  // Gestion des versions
  const [versionsDialogProject, setVersionsDialogProject] = useState(null);
  const [versionForm, setVersionForm] = useState({ name: '', creationDate: '', deploymentDate: '' });
  const [editingVersion, setEditingVersion] = useState(null);
  const [showVersionForm, setShowVersionForm] = useState(false);

  // Gestion des environnements
  const [envsDialogProject, setEnvsDialogProject] = useState(null);
  const [envForm, setEnvForm] = useState({ name: '', type: 'DEV', url: '', description: '' });
  const [editingEnv, setEditingEnv] = useState(null);
  const [showEnvForm, setShowEnvForm] = useState(false);

  // Debounce la recherche pour éviter des requêtes à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const projectsQuery = useQuery({
    queryKey: ['projects', { page: currentPage, size: pageSize, search: debouncedSearch }],
    queryFn: async () => {
      const result = await projectService.getAllProjects(currentPage, pageSize, debouncedSearch);
      if (!result.success) throw new Error(result.error || 'Impossible de charger les projets');
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const projects = projectsQuery.data?.content || [];

  // Tâches par projet — une requête dédiée par projet visible, sans limite de pagination
  const tasksQuery = useQuery({
    queryKey: ['tasks', 'byProjects', projects.map((p) => p.id).sort().join(',')],
    queryFn: async () => {
      if (!projects.length) return {};
      const results = await Promise.all(projects.map((p) => taskService.getTasksByProjectRef(p.id)));
      const tasksByProject = {};
      projects.forEach((p, i) => {
        tasksByProject[p.id] = results[i].success ? (results[i].data || []) : [];
      });
      return tasksByProject;
    },
    enabled: projects.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const versionsQuery = useQuery({
    queryKey: ['project-versions', versionsDialogProject?.id],
    queryFn: async () => {
      if (!versionsDialogProject) return [];
      const result = await projectService.getVersions(versionsDialogProject.projectCode || versionsDialogProject.id);
      return result.success ? result.data : [];
    },
    enabled: Boolean(versionsDialogProject),
  });

  const envsQuery = useQuery({
    queryKey: ['project-environments', envsDialogProject?.id],
    queryFn: async () => {
      if (!envsDialogProject) return [];
      const result = await projectService.getEnvironments(envsDialogProject.projectCode || envsDialogProject.id);
      return result.success ? result.data : [];
    },
    enabled: Boolean(envsDialogProject),
  });

  const tasks = Object.values(tasksQuery.data || {}).flat();
  const loading = projectsQuery.isLoading || projectsQuery.isFetching;
  const error = projectsQuery.isError ? (projectsQuery.error?.message || 'Erreur') : '';
  const pagination = {
    currentPage: projectsQuery.data?.currentPage ?? currentPage,
    totalPages: projectsQuery.data?.totalPages ?? 0,
    totalElements: projectsQuery.data?.totalElements ?? 0,
    size: pageSize,
  };

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id) => projectService.deleteProject(id),
    onSuccess: (_, id) => {
      const willBeEmpty = projects.length === 1;
      const notFirstPage = currentPage > 0;
      if (willBeEmpty && notFirstPage) setCurrentPage((p) => p - 1);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression du projet', { variant: 'error' }),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      let result;
      if (id) {
        result = await projectService.updateProject(id, data);
        if (result.success) {
          await backlogService.patchEntity('projects', id, {
            comments: data.comments,
            links: data.links,
          });
        }
      } else {
        result = await projectService.createProject(data);
      }
      if (!result.success) throw new Error('Erreur lors de la sauvegarde');
      return result.data;
    },
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la sauvegarde du projet', { variant: 'error' }),
  });

  const phaseMutation = useMutation({
    mutationFn: ({ projectRef, phase }) => projectService.updateProjectPhase(projectRef, phase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => enqueueSnackbar('Erreur lors de la mise à jour de la phase', { variant: 'error' }),
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: ({ projectRef, personId }) => projectService.addTeamMember(projectRef, personId),
    onSuccess: (result) => {
      if (result.success) setTeamDialogProject(result.data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      enqueueSnackbar('Membre ajouté à l\'équipe', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de l\'ajout du membre', { variant: 'error' }),
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: ({ projectRef, personId }) => projectService.removeTeamMember(projectRef, personId),
    onSuccess: (result) => {
      if (result.success) setTeamDialogProject(result.data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      enqueueSnackbar('Membre retiré de l\'équipe', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors du retrait du membre', { variant: 'error' }),
  });

  const refreshMemberSkillsMutation = useMutation({
    mutationFn: ({ projectRef, personId }) => projectService.refreshTeamMemberSkills(projectRef, personId),
    onSuccess: (result) => {
      if (result.success) setTeamDialogProject(result.data);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      enqueueSnackbar('Compétences synchronisées', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la synchronisation', { variant: 'error' }),
  });

  // ── Version mutations ────────────────────────────────────────────────────

  const addVersionMutation = useMutation({
    mutationFn: ({ projectRef, versionData }) => projectService.addVersion(projectRef, versionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-versions', versionsDialogProject?.id] });
      enqueueSnackbar('Version ajoutée', { variant: 'success' });
      setShowVersionForm(false);
      setVersionForm({ name: '', creationDate: '', deploymentDate: '' });
      setEditingVersion(null);
    },
    onError: () => enqueueSnackbar('Erreur lors de l\'ajout de la version', { variant: 'error' }),
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ projectRef, versionId, versionData }) =>
      projectService.updateVersion(projectRef, versionId, versionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-versions', versionsDialogProject?.id] });
      enqueueSnackbar('Version mise à jour', { variant: 'success' });
      setShowVersionForm(false);
      setVersionForm({ name: '', creationDate: '', deploymentDate: '' });
      setEditingVersion(null);
    },
    onError: () => enqueueSnackbar('Erreur lors de la mise à jour de la version', { variant: 'error' }),
  });

  const removeVersionMutation = useMutation({
    mutationFn: ({ projectRef, versionId }) => projectService.removeVersion(projectRef, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-versions', versionsDialogProject?.id] });
      enqueueSnackbar('Version supprimée', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression de la version', { variant: 'error' }),
  });

  // ── Environment mutations ────────────────────────────────────────────────

  const addEnvMutation = useMutation({
    mutationFn: ({ projectRef, envData }) => projectService.addEnvironment(projectRef, envData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-environments', envsDialogProject?.id] });
      enqueueSnackbar('Environnement ajouté', { variant: 'success' });
      setShowEnvForm(false);
      setEnvForm({ name: '', type: 'DEV', url: '', description: '' });
      setEditingEnv(null);
    },
    onError: () => enqueueSnackbar('Erreur lors de l\'ajout de l\'environnement', { variant: 'error' }),
  });

  const updateEnvMutation = useMutation({
    mutationFn: ({ projectRef, envId, envData }) =>
      projectService.updateEnvironment(projectRef, envId, envData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-environments', envsDialogProject?.id] });
      enqueueSnackbar('Environnement mis à jour', { variant: 'success' });
      setShowEnvForm(false);
      setEnvForm({ name: '', type: 'DEV', url: '', description: '' });
      setEditingEnv(null);
    },
    onError: () => enqueueSnackbar('Erreur lors de la mise à jour de l\'environnement', { variant: 'error' }),
  });

  const removeEnvMutation = useMutation({
    mutationFn: ({ projectRef, envId }) => projectService.removeEnvironment(projectRef, envId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-environments', envsDialogProject?.id] });
      enqueueSnackbar('Environnement supprimé', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression de l\'environnement', { variant: 'error' }),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({ ...EMPTY_PROJECT_FORM });
    setShowModal(true);
  };

  const handleEditProject = async (project) => {
    setEditingProject(project);
    setFormData({
      projectName: project.projectName || '',
      projectCode: project.projectCode || '',
      description: project.description || '',
      phase: project.phase || 'INCONNUE',
      comments: [],
      links: [],
    });
    setShowModal(true);
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
    const projectName = projects.find((p) => p.id === id)?.projectName;
    const ok = await confirm({
      title: 'Supprimer le projet ?',
      description: `"${projectName || id}" et toutes ses données associées seront supprimés. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ id: editingProject?.id, data: formData });
  };

  const handleViewTasks = (projectId) => navigate(`/tasks?projectId=${projectId}`);

  const handlePhaseChange = (projectRef, phase) => {
    phaseMutation.mutate({ projectRef, phase });
  };

  const handleOpenTeamDialog = async (project) => {
    setTeamDialogProject(project);
    setLoadingPersons(true);
    try {
      const personSvc = (await import('../services/person.service')).default;
      const result = await personSvc.getAllPersonsFlat();
      if (result && result.success) setAllPersonsForTeam(result.data || []);
    } finally {
      setLoadingPersons(false);
    }
  };

  const handleCloseTeamDialog = () => setTeamDialogProject(null);

  const handleAddTeamMember = (personId) => {
    if (!teamDialogProject) return;
    addTeamMemberMutation.mutate({ projectRef: teamDialogProject.projectCode || teamDialogProject.id, personId });
  };

  const handleRemoveTeamMember = (personId) => {
    if (!teamDialogProject) return;
    removeTeamMemberMutation.mutate({ projectRef: teamDialogProject.projectCode || teamDialogProject.id, personId });
  };

  const handleRefreshMemberSkills = (personId) => {
    if (!teamDialogProject) return;
    refreshMemberSkillsMutation.mutate({ projectRef: teamDialogProject.projectCode || teamDialogProject.id, personId });
  };

  // ── Version handlers ─────────────────────────────────────────────────────

  const handleOpenVersionsDialog = (project) => {
    setVersionsDialogProject(project);
    setShowVersionForm(false);
    setVersionForm({ name: '', creationDate: '', deploymentDate: '' });
    setEditingVersion(null);
  };

  const handleCloseVersionsDialog = () => {
    setVersionsDialogProject(null);
    setShowVersionForm(false);
    setVersionForm({ name: '', creationDate: '', deploymentDate: '' });
    setEditingVersion(null);
  };

  const handleVersionFormChange = (e) => {
    const { name, value } = e.target;
    setVersionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditVersion = (version) => {
    setEditingVersion(version);
    setVersionForm({
      name: version.name || '',
      creationDate: version.creationDate || '',
      deploymentDate: version.deploymentDate || '',
    });
    setShowVersionForm(true);
  };

  const handleSubmitVersion = (e) => {
    e.preventDefault();
    if (!versionsDialogProject) return;
    const projectRef = versionsDialogProject.projectCode || versionsDialogProject.id;
    if (editingVersion) {
      updateVersionMutation.mutate({ projectRef, versionId: editingVersion.id, versionData: versionForm });
    } else {
      addVersionMutation.mutate({ projectRef, versionData: versionForm });
    }
  };

  const handleRemoveVersion = async (versionId) => {
    if (!versionsDialogProject) return;
    const ok = await confirm({
      title: 'Supprimer la version ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    const projectRef = versionsDialogProject.projectCode || versionsDialogProject.id;
    removeVersionMutation.mutate({ projectRef, versionId });
  };

  // ── Environment handlers ─────────────────────────────────────────────────

  const handleOpenEnvsDialog = (project) => {
    setEnvsDialogProject(project);
    setShowEnvForm(false);
    setEnvForm({ name: '', type: 'DEV', url: '', description: '' });
    setEditingEnv(null);
  };

  const handleCloseEnvsDialog = () => {
    setEnvsDialogProject(null);
    setShowEnvForm(false);
    setEnvForm({ name: '', type: 'DEV', url: '', description: '' });
    setEditingEnv(null);
  };

  const handleEnvFormChange = (e) => {
    const { name, value } = e.target;
    setEnvForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditEnv = (env) => {
    setEditingEnv(env);
    setEnvForm({
      name: env.name || '',
      type: env.type || 'DEV',
      url: env.url || '',
      description: env.description || '',
    });
    setShowEnvForm(true);
  };

  const handleSubmitEnv = (e) => {
    e.preventDefault();
    if (!envsDialogProject) return;
    const projectRef = envsDialogProject.projectCode || envsDialogProject.id;
    if (editingEnv) {
      updateEnvMutation.mutate({ projectRef, envId: editingEnv.id, envData: envForm });
    } else {
      addEnvMutation.mutate({ projectRef, envData: envForm });
    }
  };

  const handleRemoveEnv = async (envId) => {
    if (!envsDialogProject) return;
    const ok = await confirm({
      title: 'Supprimer l\'environnement ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    const projectRef = envsDialogProject.projectCode || envsDialogProject.id;
    removeEnvMutation.mutate({ projectRef, envId });
  };

  const getCalculatedStatus = useCallback(
    (projectId) => {
      const projectTasks = tasksQuery.data?.[projectId] || [];
      return calculateProjectStatus(projectTasks);
    },
    [tasksQuery.data]
  );

  return {
    projects,
    tasks,
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
    loadProjects: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    handlePageChange,
    handlePageSizeChange,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
    handleSubmit,
    handleViewTasks,
    getCalculatedStatus,
    handlePhaseChange,
    // Team management
    teamDialogProject,
    allPersonsForTeam,
    loadingPersons,
    handleOpenTeamDialog,
    handleCloseTeamDialog,
    handleAddTeamMember,
    handleRemoveTeamMember,
    handleRefreshMemberSkills,
    // Versions management
    versionsDialogProject,
    versionsQuery,
    versionForm,
    editingVersion,
    setEditingVersion,
    showVersionForm,
    setShowVersionForm,
    handleOpenVersionsDialog,
    handleCloseVersionsDialog,
    handleVersionFormChange,
    handleEditVersion,
    handleSubmitVersion,
    handleRemoveVersion,
    // Environments management
    envsDialogProject,
    envsQuery,
    envForm,
    editingEnv,
    setEditingEnv,
    showEnvForm,
    setShowEnvForm,
    handleOpenEnvsDialog,
    handleCloseEnvsDialog,
    handleEnvFormChange,
    handleEditEnv,
    handleSubmitEnv,
    handleRemoveEnv,
  };
};
