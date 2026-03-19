import { assigneeToArray } from './assigneeUtils';

/**
 * Filtres composables pour les tâches.
 * Chaque filtre est une fonction pure (task) => boolean.
 * Respecte OCP : ajouter un filtre = ajouter une fonction, sans toucher à l'existant.
 */

/**
 * Filtre par statut(s).
 * @param {string[]} statuses - liste des statuts autorisés (inclut éventuellement 'no-status')
 * @returns {(task: object) => boolean}
 */
export const byStatus = (statuses) => {
  if (!statuses || statuses.length === 0) return () => true;
  const hasNoStatus = statuses.includes('no-status');
  const real = statuses.filter((s) => s !== 'no-status');
  return (task) => {
    if (!task.status || task.status === '') return hasNoStatus;
    return real.some((s) => task.status.toLowerCase() === s.toLowerCase());
  };
};

/**
 * Filtre par projet.
 * @param {string} projectId - ID du projet, ou 'no-project' pour les tâches sans projet
 * @returns {(task: object) => boolean}
 */
export const byProject = (projectId) => {
  if (!projectId) return () => true;
  if (projectId === 'no-project') return (task) => !task.projectId || task.projectId === '';
  return (task) => task.projectId === projectId;
};

/**
 * Filtre par assigné(s).
 * @param {string[]} emails - liste des emails d'assignés
 * @returns {(task: object) => boolean}
 */
export const byAssignee = (emails) => {
  if (!emails || emails.length === 0) return () => true;
  return (task) => {
    const taskAssignees = assigneeToArray(task.assignee);
    return emails.some((email) => taskAssignees.includes(email));
  };
};

/**
 * Filtre par terme de recherche (titre, description, référence).
 * @param {string} term
 * @returns {(task: object) => boolean}
 */
export const bySearch = (term) => {
  if (!term) return () => true;
  const lower = term.toLowerCase();
  return (task) =>
    task.title?.toLowerCase().includes(lower) ||
    task.description?.toLowerCase().includes(lower) ||
    task.trackingReference?.toLowerCase().includes(lower);
};

/**
 * Compose plusieurs filtres en un seul (AND logique).
 * @param {...Function} filters
 * @returns {(task: object) => boolean}
 */
export const composeFilters = (...filters) => (task) => filters.every((f) => f(task));

/**
 * Applique un ensemble de filtres à un tableau de tâches.
 * @param {object[]} tasks
 * @param {...Function} filters
 * @returns {object[]}
 */
export const applyFilters = (tasks, ...filters) => {
  const combined = composeFilters(...filters);
  return tasks.filter(combined);
};
