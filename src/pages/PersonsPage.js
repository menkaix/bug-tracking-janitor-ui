import React, { useState, useEffect, useCallback } from 'react';
import personService from '../services/person.service';
import logger from '../services/logger.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import './PersonsPage.css';

function PersonsPage() {
  // États pour la liste des personnes
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la pagination
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10
  });

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Charger les personnes
  const fetchPersons = useCallback(async (page = 0, size = pagination.size) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug(`Fetching persons - page: ${page}, size: ${size}, search: ${searchTerm}`);

      const result = await personService.getAllPersons(page, size, searchTerm);

      if (result.success) {
        setPersons(result.data.content || []);
        setPagination({
          currentPage: result.data.number || result.data.currentPage || 0,
          totalPages: result.data.totalPages || 0,
          totalElements: result.data.totalElements || 0,
          size: result.data.size || size
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      logger.error('Error in fetchPersons:', err);
      setError('Erreur lors du chargement des personnes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.size]);

  // Effet pour charger les personnes au montage et lors des changements
  useEffect(() => {
    fetchPersons(pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Gérer la recherche avec debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;

    // Annuler le timeout précédent
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Définir un nouveau timeout
    const timeout = setTimeout(() => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, currentPage: 0 }));
    }, 500);

    setSearchTimeout(timeout);
  };

  // Gérer le changement de page
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    fetchPersons(newPage, pagination.size);
  };

  // Gérer le changement de taille de page
  const handleSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize, currentPage: 0 }));
    fetchPersons(0, newSize);
  };

  // Ouvrir la modale pour créer une personne
  const handleCreateClick = () => {
    setEditingPerson(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: ''
    });
    setShowModal(true);
  };

  // Ouvrir la modale pour éditer une personne
  const handleEditClick = (person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      email: person.email || ''
    });
    setShowModal(true);
  };

  // Fermer la modale
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: ''
    });
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation de l'email
    if (!formData.email || !formData.email.trim()) {
      alert('L\'email est obligatoire');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (editingPerson) {
        // Mise à jour
        result = await personService.updatePerson(editingPerson.id, formData);
      } else {
        // Création
        result = await personService.createPerson(formData);
      }

      if (result.success) {
        handleCloseModal();
        fetchPersons(pagination.currentPage, pagination.size);
      } else {
        alert(result.error || 'Erreur lors de l\'opération');
      }
    } catch (err) {
      logger.error('Error in handleSubmit:', err);
      alert('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une personne
  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await personService.deletePerson(id);

      if (result.success) {
        // Si on supprime le dernier élément d'une page, revenir à la page précédente
        if (persons.length === 1 && pagination.currentPage > 0) {
          handlePageChange(pagination.currentPage - 1);
        } else {
          fetchPersons(pagination.currentPage, pagination.size);
        }
      } else {
        alert(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      logger.error('Error in handleDelete:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="persons-page">
      <div className="persons-header">
        <h1>Gestion des Personnes</h1>
        <button className="btn-primary" onClick={handleCreateClick}>
          + Nouvelle Personne
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="persons-filters">
        <input
          type="text"
          placeholder="Rechercher par prénom, nom ou email..."
          className="search-input"
          onChange={handleSearchChange}
        />
      </div>

      {/* Affichage du loading */}
      {loading && <Loading />}

      {/* Affichage des erreurs */}
      {error && !loading && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchPersons(pagination.currentPage, pagination.size)}
        />
      )}

      {/* Tableau des personnes */}
      {!loading && !error && (
        <>
          <div className="persons-table-container">
            <table className="persons-table">
              <thead>
                <tr>
                  <th>Prénom</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date de création</th>
                  <th>Dernière modification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {persons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      Aucune personne trouvée
                    </td>
                  </tr>
                ) : (
                  persons.map((person) => (
                    <tr key={person.id}>
                      <td>{person.firstName || '-'}</td>
                      <td>{person.lastName || '-'}</td>
                      <td>
                        <a href={`mailto:${person.email}`} className="email-link">
                          {person.email}
                        </a>
                      </td>
                      <td>{formatDate(person.creationDate)}</td>
                      <td>{formatDate(person.updateDate)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => handleEditClick(person)}
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(
                              person.id,
                              `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
                            )}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              pageSize={pagination.size}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
            />
          )}
        </>
      )}

      {/* Modale de création/édition */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPerson ? 'Modifier la personne' : 'Nouvelle personne'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="firstName">Prénom</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  placeholder="Jean"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Nom</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  placeholder="Dupont"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="jean.dupont@example.com"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  {editingPerson ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonsPage;
