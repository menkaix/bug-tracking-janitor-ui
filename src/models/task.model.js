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
} from '@mui/icons-material';

/**
 * Statuts de tâche reconnus par l'application.
 * Source unique de vérité pour TasksPage, KanbanBoard, filtres, etc.
 */
export const TASK_STATUS_OPTIONS = [
  { value: 'todo',        label: 'À faire',            color: 'secondary', icon: <AssignmentIcon fontSize="small" /> },
  { value: 'pending',     label: 'En attente',          color: 'warning',   icon: <PendingIcon fontSize="small" /> },
  { value: 'in-progress', label: 'En cours',            color: 'info',      icon: <ScheduleIcon fontSize="small" /> },
  { value: 'to-study',    label: 'À étudier',           color: 'default',   icon: <PsychologyIcon fontSize="small" /> },
  { value: 'done',        label: 'Terminé',             color: 'success',   icon: <CheckCircleIcon fontSize="small" /> },
  { value: 'to-test',     label: 'À tester',            color: 'info',      icon: <FactCheckIcon fontSize="small" /> },
  { value: 'testing',     label: 'En cours de test',    color: 'info',      icon: <ScienceIcon fontSize="small" /> },
  { value: 'canceled',    label: 'Annulé',              color: 'error',     icon: <BlockIcon fontSize="small" /> },
  { value: 'no-status',   label: 'Sans statut',         color: 'default',   icon: <RemoveDoneIcon fontSize="small" /> },
];

/**
 * Statuts affichés dans le kanban (sans "no-status" qui n'est pas une colonne).
 */
export const KANBAN_STATUS_OPTIONS = [
  { value: '',            label: 'Autres' },
  { value: 'to-study',    label: 'À étudier' },
  { value: 'todo',        label: 'À faire' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'to-test',     label: 'À tester' },
  { value: 'done',        label: 'Terminé' },
  { value: 'pending',     label: 'En attente' },
  { value: 'canceled',    label: 'Annulé' },
];

/**
 * Retourne les infos d'affichage d'un statut de tâche.
 * @param {string|null|undefined} status
 * @returns {{ label: string, color: string, icon: React.ReactElement }}
 */
export const getTaskStatusInfo = (status) => {
  if (!status) {
    return { label: 'Aucun statut', color: 'default', icon: <CancelIcon fontSize="small" /> };
  }
  return (
    TASK_STATUS_OPTIONS.find((opt) => opt.value === status.toLowerCase()) || {
      label: status,
      color: 'default',
      icon: <AssignmentIcon fontSize="small" />,
    }
  );
};

/**
 * Valeur initiale vide pour le formulaire de création/édition de tâche.
 */
export const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  projectId: '',
  status: 'todo',
  estimate: '',
  trackingReference: '',
  plannedStart: '',
  deadLine: '',
  assignees: [],
  comments: [],
  links: [],
};
