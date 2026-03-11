import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Stack, Container } from '@mui/material';

const StatCardSkeleton = () => (
  <Card>
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="text" width="50%" height={20} />
      </Stack>
      <Skeleton variant="text" width="40%" height={40} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="60%" height={16} />
    </CardContent>
  </Card>
);

const TableRowSkeleton = () => (
  <Box sx={{ display: 'flex', gap: 2, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Skeleton variant="text" width="25%" />
    <Skeleton variant="text" width="10%" />
    <Skeleton variant="text" width="10%" />
    <Skeleton variant="text" width="10%" />
    <Skeleton variant="rectangular" width={80} height={22} sx={{ borderRadius: 1 }} />
    <Skeleton variant="rectangular" width={100} height={6} sx={{ borderRadius: 1, alignSelf: 'center', flex: 1 }} />
  </Box>
);

const DashboardSkeleton = () => (
  <Container maxWidth="xl" sx={{ py: 2 }}>
    {/* Titre */}
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="text" width={320} height={20} />
    </Box>

    {/* KPI cards — rangée 1 */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* KPI cards — rangée 2 */}
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>

    {/* Tabs skeleton */}
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={3}>
        {['Projets', 'Personnes', 'Calendrier'].map((label) => (
          <Skeleton key={label} variant="text" width={90} height={36} />
        ))}
      </Stack>
    </Box>

    {/* Table skeleton */}
    <Card>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" gap={2}>
          <Skeleton variant="text" width="25%" height={20} />
          <Skeleton variant="text" width="10%" height={20} />
          <Skeleton variant="text" width="10%" height={20} />
          <Skeleton variant="text" width="10%" height={20} />
          <Skeleton variant="text" width="15%" height={20} />
          <Skeleton variant="text" flex={1} height={20} />
        </Stack>
      </Box>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </Card>
  </Container>
);

export default DashboardSkeleton;
