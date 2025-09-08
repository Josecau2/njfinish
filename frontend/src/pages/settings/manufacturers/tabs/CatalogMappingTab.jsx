import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import PageHeader from '../../../../components/PageHeader';

// Authorization is handled centrally by axios interceptors

import {
  CButton,
  CModal,
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
  CFormLabel,
  CFormCheck,
  CBadge,
  CCard,
  CCardHeader,
  CCardBody
} from '@coreui/react';
// Use lucide icons (React components) only via centralized module
import { Plus, ChevronUp, ChevronDown } from '@/icons-lucide';
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
  // Main Modification Management Modal
  const [showMainModificationModal, setShowMainModificationModal] = useState(false);
  // Quick edit states for categories/templates within Modification Management
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editCategory, setEditCategory] = useState({ id: '', name: '', orderIndex: 0, image: '' });
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showMoveModificationModal, setShowMoveModificationModal] = useState(false);
  const [modificationToMove, setModificationToMove] = useState(null);
  const [showQuickEditTemplateModal, setShowQuickEditTemplateModal] = useState(false);
  // Keep full context so quick-save doesn't wipe fields on server
  const [editTemplate, setEditTemplate] = useState({ id: '', categoryId: '', name: '', defaultPrice: '', sampleImage: '', isReady: false, fieldsConfig: null });
  const [editGuidedBuilder, setEditGuidedBuilder] = useState({
    sliders: {
      height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Height' },
      width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Width' },
      depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Depth' }
    },
    sideSelector: { enabled: false, options: ['L','R'], label: 'Side' },
    qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
    notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
    customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false, label: 'Sample Image' }
  });
  const [modificationView, setModificationView] = useState('cards'); // 'cards', 'addNew', 'gallery'
  const [selectedModificationCategory, setSelectedModificationCategory] = useState(null);
  const [modificationStep, setModificationStep] = useState(1); // 1: submenu, 2: template builder
  // Track editing state for template builder
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  // Global Mods integration
  const [showAssignGlobalModsModal, setShowAssignGlobalModsModal] = useState(false);
  const [showItemGlobalModsModal, setShowItemGlobalModsModal] = useState(false);
  const [globalGallery, setGlobalGallery] = useState([]);
  const [globalAssignments, setGlobalAssignments] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFormGM, setAssignFormGM] = useState({ templateId: '', scope: 'all', targetStyle: '', targetType: '', overridePrice: '' });
  const [includeDraftTemplates, setIncludeDraftTemplates] = useState(false);
  const [itemGlobalList, setItemGlobalList] = useState([]);

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

  // Comprehensive Template Builder State
  const [newTemplate, setNewTemplate] = useState({
    categoryId: '',
    name: '',
    defaultPrice: '',
    isReady: false,
    sampleImage: '',
    saveAsBlueprint: false // Task 5: Add blueprint checkbox support
  });
  const [newCategory, setNewCategory] = useState({ name: '', orderIndex: 0 });
  const [guidedBuilder, setGuidedBuilder] = useState({
    sliders: {
      height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Height' },
      width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Width' },
      depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Depth' }
    },
    sideSelector: { enabled: false, options: ['L','R'], label: 'Side' },
    qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
    notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
    customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
    descriptions: { internal: '', customer: '', installer: '', both: false },
    modSampleImage: { enabled: false, label: 'Sample Image' }
  });
  const [builderErrors, setBuilderErrors] = useState({});
  const [creatingModification, setCreatingModification] = useState(false);


  // Selected Items for bulk operations
  const [selectedCatalogItem, setSelectedCatalogItem] = useState([]);

  // Sub-types management
  const [subTypes, setSubTypes] = useState([]);
  const [showSubTypeModal, setShowSubTypeModal] = useState(false);
  const [showAssignSubTypeModal, setShowAssignSubTypeModal] = useState(false);
  const [subTypeForm, setSubTypeForm] = useState({
    name: '',
    description: '',
    requires_hinge_side: false,
    requires_exposed_side: false
  });

  // State for grouped catalog view in assignment modal
  const [groupedCatalogData, setGroupedCatalogData] = useState([]);
  const [selectedCatalogCodes, setSelectedCatalogCodes] = useState([]);
  const [editingSubType, setEditingSubType] = useState(null);
  const [selectedSubType, setSelectedSubType] = useState(null);
  const [subTypeAssignments, setSubTypeAssignments] = useState({});

  // Style management states
  const [styleImage, setStyleImage] = useState(null);

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

  // Load sub-types for this manufacturer
  const loadSubTypes = async () => {
    if (!id) return;
    try {
      const { data } = await axiosInstance.get(`/api/manufacturers/${id}/sub-types`);
      setSubTypes(data.data || []);
    } catch (error) {
      console.error('Error loading sub-types:', error);
      setSubTypes([]);
    }
  };

  // Create or update sub-type
  const handleSubTypeSave = async () => {
    try {
      if (editingSubType) {
        await axiosInstance.put(`/api/sub-types/${editingSubType.id}`, subTypeForm);
        Swal.fire('Success', 'Sub-type updated successfully!', 'success');
      } else {
        await axiosInstance.post(`/api/manufacturers/${id}/sub-types`, subTypeForm);
        Swal.fire('Success', 'Sub-type created successfully!', 'success');
      }

      setShowSubTypeModal(false);
      setSubTypeForm({ name: '', description: '', requires_hinge_side: false, requires_exposed_side: false });
      setEditingSubType(null);
      await loadSubTypes();
    } catch (error) {
      console.error('Error saving sub-type:', error);
      Swal.fire(t('common.error'), error.response?.data?.message || t('settings.manufacturers.catalogMapping.subTypes.saveFailed'), 'error');
    }
  };

  // Delete sub-type
  const handleSubTypeDelete = async (subType) => {
    const result = await Swal.fire({
      title: t('settings.manufacturers.catalogMapping.subTypes.deleteTitle'),
      text: t('settings.manufacturers.catalogMapping.subTypes.deleteConfirm', { name: subType.name }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/sub-types/${subType.id}`);
        Swal.fire(t('common.deleted'), t('settings.manufacturers.catalogMapping.subTypes.deleteSuccess'), 'success');
        await loadSubTypes();
      } catch (error) {
        console.error('Error deleting sub-type:', error);
        Swal.fire(t('common.error'), t('settings.manufacturers.catalogMapping.subTypes.deleteFailed'), 'error');
      }
    }
  };

  // Assign selected items to sub-type
  const handleAssignToSubType = async () => {
    if (!selectedSubType || selectedCatalogItem.length === 0) return;

    try {
      await axiosInstance.post(`/api/sub-types/${selectedSubType}/assign-items`, {
        catalogItemIds: selectedCatalogItem
      });

  Swal.fire(t('common.success'), t('settings.manufacturers.catalogMapping.subTypes.assignSuccess', { count: selectedCatalogItem.length }), 'success');
      setShowAssignSubTypeModal(false);
      setSelectedCatalogItem([]);
      setSelectedSubType(null);
      await fetchCatalogData(); // Refresh to show assignments
    } catch (error) {
      console.error('Error assigning items:', error);
      Swal.fire(t('common.error'), t('settings.manufacturers.catalogMapping.subTypes.assignFailed'), 'error');
    }
  };

  // Group catalog data by code for assignment modal
  const groupCatalogDataByCode = (catalogItems) => {
    const groups = {};

    catalogItems.forEach(item => {
      const code = item.code;
      if (!groups[code]) {
        groups[code] = {
          code: code,
          description: item.description,
          type: item.type,
          styles: [],
          itemIds: []
        };
      }

      groups[code].styles.push(item.style);
      groups[code].itemIds.push(item.id);
    });

    // Convert to array and sort by code
    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
  };

  // Handle code selection (selects all items with that code)
  const handleCodeSelection = (code, isSelected) => {
    const group = groupedCatalogData.find(g => g.code === code);
    if (!group) return;

    if (isSelected) {
      // Add all item IDs for this code
      setSelectedCatalogItem(prev => [
        ...prev.filter(id => !group.itemIds.includes(id)), // Remove any existing
        ...group.itemIds // Add all for this code
      ]);
      setSelectedCatalogCodes(prev => [...prev.filter(c => c !== code), code]);
    } else {
      // Remove all item IDs for this code
      setSelectedCatalogItem(prev => prev.filter(id => !group.itemIds.includes(id)));
      setSelectedCatalogCodes(prev => prev.filter(c => c !== code));
    }
  };

  // Update grouped data when catalog data changes
  useEffect(() => {
    if (showAssignSubTypeModal && catalogData.length > 0) {
      setGroupedCatalogData(groupCatalogDataByCode(catalogData));
      // Load existing assignments for the selected sub-type
      if (selectedSubType) {
        loadExistingAssignments();
      }
    }
  }, [showAssignSubTypeModal, catalogData, selectedSubType]);

  // Load existing assignments for the selected sub-type
  const loadExistingAssignments = async () => {
    if (!selectedSubType) return;

    try {
      const { data } = await axiosInstance.get(`/api/sub-types/${selectedSubType}/assignments`);
      const assignedItems = data.data || [];

      // Extract the assigned item IDs
      const assignedItemIds = assignedItems.map(item => item.id);
      setSelectedCatalogItem(assignedItemIds);

      // Extract the codes that are assigned
      const assignedCodes = [...new Set(assignedItems.map(item => item.code))];
      setSelectedCatalogCodes(assignedCodes);

    } catch (error) {
      console.error('Error loading existing assignments:', error);
      // Don't show error to user as this is just for display purposes
    }
  };

  // Global mods helpers
  const loadGlobalGallery = async () => {
    try {
      const { data } = await axiosInstance.get('/api/global-mods/gallery');
      setGlobalGallery(data?.gallery || []);
    } catch (e) {
      setGlobalGallery([]);
    }
  };

  // Load manufacturer-specific categories
  const [manufacturerCategories, setManufacturerCategories] = useState([]);
  const loadManufacturerCategories = async () => {
    if (!id) return;
    try {
      const { data } = await axiosInstance.get('/api/global-mods/categories', {
        params: { scope: 'manufacturer', manufacturerId: id, includeTemplates: true }
      });
      setManufacturerCategories(data?.categories || []);
    } catch (e) {
      setManufacturerCategories([]);
    }
  };
  const loadGlobalAssignments = async () => {
    if (!id) return;
    setAssignLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/global-mods/assignments', { params: { manufacturerId: id } });
      setGlobalAssignments(data?.assignments || []);
    } catch (e) {
      setGlobalAssignments([]);
    } finally {
      setAssignLoading(false);
    }
  };

  // Image upload helper (reuses backend /api/global-mods/upload/image)
  const uploadImageFile = async (file) => {
    if (!file) return null;
    const form = new FormData();
    form.append('logoImage', file);
    const { data } = await axiosInstance.post('/api/global-mods/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data?.filename || null;
  };

  // Create modification category (submenu)
  const createModificationCategory = async () => {
    try {
      const { data } = await axiosInstance.post('/api/global-mods/categories', {
        name: newCategory.name,
        scope: 'manufacturer', // Always manufacturer scope in this context
        manufacturerId: id, // Current manufacturer ID
        orderIndex: parseInt(newCategory.orderIndex) || 0
      });
      await loadManufacturerCategories(); // Reload manufacturer categories to show new category
      return data.category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  // Create modification template
  const createModificationTemplate = async (categoryId) => {
    try {
      // Task 5: Ensure manufacturerId is present for proper isolation
      if (!id) {
        throw new Error('Manufacturer ID is required to create modifications');
      }

      const fieldsConfig = {
        sliders: guidedBuilder.sliders,
        sideSelector: guidedBuilder.sideSelector,
        qtyRange: guidedBuilder.qtyRange,
        notes: guidedBuilder.notes,
        customerUpload: guidedBuilder.customerUpload,
        descriptions: guidedBuilder.descriptions,
        modSampleImage: guidedBuilder.modSampleImage
      };

      // Task 5: Handle blueprint vs manufacturer mod logic
      const isBlueprint = newTemplate.saveAsBlueprint || false;
      const requestData = {
        categoryId: isBlueprint ? null : (categoryId || null), // Blueprints don't need categories
        name: newTemplate.name,
        isReady: newTemplate.isReady,
        fieldsConfig: fieldsConfig,
        sampleImage: newTemplate.sampleImage || null,
        isBlueprint: isBlueprint
      };

      // Business rule: Blueprints cannot have manufacturerId or price
      if (isBlueprint) {
        // Creating blueprint - no manufacturerId, no price
        requestData.manufacturerId = null;
        requestData.defaultPrice = null;
      } else {
        // Creating manufacturer-specific mod - has manufacturerId and price
        requestData.manufacturerId = id;
        requestData.defaultPrice = newTemplate.defaultPrice ? parseFloat(newTemplate.defaultPrice) : null;
      }

      const { data } = await axiosInstance.post('/api/global-mods/templates', requestData);

      await loadGlobalGallery(); // Reload gallery to show new template
      await loadManufacturerCategories(); // Reload manufacturer categories in case category was created
      return data.template;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  };

  // Update modification template (edit mode)
  const updateModificationTemplate = async (templateId, categoryId) => {
    try {
      const fieldsConfig = {
        sliders: guidedBuilder.sliders,
        sideSelector: guidedBuilder.sideSelector,
        qtyRange: guidedBuilder.qtyRange,
        notes: guidedBuilder.notes,
        customerUpload: guidedBuilder.customerUpload,
        descriptions: guidedBuilder.descriptions,
        modSampleImage: guidedBuilder.modSampleImage
      };

      await axiosInstance.put(`/api/global-mods/templates/${templateId}`, {
        categoryId: categoryId || null,
        name: newTemplate.name,
        defaultPrice: newTemplate.defaultPrice ? parseFloat(newTemplate.defaultPrice) : null,
        isReady: newTemplate.isReady,
        fieldsConfig,
        sampleImage: newTemplate.sampleImage || null
      });

      await loadGlobalGallery();
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  };

  // Reset modification form
  const resetModificationForm = () => {
    setNewTemplate({
      categoryId: '',
      name: '',
      defaultPrice: '',
      isReady: false,
      sampleImage: ''
    });
    setNewCategory({ name: '', orderIndex: 0 });
    setGuidedBuilder({
      sliders: {
        height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Height' },
        width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Width' },
        depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'], label: 'Depth' }
      },
      sideSelector: { enabled: false, options: ['L','R'], label: 'Side' },
      qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
      notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
      customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false, label: 'Sample Image' }
    });
    setSelectedModificationCategory(null);
    setModificationStep(1);
    setModificationView('cards');
  setEditingTemplateId(null);
  };

  // Delete modification template
  const deleteModificationTemplate = async (templateId) => {
    try {
      await axiosInstance.delete(`/api/global-mods/templates/${templateId}`);
      await loadGlobalGallery(); // Reload gallery to update the list
      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Modification deleted successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: "Failed to delete modification",
        showConfirmButton: false,
        timer: 1500,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    }
  };

  // Delete category
  const deleteCategory = async (categoryId, mode = 'only') => {
    try {
      const url = `/api/global-mods/categories/${categoryId}${mode !== 'only' ? `?mode=${mode}` : ''}`;
      await axiosInstance.delete(url);

      // Reload both gallery and manufacturer categories to update the lists
      await loadGlobalGallery();
      await loadManufacturerCategories();

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Category deleted successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: error.response?.data?.message || "Failed to delete category",
        showConfirmButton: false,
        timer: 3000,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    }
  };

  // Move modification to different category
  const moveModification = async (templateId, newCategoryId) => {
    try {
      await axiosInstance.put(`/api/global-mods/templates/${templateId}`, {
        categoryId: newCategoryId
      });

      // Reload both gallery and manufacturer categories to update the lists
      await loadGlobalGallery();
      await loadManufacturerCategories();

      Swal.fire({
        toast: true,
        position: "top",
        icon: "success",
        title: "Modification moved successfully",
        showConfirmButton: false,
        timer: 1500,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    } catch (error) {
      console.error('Error moving modification:', error);
      Swal.fire({
        toast: true,
        position: "top",
        icon: "error",
        title: error.response?.data?.message || "Failed to move modification",
        showConfirmButton: false,
        timer: 3000,
        width: '350px',
        didOpen: (toast) => {
          toast.style.padding = '8px 12px';
          toast.style.fontSize = '14px';
          toast.style.minHeight = 'auto';
        }
      });
    }
  };

  // Build fieldsConfig from edit guided builder
  const buildEditFieldsConfig = () => {
    const fieldsConfig = {
      sliders: editGuidedBuilder.sliders,
      sideSelector: editGuidedBuilder.sideSelector,
      qtyRange: editGuidedBuilder.qtyRange,
      notes: editGuidedBuilder.notes,
      customerUpload: editGuidedBuilder.customerUpload,
      descriptions: editGuidedBuilder.descriptions,
      modSampleImage: editGuidedBuilder.modSampleImage
    };
    return fieldsConfig;
  };
  useEffect(() => {
    loadGlobalGallery();
  }, []);
  useEffect(() => {
    loadGlobalAssignments();
    loadManufacturerCategories(); // Load manufacturer-specific categories
    loadSubTypes(); // Load sub-types for this manufacturer
  }, [id]);

  const flatTemplates = React.useMemo(() => {
    const list = [];
    // Add only manufacturer-specific templates
    (manufacturerCategories || []).forEach(cat => (cat.templates || []).forEach(t => list.push({ ...t, categoryName: cat.name, isGlobal: false })));
    return list
      .filter(t => includeDraftTemplates || t.isReady)
      .sort((a, b) => (a.categoryName || '').localeCompare(b.categoryName) || a.name.localeCompare(b.name));
  }, [manufacturerCategories, includeDraftTemplates]);

  const openAssignGlobal = () => {
    setAssignFormGM({ templateId: '', scope: styleFilter ? 'style' : 'all', targetStyle: styleFilter || '', targetType: typeFilter || '', overridePrice: '' });
    setShowAssignGlobalModsModal(true);
  };

  // Transform fieldsConfig from template to guidedBuilder shape
  const makeGuidedFromFields = (fc) => {
    const base = {
      sliders: {
        height: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8','1/4','3/8','1/2','5/8','3/4','7/8'], label: 'Height' },
        width: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8','1/4','3/8','1/2','5/8','3/4','7/8'], label: 'Width' },
        depth: { enabled: false, min: 0, max: 0, step: 1, useCustomIncrements: false, customIncrements: ['1/8','1/4','3/8','1/2','5/8','3/4','7/8'], label: 'Depth' }
      },
      sideSelector: { enabled: false, options: ['L','R'], label: 'Side' },
      qtyRange: { enabled: false, min: 1, max: 10, label: 'Quantity' },
      notes: { enabled: false, placeholder: '', showInRed: true, label: 'Customer Notes' },
      customerUpload: { enabled: false, required: false, title: '', label: 'File Upload' },
      descriptions: { internal: '', customer: '', installer: '', both: false },
      modSampleImage: { enabled: false, label: 'Sample Image' }
    };
    if (!fc) return base;
    // sliders
    if (fc.sliders) {
      ['height','width','depth'].forEach(k => {
        if (fc.sliders[k]) {
          base.sliders[k].enabled = !!fc.sliders[k].enabled;
          base.sliders[k].min = Number(fc.sliders[k].min ?? 0);
          base.sliders[k].max = Number(fc.sliders[k].max ?? 0);
          base.sliders[k].step = Number(fc.sliders[k].step ?? 1);
          if (Array.isArray(fc.sliders[k].customIncrements) && fc.sliders[k].customIncrements.length > 0) {
            base.sliders[k].useCustomIncrements = true;
            base.sliders[k].customIncrements = fc.sliders[k].customIncrements;
          } else {
            base.sliders[k].useCustomIncrements = false;
          }
        }
      });
    }
    if (fc.sideSelector) {
      base.sideSelector.enabled = !!fc.sideSelector.enabled;
      base.sideSelector.options = Array.isArray(fc.sideSelector.options) && fc.sideSelector.options.length ? fc.sideSelector.options : ['L','R'];
    }
    if (fc.qtyRange) {
      base.qtyRange.enabled = !!fc.qtyRange.enabled;
      base.qtyRange.min = Number(fc.qtyRange.min ?? 1);
      base.qtyRange.max = Number(fc.qtyRange.max ?? 10);
    }
    if (fc.notes) {
      base.notes.enabled = !!fc.notes.enabled;
      base.notes.placeholder = fc.notes.placeholder || '';
      base.notes.showInRed = !!fc.notes.showInRed;
    }
    if (fc.customerUpload) {
      base.customerUpload.enabled = !!fc.customerUpload.enabled;
      base.customerUpload.required = !!fc.customerUpload.required;
      base.customerUpload.title = fc.customerUpload.title || '';
    }
    if (fc.descriptions) {
      base.descriptions.internal = fc.descriptions.internal || '';
      base.descriptions.customer = fc.descriptions.customer || '';
      base.descriptions.installer = fc.descriptions.installer || '';
      base.descriptions.both = !!fc.descriptions.both;
    }
    if (fc.modSampleImage) {
      base.modSampleImage.enabled = !!fc.modSampleImage.enabled;
    }
    return base;
  };

  const submitAssignGlobal = async () => {
    if (!assignFormGM.templateId) return;
    try {
      // Support applying to selected items
      if (assignFormGM.scope === 'item' && selectedItems.length > 0) {
        await Promise.all(selectedItems.map(catalogDataId => axiosInstance.post('/api/global-mods/assignments', {
          templateId: Number(assignFormGM.templateId),
          manufacturerId: id,
          scope: 'item',
          catalogDataId,
          overridePrice: assignFormGM.overridePrice === '' ? null : Number(assignFormGM.overridePrice)
        })));
      } else {
        await axiosInstance.post('/api/global-mods/assignments', {
          templateId: Number(assignFormGM.templateId),
          manufacturerId: id,
          scope: assignFormGM.scope,
          targetStyle: assignFormGM.scope === 'style' ? (assignFormGM.targetStyle || null) : null,
          targetType: assignFormGM.scope === 'type' ? (assignFormGM.targetType || null) : null,
          catalogDataId: assignFormGM.scope === 'item' ? (selectedCatalogItem?.id || null) : null,
          overridePrice: assignFormGM.overridePrice === '' ? null : Number(assignFormGM.overridePrice)
        });
      }
      await loadGlobalAssignments();
      setShowAssignGlobalModsModal(false);
      Swal.fire({ toast: true, position: 'top', icon: 'success', title: 'Assigned', showConfirmButton: false, timer: 1200 });
    } catch (e) {
      Swal.fire({ toast: true, position: 'top', icon: 'error', title: e.message || 'Assignment failed', showConfirmButton: false, timer: 1500 });
    }
  };

  const removeGlobalAssignment = async (assignmentId) => {
    try {
      await axiosInstance.delete(`/api/global-mods/assignments/${assignmentId}`);
      await loadGlobalAssignments();
    } catch (e) {
      // ignore
    }
  };

  const openItemGlobalMods = async (item) => {
    setSelectedCatalogItem(item);
    try {
      const { data } = await axiosInstance.get(`/api/global-mods/item/${item.id}`);
      setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : []);
    } catch (e) {
      setItemGlobalList([]);
    }
    setShowItemGlobalModsModal(true);
  };

  const suppressTemplateForItem = async (templateId, active) => {
    // active=false => create a suppression assignment; true => remove suppression if exists
    try {
      if (active === false) {
        await axiosInstance.post('/api/global-mods/assignments', { templateId, manufacturerId: id, scope: 'item', catalogDataId: selectedCatalogItem.id, isActive: false });
      } else {
        // find suppression assignment to delete (scope=item, isActive=false)
        const suppress = itemGlobalList.find(a => a.template?.id === templateId && a.scope === 'item' && a.isActive === false);
        if (suppress) await axiosInstance.delete(`/api/global-mods/assignments/${suppress.id}`);
      }
      const { data } = await axiosInstance.get(`/api/global-mods/item/${selectedCatalogItem.id}`);
      setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : []);
    } catch (e) {
      // ignore
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
      @media (max-width: 767px) {
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
        padding: 6px 10px !important;
        font-size: 12px !important;
        min-height: 44px;
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
              aria-label={t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.buttons.uploadCsv')}</span>
              <span className="d-sm-none">📁 CSV</span>
            </CButton>
            <CButton
              style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setManualModalVisible(true)}
              aria-label={t('settings.manufacturers.catalogMapping.buttons.addItem')}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.buttons.addItem')}</span>
              <span className="d-sm-none">{t('settings.manufacturers.catalogMapping.buttons.addShort', '➕ Add')}</span>
            </CButton>
            <CButton
              color="primary"
              size="sm"
              className="flex-shrink-0"
              onClick={() => setShowMainModificationModal(true)}
              title={t('settings.manufacturers.catalogMapping.actions.modificationManagementTitle')}
              aria-label={t('settings.manufacturers.catalogMapping.actions.modificationManagementTitle')}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.actions.modification')}</span>
              <span className="d-sm-none">🔧</span>
            </CButton>
            <CButton
              color="success"
              size="sm"
              className="flex-shrink-0"
              onClick={openAssignGlobal}
              title={t('settings.manufacturers.catalogMapping.actions.assignGlobalModsTitle')}
              aria-label={t('settings.manufacturers.catalogMapping.actions.assignGlobalModsTitle')}
            >
              <span className="d-none d-sm-inline">{t('settings.manufacturers.catalogMapping.actions.assignMods')}</span>
              <span className="d-sm-none">🧩</span>
            </CButton>
            <CButton
              color="warning"
              size="sm"
              className="flex-shrink-0"
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
              title={t('settings.manufacturers.catalogMapping.cleanupDuplicates.tooltip')}
              aria-label={t('settings.manufacturers.catalogMapping.cleanupDuplicates.tooltip')}
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
              aria-label={t('settings.manufacturers.catalogMapping.rollback.buttonText')}
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
            min-height: 44px;
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
            min-height: 44px;
            font-size: 0.875rem !important;
            padding: 0.5rem 0.75rem !important;
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
            min-height: 44px;
            font-size: 0.95rem;
          }

          /* Mobile card specific improvements */
          .mobile-catalog-card .card-body {
            padding: 0.75rem !important;
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
            font-size: 0.8rem !important;
            padding: 0.4rem 0.5rem !important;
            min-height: 44px;
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
            min-width: 44px;
            min-height: 44px;
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

      {/* Sub-Types Management Section */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">{t('settings.manufacturers.catalogMapping.subTypes.header')}</h6>
          <CButton
            color="primary"
            size="sm"
            onClick={() => {
              setSubTypeForm({ name: '', description: '', requires_hinge_side: false, requires_exposed_side: false });
              setEditingSubType(null);
              setShowSubTypeModal(true);
            }}
          >
            <Plus size={16} aria-hidden="true" className="me-1" /> {t('settings.manufacturers.catalogMapping.subTypes.create')}
          </CButton>
        </CCardHeader>
        <CCardBody>
          {subTypes.length === 0 ? (
            <p className="text-muted mb-0">{t('settings.manufacturers.catalogMapping.subTypes.empty')}</p>
          ) : (
            <div className="row g-3">
              {subTypes.map(subType => (
                <div key={subType.id} className="col-md-6 col-lg-4">
                  <CCard className="h-100">
                    <CCardBody>
                      <h6 className="card-title">{subType.name}</h6>
                      {subType.description && <p className="card-text small text-muted">{subType.description}</p>}
                      <div className="mb-2">
                        {subType.requires_hinge_side && (
                          <CBadge color="info" className="me-1">{t('settings.manufacturers.catalogMapping.subTypes.requiresHinge')}</CBadge>
                        )}
                        {subType.requires_exposed_side && (
                          <CBadge color="warning" className="me-1">{t('settings.manufacturers.catalogMapping.subTypes.requiresExposed')}</CBadge>
                        )}
                      </div>
                      <div className="d-flex gap-1 flex-wrap">
                        <CButton
                          color="primary"
                          size="sm"
                          onClick={() => {
                            setSubTypeForm({
                              name: subType.name,
                              description: subType.description || '',
                              requires_hinge_side: subType.requires_hinge_side,
                              requires_exposed_side: subType.requires_exposed_side
                            });
                            setEditingSubType(subType);
                            setShowSubTypeModal(true);
                          }}
                          aria-label={t('common.edit')}
                        >
                          {t('common.edit')}
                        </CButton>
                        <CButton
                          color="success"
                          size="sm"
                          onClick={() => {
                            setSelectedSubType(subType.id);
                            setShowAssignSubTypeModal(true);
                          }}
                          aria-label={t('settings.manufacturers.catalogMapping.subTypes.assignItems')}
                        >
                          {t('settings.manufacturers.catalogMapping.subTypes.assignItems')}
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => handleSubTypeDelete(subType)}
                          aria-label={t('common.delete')}
                        >
                          {t('common.delete')}
                        </CButton>
                      </div>
                    </CCardBody>
                  </CCard>
                </div>
              ))}
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* Mobile-Optimized Filters and Pagination */}
      <div className="row g-2 mb-3">
        {/* Items per page - Full width on mobile */}
        <div className="col-12 col-sm-6 col-lg-auto">
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto', minWidth: '60px' }}
              value={itemsPerPage}
              aria-label={t('settings.manufacturers.catalogMapping.pagination.itemsPerPage', 'Items per page')}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
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
              aria-label={t('settings.manufacturers.catalogMapping.search', 'Search styles')}
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
                aria-label={t('common.clearSearch', 'Clear search')}
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
            aria-label={t('settings.manufacturers.catalogMapping.filters.type', 'Filter by type')}
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
            aria-label={t('settings.manufacturers.catalogMapping.filters.style', 'Filter by style')}
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
                    role="button"
                    tabIndex={0}
                    aria-sort={sortBy === 'code' ? (sortOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}
                    aria-label={`${t('settings.manufacturers.catalogMapping.table.code')} ${sortBy === 'code' ? (sortOrder === 'ASC' ? t('common.sortAscending', 'ascending') : t('common.sortDescending', 'descending')) : t('common.sortable', 'sortable')}`}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort('code'); } }}
                  >
                    {t('settings.manufacturers.catalogMapping.table.code')}
                    {sortBy === 'code' && (
                      sortOrder === 'ASC' ? (
                        <ChevronUp size={16} aria-hidden="true" className="ms-1" />
                      ) : (
                        <ChevronDown size={16} aria-hidden="true" className="ms-1" />
                      )
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
                    aria-label={`${t('common.select', 'Select')} ${item.code || ''}`}
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
                      onClick={() => openItemGlobalMods(item)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#20c997',
                        borderColor: '#20c997',
                        color: '#fff',
                        minWidth: 'auto'
                      }}
                      title="Global Mods for item"
                    >
                      🧩
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

      {/* Assign Global Mods Modal */}
      <CModal visible={showAssignGlobalModsModal} onClose={() => setShowAssignGlobalModsModal(false)} size="lg">
  <PageHeader title={t('settings.manufacturers.catalogMapping.assign.header', 'Assign Global Modifications')} />
        <CModalBody>
          <div className="mb-3 d-flex align-items-center gap-2">
            <CFormCheck
              label="Include drafts"
              checked={includeDraftTemplates}
              onChange={(e) => setIncludeDraftTemplates(e.target.checked)}
            />
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <CFormLabel>Template</CFormLabel>
              <CFormSelect value={assignFormGM.templateId} onChange={e => setAssignFormGM(f => ({ ...f, templateId: e.target.value }))}>
                <option value="">Select template…</option>
                {flatTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.categoryName ? `[${t.categoryName}] ` : ''}{t.name}{t.defaultPrice != null ? ` — $${Number(t.defaultPrice).toFixed(2)}` : ' — blueprint'}</option>
                ))}
              </CFormSelect>
            </div>
            <div className="col-md-3">
              <CFormLabel>Scope</CFormLabel>
              <CFormSelect value={assignFormGM.scope} onChange={e => setAssignFormGM(f => ({ ...f, scope: e.target.value }))}>
                <option value="all">All</option>
                <option value="style">Style</option>
                <option value="type">Type</option>
                <option value="item">Selected items</option>
              </CFormSelect>
            </div>
            <div className="col-md-3">
              <CFormLabel>Override price</CFormLabel>
              <CFormInput type="number" value={assignFormGM.overridePrice} onChange={e => setAssignFormGM(f => ({ ...f, overridePrice: e.target.value }))} placeholder="optional" />
            </div>
          </div>
          {assignFormGM.scope === 'style' && (
            <div className="mt-3">
              <CFormLabel>Target style</CFormLabel>
              <CFormSelect value={assignFormGM.targetStyle} onChange={e => setAssignFormGM(f => ({ ...f, targetStyle: e.target.value }))}>
                <option value="">Select style…</option>
                {sortedUniqueStyles.map((s, i) => (<option key={i} value={s}>{s}</option>))}
              </CFormSelect>
            </div>
          )}
          {assignFormGM.scope === 'type' && (
            <div className="mt-3">
              <CFormLabel>Target type</CFormLabel>
              <CFormSelect value={assignFormGM.targetType} onChange={e => setAssignFormGM(f => ({ ...f, targetType: e.target.value }))}>
                <option value="">Select type…</option>
                {uniqueTypes.map((t, i) => (<option key={i} value={t}>{t}</option>))}
              </CFormSelect>
            </div>
          )}
          {assignFormGM.scope === 'item' && (
            <div className="mt-2 text-muted small">{selectedItems.length} selected item(s) will receive this assignment.</div>
          )}
          <hr />
          <div className="mt-2">
            <h6>Existing assignments</h6>
            {assignLoading ? (
              <div>Loading…</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Scope</th>
                      <th>Target</th>
                      <th>Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalAssignments.map(a => (
                      <tr key={a.id}>
                        <td>{a.template?.name}</td>
                        <td>{a.scope}</td>
                        <td>{a.scope === 'style' ? a.targetStyle : a.scope === 'type' ? a.targetType : a.scope === 'item' ? `Item ${a.catalogDataId}` : 'All'}</td>
                        <td>{a.overridePrice != null ? `$${Number(a.overridePrice).toFixed(2)}` : (a.template?.defaultPrice != null ? `$${Number(a.template.defaultPrice).toFixed(2)}` : '—')}</td>
                        <td>
                          <CButton color="danger" size="sm" onClick={() => removeGlobalAssignment(a.id)}>Remove</CButton>
                        </td>
                      </tr>
                    ))}
                    {globalAssignments.length === 0 && (
                      <tr><td colSpan="5" className="text-muted">No assignments</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowAssignGlobalModsModal(false)}>{t('common.cancel')}</CButton>
          <CButton style={{ backgroundColor: headerBg, color: textColor, borderColor: headerBg }} onClick={submitAssignGlobal} disabled={!assignFormGM.templateId}>Assign</CButton>
        </CModalFooter>
      </CModal>

      {/* Item Global Mods Modal */}
      <CModal visible={showItemGlobalModsModal} onClose={() => setShowItemGlobalModsModal(false)} size="lg">
        <PageHeader title={`Global Mods — ${selectedCatalogItem?.code || ''}`} />
        <CModalBody>
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Category</th>
                  <th>Scope</th>
                  <th>Price</th>
                  <th>Active</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itemGlobalList.map(a => (
                  <tr key={a.id}>
                    <td>{a.template?.name}</td>
                    <td>{a.template?.category?.name || '-'}</td>
                    <td>{a.scope}</td>
                    <td>{a.overridePrice != null ? `$${Number(a.overridePrice).toFixed(2)}` : (a.template?.defaultPrice != null ? `$${Number(a.template.defaultPrice).toFixed(2)}` : '—')}</td>
                    <td>{a.isActive === false ? 'Suppressed' : 'Active'}</td>
                    <td>
                      {a.scope === 'item' ? (
                        <CButton color="danger" size="sm" onClick={() => removeGlobalAssignment(a.id)}>Remove</CButton>
                      ) : (
                        a.isActive === false ? (
                          <CButton color="success" size="sm" onClick={() => suppressTemplateForItem(a.template?.id, true)}>Unsuppress</CButton>
                        ) : (
                          <CButton color="warning" size="sm" onClick={() => suppressTemplateForItem(a.template?.id, false)}>Suppress</CButton>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {itemGlobalList.length === 0 && (
                  <tr><td colSpan="6" className="text-muted">No global templates apply</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <hr />
          <div className="row g-3">
            <div className="col-md-6">
              <CFormLabel>Add template to this item</CFormLabel>
              <CFormSelect value={assignFormGM.templateId} onChange={e => setAssignFormGM(f => ({ ...f, templateId: e.target.value }))}>
                <option value="">Select template…</option>
                {flatTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.categoryName ? `[${t.categoryName}] ` : ''}{t.name}{t.defaultPrice != null ? ` — $${Number(t.defaultPrice).toFixed(2)}` : ' — blueprint'}</option>
                ))}
              </CFormSelect>
            </div>
            <div className="col-md-3">
              <CFormLabel>Override price</CFormLabel>
              <CFormInput type="number" value={assignFormGM.overridePrice} onChange={e => setAssignFormGM(f => ({ ...f, overridePrice: e.target.value }))} placeholder="optional" />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <CButton color="primary" disabled={!assignFormGM.templateId} onClick={async () => {
                try {
                  await axiosInstance.post('/api/global-mods/assignments', {
                    templateId: Number(assignFormGM.templateId),
                    manufacturerId: id,
                    scope: 'item',
                    catalogDataId: selectedCatalogItem.id,
                    overridePrice: assignFormGM.overridePrice === '' ? null : Number(assignFormGM.overridePrice)
                  });
                  const { data } = await axiosInstance.get(`/api/global-mods/item/${selectedCatalogItem.id}`);
                  setItemGlobalList(Array.isArray(data?.assignments) ? data.assignments : []);
                  setAssignFormGM(f => ({ ...f, templateId: '', overridePrice: '' }));
                } catch (e) {}
              }}>Add</CButton>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowItemGlobalModsModal(false)}>{t('common.close', 'Close')}</CButton>
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
  <PageHeader title={t('settings.manufacturers.catalogMapping.deleteStyle.modalTitle', { style: styleToDelete })} />
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
  <PageHeader title={t('settings.manufacturers.catalogMapping.deleteItem.modalTitle')} />
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
  <PageHeader title={t('settings.manufacturers.catalogMapping.bulk.deleteModalTitle')} />
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
  <PageHeader title={t('settings.manufacturers.catalogMapping.bulkEdit.header', { count: selectedItems.length })} />
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

      {/* Main Modification Management Modal */}
      <CModal visible={showMainModificationModal} onClose={() => setShowMainModificationModal(false)} size="xl">
        <PageHeader title={t('settings.manufacturers.catalogMapping.modManagement.title', 'Modification Management')} />
        <CModalBody>
          {modificationView === 'cards' && (
            <div>
              {/* Main Action Buttons */}
              <div className="d-flex gap-3 mb-4 justify-content-center">
                <CButton
                  color="primary"
                  size="lg"
                  onClick={() => { setEditingTemplateId(null); setSelectedModificationCategory(''); setNewTemplate(n=>({categoryId:'', name:'', defaultPrice:'', isReady:false, sampleImage:'', saveAsBlueprint:false})); setGuidedBuilder(makeGuidedFromFields(null)); setModificationView('addNew'); setModificationStep(1); }}
                >
                  {t('globalMods.ui.buttons.addModification', 'Add Modification')}
                </CButton>
                <CButton
                  color="info"
                  size="lg"
                  onClick={() => setModificationView('gallery')}
                >
                  {t('globalMods.ui.buttons.gallery', 'Gallery')}
                </CButton>
                <CButton
                  color="success"
                  size="lg"
                  onClick={() => setShowAssignGlobalModsModal(true)}
                >
                  {t('globalMods.ui.buttons.assignModification', 'Assign Modification')}
                </CButton>
              </div>

              {/* Existing Modification Cards */}
              <div className="row">
                {manufacturerCategories.map(category => (
                  <div key={category.id} className="col-md-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 d-flex align-items-center gap-2">
                          {category.image && (
                            <>
                              <img
                                src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${category.image}`}
                                alt={category.name}
                                width={24}
                                height={24}
                                style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #e9ecef' }}
                                onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }}
                              />
                              <CBadge color="info" title={t('globalMods.modal.gallery.categoryImageUploaded', 'Category image uploaded')}>{t('settings.manufacturers.catalogMapping.gallery.badges.img')}</CBadge>
                            </>
                          )}
                          {category.name}
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-secondary">{t('settings.manufacturers.catalogMapping.modManagement.modsCount', { count: category.templates?.length || 0 })}</span>
                          <CButton size="sm" color="warning" variant="outline" title={t('globalMods.category.editTooltip')}
                            onClick={() => { setEditCategory({ id: category.id, name: category.name || '', orderIndex: category.orderIndex || 0, image: category.image || '' }); setShowEditCategoryModal(true); }}>
                            ✏️ {t('common.edit')}
                          </CButton>
                          <CButton size="sm" color="danger" variant="outline" title={t('globalMods.category.deleteTooltip')}
                            onClick={() => { setCategoryToDelete(category); setShowDeleteCategoryModal(true); }}>
                            🗑️ {t('common.delete')}
                          </CButton>
                        </div>
                      </div>
                      <div className="card-body">
                        {category.templates?.length ? (
                          category.templates.map(template => (
                            <div key={template.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                              <div className="d-flex align-items-center gap-2">
                                {template.sampleImage && (
                                  <img
                                    src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}`}
                                    alt={template.name}
                                    width={32}
                                    height={32}
                                    style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #e9ecef' }}
                                    onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }}
                                  />
                                )}
                                <div>
                                  <strong>{template.name}</strong>
                                  {template.defaultPrice && <span className="text-muted"> - ${Number(template.defaultPrice).toFixed(2)}</span>}
                                  <div className="d-flex gap-1 mt-1">
                                    <CBadge color={template.isReady ? 'success' : 'warning'}>
                                      {template.isReady ? t('settings.manufacturers.catalogMapping.gallery.badges.ready') : t('settings.manufacturers.catalogMapping.gallery.badges.draft')}
                                    </CBadge>
                                    {template.sampleImage && (
                                      <CBadge color="info" title={t('settings.manufacturers.catalogMapping.gallery.tooltips.sampleUploaded')}>{t('settings.manufacturers.catalogMapping.gallery.badges.img')}</CBadge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-1">
                                <CButton
                                  size="sm"
                                  color="outline-primary"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.edit')}
                                  onClick={() => {
                                    // Preserve full state so PUT payload includes required fields
                                    setEditTemplate({
                                      id: template.id,
                                      categoryId: String(template.categoryId || ''),
                                      name: template.name || '',
                                      defaultPrice: template.defaultPrice !== null && template.defaultPrice !== undefined ? String(template.defaultPrice) : '',
                                      sampleImage: template.sampleImage || '',
                                      isReady: !!template.isReady,
                                      fieldsConfig: template.fieldsConfig || null,
                                    });
                                    // Load guided builder state from fieldsConfig
                                    setEditGuidedBuilder(makeGuidedFromFields(template.fieldsConfig));
                                    setShowQuickEditTemplateModal(true);
                                  }}
                                >
                                  ✏️
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-danger"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.delete')}
                                  onClick={() => {
                                    if (window.confirm(t('settings.manufacturers.catalogMapping.gallery.confirmDelete', { name: template.name }))) {
                                      deleteModificationTemplate(template.id);
                                    }
                                  }}
                                >
                                  🗑️
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-warning"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.move')}
                                  onClick={() => {
                                    setModificationToMove(template);
                                    setShowMoveModificationModal(true);
                                  }}
                                >
                                  📁
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-success"
                                  title={t('globalMods.modal.assign.title')}
                                  onClick={() => {
                                    setAssignFormGM(f => ({ ...f, templateId: template.id }));
                                    setShowAssignGlobalModsModal(true);
                                  }}
                                >
                                  🎯
                                </CButton>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">{t('settings.manufacturers.catalogMapping.gallery.emptyCategory')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {!manufacturerCategories.length && (
                  <div className="col-12 text-center">
                    <p className="text-muted">{t('settings.manufacturers.catalogMapping.modManagement.noCategories', { addLabel: t('globalMods.ui.buttons.addModification', 'Add Modification') })}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {modificationView === 'addNew' && (
            <div>
              {modificationStep === 1 && (
                <div>
          <h5>{t('globalMods.modal.add.step1Title')}</h5>
                  <div className="mb-3">
                    <CFormSelect
                      value={selectedModificationCategory}
                      onChange={e => setSelectedModificationCategory(e.target.value)}
                    >
            <option value="">{t('globalMods.modal.add.selectExisting')}</option>
                      {/* Show manufacturer categories only for manufacturer context */}
                      {manufacturerCategories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            <option value="new">{t('globalMods.modal.add.createNew')}</option>
                    </CFormSelect>
                  </div>

                  {selectedModificationCategory === 'new' && (
                    <div className="border rounded p-3 mb-3">
            <h6>{t('globalMods.modal.add.createNew')}</h6>
                      <div className="row">
                        <div className="col-md-8">
                          <CFormInput
              placeholder={t('globalMods.modal.add.newSubmenuName')}
                            value={newCategory.name}
                            onChange={e => setNewCategory(n => ({ ...n, name: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-4">
                          <CFormInput
                            type="number"
              placeholder={t('globalMods.modal.add.orderIndex')}
                            value={newCategory.orderIndex}
                            onChange={e => setNewCategory(n => ({ ...n, orderIndex: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <CButton color="secondary" onClick={() => setModificationView('cards')}>Back to Overview</CButton>
                    <CButton
                      color="primary"
                      onClick={() => setModificationStep(2)}
                      disabled={!selectedModificationCategory || (selectedModificationCategory === 'new' && !newCategory.name)}
                    >
                      Next: Template Builder
                    </CButton>
                  </div>
                </div>
              )}

              {modificationStep === 2 && (
                <div>
                  <h5>Step 2: Build Modification Template</h5>

                  {/* Default Required Fields */}
                  <div className="border rounded p-3 mb-3">
                    <h6>Required Fields</h6>
                    <div className="row">
                      <div className="col-md-6">
                        <CFormInput
                          placeholder="Modification name *"
                          value={newTemplate.name}
                          onChange={e => setNewTemplate(n => ({ ...n, name: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <CFormInput
                          type="number"
                          placeholder={newTemplate.saveAsBlueprint ? "Blueprints don't have prices" : "Default price *"}
                          value={newTemplate.saveAsBlueprint ? '' : newTemplate.defaultPrice}
                          onChange={e => setNewTemplate(n => ({ ...n, defaultPrice: e.target.value }))}
                          disabled={newTemplate.saveAsBlueprint}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Field Builder */}
                  <div className="border rounded p-3 mb-3">
                    <h6>Optional Field Builder (Building Blocks)</h6>

                    {/* Slider Controls */}
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Height Slider"
                              checked={guidedBuilder.sliders.height.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, enabled:e.target.checked}}}))}
                            />
                          </div>
                          {guidedBuilder.sliders.height.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Min height"
                                  value={guidedBuilder.sliders.height.min}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, min:e.target.value}}}))}
                                />
                              </div>
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Max height"
                                  value={guidedBuilder.sliders.height.max}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, max:e.target.value}}}))}
                                />
                              </div>
                              <CFormSelect
                                value={guidedBuilder.sliders.height.useCustomIncrements ? 'custom' : guidedBuilder.sliders.height.step}
                                onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}
                              >
                                <option value="1">1 inch increments</option>
                                <option value="0.5">0.5 inch increments</option>
                                <option value="0.25">0.25 inch increments</option>
                                <option value="custom">Custom fractions (1/8, 1/4, 3/8, etc.)</option>
                              </CFormSelect>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Width Slider"
                              checked={guidedBuilder.sliders.width.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, enabled:e.target.checked}}}))}
                            />
                          </div>
                          {guidedBuilder.sliders.width.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Min width"
                                  value={guidedBuilder.sliders.width.min}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, min:e.target.value}}}))}
                                />
                              </div>
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Max width"
                                  value={guidedBuilder.sliders.width.max}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, max:e.target.value}}}))}
                                />
                              </div>
                              <CFormSelect
                                value={guidedBuilder.sliders.width.useCustomIncrements ? 'custom' : guidedBuilder.sliders.width.step}
                                onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}
                              >
                                <option value="1">1 inch increments</option>
                                <option value="0.5">0.5 inch increments</option>
                                <option value="0.25">0.25 inch increments</option>
                                <option value="custom">Custom fractions (1/8, 1/4, 3/8, etc.)</option>
                              </CFormSelect>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Depth Slider"
                              checked={guidedBuilder.sliders.depth.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, enabled:e.target.checked}}}))}
                            />
                          </div>
                          {guidedBuilder.sliders.depth.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Min depth"
                                  value={guidedBuilder.sliders.depth.min}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, min:e.target.value}}}))}
                                />
                              </div>
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Max depth"
                                  value={guidedBuilder.sliders.depth.max}
                                  onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, max:e.target.value}}}))}
                                />
                              </div>
                              <CFormSelect
                                value={guidedBuilder.sliders.depth.useCustomIncrements ? 'custom' : guidedBuilder.sliders.depth.step}
                                onChange={e=>setGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, step:e.target.value==='custom'?1:e.target.value, useCustomIncrements:e.target.value==='custom'}}}))}
                              >
                                <option value="1">1 inch increments</option>
                                <option value="0.5">0.5 inch increments</option>
                                <option value="0.25">0.25 inch increments</option>
                                <option value="custom">Custom fractions (1/8, 1/4, 3/8, etc.)</option>
                              </CFormSelect>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Controls */}
                    <div className="row mb-3">
                      <div className="col-md-3">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Side Selector"
                              checked={guidedBuilder.sideSelector.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, sideSelector:{...g.sideSelector, enabled:e.target.checked}}))}
                            />
                          </div>
                          {guidedBuilder.sideSelector.enabled && (
                            <div className="card-body">
                              <small className="text-muted d-block mb-2">Limited to Left/Right options</small>
                              <CFormInput
                                placeholder="L,R"
                                value={guidedBuilder.sideSelector.options?.join(',')}
                                onChange={e=>setGuidedBuilder(g=>({...g, sideSelector:{...g.sideSelector, options:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))}
                                disabled
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Quantity Limits"
                              checked={guidedBuilder.qtyRange.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, enabled:e.target.checked}}))}
                            />
                          </div>
                          {guidedBuilder.qtyRange.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  type="number"
                                  placeholder="Min qty"
                                  value={guidedBuilder.qtyRange.min}
                                  onChange={e=>setGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, min:e.target.value}}))}
                                />
                              </div>
                              <CFormInput
                                type="number"
                                placeholder="Max qty"
                                value={guidedBuilder.qtyRange.max}
                                onChange={e=>setGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, max:e.target.value}}))}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Customer Notes"
                              checked={guidedBuilder.notes.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, notes:{...g.notes, enabled:e.target.checked}}))}
                            />
                          </div>
                          {guidedBuilder.notes.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  placeholder="Notes placeholder"
                                  value={guidedBuilder.notes.placeholder}
                                  onChange={e=>setGuidedBuilder(g=>({...g, notes:{...g.notes, placeholder:e.target.value}}))}
                                />
                              </div>
                              <CFormCheck
                                label="Show in red for customer warning"
                                checked={guidedBuilder.notes.showInRed}
                                onChange={e=>setGuidedBuilder(g=>({...g, notes:{...g.notes, showInRed:e.target.checked}}))}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label="Customer Upload"
                              checked={guidedBuilder.customerUpload.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, enabled:e.target.checked}}))}
                            />
                          </div>
                          {guidedBuilder.customerUpload.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormInput
                                  placeholder={t('settings.manufacturers.catalogMapping.builder.uploadTitlePh')}
                                  value={guidedBuilder.customerUpload.title}
                                  onChange={e=>setGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, title:e.target.value}}))}
                                />
                              </div>
                              <CFormCheck
                                label={t('settings.manufacturers.catalogMapping.builder.requiredUpload')}
                                checked={guidedBuilder.customerUpload.required}
                                onChange={e=>setGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, required:e.target.checked}}))}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description and Sample Image */}
                    <div className="row mb-3">
                      <div className="col-md-8">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="mb-0">{t('settings.manufacturers.catalogMapping.builder.descriptions.header')}</h6>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-4">
                                <CFormInput
                                  placeholder={t('settings.manufacturers.catalogMapping.builder.descriptions.internal')}
                                  value={guidedBuilder.descriptions.internal}
                                  onChange={e=>setGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, internal:e.target.value}}))}
                                />
                              </div>
                              <div className="col-md-4">
                                <CFormInput
                                  placeholder={t('settings.manufacturers.catalogMapping.builder.descriptions.customer')}
                                  value={guidedBuilder.descriptions.customer}
                                  onChange={e=>setGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, customer:e.target.value}}))}
                                />
                              </div>
                              <div className="col-md-4">
                                <CFormInput
                                  placeholder={t('settings.manufacturers.catalogMapping.builder.descriptions.installer')}
                                  value={guidedBuilder.descriptions.installer}
                                  onChange={e=>setGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, installer:e.target.value}}))}
                                />
                              </div>
                            </div>
                            <div className="mt-2">
                              <CFormCheck
                                label={t('settings.manufacturers.catalogMapping.builder.descriptions.showBoth')}
                                checked={guidedBuilder.descriptions.both}
                                onChange={e=>setGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, both:e.target.checked}}))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card">
                          <div className="card-header">
                            <CFormCheck
                              label={t('settings.manufacturers.catalogMapping.builder.sampleImage.label')}
                              checked={guidedBuilder.modSampleImage.enabled}
                              onChange={e=>setGuidedBuilder(g=>({...g, modSampleImage:{...g.modSampleImage, enabled:e.target.checked}}))}
                            />
                          </div>
                          {guidedBuilder.modSampleImage.enabled && (
                            <div className="card-body">
                              <div className="mb-2">
                                <CFormLabel>{t('settings.manufacturers.catalogMapping.builder.sampleImage.upload')}</CFormLabel>
                                <CFormInput type="file" accept="image/*" onChange={async (e)=>{
                                  const file = e.target.files?.[0];
                                  const fname = await uploadImageFile(file);
                                  if (fname) setNewTemplate(n=>({ ...n, sampleImage: fname }));
                                }} />
                              </div>
                              {newTemplate.sampleImage && (
                                <div className="p-2 bg-light border rounded" style={{ height: 200, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${newTemplate.sampleImage}`} alt={t('settings.manufacturers.catalogMapping.builder.sampleImage.alt')} style={{ maxHeight: '100%', maxWidth:'100%', objectFit:'contain' }} onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ready Checkbox */}
                    <div className="border-top pt-3">
                      <CFormCheck
                        label={t('settings.manufacturers.catalogMapping.builder.ready.markAsReady')}
                        checked={newTemplate.isReady}
                        onChange={e => setNewTemplate(n => ({ ...n, isReady: e.target.checked }))}
                      />
                      {/* Task 5: Blueprint checkbox for saving to gallery */}
                      <CFormCheck
                        label={t('settings.manufacturers.catalogMapping.builder.ready.saveAsBlueprint')}
                        checked={newTemplate.saveAsBlueprint}
                        onChange={e => setNewTemplate(n => ({ ...n, saveAsBlueprint: e.target.checked }))}
                        className="mt-2"
                      />
                      <small className="text-muted d-block mt-1">
                        {t('settings.manufacturers.catalogMapping.builder.ready.blueprintHint')}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <CButton color="secondary" onClick={() => setModificationStep(1)}>{t('settings.manufacturers.catalogMapping.builder.buttons.back')}</CButton>
                    <CButton color="secondary" onClick={() => setModificationView('cards')}>{t('settings.manufacturers.catalogMapping.builder.buttons.cancel')}</CButton>
                    {editingTemplateId ? (
                      <CButton
                        color="primary"
                        onClick={async () => {
                          setCreatingModification(true);
                          try {
                            let categoryIdToUse = selectedModificationCategory;
                            if (selectedModificationCategory === 'new') {
                              const newCat = await createModificationCategory();
                              categoryIdToUse = newCat.id;
                            }
                            await updateModificationTemplate(editingTemplateId, categoryIdToUse);
                            resetModificationForm();
                            Swal.fire({ toast: true, position: 'top', icon: 'success', title: t('settings.manufacturers.catalogMapping.builder.toast.updateSuccess'), showConfirmButton: false, timer: 1500 });
                          } catch (error) {
                            console.error('Error updating template:', error);
                            Swal.fire({ toast: true, position: 'top', icon: 'error', title: error.response?.data?.message || t('settings.manufacturers.catalogMapping.builder.toast.updateFailed'), showConfirmButton: false, timer: 1800 });
                          } finally {
                            setCreatingModification(false);
                          }
                        }}
                        disabled={!newTemplate.name || creatingModification}
                      >
                        {creatingModification ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t('common.saving')}
                          </>
                        ) : (
                          t('settings.manufacturers.catalogMapping.builder.buttons.saveChanges')
                        )}
                      </CButton>
                    ) : (
                      <CButton
                        color="primary"
                        onClick={async () => {
                          // Task 5: Block creation if manufacturerId is missing
                          if (!id) {
                            Swal.fire({
                              title: t('settings.manufacturers.catalogMapping.builder.toast.manufacturerMissingTitle'),
                              text: t('settings.manufacturers.catalogMapping.builder.toast.manufacturerMissingText'),
                              icon: 'error'
                            });
                            return;
                          }

                          setCreatingModification(true);
                          try {
                            let categoryIdToUse = selectedModificationCategory;

                            // Create new category if needed
                            if (selectedModificationCategory === 'new') {
                              const newCat = await createModificationCategory();
                              categoryIdToUse = newCat.id;
                            }

                            // Create the template
                            await createModificationTemplate(categoryIdToUse);

                            // Reset form and go back to cards view
                            resetModificationForm();

                            // Show success message
                            Swal.fire({
                              title: t('settings.manufacturers.catalogMapping.builder.toast.createSuccessTitle'),
                              text: t('settings.manufacturers.catalogMapping.builder.toast.createSuccessText'),
                              icon: 'success',
                              timer: 2000
                            });

                          } catch (error) {
                            console.error('Error creating template:', error);
                            Swal.fire({
                              title: t('settings.manufacturers.catalogMapping.builder.toast.createFailedTitle'),
                              text: error.response?.data?.message || t('settings.manufacturers.catalogMapping.builder.toast.createFailedText'),
                              icon: 'error'
                            });
                          } finally {
                            setCreatingModification(false);
                          }
                        }}
                        disabled={!newTemplate.name || !newTemplate.defaultPrice || creatingModification}
                      >
                        {creatingModification ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {t('common.creating')}
                          </>
                        ) : (
                          t('settings.manufacturers.catalogMapping.builder.buttons.create')
                        )}
                      </CButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {modificationView === 'gallery' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>{t('settings.manufacturers.catalogMapping.gallery.title')}</h5>
                <CButton color="secondary" onClick={() => setModificationView('cards')}>{t('settings.manufacturers.catalogMapping.gallery.back')}</CButton>
              </div>

              <div className="row">
                {globalGallery.map(category => (
                  <div key={category.id} className="col-md-6 mb-4">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">{category.name}</h6>
                        <div className="d-flex gap-2">
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            title={t('settings.manufacturers.catalogMapping.gallery.tooltips.deleteCategory')}
                            onClick={() => { setCategoryToDelete(category); setShowDeleteCategoryModal(true); }}
                          >
                            {t('settings.manufacturers.catalogMapping.gallery.actions.delete')}
                          </CButton>
                        </div>
                      </div>
                      <div className="card-body">
                        {category.templates?.length ? (
                          category.templates.map(template => (
                            <div key={template.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                              <div className="d-flex align-items-center gap-2">
                                {template.sampleImage && (
                                  <img
                                    src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${template.sampleImage}`}
                                    alt={template.name}
                                    width={32}
                                    height={32}
                                    style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #e9ecef' }}
                                    onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }}
                                  />
                                )}
                                <div>
                                  <strong>{template.name}</strong>
                                  {template.defaultPrice && <span className="text-muted"> - ${Number(template.defaultPrice).toFixed(2)}</span>}
                                  <div className="d-flex gap-1 mt-1">
                                    <CBadge color={template.isReady ? 'success' : 'warning'}>
                                      {template.isReady ? t('settings.manufacturers.catalogMapping.gallery.badges.ready') : t('settings.manufacturers.catalogMapping.gallery.badges.draft')}
                                    </CBadge>
                                    {template.sampleImage && (
                                      <CBadge color="info" title={t('settings.manufacturers.catalogMapping.gallery.tooltips.sampleUploaded')}>{t('settings.manufacturers.catalogMapping.gallery.badges.img')}</CBadge>
                                    )}
                                  </div>
                                  <div className="small text-muted">
                                    {template.fieldsConfig?.descriptions?.customer || t('settings.manufacturers.catalogMapping.gallery.noDescription')}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex gap-1 flex-wrap">
                                <CButton
                                  size="sm"
                                  color="outline-primary"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.edit')}
                                  onClick={() => {
                                    // Set up edit state
                                    setEditTemplate({
                                      id: template.id,
                                      categoryId: String(template.categoryId || ''),
                                      name: template.name || '',
                                      defaultPrice: template.defaultPrice !== null && template.defaultPrice !== undefined ? String(template.defaultPrice) : '',
                                      sampleImage: template.sampleImage || '',
                                      isReady: !!template.isReady,
                                      fieldsConfig: template.fieldsConfig || null,
                                    });
                                    setEditGuidedBuilder(makeGuidedFromFields(template.fieldsConfig));
                                    setShowQuickEditTemplateModal(true);
                                  }}
                                >
                                  ✏️
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-danger"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.delete')}
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${template.name}"? This will also remove all assignments of this modification.`)) {
                                      deleteModificationTemplate(template.id);
                                    }
                                  }}
                                >
                                  🗑️
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="outline-warning"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.move')}
                                  onClick={() => {
                                    setModificationToMove(template);
                                    setShowMoveModificationModal(true);
                                  }}
                                >
                                  {t('settings.manufacturers.catalogMapping.gallery.actions.move')}
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="primary"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.useAsBlueprint')}
                                  onClick={async () => {
                                    try {
                                      await axiosInstance.post('/api/global-mods/templates', {
                                        categoryId: template.categoryId || null,
                                        name: `${template.name} (Copy)`,
                                        defaultPrice: 0,
                                        isReady: false,
                                        fieldsConfig: template.fieldsConfig || {},
                                        sampleImage: template.sampleImage || null,
                                      });
                                      await loadGlobalGallery();
                                    } catch (e) {
                                      alert(e?.response?.data?.message || e.message);
                                    }
                                  }}
                                >
                                  📋
                                </CButton>
                                <CButton
                                  size="sm"
                                  color="success"
                                  title={t('settings.manufacturers.catalogMapping.gallery.tooltips.assignToManufacturer')}
                                  onClick={() => {
                                    // Assign this template
                                    setAssignFormGM(prev => ({...prev, templateId: template.id}));
                                    setShowAssignGlobalModsModal(true);
                                  }}
                                >
                                  🎯
                                </CButton>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">{t('settings.manufacturers.catalogMapping.gallery.emptyCategory')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowMainModificationModal(false)}>{t('common.close', 'Close')}</CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Category Modal */}
  <CModal visible={showEditCategoryModal} onClose={() => setShowEditCategoryModal(false)} size="lg">
    <PageHeader title={t('globalMods.modal.editCategory.title', 'Edit Category')} />
        <CModalBody>
          <div className="row g-3">
            <div className="col-md-6">
      <CFormLabel>{t('globalMods.modal.editCategory.nameLabel', 'Category Name')}</CFormLabel>
              <CFormInput value={editCategory.name} onChange={e=>setEditCategory(c=>({...c, name:e.target.value}))} />
            </div>
            <div className="col-md-6">
      <CFormLabel>{t('globalMods.modal.editCategory.orderLabel', 'Order')}</CFormLabel>
              <CFormInput type="number" value={editCategory.orderIndex} onChange={e=>setEditCategory(c=>({...c, orderIndex:e.target.value}))} />
            </div>
            <div className="col-12">
      <CFormLabel>{t('globalMods.modal.editCategory.imageLabel', 'Category Image')}</CFormLabel>
              <CFormInput type="file" accept="image/*" onChange={async (e)=>{
                const file = e.target.files?.[0];
                const fname = await uploadImageFile(file);
                if (fname) setEditCategory(c=>({...c, image: fname}));
              }} />
              {editCategory.image && (
                <div className="mt-2 p-2 bg-light border rounded" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editCategory.image}`} alt={t('globalMods.modal.editCategory.imageLabel', 'Category Image')} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }} />
                </div>
              )}
            </div>
          </div>
          <div className="d-flex gap-2 justify-content-end mt-3">
    <CButton color="secondary" onClick={() => setShowEditCategoryModal(false)}>{t('globalMods.modal.editCategory.cancel', 'Cancel')}</CButton>
            <CButton color="primary" onClick={async ()=>{
              if (!editCategory.id || !editCategory.name.trim()) return;
              await axiosInstance.put(`/api/global-mods/categories/${editCategory.id}`, {
                name: editCategory.name.trim(),
                orderIndex: Number(editCategory.orderIndex || 0),
                image: editCategory.image || null
              });
              setShowEditCategoryModal(false);
              await loadGlobalGallery();
    }}>{t('globalMods.modal.editCategory.save', 'Save')}</CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Delete Category Modal */}
  <CModal visible={showDeleteCategoryModal} onClose={() => setShowDeleteCategoryModal(false)}>
    <PageHeader title={t('globalMods.modal.deleteCategory.title', { name: categoryToDelete?.name || '' })} />
        <CModalBody>
          {categoryToDelete && (
            <>
      <p><strong>{t('globalMods.modal.deleteCategory.warning', '⚠️ Warning:')}</strong> {t('globalMods.modal.deleteCategory.aboutToDelete', { name: categoryToDelete.name })}</p>
              {categoryToDelete.templates?.length > 0 && (
                <div className="alert alert-warning">
      <strong>{t('globalMods.modal.deleteCategory.warning', '⚠️ Warning:')}</strong> {t('globalMods.modal.deleteCategory.contains', { count: categoryToDelete.templates.length })}
                  <div className="mt-2">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="deleteMode" id="deleteCancel" value="cancel" defaultChecked />
                      <label className="form-check-label" htmlFor="deleteCancel">
        {t('globalMods.modal.deleteCategory.cancel')}
                      </label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="deleteMode" id="deleteWithMods" value="withMods" />
                      <label className="form-check-label" htmlFor="deleteWithMods">
        {t('globalMods.modal.deleteCategory.deleteWithMods')}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="d-flex gap-2 justify-content-end mt-3">
    <CButton color="secondary" onClick={() => setShowDeleteCategoryModal(false)}>{t('globalMods.modal.deleteCategory.cancel', 'Cancel')}</CButton>
            <CButton color="danger" onClick={async () => {
              if (!categoryToDelete) return;

              let deleteMode = 'only'; // Default mode for empty categories
              if (categoryToDelete.templates?.length > 0) {
                const selectedMode = document.querySelector('input[name="deleteMode"]:checked')?.value;
                if (selectedMode === 'withMods') {
                  deleteMode = 'withMods';
                } else {
                  // User chose to cancel deletion
                  setShowDeleteCategoryModal(false);
                  return;
                }
              }

              await deleteCategory(categoryToDelete.id, deleteMode);
              setShowDeleteCategoryModal(false);
              setCategoryToDelete(null);
            }}>
              {t('globalMods.modal.deleteCategory.deleteOnly', 'Delete Category')}
            </CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Move Modification Modal */}
  <CModal visible={showMoveModificationModal} onClose={() => setShowMoveModificationModal(false)}>
    <PageHeader title={t('common.move', 'Move Modification')} />
        <CModalBody>
          {modificationToMove && (
            <>
      <p>{t('common.move', 'Move')} <strong>"{modificationToMove.name}"</strong> {t('common.to', 'to')} {t('common.whichCategory', 'which category?')}</p>
              <div className="mb-3">
        <label className="form-label">{t('globalMods.modal.deleteCategory.move.selectTarget', 'Select destination category')}</label>
                <select
                  className="form-select"
                  id="moveToCategory"
                  defaultValue={modificationToMove.categoryId || ''}
                >
      <option value="">{t('common.uncategorized', '-- Uncategorized --')}</option>
                  {/* Gallery categories */}
      <optgroup label={t('common.galleryCategories', 'Gallery Categories')}>
                    {globalGallery.map(cat => (
                      <option key={`gallery-${cat.id}`} value={cat.id}>
        {cat.name} ({t('common.gallery', 'Gallery')})
                      </option>
                    ))}
                  </optgroup>
                  {/* Manufacturer categories */}
      <optgroup label={t('common.manufacturerCategories', 'Manufacturer Categories')}>
                    {manufacturerCategories.map(cat => (
                      <option key={`mfg-${cat.id}`} value={cat.id}>
        {cat.name} ({t('common.manufacturer', 'Manufacturer')})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="alert alert-info">
                <small>
      <strong>{t('common.note', 'Note')}:</strong> {t('settings.manufacturers.catalogMapping.gallery.tooltips.move', 'Move to different category')}
                </small>
              </div>
            </>
          )}
          <div className="d-flex gap-2 justify-content-end mt-3">
    <CButton color="secondary" onClick={() => setShowMoveModificationModal(false)}>{t('common.cancel')}</CButton>
            <CButton color="primary" onClick={async () => {
              if (!modificationToMove) return;

              const newCategoryId = document.getElementById('moveToCategory').value;
              await moveModification(modificationToMove.id, newCategoryId || null);
              setShowMoveModificationModal(false);
              setModificationToMove(null);
    }}>
      {t('common.move', 'Move')}
            </CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Enhanced Edit Template Modal */}
      <CModal visible={showQuickEditTemplateModal} onClose={() => setShowQuickEditTemplateModal(false)} size="xl">
        <PageHeader title={t('globalMods.modal.editTemplate.title', 'Edit Modification')} />
        <CModalBody>
          {/* Basic Information */}
          <div className="border rounded p-3 mb-3">
            <h6>{t('common.basicInformation', 'Basic Information')}</h6>
            <div className="row g-3">
              <div className="col-md-6">
                <CFormLabel>{t('globalMods.modal.editTemplate.nameLabel', 'Name')}</CFormLabel>
                <CFormInput value={editTemplate.name} onChange={e=>setEditTemplate(t=>({...t, name:e.target.value}))} />
              </div>
              <div className="col-md-6">
                <CFormLabel>{t('globalMods.modal.editTemplate.priceLabel', 'Default Price')} {editTemplate.saveAsBlueprint && t('common.disabledForBlueprints', '(disabled for blueprints)')}</CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={editTemplate.saveAsBlueprint ? '' : editTemplate.defaultPrice}
                  onChange={e=>setEditTemplate(t=>({...t, defaultPrice:e.target.value}))}
                  disabled={editTemplate.saveAsBlueprint}
                  placeholder={editTemplate.saveAsBlueprint ? t('common.blueprintsNoPrice', "Blueprints don't have prices") : t('globalMods.template.defaultPricePlaceholder', 'Enter default price')}
                />
              </div>
              <div className="col-md-6">
                <CFormLabel>{t('globalMods.template.statusLabel', 'Status')}</CFormLabel>
                <CFormSelect value={editTemplate.isReady ? 'ready' : 'draft'} onChange={e=>setEditTemplate(t=>({...t, isReady: e.target.value === 'ready'}))}>
                  <option value="draft">{t('globalMods.template.status.draft', 'Draft')}</option>
                  <option value="ready">{t('globalMods.template.status.ready', 'Ready')}</option>
                </CFormSelect>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch mt-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showToBoth"
                    checked={editTemplate.showToBoth || false}
                    onChange={e=>setEditTemplate(t=>({...t, showToBoth: e.target.checked}))}
                  />
                  <label className="form-check-label" htmlFor="showToBoth">
                    {t('globalMods.builder.descriptions.customer', 'Customer description')} & {t('globalMods.builder.descriptions.installer', 'Installer description')} {t('common.showToBoth', 'shown to both')}
                  </label>
                </div>
              </div>
              <div className="col-12">
                <CFormLabel>{t('globalMods.modal.editTemplate.sampleUploadLabel', 'Sample Image')}</CFormLabel>
                <CFormInput type="file" accept="image/*" onChange={async (e)=>{
                  const file = e.target.files?.[0];
                  const fname = await uploadImageFile(file);
                  if (fname) setEditTemplate(t=>({...t, sampleImage: fname}));
                }} />
                {editTemplate.sampleImage && (
                  <div className="mt-2 p-2 bg-light border rounded" style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`${import.meta.env.VITE_API_URL || ''}/uploads/images/${editTemplate.sampleImage}`} alt={t('globalMods.modal.editTemplate.sampleAlt', 'Sample')} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} onError={(e)=>{ e.currentTarget.src='/images/nologo.png'; }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Field Configuration */}
          <div className="border rounded p-3 mb-3">
            <h6>{t('common.advancedFieldConfiguration', 'Advanced Field Configuration')}</h6>

            {/* Slider Controls */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.heightSlider', 'Height Slider')}
                      checked={editGuidedBuilder.sliders.height.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, enabled:e.target.checked}}}))}
                    />
                  </div>
                  {editGuidedBuilder.sliders.height.enabled && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.min', 'Min')} type="number" value={editGuidedBuilder.sliders.height.min} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, min:Number(e.target.value)||0}}}))} />
                        </div>
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.max', 'Max')} type="number" value={editGuidedBuilder.sliders.height.max} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, height:{...g.sliders.height, max:Number(e.target.value)||0}}}))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.widthSlider', 'Width Slider')}
                      checked={editGuidedBuilder.sliders.width.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, enabled:e.target.checked}}}))}
                    />
                  </div>
                  {editGuidedBuilder.sliders.width.enabled && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.min', 'Min')} type="number" value={editGuidedBuilder.sliders.width.min} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, min:Number(e.target.value)||0}}}))} />
                        </div>
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.max', 'Max')} type="number" value={editGuidedBuilder.sliders.width.max} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, width:{...g.sliders.width, max:Number(e.target.value)||0}}}))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.depthSlider', 'Depth Slider')}
                      checked={editGuidedBuilder.sliders.depth.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, enabled:e.target.checked}}}))}
                    />
                  </div>
                  {editGuidedBuilder.sliders.depth.enabled && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.min', 'Min')} type="number" value={editGuidedBuilder.sliders.depth.min} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, min:Number(e.target.value)||0}}}))} />
                        </div>
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.max', 'Max')} type="number" value={editGuidedBuilder.sliders.depth.max} onChange={e=>setEditGuidedBuilder(g=>({...g, sliders:{...g.sliders, depth:{...g.sliders.depth, max:Number(e.target.value)||0}}}))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Controls */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.sideSelector.label', 'Side Selector')}
                      checked={editGuidedBuilder.sideSelector.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, sideSelector:{...g.sideSelector, enabled:e.target.checked}}))}
                    />
                  </div>
                  {editGuidedBuilder.sideSelector.enabled && (
                    <div className="card-body">
                      <CFormInput
                        placeholder={t('globalMods.builder.sideSelector.placeholder', 'Options (comma-separated: L,R)')}
                        value={Array.isArray(editGuidedBuilder.sideSelector.options) ? editGuidedBuilder.sideSelector.options.join(',') : 'L,R'}
                        onChange={e=>setEditGuidedBuilder(g=>({...g, sideSelector:{...g.sideSelector, options:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}}))}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.quantityLimits.label', 'Quantity Range')}
                      checked={editGuidedBuilder.qtyRange.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, enabled:e.target.checked}}))}
                    />
                  </div>
                  {editGuidedBuilder.qtyRange.enabled && (
                    <div className="card-body">
                      <div className="row">
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.quantityLimits.minQty', 'Min qty')} type="number" value={editGuidedBuilder.qtyRange.min} onChange={e=>setEditGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, min:Number(e.target.value)||1}}))} />
                        </div>
                        <div className="col-6">
                          <CFormInput placeholder={t('globalMods.builder.quantityLimits.maxQty', 'Max qty')} type="number" value={editGuidedBuilder.qtyRange.max} onChange={e=>setEditGuidedBuilder(g=>({...g, qtyRange:{...g.qtyRange, max:Number(e.target.value)||10}}))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes and Upload Controls */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.customerNotes.label', 'Customer Notes Field')}
                      checked={editGuidedBuilder.notes.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, notes:{...g.notes, enabled:e.target.checked}}))}
                    />
                  </div>
                  {editGuidedBuilder.notes.enabled && (
                    <div className="card-body">
                      <CFormInput
                        placeholder={t('globalMods.builder.customerNotes.placeholder', 'Placeholder text')}
                        value={editGuidedBuilder.notes.placeholder}
                        onChange={e=>setEditGuidedBuilder(g=>({...g, notes:{...g.notes, placeholder:e.target.value}}))}
                      />
                      <CFormCheck
                        className="mt-2"
                        label={t('globalMods.builder.customerNotes.showInRed', 'Show in red')}
                        checked={editGuidedBuilder.notes.showInRed}
                        onChange={e=>setEditGuidedBuilder(g=>({...g, notes:{...g.notes, showInRed:e.target.checked}}))}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header">
                    <CFormCheck
                      label={t('globalMods.builder.customerUpload.label', 'Customer File Upload')}
                      checked={editGuidedBuilder.customerUpload.enabled}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, enabled:e.target.checked}}))}
                    />
                  </div>
                  {editGuidedBuilder.customerUpload.enabled && (
                    <div className="card-body">
                      <CFormInput
                        placeholder={t('globalMods.builder.customerUpload.titlePlaceholder', 'Upload title')}
                        value={editGuidedBuilder.customerUpload.title}
                        onChange={e=>setEditGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, title:e.target.value}}))}
                      />
                      <CFormCheck
                        className="mt-2"
                        label={t('globalMods.builder.customerUpload.required', 'Required')}
                        checked={editGuidedBuilder.customerUpload.required}
                        onChange={e=>setEditGuidedBuilder(g=>({...g, customerUpload:{...g.customerUpload, required:e.target.checked}}))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descriptions */}
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">{t('globalMods.builder.title', 'Guided Builder')}</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <CFormInput
                      placeholder={t('globalMods.builder.descriptions.internal', 'Internal description')}
                      value={editGuidedBuilder.descriptions.internal}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, internal:e.target.value}}))}
                    />
                  </div>
                  <div className="col-md-4">
                    <CFormInput
                      placeholder={t('globalMods.builder.descriptions.customer', 'Customer description')}
                      value={editGuidedBuilder.descriptions.customer}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, customer:e.target.value}}))}
                    />
                  </div>
                  <div className="col-md-4">
                    <CFormInput
                      placeholder={t('globalMods.builder.descriptions.installer', 'Installer description')}
                      value={editGuidedBuilder.descriptions.installer}
                      onChange={e=>setEditGuidedBuilder(g=>({...g, descriptions:{...g.descriptions, installer:e.target.value}}))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 justify-content-end mt-3">
            <CButton color="secondary" onClick={() => setShowQuickEditTemplateModal(false)}>{t('globalMods.modal.add.cancel', 'Cancel')}</CButton>
            <CButton color="primary" onClick={async ()=>{
              if (!editTemplate.id || !editTemplate.name.trim()) return;
              // Build fieldsConfig from edit guided builder
              const fieldsConfig = buildEditFieldsConfig();
              // Important: send full payload so server doesn't reset fields to null/false
              await axiosInstance.put(`/api/global-mods/templates/${editTemplate.id}`, {
                categoryId: editTemplate.categoryId ? Number(editTemplate.categoryId) : null,
                name: editTemplate.name.trim(),
                defaultPrice: editTemplate.defaultPrice ? Number(editTemplate.defaultPrice) : null,
                fieldsConfig,
                sampleImage: editTemplate.sampleImage || null,
                isReady: !!editTemplate.isReady,
              });
              setShowQuickEditTemplateModal(false);
              await loadGlobalGallery();
            }}>{t('globalMods.modal.editTemplate.saveChanges', 'Save Changes')}</CButton>
          </div>
        </CModalBody>
      </CModal>

      {/* Sub-Type Create/Edit Modal */}
      <CModal
        visible={showSubTypeModal}
        onClose={() => {
          setShowSubTypeModal(false);
          setSubTypeForm({ name: '', description: '', requires_hinge_side: false, requires_exposed_side: false });
          setEditingSubType(null);
        }}
        size="lg"
      >
        <PageHeader
          title={editingSubType ? t('settings.manufacturers.catalogMapping.subTypes.editTitle') : t('settings.manufacturers.catalogMapping.subTypes.create')}
          className="rounded-0 border-0"
          cardClassName="rounded-0 border-bottom"
        />
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel>{t('common.name', 'Name')} *</CFormLabel>
              <CFormInput
                value={subTypeForm.name}
                onChange={(e) => setSubTypeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('settings.manufacturers.catalogMapping.subTypes.namePlaceholder', 'e.g., Single Door Cabinets')}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>{t('common.description')}</CFormLabel>
              <CFormTextarea
                rows={3}
                value={subTypeForm.description}
                onChange={(e) => setSubTypeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('settings.manufacturers.catalogMapping.subTypes.descriptionPlaceholder', 'Optional description for this sub-type')}
              />
            </div>
            <div className="mb-3">
              <CFormCheck
                id="requiresHingeSide"
                label={t('settings.manufacturers.catalogMapping.subTypes.requiresHingeSelection')}
                checked={subTypeForm.requires_hinge_side}
                onChange={(e) => setSubTypeForm(prev => ({ ...prev, requires_hinge_side: e.target.checked }))}
              />
              <small className="text-muted">
                {t('settings.manufacturers.catalogMapping.subTypes.requiresHingeHelp')}
              </small>
            </div>
            <div className="mb-3">
              <CFormCheck
                id="requiresExposedSide"
                label={t('settings.manufacturers.catalogMapping.subTypes.requiresExposedSelection')}
                checked={subTypeForm.requires_exposed_side}
                onChange={(e) => setSubTypeForm(prev => ({ ...prev, requires_exposed_side: e.target.checked }))}
              />
              <small className="text-muted">
                {t('settings.manufacturers.catalogMapping.subTypes.requiresExposedHelp')}
              </small>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowSubTypeModal(false);
              setSubTypeForm({ name: '', description: '', requires_hinge_side: false, requires_exposed_side: false });
              setEditingSubType(null);
            }}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color="primary"
            onClick={handleSubTypeSave}
            disabled={!subTypeForm.name.trim()}
          >
            {editingSubType ? t('common.update', 'Update') : t('common.create', 'Create')} {t('settings.manufacturers.catalogMapping.subTypes.singular', 'Sub-Type')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Assign Items to Sub-Type Modal */}
      <CModal
        visible={showAssignSubTypeModal}
        onClose={() => {
          setShowAssignSubTypeModal(false);
          setSelectedSubType(null);
          setSelectedCatalogItem([]);
          setSelectedCatalogCodes([]);
        }}
        size="xl"
      >
        <PageHeader
          title={t('settings.manufacturers.catalogMapping.subTypes.assignModal.title', 'Assign Catalog Items to Sub-Type')}
          className="rounded-0 border-0"
          cardClassName="rounded-0 border-bottom"
        />
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>{t('settings.manufacturers.catalogMapping.subTypes.assignModal.selectLabel', 'Select catalog items to assign to this sub-type:')}</CFormLabel>
            <small className="d-block text-muted mb-3">
              {t('settings.manufacturers.catalogMapping.subTypes.assignModal.selectedSummary', { codes: selectedCatalogCodes.length, items: selectedCatalogItem.length })}
            </small>
          </div>

          <div className="table-responsive" style={{ maxHeight: '400px' }}>
            <CTable hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>
                    <CFormCheck
                      checked={selectedCatalogCodes.length === groupedCatalogData.length && groupedCatalogData.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all codes
                          const allCodes = groupedCatalogData.map(group => group.code);
                          const allItemIds = groupedCatalogData.flatMap(group => group.itemIds);
                          setSelectedCatalogCodes(allCodes);
                          setSelectedCatalogItem(allItemIds);
                        } else {
                          // Deselect all
                          setSelectedCatalogCodes([]);
                          setSelectedCatalogItem([]);
                        }
                      }}
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.code')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.description')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.type')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.assignModal.stylesHeader', 'Styles')}</CTableHeaderCell>
                  <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.subTypes.assignModal.itemsCount', 'Items Count')}</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {groupedCatalogData.map(group => (
                  <CTableRow key={group.code}>
                    <CTableDataCell>
                      <CFormCheck
                        checked={selectedCatalogCodes.includes(group.code)}
                        onChange={(e) => {
                          handleCodeSelection(group.code, e.target.checked);
                        }}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{group.code}</CTableDataCell>
                    <CTableDataCell>{group.description}</CTableDataCell>
                    <CTableDataCell>{group.type}</CTableDataCell>
                    <CTableDataCell>
                      <small className="text-muted">
                        {group.styles.slice(0, 3).join(', ')}
                        {group.styles.length > 3 && ` +${group.styles.length - 3} ${t('settings.manufacturers.catalogMapping.subTypes.assignModal.more', 'more')}`}
                      </small>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color="info">{group.itemIds.length}</CBadge>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowAssignSubTypeModal(false);
              setSelectedSubType(null);
              setSelectedCatalogItem([]);
              setSelectedCatalogCodes([]);
            }}
          >
            {t('common.cancel')}
          </CButton>
          <CButton
            color="primary"
            onClick={() => {
              if (selectedSubType && selectedCatalogItem.length > 0) {
                handleAssignToSubType();
                setShowAssignSubTypeModal(false);
                setSelectedSubType(null);
                setSelectedCatalogItem([]);
                setSelectedCatalogCodes([]);
              }
            }}
            disabled={selectedCatalogItem.length === 0}
          >
            {t('settings.manufacturers.catalogMapping.subTypes.assignModal.assignCTA', { count: selectedCatalogItem.length })}
          </CButton>
        </CModalFooter>
      </CModal>

    </div>
  );
};

export default CatalogMappingTab;
