import React from 'react';
import './Pagination.css';

/**
 * Composant de pagination réutilisable
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    const delta = 2; // Nombre de pages à afficher de chaque côté de la page courante

    if (totalPages <= maxPagesToShow + 2) {
      // Si peu de pages, afficher toutes
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(0);

      // Calculer la plage autour de la page courante
      let startPage = Math.max(1, currentPage - delta);
      let endPage = Math.min(totalPages - 2, currentPage + delta);

      // Ajouter ellipse gauche si nécessaire
      if (startPage > 1) {
        pages.push('ellipsis-left');
      }

      // Pages du milieu
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Ajouter ellipse droite si nécessaire
      if (endPage < totalPages - 2) {
        pages.push('ellipsis-right');
      }

      // Toujours afficher la dernière page
      pages.push(totalPages - 1);
    }

    return pages;
  };

  if (totalPages <= 1 && !onPageSizeChange) return null;

  const pageNumbers = getPageNumbers();
  // Gérer les valeurs par défaut pour éviter NaN
  const safeCurrentPage = currentPage ?? 0;
  const safePageSize = pageSize ?? 10;
  const safeTotalElements = totalElements ?? 0;

  const startItem = safeTotalElements > 0 ? safeCurrentPage * safePageSize + 1 : 0;
  const endItem = safeTotalElements > 0 ? Math.min((safeCurrentPage + 1) * safePageSize, safeTotalElements) : 0;

  return (
    <div className="pagination-container">
      {totalElements > 0 && (
        <div className="pagination-info">
          <span>
            Affichage {startItem} - {endItem} sur {totalElements}
          </span>
          {onPageSizeChange && (
            <div className="pagination-size-selector">
              <label htmlFor="pageSize">Éléments par page:</label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="pagination-size-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn pagination-btn-first"
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            title="Première page"
          >
            ⟨⟨
          </button>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ← Précédent
          </button>

          <div className="pagination-numbers">
            {pageNumbers.map((page, index) => {
              if (typeof page === 'string') {
                return (
                  <span key={page} className="pagination-ellipsis">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={page}
                  className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                  onClick={() => onPageChange(page)}
                >
                  {page + 1}
                </button>
              );
            })}
          </div>

          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Suivant →
          </button>

          <button
            className="pagination-btn pagination-btn-last"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
            title="Dernière page"
          >
            ⟩⟩
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
