import React, { useEffect, useState } from 'react';
import taskService from '../services/task.service';
import projectService from '../services/project.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { format } from 'date-fns';
import './TasksPage.css';

/**
 * Page de gestion des tâches
 */
const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectCode: '',
    status: 'open',
    estimate: '',
    trackingReference: '',
    plannedStart: '',
    deadLine: '',
  });

  const loadTasks = async (page = 0) => {
    setLoading(true);
    setError('');

    try {
      const filter = statusFilter ? `status:${statusFilter}` : '';
      const result = await taskService.getAllTasks(page, pagination.size, searchTerm, filter);

      if (result.success) {
        setTasks(result.data.content || []);
        setPagination({
          currentPage: result.data.currentPage,
          totalPages: result.data.totalPages,
          totalElements: result.data.totalElements,
          size: result.data.size,
        });
      } else {
        setError(result.error || 'Impossible de charger les tâches');
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

  useEffect(() => {
    loadTasks();
    loadProjects();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks(0);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page) => {
    loadTasks(page);
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      projectCode: '',
      status: 'open',
      estimate: '',
      trackingReference: '',
      plannedStart: '',
      deadLine: '',
    });
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      projectCode: task.projectCode || '',
      status: task.status || 'open',
      estimate: task.estimate || '',
      trackingReference: task.trackingReference || '',
      plannedStart: task.plannedStart ? task.plannedStart.split('T')[0] : '',
      deadLine: task.deadLine ? task.deadLine.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    const result = await taskService.deleteTask(id);
    if (result.success) {
      loadTasks(pagination.currentPage);
    } else {
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const taskData = {
      ...formData,
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

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { label: 'Ouvert', class: 'status-open' },
      'in-progress': { label: 'En cours', class: 'status-progress' },
      closed: { label: 'Fermé', class: 'status-closed' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'status-default' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading && tasks.length === 0) return <Loading message="Chargement des tâches..." />;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Gestion des Tâches</h1>
          <p>{pagination.totalElements} tâche(s) au total</p>
        </div>
        <button onClick={handleCreateTask} className="btn-primary">
          + Nouvelle Tâche
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvert</option>
          <option value="in-progress">En cours</option>
          <option value="closed">Fermé</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadTasks(pagination.currentPage)} />}

      <div className="tasks-table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Projet</th>
              <th>Statut</th>
              <th>Échéance</th>
              <th>Estimation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="task-title">{task.title}</div>
                  {task.trackingReference && (
                    <div className="task-reference">{task.trackingReference}</div>
                  )}
                </td>
                <td>{task.projectCode || '-'}</td>
                <td>{getStatusBadge(task.status)}</td>
                <td>{formatDate(task.deadLine)}</td>
                <td>{task.estimate || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleEditTask(task)} className="btn-edit">
                      Éditer
                    </button>
                    <button onClick={() => handleDeleteTask(task.id)} className="btn-delete">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && !loading && (
          <div className="empty-state">
            <p>Aucune tâche trouvée</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="open">Ouvert</option>
                    <option value="in-progress">En cours</option>
                    <option value="closed">Fermé</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Projet</label>
                  <select
                    value={formData.projectCode}
                    onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  >
                    <option value="">Aucun</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.projectCode}>
                        {project.projectName} ({project.projectCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Estimation</label>
                  <input
                    type="text"
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="ex: 3h, 2j"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Début prévu</label>
                  <input
                    type="date"
                    value={formData.plannedStart}
                    onChange={(e) => setFormData({ ...formData, plannedStart: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Échéance</label>
                  <input
                    type="date"
                    value={formData.deadLine}
                    onChange={(e) => setFormData({ ...formData, deadLine: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Référence de suivi</label>
                <input
                  type="text"
                  value={formData.trackingReference}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingReference: e.target.value })
                  }
                  placeholder="ex: JIRA-12345"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  {editingTask ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
