import { apiClient } from './api.service';
import logger from './logger.service';
import { API_ENDPOINTS } from '../config/api.config';

const API_URL = API_ENDPOINTS.TASKS;

/**
 * Service pour la gestion des tâches
 */
const taskService = {
  /**
   * Récupère toutes les tâches avec pagination
   * @param {number} page - Numéro de la page (0-indexed)
   * @param {number} size - Taille de la page
   * @param {string} search - Terme de recherche
   * @param {string} filter - Filtre (format: "field:value")
   */
  getAllTasks: async (page = 0, size = 10, search = '', filter = '') => {
    try {
      const params = { page, size };
      if (search) params.search = search;
      if (filter) params.filter = filter;

      logger.debug('Fetching tasks', { page, size, search, filter });
      const response = await apiClient.get(API_URL, { params });
      logger.info('Tasks fetched successfully', { count: response.data?.content?.length || 0 });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch tasks', { error: error.message, page, size });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère une tâche par son ID
   * @param {string} id - ID de la tâche
   */
  getTaskById: async (id) => {
    try {
      logger.debug('Fetching task by ID', { id });
      const response = await apiClient.get(`${API_URL}/${id}`);
      logger.info('Task fetched successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch task', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Crée une nouvelle tâche
   * @param {Object} task - Données de la tâche
   */
  createTask: async (task) => {
    try {
      logger.info('Creating new task', { title: task.title, status: task.status });
      const response = await apiClient.post(API_URL, task);
      logger.info('Task created successfully', { id: response.data?.id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to create task', { error: error.message, task });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour une tâche existante
   * @param {string} id - ID de la tâche
   * @param {Object} task - Nouvelles données de la tâche
   */
  updateTask: async (id, task) => {
    try {
      logger.info('Updating task', { id, title: task.title, status: task.status });
      const response = await apiClient.put(`${API_URL}/${id}`, task);
      logger.info('Task updated successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update task', { error: error.message, id, task });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour partiellement une tâche via PUT.
   * Si cachedTask est fourni (depuis le cache React Query), évite le GET préalable.
   * @param {string} id - ID de la tâche
   * @param {Object} patch - Champs à mettre à jour (ex: { status: 'done' })
   * @param {Object|null} cachedTask - Données complètes de la tâche depuis le cache (optionnel)
   */
  patchTask: async (id, patch, cachedTask = null) => {
    try {
      let fullTask;
      if (cachedTask) {
        logger.info('Patching task (cache+PUT)', { id, patch });
        fullTask = cachedTask;
      } else {
        logger.info('Patching task (GET+PUT)', { id, patch });
        const getResponse = await apiClient.get(`${API_URL}/${id}`);
        fullTask = getResponse.data;
      }
      const response = await apiClient.put(`${API_URL}/${id}`, { ...fullTask, ...patch });
      logger.info('Task patched successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to patch task', { error: error.message, id, patch });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère toutes les tâches d'un projet (directes + via features, sans limite de pagination)
   * @param {string} projectRef - Nom, code ou ID MongoDB du projet
   */
  getTasksByProjectRef: async (projectRef) => {
    try {
      logger.debug('Fetching tasks by project ref', { projectRef });
      const response = await apiClient.get(`${API_URL}/by-project-ref/${encodeURIComponent(projectRef)}`);
      logger.info('Tasks by project ref fetched', { projectRef, count: response.data?.length || 0 });
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch tasks by project ref', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère toutes les tâches assignées à une personne
   * @param {string} email - Email de l'assigné
   */
  getTasksByAssignee: async (email) => {
    try {
      logger.debug('Fetching tasks by assignee', { email });
      const response = await apiClient.get(`${API_URL}/by-assignee/${encodeURIComponent(email)}`);
      logger.info('Tasks by assignee fetched', { email, count: response.data?.length || 0 });
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch tasks by assignee', { error: error.message, email });
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprime une tâche
   * @param {string} id - ID de la tâche
   */
  deleteTask: async (id) => {
    try {
      logger.info('Deleting task', { id });
      await apiClient.delete(`${API_URL}/${id}`);
      logger.info('Task deleted successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },
};

export default taskService;
