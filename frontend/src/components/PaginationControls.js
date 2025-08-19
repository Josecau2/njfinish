import { CIcon } from '@coreui/icons-react'
import { cilChevronLeft, cilChevronRight } from '@coreui/icons'

const PaginationControls = ({ page, totalPages, goPrev, goNext }) => {
    const commonButtonStyle = {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        transition: 'background-color 0.2s ease, color 0.2s ease',
        color: '#333',
    }

    const disabledButtonStyle = {
        ...commonButtonStyle,
        cursor: 'not-allowed',
        color: '#ccc',
    }

    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
                onClick={goPrev}
                disabled={page === 1}
                aria-label="Previous"
                style={page === 1 ? disabledButtonStyle : commonButtonStyle}
                onMouseEnter={e => {
                    if (page !== 1) e.currentTarget.style.backgroundColor = '#e9ecef'
                }}
                onMouseLeave={e => {
                    if (page !== 1) e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                <CIcon icon={cilChevronLeft} />
            </button>

            <button
                onClick={goNext}
                disabled={page === totalPages}
                aria-label="Next"
                style={page === totalPages ? disabledButtonStyle : commonButtonStyle}
                onMouseEnter={e => {
                    if (page !== totalPages) e.currentTarget.style.backgroundColor = '#e9ecef'
                }}
                onMouseLeave={e => {
                    if (page !== totalPages) e.currentTarget.style.backgroundColor = 'transparent'
                }}
            >
                <CIcon icon={cilChevronRight} />
            </button>
        </div>
    )
}

export default PaginationControls
