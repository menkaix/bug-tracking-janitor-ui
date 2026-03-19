import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import projectService from '../services/project.service';
import taskService from '../services/task.service';
import backlogService from '../services/backlog.service';
import { calculateProjectStatus } from '../utils/projectStatus';

const EMPTY_PROJECT_FORM = {
  projectName: '',
  projectCode: '',
  description: '',
  comments: [],
  links: [],
};

/**
 * Controller hook pour la page Projets.
 */
export const useProjects = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 100,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PROJECT_FORM });

  const loadProjects = async (page = 0, size = pagination.size) => {
    setLoading(true);
    setError('');
    try {
      const [projectsResult, tasksResult] = await Promise.all([
        projectService.getAllProjects(page, size, searchTerm),
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
    } catch {
      setError('Une erreur est survenue lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProjects(0), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handlePageChange = (page) => loadProjects(page);

  const handlePageSizeChange = (newSize) => {
    setPagination((prev) => ({ ...prev, size: newSize }));
    loadProjects(0, newSize);
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
      setFormData((prev) => ({ ...prev, comments: result.data.comments || [], links: result.data.links || [] }));
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    const result = await projectService.deleteProject(id);
    if (result.success) {
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

  const handleViewTasks = (projectId) => navigate(`/tasks?projectId=${projectId}`);

  const getCalculatedStatus = (projectId) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    return calculateProjectStatus(projectTasks);
  };

  return {
    projects,
    tasks,
    loading,
    error,
    pagination,
    searchTerm, setSearchTerm,
    showModal, setShowModal,
    editingProject,
    formData, setFormData,
    loadProjects,
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
