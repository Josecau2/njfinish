import StandardCard from './StandardCard'
import { Box, Table, Stack, Text, useBreakpointValue, useColorModeValue } from '@chakra-ui/react'

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
    <Box overflowX="auto" data-scroll-region>
      <Table variant="simple">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
};

export default ResponsiveTable;