import React, { useEffect, useState } from 'react';
import projectService from '../services/project.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import './ProjectsPage.css';

/**
 * Page de gestion des projets
 */
const ProjectsPage = () => {
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
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    description: '',
  });

  const loadProjects = async (page = 0) => {
    setLoading(true);
    setError('');

    try {
      const result = await projectService.getAllProjects(page, pagination.size, searchTerm);

      if (result.success) {
        setProjects(result.data.content || []);
        setPagination({
          currentPage: result.data.currentPage,
          totalPages: result.data.totalPages,
          totalElements: result.data.totalElements,
          size: result.data.size,
        });
      } else {
        setError(result.error || 'Impossible de charger les projets');
      }
    } catch (err) {
      setError('Une erreur est survenue lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects(0);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [searchTerm]);

  const handlePageChange = (page) => {
    loadProjects(page);
  };

  const handlePageSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize }));
    loadProjects(0); // Retourner à la première page lors du changement de taille
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({
      projectName: '',
      projectCode: '',
      description: '',
    });
    setShowModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      projectName: project.projectName || '',
      projectCode: project.projectCode || '',
      description: project.description || '',
    });
    setShowModal(true);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

    const result = await projectService.deleteProject(id);
    if (result.success) {
      // Si on supprime le dernier projet de la page et qu'on n'est pas sur la première page,
      // revenir à la page précédente
      const willBeEmpty = projects.length === 1;
      const notFirstPage = pagination.currentPage > 0;
      const targetPage = willBeEmpty && notFirstPage ? pagination.currentPage - 1 : pagination.currentPage;
      loadProjects(targetPage);
    } else {
      alert('Erreur lors de la suppression du projet');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let result;
    if (editingProject) {
      result = await projectService.updateProject(editingProject.id, formData);
    } else {
      result = await projectService.createProject(formData);
    }

    if (result.success) {
      setShowModal(false);
      loadProjects(pagination.currentPage);
    } else {
      alert('Erreur lors de la sauvegarde du projet');
    }
  };

  if (loading && projects.length === 0) return <Loading message="Chargement des projets..." />;

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Gestion des Projets</h1>
          <p>{pagination.totalElements} projet(s) au total</p>
        </div>
        <button onClick={handleCreateProject} className="btn-primary">
          + Nouveau Projet
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadProjects(pagination.currentPage)} />}

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <div className="project-code">{project.projectCode}</div>
              <div className="project-actions">
                <button onClick={() => handleEditProject(project)} className="btn-icon" title="Éditer">
                  ✏️
                </button>
                <button onClick={() => handleDeleteProject(project.id)} className="btn-icon" title="Supprimer">
                  🗑️
                </button>
              </div>
            </div>
            <h3 className="project-name">{project.projectName}</h3>
            <p className="project-description">
              {project.description || 'Aucune description'}
            </p>
          </div>
        ))}
      </div>

      {projects.length === 0 && !loading && (
        <div className="empty-state">
          <p>Aucun projet trouvé</p>
          <button onClick={handleCreateProject} className="btn-primary">
            Créer votre premier projet
          </button>
        </div>
      )}

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalElements={pagination.totalElements}
        pageSize={pagination.size}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProject ? 'Modifier le projet' : 'Nouveau projet'}</h2>
              <button onClick={() => setShowModal(false)} className="btn-close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="project-form">
              <div className="form-group">
                <label>Nom du projet *</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Ex: Système d'authentification"
                  required
                />
              </div>

              <div className="form-group">
                <label>Code du projet *</label>
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="Ex: AUTH"
                  required
                  disabled={!!editingProject}
                />
                {editingProject && (
                  <small className="form-hint">Le code du projet ne peut pas être modifié</small>
                )}
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="5"
                  placeholder="Décrivez votre projet..."
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  {editingProject ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
