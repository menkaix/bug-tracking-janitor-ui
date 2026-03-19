import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  Avatar,
  useTheme,
  alpha,
  Paper,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  FolderSpecial as FolderSpecialIcon,
  Done as DoneIcon,
  Pending as PendingIcon,
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  SentimentDissatisfied as SleepIcon,
  Speed as SpeedIcon,
  BarChart as BarChartIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import backlogService from '../services/backlog.service';
import DashboardSkeleton from '../components/Common/DashboardSkeleton';
import ErrorMessage from '../components/Common/ErrorMessage';
import OccupationCalendar from '../components/Dashboard/OccupationCalendar';
import OccupationMap from '../components/Dashboard/OccupationMap';
import { calculateProjectStatus, getProjectStatusInfo } from '../utils/projectStatus';

/**
 * Récupère les données brutes du dashboard depuis le backend.
 * Fonction pure utilisée par React Query (mise en cache automatique).
 */
const fetchDashboardData = async () => {
  const [tasksResult, projectsResult, personsResult] = await Promise.all([
    taskService.getAllTasks(0, 10000),
    projectService.getAllProjects(0, 10000),
    personService.getAllPersons(0, 10000),
  ]);

  if (!tasksResult.success || !projectsResult.success || !personsResult.success) {
    throw new Error('Impossible de charger les données du tableau de bord');
  }

  return {
    tasks: tasksResult.data.content || [],
    projects: projectsResult.data.content || [],
    persons: personsResult.data.content || [],
  };
};

/**
 * Page du tableau de bord - Style Material UI 2025
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // --- React Query : chargement + cache automatique des données dashboard ---
  const { data: dashboardRaw, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  });

  const allTasks = useMemo(() => dashboardRaw?.tasks || [], [dashboardRaw]);
  const allProjects = useMemo(() => dashboardRaw?.projects || [], [dashboardRaw]);
  const allPersons = useMemo(() => dashboardRaw?.persons || [], [dashboardRaw]);

  const [activeTab, setActiveTab] = useState(0);
  const [occupationSubTab, setOccupationSubTab] = useState(0);
  const [projectMetaMap, setProjectMetaMap] = useState({});

  // State for Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
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
  });

  const calculateProjectKPIs = (tasks, projects) => {
    const totalProjects = projects.length;

    // Calculer le statut de chaque projet basé sur ses tâches
    const projectsWithCalculatedStatus = projects.map(p => {
      const projectTasks = tasks.filter(t => t.projectId === p.id);
      const calculatedStatus = calculateProjectStatus(projectTasks);
      return { ...p, calculatedStatus };
    });

    const activeProjects = projectsWithCalculatedStatus.filter(p =>
      p.calculatedStatus === 'ACTIVE'
    ).length;

    const completedProjects = projectsWithCalculatedStatus.filter(p =>
      p.calculatedStatus === 'COMPLETED'
    ).length;

    // IDs des projets non terminés — utilisés pour filtrer les tâches des indicateurs
    const activeProjectIds = new Set(
      projectsWithCalculatedStatus
        .filter(p => p.calculatedStatus !== 'COMPLETED')
        .map(p => p.id)
    );
    const activeTasks = tasks.filter(t => activeProjectIds.has(t.projectId));

    const totalTasks = activeTasks.length;

    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;
    let pendingTasks = 0;
    let todoEstimate = 0;
    let pendingEstimate = 0;

    activeTasks.forEach(t => {
      const status = t.status ? t.status.toLowerCase() : '';
      const est = parseFloat(t.estimatedManHours) || 0;

      if (status === 'done') {
        completedTasks++;
      } else if (status === 'in-progress' || status === 'in_progress' || status === 'inprogress') {
        inProgressTasks++;
      } else if (status === 'todo' || status === 'to-do') {
        todoTasks++;
        todoEstimate += est;
      } else if (status === 'pending') {
        pendingTasks++;
        pendingEstimate += est;
      }
    });

    const completionRate = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;
    const activeProjectsCount = activeProjectIds.size;
    const averageTasksPerProject = activeProjectsCount > 0 ? parseFloat((totalTasks / activeProjectsCount).toFixed(1)) : 0;

    const tasksByPriority = {
      high: 0,
      medium: 0,
      low: 0,
    };

    activeTasks.forEach(t => {
      const priority = t.priority ? t.priority.toLowerCase() : '';
      if (priority === 'high' || priority === 'haute') {
        tasksByPriority.high++;
      } else if (priority === 'medium' || priority === 'moyenne') {
        tasksByPriority.medium++;
      } else if (priority === 'low' || priority === 'basse' || priority === 'faible') {
        tasksByPriority.low++;
      }
    });

    const now = new Date();
    const projectsWithDelays = projectsWithCalculatedStatus.filter(p => {
      // Seulement les projets actifs peuvent être en retard
      if (p.calculatedStatus !== 'ACTIVE') return false;

      const projectTasks = tasks.filter(t => t.projectId === p.id);
      return projectTasks.some(t => {
        const taskStatus = t.status ? t.status.toLowerCase() : '';
        if (taskStatus !== 'done' && t.dueDate) {
          try {
            return new Date(t.dueDate) < now;
          } catch (e) {
            return false;
          }
        }
        return false;
      });
    }).length;

    const projectDetails = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const projectTotal = projectTasks.length;

      // Compter les tâches par statut
      const projectCompleted = projectTasks.filter(t => t.status && t.status.toLowerCase() === 'done').length;
      const projectInProgress = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'in-progress' || status === 'in_progress' || status === 'inprogress';
      }).length;
      const projectTodo = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'todo' || status === 'to-do';
      }).length;
      const projectPending = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'pending';
      }).length;
      const projectToStudy = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'to-study';
      }).length;
      const projectToTest = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'to-test';
      }).length;
      const projectTesting = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'testing';
      }).length;
      const projectCanceled = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'canceled' || status === 'cancelled';
      }).length;
      const projectNoStatus = projectTasks.filter(t => !t.status || t.status.trim() === '').length;

      const projectCompletionRate = projectTotal > 0 ? parseFloat(((projectCompleted / projectTotal) * 100).toFixed(1)) : 0;

      // Calculer le statut basé sur les tâches
      const calculatedStatus = calculateProjectStatus(projectTasks);

      const hasDelay = projectTasks.some(t => {
        const taskStatus = t.status ? t.status.toLowerCase() : '';
        if (taskStatus !== 'done' && t.dueDate) {
          try {
            return new Date(t.dueDate) < now;
          } catch (e) {
            return false;
          }
        }
        return false;
      });

      const assignedPersonsSet = new Set();
      projectTasks.forEach(t => {
        if (t.assignee) {
          const emails = t.assignee.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
          emails.forEach(email => assignedPersonsSet.add(email));
        }
      });

      return {
        id: project.id,
        name: project.projectName || 'Sans nom',
        code: project.projectCode || '',
        status: calculatedStatus, // Utiliser le statut calculé
        totalTasks: projectTotal,
        completedTasks: projectCompleted,
        inProgressTasks: projectInProgress,
        todoTasks: projectTodo,
        pendingTasks: projectPending,
        toStudyTasks: projectToStudy,
        toTestTasks: projectToTest,
        testingTasks: projectTesting,
        canceledTasks: projectCanceled,
        noStatusTasks: projectNoStatus,
        completionRate: projectCompletionRate,
        hasDelay,
        assignedPersonsCount: assignedPersonsSet.size,
        totalComments: 0,
        totalLinks: 0,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      projectsWithDelays,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      pendingTasks,
      todoEstimate: parseFloat(todoEstimate.toFixed(1)),
      pendingEstimate: parseFloat(pendingEstimate.toFixed(1)),
      completionRate,
      averageTasksPerProject,
      tasksByPriority,
      projectDetails,
    };
  };

  const calculatePersonKPIs = (tasks, persons) => {
    const totalPersons = persons.length;

    if (totalPersons === 0) {
      return {
        totalPersons: 0,
        activePersons: 0,
        totalTasksAssigned: 0,
        completedTasksByPersons: 0,
        inProgressTasksByPersons: 0,
        todoTasksByPersons: 0,
        pendingTasksByPersons: 0,
        todoEstimateByPersons: 0,
        pendingEstimateByPersons: 0,
        averageTasksPerPerson: 0,
        averageCompletionRate: 0,
        personsWithOverload: 0,
        personsWithNoTasks: 0,
        personsWithLowActivity: 0,
        topPerformers: [],
        workloadDistribution: [],
      };
    }

    const personsByEmail = {};
    persons.forEach(p => {
      if (p.email) {
        personsByEmail[p.email.toLowerCase()] = p;
      }
    });

    const tasksByPerson = {};
    persons.forEach(p => {
      tasksByPerson[p.id] = {
        person: p,
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        pending: 0,
        other: 0,
        completionRate: 0,
      };
    });

    let totalTasksAssigned = 0;
    let completedTasksByPersons = 0;
    let inProgressTasksByPersons = 0;
    let todoTasksByPersons = 0;
    let pendingTasksByPersons = 0;
    let todoEstimateByPersons = 0;
    let pendingEstimateByPersons = 0;

    tasks.forEach(t => {
      if (t.assignee) {
        const assigneeEmails = t.assignee
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(e => e);

        assigneeEmails.forEach(email => {
          const person = personsByEmail[email];

          if (person && tasksByPerson[person.id]) {
            tasksByPerson[person.id].total++;
            totalTasksAssigned++;

            const status = t.status ? t.status.toLowerCase() : '';

            if (status === 'done') {
              tasksByPerson[person.id].completed++;
              completedTasksByPersons++;
            } else if (status === 'in-progress' || status === 'in_progress' || status === 'inprogress') {
              tasksByPerson[person.id].inProgress++;
              inProgressTasksByPersons++;
            } else if (status === 'todo' || status === 'to-do') {
              tasksByPerson[person.id].todo++;
              todoTasksByPersons++;
              todoEstimateByPersons += parseFloat(t.estimatedManHours) || 0;
            } else if (status === 'pending') {
              tasksByPerson[person.id].pending++;
              pendingTasksByPersons++;
              pendingEstimateByPersons += parseFloat(t.estimatedManHours) || 0;
            } else {
              tasksByPerson[person.id].other++;
            }
          }
        });
      }
    });

    Object.values(tasksByPerson).forEach(p => {
      if (p.total > 0) {
        p.completionRate = parseFloat(((p.completed / p.total) * 100).toFixed(1));
      }
    });

    const averageTasksPerPerson = parseFloat((totalTasksAssigned / totalPersons).toFixed(1));

    const activePersonsList = Object.values(tasksByPerson).filter(p => p.total > 0);
    const averageCompletionRate = activePersonsList.length > 0
      ? parseFloat((activePersonsList.reduce((sum, p) => sum + p.completionRate, 0) / activePersonsList.length).toFixed(1))
      : 0;

    const personsWithOverload = Object.values(tasksByPerson).filter(p => {
      const activeTasks = p.inProgress + p.todo + p.pending + p.other;
      return activeTasks > 10;
    }).length;

    const personsWithNoTasks = Object.values(tasksByPerson).filter(p => p.total === 0).length;

    const personsWithLowActivity = Object.values(tasksByPerson).filter(p =>
      p.total > 0 && p.total <= 3
    ).length;

    const activePersons = totalPersons - personsWithNoTasks;

    const topPerformers = Object.values(tasksByPerson)
      .filter(p => p.completed > 0)
      .sort((a, b) => {
        if (b.completed !== a.completed) {
          return b.completed - a.completed;
        }
        return b.completionRate - a.completionRate;
      })
      .slice(0, 5)
      .map(p => ({
        name: `${p.person.firstName || ''} ${p.person.lastName || ''}`.trim() || 'Sans nom',
        completed: p.completed,
        total: p.total,
        completionRate: p.completionRate.toFixed(0),
      }));

    const workloadDistribution = Object.values(tasksByPerson)
      .filter(p => p.total > 0)
      .map(p => {
        const activeTasks = p.inProgress + p.todo + p.pending;
        return {
          name: `${p.person.firstName || ''} ${p.person.lastName || ''}`.trim() || 'Sans nom',
          total: p.total,
          completed: p.completed,
          inProgress: p.inProgress,
          todo: p.todo,
          pending: p.pending,
          activeTasks: activeTasks,
        };
      })
      .sort((a, b) => b.activeTasks - a.activeTasks);

    return {
      totalPersons,
      activePersons,
      totalTasksAssigned,
      completedTasksByPersons,
      inProgressTasksByPersons,
      todoTasksByPersons,
      pendingTasksByPersons,
      todoEstimateByPersons: parseFloat(todoEstimateByPersons.toFixed(1)),
      pendingEstimateByPersons: parseFloat(pendingEstimateByPersons.toFixed(1)),
      averageTasksPerPerson,
      averageCompletionRate,
      personsWithOverload,
      personsWithNoTasks,
      personsWithLowActivity,
      topPerformers,
      workloadDistribution,
    };
  };

  // --- KPIs calculés depuis les données en cache (recalcul uniquement si données changent) ---
  const projectsData = useMemo(() => {
    const base = calculateProjectKPIs(allTasks, allProjects);
    if (Object.keys(projectMetaMap).length === 0) return base;
    return {
      ...base,
      projectDetails: base.projectDetails.map(pd => ({
        ...pd,
        ...(projectMetaMap[pd.id] || {}),
      })),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, allProjects, projectMetaMap]);

  const personsData = useMemo(
    () => calculatePersonKPIs(allTasks, allPersons),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTasks, allPersons]
  );

  // --- Fetch secondaire : commentaires/liens des projets actifs (non bloquant) ---
  useEffect(() => {
    if (allProjects.length === 0) return;
    const nonCompleted = allProjects
      .filter(p => {
        const pt = allTasks.filter(t => t.projectId === p.id);
        return calculateProjectStatus(pt) !== 'COMPLETED';
      })
      .slice(0, 10);

    Promise.allSettled(
      nonCompleted.map(p => backlogService.getEntity('projects', p.id))
    ).then(results => {
      const map = {};
      nonCompleted.forEach((project, i) => {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.success) {
          const data = r.value.data;
          map[project.id] = {
            totalComments: Array.isArray(data.comments) ? data.comments.length : 0,
            totalLinks: Array.isArray(data.links) ? data.links.length : 0,
          };
        }
      });
      setProjectMetaMap(map);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects]);

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorMessage message="Impossible de charger les données du tableau de bord" onRetry={refetch} />;

  // Form Helpers
  const assigneeToArray = (assigneeString) => {
    if (!assigneeString) return [];
    return assigneeString.split(',').map(e => e.trim()).filter(e => e);
  };

  const arrayToAssignee = (assigneesArray) => {
    if (!assigneesArray || assigneesArray.length === 0) return '';
    return assigneesArray.join(',');
  };

  const handleTaskClick = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectId: task.projectId || '',
      status: task.status || 'todo',
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: task.plannedStart ? task.plannedStart.split('T')[0] : '',
      deadLine: task.deadLine ? task.deadLine.split('T')[0] : '', // Use deadLine directly as in TasksPage
      assignees: assigneeToArray(task.assignee),
    });
    setShowModal(true);
  };

  const handleAssigneeToggle = (email) => {
    setFormData(prev => {
      const currentAssignees = prev.assignees || [];
      const newAssignees = currentAssignees.includes(email)
        ? currentAssignees.filter(e => e !== email)
        : [...currentAssignees, email];
      return { ...prev, assignees: newAssignees };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { assignees, ...restFormData } = formData;
    const taskData = {
      ...restFormData,
      assignee: arrayToAssignee(assignees),
      plannedStart: formData.plannedStart ? new Date(formData.plannedStart).toISOString() : null,
      deadLine: formData.deadLine ? new Date(formData.deadLine).toISOString() : null,
    };

    let result;
    if (editingTask) {
      result = await taskService.updateTask(editingTask.id, taskData);
    } else {
      // Should not happen in this context usually, but good to have
      result = await taskService.createTask(taskData);
    }

    if (result.success) {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } else {
      enqueueSnackbar('Erreur lors de la sauvegarde de la tâche', { variant: 'error' });
    }
  };

  const statusOptions = [
    { value: 'todo', label: 'À faire', color: 'secondary', icon: <AssignmentIcon fontSize="small" /> },
    { value: 'pending', label: 'En attente', color: 'warning', icon: <PendingIcon fontSize="small" /> },
    { value: 'in-progress', label: 'En cours', color: 'info', icon: <ScheduleIcon fontSize="small" /> },
    { value: 'to-study', label: 'À étudier', color: 'default', icon: <FolderSpecialIcon fontSize="small" /> }, // Reusing existing icon if necessary or importing Psychology
    { value: 'done', label: 'Terminé', color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
    { value: 'no-status', label: 'Sans statut', color: 'default', icon: <WarningIcon fontSize="small" /> }, // Reusing existing icon
  ];

  const getStatusInfo = (status) => {
    if (!status) return { label: 'Aucun statut', color: 'default', icon: <WarningIcon fontSize="small" /> };
    return statusOptions.find(opt => opt.value === status) || { label: status, color: 'default', icon: <AssignmentIcon fontSize="small" /> };
  };

  const StatCard = ({ icon, title, value, subtitle, color = 'primary', onClick }) => (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
            transform: 'translateY(-4px)',
            boxShadow: 6,
          }
          : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              backgroundColor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Tableau de bord
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Indicateurs de performance et contrôle de gestion
        </Typography>
      </Box>

      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 56,
            },
          }}
        >
          <Tab icon={<BarChartIcon />} iconPosition="start" label="KPI Projets" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="KPI Personnes" />
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="Calendrier d'occupation" />
        </Tabs>
      </Box>

      {/* Contenu onglet Projets */}
      {activeTab === 0 && (
        <Box>
          {/* Vue d'ensemble projets */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Avancement des Projets
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<FolderSpecialIcon />}
                title="Total Projets"
                value={projectsData.totalProjects}
                color="primary"
                onClick={() => navigate('/projects')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                title="Projets Actifs"
                value={projectsData.activeProjects}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<DoneIcon />}
                title="Projets Terminés"
                value={projectsData.completedProjects}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<WarningIcon />}
                title="Projets en Retard"
                value={projectsData.projectsWithDelays}
                color="error"
              />
            </Grid>
          </Grid>

          {/* Tâches */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Tâches et Progression
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<AssignmentIcon />}
                title="Total Tâches"
                value={projectsData.totalTasks}
                color="info"
                onClick={() => navigate('/tasks')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<CheckCircleIcon />}
                title="Tâches Terminées"
                value={projectsData.completedTasks}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<ScheduleIcon />}
                title="En Cours"
                value={projectsData.inProgressTasks}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PendingIcon />}
                title="À Faire"
                value={projectsData.todoTasks}
                subtitle={projectsData.todoEstimate > 0 ? `${projectsData.todoEstimate} h estimées` : undefined}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<ScheduleIcon />}
                title="En Attente"
                value={projectsData.pendingTasks}
                subtitle={projectsData.pendingEstimate > 0 ? `${projectsData.pendingEstimate} h estimées` : undefined}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Indicateurs de gestion */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Indicateurs de Gestion
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                title="Taux de Complétion"
                value={`${projectsData.completionRate}%`}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<BarChartIcon />}
                title="Tâches / Projet"
                value={projectsData.averageTasksPerProject}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<WarningIcon />}
                title="Priorité Haute"
                value={projectsData.tasksByPriority.high || 0}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<WarningIcon />}
                title="Priorité Moyenne"
                value={projectsData.tasksByPriority.medium || 0}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Performance par projet */}
          {projectsData.projectDetails.length > 0 && (
            <>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Performance par Projet
              </Typography>
              <Stack spacing={2}>
                {projectsData.projectDetails.filter(p => p.status !== 'COMPLETED').slice(0, 10).map((project) => (
                  <Card key={project.id} variant="outlined">
                    <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                            {project.code && (
                              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ flexShrink: 0 }}>
                                [{project.code}]
                              </Typography>
                            )}
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              gutterBottom
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0,
                              }}
                            >
                              {project.name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={getProjectStatusInfo(project.status).label}
                              size="small"
                              color={getProjectStatusInfo(project.status).color}
                            />
                            {project.hasDelay && (
                              <Chip label="En retard" size="small" color="error" />
                            )}
                            <Chip
                              label={`${project.assignedPersonsCount} ${project.assignedPersonsCount > 1 ? 'personnes' : 'personne'}`}
                              size="small"
                              variant="outlined"
                            />
                            {project.totalComments > 0 && (
                              <Chip
                                icon={<CommentIcon />}
                                label={project.totalComments}
                                size="small"
                                variant="outlined"
                                color="default"
                              />
                            )}
                            {project.totalLinks > 0 && (
                              <Chip
                                icon={<LinkIcon />}
                                label={project.totalLinks}
                                size="small"
                                variant="outlined"
                                color="default"
                              />
                            )}
                          </Stack>
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="primary" sx={{ ml: 2, flexShrink: 0 }}>
                          {project.completionRate}%
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={project.completionRate}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mt: 'auto' }}>
                        <Grid item xs={12}>
                          <Grid container spacing={1.5}>
                            {/* Total - toujours affiché */}
                            <Grid item xs={6} sm={4} md={3}>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Total
                              </Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {project.totalTasks}
                              </Typography>
                            </Grid>

                            {/* Terminées - affiché si > 0 */}
                            {project.completedTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Terminées
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="success.main">
                                  {project.completedTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* En cours - affiché si > 0 */}
                            {project.inProgressTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  En cours
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="warning.main">
                                  {project.inProgressTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* À faire - affiché si > 0 */}
                            {project.todoTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  À faire
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="info.main">
                                  {project.todoTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* En attente - affiché si > 0 */}
                            {project.pendingTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  En attente
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="warning.main">
                                  {project.pendingTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* À étudier - affiché si > 0 */}
                            {project.toStudyTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  À étudier
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="secondary.main">
                                  {project.toStudyTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* À tester - affiché si > 0 */}
                            {project.toTestTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  À tester
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="info.main">
                                  {project.toTestTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* En test - affiché si > 0 */}
                            {project.testingTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  En test
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="warning.main">
                                  {project.testingTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* Annulées - affiché si > 0 */}
                            {project.canceledTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Annulées
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="error.main">
                                  {project.canceledTasks}
                                </Typography>
                              </Grid>
                            )}

                            {/* Sans statut - affiché si > 0 */}
                            {project.noStatusTasks > 0 && (
                              <Grid item xs={6} sm={4} md={3}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Sans statut
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="text.secondary">
                                  {project.noStatusTasks}
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </>
          )}
        </Box>
      )}

      {/* Contenu onglet Personnes */}
      {activeTab === 1 && (
        <Box>
          {/* Vue d'ensemble personnes */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Vue d'Ensemble Personnes
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PeopleIcon />}
                title="Total Personnes"
                value={personsData.totalPersons}
                color="primary"
                onClick={() => navigate('/persons')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                title="Personnes Actives"
                value={personsData.activePersons}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<SleepIcon />}
                title="Sans Tâches"
                value={personsData.personsWithNoTasks}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<FireIcon />}
                title="Surcharge (>10)"
                value={personsData.personsWithOverload}
                color="error"
              />
            </Grid>
          </Grid>

          {/* Charge de travail */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Charge de Travail
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<AssignmentIcon />}
                title="Tâches Assignées"
                value={personsData.totalTasksAssigned}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<CheckCircleIcon />}
                title="Complétées"
                value={personsData.completedTasksByPersons}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<ScheduleIcon />}
                title="En Cours"
                value={personsData.inProgressTasksByPersons}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<PendingIcon />}
                title="À Faire"
                value={personsData.todoTasksByPersons}
                subtitle={personsData.todoEstimateByPersons > 0 ? `${personsData.todoEstimateByPersons} h estimées` : undefined}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<ScheduleIcon />}
                title="En Attente"
                value={personsData.pendingTasksByPersons}
                subtitle={personsData.pendingEstimateByPersons > 0 ? `${personsData.pendingEstimateByPersons} h estimées` : undefined}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Indicateurs de performance */}
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Indicateurs de Performance
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<BarChartIcon />}
                title="Tâches / Personne"
                value={personsData.averageTasksPerPerson}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<TrendingUpIcon />}
                title="Taux Complétion Moyen"
                value={`${personsData.averageCompletionRate}%`}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<SleepIcon />}
                title="Faible Activité"
                value={personsData.personsWithLowActivity}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={<SpeedIcon />}
                title="Productivité"
                value={`${personsData.totalTasksAssigned > 0
                  ? ((personsData.completedTasksByPersons / personsData.totalTasksAssigned) * 100).toFixed(0)
                  : 0
                  }%`}
                color="success"
              />
            </Grid>
          </Grid>

          {/* Top performers */}
          {personsData.topPerformers.length > 0 && (
            <>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Top Performers
              </Typography>
              <Stack spacing={2} sx={{ mb: 4 }}>
                {personsData.topPerformers.map((performer, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'info.main' : 'success.main',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                          }}
                        >
                          {index === 0 ? <TrophyIcon /> : `#${index + 1}`}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {performer.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip label={`${performer.completed} complétées`} size="small" color="success" />
                            <Chip label={`${performer.total} total`} size="small" variant="outlined" />
                            <Chip label={`${performer.completionRate}% réussite`} size="small" color="primary" />
                          </Stack>
                        </Box>
                        <Typography variant="h4" fontWeight={700} color="primary">
                          {performer.completionRate}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </>
          )}

          {/* Distribution de la charge */}
          {personsData.workloadDistribution.length > 0 && (
            <>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Distribution de la Charge de Travail
              </Typography>
              <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Visualisation de la répartition des tâches actives par personne pour identifier les déséquilibres
                </Typography>
                <Stack spacing={3}>
                  {personsData.workloadDistribution.slice(0, 10).map((person, index) => {
                    const completionRate = person.total > 0 ? ((person.completed / person.total) * 100).toFixed(0) : 0;
                    return (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body1" fontWeight={600}>
                            {person.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {person.activeTasks} tâches actives
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((person.activeTasks / 15) * 100, 100)}
                          sx={{ height: 8, borderRadius: 4, mb: 1 }}
                        />
                        <Stack direction="row" spacing={1}>
                          <Chip label={`${person.inProgress} en cours`} size="small" color="warning" variant="outlined" />
                          <Chip label={`${person.todo} à faire`} size="small" color="secondary" variant="outlined" />
                          {person.pending > 0 && <Chip label={`${person.pending} en attente`} size="small" color="info" variant="outlined" />}
                          <Chip label={`${person.completed} terminées`} size="small" color="success" variant="outlined" />
                          <Chip label={`${completionRate}%`} size="small" color="primary" />
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Paper>
            </>
          )}
        </Box>
      )}

      {/* Contenu onglet Occupation */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
            Occupation
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={occupationSubTab}
              onChange={(e, v) => setOccupationSubTab(v)}
              sx={{ '& .MuiTab-root': { minHeight: 40, fontSize: '0.875rem' } }}
            >
              <Tab icon={<CalendarIcon />} iconPosition="start" label="Calendrier" />
              <Tab icon={<PeopleIcon />} iconPosition="start" label="Carte des occupations" />
            </Tabs>
          </Box>
          {occupationSubTab === 0 && (
            <OccupationCalendar tasks={allTasks} persons={allPersons} onTaskClick={handleTaskClick} />
          )}
          {occupationSubTab === 1 && (
            <OccupationMap tasks={allTasks} persons={allPersons} projects={allProjects} onTaskClick={handleTaskClick} />
          )}
        </Box>
      )}

      {/* Modal d'édition */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              Modifier la tâche
            </Typography>
            <IconButton onClick={() => setShowModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={3}>
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

                {/* Reuse projectsData for project list if available, but better to use all projects. 
                   We loaded 'projectsResult' in loadDashboardData but didn't store full list in state, only KPIs.
                   Oops, calculateProjectKPIs uses 'projects', but we discard the raw list unless we store it.
                   Plan: Should modify loadDashboardData to store 'allProjects' as well.
                   Quick fix: Filter 'projectsData.projectDetails' which is derived from projects list, 
                   or just use projectDetails for the dropdown since it has ID/Name/Code?
                   projectDetails items have: id, name, status... need Code.
                   Wait, projectDetails is { id, name, ... }. ProjectCode is likely needed.
                   Let's check calculateProjectKPIs. It maps projects.
                   It has p.projectCode accessible in the closure scope but returns new object.
                   Let's assume projectDetails has name and we can map. 
                   Actually, I DO NOT have 'allProjects' state yet. 
                   I'll add 'allProjects' state and update 'loadDashboardData' in the same tool call if possible or next.
                   Let's add 'allProjects' state now.
                */}
                <FormControl fullWidth>
                  <InputLabel>Projet</InputLabel>
                  <Select
                    value={formData.projectId || ''}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    label="Projet"
                  >
                    <MenuItem value="">Aucun projet</MenuItem>
                    {allProjects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.projectCode} - {project.projectName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* Description */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Description</Typography>
                <TextField
                  fullWidth
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  minRows={6}
                  maxRows={12}
                />
              </Box>

              {/* Dates */}
              <Stack direction="row" spacing={2}>
                <TextField
                  type="date"
                  label="Début prévu"
                  value={formData.plannedStart}
                  onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="Échéance"
                  value={formData.deadLine}
                  onChange={(e) => setFormData({ ...formData, deadLine: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              {/* Reference */}
              <TextField
                fullWidth
                label="Référence de suivi"
                value={formData.trackingReference}
                onChange={(e) => setFormData({ ...formData, trackingReference: e.target.value })}
              />

              {/* Assignees */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Assignés</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {allPersons.map(person => {
                    const isAssigned = (formData.assignees || []).includes(person.email);
                    return (
                      <Chip
                        key={person.email}
                        label={`${person.firstName} ${person.lastName}`}
                        onClick={() => handleAssigneeToggle(person.email)}
                        color={isAssigned ? "primary" : "default"}
                        variant={isAssigned ? "filled" : "outlined"}
                        avatar={<Avatar sx={{ bgcolor: isAssigned ? 'inherit' : theme.palette.grey[300] }}>{person.firstName[0]}</Avatar>}
                        sx={{ cursor: 'pointer' }}
                      />
                    );
                  })}
                </Stack>
              </Box>

            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setShowModal(false)} variant="outlined">
              Annuler
            </Button>
            <Button type="submit" variant="contained" startIcon={<EditIcon />}>
              Mettre à jour
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
