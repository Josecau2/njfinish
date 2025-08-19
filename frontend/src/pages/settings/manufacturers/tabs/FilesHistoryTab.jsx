import React from 'react';
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react';

const FilesHistoryTab = ({ manufacturer }) => {
  const files = manufacturer?.catalogFiles || [];

  // const downloadBaseUrl = process.env.VITE_API_URL || ''; 
  const downloadBaseUrl = import.meta.env.VITE_API_URL || '';

  // Example: http://localhost:3001/uploads or whatever your server is serving

  return (
    <div>
      <h5>Uploaded Catalog Files</h5>

      {files.length === 0 ? (
        <p>No catalog files uploaded.</p>
      ) : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Original Name</CTableHeaderCell>
              <CTableHeaderCell>Filename</CTableHeaderCell>
              <CTableHeaderCell>Size (KB)</CTableHeaderCell>
              <CTableHeaderCell>Uploaded On</CTableHeaderCell>
              <CTableHeaderCell>Download</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {files.map((file, idx) => (
              <CTableRow key={file.id}>
                <CTableDataCell>{idx + 1}</CTableDataCell>
                <CTableDataCell>{file.original_name}</CTableDataCell>
                <CTableDataCell>{file.filename}</CTableDataCell>
                <CTableDataCell>{(file.file_size / 1024).toFixed(2)}</CTableDataCell>
                <CTableDataCell>{new Date(file.createdAt).toLocaleString()}</CTableDataCell>
                <CTableDataCell>
                  <a
                    href={`${downloadBaseUrl}/uploads/manufacturer_catalogs/${file.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      )}
    </div>
  );
};

export default FilesHistoryTab;
