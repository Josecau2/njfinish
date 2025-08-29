import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBadge,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CButton,
  CFormTextarea,
  CFormCheck,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../../../helpers/axiosInstance';
import PageHeader from '../../../../components/PageHeader';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const TypesTab = ({ manufacturer }) => {
  const { t } = useTranslation();
  const api_url = import.meta.env.VITE_API_URL;
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  // Create Type modal state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingType, setCreatingType] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createForm, setCreateForm] = useState({
    typeName: '',
    longDescription: '',
    imageFile: null,
  });
  
  // Filter states
  const [styleFilter, setStyleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [catalogItems, setCatalogItems] = useState([]);
  
  // Bulk type change modal states
  const [bulkTypeChangeModalVisible, setBulkTypeChangeModalVisible] = useState(false);
  const [newTypeCategory, setNewTypeCategory] = useState('');
  const [isChangingType, setIsChangingType] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Modal catalog items for type assignment
  const [modalCatalogItems, setModalCatalogItems] = useState([]);
  const [modalCatalogLoading, setModalCatalogLoading] = useState(false);
  const [modalTypeFilter, setModalTypeFilter] = useState('');
  const [selectedModalItems, setSelectedModalItems] = useState([]);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [assignSuccess, setAssignSuccess] = useState(null); // { count, type }
  // Modal pagination state
  const [modalPage, setModalPage] = useState(1);
  const [modalLimit, setModalLimit] = useState(50);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [modalLoadingMore, setModalLoadingMore] = useState(false);

  // Bulk edit modal states
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    type: '',
    description: ''
  });
  const [isBulkEditing, setIsBulkEditing] = useState(false);

  // Type rename modal states
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [typeNameEditForm, setTypeNameEditForm] = useState({
    oldTypeName: '',
    newTypeName: ''
  });
  const [isRenamingType, setIsRenamingType] = useState(false);
  // Delete type
  const [deleteTypeAsk, setDeleteTypeAsk] = useState({ open: false, typeName: '' });
  const [reassignTypeTo, setReassignTypeTo] = useState('');

  // Handle image load error - memoized to prevent re-renders
  const handleImageError = useCallback((e) => {
    // Only set fallback if not already set to prevent loops
    if (e.target.src.indexOf('/images/nologo.png') === -1 && e.target.src.indexOf('/default-image.png') === -1) {
      e.target.src = '/images/nologo.png';
    }
  }, []);

  // Get image source with fallback logic
  const getImageSrc = useCallback((type) => {
    if (type?.image) {
      return `${api_url}/uploads/types/${type.image}`;
    }
    return '/images/nologo.png';
  }, [api_url]);

  const fetchTypes = useCallback(async () => {
    if (!manufacturer?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/types-meta`, {
        headers: getAuthHeaders(),
      });
      
      if (response.data && Array.isArray(response.data)) {
        setTypes(response.data);
      } else {
        setTypes([]);
      }
    } catch (error) {
      console.error('Error fetching types:', error);
      setError('Failed to load types');
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [manufacturer?.id]);

  const fetchCatalogItems = useCallback(async () => {
    if (!manufacturer?.id) return;
    
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
        headers: getAuthHeaders(),
      });
      
      if (response.data && Array.isArray(response.data)) {
        setCatalogItems(response.data);
      } else {
        setCatalogItems([]);
      }
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      setCatalogItems([]);
    }
  }, [manufacturer?.id]);

  useEffect(() => {
    fetchTypes();
    fetchCatalogItems();
  }, [fetchTypes, fetchCatalogItems]);

  // Filter types based on search term and filters - memoized to prevent unnecessary re-renders
  const filteredTypes = useMemo(() => {
    return types.filter(type => {
      const matchesSearch = type.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStyleFilter = !styleFilter || 
        catalogItems.some(item => 
          item.type === type.type && 
          item.style?.toLowerCase().includes(styleFilter.toLowerCase())
        );
      
      const matchesTypeFilter = !typeFilter || 
        type.type?.toLowerCase().includes(typeFilter.toLowerCase());
      
      return matchesSearch && matchesStyleFilter && matchesTypeFilter;
    });
  }, [types, searchTerm, styleFilter, typeFilter, catalogItems]);

  // Group types by type name - memoized to prevent unnecessary re-renders
  const groupedTypes = useMemo(() => {
    return filteredTypes.reduce((acc, type) => {
      const typeName = type.type || 'Unnamed';
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(type);
      return acc;
    }, {});
  }, [filteredTypes]);

  // Handle type selection
  const handleTypeSelection = useCallback((typeId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, typeId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== typeId));
    }
  }, []);

  // Handle select all types
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedItems(filteredTypes.map(type => type.id));
    } else {
      setSelectedItems([]);
    }
  }, [filteredTypes]);

  // Fetch catalog items for modal
  const fetchModalCatalogItems = useCallback(async ({ reset = false } = {}) => {
    if (!manufacturer?.id) {
      return;
    }
    
    const pageToLoad = reset ? 1 : modalPage;
  // Fetch modal catalog items
    if (reset) {
      setModalCatalogLoading(true);
    } else {
      setModalLoadingMore(true);
    }
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
        headers: getAuthHeaders(),
        params: {
          page: pageToLoad,
          limit: modalLimit,
          search: modalSearchTerm || undefined,
          typeFilter: modalTypeFilter || undefined,
          excludeType: selectedType?.type || undefined,
          sortBy: 'code',
          sortOrder: 'ASC',
        },
      });
  // Modal catalog response received
      
      // Normalize and store response so the UI can access catalogData, filters, etc.
      const payload = response.data;
      if (payload && Array.isArray(payload.catalogData)) {
        // Preferred shape from API: { success, catalogData: [...], pagination, filters, sorting }
        if (reset || !modalCatalogItems || !Array.isArray(modalCatalogItems.catalogData)) {
          setModalCatalogItems(payload);
        } else {
          // Append for pagination
          setModalCatalogItems(prev => ({
            ...payload,
            catalogData: [...(prev?.catalogData || []), ...payload.catalogData],
          }));
        }
        // Update pagination helpers
        const pg = payload.pagination || {};
        setModalHasMore(pg.page < pg.totalPages);
        setModalPage(pg.page + 1);
      } else if (Array.isArray(payload)) {
        // Fallback: API returned raw array
        setModalCatalogItems(payload);
        setModalHasMore(false);
      } else if (payload && Array.isArray(payload.data)) {
        // Fallback: some endpoints use { data: [...] }
        setModalCatalogItems({ catalogData: payload.data });
        setModalHasMore(false);
      } else {
  // Unexpected catalog data format
        setModalCatalogItems([]);
        setModalHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching modal catalog items:', error);
      setModalCatalogItems([]);
      setModalHasMore(false);
    } finally {
      if (reset) {
        setModalCatalogLoading(false);
      } else {
        setModalLoadingMore(false);
      }
    }
  }, [manufacturer?.id, modalPage, modalLimit, modalSearchTerm, modalTypeFilter, selectedType?.type, modalCatalogItems]);

  // Handle edit type
  const handleEditType = useCallback((type) => {
    setSelectedType(type);
    setEditModalVisible(true);
    setSelectedModalItems([]);
    setModalSearchTerm('');
    setModalTypeFilter('');
    setModalPage(1);
    setModalHasMore(true);
    // Fetch catalog items for this manufacturer when modal opens
    setTimeout(() => {
      fetchModalCatalogItems({ reset: true });
    }, 100);
  }, [fetchModalCatalogItems]);

  // Debounce search and type changes to refetch from server with reset
  useEffect(() => {
    if (!editModalVisible) return;
    const h = setTimeout(() => {
      setModalPage(1);
      fetchModalCatalogItems({ reset: true });
    }, 300);
    return () => clearTimeout(h);
  }, [modalSearchTerm, modalTypeFilter, selectedType?.type, editModalVisible]);

  // Load more handler
  const handleLoadMoreModal = useCallback(() => {
    if (modalCatalogLoading || modalLoadingMore || !modalHasMore) return;
    fetchModalCatalogItems({ reset: false });
  }, [modalCatalogLoading, modalLoadingMore, modalHasMore, fetchModalCatalogItems]);

  // Handle file change
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!selectedType || !selectedFile || !manufacturer?.id) return;

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('typeImage', selectedFile);
      formData.append('type', selectedType.type);
  // Keep short description and also include the longDescription metadata
  formData.append('description', selectedType.description || '');
  formData.append('longDescription', (descDrafts[selectedType.type] ?? selectedType.longDescription ?? ''));
      formData.append('manufacturerId', manufacturer.id);
      formData.append('catalogId', selectedType.id);

      const response = await axiosInstance.post('/api/manufacturers/type/create', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
        }
      });

      if (response.data.success) {
        await fetchTypes();
        setEditModalVisible(false);
        setSelectedType(null);
        setSelectedFile(null);
      } else {
        setError('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }, [selectedType, selectedFile, manufacturer?.id, fetchTypes]);

  // Handle bulk edit
  const handleBulkEdit = useCallback(async () => {
    if (selectedItems.length === 0 || !manufacturer?.id) return;

    setIsBulkEditing(true);
    
    try {
      const response = await axiosInstance.post('/api/manufacturers/bulk-edit-types', {
        manufacturerId: manufacturer.id,
        itemIds: selectedItems,
        updates: bulkEditForm
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        await fetchTypes();
        setBulkEditModalVisible(false);
        setSelectedItems([]);
        setBulkEditForm({ type: '', description: '' });
      } else {
        setError('Failed to update types');
      }
    } catch (error) {
      console.error('Error updating types:', error);
      setError('Failed to update types');
    } finally {
      setIsBulkEditing(false);
    }
  }, [selectedItems, manufacturer?.id, bulkEditForm, fetchTypes]);

  // Handle type rename
  const handleTypeRename = useCallback(async () => {
    if (!typeNameEditForm.oldTypeName || !typeNameEditForm.newTypeName || !manufacturer?.id) return;

    setIsRenamingType(true);
    
    try {
      const response = await axiosInstance.post('/api/manufacturers/edit-type-name', {
        manufacturerId: manufacturer.id,
        oldTypeName: typeNameEditForm.oldTypeName,
        newTypeName: typeNameEditForm.newTypeName
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        await fetchTypes();
        setRenameModalVisible(false);
        setTypeNameEditForm({ oldTypeName: '', newTypeName: '' });
      } else {
        setError('Failed to rename type');
      }
    } catch (error) {
      console.error('Error renaming type:', error);
      setError('Failed to rename type');
    } finally {
      setIsRenamingType(false);
    }
  }, [typeNameEditForm.oldTypeName, typeNameEditForm.newTypeName, manufacturer?.id, fetchTypes]);

  // Handle bulk type change
  const handleBulkTypeChange = useCallback(async () => {
    if (selectedItems.length === 0 || !manufacturer?.id || !newTypeCategory) return;

    setIsChangingType(true);
    
    try {
      const response = await axiosInstance.post('/api/manufacturers/bulk-change-type', {
        manufacturerId: manufacturer.id,
        itemIds: selectedItems,
        newType: newTypeCategory
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        await fetchTypes();
        await fetchCatalogItems();
        setBulkTypeChangeModalVisible(false);
        setSelectedItems([]);
        setNewTypeCategory('');
      } else {
        setError('Failed to change type category');
      }
    } catch (error) {
      console.error('Error changing type category:', error);
      setError('Failed to change type category');
    } finally {
      setIsChangingType(false);
    }
  }, [selectedItems, manufacturer?.id, newTypeCategory, fetchTypes, fetchCatalogItems]);

  // Handle modal catalog item selection
  const handleModalItemSelection = useCallback((itemId, isSelected) => {
    setSelectedModalItems(prev => 
      isSelected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  }, []);

  // Handle select all modal items
  const handleSelectAllModalItems = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedModalItems(filteredModalItems.map(item => item.id));
    } else {
      setSelectedModalItems([]);
    }
  }, []);

  // Assign selected catalog items to current type
  const handleAssignItemsToType = useCallback(async () => {
    if (!selectedType || selectedModalItems.length === 0 || !manufacturer?.id) return;

    setModalCatalogLoading(true);
    try {
      const response = await axiosInstance.post('/api/manufacturers/assign-items-to-type', {
        manufacturerId: manufacturer.id,
        itemIds: selectedModalItems,
        newType: selectedType.type
      }, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        await fetchTypes();
        await fetchCatalogItems();
        await fetchModalCatalogItems();
        setSelectedModalItems([]);
        // Show in-app success confirmation (auto hides)
        setAssignSuccess({ count: selectedModalItems.length, type: selectedType.type });
        setTimeout(() => setAssignSuccess(null), 3000);
      } else {
        setError('Failed to assign items to type');
      }
    } catch (error) {
      console.error('Error assigning items to type:', error);
      setError('Failed to assign items to type');
    } finally {
      setModalCatalogLoading(false);
    }
  }, [selectedType, selectedModalItems, manufacturer?.id, fetchTypes, fetchCatalogItems, fetchModalCatalogItems]);

  // Filter modal catalog items
  const filteredModalItems = useMemo(() => {
  // Compute filtered modal items
    
    // Extract the actual catalog data from the API response (supports multiple shapes)
    const catalogData = (modalCatalogItems && Array.isArray(modalCatalogItems.catalogData))
      ? modalCatalogItems.catalogData
      : (Array.isArray(modalCatalogItems) ? modalCatalogItems : []);
    
    if (!Array.isArray(catalogData)) {
  // catalogData not in expected array format
      return [];
    }

    // Gate: don't show anything until the user searches or selects a type
    if (!modalSearchTerm && !modalTypeFilter) {
      return [];
    }

    const filtered = catalogData.filter(item => {
      // Exclude items that already belong to the current type
      const doesNotHaveCurrentType = item.type !== selectedType?.type;

      const matchesSearch = !modalSearchTerm ||
        item.description?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
        item.style?.toLowerCase().includes(modalSearchTerm.toLowerCase());

      const matchesTypeFilter = !modalTypeFilter || item.type === modalTypeFilter;

      return doesNotHaveCurrentType && matchesSearch && matchesTypeFilter;
    });
    
    return filtered;
  }, [modalCatalogItems, modalSearchTerm, modalTypeFilter, selectedType]);

  // Fix the dependency array for handleSelectAllModalItems
  const handleSelectAllModalItemsFixed = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedModalItems(filteredModalItems.map(item => item.id));
    } else {
      setSelectedModalItems([]);
    }
  }, [filteredModalItems]);

  // Get unique styles and types for filter dropdowns
  const uniqueStyles = useMemo(() => {
    const styles = [...new Set(catalogItems.map(item => item.style).filter(Boolean))];
    return styles.sort();
  }, [catalogItems]);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(catalogItems.map(item => item.type).filter(Boolean))];
    return types.sort();
  }, [catalogItems]);

  // New state and handler for type description drafts
  const [savingDescId, setSavingDescId] = useState(null);
  const [descDrafts, setDescDrafts] = useState({}); // { [typeName]: string }

  const saveTypeDescription = useCallback(async (typeName) => {
    if (!manufacturer?.id) return;
    const newDesc = descDrafts[typeName] ?? '';
    setSavingDescId(typeName);
    try {
      const res = await axiosInstance.post('/api/manufacturers/type/update-meta', {
        manufacturerId: manufacturer.id,
        type: typeName,
        longDescription: newDesc
      }, { headers: getAuthHeaders() });
      if (res.data?.success) {
        await fetchTypes();
      }
    } catch (e) {
      console.error('Failed to save type description', e);
      setError(t('types.meta.saveFailed', 'Failed to save description'));
    } finally {
      setSavingDescId(null);
    }
  }, [manufacturer?.id, descDrafts, fetchTypes, t]);

  if (!manufacturer) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CAlert color="warning">Please select a manufacturer to view types.</CAlert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div>
      <CCard>
        <CCardHeader className="bg-light border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0 fw-bold text-primary">{t('types.ui.header', 'Type Pictures & Management')}</h4>
            <div className="d-flex gap-2">
              <CButton
                color="success"
                size="sm"
                onClick={() => {
                  setCreateForm({ typeName: '', longDescription: '', imageFile: null });
                  setCreateError(null);
                  setCreateModalVisible(true);
                }}
              >
                {t('types.ui.createType', 'Create Type')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              >
                {viewMode === 'grid' ? t('types.ui.tableView', 'Table View') : t('types.ui.gridView', 'Grid View')}
              </CButton>
              
              {selectedItems.length > 0 && (
                <CDropdown>
                  <CDropdownToggle color="secondary" size="sm">
                    {t('types.ui.actions', 'Actions')} ({selectedItems.length})
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => setBulkEditModalVisible(true)}>
                      Bulk Edit
                    </CDropdownItem>
                    <CDropdownItem 
                      onClick={() => {
                        const firstType = types.find(t => selectedItems.includes(t.id));
                        if (firstType) {
                          setTypeNameEditForm({
                            oldTypeName: firstType.type,
                            newTypeName: ''
                          });
                          setRenameModalVisible(true);
                        }
                      }}
                    >
                      Rename Type Globally
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
              )}
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="p-4">
          {/* Search Bar */}
          <div className="mb-4">
            <CFormLabel className="fw-semibold text-dark mb-2">{t('types.ui.searchLabel', 'Search Types')}</CFormLabel>
            <CInputGroup size="lg">
              <CInputGroupText className="bg-primary text-white">
                <i className="bi bi-search"></i>
              </CInputGroupText>
              <CFormInput
                placeholder={t('types.ui.searchPlaceholder', 'Search types...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-lg"
              />
            </CInputGroup>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 p-3 bg-light rounded">
            <CRow className="g-3">
              <CCol md={5}>
                <CFormLabel className="fw-semibold text-primary">{t('types.ui.filterByStyle', 'Filter by Style')}</CFormLabel>
                <CFormInput
                  placeholder="Filter by style..."
                  value={styleFilter}
                  onChange={(e) => setStyleFilter(e.target.value)}
                  list="stylesList"
                  size="sm"
                  className="border-primary"
                />
                <datalist id="stylesList">
                  {uniqueStyles.map(style => (
                    <option key={style} value={style} />
                  ))}
                </datalist>
              </CCol>
              <CCol md={5}>
                <CFormLabel className="fw-semibold text-primary">{t('types.ui.filterByType', 'Filter by Type')}</CFormLabel>
                <CFormInput
                  placeholder="Filter by type..."
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  list="typesList"
                  size="sm"
                  className="border-primary"
                />
                <datalist id="typesList">
                  {uniqueTypes.map(type => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </CCol>
              <CCol md={2} className="d-flex align-items-end justify-content-center">
                <CButton
                  color="outline-primary"
                  size="sm"
                  onClick={() => {
                    setStyleFilter('');
                    setTypeFilter('');
                    setSearchTerm('');
                  }}
                  className="w-100 fw-semibold"
                >
                  {t('types.ui.clearFilters', 'Clear Filters')}
                </CButton>
              </CCol>
            </CRow>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <CRow className="mb-3">
              <CCol>
                <CAlert color="info">
                  {selectedItems.length} item(s) selected
                  <div className="mt-2">
                    <CButton
                      color="primary"
                      size="sm"
                      onClick={() => setBulkTypeChangeModalVisible(true)}
                      className="me-2"
                    >
                      Change Type Category
                    </CButton>
                    <CButton
                      color="warning"
                      size="sm"
                      onClick={() => setBulkEditModalVisible(true)}
                      className="me-2"
                    >
                      Bulk Edit
                    </CButton>
                    <CButton
                      color="secondary"
                      size="sm"
                      onClick={() => setSelectedItems([])}
                    >
                      Clear Selection
                    </CButton>
                  </div>
                </CAlert>
              </CCol>
            </CRow>
          )}

          {error && (
            <CAlert color="danger" dismissible onClose={() => setError(null)}>
              {error}
            </CAlert>
          )}

          {viewMode === 'grid' ? (
            // Grid View
            <>
              <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25">
                <CFormCheck
                  id="selectAll"
                  label={`Select All (${filteredTypes.length} types)`}
                  checked={selectedItems.length === filteredTypes.length && filteredTypes.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="fw-semibold text-primary"
                  style={{ fontSize: '1.1rem' }}
                />
              </div>

              {Object.keys(groupedTypes).length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-images" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                  <h5 className="mt-3 text-muted">{t('types.ui.noTypesFound', 'No types found')}</h5>
                  <p className="text-muted">
                    {searchTerm ? t('types.ui.tryAdjust', 'Try adjusting your search criteria') : t('types.ui.typesWillAppear', 'Types will appear here when available')}
                  </p>
                </div>
              ) : (
                <div className="row g-2">
                  {Object.entries(groupedTypes).map(([typeName, typeItems]) => (
                    <div key={typeName} className="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                      <div className="mb-2">
                        <h6 className="fw-bold text-primary mb-2" style={{ fontSize: '0.95rem' }}>
                          {typeName}
                        </h6>
                      </div>
                      <div className="row g-2">
                        {typeItems.map((type) => (
                          <div key={type.id} className="col-4 col-md-3 col-lg-2 col-xl-2">
                            <div className="card h-100 border-0" style={{ backgroundColor: '#f8f9fa', aspectRatio: '1', minHeight: '220px' }}>
                              <div 
                                className="position-relative flex-grow-1 d-flex align-items-center justify-content-center p-2"
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredId(type.id)}
                                onMouseLeave={() => setHoveredId(null)}
                              >
                                <img
                                  src={getImageSrc(type)}
                                  alt={type.type}
                                  style={{
                                    width: '100%',
                                    height: '120px',
                                    objectFit: 'contain',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px'
                                  }}
                                  onError={handleImageError}
                                />
                                <div
                                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                  style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    color: '#fff',
                                    opacity: hoveredId === type.id ? 1 : 0,
                                    transition: 'opacity 0.3s ease',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    borderRadius: '8px',
                                  }}
                                >
                                  <CButton
                                    color="light"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditType(type);
                                    }}
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    <i className="bi bi-pencil"></i> {t('types.meta.editType', 'Edit Type')}
                                  </CButton>
                                  <CButton
                                    color="danger"
                                    size="sm"
                                    className="ms-2"
                                    onClick={(e)=>{ e.stopPropagation(); setDeleteTypeAsk({ open: true, typeName: type.type }); setReassignTypeTo(''); }}
                                    style={{ fontSize: '0.75rem' }}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </CButton>
                                </div>
                              </div>
                              {/* Description under the picture (read-only in cards) */}
                              <div className="px-2 pt-2">
                                <div className="small text-muted" style={{ minHeight: '2.5em' }}>
                                  {type.longDescription || t('types.meta.descriptionPlaceholder', 'Add a description for this type')}
                                </div>
                                <div className="d-flex justify-content-end align-items-center mt-2">
                                  <CFormCheck
                                    id={`type-${type.id}`}
                                    checked={selectedItems.includes(type.id)}
                                    onChange={(e) => handleTypeSelection(type.id, e.target.checked)}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Table View
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>
                    <CFormCheck
                      id="selectAllTable"
                      checked={selectedItems.length === filteredTypes.length && filteredTypes.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell>Image</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Description</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredTypes.map((type) => (
                  <CTableRow key={type.id}>
                    <CTableDataCell>
                      <CFormCheck
                        id={`table-type-${type.id}`}
                        checked={selectedItems.includes(type.id)}
                        onChange={(e) => handleTypeSelection(type.id, e.target.checked)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <img
                        src={getImageSrc(type)}
                        alt={type.type}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px'
                        }}
                        onError={handleImageError}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="secondary">{type.type}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell>{type.description || 'No description'}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="primary"
                        size="sm"
                        onClick={() => handleEditType(type)}
                      >
                        <i className="bi bi-pencil"></i>
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Image Edit Modal */}
      <style>{`
        .no-gradient-modal .modal-header {
          background: #fff !important;
          border-bottom: 1px solid #dee2e6 !important;
          color: #212529 !important;
        }
        .no-gradient-modal .modal-title {
          color: #212529 !important;
        }
      `}</style>
      <CModal 
        visible={editModalVisible} 
        onClose={() => {
          setEditModalVisible(false);
          setSelectedType(null);
          setSelectedFile(null);
        }}
        size="xl"
        className="no-gradient-modal"
      >
        <PageHeader title="Edit Type" />
        <CModalBody>
          {selectedType && (
            <CRow>
              {/* Left Column - Image Management */}
              <CCol md={6}>
                <div className="mb-3">
                  <strong>{t('types.meta.type', 'Type')}:</strong> {selectedType.type}
                </div>
                
                {/* Current Image Preview */}
                <div className="mb-4">
                  <h6>{t('types.meta.currentImage', 'Current Image')}:</h6>
                  <div 
                    className="d-flex justify-content-center p-3 border rounded"
                    style={{ backgroundColor: '#f8f9fa' }}
                  >
                    <img
                      src={getImageSrc(selectedType)}
                      alt={selectedType.type}
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px'
                      }}
                      onError={handleImageError}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="mb-3">
                  <CFormLabel htmlFor="imageUpload">{t('types.meta.uploadNewImage', 'Upload New Image')}:</CFormLabel>
                  <input
                    type="file"
                    id="imageUpload"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="mt-2 text-muted">
                    {selectedFile ? (
                      <>{t('types.ui.selected', 'Selected')}: {selectedFile.name}</>
                    ) : selectedType.image ? (
                      <>Current: {selectedType.image}</>
                    ) : (
                      <>{t('types.ui.noImage', 'No image uploaded')}</>
                    )}
                  </div>
                </div>

                {/* Preview of new image */}
                {selectedFile && (
                  <div className="mb-3">
                    <h6>{t('types.meta.newImagePreview', 'New Image Preview')}:</h6>
                    <div 
                      className="d-flex justify-content-center p-3 border rounded"
                      style={{ backgroundColor: '#f8f9fa' }}
                    >
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Type description editor inside modal (optional) */}
                <div className="mt-3">
                  <CFormLabel>{t('types.meta.descriptionLabel', 'Type Description')}</CFormLabel>
                  <CFormTextarea
                    rows={3}
                    placeholder={t('types.meta.descriptionPlaceholder', 'Add a description for this type')}
                    value={descDrafts[selectedType.type] ?? selectedType.longDescription ?? ''}
                    onChange={(e) => setDescDrafts(prev => ({ ...prev, [selectedType.type]: e.target.value }))
                    }
                  />
                  <div className="mt-2 d-flex gap-2">
                    <CButton size="sm" color="primary" disabled={savingDescId === selectedType.type} onClick={() => saveTypeDescription(selectedType.type)}>
                      {savingDescId === selectedType.type ? (<><CSpinner size="sm" className="me-2" />{t('common.saving', 'Saving...')}</>) : t('common.save', 'Save')}
                    </CButton>
                  </div>
                </div>
              </CCol>

              {/* Right Column - Catalog Items Assignment */}
              <CCol md={6}>
                <div className="mb-3">
                  <h6 className="fw-bold text-primary">{t('types.assign.header', 'Assign Catalog Items to This Type')}</h6>
                  <p className="text-muted small mb-3">
                    {t('types.assign.help', 'Select catalog items from this manufacturer to assign them to the "{{type}}" type.', { type: selectedType.type })}
                  </p>
                  
                  {/* Search and Filter */}
                  <CInputGroup className="mb-3" size="sm">
                    <CInputGroupText>
                      <i className="bi bi-search"></i>
                    </CInputGroupText>
                    <CFormInput
                      placeholder={t('common.searchItems', 'Search items...')}
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                    />
                  </CInputGroup>

                  <CFormInput
                    placeholder={t('types.assign.filterByCurrentType', 'Filter by current type...')}
                    value={modalTypeFilter}
                    onChange={(e) => setModalTypeFilter(e.target.value)}
                    size="sm"
                    className="mb-3"
                  />

                  {/* Type badges sourced from API filters (complete set) */}
          {(modalCatalogItems?.filters?.uniqueTypes?.length) && (
                    <div className="mb-3">
            <small className="text-muted">{t('types.assign.filterByType', 'Filter by type:')}</small>
                      <div className="d-flex flex-wrap gap-1 mt-1">
                        {modalCatalogItems.filters.uniqueTypes
                        .filter(tn => tn && tn !== selectedType?.type)
                        .slice(0, 40)
                        .map((type, index) => (
                          <span 
                            key={index}
                            className="badge bg-secondary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setModalTypeFilter(type)}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Select All */}
                  <div className="mb-3 p-2 bg-light rounded">
                    <CFormCheck
                      id="selectAllModal"
                      label={`${t('common.selectAll', 'Select All')} (${filteredModalItems.length} ${t('common.items', 'items')})`}
                      checked={selectedModalItems.length === filteredModalItems.length && filteredModalItems.length > 0}
                      onChange={(e) => handleSelectAllModalItemsFixed(e.target.checked)}
                      className="fw-semibold"
                    />
                  </div>

                  {/* Catalog Items List */}
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {modalCatalogLoading ? (
                      <div className="text-center py-3">
                        <CSpinner size="sm" className="me-2" />
                        {t('types.assign.loading', 'Loading catalog items...')}
                      </div>
                    ) : (!modalSearchTerm && !modalTypeFilter) ? (
                      <div className="text-center py-3 text-muted">
                        {t('types.assign.startHint', 'Type a search term or click a type badge to load items.')}
                      </div>
                    ) : filteredModalItems.length === 0 ? (
                      <div className="text-center py-3 text-muted">
                        {modalCatalogItems?.catalogData?.length > 0 ? 
                          (modalSearchTerm || modalTypeFilter ? 
                            t('types.assign.noMatch', 'No items match your search criteria') : 
                            t('types.assign.noneAvailable', 'No items available to assign (all items already belong to "{{type}}" or other types)', { type: selectedType?.type })
                          ) : 
                          t('types.assign.noCatalog', 'No catalog items found for this manufacturer')
                        }
                      </div>
                    ) : (
                      <>
                        {filteredModalItems.map((item) => (
                          <div
                            key={item.id}
                            className="border rounded p-2 mb-2 bg-white"
                            role="button"
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleModalItemSelection(item.id, !selectedModalItems.includes(item.id))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleModalItemSelection(item.id, !selectedModalItems.includes(item.id));
                              }
                            }}
                          >
                            <CFormCheck
                              id={`modal-item-${item.id}`}
                              checked={selectedModalItems.includes(item.id)}
                              onChange={(e) => handleModalItemSelection(item.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              label={
                                <div>
                                  <div className="fw-semibold">{item.description}</div>
                                  <div className="text-muted small">
                                    {t('types.assign.currentType', 'Current Type')}: {item.type || t('common.none', 'None')} | {t('common.style', 'Style')}: {item.style || t('common.none', 'None')}
                                  </div>
                                </div>
                              }
                            />
                          </div>
                        ))}
                        {modalHasMore && (modalSearchTerm || modalTypeFilter) && (
                          <div className="text-center py-2">
                            <CButton size="sm" color="light" disabled={modalLoadingMore} onClick={handleLoadMoreModal}>
                              {modalLoadingMore ? t('common.loading', 'Loading…') : t('common.loadMore', 'Load more')}
                            </CButton>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Assignment Button */}
                  {selectedModalItems.length > 0 && (
                    <div className="mt-3">
                      <CButton
                        color="success"
                        size="sm"
                        onClick={handleAssignItemsToType}
                        disabled={modalCatalogLoading}
                        className="w-100"
                      >
                        {t('types.assign.assignCTA', 'Assign {{count}} item(s) to "{{type}}"', { count: selectedModalItems.length, type: selectedType.type })}
                      </CButton>
                    </div>
                  )}
                </div>
              </CCol>
            </CRow>
          )}
        </CModalBody>
          {assignSuccess && (
            <CAlert color="success" className="mb-3">
              {t('types.assign.assignedSuccess', 'Successfully assigned {{count}} items to {{type}}', { count: assignSuccess.count, type: assignSuccess.type })}
            </CAlert>
          )}
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => {
              setEditModalVisible(false);
              setSelectedType(null);
              setSelectedFile(null);
              setSelectedModalItems([]);
              setModalSearchTerm('');
              setModalTypeFilter('');
            }}
          >
            {t('common.cancel', 'Cancel')}
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleImageUpload}
            disabled={!selectedFile || uploadingImage}
          >
            {uploadingImage ? (
              <>
                <CSpinner size="sm" className="me-2" />
                {t('common.uploading', 'Uploading...')}
              </>
            ) : (
              t('types.assign.uploadImage', 'Upload Image')
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Type Confirm */}
      <CModal visible={deleteTypeAsk.open} onClose={()=>setDeleteTypeAsk({open:false,typeName:''})} className="no-gradient-modal">
        <PageHeader title={t('types.delete.header','Delete Type')} />
        <CModalBody>
          <p>{t('types.delete.confirm','Delete type')} <strong>{deleteTypeAsk.typeName}</strong>?</p>
          <CFormLabel>{t('types.delete.reassign','Reassign items to (leave empty to clear)')}</CFormLabel>
          <CFormInput value={reassignTypeTo} onChange={(e)=>setReassignTypeTo(e.target.value)} placeholder={t('types.delete.reassignPh','New type name or blank')} />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={()=>setDeleteTypeAsk({open:false,typeName:''})}>{t('common.cancel','Cancel')}</CButton>
          <CButton color="danger" onClick={async()=>{
            try{
              await axiosInstance.delete(`/api/manufacturers/${manufacturer.id}/type/${encodeURIComponent(deleteTypeAsk.typeName)}`, { data: { reassignTo: reassignTypeTo }, headers: getAuthHeaders() });
              await fetchTypes();
              await fetchCatalogItems();
            }catch(e){ console.error(e); }
            finally{ setDeleteTypeAsk({open:false,typeName:''}); setReassignTypeTo(''); }
          }}>{t('common.delete','Delete')}</CButton>
        </CModalFooter>
      </CModal>

      {/* Create Type Modal */}
      <CModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        className="no-gradient-modal"
      >
        <PageHeader title={t('types.create.header', 'Create New Type')} />
        <CModalBody>
          {createError && (
            <CAlert color="danger" dismissible onClose={() => setCreateError(null)}>
              {createError}
            </CAlert>
          )}
          <div className="mb-3">
            <CFormLabel>{t('types.create.typeName', 'Type Name')}</CFormLabel>
            <CFormInput
              value={createForm.typeName}
              onChange={(e) => setCreateForm(prev => ({ ...prev, typeName: e.target.value }))}
              placeholder={t('types.create.typeNamePh', 'e.g., Base Drawer Cabinet')}
            />
          </div>
          <div className="mb-3">
            <CFormLabel>{t('types.create.description', 'Description')}</CFormLabel>
            <CFormTextarea
              rows={3}
              value={createForm.longDescription}
              onChange={(e) => setCreateForm(prev => ({ ...prev, longDescription: e.target.value }))}
              placeholder={t('types.meta.descriptionPlaceholder', 'Add a description for this type')}
            />
          </div>
          <div className="mb-3">
            <CFormLabel>{t('types.create.image', 'Image (optional)')}</CFormLabel>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => setCreateForm(prev => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
            />
            {createForm.imageFile && (
              <div className="small text-muted mt-1">{t('types.ui.selected', 'Selected')}: {createForm.imageFile.name}</div>
            )}
          </div>
          <div className="alert alert-info small">
            {t('types.create.note', 'Note: If this manufacturer has no catalog items yet, you will need to upload a catalog before creating type metadata.')}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setCreateModalVisible(false)} disabled={creatingType}>
            {t('common.cancel', 'Cancel')}
          </CButton>
          <CButton
            color="primary"
            disabled={creatingType || !createForm.typeName.trim()}
            onClick={async () => {
              if (!manufacturer?.id) return;
              setCreatingType(true);
              setCreateError(null);
              try {
                // 1) Create/update metadata
                const metaRes = await axiosInstance.post('/api/manufacturers/type/update-meta', {
                  manufacturerId: manufacturer.id,
                  type: createForm.typeName.trim(),
                  longDescription: createForm.longDescription || ''
                }, { headers: getAuthHeaders() });

                if (!metaRes.data?.success) {
                  throw new Error(metaRes.data?.message || 'Failed to save type metadata');
                }

                // 2) Optional image upload
                if (createForm.imageFile) {
                  const fd = new FormData();
                  fd.append('typeImage', createForm.imageFile);
                  fd.append('type', createForm.typeName.trim());
                  fd.append('manufacturerId', manufacturer.id);
                  fd.append('longDescription', createForm.longDescription || '');
                  await axiosInstance.post('/api/manufacturers/type/create', fd, {
                    headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() }
                  });
                }

                // Refresh and close
                await fetchTypes();
                setCreateModalVisible(false);
              } catch (err) {
                console.error('Create type failed:', err);
                const msg = err?.response?.data?.message || err?.message || 'Failed to create type';
                setCreateError(msg);
              } finally {
                setCreatingType(false);
              }
            }}
          >
            {creatingType ? (<><CSpinner size="sm" className="me-2" />{t('common.saving', 'Saving...')}</>) : t('types.create.createCta', 'Create Type')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Edit Modal */}
      <CModal visible={bulkEditModalVisible} onClose={() => setBulkEditModalVisible(false)} size="lg" className="no-gradient-modal">
        <PageHeader title={`Bulk Edit ${selectedItems.length} Types`} />
        <CModalBody>
          <div>
            <p>Edit the following fields for the selected {selectedItems.length} types. Leave fields empty to keep existing values.</p>
            
            <div className="row g-3">
              <div className="col-md-6">
                <CFormLabel>Type</CFormLabel>
                <CFormInput
                  type="text"
                  value={bulkEditForm.type}
                  onChange={(e) => setBulkEditForm({...bulkEditForm, type: e.target.value})}
                  placeholder="Leave empty to keep existing"
                />
              </div>
              
              <div className="col-12">
                <CFormLabel>Description</CFormLabel>
                <CFormTextarea
                  value={bulkEditForm.description}
                  onChange={(e) => setBulkEditForm({...bulkEditForm, description: e.target.value})}
                  placeholder="Leave empty to keep existing"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>Note:</strong> Only the fields you fill will be updated. Empty fields will preserve the existing values for each item.
              </small>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => setBulkEditModalVisible(false)}
            disabled={isBulkEditing}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary"
            onClick={handleBulkEdit}
            disabled={isBulkEditing}
          >
            {isBulkEditing ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Updating {selectedItems.length} Types...
              </>
            ) : (
              `Update ${selectedItems.length} Types`
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Type Rename Modal */}
      <CModal visible={renameModalVisible} onClose={() => setRenameModalVisible(false)} className="no-gradient-modal">
        <PageHeader title="Rename Type Globally" />
        <CModalBody>
          <div>
            <p>Rename the type for all items of this manufacturer. This will affect all catalog items currently using this type.</p>
            
            <div className="mb-3">
              <CFormLabel>Current Type Name</CFormLabel>
              <CFormInput
                type="text"
                value={typeNameEditForm.oldTypeName}
                disabled
                className="bg-light"
              />
            </div>
            
            <div className="mb-3">
              <CFormLabel>New Type Name</CFormLabel>
              <CFormInput
                type="text"
                value={typeNameEditForm.newTypeName}
                onChange={(e) => setTypeNameEditForm({...typeNameEditForm, newTypeName: e.target.value})}
                placeholder="Enter new type name"
              />
            </div>
            
            <div className="alert alert-warning">
              <strong>Warning:</strong> This will rename the type globally for all items in this manufacturer's catalog.
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => setRenameModalVisible(false)}
            disabled={isRenamingType}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary"
            onClick={handleTypeRename}
            disabled={isRenamingType || !typeNameEditForm.newTypeName.trim()}
          >
            {isRenamingType ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Renaming...
              </>
            ) : (
              'Rename Type'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Type Change Modal */}
      <CModal 
        visible={bulkTypeChangeModalVisible} 
        onClose={() => {
          setBulkTypeChangeModalVisible(false);
          setNewTypeCategory('');
        }} 
        className="no-gradient-modal"
      >
        <PageHeader title="Change Type Category" />
        <CModalBody>
          <p>Change the type category for {selectedItems.length} selected item(s).</p>
          
          <CFormLabel>New Type Category</CFormLabel>
          <CFormInput
            placeholder="Enter new type category..."
            value={newTypeCategory}
            onChange={(e) => setNewTypeCategory(e.target.value)}
            list="existingTypesList"
          />
          <datalist id="existingTypesList">
            {uniqueTypes.map(type => (
              <option key={type} value={type} />
            ))}
          </datalist>
          <small className="text-muted">
            You can enter a new type category or select from existing ones.
          </small>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            onClick={() => {
              setBulkTypeChangeModalVisible(false);
              setNewTypeCategory('');
            }}
            disabled={isChangingType}
          >
            Cancel
          </CButton>
          <CButton 
            color="primary"
            onClick={handleBulkTypeChange}
            disabled={isChangingType || !newTypeCategory.trim()}
          >
            {isChangingType ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Changing...
              </>
            ) : (
              'Change Type Category'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default TypesTab;
