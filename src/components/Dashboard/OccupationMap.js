import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  Tooltip,
  useTheme,
  Paper,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Assignment as AssignmentIcon,
  SentimentDissatisfied as EmptyIcon,
} from '@mui/icons-material';
import taskService from '../../services/task.service';

const STATUS_META = {
  'todo':        { label: 'À faire',           color: 'secondary' },
  'pending':     { label: 'En attente',         color: 'warning'   },
  'in-progress': { label: 'En cours',           color: 'info'      },
  'to-study':    { label: 'À étudier',          color: 'default'   },
  'done':        { label: 'Terminé',            color: 'success'   },
  'to-test':     { label: 'À tester',           color: 'info'      },
  'testing':     { label: 'En cours de test',   color: 'info'      },
  'canceled':    { label: 'Annulé',             color: 'error'     },
};

const getStatusMeta = (status) =>
  STATUS_META[(status || '').toLowerCase()] || { label: status || '—', color: 'default' };

const ACTIVE_STATUSES = new Set(['todo', 'in-progress', 'to-study', 'to-test', 'testing', 'pending']);

const STATUS_ORDER = { 'in-progress': 0, 'testing': 1, 'to-test': 2, 'todo': 3, 'to-study': 4, 'pending': 5 };
const sortByStatus = (a, b) => {
  const orderA = STATUS_ORDER[(a.status || '').toLowerCase()] ?? 99;
  const orderB = STATUS_ORDER[(b.status || '').toLowerCase()] ?? 99;
  return orderA - orderB;
};

// Fonction pure extraite pour éviter sa recréation à chaque render
const getInitials = (person) => {
  const first = person.firstName?.[0] || '';
  const last = person.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
};

const OccupationMap = ({ persons = [], projects = [], onTaskClick }) => {
  const theme = useTheme();

  const projectCodeMap = useMemo(() =>
    Object.fromEntries(projects.map(p => [p.id, p.projectCode || p.code || ''])),
  [projects]);

  // Récupère les tâches de chaque personne via l'endpoint dédié (sans limite de pagination)
  const taskQueries = useQueries({
    queries: persons.map(person => ({
      queryKey: ['tasks', 'by-assignee', person.email],
      queryFn: () => taskService.getTasksByAssignee(person.email),
      enabled: !!person.email,
      staleTime: 5 * 60 * 1000,
      select: (result) => result.success ? (result.data || []) : [],
    })),
  });

  const isLoading = taskQueries.some(q => q.isLoading || q.isFetching);

  const rows = useMemo(() => {
    return persons
      .map((person, i) => {
        const personTasks = taskQueries[i]?.data || [];
        const activeTasks = personTasks
          .filter(t => ACTIVE_STATUSES.has((t.status || '').toLowerCase()))
          .sort(sortByStatus);
        return { ...person, activeTasks, totalTasks: personTasks.length };
      })
      .sort((a, b) => b.activeTasks.length - a.activeTasks.length);
  }, [persons, taskQueries]); // eslint-disable-line react-hooks/exhaustive-deps

  if (persons.length === 0) {
    return (
      <Paper elevation={0} variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <EmptyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">Aucune personne trouvée</Typography>
      </Paper>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {rows.map(person => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={person.id}>
          <Card
            elevation={0}
            variant="outlined"
            sx={{
              height: '100%',
              borderColor: person.activeTasks.length > 0
                ? alpha(theme.palette.primary.main, 0.3)
                : theme.palette.divider,
              transition: 'box-shadow 0.2s',
              '&:hover': { boxShadow: theme.shadows[3] },
            }}
          >
            <CardContent>
              {/* En-tête personne */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: person.activeTasks.length > 0
                      ? theme.palette.primary.main
                      : theme.palette.action.disabledBackground,
                    width: 40,
                    height: 40,
                    fontWeight: 600,
                  }}
                >
                  {getInitials(person)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {person.firstName} {person.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {person.email || ''}
                  </Typography>
                </Box>
                <Chip
                  label={person.activeTasks.length}
                  size="small"
                  color={person.activeTasks.length > 0 ? 'primary' : 'default'}
                  sx={{ fontWeight: 600, minWidth: 28 }}
                />
              </Box>

              {/* Liste des tâches actives */}
              {person.activeTasks.length === 0 ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                  <AssignmentIcon fontSize="small" />
                  <Typography variant="body2">Aucune tâche en cours</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {person.activeTasks.map(task => {
                    const meta = getStatusMeta(task.status);
                    const projectCode = projectCodeMap[task.projectId] || '';
                    return (
                      <Tooltip
                        key={task.id}
                        title={
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {task.title}
                            </Typography>
                            {task.trackingReference && (
                              <Typography variant="caption" display="block">
                                Réf : {task.trackingReference}
                              </Typography>
                            )}
                            {projectCode && (
                              <Typography variant="caption" display="block">
                                Projet : {projectCode}
                              </Typography>
                            )}
                            {(task.deadLine || task.dueDate) && (
                              <Typography variant="caption" display="block">
                                Échéance : {new Date(task.deadLine || task.dueDate).toLocaleDateString('fr-FR')}
                              </Typography>
                            )}
                          </Box>
                        }
                      >
                        <Box
                          onClick={() => onTaskClick?.(task)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 0.75,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: alpha(theme.palette.action.hover, 0.5),
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                          }}
                        >
                          <Chip
                            label={meta.label}
                            size="small"
                            color={meta.color}
                            sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                          />
                          {projectCode && (
                            <Chip
                              label={projectCode}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18, flexShrink: 0 }}
                            />
                          )}
                          <Typography variant="caption" sx={{ flex: 1 }}>
                            {task.title?.length > 32 ? `${task.title.slice(0, 32)}…` : task.title}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default OccupationMap;
