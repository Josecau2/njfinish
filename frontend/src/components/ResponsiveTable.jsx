import StandardCard from './StandardCard'
import { TableCard } from './TableCard'
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td, Stack, Text, Box, useBreakpointValue, useColorModeValue } from '@chakra-ui/react'

const ResponsiveTable = ({ data = [], columns = [] }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const labelColor = useColorModeValue('gray.500', 'gray.400')

  if (isMobile) {
    return (
      <Stack spacing={4}>
        {data.map((row, i) => (
          <StandardCard key={i} p={4}>
            <Stack spacing={4}>
              {columns.map(col => (
                <Box key={col.key}>
                  <Text fontSize="xs" color={labelColor} fontWeight="semibold">
                    {col.label}
                  </Text>
                  <Text mt={1}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </Text>
                </Box>
              ))}
            </Stack>
          </StandardCard>
        ))}
      </Stack>
    );
  }

  return (
    <TableCard>
      <Table variant="simple">
        <Thead>
          <Tr>
            {columns.map(col => (
              <Th key={col.key}>{col.label}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row, i) => (
            <Tr key={i}>
              {columns.map(col => (
                <Td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableCard>
  );
};

export default ResponsiveTable;