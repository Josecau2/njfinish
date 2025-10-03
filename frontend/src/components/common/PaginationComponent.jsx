import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorModeValue } from '@chakra-ui/react'

const PaginationComponent = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  showPageLabel = true,
  itemsPerPage = 10,
  maxVisiblePages = 5,
}) => {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)

  // Dark mode colors
  const bgContainer = useColorModeValue('#f8f9fa', 'gray.800')
  const bgGradient = useColorModeValue('linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)')
  const borderColor = useColorModeValue('#dee2e6', 'gray.600')
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const badgeBg = useColorModeValue('white', 'gray.700')
  const badgeBorder = useColorModeValue('gray.300', 'gray.600')
  const badgeText = useColorModeValue('gray.800', 'gray.200')
  const buttonBg = useColorModeValue('white', 'gray.700')
  const buttonBorder = useColorModeValue('gray.300', 'gray.600')
  const buttonText = useColorModeValue('gray.600', 'gray.300')
  const ellipsisColor = useColorModeValue('gray.500', 'gray.400')
  const activeBg = useColorModeValue('indigo.600', 'indigo.500')
  const hoverBg = useColorModeValue('purple.50', 'purple.900')
  const hoverBorder = useColorModeValue('purple.300', 'purple.700')
  const hoverText = useColorModeValue('purple.700', 'purple.200')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 660)
      setIsSmallMobile(window.innerWidth <= 447)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const visiblePages = useMemo(() => {
    if (totalPages <= 0) {
      return []
    }

    const pages = []
    const maxVisible = isSmallMobile ? 3 : isMobile ? 4 : Math.max(1, maxVisiblePages)
    const halfWindow = Math.floor(maxVisible / 2)

    let start = Math.max(1, currentPage - halfWindow)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('ellipsis-start')
      }
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages, isMobile, isSmallMobile, maxVisiblePages])

  const styles = useMemo(() => ({
    container: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: isMobile ? 'center' : 'space-between',
      alignItems: 'center',
      padding: isMobile ? '16px 12px' : '20px 24px',
      gap: isMobile ? '16px' : '0',
      backgroundColor: bgContainer,
      backgroundImage: bgGradient,
      borderTop: `1px solid ${borderColor}`,
      borderRadius: '0 0 8px 8px',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    },
    itemsPerPageContainer: {
      display: showPageLabel ? 'flex' : 'none',
      alignItems: 'center',
      gap: isSmallMobile ? '8px' : '12px',
      order: isMobile ? 2 : 1,
    },
    itemsPerPageLabel: {
      fontSize: isSmallMobile ? '12px' : '14px',
      fontWeight: 500,
      color: labelColor,
      margin: 0,
      whiteSpace: 'nowrap',
    },
    itemsPerPageBadge: {
      backgroundColor: badgeBg,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: badgeBorder,
      borderRadius: '6px',
      padding: isSmallMobile ? '4px 8px' : '6px 12px',
      fontSize: isSmallMobile ? '12px' : '14px',
      fontWeight: 600,
      color: badgeText,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minWidth: 'auto',
    },
    paginationContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: isSmallMobile ? '6px' : '8px',
      order: isMobile ? 1 : 2,
      flexWrap: 'nowrap',
      justifyContent: 'center',
    },
    pageButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: isSmallMobile || isMobile ? '44px' : '40px',
      height: isSmallMobile || isMobile ? '44px' : '40px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: buttonBorder,
      borderRadius: '6px',
      backgroundColor: buttonBg,
      color: buttonText,
      fontSize: "sm",
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    ellipsis: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      color: ellipsisColor,
      fontSize: "lg",
    },
    pageInfo: {
      fontSize: "sm",
      color: labelColor,
      order: 3,
      whiteSpace: 'nowrap',
    },
  }), [isMobile, isSmallMobile, showPageLabel, bgContainer, bgGradient, borderColor, labelColor, badgeBg, badgeBorder, badgeText, buttonBg, buttonBorder, buttonText, ellipsisColor])

  const getButtonStyle = (isActive, isDisabled) => ({
    ...styles.pageButton,
    ...(isActive ? {
      backgroundColor: activeBg,
      borderColor: activeBg,
      color: 'white',
    } : {}),
    ...(isDisabled ? {
      opacity: 0.5,
      cursor: 'not-allowed',
    } : {}),
  })

  const getHoverStyle = () => ({
    backgroundColor: hoverBg,
    borderColor: hoverBorder,
    color: hoverText,
  })

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    onPageChange(page)
  }

  if (totalPages <= 0) {
    return null
  }

  return (
    <div style={styles.container}>
      <div style={styles.itemsPerPageContainer}>
        <p style={styles.itemsPerPageLabel}>{t('pagination.itemsPerPage')}</p>
        <span style={styles.itemsPerPageBadge}>{itemsPerPage}</span>
      </div>

      <div style={styles.paginationContainer}>
        {!isSmallMobile && (
          <button
            type='button'
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
            style={getButtonStyle(false, currentPage === 1)}
            title={t('pagination.firstPageTitle')}
            aria-label={t('pagination.firstPageTitle')}
            onMouseEnter={(event) => {
              if (currentPage !== 1) {
                Object.assign(event.currentTarget.style, getHoverStyle())
              }
            }}
            onMouseLeave={(event) => {
              if (currentPage !== 1) {
                Object.assign(event.currentTarget.style, styles.pageButton)
              }
            }}
          >
            ⇤
          </button>
        )}

        <button
          type='button'
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          style={getButtonStyle(false, currentPage === 1)}
          title={t('pagination.prevPageTitle')}
          aria-label={t('pagination.prevPageTitle')}
          onMouseEnter={(event) => {
            if (currentPage !== 1) {
              Object.assign(event.currentTarget.style, getHoverStyle())
            }
          }}
          onMouseLeave={(event) => {
            if (currentPage !== 1) {
              Object.assign(event.currentTarget.style, styles.pageButton)
            }
          }}
        >
          ←
        </button>

        {visiblePages.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <div key={`ellipsis-${index}`} style={styles.ellipsis}>
                ⋯
              </div>
            )
          }

          const isActive = page === currentPage
          return (
            <button
              type='button'
              key={page}
              onClick={() => handlePageClick(page)}
              style={getButtonStyle(isActive, false)}
              aria-label={t('pagination.pageNumberAria', { page })}
              onMouseEnter={(event) => {
                if (!isActive) {
                  Object.assign(event.currentTarget.style, getHoverStyle())
                }
              }}
              onMouseLeave={(event) => {
                if (!isActive) {
                  Object.assign(event.currentTarget.style, styles.pageButton)
                }
              }}
            >
              {page}
            </button>
          )
        })}

        <button
          type='button'
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={getButtonStyle(false, currentPage === totalPages)}
          title={t('pagination.nextPageTitle')}
          aria-label={t('pagination.nextPageTitle')}
          onMouseEnter={(event) => {
            if (currentPage !== totalPages) {
              Object.assign(event.currentTarget.style, getHoverStyle())
            }
          }}
          onMouseLeave={(event) => {
            if (currentPage !== totalPages) {
              Object.assign(event.currentTarget.style, styles.pageButton)
            }
          }}
        >
          →
        </button>

        {!isSmallMobile && (
          <button
            type='button'
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
            style={getButtonStyle(false, currentPage === totalPages)}
            title={t('pagination.lastPageTitle')}
            aria-label={t('pagination.lastPageTitle')}
            onMouseEnter={(event) => {
              if (currentPage !== totalPages) {
                Object.assign(event.currentTarget.style, getHoverStyle())
              }
            }}
            onMouseLeave={(event) => {
              if (currentPage !== totalPages) {
                Object.assign(event.currentTarget.style, styles.pageButton)
              }
            }}
          >
            ⇥
          </button>
        )}
      </div>

      <div style={styles.pageInfo}>
        {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
      </div>
    </div>
  )
}

export default PaginationComponent
