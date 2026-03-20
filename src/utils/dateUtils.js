import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Formate une date ISO en "dd/MM/yyyy".
 * Retourne '-' si la date est absente ou invalide.
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

/**
 * Formate une date ISO en "dd MMM yyyy" (ex: "15 jan. 2025") avec la locale fr.
 * Retourne null si la date est absente ou invalide.
 * @param {string|null|undefined} dateString
 * @returns {string|null}
 */
export const formatDateLong = (dateString) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch {
    return null;
  }
};

/**
 * Formate une date ISO en "dd/MM/yyyy HH:mm" avec la locale fr.
 * Retourne '' si la date est absente ou invalide.
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return '';
  }
};

/**
 * Convertit une date ISO en valeur "yyyy-MM-dd" pour un input[type=date].
 * Retourne '' si la date est absente.
 * @param {string|null|undefined} dateString
 * @returns {string}
 */
export const toDateInputValue = (dateString) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

/**
 * Convertit une valeur "yyyy-MM-dd" en ISO string.
 * Retourne null si la valeur est absente.
 * @param {string} dateInput
 * @returns {string|null}
 */
export const fromDateInputValue = (dateInput) => {
  if (!dateInput) return null;
  return new Date(dateInput).toISOString();
};
