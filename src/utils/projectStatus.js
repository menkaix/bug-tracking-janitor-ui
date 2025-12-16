/**
 * Utilitaires pour calculer le statut d'un projet selon l'état de ses tâches
 */

/**
 * Calcule le statut d'un projet basé sur ses tâches
 * @param {Array} tasks - Liste des tâches du projet
 * @returns {string} - Le statut calculé : 'NEW', 'ACTIVE', 'COMPLETED', 'ON_HOLD'
 */
export const calculateProjectStatus = (tasks) => {
  if (!tasks || tasks.length === 0) {
    return 'NEW';
  }

  const taskStatuses = tasks.map(t => t.status ? t.status.toLowerCase() : '');

  // Vérifier si toutes les tâches sont terminées
  const allDone = taskStatuses.every(status =>
    status === 'done' ||
    status === 'canceled'
  );
  if (allDone) {
    return 'COMPLETED';
  }

  // Vérifier s'il y a des tâches "à faire" ou "en cours"
  const hasActiveTask = taskStatuses.some(status =>
    status === 'todo' ||
    status === 'to-do' ||
    status === 'in-progress' ||
    status === 'in_progress' ||
    status === 'inprogress' ||
    status === 'to-test' ||
    status === 'testing'
  );
  if (hasActiveTask) {
    return 'ACTIVE';
  }

  // Vérifier si toutes les tâches sont "à étudier" ou "en attente"
  const allOnHold = taskStatuses.every(status =>
    status === 'to-study' ||
    status === 'pending'
  );
  if (allOnHold) {
    return 'ON_HOLD';
  }

  // Par défaut, considérer comme "en stand by"
  return 'ON_HOLD';
};

/**
 * Retourne les informations de style pour un statut de projet
 * @param {string} status - Le statut du projet
 * @returns {object} - Objet avec label et color
 */
export const getProjectStatusInfo = (status) => {
  const statusUpper = status ? status.toUpperCase() : '';

  switch (statusUpper) {
    case 'NEW':
    case 'NOUVEAU':
      return {
        label: 'Nouveau',
        color: 'secondary',
      };
    case 'ACTIVE':
    case 'ACTIF':
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return {
        label: 'Actif',
        color: 'primary',
      };
    case 'COMPLETED':
    case 'DONE':
    case 'TERMINÉ':
      return {
        label: 'Terminé',
        color: 'success',
      };
    case 'ON_HOLD':
    case 'STANDBY':
    case 'STAND_BY':
    case 'EN_ATTENTE':
      return {
        label: 'Stand by',
        color: 'warning',
      };
    default:
      return {
        label: status || 'Inconnu',
        color: 'default',
      };
  }
};
