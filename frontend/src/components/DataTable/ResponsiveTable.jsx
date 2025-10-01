import { useBreakpointValue, Stack, Text, Box } from '@chakra-ui/react'
import { DataTable } from './DataTable'
import { MobileListCard } from '../StandardCard'

/**
 * ResponsiveTable - Automatically switches between table and card view based on screen size
 *
 * @param {Array} columns - Column definitions [{ key: string, label: string, width?: string }]
 * @param {Array} data - Array of data objects
 * @param {Function} onRowClick - Optional click handler for rows
 * @param {Function} renderCell - Optional custom cell renderer (row, column) => ReactNode
 */
export function ResponsiveTable({ columns, data, onRowClick, renderCell }) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  if (isMobile) {
    return (
      <Stack spacing={2}>
        {data.map((row, idx) => (
          <MobileListCard
            key={idx}
            interactive={!!onRowClick}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((col) => (
              <Box key={col.key} mb={2}>
                <Text fontSize="xs" style={{ color="gray.500" }} fontWeight="600" mb={1}>
                  {col.label}
                </Text>
                <Text fontSize="sm">
                  {renderCell ? renderCell(row, col) : row[col.key]}
                </Text>
              </Box>
            ))}
          </MobileListCard>
        ))}
      </Stack>
    )
  }

  return <DataTable columns={columns} data={data} onRowClick={onRowClick} renderCell={renderCell} />
}
