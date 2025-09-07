import { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CForm,
  CFormLabel,
  CFormInput,
  CFormCheck,
  CButton,
  CRow,
  CCol,
} from '@coreui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CreatableSelect from 'react-select/creatable';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../../helpers/axiosInstance';
import { hasPermission } from '../../../helpers/permissions';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../../../store/slices/userSlice';
import { fetchLocations } from '../../../store/slices/locationSlice';
import { FaCalendarAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

const CustomerInfoStep = ({ formData, updateFormData, nextStep, prevStep, hideBack, isContractor, contractorGroupId }) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isCreatingDesigner, setIsCreatingDesigner] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const { t } = useTranslation();
  const [customerOptions, setCustomerOptions] = useState([]);
  const dispatch = useDispatch();
  const { list: users, loading } = useSelector((state) => state.users);
  const { list: locations } = useSelector((state) => state.locations);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser.userId;

  // Check if user can assign designers (admin only)
  const canAssignDesigner = hasPermission(loggedInUser, 'admin:users');

  // Dynamic validation schema based on user permissions
  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required(t('proposals.create.customerInfo.validation.customerName')),
    description: Yup.string().required(t('proposals.create.customerInfo.validation.description')),
    ...(canAssignDesigner && {
      designer: Yup.string().required(t('proposals.create.customerInfo.validation.designer')),
    }),
  });

  useEffect(() => {
    // Only fetch users if user can assign designers (admin only)
    if (canAssignDesigner) {
      dispatch(fetchUsers());
    }
    dispatch(fetchLocations());
  }, [dispatch, canAssignDesigner]);

  useEffect(() => {

    // For contractors, pass the group_id to get scoped customers
    let url = '/api/customers';
    if (isContractor && contractorGroupId) {
      url += `?group_id=${contractorGroupId}`;
    }

    axiosInstance
  .get(url)
      .then((res) => {
        const options = res.data.data.map((data) => ({
          label: data.name,
          value: data.name,
          data: data,
        }));
        setCustomerOptions(options);
      })
            .catch((error) => {
        console.error('Error fetching customers:', error);
      });
  }, [dispatch, isContractor, contractorGroupId]);

  useEffect(() => {
    if (locations.length > 0 && !formData.location) {
      const mainLocation = locations.find(
        (loc) => loc.locationName.trim().toLowerCase() === 'main'
      );
      if (mainLocation) {
        updateFormData({ location: mainLocation.id.toString() });
      }
    }
  }, [locations]);

  // Auto-populate designer field when users are loaded
  useEffect(() => {
    if (canAssignDesigner && users.length > 0) {
      const currentUser = users.find(user => user.id === loggedInUserId);
      const availableDesigners = users.filter(user => user.role === 'Manufacturers');
      const isCurrentDesignerValid = availableDesigners.some(designer => designer.id == formData.designer);

      // Auto-populate if designer field is empty OR if current value is invalid
      if (!formData.designer || formData.designer === '' || !isCurrentDesignerValid) {
        if (currentUser && currentUser.role === 'Manufacturers') {
          // If current user is a designer, auto-populate with them
          updateFormData({ designer: currentUser.id });
        } else if (currentUser && (currentUser.role === 'Admin' || currentUser.role === 'User')) {
          // If current user is Admin/User, auto-populate with the first available designer
          if (availableDesigners.length > 0) {
            const firstDesigner = availableDesigners[0];
            updateFormData({ designer: firstDesigner.id });
          }
        }
      }
    }
  }, [users, canAssignDesigner, loggedInUserId, formData.designer, updateFormData]);

  const toggleMoreOptions = () => setShowMoreOptions(!showMoreOptions);

  const handleSubmit = (values) => {
    updateFormData(values);
    nextStep();
  };

  // Function to create a new designer user
  const createNewDesigner = async (designerName) => {
    try {
      setIsCreatingDesigner(true);

      // Generate a temporary email for the designer
      const tempEmail = `${designerName.toLowerCase().replace(/\s+/g, '.')}@designer.local`;

      const response = await axiosInstance.post('/api/users', {
        name: designerName,
        email: tempEmail,
        password: 'temppassword123', // Temporary password
        role: 'Manufacturers', // Set role as Manufacturers (designer)
        isSalesRep: false,
        location: null,
        userGroup: null
  });

      if (response.status === 200 || response.status === 201) {
        // Refresh the users list to include the new designer
        await dispatch(fetchUsers());
        return response.data.user;
      }
    } catch (error) {
      console.error('Error creating new designer:', error);
      // Handle error - you could add a toast notification here
      alert(`Error creating designer "${designerName}". Please try again.`);
      return null;
    } finally {
      setIsCreatingDesigner(false);
    }
  };

  // Include all users with designer role (Manufacturers), including the logged-in user
  const designerOptions = users
    .filter((user) => user.role === "Manufacturers")
    .map((user) => ({ value: user.id, label: user.name }));

  const locationOptions = locations.map((loc) => ({
    label: loc.locationName,
    value: loc.id.toString(),
  }));

  return (
    <div className="w-100 my-4 proposal-form-mobile">
      <CCard>
        <CCardBody className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-semibold mb-0">{t('proposals.create.customerInfo.title')}</h4>
            {!hideBack && (
              <CButton
                color="secondary"
                variant="outline"
                onClick={prevStep}
                style={{ borderRadius: '6px', minWidth: '90px' }}
              >
                {t('common.back')}
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
              setFieldValue,
            }) => (
              <CForm onSubmit={handleSubmit}>
                <div className="form-section">
                  <CRow className="mb-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="customerName">{t('proposals.create.customerInfo.customerName')} *</CFormLabel>
                      <CreatableSelect
                        isClearable
                        options={customerOptions}
                        value={
                          customerOptions.find((opt) => opt.value === values.customerName) ||
                          (values.customerName
                            ? { label: values.customerName, value: values.customerName }
                            : null)
                        }
                        onChange={(selectedOption) => {
                          const name = selectedOption?.value || '';
                          const email = selectedOption?.data?.email || '';
                          const customerId = selectedOption?.data?.id || '';
                          updateFormData({
                            ...formData,
                            customerName: name,
                            customerEmail: email,
                            customerId: customerId
                          });
                          setFieldValue('customerName', name);
                          setFieldValue('customerEmail', email);
                          setFieldValue('customerId', customerId);
                        }}
                        onCreateOption={async (inputValue) => {
                          const name = String(inputValue || '').trim();
                          if (!name) return;
                          try {
                            setIsCreatingCustomer(true);
                            // Compose minimal payload; admin may need group_id when creating for a contractor
                            const payload = {
                              name,
                              email: values.customerEmail || '',
                              ...(isContractor && contractorGroupId ? { group_id: contractorGroupId } : {}),
                            };
                            const res = await axiosInstance.post('/api/customers/add', payload);
                            const created = res?.data?.customer || res?.data;
                            const newId = created?.id || '';

                            // Update form and local options
                            const option = { label: created?.name || name, value: created?.name || name, data: created };
                            setCustomerOptions((prev) => [option, ...prev.filter((o) => o.value !== option.value)]);

                            updateFormData({
                              ...formData,
                              customerName: created?.name || name,
                              customerEmail: created?.email || values.customerEmail || '',
                              customerId: newId,
                            });
                            setFieldValue('customerName', created?.name || name);
                            setFieldValue('customerEmail', created?.email || values.customerEmail || '');
                            setFieldValue('customerId', newId);

                            Swal.fire('Customer Created', `"${created?.name || name}" was added.`, 'success');
                          } catch (err) {
                            const msg = err?.response?.data?.message || err?.message || 'Failed to create customer';
                            Swal.fire('Error', msg, 'error');
                          } finally {
                            setIsCreatingCustomer(false);
                          }
                        }}
                      onBlur={handleBlur}
                      inputId="customerName"
                      placeholder={t('proposals.create.customerInfo.customerNamePlaceholder')}
                      isLoading={loading || isCreatingCustomer}
                    />
                    {errors.customerName && touched.customerName && (
                      <div className="text-danger small mt-1">{errors.customerName}</div>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel htmlFor="customerEmail">{t('proposals.create.customerInfo.customerEmail')}</CFormLabel>
                    <CFormInput
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={values.customerEmail}
                      onChange={(e) => {
                        setFieldValue('customerEmail', e.target.value); // Update Formik state
                        updateFormData({ customerEmail: e.target.value }); // Update external formData
                      }}
                      placeholder={t('proposalCommon.emailPlaceholder')}
                    />

                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  {canAssignDesigner && (
                    <CCol md={6}>
                      <CFormLabel htmlFor="designer">{t('proposals.create.customerInfo.designer')} *</CFormLabel>
                      <CreatableSelect
                        isClearable
                        isLoading={isCreatingDesigner}
                        isDisabled={isCreatingDesigner}
                        id="designer"
                        name="designer"
                        options={designerOptions}
                        value={
                          designerOptions.find(
                            (opt) => opt.value === values.designer
                          ) || null
                        }
                        onChange={(selectedOption) => {
                          const designerId = selectedOption?.value || '';
                          setFieldValue('designer', designerId);
                          updateFormData({ designer: designerId });
                        }}
                        onCreateOption={async (inputValue) => {
                          // Create new designer when user types a name that doesn't exist
                          const newDesigner = await createNewDesigner(inputValue);
                          if (newDesigner) {
                            // Set the new designer as selected
                            setFieldValue('designer', newDesigner.id);
                            updateFormData({ designer: newDesigner.id });
                          }
                        }}
                        onBlur={handleBlur}
                        placeholder={isCreatingDesigner ? "Creating designer..." : "Select or create a designer..."}
                        formatCreateLabel={(inputValue) => `Create designer: "${inputValue}"`}
                      />
                      {errors.designer && touched.designer && (
                        <div className="text-danger small mt-1">
                          {errors.designer}
                        </div>
                      )}
                    </CCol>
                  )}

                  <CCol md={6}>
                    <CFormLabel htmlFor="description">{t('proposals.create.customerInfo.description')} *</CFormLabel>
                    <CFormInput
                      type="text"
                      id="description"
                      name="description"
                      value={values.description}
                      onChange={(e) => {
                        setFieldValue('description', e.target.value);
                        updateFormData({ description: e.target.value });
                      }}
                      onBlur={handleBlur}
                      placeholder={t('proposals.create.customerInfo.descriptionPlaceholder')}
                    />
                    {errors.description && touched.description && (
                      <div className="text-danger small mt-1">
                        {errors.description}
                      </div>
                    )}
                  </CCol>
                </CRow>

                <h5 className="mb-3 mt-4">{t('proposals.create.customerInfo.schedule')}</h5>

                <CRow className="mb-4">
                  <CCol md={6} className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3 mt-3">
                      <CFormCheck
                        id="measurementDone"
                        label={t('proposals.create.customerInfo.measurementDone')}
                        name="measurementDone"
                        checked={values.measurementDone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValue('measurementDone', checked);
                          updateFormData({ measurementDone: checked });
                        }}
                        className="me-3"
                      />
                    </div>
                    <CFormLabel htmlFor="measurementDate">
                      {values.measurementDone ? t('proposals.create.customerInfo.measurementDoneDate') : t('proposals.create.customerInfo.measurementScheduledDate')}
                    </CFormLabel>
                    <div style={{ position: 'relative' }}>
                      <DatePicker
                        id="measurementDate"
                        selected={values.measurementDate ? new Date(values.measurementDate) : null}
                        onChange={(date) => {
                          setFieldValue('measurementDate', date);
                          // Defer syncing to parent until submit to avoid reinitialize loops
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={
                          values.measurementDone ? t('proposals.create.customerInfo.measurementDoneDate') : t('proposals.create.customerInfo.measurementScheduledDate')
                        }
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>

                  <CCol md={6} className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3 mt-3">
                      <CFormCheck
                        id="designDone"
                        label={t('proposals.create.customerInfo.designDone')}
                        name="designDone"
                        checked={values.designDone}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFieldValue('designDone', checked);
                          updateFormData({ designDone: checked });
                        }}
                        className="me-3"
                      />
                    </div>
                    <CFormLabel htmlFor="designDate">
                      {values.designDone ? t('proposals.create.customerInfo.designDoneDate') : t('proposals.create.customerInfo.designScheduledDate')}
                    </CFormLabel>
                    <div style={{ position: 'relative' }}>
                      <DatePicker
                        id="designDate"
                        selected={values.designDate ? new Date(values.designDate) : null}
                        onChange={(date) => {
                          setFieldValue('designDate', date);
                          // Defer syncing to parent until submit to avoid reinitialize loops
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={
                          values.designDone ? t('proposals.create.customerInfo.designDoneDate') : t('proposals.create.customerInfo.designScheduledDate')
                        }
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </CCol>
                </CRow>

                <div className="mb-3">
                  <CButton
                    color="link"
                    className="text-decoration-none p-0"
                    onClick={toggleMoreOptions}
                  >
                    {showMoreOptions ? t('proposals.create.customerInfo.hideOptions') : t('proposals.create.customerInfo.moreOptions')}
                  </CButton>
                </div>

                <AnimatePresence>
                  {showMoreOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h5 className="mb-3 mt-4">{t('proposals.create.customerInfo.additionalInfo')}</h5>
                      <CRow className="mb-3">
                        <CCol md={6}>
                          <CFormLabel htmlFor="location">{t('profile.location')} *</CFormLabel>
                          <CreatableSelect
                            isClearable
                            options={locationOptions}
                            value={
                              locationOptions.find(
                                (opt) => opt.value === values.location
                              ) ||
                              (values.location
                                ? {
                                  label: values.location,
                                  value: values.location,
                                }
                                : null)
                            }
                            onChange={(selectedOption) => {
                              const value = selectedOption?.value || '';
                              setFieldValue('location', value);
                              updateFormData({
                                ...formData,
                                location: value,
                              });
                            }}
                            onBlur={handleBlur}
                            inputId="location"
                          />
                        </CCol>

                        <CCol md={6}>
                          <CFormLabel htmlFor="salesRep">{t('proposals.create.customerInfo.salesRep')}</CFormLabel>
                          <CreatableSelect
                            isClearable
                            id="salesRep"
                            name="salesRep"
                            options={designerOptions}
                            value={
                              designerOptions.find(
                                (opt) => opt.value === values.salesRep
                              ) || null
                            }
                            onChange={(selectedOption) => {
                              setFieldValue('salesRep', selectedOption?.value || '');
                              updateFormData({ salesRep: selectedOption?.value || '' });
                            }}
                            onBlur={handleBlur}
                          />
                        </CCol>
                      </CRow>

                      <CRow className="mb-3">
                        <CCol md={6}>
                          <CFormLabel htmlFor="leadSource">{t('form.labels.leadSource')}</CFormLabel>
                          <CreatableSelect
                            isClearable
                            options={[
                              { label: t('proposals.create.customerInfo.sources.existing'), value: 'Existing customer' },
                              { label: t('proposals.create.customerInfo.sources.online'), value: 'Online' },
                              { label: t('form.sources.walkIn'), value: 'Walk-in' },
                              { label: t('form.sources.referral'), value: 'Referral' },
                              { label: t('proposals.create.customerInfo.sources.call'), value: 'Call' },
                              { label: t('proposals.create.customerInfo.sources.email'), value: 'Email' },
                            ]}
                            value={
                              ['Existing customer', 'Online', 'Walk-in', 'Referral', 'Call', 'Email',]
                                .map(opt => ({ label: opt, value: opt }))
                                .find(opt => opt.value === values.leadSource) || null
                            }
                            onChange={(selectedOption) => {
                              setFieldValue('leadSource', selectedOption?.value || '');
                              updateFormData({ leadSource: selectedOption?.value || '' });
                            }}
                            onBlur={handleBlur}
                            inputId="leadSource"
                          />
                        </CCol>

                        <CCol md={6}>
                          <CFormLabel htmlFor="type">{t('proposals.create.customerInfo.type')}</CFormLabel>
                          <CreatableSelect
                            isClearable
                            options={[
                              { label: t('form.types.homeOwner'), value: 'Home Owner' },
                              { label: t('form.types.contractor'), value: 'Contractor' },
                              { label: t('proposals.create.customerInfo.types.builder'), value: 'Builder' },
                              { label: t('proposals.create.customerInfo.types.architect'), value: 'Architect' },
                              { label: t('proposals.create.customerInfo.types.interiorDesigner'), value: 'Interior Designer' },
                            ]}
                            value={['Home Owner', 'Contractor', 'Builder', 'Architect', 'Interior Designer',]
                              .map(opt => ({ label: opt, value: opt }))
                              .find(opt => opt.value === values.type) || null
                            }
                            onChange={(selectedOption) => {
                              setFieldValue('type', selectedOption?.value || '');
                              updateFormData({ type: selectedOption?.value || '' });
                            }}
                            onBlur={handleBlur}
                            inputId="type"
                          />
                        </CCol>
                      </CRow>
                    </motion.div>
                  )}
                </AnimatePresence>

                </div> {/* End form-section */}

                <div className="button-group">
                  <CButton type="submit" style={{ borderRadius: '6px', minWidth: '90px' }} color="success">
                    {t('common.next', 'Next')}
                  </CButton>
                </div>
              </CForm>
            )}
          </Formik>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default CustomerInfoStep;
