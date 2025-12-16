import React, { useEffect, useState } from 'react';
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
  Grid,
  Stack,
  Menu,
  Checkbox,
  Tooltip,
  alpha,
  useTheme,
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
} from '@mui/icons-material';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { format } from 'date-fns';

/**
 * Page de gestion des tâches - Material UI 2025
 */
const TasksPage = () => {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [persons, setPersons] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [projectFilter, setProjectFilter] = useState(searchParams.get('projectCode') || '');

  // Initialiser statusFilter depuis l'URL si présent (format: status=todo,pending,in-progress)
  const initialStatusFilter = () => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      return statusParam.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  };

  const [statusFilter, setStatusFilter] = useState(initialStatusFilter());
  const [statusFilterAnchorEl, setStatusFilterAnchorEl] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectCode: '',
    status: 'todo',
    estimate: '',
    trackingReference: '',
    plannedStart: '',
    deadLine: '',
    assignees: [],
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

  const loadTasks = async (page = 0, size = null) => {
    setLoading(true);
    setError('');

    try {
      const pageSize = size !== null ? size : pagination.size;

      console.log('loadTasks called with:', { page, size, statusFilter, projectFilter, searchTerm });

      // Si plusieurs status sont sélectionnés, faire plusieurs requêtes et combiner les résultats
      if (statusFilter.length > 0) {
        console.log('Filtrage avec statuts:', statusFilter);

        // Séparer les filtres de statut réels et le filtre "no-status"
        const hasNoStatus = statusFilter.includes('no-status');
        const realStatuses = statusFilter.filter(s => s !== 'no-status');

        // Faire une requête pour chaque statut sélectionné (sans le filtre de projet dans la requête)
        const promises = realStatuses.map(status => {
          const filter = `status:${status}`;
          console.log('Requête avec filtre:', filter);
          return taskService.getAllTasks(0, 1000, searchTerm, filter);
        });

        const results = await Promise.all(promises);
        console.log('Résultats des requêtes:', results);

        // Vérifier que toutes les requêtes ont réussi
        const allSuccess = results.every(r => r.success);
        if (!allSuccess) {
          setError('Impossible de charger les tâches');
          setLoading(false);
          return;
        }

        // Combiner tous les résultats et dédupliquer par ID
        let allTasks = results.flatMap(r => r.data.content || []);
        console.log('Tâches combinées:', allTasks.length);

        // Si "no-status" est sélectionné, récupérer toutes les tâches et filtrer celles sans statut
        if (hasNoStatus) {
          const allTasksResult = await taskService.getAllTasks(0, 1000, searchTerm, '');
          if (allTasksResult.success) {
            const noStatusTasks = (allTasksResult.data.content || []).filter(task => !task.status || task.status === '');
            console.log('Tâches sans statut:', noStatusTasks.length);
            allTasks = [...allTasks, ...noStatusTasks];
          }
        }

        const uniqueTasks = Array.from(
          new Map(allTasks.map(task => [task.id, task])).values()
        );
        console.log('Tâches uniques:', uniqueTasks.length);

        // Filtrer par projet côté client
        let filteredTasks = uniqueTasks;
        if (projectFilter) {
          if (projectFilter === 'no-project') {
            filteredTasks = uniqueTasks.filter(task => !task.projectCode || task.projectCode === '');
          } else {
            filteredTasks = uniqueTasks.filter(task => task.projectCode === projectFilter);
          }
        }
        console.log('Tâches après filtre projet:', filteredTasks.length);

        // Pagination côté client
        const totalElements = filteredTasks.length;
        const totalPages = Math.ceil(totalElements / pageSize);
        const startIndex = page * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

        setTasks(paginatedTasks);
        setPagination({
          currentPage: page,
          totalPages: totalPages,
          totalElements: totalElements,
          size: pageSize,
        });
      } else {
        // Aucun filtre de statut
        if (projectFilter === 'no-project') {
          // Cas spécial: récupérer toutes les tâches et filtrer celles sans projet côté client
          const result = await taskService.getAllTasks(0, 1000, searchTerm, '');

          if (result.success) {
            const allTasks = result.data.content || [];
            const noProjectTasks = allTasks.filter(task => !task.projectCode || task.projectCode === '');
            console.log('Tâches sans projet:', noProjectTasks.length);

            // Pagination côté client
            const totalElements = noProjectTasks.length;
            const totalPages = Math.ceil(totalElements / pageSize);
            const startIndex = page * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedTasks = noProjectTasks.slice(startIndex, endIndex);

            setTasks(paginatedTasks);
            setPagination({
              currentPage: page,
              totalPages: totalPages,
              totalElements: totalElements,
              size: pageSize,
            });
          } else {
            setError(result.error || 'Impossible de charger les tâches');
          }
        } else {
          // Requête normale avec filtre de projet si présent
          const filter = projectFilter ? `projectCode:${projectFilter}` : '';
          const result = await taskService.getAllTasks(page, pageSize, searchTerm, filter);

          if (result.success) {
            setTasks(result.data.content || []);

            const apiCurrentPage = result.data.number ?? result.data.currentPage ?? page;
            const apiTotalPages = result.data.totalPages ?? 0;
            const apiTotalElements = result.data.totalElements ?? 0;
            const apiPageSize = result.data.size ?? pageSize;

            console.log('Pagination data from API:', {
              apiCurrentPage,
              apiTotalPages,
              apiTotalElements,
              apiPageSize,
              rawData: result.data
            });

            setPagination({
              currentPage: apiCurrentPage,
              totalPages: apiTotalPages,
              totalElements: apiTotalElements,
              size: apiPageSize,
            });
          } else {
            setError(result.error || 'Impossible de charger les tâches');
          }
        }
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    const result = await projectService.getAllProjects(0, 100);
    if (result.success) {
      setProjects(result.data.content || []);
    }
  };

  const loadPersons = async () => {
    const result = await personService.getAllPersons(0, 1000);
    if (result.success) {
      setPersons(result.data.content || []);
    }
  };

  useEffect(() => {
    loadTasks();
    loadProjects();
    loadPersons();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks(0);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchTerm, statusFilter, projectFilter]);

  const handlePageChange = (page) => {
    // Validation des limites de page
    if (page < 0) {
      return;
    }
    // Si totalPages est défini, vérifier la limite supérieure
    if (pagination.totalPages > 0 && page >= pagination.totalPages) {
      return;
    }
    loadTasks(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize }));
    loadTasks(0, newSize); // Retourner à la première page avec la nouvelle taille
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      projectCode: '',
      status: 'todo',
      estimate: '',
      trackingReference: '',
      plannedStart: '',
      deadLine: '',
      assignees: [],
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectCode: task.projectCode || '',
      status: task.status || 'todo',
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: task.plannedStart ? task.plannedStart.split('T')[0] : '',
      deadLine: task.deadLine ? task.deadLine.split('T')[0] : '',
      assignees: assigneeToArray(task.assignee),
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    const result = await taskService.deleteTask(id);
    if (result.success) {
      // Si on supprime la dernière tâche de la page et qu'on n'est pas sur la première page,
      // revenir à la page précédente
      const willBeEmpty = tasks.length === 1;
      const notFirstPage = pagination.currentPage > 0;
      const targetPage = willBeEmpty && notFirstPage ? pagination.currentPage - 1 : pagination.currentPage;
      loadTasks(targetPage);
    } else {
      alert('Erreur lors de la suppression de la tâche');
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
    } else {
      result = await taskService.createTask(taskData);
    }

    if (result.success) {
      setShowModal(false);
      loadTasks(pagination.currentPage);
    } else {
      alert('Erreur lors de la sauvegarde de la tâche');
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
    return statusOptions.find(opt => opt.value === status) || {
      label: status,
      color: 'default',
      icon: <AssignmentIcon fontSize="small" />
    };
  };

  const handleStatusChange = async (taskId, newStatus) => {
    // Mise à jour optimiste de l'UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Appel API pour persister le changement
    const task = tasks.find(t => t.id === taskId);
    const result = await taskService.updateTask(taskId, { ...task, status: newStatus });

    if (!result.success) {
      // Revenir à l'ancien statut en cas d'erreur
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleProjectChange = async (taskId, newProjectCode) => {
    // Mise à jour optimiste de l'UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, projectCode: newProjectCode } : task
      )
    );

    // Appel API pour persister le changement
    const task = tasks.find(t => t.id === taskId);
    const result = await taskService.updateTask(taskId, { ...task, projectCode: newProjectCode });

    if (!result.success) {
      // Revenir à l'ancien projet en cas d'erreur
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, projectCode: task.projectCode } : t
        )
      );
      alert('Erreur lors de la mise à jour du projet');
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

    if (currentAssignees.includes(email)) {
      return; // Déjà assigné
    }

    const newAssignees = [...currentAssignees, email];

    // Mise à jour optimiste de l'UI (garder le format array pour l'affichage)
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, assignee: arrayToAssignee(newAssignees) } : t
      )
    );

    // Appel API avec le format backend (string)
    const result = await taskService.updateTask(taskId, { ...task, assignee: arrayToAssignee(newAssignees) });

    if (!result.success) {
      // Revenir à l'ancien état en cas d'erreur
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, assignee: task.assignee } : t
        )
      );
      alert('Erreur lors de l\'assignation');
    }
  };

  // Fonction pour retirer un assigné d'une tâche
  const handleRemoveAssignee = async (taskId, email) => {
    const task = tasks.find(t => t.id === taskId);
    const currentAssignees = assigneeToArray(task.assignee);
    const newAssignees = currentAssignees.filter(e => e !== email);

    // Mise à jour optimiste de l'UI
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, assignee: arrayToAssignee(newAssignees) } : t
      )
    );

    // Appel API avec le format backend (string)
    const result = await taskService.updateTask(taskId, { ...task, assignee: arrayToAssignee(newAssignees) });

    if (!result.success) {
      // Revenir à l'ancien état en cas d'erreur
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, assignee: task.assignee } : t
        )
      );
      alert('Erreur lors de la désassignation');
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
      updateURLWithFilters(newFilter, projectFilter);

      return newFilter;
    });
  };

  const clearStatusFilter = () => {
    setStatusFilter([]);
    // Mettre à jour l'URL
    updateURLWithFilters([], projectFilter);
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

    setLoading(true);
    try {
      await Promise.all(selectedTasks.map(id => taskService.deleteTask(id)));
      setSelectedTasks([]);
      loadTasks(pagination.currentPage);
    } catch (err) {
      alert('Erreur lors de la suppression en masse');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus) return;
    setLoading(true);
    try {
      await Promise.all(selectedTasks.map(async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          return taskService.updateTask(id, { ...task, status: newStatus });
        }
        return Promise.resolve();
      }));
      setSelectedTasks([]);
      loadTasks(pagination.currentPage);
    } catch (err) {
      alert('Erreur lors de la mise à jour en masse');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      await Promise.all(selectedTasks.map(async (id) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
          const currentAssignees = assigneeToArray(task.assignee);
          if (!currentAssignees.includes(email)) {
            const newAssignees = [...currentAssignees, email];
            return taskService.updateTask(id, { ...task, assignee: arrayToAssignee(newAssignees) });
          }
        }
        return Promise.resolve();
      }));
      setSelectedTasks([]);
      loadTasks(pagination.currentPage);
    } catch (err) {
      alert('Erreur lors de l\'assignation en masse');
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (id) => selectedTasks.indexOf(id) !== -1;

  const updateURLWithFilters = (statuses, project) => {
    const params = {};
    if (statuses.length > 0) {
      params.status = statuses.join(',');
    }
    if (project) {
      params.projectCode = project;
    }
    setSearchParams(params);
  };

  if (loading && tasks.length === 0) return <Loading message="Chargement des tâches..." />;

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
                  updateURLWithFilters(statusFilter, newProjectCode);
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
                  <MenuItem key={project.id} value={project.projectCode}>
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
          </Stack>

          {/* Indicateurs de filtres actifs */}
          {(searchTerm || projectFilter || statusFilter.length > 0) && (
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
                      : `Projet: ${projects.find(p => p.projectCode === projectFilter)?.projectCode || projectFilter}`
                  }
                  size="small"
                  onDelete={() => {
                    setProjectFilter('');
                    updateURLWithFilters(statusFilter, '');
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
            </Stack>
          )}
        </Stack>
      </Paper>

      {error && <ErrorMessage message={error} onRetry={() => loadTasks(pagination.currentPage)} />}

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
                        value={task.projectCode || ''}
                        onChange={(e) => handleProjectChange(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Aucun projet</MenuItem>
                        {projects.map((project) => (
                          <MenuItem key={project.id} value={project.projectCode}>
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
                        {task.status && !statusOptions.find(opt => opt.value === task.status) && (
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

        {tasks.length === 0 && !loading && (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Aucune tâche trouvée
            </Typography>
          </Box>
        )}
      </TableContainer>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalElements={pagination.totalElements}
        pageSize={pagination.size}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

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
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                    label="Projet"
                  >
                    <MenuItem value="">Aucun</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.projectCode}>
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
