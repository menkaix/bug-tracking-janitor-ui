import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import personService from '../services/person.service';
import logger from '../services/logger.service';

const EMPTY_PERSON_FORM = { firstName: '', lastName: '', email: '' };

/**
 * Controller hook pour la page Personnes.
 */
export const usePersons = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PERSON_FORM });

  const fetchPersons = useCallback(
    async (page = 0, size = pagination.size) => {
      try {
        setLoading(true);
        setError(null);
        const result = await personService.getAllPersons(page, size, searchTerm);
        if (result.success) {
          setPersons(result.data.content || []);
          setPagination({
            currentPage: result.data.number || result.data.currentPage || 0,
            totalPages: result.data.totalPages || 0,
            totalElements: result.data.totalElements || 0,
            size: result.data.size || size,
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchTerm, pagination.size]
  );

  useEffect(() => {
    fetchPersons(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    fetchPersons(newPage, pagination.size);
  };

  const handleSizeChange = (newSize) => {
    setPagination((prev) => ({ ...prev, size: newSize, currentPage: 0 }));
    fetchPersons(0, newSize);
  };

  const handleCreateClick = () => {
    setEditingPerson(null);
    setFormData({ ...EMPTY_PERSON_FORM });
    setShowModal(true);
  };

  const handleEditClick = (person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      email: person.email || '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({ ...EMPTY_PERSON_FORM });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email?.trim()) {
      enqueueSnackbar("L'email est obligatoire", { variant: 'warning' });
      return;
    }
    try {
      setLoading(true);
      const result = editingPerson
        ? await personService.updatePerson(editingPerson.id, formData)
        : await personService.createPerson(formData);

      if (result.success) {
        handleCloseModal();
        fetchPersons(pagination.currentPage, pagination.size);
      } else {
        enqueueSnackbar(result.error || "Erreur lors de l'opération", { variant: 'error' });
      }
    } catch (err) {
      logger.error('Error in handleSubmit:', err);
      enqueueSnackbar("Erreur lors de l'opération", { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) return;
    try {
      setLoading(true);
      const result = await personService.deletePerson(id);
      if (result.success) {
        if (persons.length === 1 && pagination.currentPage > 0) {
          handlePageChange(pagination.currentPage - 1);
        } else {
          fetchPersons(pagination.currentPage, pagination.size);
        }
      } else {
        enqueueSnackbar(result.error || 'Erreur lors de la suppression', { variant: 'error' });
      }
    } catch (err) {
      logger.error('Error in handleDelete:', err);
      enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  };

  return {
    persons,
    loading,
    error,
    pagination,
    searchTerm,
    copiedEmail,
    showModal,
    editingPerson,
    formData,
    fetchPersons,
    handleSearchChange,
    handlePageChange,
    handleSizeChange,
    handleCreateClick,
    handleEditClick,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleCopyEmail,
  };
};
