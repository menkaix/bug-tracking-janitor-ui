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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Divider,
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
  Psychology as SkillsIcon,
  RemoveCircleOutline as RemoveIcon,
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
    skillsDialogPerson,
    allSkills,
    addSkillDialogOpen,
    setAddSkillDialogOpen,
    selectedSkillId,
    setSelectedSkillId,
    selectedLevel,
    setSelectedLevel,
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
    handleOpenSkillsDialog,
    handleCloseSkillsDialog,
    handleAddSkill,
    handleUpdateSkillLevel,
    handleRemoveSkill,
  } = usePersons();

  const SKILL_LEVEL_CONFIG = {
    NEVER_HEARD:      { label: "Jamais entendu", value: 0, color: 'default' },
    HEARD_OF:         { label: "Entendu parler", value: 1, color: 'default' },
    THEORETICAL:      { label: "Théorique",      value: 2, color: 'info' },
    POC:              { label: "PoC réalisé",     value: 3, color: 'warning' },
    ONE_PROJECT:      { label: "1 projet réel",   value: 4, color: 'primary' },
    SEVERAL_PROJECTS: { label: "Plusieurs projets", value: 5, color: 'primary' },
    REGULAR_USE:      { label: "Usage régulier",  value: 6, color: 'success' },
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
                          <Typography variant="body2">{formatDate(person.lastUpdateDate)}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Compétences">
                            <IconButton
                              onClick={() => handleOpenSkillsDialog(person)}
                              color="secondary"
                              size="small"
                              sx={{ '&:hover': { backgroundColor: alpha(theme.palette.secondary.main, 0.1) } }}
                            >
                              <SkillsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                multiline
                rows={3}
                placeholder="Rôle, spécialités, notes…"
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

      {/* Dialog de gestion des compétences */}
      <Dialog
        open={Boolean(skillsDialogPerson)}
        onClose={handleCloseSkillsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <SkillsIcon color="secondary" />
              <Typography variant="h5" fontWeight={700}>
                Compétences — {skillsDialogPerson?.firstName} {skillsDialogPerson?.lastName}
              </Typography>
            </Stack>
            <IconButton onClick={handleCloseSkillsDialog} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {/* Liste des skills existants */}
          {skillsDialogPerson?.skills?.length === 0 || !skillsDialogPerson?.skills ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <SkillsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Aucune compétence enregistrée</Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mb: 2 }}>
              {(skillsDialogPerson?.skills || []).map((ps) => {
                const cfg = SKILL_LEVEL_CONFIG[ps.level] || { label: ps.level, value: 0, color: 'default' };
                return (
                  <Box key={ps.skillId} sx={{
                    p: 2, borderRadius: 2, border: 1, borderColor: 'divider',
                    '&:hover': { borderColor: 'primary.main', backgroundColor: alpha(theme.palette.primary.main, 0.02) },
                  }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={700}>{ps.skillName}</Typography>
                          <Chip label={cfg.label} size="small" color={cfg.color} sx={{ borderRadius: 1 }} />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(cfg.value / 6) * 100}
                          color={cfg.color === 'default' ? 'inherit' : cfg.color}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <Select
                            value={ps.level}
                            onChange={(e) => handleUpdateSkillLevel(ps.skillId, e.target.value)}
                            sx={{ borderRadius: 2 }}
                          >
                            {Object.entries(SKILL_LEVEL_CONFIG).map(([key, val]) => (
                              <MenuItem key={key} value={key}>{val.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Tooltip title="Retirer">
                          <IconButton size="small" color="error"
                            onClick={() => handleRemoveSkill(ps.skillId)}
                            sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Ajouter un skill */}
          {addSkillDialogOpen ? (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={600}>Ajouter une compétence</Typography>
              <Stack direction="row" spacing={2} alignItems="flex-end">
                <FormControl fullWidth>
                  <InputLabel>Skill</InputLabel>
                  <Select
                    value={selectedSkillId}
                    label="Skill"
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {allSkills
                      .filter((s) => !(skillsDialogPerson?.skills || []).some((ps) => ps.skillId === s.id))
                      .map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {s.name} {s.category && `· ${s.category}`}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Niveau</InputLabel>
                  <Select
                    value={selectedLevel}
                    label="Niveau"
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {Object.entries(SKILL_LEVEL_CONFIG).map(([key, val]) => (
                      <MenuItem key={key} value={key}>{val.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={() => setAddSkillDialogOpen(false)} variant="outlined">Annuler</Button>
                <Button
                  onClick={handleAddSkill}
                  variant="contained"
                  disabled={!selectedSkillId}
                  startIcon={<AddIcon />}
                >
                  Ajouter
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddSkillDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Ajouter une compétence
            </Button>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseSkillsDialog} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PersonsPage;
