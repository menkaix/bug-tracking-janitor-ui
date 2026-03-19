import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import backlogService from '../services/backlog.service';
import { EMPTY_TASK_FORM } from '../models/task.model';
import { assigneeToArray, arrayToAssignee } from '../utils/assigneeUtils';
import { toDateInputValue, fromDateInputValue } from '../utils/dateUtils';

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

export const fetchTasksData = async ({ page, size, statusFilter, projectFilter, assigneeFilter, searchTerm, viewMode }) => {
  const isKanbanMode = viewMode === 1;
  const pageSize = isKanbanMode ? 1000 : size;
  const currentPage = isKanbanMode ? 0 : page;

  if (statusFilter.length > 0) {
    const hasNoStatus = statusFilter.includes('no-status');
    const realStatuses = statusFilter.filter((s) => s !== 'no-status');
    const results = await Promise.all(
      realStatuses.map((status) => taskService.getAllTasks(0, 1000, searchTerm, `status:${status}`))
    );
    if (!results.every((r) => r.success)) throw new Error('Impossible de charger les tâches');

    let allTasks = results.flatMap((r) => r.data.content || []);

    if (hasNoStatus) {
      const allResult = await taskService.getAllTasks(0, 1000, searchTerm, '');
      if (allResult.success) {
        const noStatus = (allResult.data.content || []).filter((t) => !t.status || t.status === '');
        allTasks = [...allTasks, ...noStatus];
      }
    }

    let unique = Array.from(new Map(allTasks.map((t) => [t.id, t])).values());
    if (projectFilter) {
      unique =
        projectFilter === 'no-project'
          ? unique.filter((t) => !t.projectId || t.projectId === '')
          : unique.filter((t) => t.projectId === projectFilter);
    }
    if (assigneeFilter.length > 0) {
      unique = unique.filter((t) => assigneeFilter.some((e) => assigneeToArray(t.assignee).includes(e)));
    }

    const total = unique.length;
    if (isKanbanMode) return { tasks: unique, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return {
      tasks: unique.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
      pagination: { currentPage, totalPages, totalElements: total, size: pageSize },
    };
  }

  if (projectFilter === 'no-project') {
    const result = await taskService.getAllTasks(0, 1000, searchTerm, '');
    if (!result.success) throw new Error(result.error || 'Impossible de charger les tâches');
    let tasks = (result.data.content || []).filter((t) => !t.projectId || t.projectId === '');
    if (assigneeFilter.length > 0) {
      tasks = tasks.filter((t) => assigneeFilter.some((e) => assigneeToArray(t.assignee).includes(e)));
    }
    const total = tasks.length;
    if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return {
      tasks: tasks.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
      pagination: { currentPage, totalPages, totalElements: total, size: pageSize },
    };
  }

  const filter = projectFilter ? `projectId:${projectFilter}` : '';

  if (assigneeFilter.length > 0) {
    const result = await taskService.getAllTasks(0, 1000, searchTerm, filter);
    if (!result.success) throw new Error(result.error || 'Impossible de charger les tâches');
    const tasks = (result.data.content || []).filter((t) =>
      assigneeFilter.some((e) => assigneeToArray(t.assignee).includes(e))
    );
    const total = tasks.length;
    if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return {
      tasks: tasks.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
      pagination: { currentPage, totalPages, totalElements: total, size: pageSize },
    };
  }

  const result = await taskService.getAllTasks(currentPage, pageSize, searchTerm, filter);
  if (!result.success) throw new Error(result.error || 'Impossible de charger les tâches');
  const data = result.data;
  const tasks = data.content || [];
  if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: tasks.length, size: tasks.length } };
  return {
    tasks,
    pagination: {
      currentPage: data.number ?? data.currentPage ?? currentPage,
      totalPages: data.totalPages ?? 0,
      totalElements: data.totalElements ?? 0,
      size: data.size ?? pageSize,
    },
  };
};

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * Controller hook pour la page Tâches.
 * Encapsule toute la logique : état, filtres, pagination, mutations CRUD et bulk.
 */
export const useTasks = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const saved = loadPreferences();

  // ── Filtres ──
  const [searchTerm, setSearchTerm] = useState(saved?.searchTerm || '');
  const [projectFilter, setProjectFilter] = useState(searchParams.get('projectId') || saved?.projectFilter || '');
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
  const [viewMode, setViewMode] = useState(saved?.viewMode ?? 0); // 0 = Liste, 1 = Kanban
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(saved?.pageSize || 10);

  // ── Formulaire / modales ──
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_TASK_FORM });

  // ── Sélection ──
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [, setBulkLoading] = useState(false);

  // ── Debounce recherche ──
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Réinitialiser la page sur changement de filtre
  useEffect(() => {
    setCurrentPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, projectFilter, assigneeFilter, viewMode]);

  // Persister préférences
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

  // ── Mutation statut (optimiste) ──
  const statusMutation = useMutation({
    mutationFn: ({ taskId, task, newStatus }) => taskService.updateTask(taskId, { ...task, status: newStatus }),
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

  // ── Helper mise à jour optimiste ──
  const optimisticTaskUpdate = (taskId, updater) => {
    const qk = ['tasks', taskQueryParams];
    queryClient.setQueryData(qk, (old) =>
      old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? updater(t) : t)) } : old
    );
    return qk;
  };

  // ── URL sync ──
  const updateURLWithFilters = (statuses, project, assignees) => {
    const params = {};
    if (statuses.length > 0) params.status = statuses.join(',');
    if (project) params.projectId = project;
    if (assignees?.length > 0) params.assignee = assignees.join(',');
    setSearchParams(params);
  };

  // ── Handlers filtres ──
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

  const handleProjectFilterChange = (newProjectId) => {
    setProjectFilter(newProjectId);
    updateURLWithFilters(statusFilter, newProjectId, assigneeFilter);
  };

  // ── Pagination ──
  const handlePageChange = (page) => {
    if (page < 0) return;
    if (pagination.totalPages > 0 && page >= pagination.totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  // ── Sélection ──
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

  // ── CRUD tâches ──
  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    statusMutation.mutate({ taskId, task, newStatus, currentQueryKey: ['tasks', taskQueryParams] });
  };

  const handleProjectChange = async (taskId, newProjectId) => {
    const task = tasks.find((t) => t.id === taskId);
    const qk = optimisticTaskUpdate(taskId, (t) => ({ ...t, projectId: newProjectId }));
    const result = await taskService.updateTask(taskId, { ...task, projectId: newProjectId });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) =>
        old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, projectId: task.projectId } : t)) } : old
      );
      enqueueSnackbar('Erreur lors de la mise à jour du projet', { variant: 'error' });
    }
  };

  const handleAddAssignee = async (taskId, email) => {
    const task = tasks.find((t) => t.id === taskId);
    const current = assigneeToArray(task.assignee);
    if (current.includes(email)) return;
    const newStr = arrayToAssignee([...current, email]);
    const qk = optimisticTaskUpdate(taskId, (t) => ({ ...t, assignee: newStr }));
    const result = await taskService.updateTask(taskId, { ...task, assignee: newStr });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) =>
        old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, assignee: task.assignee } : t)) } : old
      );
      enqueueSnackbar("Erreur lors de l'assignation", { variant: 'error' });
    }
  };

  const handleRemoveAssignee = async (taskId, email) => {
    const task = tasks.find((t) => t.id === taskId);
    const newStr = arrayToAssignee(assigneeToArray(task.assignee).filter((e) => e !== email));
    const qk = optimisticTaskUpdate(taskId, (t) => ({ ...t, assignee: newStr }));
    const result = await taskService.updateTask(taskId, { ...task, assignee: newStr });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) =>
        old ? { ...old, tasks: old.tasks.map((t) => (t.id === taskId ? { ...t, assignee: task.assignee } : t)) } : old
      );
      enqueueSnackbar('Erreur lors de la désassignation', { variant: 'error' });
    }
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
      status: task.status || 'todo',
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: toDateInputValue(task.plannedStart),
      deadLine: toDateInputValue(task.deadLine),
      assignees: assigneeToArray(task.assignee),
    });
    setShowModal(true);
    const result = await backlogService.getEntity('tasks', task.id);
    if (result.success) {
      setFormData((prev) => ({ ...prev, comments: result.data.comments || [], links: result.data.links || [] }));
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    const result = await taskService.deleteTask(id);
    if (result.success) {
      if (tasks.length === 1 && currentPage > 0) setCurrentPage((p) => p - 1);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } else {
      enqueueSnackbar('Erreur lors de la suppression de la tâche', { variant: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { assignees, ...rest } = formData;
    const taskData = {
      ...rest,
      assignee: arrayToAssignee(assignees),
      plannedStart: fromDateInputValue(formData.plannedStart),
      deadLine: fromDateInputValue(formData.deadLine),
    };

    let result;
    if (editingTask) {
      result = await taskService.updateTask(editingTask.id, taskData);
      if (result.success) {
        await backlogService.patchEntity('tasks', editingTask.id, {
          comments: formData.comments,
          links: formData.links,
        });
      }
    } else {
      result = await taskService.createTask(taskData);
    }

    if (result.success) {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } else {
      enqueueSnackbar('Erreur lors de la sauvegarde de la tâche', { variant: 'error' });
    }
  };

  const handleAssigneeToggle = (email) => {
    setFormData((prev) => {
      const current = prev.assignees || [];
      const next = current.includes(email) ? current.filter((e) => e !== email) : [...current, email];
      return { ...prev, assignees: next };
    });
  };

  // ── Bulk ──
  const handleBulkDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedTasks.length} tâches ?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedTasks.map((id) => taskService.deleteTask(id)));
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      enqueueSnackbar('Erreur lors de la suppression en masse', { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedTasks.map(async (id) => {
          const task = tasks.find((t) => t.id === id);
          if (task) return taskService.updateTask(id, { ...task, status: newStatus });
        })
      );
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      enqueueSnackbar('Erreur lors de la mise à jour en masse', { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAssign = async (email) => {
    if (!email) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        selectedTasks.map(async (id) => {
          const task = tasks.find((t) => t.id === id);
          if (task) {
            const current = assigneeToArray(task.assignee);
            if (!current.includes(email)) {
              return taskService.updateTask(id, { ...task, assignee: arrayToAssignee([...current, email]) });
            }
          }
        })
      );
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      enqueueSnackbar("Erreur lors de l'assignation en masse", { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
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

    // Filters state
    searchTerm, setSearchTerm,
    projectFilter, handleProjectFilterChange,
    statusFilter, toggleStatusFilter, clearStatusFilter,
    assigneeFilter, toggleAssigneeFilter, clearAssigneeFilter,

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
