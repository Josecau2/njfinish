import { Icon } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const PaginationControls = ({ page, totalPages, goPrev, goNext }) => {
  const { t } = useTranslation()
  const commonButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: "2xl",
    transition: 'background-color 0.2s ease, color 0.2s ease',
    color: '#333',
    minWidth: '44px',
    minHeight: '44px',
  }

  const disabledButtonStyle = {
    ...commonButtonStyle,
    cursor: 'not-allowed',
    color: '#ccc',
  }

  return (
    <div
      style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
      aria-label={t('common.ariaLabels.pagination', 'Pagination')}
      role="group"
    >
      <button
        onClick={goPrev}
        disabled={page === 1}
        aria-label={t('common.ariaLabels.previous', 'Previous')}
        aria-disabled={page === 1}
        style={page === 1 ? disabledButtonStyle : commonButtonStyle}
        onMouseEnter={(e) => {
          if (page !== 1) e.currentTarget.style.backgroundColor = '#e9ecef'
        }}
        onMouseLeave={(e) => {
          if (page !== 1) e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Icon as={ChevronLeft} />
      </button>

      <button
        onClick={goNext}
        disabled={page === totalPages}
        aria-label={t('common.ariaLabels.next', 'Next')}
        aria-disabled={page === totalPages}
        style={page === totalPages ? disabledButtonStyle : commonButtonStyle}
        onMouseEnter={(e) => {
          if (page !== totalPages) e.currentTarget.style.backgroundColor = '#e9ecef'
        }}
        onMouseLeave={(e) => {
          if (page !== totalPages) e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Icon as={ChevronRight} />
      </button>
    </div>
  )
}

export default PaginationControls
