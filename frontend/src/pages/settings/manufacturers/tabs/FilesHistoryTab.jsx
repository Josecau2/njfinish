import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react'

const FilesHistoryTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const files = manufacturer?.catalogFiles || []

  // const downloadBaseUrl = process.env.VITE_API_URL || '';
  const downloadBaseUrl = import.meta.env.VITE_API_URL || ''

  // Example: http://localhost:3001/uploads or whatever your server is serving

  return (
    <div>
      <h5 className="mb-3">{t('settings.manufacturers.filesHistory.title')}</h5>

      {files.length === 0 ? (
        <p className="text-muted">{t('settings.manufacturers.filesHistory.empty')}</p>
      ) : (
        <div className="table-wrap">
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.index')}
                </Th>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.originalName')}
                </Th>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.filename')}
                </Th>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.sizeKb')}
                </Th>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.uploadedOn')}
                </Th>
                <Th scope="col">
                  {t('settings.manufacturers.filesHistory.table.download')}
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {files.map((file, idx) => (
                <Tr key={file.id}>
                  <Td>{idx + 1}</Td>
                  <Td className="text-break">{file.original_name}</Td>
                  <Td className="text-break">{file.filename}</Td>
                  <Td>{(file.file_size / 1024).toFixed(2)}</Td>
                  <Td>{new Date(file.createdAt).toLocaleString()}</Td>
                  <Td>
                    <a
                      href={`${downloadBaseUrl}/uploads/manufacturer_catalogs/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('settings.manufacturers.filesHistory.table.download')} ${file.original_name}`}
                    >
                      {t('settings.manufacturers.filesHistory.table.download')}
                    </a>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}
    </div>
  )
}
export default FilesHistoryTab
