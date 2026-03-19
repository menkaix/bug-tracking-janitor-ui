import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation, keepPreviousData } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Stack,
  Menu,
  Checkbox,
  Tooltip,
  alpha,
  useTheme,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  Psychology as PsychologyIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  FactCheck as FactCheckIcon,
  Science as ScienceIcon,
  RemoveDone as RemoveDoneIcon,
  ViewList as ViewListIcon,
  ViewKanban as ViewKanbanIcon,
} from '@mui/icons-material';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import backlogService from '../services/backlog.service';
import ErrorMessage from '../components/Common/ErrorMessage';
import TaskListSkeleton, { KanbanBoardSkeleton } from '../components/Common/TaskSkeleton';
import Pagination from '../components/Common/Pagination';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import AbstractEntityEditor from '../components/Common/AbstractEntityEditor';
import { format } from 'date-fns';

/**
 * Récupère les tâches selon les filtres actifs. Fonction pure pour React Query.
 */
const _assigneeToArray = (s) => (s ? s.split(',').map(e => e.trim()).filter(e => e) : []);

const fetchTasksData = async ({ page, size, statusFilter, projectFilter, assigneeFilter, searchTerm, viewMode }) => {
  const isKanbanMode = viewMode === 1;
  const pageSize = isKanbanMode ? 1000 : size;
  const currentPage = isKanbanMode ? 0 : page;

  if (statusFilter.length > 0) {
    const hasNoStatus = statusFilter.includes('no-status');
    const realStatuses = statusFilter.filter(s => s !== 'no-status');
    const promises = realStatuses.map(status => taskService.getAllTasks(0, 1000, searchTerm, `status:${status}`));
    const results = await Promise.all(promises);
    if (!results.every(r => r.success)) throw new Error('Impossible de charger les tâches');

    let allTasks = results.flatMap(r => r.data.content || []);

    if (hasNoStatus) {
      const allResult = await taskService.getAllTasks(0, 1000, searchTerm, '');
      if (allResult.success) {
        const noStatus = (allResult.data.content || []).filter(t => !t.status || t.status === '');
        allTasks = [...allTasks, ...noStatus];
      }
    }

    let unique = Array.from(new Map(allTasks.map(t => [t.id, t])).values());
    if (projectFilter) {
      unique = projectFilter === 'no-project'
        ? unique.filter(t => !t.projectId || t.projectId === '')
        : unique.filter(t => t.projectId === projectFilter);
    }
    if (assigneeFilter.length > 0) {
      unique = unique.filter(t => assigneeFilter.some(e => _assigneeToArray(t.assignee).includes(e)));
    }

    const total = unique.length;
    if (isKanbanMode) return { tasks: unique, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return { tasks: unique.slice(currentPage * pageSize, (currentPage + 1) * pageSize), pagination: { currentPage, totalPages, totalElements: total, size: pageSize } };
  }

  if (projectFilter === 'no-project') {
    const result = await taskService.getAllTasks(0, 1000, searchTerm, '');
    if (!result.success) throw new Error(result.error || 'Impossible de charger les tâches');
    let tasks = (result.data.content || []).filter(t => !t.projectId || t.projectId === '');
    if (assigneeFilter.length > 0) {
      tasks = tasks.filter(t => assigneeFilter.some(e => _assigneeToArray(t.assignee).includes(e)));
    }
    const total = tasks.length;
    if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return { tasks: tasks.slice(currentPage * pageSize, (currentPage + 1) * pageSize), pagination: { currentPage, totalPages, totalElements: total, size: pageSize } };
  }

  const filter = projectFilter ? `projectId:${projectFilter}` : '';

  if (assigneeFilter.length > 0) {
    const result = await taskService.getAllTasks(0, 1000, searchTerm, filter);
    if (!result.success) throw new Error(result.error || 'Impossible de charger les tâches');
    let tasks = (result.data.content || []).filter(t => assigneeFilter.some(e => _assigneeToArray(t.assignee).includes(e)));
    const total = tasks.length;
    if (isKanbanMode) return { tasks, pagination: { currentPage: 0, totalPages: 1, totalElements: total, size: total } };
    const totalPages = Math.ceil(total / pageSize);
    return { tasks: tasks.slice(currentPage * pageSize, (currentPage + 1) * pageSize), pagination: { currentPage, totalPages, totalElements: total, size: pageSize } };
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

/**
 * Clé pour le localStorage
 */
const STORAGE_KEY = 'tasksPagePreferences';

/**
 * Charger les préférences depuis localStorage
 */
const loadPreferences = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error);
  }
  return null;
};

/**
 * Sauvegarder les préférences dans localStorage
 */
const savePreferences = (preferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
  }
};

/**
 * Page de gestion des tâches - Material UI 2025
 */
const TasksPage = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Charger les préférences sauvegardées
  const savedPreferences = loadPreferences();

  // Initialiser searchTerm depuis localStorage ou vide
  const [searchTerm, setSearchTerm] = useState(savedPreferences?.searchTerm || '');

  // Initialiser projectFilter depuis l'URL, sinon localStorage, sinon vide
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get('projectId') || savedPreferences?.projectFilter || ''
  );

  // Initialiser statusFilter depuis l'URL si présent, sinon localStorage
  const initialStatusFilter = () => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      return statusParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return savedPreferences?.statusFilter || [];
  };

  const [statusFilter, setStatusFilter] = useState(initialStatusFilter());
  const [statusFilterAnchorEl, setStatusFilterAnchorEl] = useState(null);

  // Initialiser assigneeFilter depuis l'URL si présent, sinon localStorage
  const initialAssigneeFilter = () => {
    const assigneeParam = searchParams.get('assignee');
    if (assigneeParam) {
      return assigneeParam.split(',').map(a => a.trim()).filter(a => a.length > 0);
    }
    return savedPreferences?.assigneeFilter || [];
  };

  const [assigneeFilter, setAssigneeFilter] = useState(initialAssigneeFilter());
  const [assigneeFilterAnchorEl, setAssigneeFilterAnchorEl] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  // Initialiser viewMode depuis localStorage ou mode Liste par défaut
  const [viewMode, setViewMode] = useState(savedPreferences?.viewMode ?? 0); // 0 = Liste, 1 = Kanban

  const [formData, setFormData] = useState({
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
  });

  // --- Pagination inputs (outputs viennent de la query) ---
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(savedPreferences?.pageSize || 10);
  const [, setBulkLoading] = useState(false);

  // Debounce de la recherche pour éviter des appels backend à chaque frappe
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, projectFilter, assigneeFilter, viewMode]);

  // --- Projets (cached 5 min — change rarement) ---
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

  // --- Personnes (cached 5 min — change rarement) ---
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

  // --- Tâches (re-fetch sur changement de filtre/page, avec cache par combinaison) ---
  const taskQueryParams = useMemo(() => ({
    page: currentPage, size: pageSize,
    statusFilter, projectFilter, assigneeFilter,
    searchTerm: debouncedSearchTerm, viewMode,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentPage, pageSize, statusFilter, projectFilter, assigneeFilter, debouncedSearchTerm, viewMode]);

  const { data: tasksQueryData, isLoading, isFetching, isError, error: tasksError } = useQuery({
    queryKey: ['tasks', taskQueryParams],
    queryFn: () => fetchTasksData(taskQueryParams),
    placeholderData: keepPreviousData, // garde l'ancien affichage pendant le chargement de la page suivante
  });

  const tasks = tasksQueryData?.tasks || [];
  const pagination = tasksQueryData?.pagination || { currentPage: 0, totalPages: 0, totalElements: 0, size: pageSize };

  // --- Mutation : changement de statut avec optimistic update ---
  const statusMutation = useMutation({
    mutationFn: ({ taskId, task, newStatus }) =>
      taskService.updateTask(taskId, { ...task, status: newStatus }),
    onMutate: async ({ taskId, newStatus, currentQueryKey }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(currentQueryKey);
      queryClient.setQueryData(currentQueryKey, (old) => ({
        ...old,
        tasks: (old?.tasks || []).map(t => t.id === taskId ? { ...t, status: newStatus } : t),
      }));
      return { previous, currentQueryKey };
    },
    onError: (_, __, context) => {
      if (context?.previous) queryClient.setQueryData(context.currentQueryKey, context.previous);
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { variant: 'error' });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Fonctions helper pour convertir assignee (backend) <-> assignees (frontend)
  const assigneeToArray = (assigneeString) => {
    if (!assigneeString) return [];
    return assigneeString.split(',').map(e => e.trim()).filter(e => e);
  };

  const arrayToAssignee = (assigneesArray) => {
    if (!assigneesArray || assigneesArray.length === 0) return '';
    return assigneesArray.join(',');
  };



  // Sauvegarder les préférences dans localStorage quand elles changent
  useEffect(() => {
    const preferences = {
      viewMode,
      searchTerm,
      projectFilter,
      statusFilter,
      assigneeFilter,
    };
    savePreferences(preferences);
  }, [viewMode, searchTerm, projectFilter, statusFilter, assigneeFilter]);

  const handlePageChange = (page) => {
    if (page < 0) return;
    if (pagination.totalPages > 0 && page >= pagination.totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
    // eslint-disable-next-line no-unused-expressions
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      projectId: '',
      status: 'todo',
      estimate: '',
      trackingReference: '',
      plannedStart: '',
      deadLine: '',
      assignees: [],
    });
    setShowModal(true);
  };

  const handleEditTask = async (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId || '',
      status: task.status || 'todo',
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: task.plannedStart ? task.plannedStart.split('T')[0] : '',
      deadLine: task.deadLine ? task.deadLine.split('T')[0] : '',
      assignees: assigneeToArray(task.assignee),
      comments: [],
      links: [],
    });
    setShowModal(true);
    // Charger les commentaires et liens
    const result = await backlogService.getEntity('tasks', task.id);
    if (result.success) {
      setFormData((prev) => ({
        ...prev,
        comments: result.data.comments || [],
        links: result.data.links || [],
      }));
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    const result = await taskService.deleteTask(id);
    if (result.success) {
      const willBeEmpty = tasks.length === 1;
      const notFirstPage = currentPage > 0;
      if (willBeEmpty && notFirstPage) setCurrentPage(p => p - 1);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } else {
      enqueueSnackbar('Erreur lors de la suppression de la tâche', { variant: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Préparer les données pour le backend
    const { assignees, ...restFormData } = formData;
    const taskData = {
      ...restFormData,
      assignee: arrayToAssignee(assignees), // Convertir array -> string
      plannedStart: formData.plannedStart ? new Date(formData.plannedStart).toISOString() : null,
      deadLine: formData.deadLine ? new Date(formData.deadLine).toISOString() : null,
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const statusOptions = [
    {
      value: 'todo',
      label: 'À faire',
      color: 'secondary',
      icon: <AssignmentIcon fontSize="small" />
    },
    {
      value: 'pending',
      label: 'En attente',
      color: 'warning',
      icon: <PendingIcon fontSize="small" />
    },
    {
      value: 'in-progress',
      label: 'En cours',
      color: 'info',
      icon: <ScheduleIcon fontSize="small" />
    },
    {
      value: 'to-study',
      label: 'À étudier',
      color: 'default',
      icon: <PsychologyIcon fontSize="small" />
    },
    {
      value: 'done',
      label: 'Terminé',
      color: 'success',
      icon: <CheckCircleIcon fontSize="small" />
    },
    {
      value: 'to-test',
      label: 'À tester',
      color: 'info',
      icon: <FactCheckIcon fontSize="small" />
    },
    {
      value: 'testing',
      label: 'En cours de test',
      color: 'info',
      icon: <ScienceIcon fontSize="small" />
    },
    {
      value: 'canceled',
      label: 'Annulé',
      color: 'error',
      icon: <BlockIcon fontSize="small" />
    },
    {
      value: 'no-status',
      label: 'Sans statut',
      color: 'default',
      icon: <RemoveDoneIcon fontSize="small" />
    },
  ];

  const getStatusInfo = (status) => {
    if (!status) {
      return {
        label: 'Aucun statut',
        color: 'default',
        icon: <CancelIcon fontSize="small" />
      };
    }
    return statusOptions.find(opt => opt.value === status.toLowerCase()) || {
      label: status,
      color: 'default',
      icon: <AssignmentIcon fontSize="small" />
    };
  };

  // Helper pour mise à jour optimiste du cache de tâches
  const optimisticTaskUpdate = (taskId, updater) => {
    const qk = ['tasks', taskQueryParams];
    queryClient.setQueryData(qk, (old) => old
      ? { ...old, tasks: old.tasks.map(t => t.id === taskId ? updater(t) : t) }
      : old
    );
    return qk;
  };

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    statusMutation.mutate({ taskId, task, newStatus, currentQueryKey: ['tasks', taskQueryParams] });
  };

  const handleProjectChange = async (taskId, newProjectId) => {
    const task = tasks.find(t => t.id === taskId);
    const qk = optimisticTaskUpdate(taskId, t => ({ ...t, projectId: newProjectId }));
    const result = await taskService.updateTask(taskId, { ...task, projectId: newProjectId });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) => old
        ? { ...old, tasks: old.tasks.map(t => t.id === taskId ? { ...t, projectId: task.projectId } : t) }
        : old
      );
      enqueueSnackbar('Erreur lors de la mise à jour du projet', { variant: 'error' });
    }
  };

  // Fonction helper pour obtenir les prénoms des assignés depuis leurs emails
  const getAssigneesNames = (assignees) => {
    if (!assignees || assignees.length === 0) return [];
    return assignees
      .map(email => {
        const person = persons.find(p => p.email === email);
        return person ? person.firstName : email;
      })
      .filter(name => name);
  };

  // Fonction pour ajouter un assigné à une tâche
  const handleAddAssignee = async (taskId, email) => {
    const task = tasks.find(t => t.id === taskId);
    const currentAssignees = assigneeToArray(task.assignee);
    if (currentAssignees.includes(email)) return;
    const newAssignees = [...currentAssignees, email];
    const newAssigneeStr = arrayToAssignee(newAssignees);
    const qk = optimisticTaskUpdate(taskId, t => ({ ...t, assignee: newAssigneeStr }));
    const result = await taskService.updateTask(taskId, { ...task, assignee: newAssigneeStr });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) => old
        ? { ...old, tasks: old.tasks.map(t => t.id === taskId ? { ...t, assignee: task.assignee } : t) }
        : old
      );
      enqueueSnackbar('Erreur lors de l\'assignation', { variant: 'error' });
    }
  };

  // Fonction pour retirer un assigné d'une tâche
  const handleRemoveAssignee = async (taskId, email) => {
    const task = tasks.find(t => t.id === taskId);
    const newAssignees = assigneeToArray(task.assignee).filter(e => e !== email);
    const newAssigneeStr = arrayToAssignee(newAssignees);
    const qk = optimisticTaskUpdate(taskId, t => ({ ...t, assignee: newAssigneeStr }));
    const result = await taskService.updateTask(taskId, { ...task, assignee: newAssigneeStr });
    if (!result.success) {
      queryClient.setQueryData(qk, (old) => old
        ? { ...old, tasks: old.tasks.map(t => t.id === taskId ? { ...t, assignee: task.assignee } : t) }
        : old
      );
      enqueueSnackbar('Erreur lors de la désassignation', { variant: 'error' });
    }
  };

  // Fonction pour gérer le changement d'assignés dans le formulaire
  const handleAssigneeToggle = (email) => {
    setFormData(prev => {
      const currentAssignees = prev.assignees || [];
      const newAssignees = currentAssignees.includes(email)
        ? currentAssignees.filter(e => e !== email)
        : [...currentAssignees, email];
      return { ...prev, assignees: newAssignees };
    });
  };

  const toggleStatusFilter = (statusValue) => {
    console.log('toggleStatusFilter called with:', statusValue);
    setStatusFilter(prev => {
      const newFilter = prev.includes(statusValue)
        ? prev.filter(s => s !== statusValue)
        : [...prev, statusValue];
      console.log('New statusFilter:', newFilter);

      // Mettre à jour l'URL
      updateURLWithFilters(newFilter, projectFilter, assigneeFilter);

      return newFilter;
    });
  };

  const clearStatusFilter = () => {
    setStatusFilter([]);
    // Mettre à jour l'URL
    updateURLWithFilters([], projectFilter, assigneeFilter);
  };

  const toggleAssigneeFilter = (email) => {
    console.log('toggleAssigneeFilter called with:', email);
    setAssigneeFilter(prev => {
      const newFilter = prev.includes(email)
        ? prev.filter(a => a !== email)
        : [...prev, email];
      console.log('New assigneeFilter:', newFilter);

      // Mettre à jour l'URL
      updateURLWithFilters(statusFilter, projectFilter, newFilter);

      return newFilter;
    });
  };

  const clearAssigneeFilter = () => {
    setAssigneeFilter([]);
    // Mettre à jour l'URL
    updateURLWithFilters(statusFilter, projectFilter, []);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTasks(tasks.map((task) => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (event, id) => {
    const selectedIndex = selectedTasks.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTasks, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTasks.slice(1));
    } else if (selectedIndex === selectedTasks.length - 1) {
      newSelected = newSelected.concat(selectedTasks.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedTasks.slice(0, selectedIndex),
        selectedTasks.slice(selectedIndex + 1),
      );
    }

    setSelectedTasks(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedTasks.length} tâches ?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedTasks.map(id => taskService.deleteTask(id)));
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      enqueueSnackbar('Erreur lors de la suppression en masse', { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedTasks.map(async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) return taskService.updateTask(id, { ...task, status: newStatus });
        return Promise.resolve();
      }));
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      enqueueSnackbar('Erreur lors de la mise à jour en masse', { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAssign = async (email) => {
    if (!email) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedTasks.map(async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          const current = assigneeToArray(task.assignee);
          if (!current.includes(email)) {
            return taskService.updateTask(id, { ...task, assignee: arrayToAssignee([...current, email]) });
          }
        }
        return Promise.resolve();
      }));
      setSelectedTasks([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      enqueueSnackbar('Erreur lors de l\'assignation en masse', { variant: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const isSelected = (id) => selectedTasks.indexOf(id) !== -1;

  const updateURLWithFilters = (statuses, project, assignees) => {
    const params = {};
    if (statuses.length > 0) {
      params.status = statuses.join(',');
    }
    if (project) {
      params.projectId = project;
    }
    if (assignees && assignees.length > 0) {
      params.assignee = assignees.join(',');
    }
    setSearchParams(params);
  };

  if (isLoading) return viewMode === 1 ? <KanbanBoardSkeleton /> : <TaskListSkeleton />;
  if (isError) return <ErrorMessage message={tasksError?.message || 'Erreur lors du chargement des tâches'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })} />;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Gestion des Tâches
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination.totalElements} tâche(s) au total
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTask}
          size="medium"
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            fontWeight: 500,
          }}
        >
          Nouvelle Tâche
        </Button>
      </Box>

      {/* Onglets de vue */}
      <Paper
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 2,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={viewMode}
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 56,
              fontWeight: 500,
            },
          }}
        >
          <Tab
            icon={<ViewListIcon />}
            iconPosition="start"
            label="Liste"
            sx={{ px: 4 }}
          />
          <Tab
            icon={<ViewKanbanIcon />}
            iconPosition="start"
            label="Kanban"
            sx={{ px: 4 }}
          />
        </Tabs>
      </Paper>

      {/* Barre de filtres et recherche */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          boxShadow: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        }}
      >
        <Stack spacing={2.5}>
          {/* Ligne 1: Recherche */}
          <Box>
            <TextField
              fullWidth
              placeholder="Rechercher une tâche par titre, description ou référence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 24 }} />
                ),
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ mr: -1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: 2,
                  },
                }
              }}
            />
          </Box>

          {/* Ligne 2: Filtres */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
            <FormControl sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
              <InputLabel>Projet</InputLabel>
              <Select
                value={projectFilter}
                onChange={(e) => {
                  const newProjectCode = e.target.value;
                  setProjectFilter(newProjectCode);
                  updateURLWithFilters(statusFilter, newProjectCode, assigneeFilter);
                }}
                label="Projet"
                sx={{
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    boxShadow: 1,
                  },
                }}
              >
                <MenuItem value="">
                  <Typography variant="body2" color="text.secondary">
                    Tous les projets
                  </Typography>
                </MenuItem>
                <MenuItem value="no-project">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CancelIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Sans projet
                    </Typography>
                  </Stack>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={project.projectCode}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="body2">{project.projectName}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                endIcon={
                  statusFilter.length > 0 && (
                    <Chip
                      label={statusFilter.length}
                      size="small"
                      color="primary"
                      sx={{
                        height: 20,
                        minWidth: 20,
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                  )
                }
                onClick={(e) => setStatusFilterAnchorEl(e.currentTarget)}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  justifyContent: 'space-between',
                  px: 2,
                  backgroundColor: 'background.paper',
                  borderColor: statusFilter.length > 0 ? 'primary.main' : 'divider',
                  borderWidth: statusFilter.length > 0 ? 2 : 1,
                  fontWeight: statusFilter.length > 0 ? 600 : 400,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    borderWidth: statusFilter.length > 0 ? 2 : 1,
                    boxShadow: 1,
                  },
                }}
              >
                <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                  {statusFilter.length === 0
                    ? 'Filtrer par statut'
                    : statusFilter.length === 1
                      ? statusOptions.find(opt => opt.value === statusFilter[0])?.label
                      : `${statusFilter.length} statuts sélectionnés`}
                </Box>
              </Button>
              <Menu
                anchorEl={statusFilterAnchorEl}
                open={Boolean(statusFilterAnchorEl)}
                onClose={() => setStatusFilterAnchorEl(null)}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    minWidth: 280,
                    mt: 1,
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Filtrer par statut
                  </Typography>
                  {statusFilter.length > 0 && (
                    <Button
                      size="small"
                      onClick={clearStatusFilter}
                      sx={{ minWidth: 'auto' }}
                    >
                      Effacer
                    </Button>
                  )}
                </Box>
                {statusOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => toggleStatusFilter(option.value)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Checkbox
                      checked={statusFilter.includes(option.value)}
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      icon={option.icon}
                      label={option.label}
                      color={option.color}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 50%' } }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                endIcon={
                  assigneeFilter.length > 0 && (
                    <Chip
                      label={assigneeFilter.length}
                      size="small"
                      color="primary"
                      sx={{
                        height: 20,
                        minWidth: 20,
                        '& .MuiChip-label': { px: 0.75 }
                      }}
                    />
                  )
                }
                onClick={(e) => setAssigneeFilterAnchorEl(e.currentTarget)}
                sx={{
                  height: 56,
                  borderRadius: 2,
                  justifyContent: 'space-between',
                  px: 2,
                  backgroundColor: 'background.paper',
                  borderColor: assigneeFilter.length > 0 ? 'primary.main' : 'divider',
                  borderWidth: assigneeFilter.length > 0 ? 2 : 1,
                  fontWeight: assigneeFilter.length > 0 ? 600 : 400,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    borderWidth: assigneeFilter.length > 0 ? 2 : 1,
                    boxShadow: 1,
                  },
                }}
              >
                <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
                  {assigneeFilter.length === 0
                    ? 'Filtrer par assigné'
                    : assigneeFilter.length === 1
                      ? (() => {
                          const person = persons.find(p => p.email === assigneeFilter[0]);
                          return person ? `${person.firstName} ${person.lastName}` : assigneeFilter[0];
                        })()
                      : `${assigneeFilter.length} assignés sélectionnés`}
                </Box>
              </Button>
              <Menu
                anchorEl={assigneeFilterAnchorEl}
                open={Boolean(assigneeFilterAnchorEl)}
                onClose={() => setAssigneeFilterAnchorEl(null)}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    minWidth: 280,
                    mt: 1,
                    boxShadow: 4,
                  },
                }}
              >
                <Box sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: 1,
                  borderColor: 'divider',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Filtrer par assigné
                  </Typography>
                  {assigneeFilter.length > 0 && (
                    <Button
                      size="small"
                      onClick={clearAssigneeFilter}
                      sx={{ minWidth: 'auto' }}
                    >
                      Effacer
                    </Button>
                  )}
                </Box>
                {persons.map((person) => (
                  <MenuItem
                    key={person.id}
                    onClick={() => toggleAssigneeFilter(person.email)}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Checkbox
                      checked={assigneeFilter.includes(person.email)}
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      icon={<PersonIcon />}
                      label={`${person.firstName} ${person.lastName}`}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Stack>

          {/* Indicateurs de filtres actifs */}
          {(searchTerm || projectFilter || statusFilter.length > 0 || assigneeFilter.length > 0) && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Filtres actifs :
              </Typography>
              {searchTerm && (
                <Chip
                  label={`Recherche: "${searchTerm}"`}
                  size="small"
                  onDelete={() => setSearchTerm('')}
                  color="primary"
                  variant="outlined"
                  icon={<SearchIcon />}
                />
              )}
              {projectFilter && (
                <Chip
                  label={
                    projectFilter === 'no-project'
                      ? 'Projet: Sans projet'
                      : `Projet: ${projects.find(p => p.id === projectFilter)?.projectCode || projectFilter}`
                  }
                  size="small"
                  onDelete={() => {
                    setProjectFilter('');
                    updateURLWithFilters(statusFilter, '', assigneeFilter);
                  }}
                  color="primary"
                  variant="outlined"
                  icon={projectFilter === 'no-project' ? <CancelIcon /> : undefined}
                />
              )}
              {statusFilter.map(status => {
                const statusInfo = getStatusInfo(status);
                return (
                  <Chip
                    key={status}
                    label={statusInfo.label}
                    size="small"
                    icon={statusInfo.icon}
                    onDelete={() => toggleStatusFilter(status)}
                    color={statusInfo.color}
                    variant="outlined"
                  />
                );
              })}
              {assigneeFilter.map(email => {
                const person = persons.find(p => p.email === email);
                const name = person ? `${person.firstName} ${person.lastName}` : email;
                return (
                  <Chip
                    key={email}
                    label={`Assigné: ${name}`}
                    size="small"
                    icon={<PersonIcon />}
                    onDelete={() => toggleAssigneeFilter(email)}
                    color="primary"
                    variant="outlined"
                  />
                );
              })}
            </Stack>
          )}
        </Stack>
      </Paper>

      {isFetching && <Box sx={{ height: 3, width: '100%', background: 'linear-gradient(90deg, transparent, primary.main, transparent)', animation: 'pulse 1.5s infinite' }} />}

      {/* Vue Liste */}
      {viewMode === 0 && (
        <>
          {/* Barre d'actions en masse */}
          {selectedTasks.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              {selectedTasks.length} sélectionné(s)
            </Typography>
            <Tooltip title="Tout désélectionner">
              <IconButton size="small" onClick={() => setSelectedTasks([])}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Select
                value=""
                displayEmpty
                onChange={(e) => handleBulkStatusChange(e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="" disabled>
                  Changer statut...
                </MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Select
                value=""
                displayEmpty
                onChange={(e) => handleBulkAssign(e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="" disabled>
                  Assigner à...
                </MenuItem>
                {persons.map((person) => (
                  <MenuItem key={person.id} value={person.email}>
                    {person.firstName} {person.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
              sx={{ borderRadius: 2 }}
            >
              Supprimer
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tableau des tâches */}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: 2,
          mb: 4,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selectedTasks.length > 0 && selectedTasks.length < tasks.length}
                  checked={tasks.length > 0 && selectedTasks.length === tasks.length}
                  onChange={handleSelectAll}
                  inputProps={{
                    'aria-label': 'select all tasks',
                  }}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Titre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Projet</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Assignés</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Échéance</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estimation</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => {
              const isItemSelected = isSelected(task.id);
              return (
                <TableRow
                  key={task.id}
                  hover
                  onClick={(event) => handleSelectTask(event, task.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      inputProps={{
                        'aria-labelledby': `enhanced-table-checkbox-${task.id}`,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {task.title}
                    </Typography>
                    {task.trackingReference && (
                      <Typography variant="caption" color="text.secondary">
                        {task.trackingReference}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Select
                        value={task.projectId || ''}
                        onChange={(e) => handleProjectChange(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Aucun projet</MenuItem>
                        {projects.map((project) => (
                          <MenuItem key={project.id} value={project.id}>
                            {project.projectCode} - {project.projectName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      {(() => {
                        const assigneesArray = assigneeToArray(task.assignee);
                        const names = getAssigneesNames(assigneesArray);
                        return names.map((name, index) => {
                          const email = assigneesArray[index];
                          return (
                            <Chip
                              key={email}
                              label={name}
                              size="small"
                              onDelete={() => handleRemoveAssignee(task.id, email)}
                              icon={<PersonIcon />}
                              sx={{
                                borderRadius: 2,
                                '& .MuiChip-deleteIcon': {
                                  fontSize: '1rem',
                                },
                              }}
                            />
                          );
                        });
                      })()}
                      {(!task.assignee || task.assignee.length === 0) && (
                        <Typography variant="caption" color="text.secondary">
                          Non assigné
                        </Typography>
                      )}
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddAssignee(task.id, e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          displayEmpty
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="" disabled>
                            + Assigner
                          </MenuItem>
                          {persons
                            .filter(p => !assigneeToArray(task.assignee).includes(p.email))
                            .map((person) => (
                              <MenuItem key={person.id} value={person.email}>
                                {person.firstName} {person.lastName}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={task.status || ''}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ borderRadius: 2 }}
                        renderValue={(value) => {
                          const statusInfo = getStatusInfo(value);
                          return (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ color: `${statusInfo.color}.main`, display: 'flex', alignItems: 'center' }}>
                                {statusInfo.icon}
                              </Box>
                              <Typography variant="body2" fontWeight={500}>
                                {statusInfo.label}
                              </Typography>
                            </Stack>
                          );
                        }}
                      >
                        <MenuItem value="">
                          <Typography variant="body2" color="text.secondary">
                            Aucun statut
                          </Typography>
                        </MenuItem>
                        {statusOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ color: `${option.color}.main`, display: 'flex', alignItems: 'center' }}>
                                {option.icon}
                              </Box>
                              <Typography variant="body2" fontWeight={500}>
                                {option.label}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                        {task.status && !statusOptions.find(opt => opt.value === task.status.toLowerCase()) && (
                          <MenuItem value={task.status}>
                            <Typography variant="body2">
                              {task.status}
                            </Typography>
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2">{formatDate(task.deadLine)}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.estimate || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Éditer">
                        <IconButton
                          onClick={() => handleEditTask(task)}
                          color="primary"
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          onClick={() => handleDeleteTask(task.id)}
                          color="error"
                          size="small"
                          sx={{
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.error.main, 0.1),
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {tasks.length === 0 && !isLoading && !isFetching && (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune tâche trouvée
            </Typography>
          </Box>
        )}
      </TableContainer>
        </>
      )}

      {/* Vue Kanban */}
      {viewMode === 1 && (
        <KanbanBoard
          tasks={tasks}
          persons={persons}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pagination (commune aux deux vues) */}
      {viewMode === 0 && (
        <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalElements={pagination.totalElements}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Modal de création/édition */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </Typography>
            <IconButton onClick={() => setShowModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={3}>
              {/* Titre */}
              <TextField
                fullWidth
                label="Titre"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                InputProps={{
                  startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              {/* Statut et Projet sur la même ligne */}
              <Stack direction="row" spacing={2}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Statut"
                    renderValue={(value) => {
                      const statusInfo = getStatusInfo(value);
                      return (
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          color={statusInfo.color}
                          size="small"
                        />
                      );
                    }}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Chip
                          icon={option.icon}
                          label={option.label}
                          color={option.color}
                          size="small"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Projet</InputLabel>
                  <Select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    label="Projet"
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.projectName} ({project.projectCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Description avec support Markdown */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Description
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (Markdown supporté)
                  </Typography>
                </Stack>
                <TextField
                  fullWidth
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  minRows={12}
                  maxRows={20}
                  required
                  placeholder="Décrivez la tâche en détail... Vous pouvez utiliser le Markdown:&#10;&#10;# Titre&#10;## Sous-titre&#10;- Liste à puces&#10;1. Liste numérotée&#10;**gras** *italique* `code`&#10;[lien](https://example.com)"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      alignItems: 'flex-start',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    },
                    '& .MuiInputBase-input': {
                      lineHeight: 1.6,
                    },
                  }}
                />
              </Box>

              {/* Estimation, Dates et Référence */}
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Estimation"
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="ex: 3h, 2j"
                    sx={{ width: 150 }}
                  />

                  <TextField
                    type="date"
                    label="Début prévu"
                    value={formData.plannedStart}
                    onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ flex: 1 }}
                  />

                  <TextField
                    type="date"
                    label="Échéance"
                    value={formData.deadLine}
                    onChange={(e) => setFormData({ ...formData, deadLine: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ flex: 1 }}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label="Référence de suivi"
                  value={formData.trackingReference}
                  onChange={(e) => setFormData({ ...formData, trackingReference: e.target.value })}
                  placeholder="ex: JIRA-12345"
                />
              </Stack>

              {/* Assignés */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Assignés
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {(formData.assignees || []).map(email => {
                    const person = persons.find(p => p.email === email);
                    const name = person ? `${person.firstName} ${person.lastName}` : email;
                    return (
                      <Chip
                        key={email}
                        label={name}
                        onDelete={() => handleAssigneeToggle(email)}
                        icon={<PersonIcon />}
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                    );
                  })}
                  {(!formData.assignees || formData.assignees.length === 0) && (
                    <Typography variant="caption" color="text.secondary">
                      Aucun assigné
                    </Typography>
                  )}
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {persons
                    .filter(p => !(formData.assignees || []).includes(p.email))
                    .map(person => (
                      <Chip
                        key={person.id}
                        label={`+ ${person.firstName} ${person.lastName}`}
                        onClick={() => handleAssigneeToggle(person.email)}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderStyle: 'dashed',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            borderStyle: 'solid',
                          },
                        }}
                      />
                    ))}
                  {persons.filter(p => !(formData.assignees || []).includes(p.email)).length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Toutes les personnes sont assignées
                    </Typography>
                  )}
                </Stack>
              </Box>

              {editingTask && (
                <>
                  <Divider />
                  <AbstractEntityEditor
                    comments={formData.comments}
                    links={formData.links}
                    onChangeComments={(c) => setFormData({ ...formData, comments: c })}
                    onChangeLinks={(l) => setFormData({ ...formData, links: l })}
                  />
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setShowModal(false)} variant="outlined" size="large">
              Annuler
            </Button>
            <Button type="submit" variant="contained" size="large" startIcon={editingTask ? <EditIcon /> : <AddIcon />}>
              {editingTask ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default TasksPage;
