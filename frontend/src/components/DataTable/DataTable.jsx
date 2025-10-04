import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  useColorModeValue,
} from '@chakra-ui/react'

/**
 * DataTable - Consistent table component with proper styling
 *
 * @param {Array} columns - Column definitions [{ key: string, label: string, width?: string }]
 * @param {Array} data - Array of data objects
 * @param {Function} onRowClick - Optional click handler for rows
 * @param {Function} renderCell - Optional custom cell renderer (row, column) => ReactNode
 */
export function DataTable({ columns, data, onRowClick, renderCell }) {
  const borderColor = useColorModeValue("gray.300", "gray.600")
  const hoverBg = useColorModeValue("gray.50", 'gray.750')
  const headerBg = useColorModeValue("gray.50", "gray.800")
  const headerTextColor = useColorModeValue("gray.700", "gray.300")
  const cellTextColor = useColorModeValue("gray.800", "gray.200")

  return (
    <Box overflowX="auto" borderRadius="md" border="1px" borderColor={borderColor}>
      <Table variant="simple" size="md">
        <Thead bg={headerBg}>
          <Tr>
            {columns.map((col) => (
              <Th
                key={col.key}
                width={col.width}
                textTransform="none"
                fontSize="sm"
                fontWeight="600"
                color={headerTextColor}
              >
                {col.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row, idx) => (
            <Tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              cursor={onRowClick ? 'pointer' : 'default'}
              _hover={onRowClick ? { bg: hoverBg } : undefined}
              transition="background 0.15s ease"
            >
              {columns.map((col) => (
                <Td
                  key={col.key}
                  fontSize="sm"
                  color={cellTextColor}
                >
                  {renderCell ? renderCell(row, col) : row[col.key]}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
