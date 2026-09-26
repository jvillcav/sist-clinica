import '../styles/pagination.css';

const Pagination = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  label = 'registros'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  let pages;

  if (totalPages <= 7) {
    pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  } else if (currentPage <= 4) {
    pages = [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  } else if (currentPage >= totalPages - 3) {
    pages = [
      1,
      'ellipsis-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    ];
  } else {
    pages = [
      1,
      'ellipsis-start',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis-end',
      totalPages
    ];
  }

  return (
    <nav className="pagination" aria-label={`Paginación de ${label}`}>
      <div className="pagination-summary">
        Mostrando <strong>{firstItem}-{lastItem}</strong> de <strong>{totalItems}</strong>
      </div>

      <div className="pagination-controls">
        <label className="pagination-size">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            aria-label={`Cantidad de ${label} por página`}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>por página</span>
        </label>

        <button
          type="button"
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <div className="pagination-pages">
          {pages.map((page) => page.toString().startsWith('ellipsis') ? (
            <span className="pagination-ellipsis" key={page}>
              ...
            </span>
          ) : (
            <button
              type="button"
              key={page}
              className={page === currentPage ? 'active' : ''}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
