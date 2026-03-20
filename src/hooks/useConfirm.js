import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import ConfirmDialog from '../components/Common/ConfirmDialog';

/**
 * Context fournissant la fonction confirm() à tous les descendants.
 * Usage dans un hook ou composant :
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: 'Supprimer ?', description: 'Action irréversible.' });
 *   if (!ok) return;
 *   // ... action destructive
 */
const ConfirmContext = createContext(null);

/**
 * Provider à placer haut dans l'arbre (wrapping App ou la zone authentifiée).
 * Rend le dialogue de confirmation unique géré par le contexte.
 */
export const ConfirmProvider = ({ children }) => {
  const [dialog, setDialog] = useState({
    open: false,
    loading: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmer',
    cancelLabel: 'Annuler',
    confirmColor: 'error',
  });

  // Référence vers la fonction resolve de la Promise en attente
  const resolveRef = useRef(null);

  /**
   * Ouvre le dialogue et retourne une Promise<boolean>.
   * true  = confirmé
   * false = annulé / fermé
   */
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        open: true,
        loading: false,
        title: options.title || 'Confirmation',
        description: options.description || '',
        confirmLabel: options.confirmLabel || 'Confirmer',
        cancelLabel: options.cancelLabel || 'Annuler',
        confirmColor: options.confirmColor || 'error',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setDialog((d) => ({ ...d, open: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setDialog((d) => ({ ...d, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={dialog.open}
        title={dialog.title}
        description={dialog.description}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        confirmColor={dialog.confirmColor}
        loading={dialog.loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

/**
 * Hook renvoyant la fonction confirm().
 * Doit être utilisé dans un descendant de <ConfirmProvider>.
 */
export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans un ConfirmProvider');
  return ctx;
};
