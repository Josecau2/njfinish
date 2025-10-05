import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Text,
  Link,
} from '@chakra-ui/react'
import { TableCard } from '../../../../components/TableCard'

const FilesHistoryTab = ({ manufacturer }) => {
  const { t } = useTranslation()
  const files = manufacturer?.catalogFiles || []

  // const downloadBaseUrl = process.env.VITE_API_URL || '';
  const downloadBaseUrl = import.meta.env.VITE_API_URL || ''

  // Example: http://localhost:3001/uploads or whatever your server is serving

  return (
    <Box>
      <Heading as="h5" size="md" mb={4}>{t('settings.manufacturers.filesHistory.title')}</Heading>

      {files.length === 0 ? (
        <Text>{t('settings.manufacturers.filesHistory.empty')}</Text>
      ) : (
        <Box display={{ base: 'none', lg: 'block' }}>
        <TableCard>
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
                  <Td wordBreak="break-word">{file.original_name}</Td>
                  <Td wordBreak="break-word">{file.filename}</Td>
                  <Td>{(file.file_size / 1024).toFixed(2)}</Td>
                  <Td>{new Date(file.createdAt).toLocaleString()}</Td>
                  <Td>
                    <Link
                      href={`${downloadBaseUrl}/uploads/manufacturer_catalogs/${file.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${t('settings.manufacturers.filesHistory.table.download')} ${file.original_name}`}
                      color="blue.500"
                      textDecoration="underline"
                    >
                      {t('settings.manufacturers.filesHistory.table.download')}
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
        </Box>
      )}
    </Box>
  )
}
export default FilesHistoryTab
