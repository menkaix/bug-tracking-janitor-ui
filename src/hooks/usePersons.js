import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useConfirm } from './useConfirm';
import personService from '../services/person.service';

const EMPTY_PERSON_FORM = { firstName: '', lastName: '', email: '' };

/**
 * Controller hook pour la page Personnes — React Query + useMutation.
 */
export const usePersons = () => {
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [copiedEmail, setCopiedEmail] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_PERSON_FORM });

  // Debounce la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const personsQuery = useQuery({
    queryKey: ['persons', 'all'],
    queryFn: async () => {
      const result = await personService.getAllPersons(0, 1000, '');
      if (!result.success) throw new Error(result.error || 'Erreur lors du chargement des personnes');
      const all = result.data?.content || [];
      // Déduplication par id côté client (deux collections backend peuvent renvoyer des doublons)
      return Array.from(new Map(all.map((p) => [p.id, p])).values());
    },
    staleTime: 2 * 60 * 1000,
  });

  const allPersons = personsQuery.data || [];

  // Filtre de recherche client-side
  const filteredPersons = debouncedSearch
    ? allPersons.filter((p) => {
        const q = debouncedSearch.toLowerCase();
        return (
          (p.firstName || '').toLowerCase().includes(q) ||
          (p.lastName || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q)
        );
      })
    : allPersons;

  // Pagination client-side
  const totalElements = filteredPersons.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const safePage = Math.min(currentPage, totalPages - 1);
  const persons = filteredPersons.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const loading = personsQuery.isLoading;
  const error = personsQuery.isError ? (personsQuery.error?.message || 'Erreur') : null;
  const pagination = {
    currentPage: safePage,
    totalPages,
    totalElements,
    size: pageSize,
  };

  // ─── Handlers modal (définis avant les mutations qui en ont besoin) ──────────

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({ ...EMPTY_PERSON_FORM });
  }, []);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? personService.updatePerson(id, data) : personService.createPerson(data),
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
    onError: () => enqueueSnackbar("Erreur lors de l'opération", { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => personService.deletePerson(id),
    onSuccess: () => {
      if (persons.length === 1 && currentPage > 0) setCurrentPage((p) => p - 1);
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' }),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handleSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(0);
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email?.trim()) {
      enqueueSnackbar("L'email est obligatoire", { variant: 'warning' });
      return;
    }
    saveMutation.mutate({ id: editingPerson?.id, data: formData });
  };

  const handleDelete = async (id, fullName) => {
    const ok = await confirm({
      title: `Supprimer ${fullName} ?`,
      description: 'Cette personne sera définitivement supprimée.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const handleCopyEmail = useCallback((email) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    });
  }, []);

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
    fetchPersons: () => queryClient.invalidateQueries({ queryKey: ['persons'] }),
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
