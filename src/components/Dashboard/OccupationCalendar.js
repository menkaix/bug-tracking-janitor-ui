import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  useTheme,
  Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWeekend, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction pure extraite du composant pour éviter sa recréation à chaque render
const getTasksForDay = (personTasks, day) => {
  return personTasks.filter(task => {
    if (!task.plannedStart) return false;
    const startDate = new Date(task.plannedStart);
    if (!isValid(startDate)) return false;
    const checkDay = new Date(day);
    checkDay.setHours(0, 0, 0, 0);
    const taskStart = new Date(startDate);
    taskStart.setHours(0, 0, 0, 0);
    if (task.deadLine || task.dueDate) {
      const endDate = new Date(task.deadLine || task.dueDate);
      if (isValid(endDate)) {
        endDate.setHours(23, 59, 59, 999);
        return isWithinInterval(checkDay, { start: taskStart, end: endDate });
      }
    }
    return isSameDay(checkDay, taskStart);
  });
};

const OccupationCalendar = ({ tasks = [], persons = [], onTaskClick }) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode] = useState('month'); // 'month' or 'week'

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days for the header
  const days = useMemo(() => {
    let start, end;
    if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    }
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  // Process data to map persons to their tasks for the current view
  const rows = useMemo(() => {
    return persons.map(person => {
      const personTasks = tasks.filter(task => {
        if (!task.assignee) return false;
        const assignees = task.assignee.toLowerCase().split(',').map(s => s.trim());
        return assignees.includes(person.email?.toLowerCase());
      });

      return {
        ...person,
        tasks: personTasks,
      };
    }).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
  }, [persons, tasks]);

  const getTaskStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'done') return 'success';
    if (s === 'in-progress' || s === 'inprogress') return 'warning';
    if (s === 'todo' || s === 'to-do') return 'info';
    if (s === 'pending') return 'default';
    return 'default';
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
      {/* Header Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrev} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ minWidth: 200, textAlign: 'center' }}>
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </Typography>
          <IconButton onClick={handleNext} size="small">
            <ChevronRightIcon />
          </IconButton>
          <Button
            startIcon={<TodayIcon />}
            onClick={handleToday}
            size="small"
            variant="outlined"
            sx={{ ml: 2 }}
          >
            Aujourd'hui
          </Button>
        </Box>
        <Box>
          {/* View switcher could go here */}
        </Box>
      </Box>

      {/* Calendar Grid */}
      <TableContainer sx={{
        maxHeight: '70vh',
        '&::-webkit-scrollbar': { width: 8, height: 8 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#e0e0e0', borderRadius: 4 }
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  width: 200,
                  minWidth: 200,
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  backgroundColor: 'background.paper',
                  borderRight: `1px solid ${theme.palette.divider}`
                }}
              >
                Personne
              </TableCell>
              {days.map(day => (
                <TableCell
                  key={day.toISOString()}
                  align="center"
                  sx={{
                    minWidth: 40,
                    backgroundColor: isToday(day) ? alpha(theme.palette.primary.main, 0.1) : (isWeekend(day) ? alpha(theme.palette.action.hover, 0.5) : 'background.paper'),
                    color: isToday(day) ? 'primary.main' : 'text.primary',
                    fontWeight: isToday(day) ? 'bold' : 'normal',
                    borderLeft: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                      {format(day, 'EEE', { locale: fr })}
                    </Typography>
                    <Typography variant="body2">
                      {format(day, 'd')}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(person => {
              return (
                <TableRow key={person.id} hover>
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      backgroundColor: 'background.paper',
                      zIndex: 2,
                      borderRight: `1px solid ${theme.palette.divider}`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.75rem',
                          bgcolor: theme.palette.secondary.main
                        }}
                      >
                        {person.firstName ? person.firstName[0] : '?'}
                      </Avatar>
                      <Typography variant="body2" noWrap>
                        {person.firstName} {person.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  {days.map(day => {
                    const dayTasks = getTasksForDay(person.tasks, day);
                    const isWknd = isWeekend(day);
                    return (
                      <TableCell
                        key={day.toISOString()}
                        sx={{
                          p: 0.5,
                          backgroundColor: isToday(day) ? alpha(theme.palette.primary.main, 0.05) : (isWknd ? alpha(theme.palette.action.hover, 0.5) : 'inherit'),
                          borderLeft: `1px solid ${theme.palette.divider}`,
                          verticalAlign: 'top',
                          height: 50
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {dayTasks.map(task => (
                            <Tooltip key={task.id} title={
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{task.taskName}</Typography>
                                <Typography variant="caption">{task.status}</Typography>
                              </Box>
                            }>
                              <Chip
                                label={task.trackingReference || task.taskCode || task.taskName}
                                size="small"
                                onClick={() => onTaskClick && onTaskClick(task)}
                                color={getTaskStatusColor(task.status)}
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  width: '100%',
                                  cursor: 'pointer',
                                  '& .MuiChip-label': { px: 0.5 }
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={days.length + 1} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune personne trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default OccupationCalendar;
