import { apiClient } from './api.service';
import logger from './logger.service';
import { API_ENDPOINTS } from '../config/api.config';

const API_URL = API_ENDPOINTS.PERSONS;

const personService = {
  /**
   * Récupère toutes les personnes avec pagination et recherche
   * @param {number} page - Numéro de page (commence à 0)
   * @param {number} size - Nombre d'éléments par page
   * @param {string} search - Terme de recherche (firstName, lastName, email)
   * @returns {Promise<Object>} Page de personnes
   */
  async getAllPersons(page = 0, size = 10, search = '') {
    try {
      logger.debug(`Fetching persons: page=${page}, size=${size}, search=${search}`);

      let url = `${API_URL}?page=${page}&size=${size}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await apiClient.get(url);
      logger.info(`Successfully fetched ${response.data.content?.length || 0} persons`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error fetching persons:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération des personnes'
      };
    }
  },

  /**
   * Récupère une personne par son ID
   * @param {string} id - ID de la personne
   * @returns {Promise<Object>} Personne trouvée
   */
  async getPersonById(id) {
    try {
      logger.debug(`Fetching person with id: ${id}`);
      const response = await apiClient.get(`${API_URL}/${id}`);
      logger.info(`Successfully fetched person: ${id}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error fetching person ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la personne'
      };
    }
  },

  /**
   * Récupère une personne par son email
   * @param {string} email - Email de la personne
   * @returns {Promise<Object>} Personne trouvée
   */
  async getPersonByEmail(email) {
    try {
      logger.debug(`Fetching person with email: ${email}`);
      const response = await apiClient.get(`${API_URL}/email/${encodeURIComponent(email)}`);
      logger.info(`Successfully fetched person by email: ${email}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error fetching person by email ${email}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération de la personne'
      };
    }
  },

  /**
   * Crée une nouvelle personne
   * @param {Object} person - Données de la personne
   * @param {string} person.firstName - Prénom
   * @param {string} person.lastName - Nom
   * @param {string} person.email - Email (obligatoire)
   * @returns {Promise<Object>} Personne créée
   */
  async createPerson(person) {
    try {
      logger.debug('Creating new person:', person);
      const response = await apiClient.post(API_URL, person);
      logger.info(`Successfully created person: ${response.data.id}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error creating person:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la personne'
      };
    }
  },

  /**
   * Met à jour une personne existante
   * @param {string} id - ID de la personne
   * @param {Object} person - Nouvelles données de la personne
   * @returns {Promise<Object>} Personne mise à jour
   */
  async updatePerson(id, person) {
    try {
      logger.debug(`Updating person ${id}:`, person);
      const response = await apiClient.put(`${API_URL}/${id}`, person);
      logger.info(`Successfully updated person: ${id}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error(`Error updating person ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la personne'
      };
    }
  },

  /**
   * Supprime une personne
   * @param {string} id - ID de la personne à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deletePerson(id) {
    try {
      logger.debug(`Deleting person: ${id}`);
      await apiClient.delete(`${API_URL}/${id}`);
      logger.info(`Successfully deleted person: ${id}`);

      return {
        success: true
      };
    } catch (error) {
      logger.error(`Error deleting person ${id}:`, error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la suppression de la personne'
      };
    }
  },

  /**
   * Récupère toutes les personnes actives sans pagination (pour les dropdowns).
   */
  async getAllPersonsFlat() {
    try {
      logger.debug('Fetching all persons (flat)');
      const response = await apiClient.get(`${API_URL}/all`);
      return { success: true, data: response.data || [] };
    } catch (error) {
      logger.error('Failed to fetch all persons (flat)', { error: error.message });
      return { success: false, error: error.message };
    }
  },
};

export default personService;
