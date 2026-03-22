import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon, ViewList as ViewListIcon, ViewKanban as ViewKanbanIcon, Folder as FolderIcon } from '@mui/icons-material';
import { useTasks } from '../hooks/useTasks';
import ErrorMessage from '../components/Common/ErrorMessage';
import TaskListSkeleton, { KanbanBoardSkeleton } from '../components/Common/TaskSkeleton';
import Pagination from '../components/Common/Pagination';
import KanbanBoard from '../components/Tasks/KanbanBoard';
import TaskFilters from '../components/Tasks/TaskFilters';
import TaskBulkActions from '../components/Tasks/TaskBulkActions';
import TaskList from '../components/Tasks/TaskList';
import TaskForm from '../components/Tasks/TaskForm';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Page de gestion des tâches.
 * Rôle : orchestrer les composants et le hook useTasks.
 * Toute la logique métier est dans useTasks.
 */
const TasksPage = () => {
  const queryClient = useQueryClient();
  const {
    tasks, projects, persons, pagination,
    isLoading, isFetching, isError, tasksError,
    noProjectSelected,
    searchTerm, setSearchTerm,
    projectFilter, toggleProjectFilter, clearProjectFilter,
    statusFilter, toggleStatusFilter, clearStatusFilter,
    assigneeFilter, toggleAssigneeFilter, clearAssigneeFilter,
    viewMode, setViewMode,
    pageSize,
    handlePageChange, handlePageSizeChange,
    showModal, setShowModal,
    editingTask,
    formData, setFormData,
    handleAssigneeToggle,
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleSubmit,
    handleStatusChange,
    handleProjectChange,
    handleAddAssignee,
    handleRemoveAssignee,
    selectedTasks, setSelectedTasks,
    handleSelectAll, handleSelectTask,
    handleBulkDelete, handleBulkStatusChange, handleBulkAssign,
  } = useTasks();

  if (isLoading) return viewMode === 1 ? <KanbanBoardSkeleton /> : <TaskListSkeleton />;
  if (isError) return (
    <ErrorMessage
      message={tasksError?.message || 'Erreur lors du chargement des tâches'}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>Gestion des Tâches</Typography>
          <Typography variant="body2" color="text.secondary">{pagination.totalElements} tâche(s) au total</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask} size="medium" sx={{ borderRadius: 2, px: 2, py: 1, fontWeight: 500 }}>
          Nouvelle Tâche
        </Button>
      </Box>

      {/* Onglets vue */}
      <Paper sx={{ mb: 3, borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
        <Tabs
          value={viewMode}
          onChange={(_, v) => setViewMode(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { minHeight: 56, fontWeight: 500 } }}
        >
          <Tab icon={<ViewListIcon />} iconPosition="start" label="Liste" sx={{ px: 4 }} />
          <Tab icon={<ViewKanbanIcon />} iconPosition="start" label="Kanban" sx={{ px: 4 }} />
        </Tabs>
      </Paper>

      {/* Filtres */}
      <TaskFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        projectFilter={projectFilter}
        onToggleProject={toggleProjectFilter}
        onClearProject={clearProjectFilter}
        statusFilter={statusFilter}
        onToggleStatus={toggleStatusFilter}
        onClearStatus={clearStatusFilter}
        assigneeFilter={assigneeFilter}
        onToggleAssignee={toggleAssigneeFilter}
        onClearAssignee={clearAssigneeFilter}
        projects={projects}
        persons={persons}
      />

      {isFetching && <Box sx={{ height: 3, width: '100%', background: 'linear-gradient(90deg, transparent, primary.main, transparent)' }} />}

      {/* État vide — aucun projet sélectionné */}
      {noProjectSelected && (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 3, boxShadow: 2 }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>Sélectionnez au moins un projet</Typography>
          <Typography variant="body2" color="text.disabled">Les tâches sont chargées projet par projet pour éviter les téléchargements massifs.</Typography>
        </Paper>
      )}

      {/* Vue Liste */}
      {!noProjectSelected && viewMode === 0 && (
        <>
          <TaskBulkActions
            selectedCount={selectedTasks.length}
            persons={persons}
            onClearSelection={() => setSelectedTasks([])}
            onBulkDelete={handleBulkDelete}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkAssign={handleBulkAssign}
          />

          <TaskList
            tasks={tasks}
            projects={projects}
            persons={persons}
            selectedTasks={selectedTasks}
            isLoading={isLoading}
            isFetching={isFetching}
            onSelectAll={handleSelectAll}
            onSelectTask={handleSelectTask}
            onStatusChange={handleStatusChange}
            onProjectChange={handleProjectChange}
            onAddAssignee={handleAddAssignee}
            onRemoveAssignee={handleRemoveAssignee}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}

      {/* Vue Kanban */}
      {!noProjectSelected && viewMode === 1 && (
        <KanbanBoard
          tasks={tasks}
          persons={persons}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal création/édition */}
      <TaskForm
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onFormChange={setFormData}
        onAssigneeToggle={handleAssigneeToggle}
        editingTask={editingTask}
        projects={projects}
        persons={persons}
      />
    </Container>
  );
};

export default TasksPage;
