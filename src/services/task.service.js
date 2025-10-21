import { apiClient } from './api.service';
import logger from './logger.service';

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
      const response = await apiClient.get('/task', { params });
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
      const response = await apiClient.get(`/task/${id}`);
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
      const response = await apiClient.post('/task', task);
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
      const response = await apiClient.put(`/task/${id}`, task);
      logger.info('Task updated successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update task', { error: error.message, id, task });
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
      await apiClient.delete(`/task/${id}`);
      logger.info('Task deleted successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete task', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },
};

export default taskService;
