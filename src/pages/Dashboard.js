import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import './Dashboard.css';

/**
 * Page du tableau de bord
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects');
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
      // Charger toutes les tâches, projets et personnes pour avoir des statistiques précises
      const [tasksResult, projectsResult, personsResult] = await Promise.all([
        taskService.getAllTasks(0, 10000),
        projectService.getAllProjects(0, 10000),
        personService.getAllPersons(0, 10000),
      ]);

      if (tasksResult.success && projectsResult.success && personsResult.success) {
        const tasks = tasksResult.data.content || [];
        const projects = projectsResult.data.content || [];
        const persons = personsResult.data.content || [];

        // Calcul des KPI Projets
        calculateProjectKPIs(tasks, projects);

        // Calcul des KPI Personnes
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

    // Normaliser les statuts de projets (gérer majuscules/minuscules)
    const activeProjects = projects.filter(p => {
      const status = p.status ? p.status.toUpperCase() : '';
      return status === 'ACTIVE' || status === 'IN_PROGRESS' || status === 'IN PROGRESS';
    }).length;

    const completedProjects = projects.filter(p => {
      const status = p.status ? p.status.toUpperCase() : '';
      return status === 'COMPLETED' || status === 'DONE';
    }).length;

    const totalTasks = tasks.length;

    // Comptabiliser les tâches par statut (normaliser les statuts)
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

    // Répartition des tâches par priorité (normaliser les priorités)
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

    // Projets avec retards (projets actifs avec des tâches en retard)
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

    // Calculer les KPI détaillés par projet
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

      // Vérifier s'il y a des retards
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

      // Compter les personnes assignées
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

    // Créer un mapping email -> personne pour faciliter la recherche
    const personsByEmail = {};
    persons.forEach(p => {
      if (p.email) {
        personsByEmail[p.email.toLowerCase()] = p;
      }
    });

    // Calculer les tâches assignées par personne
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

    // Comptabiliser les tâches par personne
    let totalTasksAssigned = 0;
    let completedTasksByPersons = 0;
    let inProgressTasksByPersons = 0;
    let todoTasksByPersons = 0;

    tasks.forEach(t => {
      // Le champ assignee contient une chaîne d'emails séparés par des virgules
      if (t.assignee) {
        const assigneeEmails = t.assignee
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(e => e);

        // Pour chaque email assigné
        assigneeEmails.forEach(email => {
          const person = personsByEmail[email];

          if (person && tasksByPerson[person.id]) {
            tasksByPerson[person.id].total++;
            totalTasksAssigned++;

            // Normaliser les statuts (gérer majuscules/minuscules)
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

    // Calculer le taux de complétion pour chaque personne
    Object.values(tasksByPerson).forEach(p => {
      if (p.total > 0) {
        p.completionRate = parseFloat(((p.completed / p.total) * 100).toFixed(1));
      }
    });

    // Moyenne de tâches par personne (basée sur toutes les personnes)
    const averageTasksPerPerson = parseFloat((totalTasksAssigned / totalPersons).toFixed(1));

    // Taux de complétion moyen de toutes les personnes actives
    const activePersonsList = Object.values(tasksByPerson).filter(p => p.total > 0);
    const averageCompletionRate = activePersonsList.length > 0
      ? parseFloat((activePersonsList.reduce((sum, p) => sum + p.completionRate, 0) / activePersonsList.length).toFixed(1))
      : 0;

    // Personnes avec surcharge (plus de 10 tâches actives non complétées)
    const personsWithOverload = Object.values(tasksByPerson).filter(p => {
      const activeTasks = p.inProgress + p.todo + p.pending + p.other;
      return activeTasks > 10;
    }).length;

    // Personnes sans tâches
    const personsWithNoTasks = Object.values(tasksByPerson).filter(p => p.total === 0).length;

    // Personnes avec faible activité (1-3 tâches au total)
    const personsWithLowActivity = Object.values(tasksByPerson).filter(p =>
      p.total > 0 && p.total <= 3
    ).length;

    // Personnes actives (ayant au moins une tâche)
    const activePersons = totalPersons - personsWithNoTasks;

    // Top performers (personnes avec le plus de tâches complétées)
    const topPerformers = Object.values(tasksByPerson)
      .filter(p => p.completed > 0)
      .sort((a, b) => {
        // Trier d'abord par nombre de tâches complétées, puis par taux de complétion
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

    // Distribution de la charge de travail (pour visualiser l'équilibre)
    const workloadDistribution = Object.values(tasksByPerson)
      .filter(p => p.total > 0)
      .map(p => {
        const activeTasks = p.inProgress + p.todo + p.pending;
        return {
          name: `${p.person.firstName || ''} ${p.person.lastName || ''}`.trim() || 'Sans nom',
          total: p.total,
          completed: p.completed,
          inProgress: p.inProgress,
          todo: p.todo + p.pending, // Combiner todo et pending
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Indicateurs de performance et contrôle de gestion</p>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📊 KPI Projets
        </button>
        <button
          className={`tab ${activeTab === 'persons' ? 'active' : ''}`}
          onClick={() => setActiveTab('persons')}
        >
          👥 KPI Personnes
        </button>
      </div>

      {/* Contenu de l'onglet Projets */}
      {activeTab === 'projects' && (
        <div className="tab-content">
          <h2 className="section-title">Avancement des Projets</h2>
          <div className="stats-grid">
            <div className="stat-card stat-primary clickable" onClick={() => navigate('/projects')}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Projets</h3>
                <p className="stat-number">{projectsData.totalProjects}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Projets Actifs</h3>
                <p className="stat-number">{projectsData.activeProjects}</p>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>Projets Terminés</h3>
                <p className="stat-number">{projectsData.completedProjects}</p>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <h3>Projets en Retard</h3>
                <p className="stat-number">{projectsData.projectsWithDelays}</p>
              </div>
            </div>
          </div>

          <h2 className="section-title">Tâches et Progression</h2>
          <div className="stats-grid">
            <div className="stat-card stat-info clickable" onClick={() => navigate('/tasks')}>
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>Total Tâches</h3>
                <p className="stat-number">{projectsData.totalTasks}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✔️</div>
              <div className="stat-content">
                <h3>Tâches Terminées</h3>
                <p className="stat-number">{projectsData.completedTasks}</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">🔄</div>
              <div className="stat-content">
                <h3>En Cours</h3>
                <p className="stat-number">{projectsData.inProgressTasks}</p>
              </div>
            </div>

            <div className="stat-card stat-secondary">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>À Faire</h3>
                <p className="stat-number">{projectsData.todoTasks}</p>
              </div>
            </div>
          </div>

          <h2 className="section-title">Indicateurs de Gestion</h2>
          <div className="stats-grid">
            <div className="stat-card stat-gradient-1">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Taux de Complétion</h3>
                <p className="stat-number">{projectsData.completionRate}%</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-2">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Tâches / Projet</h3>
                <p className="stat-number">{projectsData.averageTasksPerProject}</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-3">
              <div className="stat-icon">🔴</div>
              <div className="stat-content">
                <h3>Priorité Haute</h3>
                <p className="stat-number">{projectsData.tasksByPriority.high || 0}</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-4">
              <div className="stat-icon">🟡</div>
              <div className="stat-content">
                <h3>Priorité Moyenne</h3>
                <p className="stat-number">{projectsData.tasksByPriority.medium || 0}</p>
              </div>
            </div>
          </div>

          {/* KPI par projet */}
          {projectsData.projectDetails.length > 0 && (
            <>
              <h2 className="section-title">Performance par Projet</h2>
              <div className="project-list">
                {projectsData.projectDetails.slice(0, 10).map((project, index) => (
                  <div key={project.id} className="project-item">
                    <div className="project-header">
                      <div className="project-info">
                        <h3 className="project-name">{project.name}</h3>
                        <div className="project-badges">
                          <span className={`badge badge-status badge-${project.status.toLowerCase()}`}>
                            {project.status}
                          </span>
                          {project.hasDelay && (
                            <span className="badge badge-danger">En retard</span>
                          )}
                          <span className="badge badge-info">
                            {project.assignedPersonsCount} {project.assignedPersonsCount > 1 ? 'personnes' : 'personne'}
                          </span>
                        </div>
                      </div>
                      <div className="project-completion">
                        <span className="completion-rate">{project.completionRate}%</span>
                      </div>
                    </div>
                    <div className="project-progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.completionRate}%` }}
                      ></div>
                    </div>
                    <div className="project-stats">
                      <div className="project-stat">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{project.totalTasks}</span>
                      </div>
                      <div className="project-stat">
                        <span className="stat-label">Terminées</span>
                        <span className="stat-value stat-success">{project.completedTasks}</span>
                      </div>
                      <div className="project-stat">
                        <span className="stat-label">En cours</span>
                        <span className="stat-value stat-warning">{project.inProgressTasks}</span>
                      </div>
                      <div className="project-stat">
                        <span className="stat-label">À faire</span>
                        <span className="stat-value stat-secondary">{project.todoTasks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Personnes */}
      {activeTab === 'persons' && (
        <div className="tab-content">
          <h2 className="section-title">Vue d'Ensemble Personnes</h2>
          <div className="stats-grid">
            <div className="stat-card stat-purple clickable" onClick={() => navigate('/persons')}>
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>Total Personnes</h3>
                <p className="stat-number">{personsData.totalPersons}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✨</div>
              <div className="stat-content">
                <h3>Personnes Actives</h3>
                <p className="stat-number">{personsData.activePersons}</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">😴</div>
              <div className="stat-content">
                <h3>Sans Tâches</h3>
                <p className="stat-number">{personsData.personsWithNoTasks}</p>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <h3>Surcharge (>10)</h3>
                <p className="stat-number">{personsData.personsWithOverload}</p>
              </div>
            </div>
          </div>

          <h2 className="section-title">Charge de Travail</h2>
          <div className="stats-grid">
            <div className="stat-card stat-info">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>Tâches Assignées</h3>
                <p className="stat-number">{personsData.totalTasksAssigned}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Complétées</h3>
                <p className="stat-number">{personsData.completedTasksByPersons}</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <h3>En Cours</h3>
                <p className="stat-number">{personsData.inProgressTasksByPersons}</p>
              </div>
            </div>

            <div className="stat-card stat-secondary">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>À Faire</h3>
                <p className="stat-number">{personsData.todoTasksByPersons}</p>
              </div>
            </div>
          </div>

          <h2 className="section-title">Indicateurs de Performance</h2>
          <div className="stats-grid">
            <div className="stat-card stat-gradient-2">
              <div className="stat-icon">⚖️</div>
              <div className="stat-content">
                <h3>Tâches / Personne</h3>
                <p className="stat-number">{personsData.averageTasksPerPerson}</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-1">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Taux Complétion Moyen</h3>
                <p className="stat-number">{personsData.averageCompletionRate}%</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-3">
              <div className="stat-icon">📉</div>
              <div className="stat-content">
                <h3>Faible Activité</h3>
                <p className="stat-number">{personsData.personsWithLowActivity}</p>
              </div>
            </div>

            <div className="stat-card stat-gradient-4">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3>Productivité</h3>
                <p className="stat-number">
                  {personsData.totalTasksAssigned > 0
                    ? ((personsData.completedTasksByPersons / personsData.totalTasksAssigned) * 100).toFixed(0)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          {personsData.topPerformers.length > 0 && (
            <>
              <h2 className="section-title">Top Performers</h2>
              <div className="top-performers">
                {personsData.topPerformers.map((performer, index) => (
                  <div key={index} className="performer-card">
                    <div className="performer-rank">#{index + 1}</div>
                    <div className="performer-info">
                      <h3>{performer.name}</h3>
                      <div className="performer-stats">
                        <span className="badge badge-success">{performer.completed} complétées</span>
                        <span className="badge badge-info">{performer.total} total</span>
                        <span className="badge badge-primary">{performer.completionRate}% réussite</span>
                      </div>
                    </div>
                    <div className="performer-progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${performer.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Distribution de la charge */}
          {personsData.workloadDistribution.length > 0 && (
            <>
              <h2 className="section-title">Distribution de la Charge de Travail</h2>
              <div className="workload-section">
                <p className="workload-info">
                  Visualisation de la répartition des tâches actives par personne pour identifier les déséquilibres
                </p>
                <div className="workload-list">
                  {personsData.workloadDistribution.slice(0, 10).map((person, index) => (
                    <div key={index} className="workload-item">
                      <div className="workload-person">
                        <span className="workload-name">{person.name}</span>
                        <span className="workload-count">{person.activeTasks} tâches actives</span>
                      </div>
                      <div className="workload-bar-container">
                        <div className="workload-bar">
                          <div
                            className="workload-bar-progress"
                            style={{ width: `${Math.min((person.activeTasks / 15) * 100, 100)}%` }}
                          ></div>
                          <div
                            className="workload-bar-completed"
                            style={{ width: `${Math.min((person.completed / 15) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="workload-details">
                        <span className="workload-badge workload-badge-progress">{person.inProgress} en cours</span>
                        <span className="workload-badge workload-badge-todo">{person.todo} à faire</span>
                        <span className="workload-badge workload-badge-done">{person.completed} terminées</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* KPI détaillé par personne */}
          {personsData.workloadDistribution.length > 0 && (
            <>
              <h2 className="section-title">Performance Individuelle</h2>
              <div className="person-performance-list">
                {personsData.workloadDistribution.slice(0, 15).map((person, index) => {
                  const completionRate = person.total > 0 ? ((person.completed / person.total) * 100).toFixed(0) : 0;
                  const activeTasksRate = person.total > 0 ? ((person.activeTasks / person.total) * 100).toFixed(0) : 0;

                  return (
                    <div key={index} className="person-performance-card">
                      <div className="person-perf-header">
                        <h3 className="person-perf-name">{person.name}</h3>
                        <span className="person-perf-completion">{completionRate}%</span>
                      </div>
                      <div className="person-perf-bars">
                        <div className="perf-bar-row">
                          <span className="perf-bar-label">Complétées</span>
                          <div className="perf-bar-container">
                            <div
                              className="perf-bar perf-bar-completed"
                              style={{ width: `${completionRate}%` }}
                            >
                              <span className="perf-bar-value">{person.completed}</span>
                            </div>
                          </div>
                        </div>
                        <div className="perf-bar-row">
                          <span className="perf-bar-label">Actives</span>
                          <div className="perf-bar-container">
                            <div
                              className="perf-bar perf-bar-active"
                              style={{ width: `${activeTasksRate}%` }}
                            >
                              <span className="perf-bar-value">{person.activeTasks}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="person-perf-details">
                        <span className="perf-detail">
                          <strong>{person.total}</strong> total
                        </span>
                        <span className="perf-detail">
                          <strong>{person.inProgress}</strong> en cours
                        </span>
                        <span className="perf-detail">
                          <strong>{person.todo}</strong> à faire
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
