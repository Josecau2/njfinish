import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ChakraProvider,
  Button,
  IconButton,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Badge,
  Stack,
  Heading,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';

const items = [
  { id: 1, name: "Laptop", category: "Electronics", price: 999.99, status: "In Stock" },
  { id: 2, name: "Coffee Maker", category: "Home Appliances", price: 49.99, status: "Low Stock" },
  { id: 3, name: "Desk Chair", category: "Furniture", price: 150.0, status: "In Stock" },
  { id: 4, name: "Smartphone", category: "Electronics", price: 799.99, status: "Out of Stock" },
  { id: 5, name: "Headphones", category: "Accessories", price: 199.99, status: "In Stock" },
];

function ChakraShowcase() {
  return (
    <ChakraProvider>
      <Box bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" minH="100vh" py={10}>
        <Box maxW="1400px" mx="auto" px={5}>
          <Heading as="h1" size="2xl" color="white" textAlign="center" mb={10}>
            Chakra UI Component Showcase
          </Heading>

          {/* BUTTON VARIATIONS */}
          <Box bg="white" borderRadius="16px" p={8} mb={8} boxShadow="0 20px 60px rgba(0,0,0,0.3)">
            <Heading as="h2" size="lg" mb={6} pb={3} borderBottom="3px solid #667eea">
              Button Variations
            </Heading>

            <VStack spacing={8} align="stretch">
              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Solid Variants (Default)</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button colorScheme="gray">Gray</Button>
                  <Button colorScheme="red">Red</Button>
                  <Button colorScheme="orange">Orange</Button>
                  <Button colorScheme="yellow">Yellow</Button>
                  <Button colorScheme="green">Green</Button>
                  <Button colorScheme="teal">Teal</Button>
                  <Button colorScheme="blue">Blue</Button>
                  <Button colorScheme="cyan">Cyan</Button>
                  <Button colorScheme="purple">Purple</Button>
                  <Button colorScheme="pink">Pink</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Outline Variants</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button variant="outline" colorScheme="blue">Blue</Button>
                  <Button variant="outline" colorScheme="teal">Teal</Button>
                  <Button variant="outline" colorScheme="green">Green</Button>
                  <Button variant="outline" colorScheme="red">Red</Button>
                  <Button variant="outline" colorScheme="purple">Purple</Button>
                  <Button variant="outline" colorScheme="orange">Orange</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Ghost Variants</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button variant="ghost" colorScheme="blue">Blue</Button>
                  <Button variant="ghost" colorScheme="teal">Teal</Button>
                  <Button variant="ghost" colorScheme="green">Green</Button>
                  <Button variant="ghost" colorScheme="red">Red</Button>
                  <Button variant="ghost" colorScheme="purple">Purple</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Link Variant</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button variant="link" colorScheme="blue">Link Button</Button>
                  <Button variant="link" colorScheme="teal">Teal Link</Button>
                  <Button variant="link" colorScheme="purple">Purple Link</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Button Sizes</Text>
                <HStack spacing={3} flexWrap="wrap" alignItems="center">
                  <Button size="xs" colorScheme="teal">Extra Small</Button>
                  <Button size="sm" colorScheme="teal">Small</Button>
                  <Button size="md" colorScheme="teal">Medium</Button>
                  <Button size="lg" colorScheme="teal">Large</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Button States</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <Button colorScheme="blue">Normal</Button>
                  <Button colorScheme="blue" isLoading>Loading</Button>
                  <Button colorScheme="blue" isDisabled>Disabled</Button>
                  <Button colorScheme="blue" leftIcon={<span>📁</span>}>With Icon</Button>
                  <Button colorScheme="blue" isActive>Active</Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Icon Buttons</Text>
                <HStack spacing={3} flexWrap="wrap">
                  <IconButton icon={<span>🔍</span>} aria-label="Search" colorScheme="blue" />
                  <IconButton icon={<span>✏️</span>} aria-label="Edit" colorScheme="green" />
                  <IconButton icon={<span>🗑️</span>} aria-label="Delete" colorScheme="red" />
                  <IconButton icon={<span>⚙️</span>} aria-label="Settings" colorScheme="gray" />
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Button Groups</Text>
                <ButtonGroup spacing={4} variant="outline">
                  <Button colorScheme="blue">Save</Button>
                  <Button>Cancel</Button>
                  <Button colorScheme="red">Delete</Button>
                </ButtonGroup>
              </Box>
            </VStack>
          </Box>

          {/* TABLE VARIATIONS */}
          <Box bg="white" borderRadius="16px" p={8} mb={8} boxShadow="0 20px 60px rgba(0,0,0,0.3)">
            <Heading as="h2" size="lg" mb={6} pb={3} borderBottom="3px solid #667eea">
              Table Variations
            </Heading>

            <VStack spacing={8} align="stretch">
              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Simple Table</Text>
                <TableContainer borderWidth="1px" borderRadius="md">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th>Category</Th>
                        <Th>Status</Th>
                        <Th isNumeric>Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td>{item.category}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                item.status === "In Stock" ? "green" :
                                item.status === "Low Stock" ? "yellow" : "red"
                              }
                            >
                              {item.status}
                            </Badge>
                          </Td>
                          <Td isNumeric>${item.price}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Striped Table</Text>
                <TableContainer borderWidth="1px" borderRadius="md">
                  <Table variant="striped" colorScheme="teal">
                    <Thead>
                      <Tr>
                        <Th>Product</Th>
                        <Th>Category</Th>
                        <Th>Status</Th>
                        <Th isNumeric>Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item) => (
                        <Tr key={item.id}>
                          <Td>{item.name}</Td>
                          <Td>{item.category}</Td>
                          <Td>
                            <Badge
                              colorScheme={
                                item.status === "In Stock" ? "green" :
                                item.status === "Low Stock" ? "yellow" : "red"
                              }
                            >
                              {item.status}
                            </Badge>
                          </Td>
                          <Td isNumeric>${item.price}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Small Size Table</Text>
                <TableContainer borderWidth="1px" borderRadius="md">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Product</Th>
                        <Th>Category</Th>
                        <Th isNumeric>Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item) => (
                        <Tr key={item.id}>
                          <Td>#{item.id.toString().padStart(3, '0')}</Td>
                          <Td>{item.name}</Td>
                          <Td>{item.category}</Td>
                          <Td isNumeric>${item.price}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>

              <Box>
                <Text fontWeight="600" fontSize="lg" mb={4}>Color Scheme Tables</Text>
                <Stack spacing={4}>
                  <TableContainer borderWidth="1px" borderRadius="md">
                    <Table variant="striped" colorScheme="purple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Product</Th>
                          <Th isNumeric>Price</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr><Td>Laptop</Td><Td isNumeric>$999.99</Td></Tr>
                        <Tr><Td>Smartphone</Td><Td isNumeric>$799.99</Td></Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>

                  <TableContainer borderWidth="1px" borderRadius="md">
                    <Table variant="striped" colorScheme="blue" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Product</Th>
                          <Th isNumeric>Price</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr><Td>Coffee Maker</Td><Td isNumeric>$49.99</Td></Tr>
                        <Tr><Td>Desk Chair</Td><Td isNumeric>$150.00</Td></Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Stack>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ChakraShowcase />);
