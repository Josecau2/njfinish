import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CButton,
  CCol,
  CForm,
  CFormInput,
  CRow,
  CTabs,
  CNav,
  CNavItem,
  CNavLink,
  CBadge,
  CFormLabel,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice';
import { setSelectVersionNewEdit } from '../../../store/slices/selectVersionNewEditSlice';
import { sendFormDataToBackend } from '../../../store/slices/proposalSlice';
import CreatableSelect from 'react-select/creatable';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CIcon from '@coreui/icons-react';
import { cilCopy, cilFile, cilList, cilOptions, cilPencil, cilTrash } from '@coreui/icons';
import { FaCalendarAlt, FaPrint, FaEnvelope, FaFileContract } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ItemSelectionContentEdit from '../../../components/ItemSelectionContentEdit';
import FileUploadSection from '../CreateProposal/FileUploadSection';
import PrintProposalModal from '../../../components/model/PrintProposalModal';
import EmailProposalModal from '../../../components/model/EmailProposalModal';
import EmailContractModal from '../../../components/model/EmailContractModal';
import Loader from '../../../components/Loader';
import axiosInstance from '../../../helpers/axiosInstance';


const validationSchema = Yup.object().shape({
  //   customerName: Yup.string().required('Customer name is required'),
  description: Yup.string().required('Description is required'),
  designer: Yup.string().required('Designer is required'),
});

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Follow up 1', value: 'Follow up 1' },
  { label: 'Follow up 2', value: 'Follow up 2' },
  { label: 'Follow up 3', value: 'Follow up 3' },
  { label: 'Measurement Scheduled', value: 'Measurement Scheduled' },
  { label: 'Measurement done', value: 'Measurement done' },
  { label: 'Design done', value: 'Design done' },
  { label: 'Proposal done', value: 'Proposal done' },
  { label: 'Proposal accepted', value: 'Proposal accepted' },
  { label: 'Proposal rejected', value: 'Proposal rejected' },
];

const EditProposal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('item');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null);
  const [editedVersionName, setEditedVersionName] = useState('');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [designerOptions, setDesignerOptions] = useState([]);
  const [manufacturersById, setManufacturersById] = useState([]);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser?.userId;
  const hasSetInitialVersion = useRef(false);

  // Helper function to safely get manufacturersData as array
  const getManufacturersData = () => {
    const data = Array.isArray(formData?.manufacturersData) ? formData.manufacturersData : [];
    console.log('getManufacturersData called, returning:', data);
    return data;
  };

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    followUp1Date: null,
    followUp2Date: null,
    followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '', // Added to match validationSchema
  };

  const [formData, setFormData] = useState(defaultFormData);
  
  // Debug log for formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
    console.log('ManufacturersData type:', typeof formData?.manufacturersData);
    console.log('ManufacturersData isArray:', Array.isArray(formData?.manufacturersData));
    console.log('ManufacturersData value:', formData?.manufacturersData);
  }, [formData]);
  // Fetch initial data
  useEffect(() => {
    axiosInstance
      .get(`/api/proposals/proposalByID/${id}`)
      .then((res) => {
        console.log('Raw proposal data:', res.data);
        
        // Parse manufacturersData if it's a string
        let parsedManufacturersData = res.data.manufacturersData;
        if (typeof parsedManufacturersData === 'string') {
          try {
            parsedManufacturersData = JSON.parse(parsedManufacturersData);
          } catch (error) {
            console.error('Error parsing manufacturersData:', error);
            parsedManufacturersData = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(parsedManufacturersData)) {
          parsedManufacturersData = [];
        }
        
        console.log('Parsed manufacturersData:', parsedManufacturersData);
        
        const processedData = {
          ...res.data,
          manufacturersData: parsedManufacturersData
        };
        
        setInitialData(processedData);
        setFormData(processedData || defaultFormData);
        setManufacturersById(parsedManufacturersData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching proposal:', err);
        setLoading(false);
      });
  }, [id]);


  // Fetch designers
  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const response = await axiosInstance.get('/api/designers');
        const designerData = response.data.users.map((designer) => ({
          value: designer.id,
          label: designer.name,
        }));
        setDesignerOptions(designerData);
      } catch (error) {
        console.error('Error fetching designers:', error);
      }
    };
    fetchDesigners();
  }, []);

  // Update formData when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Fetch manufacturers data
  useEffect(() => {
    const manufacturersData = getManufacturersData();
    
    if (manufacturersData.length > 0) {
      setSelectedVersionIndex(0);
      setSelectedVersion(manufacturersData);
      dispatch(setSelectVersionNewEdit(manufacturersData));

      manufacturersData.forEach((item) => {

        if (item.manufacturer && !manufacturersById[item.manufacturer]) {
          dispatch(fetchManufacturerById(item.manufacturer));

        }
      });
    }
  }, [formData?.manufacturersData, dispatch, manufacturersById]);

  useEffect(() => {
    const manufacturersData = getManufacturersData();
    
    if (manufacturersData.length === 0) {
      return;
    }

    const versionDetails = manufacturersData.map((item) => ({
      ...item,
      manufacturerData: manufacturersById[item.manufacturer],
    }));

    if (
      versionDetails.length > 0 &&
      selectedVersionIndex === null &&
      !hasSetInitialVersion.current
    ) {
      setSelectedVersionIndex(0);
      setSelectedVersion(versionDetails[0]);
      hasSetInitialVersion.current = true;
      dispatch(setSelectVersionNewEdit(versionDetails[0]));
    }
  }, [formData.manufacturersData, manufacturersById, selectedVersionIndex, dispatch]);

  // Update selected version in Redux
  useEffect(() => {
    if (selectedVersion) {
      dispatch(setSelectVersionNewEdit(selectedVersion));
    }
  }, [selectedVersion, dispatch]);

  const updateFormData = (updatedFields) => {
    setFormData((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const handleBadgeClick = (index, version) => {
    // setSelectedVersionIndex(index);
    // setSelectedVersion(version);
    // dispatch(setSelectVersionNewEdit(version));
  };

  const handleTabSelect = (tabName) => {
    setActiveTab(tabName);
  };

  const openEditModal = (index) => {
    setCurrentEditIndex(index);
    setEditedVersionName(versionDetails[index].versionName);
    setEditModalOpen(true);
  };

  const saveEditVersionName = () => {
    const manufacturersData = getManufacturersData();
    
    const existingEntry = manufacturersData.find(
      (entry, idx) => entry.versionName === editedVersionName && idx !== currentEditIndex
    );
    if (existingEntry) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Version Name',
        text: `Manufacturer Version "${editedVersionName}" already exists.`,
      });
      return;
    }
    
    const updatedManufacturersData = [...getManufacturersData()];
    if (updatedManufacturersData[currentEditIndex]) {
      updatedManufacturersData[currentEditIndex].versionName = editedVersionName;
      updateFormData({ manufacturersData: updatedManufacturersData });
    }
    setEditModalOpen(false);
  };

  const openDeleteModal = (index) => {
    setCurrentDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const manufacturersData = getManufacturersData();
    
    const updatedManufacturersData = manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex
    );
    updateFormData({ manufacturersData: updatedManufacturersData });

    if (currentDeleteIndex === selectedVersionIndex) {
      setSelectedVersionIndex(null);
      setSelectedVersion(null);
    } else if (currentDeleteIndex < selectedVersionIndex) {
      setSelectedVersionIndex(selectedVersionIndex - 1);
    }

    setDeleteModalOpen(false);
  };

  const duplicateVersion = (index) => {
    const manufacturersData = getManufacturersData();
    
    if (!manufacturersData[index]) {
      return;
    }
    
    const copy = { ...manufacturersData[index] };
    copy.versionName = `Copy of ${copy.versionName}`;
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] });
  };

  const versionDetails = getManufacturersData().map((item) => ({
    ...item,
    manufacturerData: manufacturersById[item.manufacturer],
  }));

  const selectVersion = versionDetails[selectedVersionIndex] || null;

  const handleSubmit = (values) => {
    sendToBackend({ ...formData, ...values });
  };

  const handleSaveOrder = () => sendToBackend({ ...formData, type: '0' });
  const handleAcceptOrder = () => sendToBackend({ ...formData, type: '1' });
  const handleRejectOrder = () => sendToBackend({ ...formData, type: '2' });

  const sendToBackend = async (finalData) => {
    try {
      const payload = { formData: finalData };
      const response = await dispatch(sendFormDataToBackend(payload));
      if (response.payload.success === true) {
        Swal.fire('Success!', 'Proposal saved successfully!', 'success');
        navigate('/proposals');
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
      Swal.fire('Error!', 'Failed to save proposal.', 'error');
    }
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <>
      <div className="header py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap">
        <h4 className="text-muted m-0">Edit Proposal</h4>
        <div className="d-flex gap-2 flex-wrap">
          <div
            className="px-3 py-2 rounded d-flex align-items-center"
            style={{
              backgroundColor: hovered === 'print' ? '#218838' : '#28a745',
              color: '#fff',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onMouseEnter={() => setHovered('print')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setShowPrintModal(true)}
          >
            <FaPrint className="me-2" />
            Print Proposal
          </div>
          <div
            className="px-3 py-2 rounded d-flex align-items-center"
            style={{
              backgroundColor: hovered === 'email' ? '#138496' : '#17a2b8',
              color: '#fff',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onMouseEnter={() => setHovered('email')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setShowEmailModal(true)}
          >
            <FaEnvelope className="me-2" />
            Email Proposal
          </div>
          <div
            className="px-3 py-2 rounded d-flex align-items-center"
            style={{
              backgroundColor: hovered === 'contract' ? '#e0a800' : '#ffc107',
              color: '#212529',
              cursor: 'pointer',
              transition: '0.2s',
            }}
            onMouseEnter={() => setHovered('contract')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setShowContractModal(true)}
          >
            <FaFileContract className="me-2" />
            Email Contract
          </div>
        </div>
      </div>

      <div>
        <Formik
          initialValues={initialData || defaultFormData}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => {
            // Sync formData with Formik's values
            useEffect(() => {
              // Prevent feedback loop: only update when values actually differ from formData
              try {
                const a = JSON.stringify(values);
                const b = JSON.stringify(formData);
                if (a !== b) {
                  updateFormData(values);
                }
              } catch (e) {
                // Fallback: if comparison fails, avoid updating to prevent loops
              }
            }, [values, formData]);

            return (
              <CForm onSubmit={handleSubmit}>
                <CRow>

                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="designer">Designer *</CFormLabel>
                    <CreatableSelect
                      isClearable
                      id="designer"
                      name="designer"
                      options={designerOptions}
                      value={designerOptions.find((opt) => opt.value === values.designer) || null}
                      onChange={(selectedOption) => {
                        setFieldValue('designer', selectedOption?.value || '');
                      }}
                      onBlur={handleBlur}
                    />
                    {errors.designer && touched.designer && (
                      <div className="text-danger small mt-1">{errors.designer}</div>
                    )}
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="description">Description *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="description"
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Description"
                    />
                    {errors.description && touched.description && (
                      <div className="text-danger small mt-1">{errors.description}</div>
                    )}
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="status">Status</CFormLabel>
                    <CreatableSelect
                      isClearable
                      options={statusOptions}
                      value={statusOptions.find((opt) => opt.value === (values.status || 'Draft'))}
                      onChange={(selectedOption) => {
                        setFieldValue('status', selectedOption?.value || 'Draft');
                      }}
                      onBlur={handleBlur}
                      inputId="status"
                    />
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="date">Date</CFormLabel>
                      <DatePicker
                        id="date"
                        selected={values.date ? new Date(values.date) : new Date()}
                        onChange={(date) => setFieldValue('date', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText="Date"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="designDate">Design Date</CFormLabel>
                      <DatePicker
                        id="designDate"
                        selected={values.designDate ? new Date(values.designDate) : null}
                        onChange={(date) => setFieldValue('designDate', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText="Design Date"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="measurementDate">Measurement Date</CFormLabel>
                      <DatePicker
                        id="measurementDate"
                        selected={values.measurementDate ? new Date(values.measurementDate) : null}
                        onChange={(date) => setFieldValue('measurementDate', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText="Measurement Date"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="followUp1Date">Follow up 1 Date</CFormLabel>
                      <DatePicker
                        id="followUp1Date"
                        selected={values.followUp1Date ? new Date(values.followUp1Date) : null}
                        onChange={(date) => setFieldValue('followUp1Date', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Follow up 1 Date"
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="followUp2Date">Follow up 2 Date</CFormLabel>
                      <DatePicker
                        id="followUp2Date"
                        selected={values.followUp2Date ? new Date(values.followUp2Date) : null}
                        onChange={(date) => setFieldValue('followUp2Date', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Follow up 2 Date"
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="followUp3Date">Follow up 3 Date</CFormLabel>
                      <DatePicker
                        id="followUp3Date"
                        selected={values.followUp3Date ? new Date(values.followUp3Date) : null}
                        onChange={(date) => setFieldValue('followUp3Date', date)}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Follow up 3 Date"
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-4 mt-5 d-flex flex-wrap gap-4">
                  {versionDetails.map((version, index) => {
                    const isSelected = index === selectedVersionIndex;
                    return (
                      <CBadge
                        key={index}
                        className="p-2 d-flex"
                        style={{
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          minWidth: '190px',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                          color: isSelected ? '#d0e7ff' : '#084298',
                          boxShadow: isSelected
                            ? '0 0 8px 2px rgba(8, 66, 152, 0.6)'
                            : '0 1px 3px rgba(0, 0, 0, 0.1)',
                          borderRadius: '5px',
                          transition: 'all 0.3s ease',
                        }}
                        onClick={() => handleBadgeClick(index, version)}
                      >
                        <div>
                          <strong style={{ display: 'block' }}>{version.versionName}</strong>
                          <small
                            style={{
                              fontSize: '0.7rem',
                              color: isSelected ? '#a9c7ff' : '#4a6fa5',
                            }}
                          >
                            $ {version.manufacturerData?.costMultiplier || 'N/A'}
                          </small>
                        </div>
                        <CDropdown onClick={(e) => e.stopPropagation()}>
                          <CDropdownToggle
                            color="transparent"
                            size="sm"
                            style={{
                              padding: '0 4px',
                              color: isSelected ? '#d0e7ff' : '#084298',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <CIcon icon={cilOptions} />
                          </CDropdownToggle>
                          <CDropdownMenu
                            style={{
                              minWidth: '120px',
                              border: '1px solid #e0e0e0',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              borderRadius: '4px',
                              padding: '4px 0',
                            }}
                          >
                            <CDropdownItem
                              onClick={() => openEditModal(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#333',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <CIcon icon={cilPencil} className="me-2" /> Edit
                            </CDropdownItem>
                            <CDropdownItem
                              onClick={() => openDeleteModal(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#dc3545',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <CIcon icon={cilTrash} className="me-2" /> Delete
                            </CDropdownItem>
                            <CDropdownItem
                              onClick={() => duplicateVersion(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#333',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <CIcon icon={cilCopy} className="me-2" /> Duplicate
                            </CDropdownItem>
                          </CDropdownMenu>
                        </CDropdown>
                      </CBadge>
                    );
                  })}
                </div>

                <hr />

                <CTabs>
                  <CNav variant="tabs" className="border-0">
                    <CNavItem>
                      <CNavLink
                        active={activeTab === 'item'}
                        onClick={() => handleTabSelect('item')}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '10px 20px',
                          fontWeight: 600,
                          color: activeTab === 'item' ? '#084298' : '#6c757d',
                          backgroundColor: activeTab === 'item' ? 'rgba(8, 66, 152, 0.1)' : 'transparent',
                          borderBottom: activeTab === 'item' ? '3px solid #084298' : 'none',
                          transition: 'all 0.3s ease',
                          borderRadius: '4px 4px 0 0',
                          marginRight: '4px',
                        }}
                      >
                        <span className="d-flex align-items-center">
                          <CIcon icon={cilList} className="me-2" />
                          Items
                        </span>
                      </CNavLink>
                    </CNavItem>
                    <CNavItem>
                      {/* <CNavLink
                        active={activeTab === 'file'}
                        onClick={() => handleTabSelect('file')}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          padding: '10px 20px',
                          fontWeight: 600,
                          color: activeTab === 'file' ? '#084298' : '#6c757d',
                          backgroundColor: activeTab === 'file' ? 'rgba(8, 66, 152, 0.1)' : 'transparent',
                          borderBottom: activeTab === 'file' ? '3px solid #084298' : 'none',
                          transition: 'all 0.3s ease',
                          borderRadius: '4px 4px 0 0',
                        }}
                      >
                        <span className="d-flex align-items-center">
                          <CIcon icon={cilFile} className="me-2" />
                          Files
                        </span>
                      </CNavLink> */}
                    </CNavItem>
                  </CNav>
                </CTabs>

                {activeTab === 'item' && (
                  <div className="tab-content mt-5">
                    <ItemSelectionContentEdit
                      selectedVersion={selectedVersion}
                      formData={formData}
                      setFormData={setFormData}
                      setSelectedVersion={setSelectedVersion}
                      selectVersion={selectVersion}
                    />
                  </div>
                )}

                {activeTab === 'file' && (
                  <div className="tab-content mt-5">
                    <h5>File Upload Section</h5>
                    <p>This section allows users to upload or manage files.</p>
                    <FileUploadSection
                      proposalId={formData.id}
                      onFilesChange={(files) => updateFormData({ files })}
                    />
                  </div>
                )}

                <hr />
                <div
                  className="d-flex justify-content-center align-items-center flex-wrap gap-3 p-3"
                  style={{ maxWidth: '600px', margin: '0 auto' }}
                >
                  <CButton
                    color="secondary"
                    variant="outline"
                    onClick={handleSaveOrder}
                    style={{ minWidth: '140px' }}
                  >
                    Save
                  </CButton>
                  <CButton
                    color="success"
                    onClick={handleAcceptOrder}
                    style={{ minWidth: '140px' }}
                  >
                    Accept and Order
                  </CButton>
                  <CButton
                    color="danger"
                    variant="outline"
                    onClick={handleRejectOrder}
                    style={{ minWidth: '140px' }}
                  >
                    Reject and Archive
                  </CButton>
                </div>
              </CForm>
            );
          }}
        </Formik>
      </div>

      <PrintProposalModal show={showPrintModal} onClose={() => setShowPrintModal(false)} formData={formData} />
      <EmailProposalModal show={showEmailModal} onClose={() => setShowEmailModal(false)} formData={formData} />
      <EmailContractModal show={showContractModal} onClose={() => setShowContractModal(false)} />

      <CModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        alignment="center"
        backdrop="static"
        className="modal-lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>Edit Version Name</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            className="mb-3"
            value={editedVersionName}
            onChange={(e) => setEditedVersionName(e.target.value)}
            placeholder="Version Name"
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModalOpen(false)}>
            Cancel
          </CButton>
          <CButton color="primary" onClick={saveEditVersionName}>
            Save
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        alignment="center"
        backdrop="static"
        className="modal-sm"
      >
        <CModalHeader closeButton>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>Are you sure you want to delete this version?</CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EditProposal;