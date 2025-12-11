import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';

/**
 * Page du tableau de bord - Style Material UI 2025
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [projectsData, setProjectsData] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    projectsWithDelays: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    completionRate: 0,
    averageTasksPerProject: 0,
    projectsByStatus: {},
    tasksByPriority: {},
    projectDetails: [],
  });
  const [personsData, setPersonsData] = useState({
    totalPersons: 0,
    activePersons: 0,
    totalTasksAssigned: 0,
    completedTasksByPersons: 0,
    inProgressTasksByPersons: 0,
    todoTasksByPersons: 0,
    averageTasksPerPerson: 0,
    averageCompletionRate: 0,
    personsWithOverload: 0,
    personsWithNoTasks: 0,
    personsWithLowActivity: 0,
    topPerformers: [],
    workloadDistribution: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [tasksResult, projectsResult, personsResult] = await Promise.all([
        taskService.getAllTasks(0, 10000),
        projectService.getAllProjects(0, 10000),
        personService.getAllPersons(0, 10000),
      ]);

      if (tasksResult.success && projectsResult.success && personsResult.success) {
        const tasks = tasksResult.data.content || [];
        const projects = projectsResult.data.content || [];
        const persons = personsResult.data.content || [];

        calculateProjectKPIs(tasks, projects);
        calculatePersonKPIs(tasks, persons);
      } else {
        setError('Impossible de charger les données du tableau de bord');
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectKPIs = (tasks, projects) => {
    const totalProjects = projects.length;

    const activeProjects = projects.filter(p => {
      const status = p.status ? p.status.toUpperCase() : '';
      return status === 'ACTIVE' || status === 'IN_PROGRESS' || status === 'IN PROGRESS';
    }).length;

    const completedProjects = projects.filter(p => {
      const status = p.status ? p.status.toUpperCase() : '';
      return status === 'COMPLETED' || status === 'DONE';
    }).length;

    const totalTasks = tasks.length;

    let completedTasks = 0;
    let inProgressTasks = 0;
    let todoTasks = 0;

    tasks.forEach(t => {
      const status = t.status ? t.status.toLowerCase() : '';

      if (status === 'done') {
        completedTasks++;
      } else if (status === 'in-progress' || status === 'in_progress' || status === 'inprogress') {
        inProgressTasks++;
      } else if (status === 'todo' || status === 'to-do' || status === 'pending') {
        todoTasks++;
      }
    });

    const completionRate = totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;
    const averageTasksPerProject = totalProjects > 0 ? parseFloat((totalTasks / totalProjects).toFixed(1)) : 0;

    const tasksByPriority = {
      high: 0,
      medium: 0,
      low: 0,
    };

    tasks.forEach(t => {
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
    const projectsWithDelays = projects.filter(p => {
      const status = p.status ? p.status.toUpperCase() : '';
      if (status !== 'ACTIVE' && status !== 'IN_PROGRESS' && status !== 'IN PROGRESS') return false;

      const projectTasks = tasks.filter(t => t.projectCode === p.projectCode);
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
      const projectTasks = tasks.filter(t => t.projectCode === project.projectCode);
      const projectTotal = projectTasks.length;
      const projectCompleted = projectTasks.filter(t => t.status && t.status.toLowerCase() === 'done').length;
      const projectInProgress = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'in-progress' || status === 'in_progress' || status === 'inprogress';
      }).length;
      const projectTodo = projectTasks.filter(t => {
        const status = t.status ? t.status.toLowerCase() : '';
        return status === 'todo' || status === 'to-do' || status === 'pending';
      }).length;

      const projectCompletionRate = projectTotal > 0 ? parseFloat(((projectCompleted / projectTotal) * 100).toFixed(1)) : 0;

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
        status: project.status || 'UNKNOWN',
        totalTasks: projectTotal,
        completedTasks: projectCompleted,
        inProgressTasks: projectInProgress,
        todoTasks: projectTodo,
        completionRate: projectCompletionRate,
        hasDelay,
        assignedPersonsCount: assignedPersonsSet.size,
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);

    setProjectsData({
      totalProjects,
      activeProjects,
      completedProjects,
      projectsWithDelays,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      averageTasksPerProject,
      tasksByPriority,
      projectDetails,
    });
  };

  const calculatePersonKPIs = (tasks, persons) => {
    const totalPersons = persons.length;

    if (totalPersons === 0) {
      setPersonsData({
        totalPersons: 0,
        activePersons: 0,
        totalTasksAssigned: 0,
        completedTasksByPersons: 0,
        inProgressTasksByPersons: 0,
        todoTasksByPersons: 0,
        averageTasksPerPerson: 0,
        averageCompletionRate: 0,
        personsWithOverload: 0,
        personsWithNoTasks: 0,
        personsWithLowActivity: 0,
        topPerformers: [],
        workloadDistribution: [],
      });
      return;
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
            } else if (status === 'pending') {
              tasksByPerson[person.id].pending++;
              todoTasksByPersons++;
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
          todo: p.todo + p.pending,
          activeTasks: activeTasks,
        };
      })
      .sort((a, b) => b.activeTasks - a.activeTasks);

    setPersonsData({
      totalPersons,
      activePersons,
      totalTasksAssigned,
      completedTasksByPersons,
      inProgressTasksByPersons,
      todoTasksByPersons,
      averageTasksPerPerson,
      averageCompletionRate,
      personsWithOverload,
      personsWithNoTasks,
      personsWithLowActivity,
      topPerformers,
      workloadDistribution,
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <Loading message="Chargement du tableau de bord..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  const StatCard = ({ icon, title, value, color = 'primary', onClick }) => (
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
                color="secondary"
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
                {projectsData.projectDetails.slice(0, 10).map((project) => (
                  <Card key={project.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {project.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                              label={project.status}
                              size="small"
                              color={project.status === 'COMPLETED' ? 'success' : 'primary'}
                            />
                            {project.hasDelay && (
                              <Chip label="En retard" size="small" color="error" />
                            )}
                            <Chip
                              label={`${project.assignedPersonsCount} ${project.assignedPersonsCount > 1 ? 'personnes' : 'personne'}`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="primary">
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

                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Total
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {project.totalTasks}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Terminées
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="success.main">
                            {project.completedTasks}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            En cours
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="warning.main">
                            {project.inProgressTasks}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            À faire
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="info.main">
                            {project.todoTasks}
                          </Typography>
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
                color="secondary"
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
                value={`${
                  personsData.totalTasksAssigned > 0
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
                          <Chip label={`${person.todo} à faire`} size="small" color="info" variant="outlined" />
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
    </Container>
  );
};

export default Dashboard;
