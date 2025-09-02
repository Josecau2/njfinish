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
  CAlert,
  CContainer,
  CCard,
  CCardBody,
} from '@coreui/react';
import { useDispatch, useSelector } from 'react-redux';
import { decodeParam, buildEncodedPath } from '../../../utils/obfuscate';
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
import { FaCalendarAlt, FaPrint, FaEnvelope, FaFileContract, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ItemSelectionContentEdit from '../../../components/ItemSelectionContentEdit';
import FileUploadSection from '../CreateProposal/FileUploadSection';
import PrintProposalModal from '../../../components/model/PrintProposalModal';
import { hasPermission } from '../../../helpers/permissions';
import EmailProposalModal from '../../../components/model/EmailProposalModal';
import EmailContractModal from '../../../components/model/EmailContractModal';
import Loader from '../../../components/Loader';
import withContractorScope from '../../../components/withContractorScope';
import axiosInstance from '../../../helpers/axiosInstance';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/PageHeader';

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

const EditProposal = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const { id: rawId } = useParams();
  const id = decodeParam(rawId);
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
  const { t } = useTranslation();

  // Check if user can assign designers (admin only)
  const canAssignDesigner = hasPermission(loggedInUser, 'admin:users');

  // Check if user is a contractor (should not see manufacturer version names)
  const isUserContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor';
  const isAdmin = !!(loggedInUser?.role && String(loggedInUser.role).toLowerCase() === 'admin');
  const effectiveIsContractor = typeof isContractor === 'boolean' ? isContractor : !!isUserContractor;

  // Dynamic validation schema based on user permissions
  const validationSchema = Yup.object().shape({
    description: Yup.string().required('Description is required'),
    ...(canAssignDesigner && {
      designer: Yup.string().required('Designer is required'),
    }),
  });

  // Helper function to safely get manufacturersData as array
  const getManufacturersData = () => {
    const data = formData?.manufacturersData || [];
    return data;
  };  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    // followUp1Date: null,
    // followUp2Date: null,
    // followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '', // Added to match validationSchema
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // Derived view-only state
  const isAccepted = formData?.status === 'Proposal accepted' || formData?.status === 'accepted';
  const isLocked = !!formData?.is_locked;
  const isViewOnly = isLocked || (isAccepted && !isAdmin); // contractors view-only once accepted; locked is view-only for everyone

  // Wrapped setFormData that marks local edits
  const setFormDataWithEdits = (updater) => {
    setHasLocalEdits(true);
    setFormData(updater);
  };

  // Debug log for formData changes
  useEffect(() => {
  }, [formData]);
  // Fetch initial data
  useEffect(() => {
    axiosInstance
      .get(`/api/quotes/proposalByID/${id}`)
      .then((res) => {
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

        const processedData = {
          ...res.data,
          manufacturersData: parsedManufacturersData
        };

        setInitialData(processedData);
        setFormData(processedData || defaultFormData);
        setHasLocalEdits(false); // Reset local edits flag on initial load
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

    // Only fetch designers if user can assign them (admin only)
    if (canAssignDesigner) {
      fetchDesigners();
    }
  }, [canAssignDesigner]);

  // Update formData when initialData changes (but not if we have local edits)
  useEffect(() => {
    if (initialData && !hasLocalEdits) {
      setFormData(initialData);
    }
  }, [initialData, hasLocalEdits]);

  // Fetch manufacturers data (ensure manufacturer details are loaded)
  useEffect(() => {
    const manufacturersData = getManufacturersData();
    if (manufacturersData.length > 0) {
      manufacturersData.forEach((item) => {
        if (item.manufacturer && !manufacturersById[item.manufacturer]) {
          // Don't load full catalog data for proposal editing - only manufacturer info needed
          dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }));
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
  if (isContractor) return;
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
  if (isContractor) return;
    setCurrentDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
  if (isContractor) return;
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
  if (isContractor) return;
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
    sendToBackend({ ...formData, ...values }, 'update');
  };

  const handleSaveOrder = () => sendToBackend({ ...formData }, 'update');
  const handleAcceptOrder = () => sendToBackend({ ...formData, status: 'Proposal accepted' }, 'accept');
  const handleRejectOrder = () => sendToBackend({ ...formData, status: 'Proposal rejected' }, 'reject');

  const sendToBackend = async (finalData, action = 'update') => {
    try {
      // Client-side guards to avoid calling backend in view-only scenarios
      if (isLocked) {
        Swal.fire(t('common.warning', 'Warning'), t('proposals.lockedStatus.description'), 'warning');
        return;
      }
      if (!isAdmin && isAccepted && action !== 'update') {
        Swal.fire(t('common.warning', 'Warning'), t('proposals.lockedStatus.description'), 'info');
        return;
      }

      const payload = { action, formData: finalData };
      const response = await dispatch(sendFormDataToBackend(payload));
      if (response.payload?.success === true) {
        Swal.fire('Success!', 'Proposal saved successfully!', 'success');
        navigate('/quotes');
      } else if (response.error) {
        const msg = response.error.message || response.payload?.message || 'Failed to save proposal';
        if (/locked/i.test(msg)) {
          Swal.fire('Cannot Edit', t('proposals.lockedStatus.description'), 'warning');
        } else {
          Swal.fire('Error', msg, 'error');
        }
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message || 'Failed to save proposal';
      if (status === 403 && /locked/i.test(message)) {
        Swal.fire('Cannot Edit', t('proposals.lockedStatus.description'), 'warning');
      } else {
        Swal.fire('Error', message, 'error');
      }
    }
  };

  const renderActionButtons = () => {
    return (
      <div className="d-flex gap-2 flex-wrap justify-content-center justify-content-sm-end">
        <CButton
          className="shadow-sm px-4 fw-semibold d-flex align-items-center mobile-action-btn"
          style={{
            backgroundColor: hovered === 'print' ? '#218838' : '#28a745',
            color: '#fff',
            borderRadius: '8px',
            borderWidth: 0,
            borderStyle: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={() => setHovered('print')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => setShowPrintModal(true)}
        >
          <FaPrint className="me-2" />
          {t('proposals.create.actions.print')}
        </CButton>
        {!isUserContractor && (
          <>
            <CButton
              className="shadow-sm px-4 fw-semibold d-flex align-items-center mobile-action-btn"
              style={{
                backgroundColor: hovered === 'email' ? '#138496' : '#17a2b8',
                color: '#fff',
                borderRadius: '8px',
                borderWidth: 0,
                borderStyle: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={() => setHovered('email')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setShowEmailModal(true)}
            >
              <FaEnvelope className="me-2" />
              {t('proposals.create.actions.email')}
            </CButton>
            <CButton
              className="shadow-sm px-4 fw-semibold d-flex align-items-center mobile-action-btn"
              style={{
                backgroundColor: hovered === 'contract' ? '#e0a800' : '#ffc107',
                color: '#212529',
                borderRadius: '8px',
                borderWidth: 0,
                borderStyle: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={() => setHovered('contract')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setShowContractModal(true)}
            >
              <FaFileContract className="me-2" />
              {t('proposals.create.actions.contract')}
            </CButton>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }
  return (
    <CContainer fluid className="dashboard-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <PageHeader
        title={t('proposals.edit.title', 'Edit Proposal')}
        icon={FaCheckCircle}
        badges={[
          ...(isAccepted ? [{ text: t('proposals.lockedStatus.title'), variant: 'success' }] : []),
          ...(isLocked ? [{ text: 'Locked', variant: 'dark' }] : [])
        ]}
        rightContent={renderActionButtons()}
      />

        {/* Main Form Content */}
        <div className="mb-4">
          <Formik
            initialValues={initialData || defaultFormData}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, setValues }) => {
              // Sync Formik values FROM formData (single source of truth)
              useEffect(() => {
                try {
                  const a = JSON.stringify(values);
                  const b = JSON.stringify(formData);
                  if (a !== b) {
                    setValues(formData);
                  }
                } catch (e) {
                  // no-op
                }
              }, [formData]);

              return (
                <CForm onSubmit={handleSubmit} className="proposal-summary-form">
                  {/* Form Fields Card */}
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body p-4">
                      <CRow className="g-3">
                        {canAssignDesigner && (
                          <CCol xs={12} sm={6} lg={4}>
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
                        )}
                        <CCol xs={12} sm={6} lg={4}>
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
                        <CCol xs={12} sm={6} lg={4}>
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
                        <CCol xs={12} md={6} lg={4}>
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
                        <CCol xs={12} md={6} lg={4}>
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
                        <CCol xs={12} md={6} lg={4}>
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
                        {/* Follow up dates commented out
                        {!effectiveIsContractor && (
                          <>
                            <CCol xs={12} md={6} lg={4}>
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
                            <CCol xs={12} md={6} lg={4}>
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
                            <CCol xs={12} md={6} lg={4}>
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
                          </>
                        )}
                        */}
                      </CRow>
                    </div>
                  </div>

                  {!isUserContractor && (
                    <div className="proposal-version-badges">
                      {versionDetails.map((version, index) => {
                        const isSelected = index === selectedVersionIndex;
                        return (
                          <CBadge
                            key={index}
                            className="proposal-version-badge p-3 d-flex"
                            style={{
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              justifyContent: 'space-between',
                              backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                              color: isSelected ? '#d0e7ff' : '#084298',
                              boxShadow: isSelected
                                ? '0 0 8px 2px rgba(8, 66, 152, 0.6)'
                                : '0 1px 3px rgba(0, 0, 0, 0.1)',
                              borderRadius: '8px',
                              transition: 'all 0.3s ease',
                            }}
                            onClick={() => handleBadgeClick(index, version)}
                          >
                            <div>
                              {!isUserContractor && (
                                <strong style={{ display: 'block' }}>{version.versionName}</strong>
                              )}
                              <small
                                style={{
                                  fontSize: '0.7rem',
                                  color: isSelected ? '#a9c7ff' : '#4a6fa5',
                                }}
                              >
                                $ {version.manufacturerData?.costMultiplier || 'N/A'}
                              </small>
                            </div>
                            {!isUserContractor && (
                              <CDropdown onClick={(e) => e.stopPropagation()}>
                                <CDropdownToggle
                                  color="transparent"
                                  size="sm"
                                  style={{
                                    padding: '0 4px',
                                    color: isSelected ? '#d0e7ff' : '#084298',
                                    backgroundColor: 'transparent',
                                    borderWidth: 0,
                                    borderStyle: 'none',
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
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: '#e0e0e0',
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
                            )}
                          </CBadge>
                        );
                      })}
                    </div>
                  )}
                  {/* Tabs Section */}
                  <hr />
                  <CTabs>
                    <CNav variant="tabs" className="proposal-tabs border-0">
                      <CNavItem>
                        <CNavLink
                          active={activeTab === 'item'}
                          onClick={() => handleTabSelect('item')}
                          style={{
                            cursor: 'pointer',
                            borderWidth: 0,
                            borderStyle: 'none',
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
                    </CNav>
                  </CTabs>

                  {activeTab === 'item' && (
                    <div className="tab-content mt-4">
                      <ItemSelectionContentEdit
                        selectedVersion={selectedVersion}
                        formData={formData}
                        setFormData={setFormDataWithEdits}
                        setSelectedVersion={setSelectedVersion}
                        selectVersion={selectVersion}
                        readOnly={isViewOnly}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="proposal-actions">
                    <div className="d-flex justify-content-center align-items-center flex-wrap gap-3">
                      {isViewOnly ? (
                        <div className="w-100">
                          <CAlert color="success" className="text-center">
                            <h5 className="alert-heading mb-3">
                              <FaCheckCircle className="me-2" />
                              {t('proposals.lockedStatus.title')}
                            </h5>
                            <p className="mb-2">
                              {t('proposals.lockedStatus.description')}
                            </p>
                            <small className="text-muted">
                              {t('proposals.lockedStatus.processingNote')}
                            </small>
                          </CAlert>
                        </div>
                      ) : (
                        <>
                          <CButton
                            color="secondary"
                            variant="outline"
                            onClick={handleSaveOrder}
                            className="btn mobile-form-btn"
                          >
                            Save
                          </CButton>
                          <CButton
                            color="success"
                            onClick={handleAcceptOrder}
                            className="btn mobile-form-btn"
                            disabled={isAccepted}
                            title={isAccepted ? 'Already accepted' : undefined}
                          >
                            Accept and Order
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            onClick={handleRejectOrder}
                            className="btn mobile-form-btn"
                          >
                            Reject and Archive
                          </CButton>
                        </>
                      )}
                    </div>
                  </div>
                </CForm>
              );
            }}
          </Formik>
        </div>

        {/* Modals */}
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
      </CContainer>
  );
};

export default withContractorScope(EditProposal, 'proposals');