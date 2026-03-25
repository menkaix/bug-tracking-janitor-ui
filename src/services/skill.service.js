import { apiClient } from './api.service';
import logger from './logger.service';
import { API_ENDPOINTS } from '../config/api.config';

const API_URL = API_ENDPOINTS.SKILLS;

/**
 * Service pour la gestion du catalogue de skills et des compétences des personnes.
 */
const skillService = {

  // ── Catalogue ──────────────────────────────────────────────────────────────

  getAllSkills: async () => {
    try {
      logger.debug('Fetching all skills');
      const response = await apiClient.get(API_URL);
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch skills', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  getSkillsByCategory: async (category) => {
    try {
      const response = await apiClient.get(`${API_URL}/by-category/${encodeURIComponent(category)}`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAllCategories: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/categories`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getAllLevels: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/levels`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createSkill: async (skill) => {
    try {
      logger.info('Creating skill', { name: skill.name });
      const response = await apiClient.post(API_URL, skill);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to create skill', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  updateSkill: async (id, patch) => {
    try {
      logger.info('Updating skill', { id });
      const response = await apiClient.patch(`${API_URL}/${id}`, patch);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update skill', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  deleteSkill: async (id) => {
    try {
      logger.info('Deleting skill', { id });
      await apiClient.delete(`${API_URL}/${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete skill', { error: error.message, id });
      return { success: false, error: error.message };
    }
  },

  // ── Skillset d'une personne ────────────────────────────────────────────────

  getPersonSkills: async (personId) => {
    try {
      const response = await apiClient.get(`${API_URL}/person/${personId}`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  addPersonSkill: async (personId, skillId, level) => {
    try {
      logger.info('Adding skill to person', { personId, skillId, level });
      const response = await apiClient.post(`${API_URL}/person/${personId}/${skillId}`, { level });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to add person skill', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  updatePersonSkillLevel: async (personId, skillId, level) => {
    try {
      logger.info('Updating person skill level', { personId, skillId, level });
      const response = await apiClient.patch(`${API_URL}/person/${personId}/${skillId}`, { level });
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to update person skill level', { error: error.message });
      return { success: false, error: error.message };
    }
  },

  removePersonSkill: async (personId, skillId) => {
    try {
      logger.info('Removing skill from person', { personId, skillId });
      const response = await apiClient.delete(`${API_URL}/person/${personId}/${skillId}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error('Failed to remove person skill', { error: error.message });
      return { success: false, error: error.message };
    }
  },
};

export default skillService;
