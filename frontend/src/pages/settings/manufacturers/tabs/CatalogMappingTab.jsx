import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import PageHeader from '../../../../components/PageHeader';

// Authorization is handled centrally by axios interceptors

import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CFormTextarea,
  CFormSelect,
  CFormLabel
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSortAscending, cilSortDescending } from '@coreui/icons';
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { fetchManufacturerById } from '../../../../store/slices/manufacturersSlice';
import axiosInstance from '../../../../helpers/axiosInstance';
import CreatableSelect from 'react-select/creatable';

const CatalogMappingTab = ({ manufacturer, id }) => {
  const { t } = useTranslation();
  const api_url = import.meta.env.VITE_API_URL;
  const customization = useSelector((state) => state.customization);
  const headerBg = customization?.headerBg || '#321fdb';
  const textColor = customization?.headerTextColor || '#ffffff';

  // Server-side paginated catalog data (avoid loading all items at once)
  const [catalogData, setCatalogData] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [filterMeta, setFilterMeta] = useState({ uniqueTypes: [], uniqueStyles: [] });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Sorting state - default to alphabetical by code
  const [sortBy, setSortBy] = useState('code');
  const [sortOrder, setSortOrder] = useState('ASC');

  const getInitialItemsPerPage = () => {
    const saved = localStorage.getItem('catalogItemsPerPage');
    return saved ? parseInt(saved, 10) : 50;
  };

  const [typeFilter, setTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');


  const uniqueTypes = filterMeta.uniqueTypes || [];
  const typeOptions = uniqueTypes.map((type) => ({
    value: type,
    label: type,
  }));



  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage());

  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add loading state for manual save


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;


  // const currentItems = catalogData.slice(indexOfFirstItem, indexOfLastItem);
  // const totalPages = Math.ceil(catalogData.length / itemsPerPage);
  // const filteredCatalogData = typeFilter
  //   ? catalogData.filter(item => item.type === typeFilter)
  //   : catalogData;

  // Use data as-is; backend applies filters and pagination
  const filteredCatalogData = catalogData;
  const totalPages = pagination.totalPages || Math.ceil(filteredCatalogData.length / itemsPerPage);
  const currentItems = filteredCatalogData;

  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [showHingesModal, setShowHingesModal] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);

  const [assemblyData, setAssemblyData] = useState({
    type: '',
    price: '',
    applyTo: 'one',
    selectedTypes: []
  });
  const [availableTypes, setAvailableTypes] = useState([]);
  const [assemblyCostsByType, setAssemblyCostsByType] = useState({});

  const [hingesData, setHingesData] = useState({
    leftHingePrice: '',
    rightHingePrice: '',
    bothHingePrice: '',
    exposedSidePrice: '',
  });
  const [modificationData, setModificationData] = useState({ modificationName: '', price: '', notes: '', description: '' });


  const [styleImage, setStyleImage] = useState(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState([]);




  const uniqueStyles = filterMeta.uniqueStyles || [];
  const sortedUniqueStyles = [...uniqueStyles];
  const styleOptions = sortedUniqueStyles.map((style) => ({
    value: style,
    label: style,
  }));


  // Initialize form with proper default values
  const initialManualForm = {
    style: '',
    type: '',
    code: '',
    description: '',
    price: '',
  };


  const [manualForm, setManualForm] = useState(initialManualForm);

  // Fetch paginated catalog data from backend
  const fetchCatalogData = async (page = currentPage, limit = itemsPerPage, type = typeFilter, style = styleFilter, sort = sortBy, order = sortOrder) => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const params = {
        page: String(page),
        limit: String(limit),
        sortBy: sort,
        sortOrder: order,
        ...(type ? { typeFilter: type } : {}),
        ...(style ? { styleFilter: style } : {}),
      };
      const { data } = await axiosInstance.get(`/api/manufacturers/${id}/catalog`, {
        params,
      });
      setCatalogData(Array.isArray(data.catalogData) ? data.catalogData : []);
      setPagination(data.pagination || { total: 0, page, limit, totalPages: 0 });
      if (page === 1 && data.filters) setFilterMeta(data.filters);
      if (data.sorting) {
        setSortBy(data.sorting.sortBy);
        setSortOrder(data.sorting.sortOrder);
      }
      setCurrentPage(page);
      setItemsPerPage(limit);
    } catch (e) {
      console.error('Error fetching catalog data:', e);
      setLoadError(e.message);
      setCatalogData([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep filters in sync and refetch when they change
  useEffect(() => {
    fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, styleFilter, id, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    if (id) {
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Persist items per page
  useEffect(() => {
    localStorage.setItem('catalogItemsPerPage', String(itemsPerPage));
  }, [itemsPerPage]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    style: '',
    type: '',
    code: '',
    description: '',
    price: ''
  });

  // Delete style modal states
  const [deleteStyleModalVisible, setDeleteStyleModalVisible] = useState(false);
  const [styleToDelete, setStyleToDelete] = useState('');
  const [mergeToStyle, setMergeToStyle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk delete states
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Individual delete states
  const [deleteItemModalVisible, setDeleteItemModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Cleanup duplicates states
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  // Rollback states
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Bulk edit states
  const [bulkEditModalVisible, setBulkEditModalVisible] = useState(false);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({
    style: '',
    type: '',
    description: '',
    price: ''
  });

  // Style name edit states
  const [editStyleNameModalVisible, setEditStyleNameModalVisible] = useState(false);
  const [isEditingStyleName, setIsEditingStyleName] = useState(false);
  const [styleNameEditForm, setStyleNameEditForm] = useState({
    oldStyleName: '',
    newStyleName: ''
  });

  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

  // Sort handler function
  const handleSort = (field) => {
    let newSortOrder = 'ASC';
    if (sortBy === field && sortOrder === 'ASC') {
      newSortOrder = 'DESC';
    }
    setSortBy(field);
    setSortOrder(newSortOrder);
    // Fetch data with new sorting
    fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, field, newSortOrder);
    setCurrentPage(1);
  };

  const [errors, setErrors] = useState({});
  const handleManualChange = (e) => {
    setManualForm({ ...manualForm, [e.target.name]: e.target.value });
  };

  const validateManualForm = () => {
    const newErrors = {};
    Object.entries(manualForm).forEach(([key, value]) => {
      if (!value || !value.toString().trim()) {
        newErrors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetManualForm = () => {
    setManualForm(initialManualForm);
    setErrors({});
  };

  const handleSaveManualItem = async () => {
    if (isSaving) return; // Prevent double submission
    if (!validateManualForm()) return;
    setIsSaving(true);

    try {
  await axiosInstance.post(`/api/manufacturers/catalog/${manufacturer.id}`, manualForm);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Catalog added successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '360px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
      // Reset and close modal
      setManualForm({ style: '', color: '', code: '', type: '', description: '', price: '' });
  // Refresh list (keep filters, reset to page 1 to show newest)
  fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

      setErrors({});
      resetManualForm();
      setManualModalVisible(false);


      // TODO: Trigger a reload of catalogData

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to save catalog",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsSaving(false);
    }
  };



  const handleEditClick = (item) => {
    setEditForm({
      id: item.id,
      style: item.style || '',
      type: item.type || '',
      code: item.code || '',
      description: item.description || '',
      price: item.price || ''
    });
    setEditModalVisible(true);
  };

  const handleUpdateItem = async () => {
    // if (!validateManualForm()) return;
    setIsUpdating(true); // Start loading
    try {
  await axiosInstance.put(`/api/manufacturers/catalog/edit/${editForm.id}`, editForm);

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Catalog updated successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '360px',
      });

      setEditModalVisible(false);
  fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to update catalog",
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setIsUpdating(false); // End loading
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked) => {
    setIsSelectAll(checked);
    if (checked) {
      setSelectedItems(currentItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId, checked) => {
    if (checked) {
      const newSelectedItems = [...selectedItems, itemId];
      setSelectedItems(newSelectedItems);

      // Check if all current page items are selected
      const currentPageIds = currentItems.map(item => item.id);
      const allCurrentPageSelected = currentPageIds.every(id => newSelectedItems.includes(id));
      setIsSelectAll(allCurrentPageSelected);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setIsSelectAll(false);
    }
  };

  // Update select all state when page changes
  React.useEffect(() => {
    const currentPageIds = currentItems.map(item => item.id);
    const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.includes(id));
    setIsSelectAll(allCurrentPageSelected);
  }, [currentItems, selectedItems]);

  // Individual delete handlers
  const handleDeleteItemClick = (item) => {
    setItemToDelete(item);
    setDeleteItemModalVisible(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete || isDeletingItem) return;

    setIsDeletingItem(true);

    try {
  await axiosInstance.delete(`/api/manufacturers/catalog/edit/${itemToDelete.id}`);

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Item deleted successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset modal state
      setDeleteItemModalVisible(false);
      setItemToDelete(null);

      // Refresh data
  fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to delete item",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Bulk delete handlers
  const handleBulkDeleteClick = () => {
    if (selectedItems.length === 0) return;
    setBulkDeleteModalVisible(true);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0 || isBulkDeleting) return;

    setIsBulkDeleting(true);

    try {
      // Delete items one by one (could be optimized with a bulk endpoint)
      const deletePromises = selectedItems.map(itemId =>
        axiosInstance.delete(`/api/manufacturers/catalog/edit/${itemId}`)
      );
      await Promise.all(deletePromises);

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: `Successfully deleted ${selectedItems.length} items`,
        showConfirmButton: false,
        timer: 2000,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset states
      setBulkDeleteModalVisible(false);
      setSelectedItems([]);
      setIsSelectAll(false);

      // Refresh data
  fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to delete some items",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Cleanup duplicates handler
  const handleCleanupDuplicates = async () => {
    if (isCleaningDuplicates) return;

    setIsCleaningDuplicates(true);

    try {
  const { data: result } = await axiosInstance.post(`/api/manufacturers/${id}/cleanup-duplicates`, null);

      Swal.fire({
        toast: true,
        position: "top",
        icon: result.duplicatesRemoved > 0 ? "success" : "info",
        title: result.message,
        showConfirmButton: false,
        timer: 3000,
        width: '450px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Refresh data if duplicates were removed
      if (result.duplicatesRemoved > 0) {
        fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);
        setCurrentPage(1);
      }

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to cleanup duplicates",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Rollback functions
  const handleRollbackClick = async () => {
    setIsLoadingBackups(true);
    setRollbackModalVisible(true);

    try {
  const { data: result } = await axiosInstance.get(`/api/manufacturers/${id}/catalog/backups`);
      setAvailableBackups(result.backups || []);

    } catch (err) {
      console.error('Error fetching backups:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to load backup history",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedBackup || isRollingBack) return;

    setIsRollingBack(true);

    try {
  const { data: result } = await axiosInstance.post(`/api/manufacturers/${id}/catalog/rollback`, { uploadSessionId: selectedBackup });

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: result.message || t('settings.manufacturers.catalogMapping.rollback.success'),
        showConfirmButton: false,
        timer: 2500,
        width: '450px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset modal state
      setRollbackModalVisible(false);
      setSelectedBackup('');
      setAvailableBackups([]);

      // Refresh data
  fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);
      setCurrentPage(1);

    } catch (err) {
      console.error('Error during rollback:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: t('settings.manufacturers.catalogMapping.rollback.failed'),
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleDeleteStyleClick = (styleName) => {
    setStyleToDelete(styleName);
    setMergeToStyle('');
    setDeleteStyleModalVisible(true);
  };

  const handleDeleteStyle = async () => {
    if (!styleToDelete || isDeleting) return;

    setIsDeleting(true);

    try {
      const requestBody = mergeToStyle ? { mergeToStyle } : {};

      const { data: result } = await axiosInstance.delete(`/api/manufacturers/${id}/style/${encodeURIComponent(styleToDelete)}`, {
        data: requestBody,
      });

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: result.message || "Style operation completed successfully",
        showConfirmButton: false,
        timer: 2500,
        width: '450px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset modal state
      setDeleteStyleModalVisible(false);
      setStyleToDelete('');
      setMergeToStyle('');

      // Refresh data
  fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

      // Reset current page if we're beyond the new total pages
      setCurrentPage(1);

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to delete/merge style",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk edit handlers
  const handleBulkEditClick = () => {
    if (selectedItems.length === 0) return;
    setBulkEditForm({
      style: '',
      type: '',
      description: '',
      price: ''
    });
    setBulkEditModalVisible(true);
  };

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0 || isBulkEditing) return;

    // Check if at least one field is filled
    const hasUpdates = Object.values(bulkEditForm).some(value => value && value.trim() !== '');
    if (!hasUpdates) {
      Swal.fire({
        toast: true,
        position: "top",
        icon: "warning",
        title: "Please fill at least one field to update",
        showConfirmButton: false,
        timer: 2000,
        width: '350px'
      });
      return;
    }

    setIsBulkEditing(true);

    try {
      // Prepare updates object (only include non-empty fields)
      const updates = {};
      Object.keys(bulkEditForm).forEach(key => {
        if (bulkEditForm[key] && bulkEditForm[key].trim() !== '') {
          updates[key] = bulkEditForm[key].trim();
        }
      });

  const { data: result } = await axiosInstance.put(`/api/manufacturers/catalog/bulk-edit`, {
        itemIds: selectedItems,
        updates
  });

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: result.message || `Successfully updated ${selectedItems.length} items`,
        showConfirmButton: false,
        timer: 2000,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset states
      setBulkEditModalVisible(false);
      setSelectedItems([]);
      setIsSelectAll(false);
      setBulkEditForm({
        style: '',
        type: '',
        description: '',
        price: ''
      });

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to bulk edit items",
        showConfirmButton: false,
        timer: 1500,
        width: '330px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsBulkEditing(false);
    }
  };

  // Style name edit handlers
  const handleEditStyleNameClick = (styleName) => {
    setStyleNameEditForm({
      oldStyleName: styleName,
      newStyleName: ''
    });
    setEditStyleNameModalVisible(true);
  };

  const handleEditStyleName = async () => {
    if (!styleNameEditForm.oldStyleName || !styleNameEditForm.newStyleName || isEditingStyleName) return;

    if (styleNameEditForm.oldStyleName.trim() === styleNameEditForm.newStyleName.trim()) {
      Swal.fire({
        toast: true,
        position: "top",
        icon: "warning",
        title: "New style name must be different from the old one",
        showConfirmButton: false,
        timer: 2000,
        width: '350px'
      });
      return;
    }

    setIsEditingStyleName(true);

    try {
  const { data: result } = await axiosInstance.put(`/api/manufacturers/${id}/style-name`, {
        oldStyleName: styleNameEditForm.oldStyleName.trim(),
        newStyleName: styleNameEditForm.newStyleName.trim()
  });

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: result.message || "Style name updated successfully",
        showConfirmButton: false,
        timer: 2500,
        width: '450px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });

      // Reset modal state
      setEditStyleNameModalVisible(false);
      setStyleNameEditForm({
        oldStyleName: '',
        newStyleName: ''
      });

      // Refresh data
      fetchCatalogData(currentPage, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder);

    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: err.message || "Failed to edit style name",
        showConfirmButton: false,
        timer: 2000,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } finally {
      setIsEditingStyleName(false);
    }
  };


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        Swal.fire("Unsupported file type", "Please upload a CSV or Excel file.", "error");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Check file size and show appropriate warning
    const fileSizeInMB = file.size / (1024 * 1024);
    const isLargeFile = fileSizeInMB > 10;

    if (fileSizeInMB > 50) {
      Swal.fire({
        title: t('common.error'),
        text: `File too large (${fileSizeInMB.toFixed(2)}MB). Maximum size is 50MB. Please split your file into smaller chunks.`,
        icon: "error"
      });
      return;
    }

    if (isLargeFile) {
      const result = await Swal.fire({
        title: 'Large File Detected',
        text: `This file is ${fileSizeInMB.toFixed(2)}MB. Large files may take several minutes to process. Continue?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, upload',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;
    }

    const formData = new FormData();
    formData.append('catalogFiles', file);

    // Show loading with progress for large files
    let progressSwal;
    if (isLargeFile) {
      progressSwal = Swal.fire({
        title: 'Processing Large File',
        html: `
          <div class="mb-3">
            <div class="progress">
              <div class="progress-bar progress-bar-striped progress-bar-animated"
                   role="progressbar" style="width: 0%" id="upload-progress"></div>
            </div>
          </div>
          <p class="text-muted">Processing ${fileSizeInMB.toFixed(2)}MB file in chunks...</p>
          <p class="text-sm">This may take a few minutes. Please don't close this window.</p>
        `,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });
    }

    try {
      const startTime = Date.now();

  const { data: result } = await axiosInstance.post(`/api/manufacturers/${id}/catalog/upload`, formData);
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Close progress modal if it was shown
      if (progressSwal) {
        Swal.close();
      }

      // Enhanced success message with detailed stats
      let successMessage = t('settings.manufacturers.catalogMapping.file.uploadSuccess');
      if (result.stats) {
        successMessage += `\n\nFile: ${fileSizeInMB.toFixed(2)}MB`;
        successMessage += `\nProcessing: ${result.stats.processingMethod || 'regular'}`;
        successMessage += `\nTime: ${processingTime}s`;
        successMessage += `\n\nItems processed: ${result.stats.totalProcessed}`;
        successMessage += `\nCreated: ${result.stats.created} | Updated: ${result.stats.updated}`;

        if (result.stats.backupCreated) {
          successMessage += `\n\n✅ Backup created - you can rollback this upload if needed.`;
        }
      }

      Swal.fire({
        title: t('common.success'),
        text: successMessage,
        icon: "success",
        confirmButtonText: "OK"
      });

      setFileModalVisible(false);
      setFile(null);
      fetchCatalogData(1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder); // Reload updated data

    } catch (err) {
      console.error('Upload error:', err);

      // Close progress modal if it was shown
      if (progressSwal) {
        Swal.close();
      }

      let errorMessage = err.message || t('settings.manufacturers.catalogMapping.file.uploadFailed');

      Swal.fire({
        title: t('common.error'),
        text: errorMessage,
        icon: "error",
        footer: isLargeFile ?
          'Tip: For very large files (>10,000 rows), consider splitting them into smaller files.' :
          undefined
      });
    }
  };

  const [showStyleModal, setShowStyleModal] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [styleForm, setStyleForm] = useState({
    name: '',
    shortName: '',
    description: '',
    image: '',
    catalogId: '',
    manufacturerId: '',
    code: ''
  });

  const handleManageStyleClick = async (item) => {
    const { id: catalogId, manufacturerId, style, code } = item;

    try {
  const response = await axiosInstance.get(`/api/manufacturers/style/${catalogId}`);
      const data = response.data;

      if (data) {
        // Prefill the form with existing DB data
        setSelectedStyle(data.name || style || '');
        setStyleForm({
          name: data.name || '',
          shortName: data.shortName || '',
          description: data.description || '',
          image: data.image || '',
          catalogId,
          manufacturerId,
          code
        });
        setStyleImage(null); // Clear any previously selected image
      } else {
        // No existing data
        setSelectedStyle(style || '');
        setStyleForm({
          name: style || '',
          shortName: '',
          description: '',
          image: '',
          catalogId,
          manufacturerId,
          code
        });
        setStyleImage(null);
      }

      setShowStyleModal(true);
    } catch (error) {
      console.error('Error fetching style data:', error);

      // Fallback to minimal data
      setSelectedStyle(style || '');
      setStyleForm({
        name: style || '',
        shortName: '',
        description: '',
        image: '',
        catalogId,
        manufacturerId,
        code
      });
      setStyleImage(null);
      setShowStyleModal(true);
    }
  };




  const handleStyleFormChange = (e) => {
    const { name, value } = e.target;
    setStyleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSaveStyle = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(styleForm).forEach((key) => {
        formDataToSend.append(key, styleForm[key]);
      });
      if (styleImage) {
        formDataToSend.append('styleImage', styleImage);
      }
      const response = await axiosInstance.post('/api/manufacturers/style/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.status == 200) {
        setStyleForm({
          name: '',
          shortName: '',
          description: '',
          image: '',

        });

        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Catalog Style Updated successfully",
          showConfirmButton: false,
          timer: 1500,
          width: '360px',
          didOpen: (toast) => {
            toast.style.padding = '8px 12px';
            toast.style.fontSize = '14px';
            toast.style.minHeight = 'auto';
          }
        });
      }


    } catch (error) {
      // Error handling for style save
    } finally {
      // setLoading(false);
      setStyleImage('');
      setShowStyleModal(false);
    }

  };

  const [showStyleViewModal, setShowStyleViewModal] = useState(false);
  const [styleDetails, setStyleDetails] = useState(null);

  const handleShowStyleOnClick = async (item) => {
    try {
      const { id } = item
  const res = await axiosInstance.get(`/api/manufacturers/style/${id}`);

      if (res.data) {
        setStyleDetails(res.data);
        setShowStyleViewModal(true);
      }

    } catch (error) {
      console.error('Error fetching style:', error);
      setStyleDetails(null);
    } finally {
      setShowStyleViewModal(true);

    }
  }

  // Fetch available types for the manufacturer
  const fetchAvailableTypes = async () => {
    if (!id) return;
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${id}/types`);
      if (response.data.success) {
        setAvailableTypes(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch types:', error);
      setAvailableTypes([]);
    }
  };

  // Fetch assembly costs by types
  const fetchAssemblyCostsByTypes = async () => {
    if (!id) return;
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${id}/assembly-costs-by-types`);
      if (response.data.success) {
        setAssemblyCostsByType(response.data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch assembly costs by types:', error);
      setAssemblyCostsByType({});
    }
  };

  const handleAssemblyCostClick = async (item) => {
    try {
      const { id } = item;

      const res = await axiosInstance.get(`/api/manufacturers/assemblycost/${id}`);

      const { type, price } = res.data || {};
      setSelectedCatalogItem(item);

      // Fetch available types and assembly costs for the dropdown
      await fetchAvailableTypes();
      await fetchAssemblyCostsByTypes();

      setAssemblyData({
        type: type || '',
        price: price || '',
        applyTo: 'one',
        selectedItemType: item.type || '',
        selectedTypes: []
      });
    } catch (error) {
      console.error('Error fetching assembly cost:', error);
      // Fetch available types even if assembly cost fetch fails
      await fetchAvailableTypes();
      await fetchAssemblyCostsByTypes();
      setSelectedCatalogItem(item);
      setAssemblyData({
        type: '',
        price: '',
        applyTo: 'one',
        selectedItemType: item.type || '',
        selectedTypes: []
      });
    } finally {
      setShowAssemblyModal(true);
    }
  };

  // const handleHingesDetailsClick = async (item) => {
  //   try {
  //     setSelectedCatalogItem(item);

  //     const res = await axiosInstance.get(`/api/manufacturers/items/hinges/${item.id}`);
  //     const { leftHingePrice, rightHingePrice, bothHingesPrice, exposedSidePrice } = res.data.data || {};

  //     setHingesData({
  //       leftHingePrice: leftHingePrice || '',
  //       rightHingePrice: rightHingePrice || '',
  //       bothHingePrice: bothHingesPrice || '',
  //       exposedSidePrice: exposedSidePrice || '',
  //     });
  //   } catch (error) {
  //     console.error('Error fetching hinges details:', error);
  //     setHingesData({
  //       leftHingePrice: '',
  //       rightHingePrice: '',
  //       bothHingePrice: '',
  //       exposedSidePrice: '',
  //     }); // fallback to blank if error
  //   } finally {
  //     setShowHingesModal(true);
  //   }
  // };

  const saveAssemblyCost = async () => {
    try {
      // Validation
      if (assemblyData.applyTo === 'type' && !assemblyData.selectedItemType) {
        alert('Please select an item type when applying by type.');
        return;
      }

      if (assemblyData.applyTo === 'types' && assemblyData.selectedTypes.length === 0) {
        alert('Please select at least one item type when applying by types.');
        return;
      }

      const payload = {
        catalogDataId: selectedCatalogItem.id,
        type: assemblyData.type,
        price: parseFloat(assemblyData.price) || 0,
        applyTo: assemblyData.applyTo || 'one',
        manufacturerId: selectedCatalogItem.manufacturerId,
      };

      // Add itemType if applying by single type
      if (assemblyData.applyTo === 'type') {
        payload.itemType = assemblyData.selectedItemType;
      }

      // Add selectedTypes if applying by multiple types
      if (assemblyData.applyTo === 'types') {
        payload.selectedTypes = assemblyData.selectedTypes;
      }

      await axiosInstance.post('/api/manufacturers/items/assembly-cost', payload);
      setShowAssemblyModal(false);

      // Refresh the catalog data to show updated assembly costs
      fetchCatalogData();
    } catch (error) {
      console.error('Failed to save assembly cost:', error);
    }
  };

  const handleModificationDetailsClick = async (item) => {
    setSelectedCatalogItem(item);
    setModificationData({
      modificationName: '',
      description: '',
      notes: '',
      price: ''
    });
    setShowModificationModal(true);
  };
  const saveHingesDetails = async () => {
    try {
      const payload = {
        catalogDataId: selectedCatalogItem.id,
        leftHingePrice: parseFloat(hingesData.leftHingePrice) || 0,
        rightHingePrice: parseFloat(hingesData.rightHingePrice) || 0,
        bothHingesPrice: parseFloat(hingesData.bothHingePrice) || 0,
        exposedSidePrice: parseFloat(hingesData.exposedSidePrice) || 0,
      };
  await axiosInstance.post('/api/manufacturers/items/hinges', payload);
      setShowHingesModal(false);
    } catch (error) {
      console.error('Failed to save hinges details:', error);
    }
  };

  const saveModificationDetails = async () => {
    try {
      const payload = {
        catalogDataId: selectedCatalogItem.id,
        modificationName: modificationData.modificationName,
        description: modificationData.description,
        notes: modificationData.notes,
        price: parseFloat(modificationData.price) || 0,
      };

  await axiosInstance.post('/api/manufacturers/items/modifications', payload);
      setShowModificationModal(false);
    } catch (error) {
      console.error('Failed to save modification details:', error);
    }
  };







  return (
    <div>
      <style>
        {`
          .form-check-input:not(:checked) {
            background-color: white !important;
            border-color: #6c757d !important;
            border-width: 2px !important;
            opacity: 1 !important;
          }
          .form-check-input:checked {
            background-color: #198754 !important;
            border-color: #198754 !important;
          }
          .form-check-input:focus {
            border-color: #198754 !important;
            box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25) !important;
          }

          /* Mobile responsive styles */
          @media (max-width: 768px) {
            .table-responsive {
              border: none;
            }
            .table td {
              padding: 8px 4px !important;
              font-size: 12px;
            }
            .table th {
              padding: 8px 4px !important;
              font-size: 11px;
              font-weight: 600;
            }
            .btn-sm {
              padding: 1px 4px !important;
              font-size: 10px !important;
            }
            .mobile-stack {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
          }

          @media (max-width: 576px) {
            .table td, .table th {
              padding: 6px 2px !important;
            }
            .actions-column {
              min-width: 120px;
            }
          }
        `}
      </style>

      {/* Page Header with Mobile-Optimized Layout */}
      <PageHeader
        title={t('settings.manufacturers.catalogMapping.title')}
        mobileLayout="compact"
        rightContent={
          <div className="d-flex flex-wrap gap-2 catalog-actions">
            <CButton
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setFileModalVisible(true)}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}</span>
              <span className="d-sm-none">📁 CSV</span>
            </CButton>
            <CButton
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setManualModalVisible(true)}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.buttons.addItem')}</span>
              <span className="d-sm-none">➕ Add</span>
            </CButton>
            <CButton
              color="warning"
              size="sm"
              className="flex-shrink-0"
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
              title={t('settings.manufacturers.catalogMapping.cleanupDuplicates.tooltip')}
            >
              {isCleaningDuplicates ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.cleanupDuplicates.cleaning')}</span>
                  <span className="d-sm-none">...</span>
                </>
              ) : (
                <>
                  <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.cleanupDuplicates.buttonText')}</span>
                  <span className="d-sm-none">🧹</span>
                </>
              )}
            </CButton>
            <CButton
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              size="sm"
              className="flex-shrink-0"
              onClick={handleRollbackClick}
              disabled={(pagination.total || 0) === 0}
              title="Rollback recent catalog upload"
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.rollback.buttonText')}</span>
              <span className="d-sm-none">↶</span>
            </CButton>
          </div>
        }
      />

  <style>{`
        .catalog-actions {
          width: 100%;
        }

        /* Mobile card styles */
        .mobile-catalog-card {
          border: 1px solid #dee2e6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s ease;
        }

        .mobile-catalog-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .mobile-cards-container {
          max-height: 70vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Improved touch targets for mobile */
        .mobile-catalog-card .btn {
          min-height: 36px;
          font-size: 12px;
          white-space: nowrap;
        }

        .mobile-catalog-card .form-check-input {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 767px) {
          .catalog-actions {
            justify-content: stretch;
          }

          .catalog-actions .btn {
            flex: 1;
            min-width: 0;
            min-height: 32px; /* Reduced from 44px */
            font-size: 0.75rem !important;
            padding: 0.25rem 0.5rem !important;
          }

          /* Better mobile table */
          .table-responsive {
            -webkit-overflow-scrolling: touch;
          }

          .table td, .table th {
            min-width: 100px;
            white-space: nowrap;
          }

          /* Mobile-optimized filters */
          .form-select, .form-control {
            min-height: 36px; /* Reduced from 44px */
            font-size: 0.875rem;
          }

          /* Mobile card specific improvements */
          .mobile-catalog-card .card-body {
            padding: 0.75rem !important; /* Reduced padding */
          }

          .mobile-catalog-card .btn {
            padding: 6px 10px;
            font-size: 11px;
          }

          .mobile-catalog-card .row.g-2 > .col-6 {
            margin-bottom: 0.5rem;
          }

          /* Compact header for mobile */
          .page-header-dynamic {
            margin-bottom: 0.75rem !important;
          }
        }

        @media (max-width: 575px) {
          .catalog-actions {
            flex-direction: row; /* Keep inline on small screens */
            gap: 0.25rem;
          }

          .catalog-actions .btn {
            flex: 1;
            min-width: 0;
            font-size: 0.7rem !important;
            padding: 0.2rem 0.3rem !important;
            min-height: 28px;
          }

          /* Stack filters vertically on very small screens */
          .row.g-2 > .col-12 {
            margin-bottom: 0.5rem; /* Reduced spacing */
          }

          .row.g-2 > .col-12:last-child {
            margin-bottom: 0;
          }

          /* Mobile card actions more compact */
          .mobile-catalog-card .d-flex.flex-wrap .btn {
            padding: 4px 8px;
            font-size: 10px;
            margin-bottom: 0.15rem;
          }

          .mobile-catalog-card .card-body {
            padding: 0.5rem !important;
          }

          .mobile-catalog-card .card-title {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .mobile-catalog-card small {
            font-size: 0.75rem;
          }
        }

        /* Better touch scrolling for table */
        .table-container {
          -webkit-overflow-scrolling: touch;
          overflow-x: auto;
        }

        /* Better mobile pagination */
        @media (max-width: 767px) {
          .pagination {
            flex-wrap: wrap;
            justify-content: center;
          }

          .page-item .page-link {
            min-width: 36px; /* Reduced from 44px */
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
          }
        }

        /* Hide unnecessary elements on mobile */
        @media (max-width: 576px) {
          .mobile-catalog-card .card-title {
            font-size: 14px;
          }

          .mobile-catalog-card small {
            font-size: 11px;
          }
        }
  `}</style>

      {/* Mobile-Optimized Filters and Pagination */}
      <div className="row g-2 mb-3">
        {/* Items per page - Full width on mobile */}
        <div className="col-12 col-sm-6 col-lg-auto">
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '60px' }}
              value={itemsPerPage}
              onChange={(e) => {
                const value = Number(e.target.value);
                setItemsPerPage(value);
                localStorage.setItem('catalogItemsPerPage', value);
                setCurrentPage(1);
                fetchCatalogData(1, value, typeFilter, styleFilter, sortBy, sortOrder);
              }}
            >
              {[10, 25, 50, 100, 200].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            <span className="text-muted small d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.pagination.perPage')}</span>
            <span className="text-muted small d-sm-none">per page</span>
          </div>
        </div>

        {/* Search Filter - Prominent on mobile */}
        <div className="col-12 col-sm-12 col-lg-4 order-first order-lg-3">
          <div className="position-relative">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="🔍 Search styles..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ paddingRight: searchFilter ? '35px' : '12px' }}
            />
            {searchFilter && (
              <button
                type="button"
                className="btn btn-sm btn-link position-absolute top-0 end-0 p-1"
                onClick={() => setSearchFilter('')}
                style={{ color: '#6c757d', textDecoration: 'none', zIndex: 5 }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="col-6 col-sm-6 col-lg-auto">
          <select
            className="form-select form-select-sm"
            value={typeFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setTypeFilter(e.target.value);
            }}
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Style Filter */}
        <div className="col-6 col-sm-6 col-lg-auto">
          <select
            className="form-select form-select-sm"
            value={styleFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setStyleFilter(e.target.value);
            }}
          >
            <option value="">All Styles</option>
            {sortedUniqueStyles.map((style, idx) => (
              <option key={idx} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      <>
        {/* Debug info - remove this later */}
        {process.env.NODE_ENV === 'development' && (
          <small className="text-muted">
            Style Filter: "{styleFilter}" | Styles Count: {sortedUniqueStyles.length}
          </small>
        )}

        {/* Style Management Section */}
        {styleFilter && (
          <div className="mb-3 p-3 border rounded bg-light">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              <div>
                <strong>Managing Style: "{styleFilter}"</strong>
                <br />
                <small className="text-muted">
                  {catalogData.filter(item => item.style === styleFilter).length} items with this style
                </small>
              </div>
              <div className="d-flex gap-2 flex-shrink-0">
                <CButton
                  color="info"
                  size="sm"
                  onClick={() => handleEditStyleNameClick(styleFilter)}
                  disabled={isEditingStyleName}
                >
                  {isEditingStyleName ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>✏️ Rename Style</>
                  )}
                </CButton>
                <CButton
                  color="warning"
                  size="sm"
                  onClick={() => handleDeleteStyleClick(styleFilter)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Processing...
                    </>
                  ) : (
                    <>🗑️ Delete/Merge Style</>
                  )}
                </CButton>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2">
          <span className="fw-bold">
            {t('settings.manufacturers.catalogMapping.pagination.itemsSelected', { count: selectedItems.length })}
          </span>
          <div className="d-flex gap-2 flex-shrink-0">
            <CButton
              color="primary"
              size="sm"
              onClick={handleBulkEditClick}
              disabled={isBulkEditing}
            >
              {isBulkEditing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Editing...
                </>
              ) : (
                <>✏️ Edit Selected</>
              )}
            </CButton>
            <CButton
              color="danger"
              size="sm"
              onClick={handleBulkDeleteClick}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('settings.manufacturers.catalogMapping.bulk.deleting')}
                </>
              ) : (
                <>{t('settings.manufacturers.catalogMapping.buttons.deleteSelected')}</>
              )}
            </CButton>
          </div>
        </div>
      )}
      </>

      {/* Table - Desktop and Mobile Views */}
      {catalogData.length === 0 ? (
        <p>{t('settings.manufacturers.catalogMapping.empty')}</p>
      ) : (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="table-responsive table-container d-none d-md-block">
            <CTable hover responsive className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '35px', minWidth: '35px' }}>
                    <input
                      type="checkbox"
                      checked={isSelectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="form-check-input"
                      style={{
                        borderColor: '#6c757d',
                        borderWidth: '2px',
                        transform: 'scale(1.1)'
                      }}
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell
                    style={{ minWidth: '80px', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('code')}
                    className="d-flex align-items-center"
                  >
                    {t('settings.manufacturers.catalogMapping.table.code')}
                    {sortBy === 'code' && (
                      <CIcon
                        icon={sortOrder === 'ASC' ? cilSortAscending : cilSortDescending}
                        size="sm"
                        className="ms-1"
                      />
                    )}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ minWidth: '120px', maxWidth: '180px' }}>
                    {t('settings.manufacturers.catalogMapping.table.description')}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ minWidth: '80px' }}>{t('settings.manufacturers.catalogMapping.table.style')}</CTableHeaderCell>
                  <CTableHeaderCell style={{ minWidth: '70px' }}>{t('settings.manufacturers.catalogMapping.table.price')}</CTableHeaderCell>
                  <CTableHeaderCell style={{ minWidth: '70px' }}>{t('settings.manufacturers.catalogMapping.table.type')}</CTableHeaderCell>
                  <CTableHeaderCell style={{ minWidth: '120px' }} className="actions-column">{t('settings.manufacturers.catalogMapping.table.actions')}</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
            {currentItems.map((item, index) => (
              <CTableRow key={index}>
                <CTableDataCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="form-check-input"
                    style={{
                      borderColor: '#6c757d',
                      borderWidth: '2px',
                      transform: 'scale(1.1)'
                    }}
                  />
                </CTableDataCell>
                <CTableDataCell>{item.code}</CTableDataCell>
                <CTableDataCell style={{
                  maxWidth: '200px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}>
                  {item.description ? item.description : t('common.na')}
                </CTableDataCell>
                <CTableDataCell style={{ cursor: 'pointer' }} >
                  <CButton
                    size="sm"
                    color="dark"
                    onClick={() => handleShowStyleOnClick(item)}
                    className="me-2"
                    style={{
                      backgroundColor: '#6c757d',
                      borderColor: '#6c757d',
                      color: 'white',
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    {item.style}

                  </CButton>
                </CTableDataCell>
                <CTableDataCell>{item.price}</CTableDataCell>
                <CTableDataCell>{item.type ? item.type : 'N/A'}</CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex flex-wrap gap-1">
                    <CButton
                      size="sm"
                      color="secondary"
                      onClick={() => handleEditClick(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        minWidth: 'auto'
                      }}
                    >
                      ✏️
                    </CButton>

                    <CButton
                      size="sm"
                      onClick={() => handleManageStyleClick(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: headerBg,
                        borderColor: headerBg,
                        color: textColor,
                        minWidth: 'auto'
                      }}
                      title={t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                    >
                      🎨
                    </CButton>

                    <CButton
                      size="sm"
                      onClick={() => handleAssemblyCostClick(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: headerBg,
                        borderColor: headerBg,
                        color: textColor,
                        minWidth: 'auto'
                      }}
                      title={t('settings.manufacturers.catalogMapping.actions.assemblyCost')}
                    >
                      🔧
                    </CButton>

                    <CButton
                      size="sm"
                      onClick={() => handleModificationDetailsClick(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: headerBg,
                        borderColor: headerBg,
                        color: textColor,
                        minWidth: 'auto'
                      }}
                      title={t('settings.manufacturers.catalogMapping.actions.modification')}
                    >
                      ⚙️
                    </CButton>

                    <CButton
                      size="sm"
                      color="danger"
                      onClick={() => handleDeleteItemClick(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        minWidth: 'auto'
                      }}
                      title={`Delete item: ${item.code}`}
                    >
                      🗑️
                    </CButton>
                  </div>
                </CTableDataCell>

              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="d-block d-md-none">
        {/* Mobile Select All */}
        <div className="d-flex align-items-center mb-3 p-3 bg-light rounded">
          <input
            type="checkbox"
            checked={isSelectAll}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="form-check-input me-2"
            id="mobile-select-all"
          />
          <label htmlFor="mobile-select-all" className="form-check-label mb-0">
            Select All ({currentItems.length} items)
          </label>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-cards-container">
          {currentItems.map((item, index) => (
            <div key={index} className="card mb-3 mobile-catalog-card">
              <div className="card-body p-3">
                {/* Card Header with checkbox and style */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                      className="form-check-input me-2"
                    />
                    <div>
                      <h6 className="card-title mb-1 fw-bold">{item.code}</h6>
                      <small className="text-muted">{item.description}</small>
                    </div>
                  </div>
                  <CButton
                    size="sm"
                    style={{
                      backgroundColor: '#6c757d',
                      borderColor: '#6c757d',
                      color: 'white',
                      fontSize: '11px',
                      padding: '2px 8px'
                    }}
                  >
                    {item.style}
                  </CButton>
                </div>

                {/* Card Content */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Price</small>
                    <span className="fw-bold">${item.price}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Type</small>
                    <span>{item.type || 'N/A'}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="d-flex flex-wrap gap-2">
                  <CButton
                    size="sm"
                    color="secondary"
                    onClick={() => handleEditClick(item)}
                    className="flex-fill"
                  >
                    ✏️ Edit
                  </CButton>

                  <CButton
                    size="sm"
                    onClick={() => handleManageStyleClick(item)}
                    style={{
                      backgroundColor: headerBg,
                      borderColor: headerBg,
                      color: textColor
                    }}
                    className="flex-fill"
                    title={t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                  >
                    🎨 Style
                  </CButton>

                  <CButton
                    size="sm"
                    onClick={() => handleModificationDetailsClick(item)}
                    style={{
                      backgroundColor: headerBg,
                      borderColor: headerBg,
                      color: textColor
                    }}
                    className="flex-fill"
                    title={t('settings.manufacturers.catalogMapping.actions.modificationDetails')}
                  >
                    🔧 Modify
                  </CButton>

                  <CButton
                    size="sm"
                    color="danger"
                    onClick={() => handleDeleteClick(item.id)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px'
                    }}
                  >
                    🗑️
                  </CButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}
      {catalogData.length > 0 ? (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            {loading
              ? 'Loading…'
              : t('pagination.pageInfo', { current: pagination.page || 1, total: pagination.totalPages || 1 })}
          </div>
          <div>
            <CButton
              size="sm"
              color="secondary"
              disabled={loading || (pagination.page || 1) === 1}
              onClick={() => fetchCatalogData((pagination.page || 1) - 1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)}
              className="me-2"
            >
              {t('pagination.prevPageTitle')}
            </CButton>
            <CButton
              size="sm"
              color="secondary"
              disabled={loading || (pagination.page || 1) >= (pagination.totalPages || 1)}
              onClick={() => fetchCatalogData((pagination.page || 1) + 1, itemsPerPage, typeFilter, styleFilter, sortBy, sortOrder)}
            >
              {t('pagination.nextPageTitle')}
            </CButton>
          </div>
        </div>
      ) : ""}

      {/* File Upload Modal */}
      <CModal
        visible={fileModalVisible}
        onClose={() => setFileModalVisible(false)}
      >
        <PageHeader title={t('settings.manufacturers.catalogMapping.file.modalTitle')} />
        <CModalBody>
          <CForm>
            <CFormInput type="file" name="catalogFiles" label={t('settings.manufacturers.catalogMapping.file.selectLabel')} onChange={handleFileChange} />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setFileModalVisible(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={handleUpload}>{t('settings.manufacturers.catalogMapping.file.uploadBtn')}</CButton>

        </CModalFooter>
      </CModal>

      {/* Manual Upload Modal */}
      <CModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
      >
        <PageHeader title={t('settings.manufacturers.catalogMapping.manual.modalTitle')} />
        <CModalBody>
          <CForm>

            <CreatableSelect
              isClearable
              className="mb-2"
        placeholder={t('settings.manufacturers.catalogMapping.stylePlaceholder')}
              options={styleOptions}
              value={manualForm.style ? { label: manualForm.style, value: manualForm.style } : null}
              onChange={(selectedOption) =>
                setManualForm({
                  ...manualForm,
                  style: selectedOption ? selectedOption.value : '',
                })
              }
            />
            <CFormInput
              className="mb-2"
        label={t('settings.manufacturers.catalogMapping.fields.code')}
              name="code"
              value={manualForm.code}
              onChange={handleManualChange}
              invalid={!!errors.code}
              feedback={errors.code}
            />
            <CFormInput
              className="mb-2"
        label={t('settings.manufacturers.catalogMapping.fields.description')}
              name="description"
              value={manualForm.description}
              onChange={handleManualChange}
              invalid={!!errors.description}
              feedback={errors.description}
            />
            <CFormInput
              className="mb-2"
              type="number"
        label={t('settings.manufacturers.catalogMapping.fields.price')}
              name="price"
              value={manualForm.price}
              onChange={handleManualChange}
              invalid={!!errors.price}
              feedback={errors.price}
            />

            <CFormInput
              className="mb-2"
        label={t('settings.manufacturers.catalogMapping.fields.type')}
              name="type"
              value={manualForm.type}
              onChange={handleManualChange}
              invalid={!!errors.type}
              feedback={errors.type}
            />


          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setManualModalVisible(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={handleSaveManualItem}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.edit.modalTitle')} />
        <CModalBody>
          <CForm>
            <CreatableSelect
              isClearable
        placeholder={t('settings.manufacturers.catalogMapping.stylePlaceholder')}
              options={styleOptions}
              value={editForm.style ? { label: editForm.style, value: editForm.style } : null}
              onChange={(selectedOption) =>
                setEditForm({
                  ...editForm,
                  style: selectedOption ? selectedOption.value : '',
                })
              }
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: '#d8dbe0',
                  minHeight: '38px',
                  boxShadow: 'none',
                  '&:hover': {
                    borderColor: '#a6a9b0',
                  },
                }),
              }}
            />

            {['code', 'description', 'type'].map((field) => (
              <CFormInput
                key={field}
                className="mb-2"
                label={
                  field === 'code'
                    ? t('settings.manufacturers.catalogMapping.fields.code')
                    : field === 'description'
                    ? t('settings.manufacturers.catalogMapping.fields.description')
                    : t('settings.manufacturers.catalogMapping.fields.type')
                }
                name={field}
                value={editForm[field]}
                onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
              />
            ))}

            <CFormInput
              className="mb-2"
              type="number"
              step="0.01"
              min="0"
              label={t('settings.manufacturers.catalogMapping.fields.price')}
              name="price"
              value={editForm.price}
              onChange={(e) => {
                const val = e.target.value;
                setEditForm({ ...editForm, price: val });
              }}
            />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModalVisible(false)}>{t('common.cancel')}</CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={handleUpdateItem} disabled={isUpdating}>
            {isUpdating ? t('settings.manufacturers.catalogMapping.edit.updating') : t('settings.manufacturers.catalogMapping.edit.update')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Style Modal */}
      <CModal visible={showStyleModal} onClose={() => setShowStyleModal(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.style.manageTitle', { style: selectedStyle })} />

        <CModalBody>
          <CForm>
            {/* Short Name */}
            <CFormInput
              label={t('settings.manufacturers.catalogMapping.style.shortName')}
              name="shortName"
              value={styleForm.shortName}
              onChange={handleStyleFormChange}
              className="mb-3"
            />

            {/* Description */}
            <CFormTextarea
              label={t('settings.manufacturers.catalogMapping.fields.description')}
              name="description"
              value={styleForm.description}
              onChange={handleStyleFormChange}
              className="mb-3"
              rows={4}
            />

            {/* Image Upload */}
            <CFormInput
              type="file"
              label={t('settings.manufacturers.catalogMapping.style.uploadImage')}
              accept="image/*"
              id="styleImage"
              onChange={(e) => setStyleImage(e.target.files[0])}
            />

            {/* Show selected image name or current image */}
            {styleImage ? (
              <div className="mt-2 text-success">{t('settings.manufacturers.catalogMapping.style.imageSelected', { name: styleImage.name })}</div>
            ) : styleForm.image ? (
              <div className="mt-3">
                <p className="mb-1"><strong>{t('settings.manufacturers.catalogMapping.style.currentImage')}</strong></p>
                <img
                  src={
                    styleForm.image
                      ? `${api_url}/uploads/images/${styleForm.image}`
                      : "/images/nologo.png"
                  }
                  alt="Style Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    if (styleForm.image && !e.target.dataset.fallbackTried) {
                      e.target.dataset.fallbackTried = '1';
                      e.target.src = `${api_url}/uploads/manufacturer_catalogs/${styleForm.image}`;
                    } else {
                      e.target.src = '/images/nologo.png';
                    }
                  }}
                />
              </div>
            ) : null}
          </CForm>
        </CModalBody>

        <CModalFooter>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={handleSaveStyle}>{t('common.save')}</CButton>
          <CButton color="secondary" onClick={() => setShowStyleModal(false)}>{t('common.cancel')}</CButton>
        </CModalFooter>
      </CModal>


      {/* Style View Modal */}
      <CModal visible={showStyleViewModal} onClose={() => setShowStyleViewModal(false)} size="lg">
        <PageHeader title={`📝 ${t('settings.manufacturers.catalogMapping.style.detailsTitle')}`} />
        <CModalBody>
          {styleDetails ? (
            <div style={{ padding: '10px 5px' }}>
              <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 100%', paddingRight: '10px' }}>
                  <p><strong>🏷️ {t('settings.manufacturers.catalogMapping.style.shortName')}:</strong> {styleDetails.shortName ? styleDetails.shortName : t('common.na')}</p>
                  <p><strong>📝 {t('settings.manufacturers.catalogMapping.fields.description')}:</strong> {styleDetails.description ? styleDetails.description : t('common.na')}</p>
                </div>
              </div>
              {styleDetails.image ? (
                <div style={{ marginTop: '20px' }}>
                  <img
                    src={
                      styleDetails.image
                        ? `${api_url}/uploads/images/${styleDetails.image}`
                        : "/images/nologo.png"
                    }
                    alt="Style"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                    onError={(e) => {
                      if (styleDetails.image && !e.target.dataset.fallbackTried) {
                        e.target.dataset.fallbackTried = '1';
                        e.target.src = `${api_url}/uploads/manufacturer_catalogs/${styleDetails.image}`;
                      } else {
                        e.target.src = '/images/nologo.png';
                      }
                    }}
                  />
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#888' }}>{t('settings.manufacturers.catalogMapping.style.noImage')}</p>
              )}
            </div>
          ) : (
            <p>{t('settings.manufacturers.catalogMapping.style.noData')}</p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowStyleViewModal(false)}>
            {t('common.cancel')}
          </CButton>
        </CModalFooter>
      </CModal>




      <CModal visible={showAssemblyModal} onClose={() => setShowAssemblyModal(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.assembly.modalTitle')} />
        <CModalBody>
          <CFormLabel>{t('settings.manufacturers.catalogMapping.assembly.type')}</CFormLabel>
          <CFormSelect
            value={assemblyData.type}
            onChange={(e) => setAssemblyData({ ...assemblyData, type: e.target.value })}
          >
            <option value="">{t('settings.manufacturers.catalogMapping.assembly.selectType')}</option>
            <option value="percentage">{t('settings.manufacturers.catalogMapping.assembly.percentage')}</option>
            <option value="fixed">{t('settings.manufacturers.catalogMapping.assembly.fixed')}</option>
          </CFormSelect>

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.fields.price')}</CFormLabel>
          <CFormInput
            type="number"
            value={assemblyData.price}
            onChange={(e) => setAssemblyData({ ...assemblyData, price: e.target.value })}
            placeholder={t('settings.manufacturers.catalogMapping.placeholders.price')}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.assembly.applyTo')}</CFormLabel>
          <CFormSelect
            value={assemblyData.applyTo}
            onChange={(e) => setAssemblyData({ ...assemblyData, applyTo: e.target.value })}
          >
            <option value="one">{t('settings.manufacturers.catalogMapping.assembly.applyOne')}</option>
            <option value="type">{t('settings.manufacturers.catalogMapping.assembly.applyType')}</option>
            <option value="types">{t('settings.manufacturers.catalogMapping.assembly.applyTypes', 'Apply by Multiple Types')}</option>
            <option value="all">{t('settings.manufacturers.catalogMapping.assembly.applyAll')}</option>
          </CFormSelect>

          {assemblyData.applyTo === 'type' && (
            <>
              <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.assembly.selectItemType')}</CFormLabel>
              <CFormSelect
                value={assemblyData.selectedItemType}
                onChange={(e) => setAssemblyData({ ...assemblyData, selectedItemType: e.target.value })}
              >
                <option value="">{t('settings.manufacturers.catalogMapping.assembly.chooseType')}</option>
                {availableTypes.map((typeItem) => (
                  <option key={typeItem.type} value={typeItem.type}>
                    {typeItem.type} ({typeItem.count} items)
                  </option>
                ))}
              </CFormSelect>
            </>
          )}

          {assemblyData.applyTo === 'types' && (
            <>
              <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.assembly.selectMultipleTypes', 'Select Item Types')}</CFormLabel>
              <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {availableTypes.map((typeItem) => {
                  const isSelected = assemblyData.selectedTypes.includes(typeItem.type);
                  const typeAssemblyCosts = assemblyCostsByType[typeItem.type]?.assemblyCosts || [];
                  
                  return (
                    <div key={typeItem.type} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`type-${typeItem.type}`}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssemblyData(prev => ({
                              ...prev,
                              selectedTypes: [...prev.selectedTypes, typeItem.type]
                            }));
                          } else {
                            setAssemblyData(prev => ({
                              ...prev,
                              selectedTypes: prev.selectedTypes.filter(t => t !== typeItem.type)
                            }));
                          }
                        }}
                      />
                      <label className="form-check-label d-flex justify-content-between align-items-center w-100" htmlFor={`type-${typeItem.type}`}>
                        <div>
                          <div className="fw-bold">{typeItem.type}</div>
                          <small className="text-muted">{typeItem.count} items</small>
                        </div>
                        <div>
                          {typeAssemblyCosts.map((cost, idx) => (
                            <span key={idx} className="badge bg-info ms-1" title={`${cost.assemblyType}: $${cost.price.toFixed(2)} (${cost.itemsWithCost} items)`}>
                              ${cost.price.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => {
                    const allTypes = availableTypes.map(t => t.type);
                    setAssemblyData(prev => ({ ...prev, selectedTypes: allTypes }));
                  }}
                >
                  {t('common.selectAll', 'Select All')}
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => setAssemblyData(prev => ({ ...prev, selectedTypes: [] }))}
                >
                  {t('common.selectNone', 'Select None')}
                </button>
              </div>
              
              {assemblyData.selectedTypes.length > 0 && (
                <div className="alert alert-info mt-3">
                  <small>
                    {t('settings.manufacturers.catalogMapping.assembly.multipleTypesWarning', 
                    'This will apply the assembly cost to all items in {{count}} selected types.', 
                    { count: assemblyData.selectedTypes.length })}
                  </small>
                </div>
              )}
            </>
          )}


        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowAssemblyModal(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={saveAssemblyCost}>
            {t('common.save')}
          </CButton>
        </CModalFooter>
      </CModal>


      <CModal visible={showHingesModal} onClose={() => setShowHingesModal(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.hinges.modalTitle')} />
        <CModalBody>
          <CFormLabel>{t('settings.manufacturers.catalogMapping.hinges.left')}</CFormLabel>
          <CFormInput
            type="number"
            value={hingesData.leftHingePrice}
            onChange={(e) => setHingesData({ ...hingesData, leftHingePrice: e.target.value })}
            placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderLeft')}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.hinges.right')}</CFormLabel>
          <CFormInput
            type="number"
            value={hingesData.rightHingePrice}
            onChange={(e) => setHingesData({ ...hingesData, rightHingePrice: e.target.value })}
            placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderRight')}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.hinges.both')}</CFormLabel>
          <CFormInput
            type="number"
            value={hingesData.bothHingePrice}
            onChange={(e) => setHingesData({ ...hingesData, bothHingePrice: e.target.value })}
            placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderBoth')}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.hinges.exposedSide')}</CFormLabel>
          <CFormInput
            type="number"
            value={hingesData.exposedSidePrice}
            onChange={(e) => setHingesData({ ...hingesData, exposedSidePrice: e.target.value })}
            placeholder={t('settings.manufacturers.catalogMapping.hinges.placeholderExposed')}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowHingesModal(false)}>{t('common.cancel')}</CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={saveHingesDetails}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>


      <CModal visible={showModificationModal} onClose={() => setShowModificationModal(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.mod.modalTitle')} />
        <CModalBody>
          <CFormLabel>{t('settings.manufacturers.catalogMapping.mod.name')}</CFormLabel>
          <CFormInput
            value={modificationData.modificationName}
            onChange={(e) => setModificationData({ ...modificationData, modificationName: e.target.value })}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.fields.description')}</CFormLabel>
          <CFormTextarea
            value={modificationData.description}
            onChange={(e) => setModificationData({ ...modificationData, description: e.target.value })}
            rows={3}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.mod.notes')}</CFormLabel>
          <CFormTextarea
            value={modificationData.notes}
            onChange={(e) => setModificationData({ ...modificationData, notes: e.target.value })}
            rows={2}
          />

          <CFormLabel className="mt-2">{t('settings.manufacturers.catalogMapping.fields.price')}</CFormLabel>
          <CFormInput
            type="number"
            value={modificationData.price}
            onChange={(e) => setModificationData({ ...modificationData, price: e.target.value })}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModificationModal(false)}>{t('common.cancel')}</CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={saveModificationDetails}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Style Modal */}
      <CModal visible={deleteStyleModalVisible} onClose={() => setDeleteStyleModalVisible(false)}>
        <PageHeader title={`Delete Style: "${styleToDelete}"`} />
        <CModalBody>
          <div className="mb-3">
            <p>
              You are about to delete the style "<strong>{styleToDelete}</strong>".
              This will affect <strong>{catalogData.filter(item => item.style === styleToDelete).length}</strong> catalog items.
            </p>

            <p>What would you like to do with the items that currently have this style?</p>

            <div className="mt-3">
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="deleteOption"
                  id="deleteItems"
                  checked={!mergeToStyle}
                  onChange={() => setMergeToStyle('')}
                />
                <label className="form-check-label text-danger" htmlFor="deleteItems">
                  <strong>Delete all items</strong> with this style permanently
                </label>
              </div>

              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="deleteOption"
                  id="mergeItems"
                  checked={!!mergeToStyle}
                  onChange={() => setMergeToStyle(sortedUniqueStyles.find(s => s !== styleToDelete) || '')}
                />
                <label className="form-check-label text-primary" htmlFor="mergeItems">
                  <strong>Merge items</strong> to another style
                </label>
              </div>
            </div>

            {mergeToStyle !== '' && (
              <div className="mt-3">
                <CFormLabel>Select target style:</CFormLabel>
                <CFormSelect
                  value={mergeToStyle}
                  onChange={(e) => setMergeToStyle(e.target.value)}
                >
                  <option value="">Select a style...</option>
                  {sortedUniqueStyles
                    .filter(style => style !== styleToDelete)
                    .map((style, idx) => (
                      <option key={idx} value={style}>
                        {style}
                      </option>
                    ))}
                </CFormSelect>
              </div>
            )}

            <div className="mt-3 p-3 bg-light rounded">
              <small className="text-muted">
                {mergeToStyle ? (
                  <>
                    <strong>Smart Merge Action:</strong> All {catalogData.filter(item => item.style === styleToDelete).length} items
                    with style "{styleToDelete}" will be processed:
                    <ul className="mt-1 mb-0">
                      <li>Items with unique codes will be merged to style "{mergeToStyle}"</li>
                      <li>Duplicate items (same code + style) will be automatically removed</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <strong>Delete Action:</strong> All {catalogData.filter(item => item.style === styleToDelete).length} items
                    with style "{styleToDelete}" will be permanently deleted. This action cannot be undone.
                  </>
                )}
              </small>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteStyleModalVisible(false)}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color={mergeToStyle ? "primary" : "danger"}
            onClick={handleDeleteStyle}
            disabled={isDeleting || (mergeToStyle !== '' && !mergeToStyle)}
          >
            {isDeleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              mergeToStyle ? `Merge to "${mergeToStyle}"` : "Delete Permanently"
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Individual Delete Item Modal */}
      <CModal visible={deleteItemModalVisible} onClose={() => setDeleteItemModalVisible(false)}>
        <PageHeader title="Delete Catalog Item" />
        <CModalBody>
          {itemToDelete && (
            <div>
              <p>Are you sure you want to delete this catalog item?</p>
              <div className="p-3 bg-light rounded">
                <strong>Code:</strong> {itemToDelete.code}<br />
                <strong>Description:</strong> {itemToDelete.description || 'N/A'}<br />
                <strong>Style:</strong> {itemToDelete.style || 'N/A'}<br />
                <strong>Price:</strong> ${itemToDelete.price || '0.00'}
              </div>
              <p className="text-danger mt-3">
                <small>⚠️ This action cannot be undone.</small>
              </p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setDeleteItemModalVisible(false)}
            disabled={isDeletingItem}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color="danger"
            onClick={handleDeleteItem}
            disabled={isDeletingItem}
          >
            {isDeletingItem ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              "Delete Item"
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Delete Modal */}
      <CModal visible={bulkDeleteModalVisible} onClose={() => setBulkDeleteModalVisible(false)}>
        <PageHeader title="Delete Multiple Items" />
        <CModalBody>
          <div>
            <p>Are you sure you want to delete <strong>{selectedItems.length}</strong> selected catalog items?</p>

            <div className="p-3 bg-light rounded">
              <strong>Items to be deleted:</strong>
              <ul className="mt-2 mb-0">
                {currentItems
                  .filter(item => selectedItems.includes(item.id))
                  .slice(0, 10) // Show first 10 items
                  .map(item => (
                    <li key={item.id}>
                      {item.code} - {item.description || 'N/A'}
                    </li>
                  ))}
                {selectedItems.length > 10 && (
                  <li><em>... and {selectedItems.length - 10} more items</em></li>
                )}
              </ul>
            </div>

            <p className="text-danger mt-3">
              <small>⚠️ This action cannot be undone. All selected items will be permanently deleted.</small>
            </p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setBulkDeleteModalVisible(false)}
            disabled={isBulkDeleting}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color="danger"
            onClick={handleBulkDelete}
            disabled={isBulkDeleting}
          >
            {isBulkDeleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting {selectedItems.length} items...
              </>
            ) : (
              `Delete ${selectedItems.length} Items`
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Rollback Modal */}
      <CModal visible={rollbackModalVisible} onClose={() => setRollbackModalVisible(false)}>
        <PageHeader title={t('settings.manufacturers.catalogMapping.rollback.modalTitle')} />
        <CModalBody>
          <div className="mb-3">
            <p>{t('settings.manufacturers.catalogMapping.rollback.selectBackup')}</p>

            {isLoadingBackups ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Loading backups...
              </div>
            ) : availableBackups.length === 0 ? (
              <div className="alert alert-info">
                {t('settings.manufacturers.catalogMapping.rollback.noBackups')}
              </div>
            ) : (
              <div>
                {availableBackups.map((backup) => (
                  <div key={backup.uploadSessionId} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="backupSelection"
                      id={`backup-${backup.uploadSessionId}`}
                      value={backup.uploadSessionId}
                      checked={selectedBackup === backup.uploadSessionId}
                      onChange={(e) => setSelectedBackup(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={`backup-${backup.uploadSessionId}`}>
                      <div>
                        <strong>{backup.originalName}</strong>
                        <br />
                        <small className="text-muted">
                          {new Date(backup.uploadedAt).toLocaleString()} - {backup.itemsCount} items
                        </small>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedBackup && (
            <div className="alert alert-warning">
              <strong>{t('settings.manufacturers.catalogMapping.rollback.warning')}</strong>
              <br />
              {t('settings.manufacturers.catalogMapping.rollback.confirmText')}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setRollbackModalVisible(false);
              setSelectedBackup('');
              setAvailableBackups([]);
            }}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color="warning"
            onClick={handleRollback}
            disabled={!selectedBackup || isRollingBack}
          >
            {isRollingBack ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('settings.manufacturers.catalogMapping.rollback.rolling')}
              </>
            ) : (
              t('settings.manufacturers.catalogMapping.rollback.rollbackButton')
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Bulk Edit Modal */}
      <CModal visible={bulkEditModalVisible} onClose={() => setBulkEditModalVisible(false)} size="lg">
        <PageHeader title={`Bulk Edit ${selectedItems.length} Items`} />
        <CModalBody>
          <div>
            <p>Edit the following fields for the selected {selectedItems.length} catalog items. Leave fields empty to keep existing values.</p>

            <div className="row g-3">
              <div className="col-md-6">
                <CFormLabel>Style</CFormLabel>
                <CFormInput
                  type="text"
                  value={bulkEditForm.style}
                  onChange={(e) => setBulkEditForm({...bulkEditForm, style: e.target.value})}
                  placeholder="Leave empty to keep existing"
                />
              </div>

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

              <div className="col-md-6">
                <CFormLabel>Price</CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={bulkEditForm.price}
                  onChange={(e) => setBulkEditForm({...bulkEditForm, price: e.target.value})}
                  placeholder="Leave empty to keep existing"
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
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating {selectedItems.length} Items...
              </>
            ) : (
              `Update ${selectedItems.length} Items`
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Style Name Modal */}
      <CModal visible={editStyleNameModalVisible} onClose={() => setEditStyleNameModalVisible(false)}>
        <PageHeader title="Edit Style Name" />
        <CModalBody>
          <div>
            <p>Rename the style for all items of this manufacturer. This will affect all catalog items currently using this style.</p>

            <div className="mb-3">
              <CFormLabel>Current Style Name</CFormLabel>
              <CFormInput
                type="text"
                value={styleNameEditForm.oldStyleName}
                disabled
                className="bg-light"
              />
            </div>

            <div className="mb-3">
              <CFormLabel>New Style Name</CFormLabel>
              <CFormInput
                type="text"
                value={styleNameEditForm.newStyleName}
                onChange={(e) => setStyleNameEditForm({...styleNameEditForm, newStyleName: e.target.value})}
                placeholder="Enter new style name"
                autoFocus
              />
            </div>

            <div className="p-3 bg-warning bg-opacity-10 rounded">
              <small className="text-muted">
                <strong>Warning:</strong> This will rename the style for all items currently using "{styleNameEditForm.oldStyleName}".
                The change applies to all {catalogData.filter(item => item.style === styleNameEditForm.oldStyleName).length} items with this style.
              </small>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setEditStyleNameModalVisible(false)}
            disabled={isEditingStyleName}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleEditStyleName}
            disabled={isEditingStyleName || !styleNameEditForm.newStyleName.trim()}
          >
            {isEditingStyleName ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Renaming Style...
              </>
            ) : (
              "Rename Style"
            )}
          </CButton>
        </CModalFooter>
      </CModal>

    </div>
  );
};

export default CatalogMappingTab;
