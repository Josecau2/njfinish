import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
import Swal from 'sweetalert2';
import { useDispatch } from 'react-redux';
import { fetchManufacturerById } from '../../../../store/slices/manufacturersSlice';
import axiosInstance from '../../../../helpers/axiosInstance';
import CreatableSelect from 'react-select/creatable';

const CatalogMappingTab = ({ manufacturer, id }) => {
  const { t } = useTranslation();
  const api_url = import.meta.env.VITE_API_URL;

  // const catalogData = manufacturer?.catalogData || [];
  const catalogData = Array.isArray(manufacturer?.catalogData)
    ? [...manufacturer.catalogData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  const getInitialItemsPerPage = () => {
    const saved = localStorage.getItem('catalogItemsPerPage');
    return saved ? parseInt(saved, 10) : 50;
  };

  const [typeFilter, setTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');


  const uniqueTypes = Array.from(new Set(catalogData.map(item => item.type?.trim()).filter(Boolean)));
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

  const filteredCatalogData = catalogData.filter((item) => {
    const matchesType = typeFilter ? item.type?.toLowerCase() === typeFilter.toLowerCase() : true;
    const matchesStyle = styleFilter ? item.style?.toLowerCase() === styleFilter.toLowerCase() : true;
    return matchesType && matchesStyle;
  });


  const totalPages = Math.ceil(filteredCatalogData.length / itemsPerPage);
  const currentItems = filteredCatalogData.slice(indexOfFirstItem, indexOfLastItem);

  const [showAssemblyModal, setShowAssemblyModal] = useState(false);
  const [showHingesModal, setShowHingesModal] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);

  const [assemblyData, setAssemblyData] = useState({ type: '', amount: '', applyTo: 'one' });

  const [hingesData, setHingesData] = useState({
    leftHingePrice: '',
    rightHingePrice: '',
    bothHingePrice: '',
    exposedSidePrice: '',
  });
  const [modificationData, setModificationData] = useState({ modificationName: '', price: '', notes: '', description: '' });


  const [styleImage, setStyleImage] = useState(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState([]);




  const uniqueStyles = Array.from(
    new Set(
      catalogData
        .map((item) => item.style?.trim())
        .filter((style) => !!style) // remove null, undefined, or empty
    )
  );
  const sortedUniqueStyles = [...uniqueStyles].sort((a, b) =>
    a.localeCompare(b)
  );
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

  const [file, setFile] = useState(null);
  const dispatch = useDispatch();





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
      const response = await fetch(`${api_url}/api/manufacturers/catalog/${manufacturer.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(manualForm),
      });


  if (!response.ok) throw new Error('Failed to save');
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
      dispatch(fetchManufacturerById(id));

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
      const response = await fetch(`${api_url}/api/manufacturers/catalog/edit/${editForm.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update');

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
      dispatch(fetchManufacturerById(id));
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
      const response = await fetch(`${api_url}/api/manufacturers/catalog/edit/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      });

      if (!response.ok) throw new Error('Failed to delete item');

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
      dispatch(fetchManufacturerById(id));
      
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
        fetch(`${api_url}/api/manufacturers/catalog/edit/${itemId}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        throw new Error(`Failed to delete ${failedDeletes.length} items`);
      }

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
      dispatch(fetchManufacturerById(id));
      
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
      const response = await fetch(`${api_url}/api/manufacturers/${id}/cleanup-duplicates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      });

      if (!response.ok) throw new Error('Failed to cleanup duplicates');

      const result = await response.json();

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
        dispatch(fetchManufacturerById(id));
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
      const response = await fetch(`${api_url}/api/manufacturers/${id}/catalog/backups`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
      });

      if (!response.ok) throw new Error('Failed to fetch backups');

      const result = await response.json();
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
      const response = await fetch(`${api_url}/api/manufacturers/${id}/catalog/rollback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ uploadSessionId: selectedBackup }),
      });

      if (!response.ok) throw new Error('Failed to rollback catalog');

      const result = await response.json();

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
      dispatch(fetchManufacturerById(id));
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
      
      const response = await fetch(`${api_url}/api/manufacturers/${id}/style/${encodeURIComponent(styleToDelete)}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to delete/merge style');

      const result = await response.json();

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
      dispatch(fetchManufacturerById(id));
      
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

    const formData = new FormData();
    formData.append('catalogFiles', file); // 'catalogFiles' matches backend Multer field name
    try {
      const response = await fetch(`${api_url}/api/manufacturers/${id}/catalog/upload`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      // Enhanced success message with rollback info
      let successMessage = t('settings.manufacturers.catalogMapping.file.uploadSuccess');
      if (result.stats) {
        successMessage += `\n\nProcessed: ${result.stats.totalProcessed} items\nCreated: ${result.stats.created} | Updated: ${result.stats.updated}`;
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
      dispatch(fetchManufacturerById(id)); // Reload updated data
    } catch (err) {
      console.error(err);
      Swal.fire(t('common.error'), t('settings.manufacturers.catalogMapping.file.uploadFailed'), "error");
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
      const response = await axiosInstance.get(`/api/manufacturers/style/${catalogId}`, {
        headers: getAuthHeaders()
      });
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
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders()
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
      const res = await axiosInstance.get(`/api/manufacturers/style/${id}`, {
        headers: getAuthHeaders()
      });

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

  const handleAssemblyCostClick = async (item) => {
    try {
      const { id } = item

      const res = await axiosInstance.get(`/api/manufacturers/assemblycost/${id}`, {
        headers: getAuthHeaders()
      });

      const { type, price } = res.data || {};
      setSelectedCatalogItem(item);
      setAssemblyData({
        type: type || '',
        price: price || '' // Map 'amount' from API to 'price' in state
      });
    } catch (error) {
      console.error('Error fetching style:', error);
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


  const handleModificationDetailsClick = async (item) => {
    try {
      setSelectedCatalogItem(item);

      const res = await axiosInstance.get(`/api/manufacturers/items/modifications/${item.id}`, {
        headers: getAuthHeaders()
      });
      const { modificationName, description, notes, price } = res.data.data || {};

      setModificationData({
        modificationName: modificationName || '',
        description: description || '',
        notes: notes || '',
        price: price || '',
      });
    } catch (error) {
      console.error('Error fetching modification details:', error);
      setModificationData({
        modificationName: '',
        description: '',
        notes: '',
        price: '',
      });
    } finally {
      setShowModificationModal(true);
    }
  };




  const saveAssemblyCost = async () => {
    try {
      const payload = {
        catalogDataId: selectedCatalogItem.id, // you need to pass this from the item you clicked on
        type: assemblyData.type,
        price: parseFloat(assemblyData.price),
        applyTo: assemblyData.applyTo,
        manufacturerId: selectedCatalogItem.manufacturerId
      };

      await axiosInstance.post('/api/manufacturers/items/assembly-cost', payload, {
        headers: getAuthHeaders()
      });
      setShowAssemblyModal(false);
      // Optionally refetch the catalog data to update the UI
    } catch (error) {
      console.error('Failed to save assembly cost:', error);
    }
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

      await axiosInstance.post('/api/manufacturers/items/hinges', payload, {
        headers: getAuthHeaders()
      });
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

      await axiosInstance.post('/api/manufacturers/items/modifications', payload, {
        headers: getAuthHeaders()
      });
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
      
      {/* Heading with Buttons aligned right */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <h5 className="mb-0">{t('settings.manufacturers.catalogMapping.title')}</h5>
        <div className="d-flex flex-wrap gap-2">
          <CButton
            color="primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => setFileModalVisible(true)}
          >
            {t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}
          </CButton>
          <CButton 
            color="success" 
            size="sm"
            className="flex-shrink-0"
            onClick={() => setManualModalVisible(true)}
          >
            {t('settings.manufacturers.catalogMapping.buttons.addItem')}
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
                {t('settings.manufacturers.catalogMapping.cleanupDuplicates.cleaning')}
              </>
            ) : (
              <>{t('settings.manufacturers.catalogMapping.cleanupDuplicates.buttonText')}</>
            )}
          </CButton>
          <CButton
            color="info"
            size="sm"
            className="flex-shrink-0"
            onClick={handleRollbackClick}
            disabled={catalogData.length === 0}
            title="Rollback recent catalog upload"
          >
            {t('settings.manufacturers.catalogMapping.rollback.buttonText')}
          </CButton>
        </div>
      </div>
      
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center mb-3 gap-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', minWidth: '60px' }}
            value={itemsPerPage}
            onChange={(e) => {
              const value = Number(e.target.value);
              setItemsPerPage(value);
              localStorage.setItem('catalogItemsPerPage', value);
              setCurrentPage(1);
            }}
          >
            {[10, 25, 50, 100, 200].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <span className="text-muted small">{t('settings.manufacturers.catalogMapping.pagination.perPage')}</span>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ minWidth: '120px' }}
            value={typeFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setTypeFilter(e.target.value);
            }}
          >
            <option value="">{t('settings.manufacturers.catalogMapping.filters.allTypes')}</option>
            {uniqueTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="d-flex align-items-center flex-wrap gap-2">
            <select
              className="form-select form-select-sm"
              style={{ minWidth: '120px' }}
              value={styleFilter}
              onChange={(e) => {
                setCurrentPage(1);
                setStyleFilter(e.target.value);
              }}
            >
              <option value="">{t('settings.manufacturers.catalogMapping.filters.allStyles')}</option>
              {sortedUniqueStyles.map((style, idx) => (
                <option key={idx} value={style}>
                  {style}
                </option>
              ))}
            </select>
            
            {styleFilter && (
              <CButton
                size="sm"
                color="danger"
                onClick={() => handleDeleteStyleClick(styleFilter)}
                title={`Delete style "${styleFilter}"`}
                style={{ 
                  display: 'inline-block',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('settings.manufacturers.catalogMapping.buttons.deleteStyle')}
              </CButton>
            )}
          </div>
        </div>
        
        {/* Debug info - remove this later */}
        {process.env.NODE_ENV === 'development' && (
          <small className="text-muted">
            Style Filter: "{styleFilter}" | Styles Count: {sortedUniqueStyles.length}
          </small>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 p-3 bg-light rounded gap-2">
          <span className="fw-bold">
            {t('settings.manufacturers.catalogMapping.pagination.itemsSelected', { count: selectedItems.length })}
          </span>
          <CButton
            color="danger"
            size="sm"
            onClick={handleBulkDeleteClick}
            disabled={isBulkDeleting}
            className="flex-shrink-0"
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
      )}

      {/* Table */}
  {catalogData.length === 0 ? (
    <p>{t('settings.manufacturers.catalogMapping.empty')}</p>
      ) : (
        <div className="table-responsive">
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
                <CTableHeaderCell style={{ minWidth: '80px' }}>{t('settings.manufacturers.catalogMapping.table.code')}</CTableHeaderCell>
                <CTableHeaderCell style={{ minWidth: '120px', maxWidth: '180px' }}>
                  {t('settings.manufacturers.catalogMapping.table.description')}
                </CTableHeaderCell>
                <CTableHeaderCell style={{ minWidth: '80px' }}>{t('settings.manufacturers.catalogMapping.table.style')}</CTableHeaderCell>
                <CTableHeaderCell style={{ minWidth: '70px' }}>{t('settings.manufacturers.catalogMapping.table.price')}</CTableHeaderCell>
                <CTableHeaderCell style={{ minWidth: '70px' }}>{t('settings.manufacturers.catalogMapping.table.type')}</CTableHeaderCell>
                <CTableHeaderCell style={{ minWidth: '120px' }} className="actions-column">{t('settings.manufacturers.catalogMapping.table.actions')}</CTableHeaderCell>

                {/* Add more if needed */}
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
                      color="info"
                      onClick={() => handleManageStyleClick(item)}
                      style={{ 
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#6c757d',
                        borderColor: '#6c757d',
                        minWidth: 'auto'
                      }}
                      title={t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                    >
                      🎨
                    </CButton>

                    <CButton
                      size="sm"
                      color="warning"
                      onClick={() => handleAssemblyCostClick(item)}
                      style={{ 
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#fd7e14',
                        borderColor: '#fd7e14',
                        minWidth: 'auto'
                      }}
                      title={t('settings.manufacturers.catalogMapping.actions.assemblyCost')}
                    >
                      🔧
                    </CButton>

                    <CButton
                      size="sm"
                      color="success"
                      onClick={() => handleModificationDetailsClick(item)}
                      style={{ 
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#198754',
                        borderColor: '#198754',
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
      )}
      {catalogData.length > 0 ? (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
          </div>
          <div>
            <CButton
              size="sm"
              color="secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="me-2"
            >
              {t('pagination.prevPageTitle')}
            </CButton>
            <CButton
              size="sm"
              color="secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
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
        <CModalHeader onClose={() => setFileModalVisible(false)}>
          <CModalTitle>{t('settings.manufacturers.catalogMapping.file.modalTitle')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormInput type="file" name="catalogFiles" label={t('settings.manufacturers.catalogMapping.file.selectLabel')} onChange={handleFileChange} />

          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setFileModalVisible(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={handleUpload}>{t('settings.manufacturers.catalogMapping.file.uploadBtn')}</CButton>

        </CModalFooter>
      </CModal>

      {/* Manual Upload Modal */}
      <CModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
      >
        <CModalHeader onClose={() => setManualModalVisible(false)}>
      <CModalTitle>{t('settings.manufacturers.catalogMapping.manual.modalTitle')}</CModalTitle>
        </CModalHeader>
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
          <CButton color="success" onClick={handleSaveManualItem}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}>
        <CModalHeader>
      <CModalTitle>{t('settings.manufacturers.catalogMapping.edit.modalTitle')}</CModalTitle>
        </CModalHeader>
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
          <CButton color="primary" onClick={handleUpdateItem} disabled={isUpdating}>
            {isUpdating ? t('settings.manufacturers.catalogMapping.edit.updating') : t('settings.manufacturers.catalogMapping.edit.update')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Style Modal */}
      <CModal visible={showStyleModal} onClose={() => setShowStyleModal(false)}>
        <CModalHeader>
          <CModalTitle>{t('settings.manufacturers.catalogMapping.style.manageTitle', { style: selectedStyle })}</CModalTitle>
        </CModalHeader>

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
                  // src={`/uploads/manufacturer_catalogs/${styleForm.image}`}
                  src={
                    styleForm.image
                      ? `${api_url}/uploads/manufacturer_catalogs/${styleForm.image}`
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
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : null}
          </CForm>
        </CModalBody>

        <CModalFooter>
          <CButton color="primary" onClick={handleSaveStyle}>{t('common.save')}</CButton>
          <CButton color="secondary" onClick={() => setShowStyleModal(false)}>{t('common.cancel')}</CButton>
        </CModalFooter>
      </CModal>


      {/* Style View Modal */}
      <CModal visible={showStyleViewModal} onClose={() => setShowStyleViewModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>📝 {t('settings.manufacturers.catalogMapping.style.detailsTitle')}</CModalTitle>
        </CModalHeader>
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
                    // src={`./uploads/manufacturer_catalogs/${styleDetails.image}`}
                    src={
                      styleDetails.image
                        ? `${api_url}/uploads/manufacturer_catalogs/${styleDetails.image}`
                        : "/images/nologo.png"
                    }
                    alt="Style"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
        <CModalHeader>
          <CModalTitle>{t('settings.manufacturers.catalogMapping.assembly.modalTitle')}</CModalTitle>
        </CModalHeader>
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
            <option value="all">{t('settings.manufacturers.catalogMapping.assembly.applyAll')}</option>
            <option value="one">{t('settings.manufacturers.catalogMapping.assembly.applyOne')}</option>
          </CFormSelect>


        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowAssemblyModal(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={saveAssemblyCost}>
            {t('common.save')}
          </CButton>
        </CModalFooter>
      </CModal>


      <CModal visible={showHingesModal} onClose={() => setShowHingesModal(false)}>
        <CModalHeader>
          <CModalTitle>{t('settings.manufacturers.catalogMapping.hinges.modalTitle')}</CModalTitle>
        </CModalHeader>
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
          <CButton color="primary" onClick={saveHingesDetails}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>


      <CModal visible={showModificationModal} onClose={() => setShowModificationModal(false)}>
        <CModalHeader><CModalTitle>{t('settings.manufacturers.catalogMapping.mod.modalTitle')}</CModalTitle></CModalHeader>
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
          <CButton color="primary" onClick={saveModificationDetails}>{t('common.save')}</CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Style Modal */}
      <CModal visible={deleteStyleModalVisible} onClose={() => setDeleteStyleModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Delete Style: "{styleToDelete}"</CModalTitle>
        </CModalHeader>
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
        <CModalHeader>
          <CModalTitle>Delete Catalog Item</CModalTitle>
        </CModalHeader>
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
        <CModalHeader>
          <CModalTitle>Delete Multiple Items</CModalTitle>
        </CModalHeader>
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
        <CModalHeader>
          <CModalTitle>{t('settings.manufacturers.catalogMapping.rollback.modalTitle')}</CModalTitle>
        </CModalHeader>
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

    </div>
  );
};

export default CatalogMappingTab;
