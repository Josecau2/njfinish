import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  CButton, CCol, CForm, CFormInput, CRow,
  CTabs, CNav, CNavItem, CNavLink, CBadge,
  CFormLabel, CDropdown, CDropdownToggle,
  CDropdownMenu, CDropdownItem, CModal,
  CModalHeader, CModalTitle, CModalBody,
  CModalFooter,
} from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice';
import { sendFormDataToBackend } from '../../../store/slices/proposalSlice';
import CreatableSelect from 'react-select/creatable';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CIcon from '@coreui/icons-react';
import { cilCopy, cilFile, cilList, cilOptions, cilPencil, cilTrash } from '@coreui/icons';
import { FaCalendarAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ItemSelectionContent from '../../../components/ItemSelectionContent';
import FileUploadSection from './FileUploadSection';
import { setSelectVersionNew } from '../../../store/slices/selectVersionNewSlice';


const ItemSelectionStep = ({ setFormData, formData, updateFormData, setCurrentStep, setBackStep, sendToBackend, prevStep, hideBack }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required(t('proposals.create.customerInfo.validation.customerName')),
    description: Yup.string().required(t('proposals.create.customerInfo.validation.description')),
    designer: Yup.string().required(t('proposals.create.customerInfo.validation.designer')),
  });

  const statusOptions = [
    { label: t('proposals.status.draft'), value: 'Draft' },
    { label: t('proposals.status.followUp1'), value: 'Follow up 1' },
    { label: t('proposals.status.followUp2'), value: 'Follow up 2' },
    { label: t('proposals.status.followUp3'), value: 'Follow up 3' },
    { label: t('proposals.status.measurementScheduled'), value: 'Measurement Scheduled' },
    { label: t('proposals.status.measurementDone'), value: 'Measurement done' },
    { label: t('proposals.status.designDone'), value: 'Design done' },
    { label: t('proposals.status.proposalAccepted'), value: 'Proposal accepted' },
    { label: t('proposals.status.proposalRejected'), value: 'Proposal rejected' },
  ];

  const [activeTab, setActiveTab] = useState("item");
  const { list: users } = useSelector((state) => state.users);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser.userId;

  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor';

  const manufacturersById = useSelector((state) => state.manufacturers.byId);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null);
  const [editedVersionName, setEditedVersionName] = useState('');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index);
    setSelectedVersion(version);
  }

  useEffect(() => {
    // Mirror the currently selected version into Redux only when it changes meaningfully
    if (selectedVersion && typeof selectedVersion === 'object') {
      dispatch(setSelectVersionNew(selectedVersion));
    }
  }, [selectedVersion?.versionName, selectedVersion?.manufacturer, dispatch]);

  useEffect(() => {
    formData.manufacturersData?.forEach((item) => {
      if (item.manufacturer) {
        // Don't load full catalog data for proposal summary - only manufacturer info needed
        dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }));
      }
    });
  }, [formData.manufacturersData, dispatch]);

  const versionDetails = formData?.manufacturersData?.map(item => ({
    ...item,
    manufacturerData: manufacturersById[item.manufacturer]
  }));
  const selectVersion = versionDetails[selectedVersionIndex]

  useEffect(() => {
    if (versionDetails?.length > 0 && selectedVersionIndex === null) {
      setSelectedVersionIndex(0);
      // Initialize with the first version object, not the whole array
      setSelectedVersion(versionDetails[0]);
    }
  }, [versionDetails, selectedVersionIndex]);

  const handleSaveOrder = () => {
    sendToBackend('0');
  };

  const handleAcceptOrder = async () => {
    if (isSubmitting) return; // Prevent duplicate submissions

    try {
      const result = await Swal.fire({
        title: t('proposals.confirm.submitTitle', 'Confirm Quote Submission'),
        html: `
          <div style="text-align:left">
            <p>${t('proposals.confirm.submitText', 'Once you submit this quote, it will be sent to production and cannot be changed.')}</p>
            <p>${t('proposals.confirm.submitWarning', 'By continuing, you confirm that all details are correct and you accept the Terms & Conditions.')}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('proposals.confirm.submitConfirm', 'Accept and Submit'),
        cancelButtonText: t('proposals.confirm.goBack', 'Go Back'),
        reverseButtons: true,
        focusCancel: true,
      });

      if (result.isConfirmed) {
        setIsSubmitting(true);

        // Update status to accepted and lock the quote before sending
        const updatedFormData = {
          ...formData,
          status: 'Proposal accepted',
          is_locked: true
        };
        updateFormData(updatedFormData);

        // Send with the updated data including status and lock
        const payload = {
          action: '1',
          formData: { ...updatedFormData, type: '1' },
        };

        try {
          const response = await dispatch(sendFormDataToBackend(payload));
          if (response.payload.success == true) {
            Swal.fire('Success!', 'Quote accepted and sent to production!', 'success');
            // Navigate away to prevent duplicate submissions
            navigate('/quotes');
          } else {
            throw new Error(response.payload.message || 'Failed to accept order');
          }
        } catch (error) {
          console.error('Error accepting order:', error);
          Swal.fire('Error!', 'Failed to accept order. Please try again.', 'error');
          setIsSubmitting(false);
        }
      }
    } catch (_) {
      setIsSubmitting(false);
    }
  };

  const handleRejectOrder = () => {
    sendToBackend('2');
  };

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
  }

  const handleSubmit = (values) => {
    updateFormData(values);
  };

  const openEditModal = (index) => {
    setCurrentEditIndex(index);
    setEditedVersionName(versionDetails[index].versionName);
    setEditModalOpen(true);
  };

  const saveEditVersionName = () => {
    const existingEntry = formData.manufacturersData.find(
      (entry) => entry.versionName === editedVersionName
    );

    if (existingEntry) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Manufacturer Version',
        text: `Manufacturer Version Name "${editedVersionName}" already exists.`,
      });
      return;
    }

    const updatedManufacturersData = [...formData.manufacturersData];
    updatedManufacturersData[currentEditIndex].versionName = editedVersionName;
    updateFormData({ manufacturersData: updatedManufacturersData });
    setEditModalOpen(false);
  };

  const openDeleteModal = (index) => {
    setCurrentDeleteIndex(index);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    const updatedManufacturersData = formData.manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex
    );
    updateFormData({ manufacturersData: updatedManufacturersData });
    setDeleteModalOpen(false);
  };

  const duplicateVersion = (index) => {
    const copy = { ...formData.manufacturersData[index] };
    copy.versionName = `Copy of ${copy.versionName}`;
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] });
  };

  const designerOptions = users
    .filter((user) => user.id !== loggedInUserId)
    .map((user) => ({ value: user.id, label: user.name }));

  return (
    <>
      <div className="quote-form-mobile">
        <div className="button-group">
          {!hideBack && (
            <CButton
              color="secondary"
              variant="outline"
              onClick={prevStep}
              style={{ borderRadius: '6px', minWidth: '90px' }}
            >
              Back
            </CButton>
          )}
        </div>
        <Formik
          initialValues={formData}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <>
              <CForm onSubmit={handleSubmit} className="proposal-summary-form">
                <div className="form-section">
                  <CRow>
                    <CCol xs={12} md={2} className="mt-4">
                      <CFormLabel htmlFor="designer">Designer *</CFormLabel>
                      <CreatableSelect
                        isClearable
                        id="designer"
                        name="designer"
                        options={designerOptions}
                        value={
                          designerOptions.find(
                            (opt) => opt.value === values.designer
                          ) || null
                        }
                        onChange={(selectedOption) => {
                          updateFormData({
                            ...formData,
                            designer: selectedOption?.value || '',
                          });
                        }}
                        onBlur={handleBlur}
                      />
                      {errors.designer && touched.designer && (
                        <div className="text-danger small mt-1">
                          {errors.designer}
                        </div>
                    )}
                  </CCol>

                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="description">{t('proposals.create.customerInfo.description')} *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="description"
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder={t('proposals.create.customerInfo.descriptionPlaceholder')}
                    />
                    {errors.description && touched.description && (
                      <div className="text-danger small mt-1">
                        {errors.description}
                      </div>
                    )}
                  </CCol>

                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="status">{t('proposals.headers.status')}</CFormLabel>
                    <CreatableSelect
                      isClearable
                      options={statusOptions}
                      value={
                        statusOptions.find(opt => opt.value === (values.status || 'Draft'))
                      }
                      onChange={(selectedOption) => {
                        updateFormData({
                          ...formData,
                          status: selectedOption?.value || 'Draft',
                        });
                      }}
                      onBlur={handleBlur}
                      inputId="status"
                    />
                  </CCol>

                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="date">{t('proposals.headers.date')}</CFormLabel>
                      <DatePicker
                        id="date"
                        selected={values.date ? new Date(values.date) : null}
                        onChange={(date) => {
                          const current = values.date ? new Date(values.date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'date', value: date } });
                            updateFormData({ ...formData, date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText={t('proposals.headers.date')}
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
                      <CFormLabel htmlFor="designDate">{t('proposals.create.customerInfo.designDoneDate')}</CFormLabel>
                      <DatePicker
                        id="designDate"
                        selected={values.designDate ? new Date(values.designDate) : null}
                        onChange={(date) => {
                          const current = values.designDate ? new Date(values.designDate) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'designDate', value: date } });
                            updateFormData({ ...formData, designDate: date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText={t('proposals.create.customerInfo.designDoneDate')}
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
                      <CFormLabel htmlFor="measurementDate">
                        {t('proposals.create.customerInfo.measurementDoneDate')}</CFormLabel>
                      <DatePicker
                        id="measurementDate"
                        selected={values.measurementDate ? new Date(values.measurementDate) : null}
                        onChange={(date) => {
                          const current = values.measurementDate ? new Date(values.measurementDate) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'measurementDate', value: date } });
                            updateFormData({ ...formData, measurementDate: date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText={t('proposals.create.customerInfo.measurementDoneDate')}
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
                  <CCol xs={12} md={2} className="mt-4">
                    <div style={{ position: 'relative' }}>
                      <CFormLabel htmlFor="followUp1Date">{t('proposals.status.followUp1')} {t('proposals.headers.date')}</CFormLabel>
                      <DatePicker
                        id="followUp1Date"
                        selected={values.followUp1Date ? new Date(values.followUp1Date) : null}
                        onChange={(date) => {
                          const current = values.followUp1Date ? new Date(values.followUp1Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp1Date', value: date } });
                            updateFormData({ ...formData, followUp1Date: date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp1')} ${t('proposals.headers.date')}`}
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
                      <CFormLabel htmlFor="followUp2Date">{t('proposals.status.followUp2')} {t('proposals.headers.date')}</CFormLabel>
                      <DatePicker
                        id="followUp2Date"
                        selected={values.followUp2Date ? new Date(values.followUp2Date) : null}
                        onChange={(date) => {
                          const current = values.followUp2Date ? new Date(values.followUp2Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp2Date', value: date } });
                            updateFormData({ ...formData, followUp2Date: date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp2')} ${t('proposals.headers.date')}`}
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
                      <CFormLabel htmlFor="followUp3Date">{t('proposals.status.followUp3')} {t('proposals.headers.date')}</CFormLabel>
                      <DatePicker
                        id="followUp3Date"
                        selected={values.followUp3Date ? new Date(values.followUp3Date) : null}
                        onChange={(date) => {
                          const current = values.followUp3Date ? new Date(values.followUp3Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp3Date', value: date } });
                            updateFormData({ ...formData, followUp3Date: date });
                          }
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp3')} ${t('proposals.headers.date')}`}
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
                  */}
                </CRow>
                </div>
              </CForm>

              <div className="proposal-version-badges">
                {versionDetails.map((version, index) => {
                  const isSelected = index === selectedVersionIndex;
                  return (
                    <CBadge
                      key={index}
                      className={`proposal-version-badge p-2 d-flex ${isSelected ? 'selected' : ''}`}
                      style={{
                        fontSize: '0.8rem',
                        backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                        color: isSelected ? '#d0e7ff' : '#084298',
                        borderRadius: '5px',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => handleBadgeClick(index, version)}
                    >
                      <div>
                        {!isContractor && (
                          <strong style={{ display: 'block' }}>{version.versionName}</strong>
                        )}
                        <small style={{ fontSize: '0.7rem', color: isSelected ? '#a9c7ff' : '#4a6fa5' }}>
                          $ {version.manufacturerData?.costMultiplier || 'N/A'}
                        </small>
                      </div>

                      {!isContractor && (
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
                              transition: 'all 0.2s ease'
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
                              padding: '4px 0'
                            }}
                          >
                            <CDropdownItem
                              onClick={() => openEditModal(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#333',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <CIcon icon={cilPencil} className="me-2" /> {t('common.edit')}
                            </CDropdownItem>
                            <CDropdownItem
                              onClick={() => openDeleteModal(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#dc3545',
                                transition: 'all 0.2s ease'
                              }}
                            >
                                <CIcon icon={cilTrash} className="me-2" /> {t('common.delete')}
                            </CDropdownItem>
                            <CDropdownItem
                              onClick={() => duplicateVersion(index)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                color: '#333',
                                transition: 'all 0.2s ease'
                              }}
                            >
                                <CIcon icon={cilCopy} className="me-2" /> {t('proposals.create.summary.duplicate')}
                            </CDropdownItem>
                          </CDropdownMenu>
                        </CDropdown>
                      )}
                    </CBadge>
                  );
                })}
              </div>

              <hr />

              <CTabs className="quote-tabs">
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
                        ':hover': {
                          color: '#084298',
                          backgroundColor: 'rgba(8, 66, 152, 0.05)'
                        }
                      }}
                    >
                      <span className="d-flex align-items-center">
                        <CIcon icon={cilList} className="me-2" />
                        {t('proposalColumns.items')}
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
                        ':hover': {
                          color: '#084298',
                          backgroundColor: 'rgba(8, 66, 152, 0.05)'
                        }
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
                  <ItemSelectionContent
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
                  <h5>{t('proposals.create.files.title')}</h5>
                  <p>{t('proposals.create.files.subtitle')}</p>
                  <FileUploadSection
                    proposalId={formData.id}
                    onFilesChange={(files) => updateFormData({ ...formData, files })}
                  />
                </div>
              )}

              <hr />
              <div className="button-group">
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={handleSaveOrder}
                  style={{ minWidth: '140px' }}
                >
                  {t('common.save')}
                </CButton>
                <CButton
                  color="success"
                  onClick={handleAcceptOrder}
                  disabled={isSubmitting}
                  style={{ minWidth: '140px' }}
                >
                  {isSubmitting ? 'Submitting...' : t('proposals.create.summary.acceptAndOrder')}
                </CButton>
                <CButton
                  color="danger"
                  variant="outline"
                  onClick={handleRejectOrder}
                  style={{ minWidth: '140px' }}
                >
                  {t('proposals.create.summary.rejectAndArchive')}
                </CButton>
              </div>
            </>
          )}
        </Formik >
      </div >

      <CModal
        visible={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        alignment="center"
        backdrop="static"
        className="modal-lg"
      >
        <CModalHeader closeButton>
          <CModalTitle>{t('proposals.create.summary.editVersionTitle')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormInput
            className="mb-3"
            value={editedVersionName}
            onChange={(e) => setEditedVersionName(e.target.value)}
            placeholder={t('proposals.create.manufacturer.labels.versionName')}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModalOpen(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={saveEditVersionName}>
            {t('common.save')}
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
          <CModalTitle>{t('customers.confirmTitle')}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {t('proposals.create.summary.confirmDeleteVersion')}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDeleteModalOpen(false)}>
            {t('common.cancel')}
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            {t('common.delete')}
          </CButton>
        </CModalFooter>
      </CModal>

    </>
  )
}

export default ItemSelectionStep
