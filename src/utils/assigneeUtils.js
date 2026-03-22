/**
 * Utilitaires pour la gestion des assignés de tâches.
 * Le backend stocke les assignés sous forme de chaîne CSV (ex: "alice@x.com,bob@x.com").
 * Le frontend travaille avec des tableaux de strings.
 */

/**
 * Convertit une chaîne CSV d'emails en tableau.
 * @param {string|null|undefined} assigneeString - ex: "alice@x.com,bob@x.com"
 * @returns {string[]}
 */
export const assigneeToArray = (assigneeString) => {
  if (!assigneeString) return [];
  return assigneeString.split(',').map((e) => e.trim()).filter((e) => e);
};

/**
 * Convertit un tableau d'emails en chaîne CSV pour le backend.
 * @param {string[]} assigneesArray
 * @returns {string}
 */
export const arrayToAssignee = (assigneesArray) => {
  if (!assigneesArray || assigneesArray.length === 0) return '';
  return assigneesArray.join(',');
};

/**
 * Résout les emails d'assignés en noms complets via la liste de personnes.
 * Retourne l'email si la personne n'est pas trouvée.
 * @param {string[]} emails
 * @param {Array<{email: string, firstName: string, lastName: string}>} persons
 * @returns {string[]}
 */
export const resolveAssigneeNames = (emails, persons) => {
  if (!emails || emails.length === 0) return [];
  return emails
    .map((email) => {
      const person = persons.find((p) => p.email === email);
      if (!person) return email;
      return [person.firstName, person.lastName].filter(Boolean).join(' ');
    })
    .filter(Boolean);
};
