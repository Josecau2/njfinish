import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react';

const FilesHistoryTab = ({ manufacturer }) => {
  const { t } = useTranslation();
  const files = manufacturer?.catalogFiles || [];

  // const downloadBaseUrl = process.env.VITE_API_URL || '';
  const downloadBaseUrl = import.meta.env.VITE_API_URL || '';

  // Example: http://localhost:3001/uploads or whatever your server is serving

  return (
    <div>
      <h5 className="mb-3">{t('settings.manufacturers.filesHistory.title')}</h5>

      {files.length === 0 ? (
        <p className="text-muted">{t('settings.manufacturers.filesHistory.empty')}</p>
      ) : (
        <div className="table-wrap">
          <CTable hover responsive className="table-modern">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.index')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.originalName')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.filename')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.sizeKb')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.uploadedOn')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('settings.manufacturers.filesHistory.table.download')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {files.map((file, idx) => (
                <CTableRow key={file.id}>
                  <CTableDataCell>{idx + 1}</CTableDataCell>
                  <CTableDataCell className="text-break">{file.original_name}</CTableDataCell>
                  <CTableDataCell className="text-break">{file.filename}</CTableDataCell>
                  <CTableDataCell>{(file.file_size / 1024).toFixed(2)}</CTableDataCell>
                  <CTableDataCell>{new Date(file.createdAt).toLocaleString()}</CTableDataCell>
                  <CTableDataCell>
                    <a
                      href={`${downloadBaseUrl}/uploads/manufacturer_catalogs/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('settings.manufacturers.filesHistory.table.download')} ${file.original_name}`}
                    >
                      {t('settings.manufacturers.filesHistory.table.download')}
                    </a>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </div>
      )}
    </div>
  );
};

export default FilesHistoryTab;
