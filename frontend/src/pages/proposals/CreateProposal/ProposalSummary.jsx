import { useEffect, useState } from 'react'
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


const validationSchema = Yup.object().shape({
  customerName: Yup.string().required('Customer name is required'),
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

const ItemSelectionStep = ({ setFormData, formData, updateFormData, setCurrentStep, setBackStep, sendToBackend, prevStep, hideBack }) => {

  const [activeTab, setActiveTab] = useState("item");
  const dispatch = useDispatch();
  const { list: users } = useSelector((state) => state.users);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser.userId;
  const manufacturersById = useSelector((state) => state.manufacturers.byId);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null);
  const [editedVersionName, setEditedVersionName] = useState('');
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index);
    setSelectedVersion(version)
  };

  useEffect(() => {
    if (selectedVersion) {
      dispatch(setSelectVersionNew(selectedVersion));
    }
  }, [selectedVersion, dispatch]);

  useEffect(() => {
    formData.manufacturersData?.forEach((item) => {
      if (item.manufacturer) {
        dispatch(fetchManufacturerById(item.manufacturer));
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
      setSelectedVersion(versionDetails);
    }
  }, [versionDetails, selectedVersionIndex]);

  const handleSaveOrder = () => {
    sendToBackend('0');
  };

  const handleAcceptOrder = () => {
    sendToBackend('1');
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

  // console.log('formData', formData);
  // console.log('selectedVersion', selectedVersion);
  // console.log('setSelectedVersion', setSelectedVersion);


  return (
    <>
      <div>
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
              <CForm onSubmit={handleSubmit}>
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
                      <div className="text-danger small mt-1">
                        {errors.description}
                      </div>
                    )}
                  </CCol>

                  <CCol xs={12} md={2} className="mt-4">
                    <CFormLabel htmlFor="status">Status</CFormLabel>
                    <CreatableSelect
                      isClearable
                      options={statusOptions}
                      value={
                        [
                          'Draft', 'Follow up 1', 'Follow up 2', 'Follow up 3',
                          'Measurement Scheduled', 'Measurement done', 'Design done',
                          'Proposal done', 'Proposal accepted', 'Proposal rejected'
                        ]
                          .map(opt => ({ label: opt, value: opt }))
                          .find(opt => opt.value === (values.status || 'Draft'))
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
                      <CFormLabel htmlFor="date">Date</CFormLabel>
                      <DatePicker
                        id="date"
                        selected={formData.date ? new Date(formData.date) : new Date()}
                        onChange={(date) => updateFormData({ ...formData, date: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText='Date'
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
                        selected={formData.designDate ? new Date(formData.designDate) : null}
                        onChange={(date) => updateFormData({ ...formData, designDate: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText='Design Date'
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
                        Measurement Date</CFormLabel>
                      <DatePicker
                        id="measurementDate"
                        selected={formData.measurementDate ? new Date(formData.measurementDate) : null}
                        onChange={(date) => updateFormData({ ...formData, measurementDate: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        wrapperClassName="w-100"
                        placeholderText='Measurement Date'
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
                        selected={formData.followUp1Date ? new Date(formData.followUp1Date) : null}
                        onChange={(date) => updateFormData({ ...formData, followUp1Date: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText='Follow up 1 Date'
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
                        selected={formData.followUp2Date ? new Date(formData.followUp2Date) : null}
                        onChange={(date) => updateFormData({ ...formData, followUp2Date: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText='Follow up 2 Date'
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
                        selected={formData.followUp3Date ? new Date(formData.followUp3Date) : null}
                        onChange={(date) => updateFormData({ ...formData, followUp3Date: date })}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText='Follow up 3 Date'
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
              </CForm>

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
                        <small style={{ fontSize: '0.7rem', color: isSelected ? '#a9c7ff' : '#4a6fa5' }}>
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
                            <CIcon icon={cilPencil} className="me-2" /> Edit
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
                            <CIcon icon={cilTrash} className="me-2" /> Delete
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
                        ':hover': {
                          color: '#084298',
                          backgroundColor: 'rgba(8, 66, 152, 0.05)'
                        }
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
                  <h5>File Upload Section</h5>
                  <p>This section allows users to upload or manage files.</p>
                  <FileUploadSection
                    proposalId={formData.id}
                    onFilesChange={(files) => updateFormData({ ...formData, files })}
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
        <CModalBody>
          Are you sure you want to delete this version?
        </CModalBody>
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
  )
}

export default ItemSelectionStep
