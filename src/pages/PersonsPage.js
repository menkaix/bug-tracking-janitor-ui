import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Chip,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { formatDateLong } from '../utils/dateUtils';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { usePersons } from '../hooks/usePersons';

const formatDate = (d) => formatDateLong(d) ?? 'N/A';

function PersonsPage() {
  const theme = useTheme();
  const {
    persons,
    loading,
    error,
    pagination,
    copiedEmail,
    showModal,
    editingPerson,
    formData,
    fetchPersons,
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
  } = usePersons();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Gestion des Personnes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination.totalElements} personne(s) au total
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          size="medium"
          sx={{ borderRadius: 2, px: 2, py: 1, fontWeight: 500 }}
        >
          Nouvelle Personne
        </Button>
      </Box>

      {/* Barre de recherche */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par prénom, nom ou email..."
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ maxWidth: 600, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
      </Box>

      {loading && <Loading />}

      {error && !loading && (
        <ErrorMessage message={error} onRetry={fetchPersons} />
      )}

      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 3, boxShadow: 2, mb: 4, overflow: 'hidden' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Nom Complet</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Date de création</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Dernière modification</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {persons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Box sx={{ p: 8, textAlign: 'center' }}>
                        <PeopleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Aucune personne trouvée
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  persons.map((person) => (
                    <TableRow
                      key={person.id}
                      sx={{
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {person.firstName || '-'} {person.lastName || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={copiedEmail === person.email ? 'Copié !' : "Copier l'email"}
                          placement="top"
                        >
                          <Chip
                            icon={copiedEmail === person.email ? <CopyIcon /> : <EmailIcon />}
                            label={person.email}
                            size="small"
                            color={copiedEmail === person.email ? 'success' : 'primary'}
                            variant="outlined"
                            onClick={() => handleCopyEmail(person.email)}
                            clickable
                            sx={{
                              borderRadius: 2,
                              cursor: 'pointer',
                              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                            }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2">{formatDate(person.creationDate)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="body2">{formatDate(person.updateDate)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Modifier">
                            <IconButton
                              onClick={() => handleEditClick(person)}
                              color="primary"
                              size="small"
                              sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              onClick={() =>
                                handleDelete(
                                  person.id,
                                  `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
                                )
                              }
                              color="error"
                              size="small"
                              sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              pageSize={pagination.size}
              onPageChange={handlePageChange}
              onSizeChange={handleSizeChange}
            />
          )}
        </>
      )}

      {/* Modale de création/édition */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              {editingPerson ? 'Modifier la personne' : 'Nouvelle personne'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleFormChange}
                placeholder="Jean"
                InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
              <TextField
                fullWidth
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                placeholder="Dupont"
                InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
              <TextField
                fullWidth
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="jean.dupont@example.com"
                required
                InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} variant="outlined" size="large">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={editingPerson ? <EditIcon /> : <AddIcon />}
            >
              {editingPerson ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default PersonsPage;
