import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import issueService from '../services/issue.service';
import projectService from '../services/project.service';
import personService from '../services/person.service';
import { useConfirm } from './useConfirm';

// ─── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_ISSUE_FORM = {
  title: '',
  description: '',
  type: 'BUG',
  severity: 'MEDIUM',
  projectId: '',
  reporter: '',
  environment: '',
  platform: '',
  component: '',
  affectedVersion: '',
  fixedInVersion: '',
  reproductionSteps: '',
  expectedBehavior: '',
  actualBehavior: '',
  workaround: '',
  labels: [],
  priority: 'NORMAL',
  assignees: [],
};

// ─── Hook principal ────────────────────────────────────────────────────────────

/**
 * Controller hook pour la page Issues.
 */
export const useIssues = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  // ── Filtres ──
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // ── Formulaire / modales ──
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_ISSUE_FORM });
  const [showReportForm, setShowReportForm] = useState(false);

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(0);
  }, [typeFilter, severityFilter, statusFilter, projectFilter]);

  // ── Queries ──

  const issuesQuery = useQuery({
    queryKey: ['issues', { page: currentPage, size: pageSize, search: debouncedSearchTerm }],
    queryFn: async () => {
      const result = await issueService.getAllIssues(currentPage, pageSize, debouncedSearchTerm);
      if (!result.success) throw new Error(result.error || 'Impossible de charger les issues');
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const statusesQuery = useQuery({
    queryKey: ['issue-statuses'],
    queryFn: async () => {
      const result = await issueService.getStatuses();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const typesQuery = useQuery({
    queryKey: ['issue-types'],
    queryFn: async () => {
      const result = await issueService.getTypes();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const severitiesQuery = useQuery({
    queryKey: ['issue-severities'],
    queryFn: async () => {
      const result = await issueService.getSeverities();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects-flat'],
    queryFn: async () => {
      const result = await projectService.getAllProjects(0, 200);
      if (!result.success) throw new Error(result.error || 'Impossible de charger les projets');
      return result.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const personsQuery = useQuery({
    queryKey: ['persons-flat'],
    queryFn: async () => {
      const result = await personService.getAllPersonsFlat();
      if (!result.success) throw new Error(result.error || 'Impossible de charger les personnes');
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived data ──

  const allIssues = issuesQuery.data?.content || [];

  // Client-side filtering
  const filteredIssues = allIssues.filter((issue) => {
    if (typeFilter && issue.type !== typeFilter) return false;
    if (severityFilter && issue.severity !== severityFilter) return false;
    if (statusFilter && issue.status !== statusFilter) return false;
    if (projectFilter && issue.projectId !== projectFilter) return false;
    return true;
  });

  // ── Mutations ──

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = id
        ? await issueService.updateIssue(id, data)
        : await issueService.createIssue(data);
      if (!result.success) throw new Error(result.error || 'Erreur lors de la sauvegarde');
      return result.data;
    },
    onSuccess: (_, variables) => {
      enqueueSnackbar(
        variables.id ? 'Issue mise à jour avec succès' : 'Issue créée avec succès',
        { variant: 'success' }
      );
      setShowModal(false);
      setShowReportForm(false);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Erreur lors de la sauvegarde', { variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => issueService.deleteIssue(id),
    onSuccess: () => {
      enqueueSnackbar('Issue supprimée avec succès', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: () => {
      enqueueSnackbar("Erreur lors de la suppression de l'issue", { variant: 'error' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ issueId, status }) => issueService.updateIssueStatus(issueId, status),
    onSuccess: () => {
      enqueueSnackbar('Statut mis à jour', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: () => {
      enqueueSnackbar('Erreur lors de la mise à jour du statut', { variant: 'error' });
    },
  });

  // ── Handlers ──

  const handleCreateClick = () => {
    setEditingIssue(null);
    setFormData({ ...EMPTY_ISSUE_FORM });
    setShowReportForm(false);
    setShowModal(true);
  };

  const handleReportBugClick = () => {
    setEditingIssue(null);
    setFormData({ ...EMPTY_ISSUE_FORM, type: 'BUG' });
    setShowReportForm(true);
    setShowModal(true);
  };

  const handleEditClick = (issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title || '',
      description: issue.description || '',
      type: issue.type || 'BUG',
      severity: issue.severity || 'MEDIUM',
      status: issue.status || 'OPEN',
      projectId: issue.projectId || '',
      reporter: issue.reporter || '',
      environment: issue.environment || '',
      platform: issue.platform || '',
      component: issue.component || '',
      affectedVersion: issue.affectedVersion || '',
      fixedInVersion: issue.fixedInVersion || '',
      reproductionSteps: issue.reproductionSteps || '',
      expectedBehavior: issue.expectedBehavior || '',
      actualBehavior: issue.actualBehavior || '',
      workaround: issue.workaround || '',
      labels: issue.labels || [],
      priority: issue.priority || 'NORMAL',
      assignees: issue.assignees || [],
    });
    setShowReportForm(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIssue(null);
    setShowReportForm(false);
    setFormData({ ...EMPTY_ISSUE_FORM });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ id: editingIssue?.id, data: formData });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Supprimer l'issue ?",
      description: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (issueId, status) => {
    statusMutation.mutate({ issueId, status });
  };

  const assignMutation = useMutation({
    mutationFn: async ({ issueId, email }) => {
      const result = await issueService.addAssignee(issueId, email);
      if (!result.success) throw new Error(result.error || "Erreur lors de l'assignation");
      return result.data;
    },
    onSuccess: (updatedIssue) => {
      enqueueSnackbar('Personne assignée', { variant: 'success' });
      if (updatedIssue?.assignees) {
        setFormData((prev) => ({ ...prev, assignees: updatedIssue.assignees }));
      }
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => enqueueSnackbar(error.message || "Erreur lors de l'assignation", { variant: 'error' }),
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ issueId, email }) => {
      const result = await issueService.removeAssignee(issueId, email);
      if (!result.success) throw new Error(result.error || 'Erreur lors du retrait');
      return result.data;
    },
    onSuccess: (updatedIssue) => {
      enqueueSnackbar('Personne retirée', { variant: 'success' });
      if (updatedIssue?.assignees) {
        setFormData((prev) => ({ ...prev, assignees: updatedIssue.assignees }));
      }
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onError: (error) => enqueueSnackbar(error.message || 'Erreur lors du retrait', { variant: 'error' }),
  });

  const handleAssignPerson = (issueId, email) => {
    assignMutation.mutate({ issueId, email });
  };

  const handleUnassignPerson = (issueId, email) => {
    unassignMutation.mutate({ issueId, email });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return {
    // Data
    issues: filteredIssues,
    allIssues,
    pagination: {
      currentPage: issuesQuery.data?.number ?? currentPage,
      totalPages: issuesQuery.data?.totalPages ?? 0,
      totalElements: issuesQuery.data?.totalElements ?? 0,
      size: pageSize,
    },

    // Queries
    issuesQuery,
    statusesQuery,
    typesQuery,
    severitiesQuery,
    projectsQuery,
    personsQuery,

    // Query state
    isLoading: issuesQuery.isLoading,
    isFetching: issuesQuery.isFetching,
    isError: issuesQuery.isError,

    // Mutation state
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Filters
    searchTerm, setSearchTerm,
    typeFilter, setTypeFilter,
    severityFilter, setSeverityFilter,
    statusFilter, setStatusFilter,
    projectFilter, setProjectFilter,
    currentPage,
    pageSize, setPageSize,
    handlePageChange,

    // Form / modal
    showModal,
    editingIssue,
    formData, setFormData,
    showReportForm,

    // Mutations
    saveMutation,
    deleteMutation,
    statusMutation,
    assignMutation,
    unassignMutation,

    // Handlers
    handleCreateClick,
    handleReportBugClick,
    handleEditClick,
    handleCloseModal,
    handleFormChange,
    handleSubmit,
    handleDelete,
    handleStatusChange,
    handleAssignPerson,
    handleUnassignPerson,
  };
};

export default useIssues;
