import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfirm } from './useConfirm';
import skillService from '../services/skill.service';

const EMPTY_SKILL_FORM = { name: '', description: '', category: '', tags: [] };

/**
 * Hook de gestion du catalogue de skills.
 */
export const useSkills = () => {
  const { enqueueSnackbar } = useSnackbar();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_SKILL_FORM });
  const [tagsInput, setTagsInput] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────

  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const result = await skillService.getAllSkills();
      if (!result.success) throw new Error(result.error || 'Erreur chargement skills');
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['skills', 'categories'],
    queryFn: async () => {
      const result = await skillService.getAllCategories();
      return result.success ? result.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const allSkills = skillsQuery.data || [];
  const categories = categoriesQuery.data || [];

  const filteredSkills = allSkills.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchCategory = !categoryFilter || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? skillService.updateSkill(id, data) : skillService.createSkill(data),
    onSuccess: () => {
      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      enqueueSnackbar('Skill sauvegardé avec succès', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la sauvegarde du skill', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => skillService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      enqueueSnackbar('Skill supprimé', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Erreur lors de la suppression', { variant: 'error' }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingSkill(null);
    setFormData({ ...EMPTY_SKILL_FORM });
    setTagsInput('');
  }, []);

  const handleCreateClick = () => {
    setEditingSkill(null);
    setFormData({ ...EMPTY_SKILL_FORM });
    setTagsInput('');
    setShowModal(true);
  };

  const handleEditClick = (skill) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name || '',
      description: skill.description || '',
      category: skill.category || '',
      tags: skill.tags || [],
    });
    setTagsInput((skill.tags || []).join(', '));
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsInputChange = (e) => {
    const raw = e.target.value;
    setTagsInput(raw);
    setFormData((prev) => ({
      ...prev,
      tags: raw.split(',').map((t) => t.trim()).filter(Boolean),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      enqueueSnackbar('Le nom du skill est obligatoire', { variant: 'warning' });
      return;
    }
    saveMutation.mutate({ id: editingSkill?.id, data: formData });
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: `Supprimer "${name}" ?`,
      description: 'Ce skill sera supprimé du catalogue. Les références dans les profils restent intactes.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  return {
    skills: filteredSkills,
    allSkills,
    categories,
    loading: skillsQuery.isLoading,
    error: skillsQuery.isError ? (skillsQuery.error?.message || 'Erreur') : null,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    showModal,
    editingSkill,
    formData,
    tagsInput,
    fetchSkills: () => queryClient.invalidateQueries({ queryKey: ['skills'] }),
    handleCreateClick,
    handleEditClick,
    handleCloseModal,
    handleFormChange,
    handleTagsInputChange,
    handleSubmit,
    handleDelete,
  };
};
