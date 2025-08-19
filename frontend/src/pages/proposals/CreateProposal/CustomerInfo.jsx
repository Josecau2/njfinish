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
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from '../../../store/slices/userSlice';
import { fetchLocations } from '../../../store/slices/locationSlice';
import { FaCalendarAlt } from 'react-icons/fa';

const validationSchema = Yup.object().shape({
  customerName: Yup.string().required('Customer name is required'),
  description: Yup.string().required('Description is required'),
  designer: Yup.string().required('Designer is required'),
});

const CustomerInfoStep = ({ formData, updateFormData, nextStep }) => {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [customerOptions, setCustomerOptions] = useState([]);
  const dispatch = useDispatch();
  const { list: users, loading } = useSelector((state) => state.users);
  const { list: locations } = useSelector((state) => state.locations);
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserId = loggedInUser.userId;

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchLocations());
  }, [dispatch]);

  useEffect(() => {
    axiosInstance
      .get('/api/customers')
      .then((res) => {
        const options = res.data.data.map((data) => ({
          label: data.name,
          value: data.name,
          data: data,
        }));
        setCustomerOptions(options);
      })
      .catch((err) => console.error('Error fetching customers:', err));
  }, []);

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

  const toggleMoreOptions = () => setShowMoreOptions(!showMoreOptions);

  const handleSubmit = (values) => {
    updateFormData(values);
    nextStep();
  };

  const designerOptions = users
    .filter((user) => user.id !== loggedInUserId && user.role == "Manufacturers")
    .map((user) => ({ value: user.id, label: user.name }));

  const locationOptions = locations.map((loc) => ({
    label: loc.locationName,
    value: loc.id.toString(),
  }));

  return (
    <div className="w-100 my-4">
      <CCard>
        <CCardBody className="p-4">
          <h4 className="mb-4 fw-semibold">Customer Details</h4>

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
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="customerName">Customer Name *</CFormLabel>
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
                      onCreateOption={(inputValue) => {
                        updateFormData({
                          ...formData,
                          customerName: inputValue,
                          customerEmail: '',
                          customerId: ''
                        });
                        setFieldValue('customerName', inputValue);
                        setFieldValue('customerEmail', '');
                        setFieldValue('customerId', '');
                      }}
                      onBlur={handleBlur}
                      inputId="customerName"
                      placeholder="Select or type a name"
                      isLoading={loading}
                    />
                    {errors.customerName && touched.customerName && (
                      <div className="text-danger small mt-1">{errors.customerName}</div>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel htmlFor="customerEmail">Customer Email</CFormLabel>
                    <CFormInput
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={values.customerEmail}
                      onChange={(e) => {
                        setFieldValue('customerEmail', e.target.value); // Update Formik state
                        updateFormData({ customerEmail: e.target.value }); // Update external formData
                      }}
                      placeholder="Customer Email"
                    />

                  </CCol>
                </CRow>

                <CRow className="mb-3">
                  <CCol md={6}>
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
                        setFieldValue('designer', selectedOption?.value || '');
                        updateFormData({ designer: selectedOption?.value || '' });
                      }}
                      onBlur={handleBlur}
                    />
                    {errors.designer && touched.designer && (
                      <div className="text-danger small mt-1">
                        {errors.designer}
                      </div>
                    )}
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel htmlFor="description">Description *</CFormLabel>
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
                      placeholder="Description"
                    />
                    {errors.description && touched.description && (
                      <div className="text-danger small mt-1">
                        {errors.description}
                      </div>
                    )}
                  </CCol>
                </CRow>

                <h5 className="mb-3 mt-4">Schedule</h5>

                <CRow className="mb-4">
                  <CCol md={6} className="d-flex flex-column">
                    <div className="d-flex align-items-center mb-3 mt-3">
                      <CFormCheck
                        id="measurementDone"
                        label="Measurement Done"
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
                      {values.measurementDone ? 'Measurement Done Date' : 'Measurement Scheduled Date'}
                    </CFormLabel>
                    <div style={{ position: 'relative' }}>
                      <DatePicker
                        id="measurementDate"
                        selected={values.measurementDate ? new Date(values.measurementDate) : null}
                        onChange={(date) => {
                          setFieldValue('measurementDate', date);
                          updateFormData({ measurementDate: date });
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={
                          values.measurementDone ? 'Measurement Done date' : 'Measurement scheduled date'
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
                        label="Design Done"
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
                      {values.designDone ? 'Design Done Date' : 'Design Scheduled Date'}
                    </CFormLabel>
                    <div style={{ position: 'relative' }}>
                      <DatePicker
                        id="designDate"
                        selected={values.designDate ? new Date(values.designDate) : null}
                        onChange={(date) => {
                          setFieldValue('designDate', date);
                          updateFormData({ designDate: date });
                        }}
                        className="form-control"
                        dateFormat="MM/dd/yyyy"
                        placeholderText={
                          values.designDone ? 'Design Done Date' : 'Design Scheduled Date'
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
                    {showMoreOptions ? 'Hide Options ▲' : 'More Options ▼'}
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
                      <h5 className="mb-3 mt-4">Additional Info</h5>
                      <CRow className="mb-3">
                        <CCol md={6}>
                          <CFormLabel htmlFor="location">Location *</CFormLabel>
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
                          <CFormLabel htmlFor="salesRep">Sales Representative</CFormLabel>
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
                          <CFormLabel htmlFor="leadSource">Lead Source</CFormLabel>
                          <CreatableSelect
                            isClearable
                            options={[
                              { label: 'Existing customer', value: 'Existing customer' },
                              { label: 'Online', value: 'Online' },
                              { label: 'Walk-in', value: 'Walk-in' },
                              { label: 'Referral', value: 'Referral' },
                              { label: 'Call', value: 'Call' },
                              { label: 'Email', value: 'Email' },
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
                          <CFormLabel htmlFor="type">Type</CFormLabel>
                          <CreatableSelect
                            isClearable
                            options={[
                              { label: 'Home Owner', value: 'Home Owner' },
                              { label: 'Contractor', value: 'Contractor' },
                              { label: 'Builder', value: 'Builder' },
                              { label: 'Architect', value: 'Architect' },
                              { label: 'Interior Designer', value: 'Interior Designer' },
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

                <div className="d-flex justify-content-end mt-4 border-top pt-3">
                  <CButton type="submit" style={{ borderRadius: '6px', minWidth: '90px' }} color="success">
                    Next
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
