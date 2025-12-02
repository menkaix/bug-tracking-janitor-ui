import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import './Dashboard.css';

/**
 * Page du tableau de bord
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalProjects: 0,
    openTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Charger toutes les tâches et projets pour avoir des statistiques précises
      const [tasksResult, projectsResult] = await Promise.all([
        taskService.getAllTasks(0, 10000), // Augmenter la limite pour charger toutes les tâches
        projectService.getAllProjects(0, 10000), // Augmenter la limite pour charger tous les projets
      ]);

      if (tasksResult.success && projectsResult.success) {
        const tasks = tasksResult.data.content || [];

        // Statuts considérés comme "ouverts"
        const openStatuses = ['todo', 'pending', 'in-progress', 'to-study'];

        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const openTasks = tasks.filter((t) => openStatuses.includes(t.status)).length;

        setStats({
          totalTasks: tasksResult.data.totalElements || 0,
          totalProjects: projectsResult.data.totalElements || 0,
          openTasks,
          completedTasks,
        });
      } else {
        setError('Impossible de charger les données du tableau de bord');
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleViewProjects = () => {
    navigate('/projects');
  };

  const handleViewAllTasks = () => {
    navigate('/tasks');
  };

  const handleViewOpenTasks = () => {
    // Statuts considérés comme "ouverts" : todo, pending, in-progress, to-study
    navigate('/tasks?status=todo,pending,in-progress,to-study');
  };

  const handleViewCompletedTasks = () => {
    navigate('/tasks?status=done');
  };

  if (loading) return <Loading message="Chargement du tableau de bord..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de vos projets et tâches</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary clickable" onClick={handleViewProjects}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Projets</h3>
            <p className="stat-number">{stats.totalProjects}</p>
          </div>
        </div>

        <div className="stat-card stat-info clickable" onClick={handleViewAllTasks}>
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Tâches</h3>
            <p className="stat-number">{stats.totalTasks}</p>
          </div>
        </div>

        <div className="stat-card stat-warning clickable" onClick={handleViewOpenTasks}>
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>Tâches Ouvertes</h3>
            <p className="stat-number">{stats.openTasks}</p>
          </div>
        </div>

        <div className="stat-card stat-success clickable" onClick={handleViewCompletedTasks}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Tâches Terminées</h3>
            <p className="stat-number">{stats.completedTasks}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
