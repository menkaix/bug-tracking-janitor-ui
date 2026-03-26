import { apiClient } from './api.service';
import logger from './logger.service';
import { API_ENDPOINTS } from '../config/api.config';

const BASE_URL = API_ENDPOINTS.ISSUES;

const issueService = {
  /**
   * Récupère les issues avec pagination et recherche.
   */
  async getAllIssues(page = 0, size = 20, search = '', filter = '') {
    try {
      logger.debug('Fetching issues', { page, size, search, filter });
      const params = { page, size };
      if (search) params.search = search;
      if (filter) params.filter = filter;
      const response = await apiClient.get(BASE_URL, { params });
      logger.info('Issues fetched successfully', { count: response.data?.content?.length });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère une issue par son ID.
   */
  async getIssueById(id) {
    try {
      logger.debug('Fetching issue by ID', { id });
      const response = await apiClient.get(`${BASE_URL}/${id}`);
      logger.info('Issue fetched successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issue', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Crée une nouvelle issue.
   */
  async createIssue(data) {
    try {
      logger.info('Creating new issue', { title: data.title });
      const response = await apiClient.post(BASE_URL, data);
      logger.info('Issue created successfully', { id: response.data?.id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to create issue', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour une issue existante.
   */
  async updateIssue(id, data) {
    try {
      logger.info('Updating issue', { id });
      const response = await apiClient.put(`${BASE_URL}/${id}`, data);
      logger.info('Issue updated successfully', { id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update issue', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprime une issue.
   */
  async deleteIssue(id) {
    try {
      logger.info('Deleting issue', { id });
      await apiClient.delete(`${BASE_URL}/${id}`);
      logger.info('Issue deleted successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete issue', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour le statut d'une issue via PATCH.
   */
  async updateIssueStatus(id, status) {
    try {
      logger.info('Updating issue status', { id, status });
      const response = await apiClient.patch(`${BASE_URL}/${id}/status`, { status });
      logger.info('Issue status updated successfully', { id, status });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update issue status', { error: error.message, id, status });
      return { success: false, error: error.message };
    }
  },

  /**
   * Ajoute un assigné à une issue.
   */
  async addAssignee(issueId, email) {
    try {
      logger.info('Adding assignee to issue', { issueId, email });
      const response = await apiClient.post(`${BASE_URL}/${issueId}/assignees/${encodeURIComponent(email)}`);
      logger.info('Assignee added successfully', { issueId, email });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add assignee', { error: error.message, issueId, email });
      return { success: false, error: error.message };
    }
  },

  /**
   * Retire un assigné d'une issue.
   */
  async removeAssignee(issueId, email) {
    try {
      logger.info('Removing assignee from issue', { issueId, email });
      const response = await apiClient.delete(`${BASE_URL}/${issueId}/assignees/${encodeURIComponent(email)}`);
      logger.info('Assignee removed successfully', { issueId, email });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to remove assignee', { error: error.message, issueId, email });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues par référence de projet.
   */
  async getIssuesByProjectRef(projectRef) {
    try {
      logger.debug('Fetching issues by project ref', { projectRef });
      const response = await apiClient.get(`${BASE_URL}/by-project-ref/${encodeURIComponent(projectRef)}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues by project ref', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues assignées à un email.
   */
  async getIssuesByAssignee(email) {
    try {
      logger.debug('Fetching issues by assignee', { email });
      const response = await apiClient.get(`${BASE_URL}/by-assignee/${encodeURIComponent(email)}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues by assignee', { error: error.message, email });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues par statut.
   */
  async getIssuesByStatus(status) {
    try {
      logger.debug('Fetching issues by status', { status });
      const response = await apiClient.get(`${BASE_URL}/by-status/${status}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues by status', { error: error.message, status });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues par type.
   */
  async getIssuesByType(type) {
    try {
      logger.debug('Fetching issues by type', { type });
      const response = await apiClient.get(`${BASE_URL}/by-type/${type}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues by type', { error: error.message, type });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues par sévérité.
   */
  async getIssuesBySeverity(severity) {
    try {
      logger.debug('Fetching issues by severity', { severity });
      const response = await apiClient.get(`${BASE_URL}/by-severity/${severity}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issues by severity', { error: error.message, severity });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère toutes les issues ouvertes.
   */
  async getOpenIssues() {
    try {
      logger.debug('Fetching open issues');
      const response = await apiClient.get(`${BASE_URL}/open`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch open issues', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les issues critiques.
   */
  async getCriticalIssues() {
    try {
      logger.debug('Fetching critical issues');
      const response = await apiClient.get(`${BASE_URL}/critical`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch critical issues', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère la liste des statuts disponibles.
   */
  async getStatuses() {
    try {
      logger.debug('Fetching issue statuses');
      const response = await apiClient.get(`${BASE_URL}/statuses`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issue statuses', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère la liste des types disponibles.
   */
  async getTypes() {
    try {
      logger.debug('Fetching issue types');
      const response = await apiClient.get(`${BASE_URL}/types`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issue types', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère la liste des sévérités disponibles.
   */
  async getSeverities() {
    try {
      logger.debug('Fetching issue severities');
      const response = await apiClient.get(`${BASE_URL}/severities`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch issue severities', { error: error.message });
      return { success: false, error: error.message };
    }
  },
};

export default issueService;
