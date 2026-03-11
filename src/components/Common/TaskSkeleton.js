import React from 'react';
import {
  Box, Card, CardContent, Skeleton, Stack,
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper,
} from '@mui/material';

/**
 * Skeleton pour une carte de tâche Kanban
 */
export const KanbanCardSkeleton = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width="75%" height={20} />
        <Skeleton variant="rectangular" width={80} height={18} sx={{ borderRadius: 1 }} />
        <Stack direction="row" spacing={0.5}>
          <Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={60} height={18} sx={{ borderRadius: 1 }} />
        </Stack>
        <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: 1 }} />
      </Stack>
    </CardContent>
  </Card>
);

/**
 * Skeleton pour la colonne Kanban
 */
export const KanbanColumnSkeleton = () => (
  <Box sx={{ minWidth: 300, maxWidth: 350 }}>
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={100} height={24} />
        <Skeleton variant="circular" width={20} height={20} />
      </Stack>
      {Array.from({ length: 3 }).map((_, i) => (
        <KanbanCardSkeleton key={i} />
      ))}
    </Paper>
  </Box>
);

/**
 * Skeleton pour le board Kanban complet
 */
export const KanbanBoardSkeleton = () => (
  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, px: 1 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <KanbanColumnSkeleton key={i} />
    ))}
  </Box>
);

/**
 * Skeleton pour une ligne de la liste de tâches
 */
export const TaskRowSkeleton = () => (
  <TableRow>
    <TableCell padding="checkbox">
      <Skeleton variant="rectangular" width={18} height={18} />
    </TableCell>
    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
    <TableCell><Skeleton variant="rectangular" width={80} height={22} sx={{ borderRadius: 1 }} /></TableCell>
    <TableCell><Skeleton variant="text" width={60} /></TableCell>
    <TableCell><Skeleton variant="text" width={80} /></TableCell>
    <TableCell><Skeleton variant="text" width={70} /></TableCell>
    <TableCell><Skeleton variant="text" width={70} /></TableCell>
    <TableCell>
      <Stack direction="row" spacing={0.5}>
        <Skeleton variant="circular" width={28} height={28} />
        <Skeleton variant="circular" width={28} height={28} />
      </Stack>
    </TableCell>
  </TableRow>
);

/**
 * Skeleton pour la liste de tâches complète
 */
const TaskListSkeleton = ({ rows = 8 }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          {['', 'Titre', 'Statut', 'Projet', 'Assigné', 'Début', 'Échéance', 'Actions'].map((h) => (
            <TableCell key={h}>
              <Skeleton variant="text" width={h ? '80%' : 18} height={20} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TaskRowSkeleton key={i} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default TaskListSkeleton;
