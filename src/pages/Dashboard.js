import React, { useEffect, useState } from 'react';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import './Dashboard.css';

/**
 * Page du tableau de bord
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalProjects: 0,
    openTasks: 0,
    closedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [tasksResult, projectsResult] = await Promise.all([
        taskService.getAllTasks(0, 100),
        projectService.getAllProjects(0, 100),
      ]);

      if (tasksResult.success && projectsResult.success) {
        const tasks = tasksResult.data.content || [];
        const openTasks = tasks.filter((t) => t.status !== 'closed').length;
        const closedTasks = tasks.filter((t) => t.status === 'closed').length;

        setStats({
          totalTasks: tasksResult.data.totalElements || 0,
          totalProjects: projectsResult.data.totalElements || 0,
          openTasks,
          closedTasks,
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

  if (loading) return <Loading message="Chargement du tableau de bord..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de vos projets et tâches</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Projets</h3>
            <p className="stat-number">{stats.totalProjects}</p>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Tâches</h3>
            <p className="stat-number">{stats.totalTasks}</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>Tâches Ouvertes</h3>
            <p className="stat-number">{stats.openTasks}</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Tâches Fermées</h3>
            <p className="stat-number">{stats.closedTasks}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/tasks" className="action-card">
          <h3>Gérer les tâches</h3>
          <p>Créer, modifier et suivre vos tâches</p>
        </a>
        <a href="/projects" className="action-card">
          <h3>Gérer les projets</h3>
          <p>Organiser vos projets et équipes</p>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;
