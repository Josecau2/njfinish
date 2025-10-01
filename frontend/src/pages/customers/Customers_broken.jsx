import React, { useState, useMemo, useEffect } from 'react';
import { Input, Spinner, Select, Container, Flex, Box, Card, CardBody, Badge, Icon } from '@chakra-ui/react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCustomers, deleteCustomer } from '../../store/slices/customerSlice'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2';
import axios from 'axios';
import { Search, Edit, Trash, Plus, User, Mail } from 'lucide-react'
import PaginationComponent from '../../components/common/PaginationComponent';
import withContractorScope from '../../components/withContractorScope';
import PermissionGate from '../../components/PermissionGate';

const CustomerTable = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.list);
  const loading = useSelector((state) => state.customers.loading);
  const error = useSelector((state) => state.customers.error);
  const totalPages = useSelector((state) => state.customers.totalPages);
  const total = useSelector((state) => state.customers.total);
  const customization = useSelector((state) => state.customization);
  const navigate = useNavigate();

  // Function to get optimal text color for contrast
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return "white";
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? "gray.700" : "white";
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
  }, [dispatch, currentPage, itemsPerPage, isContractor, contractorGroupId]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const handleEdit = (customer) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        await Swal.fire('Deleted!', 'The customer has been deleted.', 'success');
        const groupId = isContractor ? contractorGroupId : null;
        dispatch(fetchCustomers({ page: currentPage, limit: itemsPerPage, groupId }));
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire('Error!', err.message || 'Failed to delete customer. Please try again.', 'error');
      }
    } else {
      Swal.fire('Cancelled', 'The customer was not deleted.', 'info');
    }
  };

  const sortedFilteredCustomers = useMemo(() => {
    let filtered = customers.filter(
      (cust) =>
        cust.name?.toLowerCase().includes(searchTerm) || cust.email?.toLowerCase().includes(searchTerm),
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]?.toLowerCase?.() ?? '';
        const bVal = b[sortConfig.key]?.toLowerCase?.() ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [customers, searchTerm, sortConfig]);

  const handleNewCustomer = () => {
    navigate('/customers/add');
  };

  const startIdx = total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(startIdx + itemsPerPage - 1, total);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <Container fluid className="p-2 m-2 customer-listing" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Card className="border-0 shadow-sm  mb-2" style={{ background: customization.headerBg || "blue.600", color: customization.headerTextColor || "white" }}>
        <CardBody>
          <Flex>
            <Box>
              <h3 className="text-white mb-1 fw-bold">Customers</h3>
              <p className="text-white-50 mb-0">Manage your customer database</p>
            </Box>
            <Box xs="auto">
              <PermissionGate permission="customers:create">
                <Button 
                  status="light" 
                  className="shadow-sm px-4 fw-semibold"
                  onClick={handleNewCustomer}
                  style={{ 
                    borderRadius: '5px',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Icon as={Plus} />
                  New Customer
                </Button>
              </PermissionGate>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Search and Stats */}
      <Card className="border-0 shadow-sm  mb-1 ">
        <CardBody>
          <Flex>
            <Box md={6} lg={4}>
              <InputGroup>
                <InputLeftAddon style={{ background: 'none', border: 'none' }}>
                  <Icon as={Search} />
                </InputLeftAddon>
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value.toLowerCase());
                    setCurrentPage(1);
                  }}
                  style={{ border: '1px solid #e3e6f0',
                    borderRadius: '10px',
                    fontSize="sm",
                    padding: '12px 16px'
                  }}
                />
              </InputGroup>
            </Box>
            <Box md={6} lg={8} className="text-md-end mt-3 mt-md-0">
              <div className="d-flex justify-content-md-end align-items-center gap-3">
                <Badge 
                  status="info" 
                  className="px-3 py-2"
                  style={{ borderRadius: '20px',
                    fontSize="xs",
                    fontWeight: '500'
                  }}
                >
                  Total: {total || 0} customers
                </Badge>
                <span>
                  Showing {sortedFilteredCustomers?.length || 0} results
                </span>
              </div>
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardBody className="text-center py-5">
            <Spinner colorScheme="blue" size="lg" />
            <p className="text-muted mt-3 mb-0">Loading customers...</p>
          </CardBody>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardBody>
            <div className="alert alert-danger mb-0">
              <strong>Error:</strong> {error}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Desktop Table */}
      {!loading && !error && (
        <Card className="border-0 shadow-sm d-none d-md-block">
          <CardBody>
            <div style={{ overflowX: 'auto' }}>
              <Table hover responsive>
                <Thead style={{ backgroundColor: "gray.50" }}>
                  <Tr>
                    <Th className="border-0 fw-semibold text-muted py-3">
                      Location
                    </Th>
                    <Th 
                      className="border-0 fw-semibold text-muted py-3"
                      onClick={() => handleSort('name')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div>
                        <Icon as={User} size="sm" />
                        Name
                        <span style={{ fontSize: "xs", opacity: 0.7 }}>
                          {getSortIcon('name')}
                        </span>
                      </div>
                    </Th>
                    <Th 
                      className="border-0 fw-semibold text-muted py-3"
                      onClick={() => handleSort('email')}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div>
                        <Icon as={Mail} size="sm" />
                        Email
                        <span style={{ fontSize: "xs", opacity: 0.7 }}>
                          {getSortIcon('email')}
                        </span>
                      </div>
                    </Th>
                    <Th className="border-0 fw-semibold text-muted py-3">
                      Proposals
                    </Th>
                    <Th className="border-0 fw-semibold text-muted py-3">
                      Orders
                    </Th>
                    <Th className="border-0 fw-semibold text-muted py-3 text-center">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sortedFilteredCustomers?.length === 0 ? (
                    <Tr>
                      <Td colSpan="6" className="text-center py-5">
                        <div>
                          <Icon as={Search} size="xl" />
                          <p>No customers found</p>
                          <small>Try adjusting your search criteria</small>
                        </div>
                      </Td>
                    </Tr>
                  ) : (
                    sortedFilteredCustomers?.map((cust) => (
                      <Tr key={cust.id} style={{ transition: 'all 0.2s ease' }}>
                        <Td className="py-3 border-0 border-bottom border-light">
                          <Badge 
                            colorScheme="gray" 
                            className="px-3 py-2"
                            style={{ borderRadius: '15px',
                              fontSize="xs",
                              fontWeight: '500'
                            }}
                          >
                            Main
                          </Badge>
                        </Td>
                        <Td className="py-3 border-0 border-bottom border-light">
                          <div>
                            {cust.name || 'N/A'}
                          </div>
                        </Td>
                        <Td className="py-3 border-0 border-bottom border-light">
                          <span>
                            {cust.email || 'N/A'}
                          </span>
                        </Td>
                        <Td className="py-3 border-0 border-bottom border-light">
                          <Badge 
                            status="info" 
                            className="px-3 py-2"
                            style={{ borderRadius: '20px',
                              fontSize="xs",
                              fontWeight: '500',
                            }}
                          >
                            {cust.proposalCount || 0} Proposals
                          </Badge>
                        </Td>
                        <Td className="py-3 border-0 border-bottom border-light">
                          <Badge 
                            status="success" 
                            className="px-3 py-2"
                            style={{ borderRadius: '20px',
                              fontSize="xs",
                              fontWeight: '500',
                            }}
                          >
                            0 Orders
                          </Badge>
                        </Td>
                        <Td className="py-3 border-0 border-bottom border-light text-center">
                          <div>
                            <PermissionGate action="update" resource="customer" item={cust}>
                              <Button
                                status="light"
                                size="sm"
                                onClick={() => handleEdit(cust)}
                                title="Edit customer"
                               
                                style={{
                                  border: '1px solid #e0e0e0',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Icon as={Edit} size="sm" />
                                Edit
                              </Button>
                            </PermissionGate>
                            <PermissionGate action="delete" resource="customer" item={cust}>
                              <Button
                                status="light"
                                size="sm"
                                onClick={() => handleDelete(cust.id)}
                                title="Delete customer"
                               
                                style={{
                                  border: '1px solid #e0e0e0',
                                  color: "red.500",
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Icon as={Trash} size="sm" />
                                Delete
                              </Button>
                            </PermissionGate>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div>
          {sortedFilteredCustomers?.length === 0 ? (
            <Card>
              <CardBody className="text-center py-5">
                <div>
                  <Icon as={Search} size="xl" />
                  <p>No customers found</p>
                  <small>Try adjusting your search criteria</small>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="mobile-customer-cards">
              {sortedFilteredCustomers?.map((cust) => (
                <Card key={cust.id} className="mb-3 customer-mobile-card border-0 shadow-sm">
                  <CardBody>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center flex-grow-1 min-width-0">
                        <Icon as={User} size="lg" />
                        <div>
                          <div title={cust.name || 'N/A'}>
                            {cust.name || 'N/A'}
                          </div>
                          <Badge 
                            colorScheme="gray" 
                            className="px-2 py-1 mt-1"
                            style={{ borderRadius: '10px',
                              fontSize="xs",
                              fontWeight: '500'
                            }}
                          >
                            Main
                          </Badge>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <div>Email</div>
                      <div>
                        <Icon as={Mail} size="sm" />
                        <span className="text-truncate-mobile text-muted" title={cust.email || 'N/A'}>
                          {cust.email || 'N/A'}
                        </span>
                      </div>

                    {/* Stats */}
                    <div className="row g-2 mb-3">
                      <div>
                        <Badge 
                          status="info" 
                         
                          style={{ borderRadius: '15px',
                            fontSize="xs",
                            fontWeight: '500',
                          }}
                        >
                          {cust.proposalCount || 0} Proposals
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          status="success" 
                         
                          style={{ borderRadius: '15px',
                            fontSize="xs",
                            fontWeight: '500',
                          }}
                        >
                          0 Orders
                        </Badge>
                      </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-center gap-2 customer-card-actions">
                      <PermissionGate action="update" resource="customer" item={cust}>
                        <Button
                          status="light"
                          size="sm"
                          onClick={() => handleEdit(cust)}
                          title="Edit customer"
                         
                          style={{
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Icon as={Edit} size="sm" />
                          Edit
                        </Button>
                      </PermissionGate>
                      <PermissionGate action="delete" resource="customer" item={cust}>
                        <Button
                          status="light"
                          size="sm"
                          onClick={() => handleDelete(cust.id)}
                          title="Delete customer"
                         
                          style={{
                            border: '1px solid #e0e0e0',
                            color: "red.500",
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Icon as={Trash} size="sm" />
                          Delete
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
                               
                                onClick={() => handleEdit(cust)}
                                style={{
                                  borderRadius: '8px',
                                  border: '1px solid #e3e6f0',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleEdit(cust)}
                                title="Edit customer"
                               
                                style={{
                                  border: '1px solid #e0e0e0',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Icon as={Edit} size="sm" />
                                Edit
                              </Button>
                            </PermissionGate>
                            <PermissionGate action="delete" resource="customer" item={cust}>
                              <Button
                                status="light"
                                size="sm"
                                onClick={() => handleDelete(cust.id)}
                                title="Delete customer"
                               
                                style={{
                                  border: '1px solid #e0e0e0',
                                  color: "red.500",
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Icon as={Trash} size="sm" />
                                Delete
                              </Button>
                            </PermissionGate>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </div>
            
            {/* Pagination */}
            
              <div className="p-3 border-top border-light">
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            
          </CardBody>
        </Card>
      )}

      {/* Mobile Card Layout */}
      {!loading && !error && (
        <div>
          {sortedFilteredCustomers?.length === 0 ? (
            <Card>
              <CardBody className="text-center py-5">
                <div>
                  <Icon as={Search} size="xl" />
                  <p>No customers found</p>
                  <small>Try adjusting your search criteria</small>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className="mobile-customer-cards">
              {sortedFilteredCustomers?.map((cust) => (
                <Card key={cust.id} className="mb-3 customer-mobile-card border-0 shadow-sm">
                  <CardBody>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center flex-grow-1 min-width-0">
                        <Icon as={User} size="lg" />
                        <div>
                          <div title={cust.name || 'N/A'}>
                            {cust.name || 'N/A'}
                          </div>
                          <Badge 
                            colorScheme="gray" 
                            className="px-2 py-1 mt-1"
                            style={{ borderRadius: '10px',
                              fontSize="xs",
                              fontWeight: '500'
                            }}
                          >
                            Main
                          </Badge>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <div>Email</div>
                      <div>
                        <Icon as={Mail} size="sm" />
                        <span className="text-truncate-mobile text-muted" title={cust.email || 'N/A'}>
                          {cust.email || 'N/A'}
                        </span>
                      </div>

                    {/* Stats */}
                    <div className="row g-2 mb-3">
                      <div>
                        <Badge 
                          status="info" 
                         
                          style={{ borderRadius: '15px',
                            fontSize="xs",
                            fontWeight: '500',
                          }}
                        >
                          {cust.proposalCount || 0} Proposals
                        </Badge>
                      </div>
                      <div>
                        <Badge 
                          status="success" 
                         
                          style={{ borderRadius: '15px',
                            fontSize="xs",
                            fontWeight: '500',
                          }}
                        >
                          0 Orders
                        </Badge>
                      </div>

                    {/* Actions */}
                    <div className="d-flex justify-content-center gap-2 customer-card-actions">
                      <PermissionGate action="update" resource="customer" item={cust}>
                        <Button
                          status="light"
                          size="sm"
                          onClick={() => handleEdit(cust)}
                          title="Edit customer"
                         
                          style={{
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Icon as={Edit} size="sm" />
                          Edit
                        </Button>
                      </PermissionGate>
                      <PermissionGate action="delete" resource="customer" item={cust}>
                        <Button
                          status="light"
                          size="sm"
                          onClick={() => handleDelete(cust.id)}
                          title="Delete customer"
                         
                          style={{
                            border: '1px solid #e0e0e0',
                            color: "red.500",
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Icon as={Trash} size="sm" />
                          Delete
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

                    </div>
            </div>
        </div>
  )
}

</div>
</div>
export default withContractorScope(CustomerTable, 'customers');