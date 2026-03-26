import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import { TASK_STATUS_OPTIONS, ISSUE_STATUS_OPTIONS, getTaskStatusInfo, getIssueStatusInfo, isIssue } from '../../models/task.model';
import AbstractEntityEditor from '../Common/AbstractEntityEditor';

/**
 * Dialogue de création / édition d'une tâche.
 */
const TaskForm = ({
  open,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  onAssigneeToggle,
  editingTask,
  projects,
  persons,
}) => {
  const theme = useTheme();
  const itemIsIssue = isIssue(editingTask);
  const statusOptions = itemIsIssue ? ISSUE_STATUS_OPTIONS : TASK_STATUS_OPTIONS.filter((o) => o.value !== 'no-status');
  const getStatusInfo = itemIsIssue ? getIssueStatusInfo : getTaskStatusInfo;

  const handleFieldChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Bandeau coloré selon le type */}
      <Box
        sx={{
          height: 6,
          background: itemIsIssue
            ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.warning.main})`
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
        }}
      />

      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: itemIsIssue
                  ? alpha(theme.palette.error.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.12),
                color: itemIsIssue ? theme.palette.error.main : theme.palette.primary.main,
              }}
            >
              {itemIsIssue ? <BugReportIcon fontSize="small" /> : <AssignmentIcon fontSize="small" />}
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h5" fontWeight={700}>
                  {itemIsIssue
                    ? (editingTask ? "Modifier l'issue" : 'Nouvelle issue')
                    : (editingTask ? 'Modifier la tâche' : 'Nouvelle tâche')}
                </Typography>
                <Chip
                  label={itemIsIssue ? 'Issue' : 'Tâche'}
                  size="small"
                  color={itemIsIssue ? 'error' : 'primary'}
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <DialogContent dividers sx={{ py: 3, overflowY: 'auto', flex: 1 }}>
          <Stack spacing={3}>
            {/* Titre */}
            <TextField
              fullWidth
              label="Titre"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              required
              InputProps={{ startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />

            {/* Statut + Projet */}
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  label="Statut"
                  renderValue={(value) => {
                    const info = getStatusInfo(value);
                    return <Chip icon={info.icon} label={info.label} color={info.color} size="small" />;
                  }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip icon={option.icon} label={option.label} color={option.color} size="small" />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Projet</InputLabel>
                <Select
                  value={formData.projectId}
                  onChange={(e) => handleFieldChange('projectId', e.target.value)}
                  label="Projet"
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.projectName} ({project.projectCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Description */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>Description</Typography>
                <Typography variant="caption" color="text.secondary">(Markdown supporté)</Typography>
              </Stack>
              <TextField
                fullWidth
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                multiline
                minRows={12}
                maxRows={20}
                required
                placeholder="Décrivez la tâche en détail... Vous pouvez utiliser le Markdown:"
                sx={{
                  '& .MuiOutlinedInput-root': { alignItems: 'flex-start', fontFamily: 'monospace', fontSize: '0.9rem' },
                  '& .MuiInputBase-input': { lineHeight: 1.6 },
                }}
              />
            </Box>

            {/* Estimation + Dates + Référence */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Estimation"
                  value={formData.estimate}
                  onChange={(e) => handleFieldChange('estimate', e.target.value)}
                  placeholder="ex: 3h, 2j"
                  sx={{ width: 150 }}
                />
                <TextField
                  type="date"
                  label="Début prévu"
                  value={formData.plannedStart}
                  onChange={(e) => handleFieldChange('plannedStart', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  type="date"
                  label="Échéance"
                  value={formData.dueDate}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                  sx={{ flex: 1 }}
                />
              </Stack>
              <TextField
                fullWidth
                label="Référence de suivi"
                value={formData.trackingReference}
                onChange={(e) => handleFieldChange('trackingReference', e.target.value)}
                placeholder="ex: JIRA-12345"
              />
            </Stack>

            {/* Assignés */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Assignés</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {(formData.assignees || []).map((email) => {
                  const person = persons.find((p) => p.email === email);
                  const name = person ? `${person.firstName} ${person.lastName}` : email;
                  return (
                    <Chip
                      key={email}
                      label={name}
                      onDelete={() => onAssigneeToggle(email)}
                      icon={<PersonIcon />}
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    />
                  );
                })}
                {(!formData.assignees || formData.assignees.length === 0) && (
                  <Typography variant="caption" color="text.secondary">Aucun assigné</Typography>
                )}
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {persons
                  .filter((p) => !(formData.assignees || []).includes(p.email))
                  .map((person) => (
                    <Chip
                      key={person.id}
                      label={`+ ${person.firstName} ${person.lastName}`}
                      onClick={() => onAssigneeToggle(person.email)}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        borderStyle: 'dashed',
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08), borderStyle: 'solid' },
                      }}
                    />
                  ))}
                {persons.filter((p) => !(formData.assignees || []).includes(p.email)).length === 0 && (
                  <Typography variant="caption" color="text.secondary">Toutes les personnes sont assignées</Typography>
                )}
              </Stack>
            </Box>

            {/* Commentaires & Liens (édition seulement) */}
            {editingTask && (
              <>
                <Divider />
                <AbstractEntityEditor
                  comments={formData.comments}
                  links={formData.links}
                  onChangeComments={(c) => onFormChange({ ...formData, comments: c })}
                  onChangeLinks={(l) => onFormChange({ ...formData, links: l })}
                />
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="large"
            color={itemIsIssue ? 'error' : 'primary'}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            color={itemIsIssue ? 'error' : 'primary'}
            startIcon={editingTask ? <EditIcon /> : <AddIcon />}
          >
            {editingTask ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;
