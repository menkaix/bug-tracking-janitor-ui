import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';

/**
 * Composant de pagination réutilisable - Style Material UI 2025
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const safeCurrentPage = currentPage ?? 0;
  const safePageSize = pageSize ?? 10;
  const safeTotalElements = totalElements ?? 0;

  const startItem = safeTotalElements > 0 ? safeCurrentPage * safePageSize + 1 : 0;
  const endItem =
    safeTotalElements > 0
      ? Math.min((safeCurrentPage + 1) * safePageSize, safeTotalElements)
      : 0;

  const handlePageChange = (event, value) => {
    onPageChange(value - 1); // MUI Pagination uses 1-based indexing
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        px: { xs: 1, sm: 0 },
      }}
    >
      {/* Info et sélecteur de taille */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}
      >
        {totalElements > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Affichage {startItem} - {endItem} sur {safeTotalElements}
          </Typography>
        )}

        {onPageSizeChange && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="page-size-label">Par page</InputLabel>
            <Select
              labelId="page-size-label"
              id="pageSize"
              value={pageSize}
              label="Par page"
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <MuiPagination
          count={totalPages}
          page={safeCurrentPage + 1} // MUI Pagination uses 1-based indexing
          onChange={handlePageChange}
          color="primary"
          size={isMobile ? 'small' : 'medium'}
          showFirstButton
          showLastButton
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: 2,
              fontWeight: 500,
            },
            '& .MuiPaginationItem-root.Mui-selected': {
              fontWeight: 600,
            },
          }}
        />
      )}
    </Box>
  );
};

export default Pagination;
