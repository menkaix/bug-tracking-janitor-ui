import { apiClient } from './api.service';
import logger from './logger.service';

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
      const params = { page, size, sort: 'creationDate,desc' };
      if (search) params.search = search;
      if (filter) params.filter = filter;

      logger.debug('Fetching projects', { page, size, search, filter });
      const response = await apiClient.get('/projects', { params });
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
      const response = await apiClient.get(`/projects/${id}`);
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
      const response = await apiClient.post('/projects', payload);
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
      const response = await apiClient.put(`/projects/${id}`, payload);
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
      await apiClient.delete(`/projects/${id}`);
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
      const response = await apiClient.get(`/project-command/${projectCode}/tree`);
      logger.info('Project tree fetched successfully', { projectCode });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch project tree', { error: error.message, projectCode });
      return { success: false, error: error.message };
    }
  },
};

export default projectService;
