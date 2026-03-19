import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useConfirm } from './useConfirm';
import projectService from '../services/project.service';
import taskService from '../services/task.service';
import backlogService from '../services/backlog.service';
import { calculateProjectStatus } from '../utils/projectStatus';
import { FETCH_LIMITS } from '../config/api.config';

const EMPTY_PROJECT_FORM = {
  projectName: '',
  projectCode: '',
  description: '',
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

  // Tâches pour le calcul de statut des projets (cache partagé avec le Dashboard)
  const tasksQuery = useQuery({
    queryKey: ['tasks', 'allForStatus', FETCH_LIMITS.PROJECTS_STATUS],
    queryFn: async () => {
      const result = await taskService.getAllTasks(0, FETCH_LIMITS.PROJECTS_STATUS);
      return result.success ? (result.data.content || []) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const projects = projectsQuery.data?.content || [];
  const tasks = tasksQuery.data || [];
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

  const getCalculatedStatus = useCallback(
    (projectId) => {
      const projectTasks = tasks.filter((t) => t.projectId === projectId);
      return calculateProjectStatus(projectTasks);
    },
    [tasks]
  );

  return {
    projects,
    tasks,
    loading,
    error,
    pagination,
    searchTerm,
    setSearchTerm,
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
  };
};
