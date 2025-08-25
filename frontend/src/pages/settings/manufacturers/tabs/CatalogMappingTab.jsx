import React, { useState } from 'react';
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

  Swal.fire(t('common.success'), t('settings.manufacturers.catalogMapping.file.uploadSuccess'), "success");
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
      {/* Heading with Buttons aligned right */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">{t('settings.manufacturers.catalogMapping.title')}</h5>
        <div>
          <CButton
            color="primary"
            className="me-2"
            onClick={() => setFileModalVisible(true)}
          >
            {t('settings.manufacturers.catalogMapping.file.uploadCta')}
          </CButton>
          <CButton color="success" onClick={() => setManualModalVisible(true)}>
            {t('settings.manufacturers.catalogMapping.manual.uploadCta')}
          </CButton>
        </div>


      </div>
      <div className="d-flex  align-items-center mb-2">

        <div className="">
          <select
            className="form-select d-inline-block w-auto"
            value={itemsPerPage}
            onChange={(e) => {
              const value = Number(e.target.value);
              setItemsPerPage(value);
              localStorage.setItem('catalogItemsPerPage', value); // Save to localStorage
              setCurrentPage(1); // Reset to page 1
            }}
          >
            {[10, 25, 50, 100, 200].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>


        <div>
          {/* <strong>Filter by Type:</strong>{' '} */}
          <select
            className="form-select d-inline-block w-auto ms-2"
            value={typeFilter}
            onChange={(e) => {
              setCurrentPage(1); // Reset pagination on filter change
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
        </div>

        <div>
          <select
            className="form-select d-inline-block w-auto ms-2"
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
        </div>


      </div>

      {/* Table */}
  {catalogData.length === 0 ? (
    <p>{t('settings.manufacturers.catalogMapping.empty')}</p>
      ) : (
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.code')}</CTableHeaderCell>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.description')}</CTableHeaderCell>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.style')}</CTableHeaderCell>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.price')}</CTableHeaderCell>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.type')}</CTableHeaderCell>
      <CTableHeaderCell>{t('settings.manufacturers.catalogMapping.table.actions')}</CTableHeaderCell>


              {/* Add more if needed */}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {currentItems.map((item, index) => (
              <CTableRow key={index}>
                <CTableDataCell>{item.code}</CTableDataCell>
                <CTableDataCell>{item.description ? item.description : t('common.na')}</CTableDataCell>
                <CTableDataCell style={{ cursor: 'pointer' }} >
                  <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleShowStyleOnClick(item)}
                    className="me-2"
                  >
                    {item.style}

                  </CButton>
                </CTableDataCell>
                <CTableDataCell>{item.price}</CTableDataCell>
                <CTableDataCell>{item.type ? item.type : 'N/A'}</CTableDataCell>
                <CTableDataCell>
                  <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleEditClick(item)}
                    className="me-2"
                  >
                    {t('common.edit')}
                  </CButton>

                  <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleManageStyleClick(item)}
                    className="me-2"
                  >
                    {t('settings.manufacturers.catalogMapping.actions.manageStyle')}
                  </CButton>

                  <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleAssemblyCostClick(item)}
                    className="me-2"
                  >
                    {t('settings.manufacturers.catalogMapping.actions.assemblyCost')}

                  </CButton>

                  {/* <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleHingesDetailsClick(item)}
                    className="me-2"
                  >
                    Hinges

                  </CButton> */}


                  <CButton
                    size="sm"
                    color="primary"
                    onClick={() => handleModificationDetailsClick(item)}
                    className="me-2"
                  >
                    {t('settings.manufacturers.catalogMapping.actions.modification')}

                  </CButton>


                </CTableDataCell>

              </CTableRow>
            ))}
          </CTableBody>

        </CTable>
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





    </div>
  );
};

export default CatalogMappingTab;
