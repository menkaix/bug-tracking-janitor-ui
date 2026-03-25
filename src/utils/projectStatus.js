/**
 * Utilitaires pour calculer et afficher le statut d'un projet selon l'état de ses tâches.
 * Logique alignée avec ProjectState.compute() côté backend :
 *   - ACTIVE  : au moins une tâche en cours ou à faire
 *   - STANDBY : aucune tâche active, mais au moins une tâche PENDING
 *   - CLOSED  : uniquement des tâches terminales (DONE, CANCELED) ou aucune tâche
 */

/**
 * Normalise un statut de tâche (backend ou frontend) en minuscules avec tirets.
 * Ex: "IN_PROGRESS" → "in-progress", "to_spec" → "to-spec"
 */
const normalizeStatus = (s) => (s ? s.toLowerCase().replace(/_/g, '-') : '');

const ACTIVE_TASK_STATUSES = new Set([
  'new', 'todo', 'in-progress', 'to-spec', 'specifying', 'rnd', 'to-study', 'to-test', 'testing',
]);
const TERMINAL_TASK_STATUSES = new Set(['done', 'canceled', 'unknown']);

/**
 * Calcule le statut d'un projet basé sur ses tâches — miroir de ProjectState.compute().
 * @param {Array} tasks - Liste des tâches du projet
 * @returns {'ACTIVE'|'STANDBY'|'CLOSED'} Le statut calculé
 */
export const calculateProjectStatus = (tasks) => {
  if (!tasks || tasks.length === 0) return 'CLOSED';

  let hasPending = false;

  for (const task of tasks) {
    const s = normalizeStatus(task.status);
    if (ACTIVE_TASK_STATUSES.has(s)) return 'ACTIVE';
    if (s === 'pending') hasPending = true;
  }

  return hasPending ? 'STANDBY' : 'CLOSED';
};

/**
 * Retourne les informations de style pour un statut de projet.
 * Accepte aussi bien la valeur calculée côté frontend que le statut retourné par le backend.
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
export const getProjectStatusInfo = (status) => {
  const s = status ? status.toUpperCase() : '';

  switch (s) {
    case 'ACTIVE':
      return { label: 'Actif', color: 'primary' };

    case 'STANDBY':
    case 'ON_HOLD':
    case 'EN_ATTENTE':
      return { label: 'Stand by', color: 'warning' };

    case 'CLOSED':
    case 'COMPLETED':
    case 'DONE':
    case 'TERMINÉ':
      return { label: 'Clôturé', color: 'success' };

    default:
      return { label: status || 'Inconnu', color: 'default' };
  }
};

/**
 * Options pour le filtre de statut de projet dans l'UI.
 */
export const PROJECT_STATE_OPTIONS = [
  { value: '',        label: 'Tous les projets' },
  { value: 'ACTIVE',  label: 'Actifs' },
  { value: 'STANDBY', label: 'Stand by' },
  { value: 'CLOSED',  label: 'Clôturés' },
];

/**
 * Phases de projet — alignées avec le backend ProjectPhase enum.
 */
export const PROJECT_PHASE_OPTIONS = [
  { value: 'INCONNUE',      label: 'Inconnue' },
  { value: 'AVANT_VENTE',   label: 'Avant-vente' },
  { value: 'CADRAGE',       label: 'Cadrage' },
  { value: 'CONCEPTION',    label: 'Conception' },
  { value: 'PREPRODUCTION', label: 'Pré-production' },
  { value: 'PRODUCTION',    label: 'Production' },
  { value: 'MAINTENANCE',   label: 'Maintenance' },
];

/**
 * Retourne les informations d'affichage d'une phase de projet.
 * @param {string} phase
 * @returns {{ label: string, color: string }}
 */
export const getProjectPhaseInfo = (phase) => {
  const opt = PROJECT_PHASE_OPTIONS.find((o) => o.value === phase);
  return opt
    ? { label: opt.label, color: 'default' }
    : { label: phase || 'Inconnue', color: 'default' };
};
