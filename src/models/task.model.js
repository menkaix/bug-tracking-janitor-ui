import React from 'react';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  Psychology as PsychologyIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  FactCheck as FactCheckIcon,
  Science as ScienceIcon,
  RemoveDone as RemoveDoneIcon,
  FiberNew as FiberNewIcon,
  Tune as TuneIcon,
  Biotech as BiotechIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

/**
 * Statuts de tâche — alignés avec le backend TaskStatus enum.
 * Source unique de vérité pour TasksPage, KanbanBoard, filtres, etc.
 *
 * Les valeurs correspondent aux formats acceptés par normalize() côté backend.
 * Le backend retourne les noms d'enum en majuscules (ex: IN_PROGRESS) ;
 * getTaskStatusInfo() normalise les deux formes.
 */
export const TASK_STATUS_OPTIONS = [
  { value: 'new',          label: 'Nouveau',             color: 'default',   icon: <FiberNewIcon fontSize="small" /> },
  { value: 'todo',         label: 'À faire',             color: 'secondary', icon: <AssignmentIcon fontSize="small" /> },
  { value: 'pending',      label: 'En attente',          color: 'warning',   icon: <PendingIcon fontSize="small" /> },
  { value: 'to-spec',      label: 'À spécifier',         color: 'warning',   icon: <TuneIcon fontSize="small" /> },
  { value: 'specifying',   label: 'En spécification',    color: 'warning',   icon: <TuneIcon fontSize="small" /> },
  { value: 'in-progress',  label: 'En cours',            color: 'info',      icon: <ScheduleIcon fontSize="small" /> },
  { value: 'rnd',          label: 'R&D',                 color: 'info',      icon: <BiotechIcon fontSize="small" /> },
  { value: 'to-study',     label: 'À étudier',           color: 'default',   icon: <PsychologyIcon fontSize="small" /> },
  { value: 'to-test',      label: 'À tester',            color: 'info',      icon: <FactCheckIcon fontSize="small" /> },
  { value: 'testing',      label: 'En cours de test',    color: 'info',      icon: <ScienceIcon fontSize="small" /> },
  { value: 'done',         label: 'Terminé',             color: 'success',   icon: <CheckCircleIcon fontSize="small" /> },
  { value: 'canceled',     label: 'Annulé',              color: 'error',     icon: <BlockIcon fontSize="small" /> },
  { value: 'unknown',      label: 'Inconnu',             color: 'default',   icon: <HelpOutlineIcon fontSize="small" /> },
  { value: 'no-status',    label: 'Sans statut',         color: 'default',   icon: <RemoveDoneIcon fontSize="small" /> },
];

/**
 * Statuts affichés dans le kanban (sans 'no-status' et 'unknown').
 */
export const KANBAN_STATUS_OPTIONS = [
  { value: '',             label: 'Autres' },
  { value: 'new',          label: 'Nouveau' },
  { value: 'to-study',     label: 'À étudier' },
  { value: 'to-spec',      label: 'À spécifier' },
  { value: 'todo',         label: 'À faire' },
  { value: 'in-progress',  label: 'En cours' },
  { value: 'rnd',          label: 'R&D' },
  { value: 'to-test',      label: 'À tester' },
  { value: 'testing',      label: 'En test' },
  { value: 'done',         label: 'Terminé' },
  { value: 'pending',      label: 'En attente' },
  { value: 'canceled',     label: 'Annulé' },
];

/**
 * Convertit un nom d'enum backend (ex: "IN_PROGRESS") vers la valeur frontend (ex: "in-progress").
 * Gère aussi les valeurs déjà au format frontend.
 * @param {string} status
 * @returns {string}
 */
export const normalizeStatusValue = (status) => {
  if (!status) return '';
  return status.toLowerCase().replace(/_/g, '-');
};

/**
 * Retourne les infos d'affichage d'un statut de tâche.
 * Accepte aussi bien le format backend (IN_PROGRESS) que frontend (in-progress).
 * @param {string|null|undefined} status
 * @returns {{ label: string, color: string, icon: React.ReactElement }}
 */
export const getTaskStatusInfo = (status) => {
  if (!status) {
    return { label: 'Aucun statut', color: 'default', icon: <CancelIcon fontSize="small" /> };
  }
  const normalized = normalizeStatusValue(status);
  return (
    TASK_STATUS_OPTIONS.find((opt) => opt.value === normalized) || {
      label: status,
      color: 'default',
      icon: <AssignmentIcon fontSize="small" />,
    }
  );
};

/**
 * Valeur initiale vide pour le formulaire de création/édition de tâche.
 * Note: le champ date d'échéance s'appelle "dueDate" (aligné avec le backend).
 */
export const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  projectId: '',
  status: 'todo',
  estimate: '',
  trackingReference: '',
  plannedStart: '',
  dueDate: '',
  assignees: [],
  comments: [],
  links: [],
};

export const ISSUE_TYPE_CONFIG = {
  BUG:             { label: 'Bug',           color: 'error',   icon: 'bug' },
  REGRESSION:      { label: 'Régression',    color: 'error',   icon: 'regression' },
  VULNERABILITY:   { label: 'Vulnérabilité', color: 'error',   icon: 'security' },
  INCIDENT:        { label: 'Incident',      color: 'warning', icon: 'incident' },
  PERFORMANCE:     { label: 'Performance',   color: 'warning', icon: 'performance' },
  FEATURE_REQUEST: { label: 'Feature',       color: 'info',    icon: 'feature' },
  IMPROVEMENT:     { label: 'Amélioration',  color: 'info',    icon: 'improvement' },
  QUESTION:        { label: 'Question',      color: 'default', icon: 'question' },
  SUPPORT:         { label: 'Support',       color: 'default', icon: 'support' },
};

export const ISSUE_SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critique', color: 'error',   rank: 4 },
  HIGH:     { label: 'Haute',    color: 'warning', rank: 3 },
  MEDIUM:   { label: 'Moyenne',  color: 'info',    rank: 2 },
  LOW:      { label: 'Basse',    color: 'default', rank: 1 },
  INFO:     { label: 'Info',     color: 'default', rank: 0 },
};

export const isIssue = (task) => task?.entityType === 'ISSUE';
