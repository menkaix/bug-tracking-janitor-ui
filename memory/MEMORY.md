# Project Memory: bug-tracking-janitor-ui

## Project Overview
A bug tracking UI built with React. Manages projects, tasks, and persons. Features a Kanban board, dashboard with KPIs, and a tasks page with filtering/sorting.

---

## Dependencies Added
- `@tanstack/react-query` — server state management (caching, loading states, mutations)
- `notistack` — snackbar/toast notifications (replaces all `alert()` calls)

---

## Architecture: React Query Setup

### src/queryClient.js
Central QueryClient configuration:
- `staleTime`: 2 minutes
- `gcTime`: 10 minutes
- `retry`: 1
- `refetchOnWindowFocus`: false

### App.js
- `QueryClientProvider` wraps the entire app (uses the queryClient from `src/queryClient.js`)
- `SnackbarProvider` (notistack) also added at the app root level

---

## Migrated Files

### Dashboard.js
- `fetchDashboardData`: pure async function (no setState side effects)
- `useQuery(['dashboard'])`: drives all dashboard data
- `useMemo`: computes KPIs — `calculateProjectKPIs` and `calculatePersonKPIs` now return values instead of calling `setState`
- `DashboardSkeleton`: shown while loading
- `queryClient.invalidateQueries(['dashboard'])`: called after a task is saved
- All `alert()` replaced with `enqueueSnackbar` (notistack)

### TasksPage.js
- `fetchTasksData`: pure function wrapping complex filter/sort logic
- `useQuery(['projects'], fetchProjects, { staleTime: 5min })`
- `useQuery(['persons'], fetchPersons, { staleTime: 5min })`
- `useQuery(['tasks', taskQueryParams], ..., { keepPreviousData: true })`: key includes all active filter/sort/page params
- `useMutation`: handles task status changes
  - Optimistic update via `queryClient.setQueryData`
  - `optimisticTaskUpdate`: helper function for cache manipulation
- `debounced search term`: resets page to 0 on change
- `TaskListSkeleton` and `KanbanBoardSkeleton`: shown on initial load
- All `alert()` replaced with `enqueueSnackbar`

### KanbanBoard.js
- `localOverrides` state: provides instant visual feedback on drag-and-drop before the parent state propagates
- `tasksWithOverrides`: computed array merging real task data with local overrides

---

## Conventions & Patterns
- Query keys are arrays: `['dashboard']`, `['projects']`, `['persons']`, `['tasks', taskQueryParams]`
- Pure fetch functions (no setState) are defined outside components for reuse and testability
- Optimistic updates use `queryClient.setQueryData` directly in `useMutation.onMutate`
- `enqueueSnackbar` is used universally instead of `alert()` for user feedback
- Skeleton components are used for initial load states (not spinners)
