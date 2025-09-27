import React from 'react';
import { CCard, CCardBody, CBadge, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilFile, cilImage, cilCloudDownload, cilPencil, cilTrash } from '@coreui/icons';

// Simple, generic content tile used to display a file/link-like item.
// This implementation intentionally avoids problematic icons like cilMusic/cilPlay.
// Props (loose contract to prevent compile errors if used in multiple places):
// - title: string
// - description: string
// - type: 'file' | 'image' | 'video' | string (used for badge)
// - onOpen: () => void  (tile click/open)
// - onDownload: () => void
// - onEdit: () => void
// - onDelete: () => void
export default function ContentTile({
	title,
	description,
	type = 'file',
	onOpen,
	onDownload,
	onEdit,
	onDelete,
}) {
	const isImage = String(type).toLowerCase() === 'image';
	const badgeColor = isImage ? 'info' : 'secondary';

	return (
		<CCard className="h-100 border-0 shadow-sm" role="button" onClick={onOpen}>
			<CCardBody>
				<div className="d-flex justify-content-between align-items-start mb-2">
					<CBadge color={badgeColor} className="text-uppercase">{type || 'file'}</CBadge>
					<div className="d-flex gap-2">
						{onDownload && (
							<CButton size="sm" color="info" variant="ghost" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
								<CIcon icon={cilCloudDownload} />
							</CButton>
						)}
						{onEdit && (
							<CButton size="sm" color="secondary" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
								<CIcon icon={cilPencil} />
							</CButton>
						)}
						{onDelete && (
							<CButton size="sm" color="danger" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
								<CIcon icon={cilTrash} />
							</CButton>
						)}
					</div>
				</div>
				<div className="d-flex align-items-center gap-2 text-truncate">
					<CIcon icon={isImage ? cilImage : cilFile} className="text-muted" />
					<div className="text-truncate">
						<div className="fw-semibold text-truncate" title={title}>{title || 'Untitled'}</div>
						{description && (
							<div className="text-muted small mt-1 text-truncate" title={description}>{description}</div>
						)}
					</div>
				</div>
			</CCardBody>
		</CCard>
	);
}

