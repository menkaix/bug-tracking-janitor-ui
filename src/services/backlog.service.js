import { apiClient } from './api.service';
import logger from './logger.service';

const backlogService = {
  /**
   * POST /project-command/{project}/add-actor
   * Body: { name, type }  — type: "USER" | "SYSTEM"
   */
  addActor: async (projectCode, { name, type }) => {
    try {
      logger.info('Adding actor to project', { projectCode, name, type });
      const response = await apiClient.post(`/project-command/${projectCode}/add-actor`, { name, type });
      logger.info('Actor added successfully', { projectCode, name });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add actor', { error: error.message, projectCode, name });
      return { success: false, error: error.message };
    }
  },

  /**
   * POST /actor-command/{project}/{actorName}/add-story
   * Body: { action, scenario, objective }
   */
  addStory: async (projectCode, actorName, { action, scenario, objective }) => {
    try {
      logger.info('Adding story to actor', { projectCode, actorName, action });
      const response = await apiClient.post(
        `/actor-command/${projectCode}/${encodeURIComponent(actorName)}/add-story`,
        { action, scenario, objective }
      );
      logger.info('Story added successfully', { projectCode, actorName });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add story', { error: error.message, projectCode, actorName });
      return { success: false, error: error.message };
    }
  },

  /**
   * GET /featuretypes — liste les types de feature
   */
  getFeatureTypes: async () => {
    try {
      logger.debug('Fetching feature types');
      const response = await apiClient.get('/featuretypes');
      logger.info('Feature types fetched successfully');
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch feature types', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * POST /feature-command/{storyId}/add
   * Body: { name, description, type }
   */
  addFeature: async (storyId, { name, description, type }) => {
    try {
      logger.info('Adding feature to story', { storyId, name, type });
      const response = await apiClient.post(`/feature-command/${storyId}/add`, { name, description, type });
      logger.info('Feature added successfully', { storyId, name });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add feature', { error: error.message, storyId, name });
      return { success: false, error: error.message };
    }
  },

  /**
   * Récupère une entité complète (avec comments et links embarqués).
   * entityType: 'stories' | 'features' | 'actors' | 'projects' | 'tasks'
   * GET /{entityType}/{id}
   */
  getEntity: async (entityType, id) => {
    try {
      logger.debug('Fetching entity', { entityType, id });
      const response = await apiClient.get(`/${entityType}/${id}`);
      logger.info('Entity fetched successfully', { entityType, id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to fetch entity', { error: error.message, entityType, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour partiellement une entité (comments, links ou champs métier).
   * entityType: 'stories' | 'features' | 'actors' | 'projects' | 'tasks'
   * PATCH /{entityType}/{id}
   */
  patchEntity: async (entityType, id, data) => {
    try {
      logger.info('Patching entity', { entityType, id });
      const response = await apiClient.patch(`/${entityType}/${id}`, data);
      logger.info('Entity patched successfully', { entityType, id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to patch entity', { error: error.message, entityType, id });
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour une story via le endpoint command.
   * POST /story-command/update — Body: FullStoryDTO
   */
  updateStory: async (storyDTO) => {
    try {
      logger.info('Updating story via command', { id: storyDTO.id });
      const response = await apiClient.post('/story-command/update', storyDTO);
      logger.info('Story updated successfully', { id: storyDTO.id });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update story', { error: error.message, id: storyDTO.id });
      return { success: false, error: error.message };
    }
  },
};

export default backlogService;
