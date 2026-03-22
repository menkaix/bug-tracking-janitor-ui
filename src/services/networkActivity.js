/**
 * Store pub/sub module-level pour le suivi des activités réseau.
 * Utilisé par les intercepteurs Axios et consommé via useSyncExternalStore.
 */

let _activities = [];
let _nextId = 1;
const _listeners = new Set();

const notify = () => _listeners.forEach((fn) => fn());

export const networkActivityStore = {
  subscribe: (listener) => {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
  getSnapshot: () => _activities,

  /** Démarre le suivi d'une requête. Retourne l'id de l'activité. */
  start: (method, url) => {
    const id = _nextId++;
    const label = buildLabel(method, url);
    _activities = [
      ..._activities,
      { id, method, url, label, status: 'pending', startedAt: Date.now() },
    ];
    notify();
    return id;
  },

  /** Marque une activité comme terminée (success | error), puis la retire après 5s. */
  finish: (id, status /* 'success' | 'error' */) => {
    _activities = _activities.map((a) =>
      a.id === id ? { ...a, status, finishedAt: Date.now() } : a
    );
    notify();
    setTimeout(() => {
      _activities = _activities.filter((a) => a.id !== id);
      notify();
    }, 5000);
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────

const METHOD_LABELS = {
  GET: 'Récupération',
  POST: 'Création',
  PUT: 'Mise à jour',
  PATCH: 'Mise à jour',
  DELETE: 'Suppression',
};

/**
 * Extrait un nom d'entité lisible depuis l'URL.
 * Ex: /api/tasks/123/by-project-ref → "tasks"
 */
const extractEntity = (url) => {
  if (!url) return '';
  // Retire la base URL si présente
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  // Prend le premier segment non vide après /api/ ou directement
  const segments = path.split('/').filter(Boolean);
  // Ignore les segments "api", "v1", etc.
  const skip = new Set(['api', 'v1', 'v2']);
  const entity = segments.find((s) => !skip.has(s) && !/^\d+$/.test(s)) || '';
  return entity;
};

const buildLabel = (method, url) => {
  const verb = METHOD_LABELS[method?.toUpperCase()] || method;
  const entity = extractEntity(url);
  return entity ? `${verb} · ${entity}` : verb;
};
