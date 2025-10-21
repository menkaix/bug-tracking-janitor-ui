import { apiClient } from './api.service';
import logger from './logger.service';

/**
 * Service pour la gestion des projets
 */
const projectService = {
  /**
   * Récupère tous les projets avec pagination
   * @param {number} page - Numéro de la page (0-indexed)
   * @param {number} size - Taille de la page
   * @param {string} search - Terme de recherche
   * @param {string} filter - Filtre (format: "field:value")
   */
  getAllProjects: async (page = 0, size = 10, search = '', filter = '') => {
    try {
      const params = { page, size };
      if (search) params.search = search;
      if (filter) params.filter = filter;

      logger.debug('Fetching projects', { page, size, search, filter });
      const response = await apiClient.get('/project', { params });
      logger.info('Projects fetched successfully', { count: response.data?.content?.length || 0 });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch projects', { error: error.message, page, size });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère un projet par son ID
   * @param {string} id - ID du projet
   */
  getProjectById: async (id) => {
    try {
      logger.debug('Fetching project by ID', { id });
      const response = await apiClient.get(`/project/${id}`);
      logger.info('Project fetched successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch project', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Crée un nouveau projet
   * @param {Object} project - Données du projet
   */
  createProject: async (project) => {
    try {
      logger.info('Creating new project', { name: project.name });
      const response = await apiClient.post('/project', project);
      logger.info('Project created successfully', { id: response.data?.id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to create project', { error: error.message, project });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour un projet existant
   * @param {string} id - ID du projet
   * @param {Object} project - Nouvelles données du projet
   */
  updateProject: async (id, project) => {
    try {
      logger.info('Updating project', { id, name: project.name });
      const response = await apiClient.put(`/project/${id}`, project);
      logger.info('Project updated successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update project', { error: error.message, id, project });
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprime un projet
   * @param {string} id - ID du projet
   */
  deleteProject: async (id) => {
    try {
      logger.info('Deleting project', { id });
      await apiClient.delete(`/project/${id}`);
      logger.info('Project deleted successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete project', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },
};

export default projectService;
