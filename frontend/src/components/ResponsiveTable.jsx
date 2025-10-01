import { Box, Table, Stack, Text, useBreakpointValue } from '@chakra-ui/react'
import StandardCard from './StandardCard';

const ResponsiveTable = ({ data = [], columns = [] }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isMobile) {
    return (
      <Stack spacing={4}>
        {data.map((row, i) => (
          <StandardCard key={i} p={4} borderWidth="1px">
            <Stack spacing={4}>
              {columns.map(col => (
                <Box key={col.key}>
                  <Text fontSize="xs" color="gray.500" fontWeight="semibold">
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