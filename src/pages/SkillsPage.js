import React from 'react';
import {
  Container, Typography, Box, Button, TextField, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, alpha, useTheme, Select, MenuItem, FormControl,
  InputLabel, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Close as CloseIcon,
  Psychology as SkillIcon, FilterList as FilterIcon,
} from '@mui/icons-material';
import Loading from '../components/Common/Loading';
import ErrorMessage from '../components/Common/ErrorMessage';
import { useSkills } from '../hooks/useSkills';

function SkillsPage() {
  const theme = useTheme();
  const {
    skills, categories, loading, error,
    searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
    showModal, editingSkill, formData, tagsInput,
    fetchSkills, handleCreateClick, handleEditClick, handleCloseModal,
    handleFormChange, handleTagsInputChange, handleSubmit, handleDelete,
  } = useSkills();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Catalogue de Skills
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {skills.length} skill(s) affiché(s)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          sx={{ borderRadius: 2, px: 2, py: 1, fontWeight: 500 }}
        >
          Nouveau Skill
        </Button>
      </Box>

      {/* Filtres */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <TextField
          fullWidth
          placeholder="Rechercher par nom, catégorie ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ maxWidth: 450, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <FilterIcon fontSize="small" />
              <span>Catégorie</span>
            </Stack>
          </InputLabel>
          <Select
            value={categoryFilter}
            label="Catégorie"
            onChange={(e) => setCategoryFilter(e.target.value)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">Toutes les catégories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading && <Loading />}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchSkills} />}

      {!loading && !error && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Nom</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Catégorie</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {skills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ p: 8, textAlign: 'center' }}>
                      <SkillIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Aucun skill trouvé
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                skills.map((skill) => (
                  <TableRow
                    key={skill.id}
                    sx={{
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>{skill.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {skill.category ? (
                        <Chip label={skill.category} size="small" color="primary" variant="outlined" sx={{ borderRadius: 1 }} />
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{
                        maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {skill.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(skill.tags || []).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: 1, fontSize: '0.7rem' }} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Modifier">
                          <IconButton size="small" color="primary" onClick={() => handleEditClick(skill)}
                            sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton size="small" color="error" onClick={() => handleDelete(skill.id, skill.name)}
                            sx={{ '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) } }}>
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
      )}

      {/* Modale création/édition */}
      <Dialog open={showModal} onClose={handleCloseModal} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              {editingSkill ? 'Modifier le skill' : 'Nouveau skill'}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small"><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ py: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth label="Nom du skill" name="name"
                value={formData.name} onChange={handleFormChange}
                placeholder="Ex: React, Java, Docker…" required
                InputProps={{ startAdornment: <SkillIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              />
              <TextField
                fullWidth label="Catégorie" name="category"
                value={formData.category} onChange={handleFormChange}
                placeholder="Ex: Frontend, Backend, DevOps…"
              />
              <TextField
                fullWidth label="Description" name="description"
                value={formData.description} onChange={handleFormChange}
                multiline rows={3} placeholder="Décrivez ce skill…"
              />
              <TextField
                fullWidth label="Tags (séparés par des virgules)"
                value={tagsInput} onChange={handleTagsInputChange}
                placeholder="Ex: javascript, framework, web"
                helperText="Séparez les tags par des virgules"
              />
              {formData.tags?.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {formData.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                  ))}
                </Stack>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseModal} variant="outlined" size="large">Annuler</Button>
            <Button type="submit" variant="contained" size="large"
              startIcon={editingSkill ? <EditIcon /> : <AddIcon />}>
              {editingSkill ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default SkillsPage;
