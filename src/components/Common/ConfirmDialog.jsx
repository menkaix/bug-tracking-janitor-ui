import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress,
} from '@mui/material';

/**
 * Dialogue de confirmation réutilisable.
 * À utiliser via le hook useConfirm — ne pas instancier directement.
 *
 * @param {boolean}  open
 * @param {string}   title
 * @param {string}   [description]
 * @param {string}   [confirmLabel="Confirmer"]
 * @param {string}   [cancelLabel="Annuler"]
 * @param {'error'|'warning'|'primary'} [confirmColor="error"]
 * @param {boolean}  [loading=false]
 * @param {Function} onConfirm
 * @param {Function} onCancel
 */
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmColor = 'error',
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onCancel}
    maxWidth="xs"
    fullWidth
    PaperProps={{ sx: { borderRadius: 3 } }}
  >
    <DialogTitle sx={{ fontWeight: 700, pb: description ? 1 : 2 }}>
      {title}
    </DialogTitle>

    {description && (
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
    )}

    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="outlined"
        sx={{ borderRadius: 2 }}
      >
        {cancelLabel}
      </Button>
      <Button
        onClick={onConfirm}
        disabled={loading}
        variant="contained"
        color={confirmColor}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{ borderRadius: 2, minWidth: 110 }}
      >
        {loading ? 'En cours...' : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
