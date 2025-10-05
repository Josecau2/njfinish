import React from 'react'
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Code,
} from '@chakra-ui/react'
import { Edit, Trash, Eye } from 'lucide-react'
import TableCard from '../../components/TableCard'
import PageHeader from '../../components/PageHeader'
import PageContainer from '../../components/PageContainer'

const TableCardDemo = () => {
  const textGray = useColorModeValue('gray.600', 'gray.400')

  // Sample data
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Manager', status: 'pending' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'User', status: 'inactive' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Admin', status: 'active' },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green'
      case 'pending': return 'orange'
      case 'inactive': return 'gray'
      default: return 'blue'
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="TableCard Component Demo"
        subtitle="Preview of the reusable TableCard wrapper with app theme"
      />

      <VStack spacing={8} align="stretch">
        {/* Example 1: Standard TableCard */}
        <Box>
          <Heading size="md" mb={4}>Example 1: Standard TableCard (Default Styling)</Heading>
          <TableCard>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sampleData.map((user, index) => (
                  <Tr key={user.id}>
                    <Td>
                      <Badge variant="subtle" colorScheme="gray" borderRadius="full">
                        {index + 1}
                      </Badge>
                    </Td>
                    <Td fontWeight="semibold">{user.name}</Td>
                    <Td color={textGray}>{user.email}</Td>
                    <Td>
                      <Badge colorScheme="blue" borderRadius="full">
                        {user.role}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(user.status)} borderRadius="full">
                        {user.status}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2} justify="center">
                        <Button size="sm" variant="ghost" colorScheme="blue" aria-label="View">
                          <Eye size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" colorScheme="blue" aria-label="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" colorScheme="red" aria-label="Delete">
                          <Trash size={16} />
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableCard>
        </Box>

        {/* Example 2: TableCard with custom props */}
        <Box>
          <Heading size="md" mb={4}>Example 2: TableCard with Custom Shadow & Border</Heading>
          <TableCard
            cardProps={{
              boxShadow: "md",
              borderWidth: "2px",
              borderColor: "blue.200",
            }}
          >
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Feature</Th>
                  <Th>Description</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td fontWeight="semibold">Card Elevation</Td>
                  <Td>Automatic shadow for depth (boxShadow="sm" by default)</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">Border</Td>
                  <Td>1px border with theme-aware colors (gray.200/gray.700)</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">Rounded Corners</Td>
                  <Td>borderRadius="lg" on Card, "md" on TableContainer</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">Dark Mode</Td>
                  <Td>Automatic color switching (white/gray.800 background)</Td>
                </Tr>
                <Tr>
                  <Td fontWeight="semibold">Spacing</Td>
                  <Td>mb={6} for consistent vertical spacing</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableCard>
        </Box>

        {/* Code Example */}
        <Box>
          <Heading size="md" mb={4}>Usage Example</Heading>
          <Box
            bg={useColorModeValue('gray.50', 'gray.900')}
            p={4}
            borderRadius="md"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <Code display="block" whiteSpace="pre" fontSize="sm" p={4} borderRadius="md">
{`import TableCard from '../../components/TableCard'

// Basic usage
<TableCard>
  <Table variant="simple">
    <Thead>...</Thead>
    <Tbody>...</Tbody>
  </Table>
</TableCard>

// With custom props
<TableCard
  cardProps={{ boxShadow: "md" }}
  containerProps={{ maxH: "400px", overflowY: "auto" }}
>
  <Table>...</Table>
</TableCard>`}
            </Code>
          </Box>
        </Box>

        {/* Comparison */}
        <Box>
          <Heading size="md" mb={4}>Comparison: Without vs With TableCard</Heading>

          <Text fontSize="sm" color={textGray} mb={2}>WITHOUT TableCard (Plain Table):</Text>
          <Box mb={4}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Column 1</Th>
                  <Th>Column 2</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>No container</Td>
                  <Td>Looks flat</Td>
                </Tr>
                <Tr>
                  <Td>No elevation</Td>
                  <Td>Hard to see boundaries</Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>

          <Text fontSize="sm" color={textGray} mb={2}>WITH TableCard (Professional Look):</Text>
          <TableCard>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Column 1</Th>
                  <Th>Column 2</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>Has container</Td>
                  <Td>Visual depth</Td>
                </Tr>
                <Tr>
                  <Td>Has elevation</Td>
                  <Td>Clear boundaries</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableCard>
        </Box>
      </VStack>
    </PageContainer>
  )
}

export default TableCardDemo
