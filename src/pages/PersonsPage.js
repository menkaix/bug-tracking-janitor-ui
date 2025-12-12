import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/icons-material';
import personService from '../services/person.service';
import logger from '../services/logger.service';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';

function PersonsPage() {
  const theme = useTheme();
  // États pour la liste des personnes
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la pagination
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10
  });

  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // États pour la modale
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Charger les personnes
  const fetchPersons = useCallback(async (page = 0, size = pagination.size) => {
    try {
      setLoading(true);
      setError(null);
      logger.debug(`Fetching persons - page: ${page}, size: ${size}, search: ${searchTerm}`);

      const result = await personService.getAllPersons(page, size, searchTerm);

      if (result.success) {
        setPersons(result.data.content || []);
        setPagination({
          currentPage: result.data.number || result.data.currentPage || 0,
          totalPages: result.data.totalPages || 0,
          totalElements: result.data.totalElements || 0,
          size: result.data.size || size
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      logger.error('Error in fetchPersons:', err);
      setError('Erreur lors du chargement des personnes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, pagination.size]);

  // Effet pour charger les personnes au montage et lors des changements
  useEffect(() => {
    fetchPersons(pagination.currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Gérer la recherche avec debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;

    // Annuler le timeout précédent
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Définir un nouveau timeout
    const timeout = setTimeout(() => {
      setSearchTerm(value);
      setPagination(prev => ({ ...prev, currentPage: 0 }));
    }, 500);

    setSearchTimeout(timeout);
  };

  // Gérer le changement de page
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    fetchPersons(newPage, pagination.size);
  };

  // Gérer le changement de taille de page
  const handleSizeChange = (newSize) => {
    setPagination(prev => ({ ...prev, size: newSize, currentPage: 0 }));
    fetchPersons(0, newSize);
  };

  // Ouvrir la modale pour créer une personne
  const handleCreateClick = () => {
    setEditingPerson(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: ''
    });
    setShowModal(true);
  };

  // Ouvrir la modale pour éditer une personne
  const handleEditClick = (person) => {
    setEditingPerson(person);
    setFormData({
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      email: person.email || ''
    });
    setShowModal(true);
  };

  // Fermer la modale
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: ''
    });
  };

  // Gérer les changements dans le formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation de l'email
    if (!formData.email || !formData.email.trim()) {
      alert('L\'email est obligatoire');
      return;
    }

    try {
      setLoading(true);
      let result;

      if (editingPerson) {
        // Mise à jour
        result = await personService.updatePerson(editingPerson.id, formData);
      } else {
        // Création
        result = await personService.createPerson(formData);
      }

      if (result.success) {
        handleCloseModal();
        fetchPersons(pagination.currentPage, pagination.size);
      } else {
        alert(result.error || 'Erreur lors de l\'opération');
      }
    } catch (err) {
      logger.error('Error in handleSubmit:', err);
      alert('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une personne
  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await personService.deletePerson(id);

      if (result.success) {
        // Si on supprime le dernier élément d'une page, revenir à la page précédente
        if (persons.length === 1 && pagination.currentPage > 0) {
          handlePageChange(pagination.currentPage - 1);
        } else {
          fetchPersons(pagination.currentPage, pagination.size);
        }
      } else {
        alert(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      logger.error('Error in handleDelete:', err);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1,
            fontWeight: 500,
          }}
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
          sx={{
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />
      </Box>

      {/* Affichage du loading */}
      {loading && <Loading />}

      {/* Affichage des erreurs */}
      {error && !loading && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchPersons(pagination.currentPage, pagination.size)}
        />
      )}

      {/* Tableau des personnes */}
      {!loading && !error && (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              boxShadow: 2,
              mb: 4,
              overflow: 'hidden',
            }}
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
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight={600}>
                          {person.firstName || '-'} {person.lastName || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<EmailIcon />}
                          label={person.email}
                          size="small"
                          color="primary"
                          variant="outlined"
                          component="a"
                          href={`mailto:${person.email}`}
                          clickable
                          sx={{
                            borderRadius: 2,
                            textDecoration: 'none',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        />
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
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                },
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <IconButton
                              onClick={() => handleDelete(
                                person.id,
                                `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email
                              )}
                              color="error"
                              size="small"
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                                },
                              }}
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

          {/* Pagination */}
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
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
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
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <TextField
                fullWidth
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleFormChange}
                placeholder="Dupont"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
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
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} variant="outlined" size="large">
              Annuler
            </Button>
            <Button type="submit" variant="contained" size="large" startIcon={editingPerson ? <EditIcon /> : <AddIcon />}>
              {editingPerson ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default PersonsPage;
