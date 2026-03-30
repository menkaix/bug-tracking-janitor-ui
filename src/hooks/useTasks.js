import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import taskService from '../services/task.service';
import issueService from '../services/issue.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import backlogService from '../services/backlog.service';
import { EMPTY_TASK_FORM, isIssue, normalizeStatusValue } from '../models/task.model';
import { toDateInputValue, fromDateInputValue } from '../utils/dateUtils';
import { useConfirm } from './useConfirm';

// ─── localStorage preferences ────────────────────────────────────────────────

const STORAGE_KEY = 'tasksPagePreferences';

const loadPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const savePreferences = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // silent
  }
};

// ─── Fetcher React Query (fonction pure, pas de hooks) ───────────────────────

const applyClientFilters = (tasks, { searchTerm, statusFilter, assigneeFilter }) => {
  let filtered = tasks;
  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.title || '').toLowerCase().includes(lower) ||
        (t.description || '').toLowerCase().includes(lower) ||
        (t.trackingReference || '').toLowerCase().includes(lower)
    );
  }
  if (statusFilter.length > 0) {
    const hasNoStatus = statusFilter.includes('no-status');
    const realStatuses = statusFilter.filter((s) => s !== 'no-status');
    filtered = filtered.filter(
      (t) => (hasNoStatus && (!t.status || t.status === '')) || realStatuses.includes(t.status)
    );
  }
  if (assigneeFilter.length > 0) {
    filtered = filtered.filter((t) => assigneeFilter.some((e) => (t.assignees || []).includes(e)));
  }
  return filtered;
};

const deduplicateTasks = (tasks) => Array.from(new Map(tasks.map((t) => [t.id, t])).values());

const paginateClientSide = (tasks, { currentPage, pageSize, isKanbanMode }) => {
  const total = tasks.length;
  if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
  const totalPages = Math.ceil(total / pageSize);
  return {
    tasks: tasks.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    pagination: { currentPage, totalPages, totalElements: total, size: pageSize },
  };
};

export const fetchTasksData = async ({ page, size, statusFilter, projectFilter, assigneeFilter, searchTerm, viewMode }) => {
  const isKanbanMode = viewMode === 1;
  const currentPage = isKanbanMode ? 0 : page;

  // Aucun projet sélectionné → liste vide
  if (!projectFilter || projectFilter.length === 0) {
    return { tasks: [], pagination: { currentPage: 0, totalPages: 0, totalElements: 0, size }, noProjectSelected: true };
  }

  // Fetch par projet(s) en parallèle via l'endpoint dédié
  const results = await Promise.all(projectFilter.map((ref) => taskService.getTasksByProjectRef(ref)));
  if (!results.every((r) => r.success)) throw new Error('Impossible de charger les tâches');

  const allTasks = deduplicateTasks(results.flatMap((r) => r.data));
  const filtered = applyClientFilters(allTasks, { searchTerm, statusFilter, assigneeFilter });
  return paginateClientSide(filtered, { currentPage, pageSize: isKanbanMode ? filtered.length : size, isKanbanMode });
};

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * Controller hook pour la page Tâches.
 * Toutes les mutations utilisent useMutation pour un état isPending cohérent.
 */
export const useTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const saved = loadPreferences();

  // ── Filtres ──
  const [searchTerm, setSearchTerm] = useState(saved?.searchTerm || '');
  const [projectFilter, setProjectFilter] = useState(() => {
    const param = searchParams.get('projectId');
    if (param) return param.split(',').map((s) => s.trim()).filter(Boolean);
    const savedVal = saved?.projectFilter;
    return Array.isArray(savedVal) ? savedVal : [];
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    const param = searchParams.get('status');
    if (param) return param.split(',').map((s) => s.trim()).filter(Boolean);
    return saved?.statusFilter || [];
  });
  const [assigneeFilter, setAssigneeFilter] = useState(() => {
    const param = searchParams.get('assignee');
    if (param) return param.split(',').map((a) => a.trim()).filter(Boolean);
    return saved?.assigneeFilter || [];
  });

  // ── Vue & pagination ──
  const [viewMode, setViewMode] = useState(saved?.viewMode ?? 0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(saved?.pageSize || 10);

  // ── Formulaire / modales ──
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_TASK_FORM });

  // ── Sélection ──
  const [selectedTasks, setSelectedTasks] = useState([]);

  // ── Debounce recherche ──
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, projectFilter, assigneeFilter, viewMode]);

  useEffect(() => {
    savePreferences({ viewMode, searchTerm, projectFilter, statusFilter, assigneeFilter });
  }, [viewMode, searchTerm, projectFilter, statusFilter, assigneeFilter]);

  // ── Queries ──
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const r = await projectService.getAllProjects(0, 100);
      if (!r.success) throw new Error('Impossible de charger les projets');
      return r.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const projects = projectsData || [];

  const { data: personsData } = useQuery({
    queryKey: ['persons'],
    queryFn: async () => {
      const r = await personService.getAllPersons(0, 1000);
      if (!r.success) throw new Error('Impossible de charger les personnes');
      return r.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const persons = personsData || [];

  const taskQueryParams = useMemo(
    () => ({ page: currentPage, size: pageSize, statusFilter, projectFilter, assigneeFilter, searchTerm: debouncedSearchTerm, viewMode }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, pageSize, statusFilter, projectFilter, assigneeFilter, debouncedSearchTerm, viewMode]
  );

  const { data: tasksQueryData, isLoading, isFetching, isError, error: tasksError } = useQuery({
    queryKey: ['tasks', taskQueryParams],
    queryFn: () => fetchTasksData(taskQueryParams),
    placeholderData: keepPreviousData,
  });

  const tasks = tasksQueryData?.tasks || [];
  const pagination = tasksQueryData?.pagination || { currentPage: 0, totalPages: 0, totalElements: 0, size: pageSize };

  // ── Mutations ────────────────────────────────────────────────────────────────

  // Changement de statut — mise à jour optimiste
  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus, entityType }) =>
      entityType === 'ISSUE'
        ? issueService.updateIssueStatus(taskId, newStatus)
        : taskService.updateTaskStatus(taskId, newStatus),
    onMutate: async ({ taskId, newStatus, currentQueryKey }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(currentQueryKey);
      queryClient.setQueryData(currentQueryKey, (old) => ({
        ...old,
        tasks: (old?.tasks || []).map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      }));
      return { previous, currentQueryKey };
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(context.currentQueryKey, context.previous);
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { variant: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Édition inline (projet, assignés) — mise à jour optimiste partagée
  const inlineEditMutation = useMutation({
    mutationFn: ({ taskId, fullTask }) => {
      const item = tasks.find((t) => t.id === taskId);
      return item?.entityType === 'ISSUE'
        ? issueService.updateIssue(taskId, fullTask)
        : taskService.updateTask(taskId, fullTask);
    },
    onMutate: async ({ taskId, partialUpdate, currentQueryKey }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(currentQueryKey);
      queryClient.setQueryData(currentQueryKey, (old) =>
        old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, ...partialUpdate } : t)) } : old
      );
      return { previous, currentQueryKey };
    },
    onError: (_, vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.currentQueryKey, context.previous);
      enqueueSnackbar(vars.errorMessage || 'Erreur lors de la mise à jour', { variant: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Suppression d'une tâche ou d'une issue
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      const item = tasks.find((t) => t.id === id);
      return item?.entityType === 'ISSUE'
        ? issueService.deleteIssue(id)
        : taskService.deleteTask(id);
    },
    onSuccess: () => {
      if (tasks.length === 1 && currentPage > 0) setCurrentPage((p) => p - 1);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression de la tâche', { variant: 'error' }),
  });

  // Création / mise à jour d'une tâche ou d'une issue (formulaire)
  const saveMutation = useMutation({
    mutationFn: async ({ id, taskData, comments, links }) => {
      const isIssueItem = editingTask?.entityType === 'ISSUE';
      let result;
      if (id) {
        result = isIssueItem
          ? await issueService.updateIssue(id, taskData)
          : await taskService.updateTask(id, taskData);
        if (result.success && !isIssueItem) {
          await backlogService.patchEntity('tasks', id, { comments, links });
        }
      } else {
        result = await taskService.createTask(taskData);
      }
      if (!result.success) throw new Error('Erreur lors de la sauvegarde');
      return result.data;
    },
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la sauvegarde de la tâche', { variant: 'error' }),
  });

  // Suppression en masse
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map((id) => taskService.deleteTask(id))),
    onSuccess: () => {
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression en masse', { variant: 'error' }),
  });

  // Changement de statut en masse
  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, newStatus }) =>
      Promise.all(ids.map((id) => {
        const task = tasks.find((t) => t.id === id);
        return task?.entityType === 'ISSUE'
          ? issueService.updateIssueStatus(id, newStatus)
          : taskService.updateTaskStatus(id, newStatus);
      })),
    onSuccess: () => {
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la mise à jour en masse', { variant: 'error' }),
  });

  // Assignation en masse
  const bulkAssignMutation = useMutation({
    mutationFn: ({ ids, email, currentTasks }) =>
      Promise.all(
        ids.map((id) => {
          const task = currentTasks.find((t) => t.id === id);
          if (task) {
            const current = task.assignees || [];
            if (!current.includes(email)) {
              const updated = { ...task, assignees: [...current, email] };
              return task.entityType === 'ISSUE'
                ? issueService.updateIssue(id, updated)
                : taskService.updateTask(id, updated);
            }
          }
        })
      ),
    onSuccess: () => {
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => enqueueSnackbar("Erreur lors de l'assignation en masse", { variant: 'error' }),
  });

  // ── Helper ───────────────────────────────────────────────────────────────────

  const optimisticTaskUpdate = (taskId, updater) => {
    const qk = ['tasks', taskQueryParams];
    queryClient.setQueryData(qk, (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? updater(t) : t)) } : old
    );
    return qk;
  };

  // ── URL sync ─────────────────────────────────────────────────────────────────

  const updateURLWithFilters = (statuses, projects, assignees) => {
    const params = {};
    if (statuses.length > 0) params.status = statuses.join(',');
    if (projects?.length > 0) params.projectId = projects.join(',');
    if (assignees?.length > 0) params.assignee = assignees.join(',');
    setSearchParams(params);
  };

  // ── Handlers filtres ─────────────────────────────────────────────────────────

  const toggleStatusFilter = (statusValue) => {
    setStatusFilter((prev) => {
      const next = prev.includes(statusValue) ? prev.filter((s) => s !== statusValue) : [...prev, statusValue];
      updateURLWithFilters(next, projectFilter, assigneeFilter);
      return next;
    });
  };

  const clearStatusFilter = () => {
    setStatusFilter([]);
    updateURLWithFilters([], projectFilter, assigneeFilter);
  };

  const toggleAssigneeFilter = (email) => {
    setAssigneeFilter((prev) => {
      const next = prev.includes(email) ? prev.filter((a) => a !== email) : [...prev, email];
      updateURLWithFilters(statusFilter, projectFilter, next);
      return next;
    });
  };

  const clearAssigneeFilter = () => {
    setAssigneeFilter([]);
    updateURLWithFilters(statusFilter, projectFilter, []);
  };

  const toggleProjectFilter = (projectId) => {
    setProjectFilter((prev) => {
      const next = prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId];
      updateURLWithFilters(statusFilter, next, assigneeFilter);
      return next;
    });
  };

  const clearProjectFilter = () => {
    setProjectFilter([]);
    updateURLWithFilters(statusFilter, [], assigneeFilter);
  };

  // ── Pagination ───────────────────────────────────────────────────────────────

  const handlePageChange = (page) => {
    if (page < 0) return;
    if (pagination.totalPages > 0 && page >= pagination.totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // ── Sélection ────────────────────────────────────────────────────────────────

  const isSelected = (id) => selectedTasks.includes(id);

  const handleSelectAll = (event) => {
    setSelectedTasks(event.target.checked ? tasks.map((t) => t.id) : []);
  };

  const handleSelectTask = (event, id) => {
    const idx = selectedTasks.indexOf(id);
    if (idx === -1) {
      setSelectedTasks([...selectedTasks, id]);
    } else {
      setSelectedTasks(selectedTasks.filter((sid) => sid !== id));
    }
  };

  // ── Handlers CRUD ────────────────────────────────────────────────────────────

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    statusMutation.mutate({
      taskId,
      newStatus,
      entityType: task?.entityType || 'TASK',
      currentQueryKey: ['tasks', taskQueryParams],
    });
  };

  const handleProjectChange = (taskId, newProjectId) => {
    const task = tasks.find((t) => t.id === taskId);
    inlineEditMutation.mutate({
      taskId,
      fullTask: { ...task, projectId: newProjectId },
      partialUpdate: { projectId: newProjectId },
      errorMessage: 'Erreur lors de la mise à jour du projet',
      currentQueryKey: ['tasks', taskQueryParams],
    });
  };

  const handleAddAssignee = (taskId, email) => {
    const task = tasks.find((t) => t.id === taskId);
    const current = task.assignees || [];
    if (current.includes(email)) return;
    const newAssignees = [...current, email];
    inlineEditMutation.mutate({
      taskId,
      fullTask: { ...task, assignees: newAssignees },
      partialUpdate: { assignees: newAssignees },
      errorMessage: "Erreur lors de l'assignation",
      currentQueryKey: ['tasks', taskQueryParams],
    });
  };

  const handleRemoveAssignee = (taskId, email) => {
    const task = tasks.find((t) => t.id === taskId);
    const newAssignees = (task.assignees || []).filter((e) => e !== email);
    inlineEditMutation.mutate({
      taskId,
      fullTask: { ...task, assignees: newAssignees },
      partialUpdate: { assignees: newAssignees },
      errorMessage: 'Erreur lors de la désassignation',
      currentQueryKey: ['tasks', taskQueryParams],
    });
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({ ...EMPTY_TASK_FORM });
    setShowModal(true);
  };

  const handleEditTask = async (task) => {
    setEditingTask(task);
    setFormData({
      ...EMPTY_TASK_FORM,
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId || '',
      status: isIssue(task) ? (task.status || 'OPEN') : (normalizeStatusValue(task.status) || 'todo'),
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: toDateInputValue(task.plannedStart),
      dueDate: toDateInputValue(task.dueDate),
      assignees: task.assignees || [],
    });
    setShowModal(true);
    const result = isIssue(task)
      ? await issueService.getIssueById(task.id)
      : await backlogService.getEntity('tasks', task.id);
    if (result.success) {
      setFormData((prev) => ({ ...prev, comments: result.data.comments || [], links: result.data.links || [] }));
    }
  };

  const handleDeleteTask = async (id) => {
    const ok = await confirm({
      title: 'Supprimer la tâche ?',
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const taskData = {
      ...formData,
      plannedStart: fromDateInputValue(formData.plannedStart),
      dueDate: fromDateInputValue(formData.dueDate),
    };
    saveMutation.mutate({
      id: editingTask?.id,
      taskData,
      comments: formData.comments,
      links: formData.links,
    });
  };

  const handleAssigneeToggle = (email) => {
    setFormData((prev) => {
      const current = prev.assignees || [];
      const next = current.includes(email) ? current.filter((e) => e !== email) : [...current, email];
      return { ...prev, assignees: next };
    });
  };

  // ── Handlers bulk ────────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: `Supprimer ${selectedTasks.length} tâche(s) ?`,
      description: 'Cette action est irréversible. Toutes les tâches sélectionnées seront supprimées.',
      confirmLabel: 'Tout supprimer',
    });
    if (!ok) return;
    bulkDeleteMutation.mutate(selectedTasks);
  };

  const handleBulkStatusChange = (newStatus) => {
    if (!newStatus) return;
    bulkStatusMutation.mutate({ ids: selectedTasks, newStatus, currentTasks: tasks });
  };

  const handleBulkAssign = (email) => {
    if (!email) return;
    bulkAssignMutation.mutate({ ids: selectedTasks, email, currentTasks: tasks });
  };

  return {
    // Data
    tasks,
    projects,
    persons,
    pagination,
    taskQueryParams,

    // Query state
    isLoading,
    isFetching,
    isError,
    tasksError,

    // Mutation state (pour spinners)
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkPending: bulkDeleteMutation.isPending || bulkStatusMutation.isPending || bulkAssignMutation.isPending,

    // Filters state
    searchTerm, setSearchTerm,
    projectFilter, toggleProjectFilter, clearProjectFilter,
    statusFilter, toggleStatusFilter, clearStatusFilter,
    assigneeFilter, toggleAssigneeFilter, clearAssigneeFilter,
    noProjectSelected: projectFilter.length === 0,

    // View & pagination
    viewMode, setViewMode,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,

    // Form / modal
    showModal, setShowModal,
    editingTask,
    formData, setFormData,
    handleAssigneeToggle,

    // CRUD
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleSubmit,
    handleStatusChange,
    handleProjectChange,
    handleAddAssignee,
    handleRemoveAssignee,

    // Selection
    selectedTasks, setSelectedTasks,
    isSelected,
    handleSelectAll,
    handleSelectTask,

    // Bulk
    handleBulkDelete,
    handleBulkStatusChange,
    handleBulkAssign,
  };
};
