import React, { useState, useEffect } from 'react';

const PaginationComponent = ({
  currentPage = 1,
  totalPages = 10,
  onPageChange = (page) => console.log(`Page changed to: ${page}`),
  showPageLabel = true,
  itemsPerPage = 10,
  maxVisiblePages = 2
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 660);
      setIsSmallMobile(window.innerWidth <= 447);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (totalPages === 0) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = isSmallMobile ? 3 : isMobile ? 4 : maxVisiblePages;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const getStyles = () => ({
    container: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: isMobile ? 'center' : 'space-between',
      alignItems: 'center',
      padding: isMobile ? '16px 12px' : '20px 24px',
      gap: isMobile ? '16px' : '0',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderTop: '1px solid #dee2e6',
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      minHeight: 'auto'
    },
    itemsPerPageContainer: {
      display: showPageLabel ? 'flex' : 'none',
      alignItems: 'center',
      gap: isSmallMobile ? '8px' : '12px',
      order: isMobile ? 2 : 1
    },
    itemsPerPageLabel: {
      fontSize: isSmallMobile ? '12px' : '14px',
      fontWeight: '500',
      color: '#495057',
      margin: 0,
      whiteSpace: 'nowrap'
    },
    itemsPerPageBadge: {
      background: '#fff',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      padding: isSmallMobile ? '4px 8px' : '6px 12px',
      fontSize: isSmallMobile ? '12px' : '14px',
      fontWeight: '600',
      color: '#212529',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minWidth: 'auto'
    },
    paginationContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: isSmallMobile ? '4px' : '6px',
      order: isMobile ? 1 : 2,
      flexWrap: 'nowrap',
      justifyContent: 'center'
    },
    pageButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isSmallMobile ? '32px' : '40px',
      height: isSmallMobile ? '32px' : '40px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      backgroundColor: '#fff',
      color: '#495057',
      fontSize: isSmallMobile ? '12px' : '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      userSelect: 'none',
      minWidth: 'auto'
    },
    activePageButton: {
      background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
      borderColor: '#007bff',
      color: '#fff',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
      transform: 'translateY(-1px)'
    },
    disabledPageButton: {
      backgroundColor: '#f8f9fa',
      borderColor: '#e9ecef',
      color: '#adb5bd',
      cursor: 'not-allowed'
    },
    pageInfo: {
      fontSize: isSmallMobile ? '12px' : '14px',
      color: '#6c757d',
      fontWeight: '500',
      order: isMobile ? 3 : 3,
      textAlign: 'center',
      whiteSpace: 'nowrap'
    },
    ellipsis: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isSmallMobile ? '32px' : '40px',
      height: isSmallMobile ? '32px' : '40px',
      color: '#adb5bd',
      fontSize: isSmallMobile ? '14px' : '16px'
    },
    navigationButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isSmallMobile ? '32px' : '40px',
      height: isSmallMobile ? '32px' : '40px',
      border: '1px solid #ced4da',
      borderRadius: '6px',
      backgroundColor: '#fff',
      color: '#495057',
      fontSize: isSmallMobile ? '12px' : '14px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      userSelect: 'none'
    }
  });

  const styles = getStyles();

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getButtonStyle = (isActive, isDisabled) => {
    if (isDisabled) {
      return { ...styles.pageButton, ...styles.disabledPageButton };
    }
    if (isActive) {
      return { ...styles.pageButton, ...styles.activePageButton };
    }
    return styles.pageButton;
  };

  const buttonHoverStyle = {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    color: '#1976d2',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)'
  };

  return (
    <div style={styles.container}>
      {/* Items per page indicator */}
      {showPageLabel && (
        <div style={styles.itemsPerPageContainer}>
          <span style={styles.itemsPerPageLabel}>
            {isSmallMobile ? 'Items:' : 'Items per page:'}
          </span>
          <div style={styles.itemsPerPageBadge}>
            {itemsPerPage}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div style={styles.paginationContainer}>
        {/* First Page - Hide on very small screens */}
        {!isSmallMobile && (
          <button
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            style={getButtonStyle(false, currentPage === 1)}
            title="First page"
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                Object.assign(e.target.style, buttonHoverStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                Object.assign(e.target.style, styles.pageButton);
              }
            }}
          >
            ⇤
          </button>
        )}

        {/* Previous Page */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          style={getButtonStyle(false, currentPage === 1)}
          title="Previous page"
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              Object.assign(e.target.style, buttonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              Object.assign(e.target.style, styles.pageButton);
            }
          }}
        >
          ←
        </button>

        {/* Page Numbers */}
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <div key={`ellipsis-${index}`} style={styles.ellipsis}>
                ⋯
              </div>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              style={getButtonStyle(isActive, false)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  Object.assign(e.target.style, buttonHoverStyle);
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  Object.assign(e.target.style, styles.pageButton);
                }
              }}
            >
              {page}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={getButtonStyle(false, currentPage === totalPages)}
          title="Next page"
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              Object.assign(e.target.style, buttonHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              Object.assign(e.target.style, styles.pageButton);
            }
          }}
        >
          →
        </button>

        {/* Last Page - Hide on very small screens */}
        {!isSmallMobile && (
          <button
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            style={getButtonStyle(false, currentPage === totalPages)}
            title="Last page"
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                Object.assign(e.target.style, buttonHoverStyle);
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                Object.assign(e.target.style, styles.pageButton);
              }
            }}
          >
            ⇥
          </button>
        )}
      </div>

      {/* Page Info */}
      <div style={styles.pageInfo}>
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </div>
    </div>
  );
};


export default PaginationComponent