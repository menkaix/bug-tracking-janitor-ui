import { apiClient } from './api.service';
import logger from './logger.service';
import { API_ENDPOINTS } from '../config/api.config';

const PROJECTS_URL = API_ENDPOINTS.PROJECTS;
const PROJECT_COMMAND_URL = API_ENDPOINTS.PROJECT_COMMAND;

// Extrait l'ID MongoDB depuis le lien HAL self : ".../projects/507f1f77bcf86cd799439011"
const extractId = (project) =>
  project.id || project._links?.self?.href?.split('/').pop() || undefined;

// Mappe les champs backend (name/code) vers les champs frontend (projectName/projectCode)
const mapFromBackend = (project) => ({
  ...project,
  id: extractId(project),
  projectName: project.name,
  projectCode: project.code,
});

// Mappe les champs frontend (projectName/projectCode) vers les champs backend (name/code)
const mapToBackend = ({ projectName, projectCode, ...rest }) => ({
  ...rest,
  name: projectName,
  code: projectCode,
});

// Normalise la réponse HAL de Spring Data REST en format Page standard
const parseHalResponse = (data, size) => ({
  content: (data._embedded?.projects || []).map(mapFromBackend),
  totalElements: data.page?.totalElements || 0,
  totalPages: data.page?.totalPages || 0,
  currentPage: data.page?.number || 0,
  size: data.page?.size || size,
});

const projectService = {
  getAllProjects: async (page = 0, size = 10, search = '', filter = '') => {
    try {
      const params = { page, size, sort: ['lastUpdateDate,desc', 'creationDate,desc'] };
      if (search) params.search = search;
      if (filter) params.filter = filter;

      logger.debug('Fetching projects', { page, size, search, filter });
      const response = await apiClient.get(PROJECTS_URL, { params });
      const data = parseHalResponse(response.data, size);
      logger.info('Projects fetched successfully', { count: data.content.length });
      return { success: true, data };
    } catch (error) {
      logger.error('Failed to fetch projects', { error: error.message, page, size });
      return { success: false, error: error.message };
    }
  },

  getProjectById: async (id) => {
    try {
      logger.debug('Fetching project by ID', { id });
      const response = await apiClient.get(`${PROJECTS_URL}/${id}`);
      logger.info('Project fetched successfully', { id });
      return { success: true, data: mapFromBackend(response.data) };
    } catch (error) {
      logger.error('Failed to fetch project', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  createProject: async (project) => {
    try {
      const payload = mapToBackend(project);
      logger.info('Creating new project', { name: payload.name });
      const response = await apiClient.post(PROJECTS_URL, payload);
      logger.info('Project created successfully', { id: response.data?.id });
      return { success: true, data: mapFromBackend(response.data) };
    } catch (error) {
      logger.error('Failed to create project', { error: error.message, project });
      return { success: false, error: error.message };
    }
  },

  updateProject: async (id, project) => {
    try {
      const payload = mapToBackend(project);
      logger.info('Updating project', { id, name: payload.name });
      const response = await apiClient.put(`${PROJECTS_URL}/${id}`, payload);
      logger.info('Project updated successfully', { id });
      return { success: true, data: mapFromBackend(response.data) };
    } catch (error) {
      logger.error('Failed to update project', { error: error.message, id, project });
      return { success: false, error: error.message };
    }
  },

  deleteProject: async (id) => {
    try {
      logger.info('Deleting project', { id });
      await apiClient.delete(`${PROJECTS_URL}/${id}`);
      logger.info('Project deleted successfully', { id });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete project', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  getProjectTree: async (projectCode) => {
    try {
      logger.debug('Fetching project tree', { projectCode });
      const response = await apiClient.get(`${PROJECT_COMMAND_URL}/${projectCode}/tree`);
      logger.info('Project tree fetched successfully', { projectCode });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch project tree', { error: error.message, projectCode });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour la phase d'un projet.
   * @param {string} projectRef - Nom, code ou id MongoDB du projet
   * @param {string} phase - Valeur de ProjectPhase (ex: 'PRODUCTION')
   */
  updateProjectPhase: async (projectRef, phase) => {
    try {
      logger.info('Updating project phase', { projectRef, phase });
      const response = await apiClient.patch(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/phase`,
        { phase }
      );
      logger.info('Project phase updated successfully', { projectRef, phase });
      return { success: true, data: mapFromBackend(response.data) };
    } catch (error) {
      logger.error('Failed to update project phase', { error: error.message, projectRef, phase });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère les projets filtrés par état calculé côté backend.
   * @param {string} state - 'ACTIVE' | 'STANDBY' | 'CLOSED'
   */
  getProjectsByStatus: async (state) => {
    try {
      logger.debug('Fetching projects by status', { state });
      const response = await apiClient.get(`${PROJECT_COMMAND_URL}/by-status/${state}`);
      logger.info('Projects by status fetched', { state, count: response.data?.length });
      return { success: true, data: (response.data || []).map(mapFromBackend) };
    } catch (error) {
      logger.error('Failed to fetch projects by status', { error: error.message, state });
      return { success: false, error: error.message };
    }
  },

  getProjectTeam: async (projectRef) => {
    try {
      logger.debug('Fetching project team', { projectRef });
      const response = await apiClient.get(`${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/team`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch project team', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  addTeamMember: async (projectRef, personId) => {
    try {
      logger.info('Adding team member', { projectRef, personId });
      const response = await apiClient.post(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/team/${personId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add team member', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  removeTeamMember: async (projectRef, personId) => {
    try {
      logger.info('Removing team member', { projectRef, personId });
      const response = await apiClient.delete(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/team/${personId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to remove team member', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  refreshTeamMemberSkills: async (projectRef, personId) => {
    try {
      logger.info('Refreshing team member skills', { projectRef, personId });
      const response = await apiClient.post(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/team/${personId}/refresh-skills`
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to refresh team member skills', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  // ── Versions ──────────────────────────────────────────────────────────────

  getVersions: async (projectRef) => {
    try {
      logger.debug('Fetching project versions', { projectRef });
      const response = await apiClient.get(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/versions`
      );
      logger.info('Project versions fetched', { projectRef, count: response.data?.length });
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch project versions', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  addVersion: async (projectRef, versionData) => {
    try {
      logger.info('Adding project version', { projectRef, versionData });
      const response = await apiClient.post(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/versions`,
        versionData
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add project version', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  updateVersion: async (projectRef, versionId, versionData) => {
    try {
      logger.info('Updating project version', { projectRef, versionId });
      const response = await apiClient.put(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/versions/${versionId}`,
        versionData
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update project version', { error: error.message, projectRef, versionId });
      return { success: false, error: error.message };
    }
  },

  removeVersion: async (projectRef, versionId) => {
    try {
      logger.info('Removing project version', { projectRef, versionId });
      const response = await apiClient.delete(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/versions/${versionId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to remove project version', { error: error.message, projectRef, versionId });
      return { success: false, error: error.message };
    }
  },

  // ── Environments ──────────────────────────────────────────────────────────

  getEnvironments: async (projectRef) => {
    try {
      logger.debug('Fetching project environments', { projectRef });
      const response = await apiClient.get(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/environments`
      );
      logger.info('Project environments fetched', { projectRef, count: response.data?.length });
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch project environments', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  addEnvironment: async (projectRef, envData) => {
    try {
      logger.info('Adding project environment', { projectRef, envData });
      const response = await apiClient.post(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/environments`,
        envData
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add project environment', { error: error.message, projectRef });
      return { success: false, error: error.message };
    }
  },

  updateEnvironment: async (projectRef, envId, envData) => {
    try {
      logger.info('Updating project environment', { projectRef, envId });
      const response = await apiClient.put(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/environments/${envId}`,
        envData
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update project environment', { error: error.message, projectRef, envId });
      return { success: false, error: error.message };
    }
  },

  removeEnvironment: async (projectRef, envId) => {
    try {
      logger.info('Removing project environment', { projectRef, envId });
      const response = await apiClient.delete(
        `${PROJECT_COMMAND_URL}/${encodeURIComponent(projectRef)}/environments/${envId}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to remove project environment', { error: error.message, projectRef, envId });
      return { success: false, error: error.message };
    }
  },
};

export default projectService;
