import { useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import { useDispatch, useSelector } from 'react-redux';
import {
  CCard,
  CCardBody,
  CForm,
  CFormLabel,
  CFormFeedback,
  CRow,
  CCol,
  CButton,
  CFormInput,
} from '@coreui/react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { fetchManufacturers } from '../../../store/slices/manufacturersSlice';
import Swal from 'sweetalert2';

const validationSchema = Yup.object().shape({
  manufacturer: Yup.string().required('Manufacturer is required'),
  versionName: Yup.string().required('Version name is required'),
});

const ManufacturerStep = ({ formData, updateFormData, nextStep, prevStep, hideBack }) => {
  const dispatch = useDispatch();
  const { list: allManufacturers, loading } = useSelector(
    (state) => state.manufacturers
  );
  const api_url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    dispatch(fetchManufacturers());
  }, [dispatch]);

  const options = allManufacturers.map((m) => ({
    value: m.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={`${api_url}/uploads/manufacturer_catalogs/${m.image}`}
          alt={m.name}
          style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }}
        />
        <span>{m.name}</span>
      </div>
    ),
    name: m.name,
  }));

  return (
    <div className="my-4 w-100">
      <CCard>
        <CCardBody className="p-4">
          <h4 className="mb-4 fw-semibold">Manufacturer Details</h4>

          <Formik
            initialValues={{
              manufacturer: formData.manufacturer,
              versionName: formData.versionName,
            }}
            enableReinitialize
            validationSchema={validationSchema}
            // onSubmit={(values) => {
            //   const existingEntry = formData.manufacturersData.find(
            //     (entry) => entry.versionName === values.versionName
            //   );

            //   if (existingEntry) {
            //     Swal.fire({
            //       icon: 'warning',
            //       title: 'Duplicate Manufacturer',
            //       text: `Manufacturer "${values.versionName}" already exists.`,
            //     });
            //     return;
            //   }

            //   const newEntry = {
            //     manufacturer: values.manufacturer,
            //     versionName: values.versionName,
            //   };

            //   updateFormData({
            //     ...formData,
            //     manufacturersData: [...formData.manufacturersData, newEntry],
            //     manufacturerId: values.manufacturer
            //   });

            //   nextStep();
            // }}
            onSubmit={(values) => {
              const newEntry = {
                manufacturer: values.manufacturer,
                versionName: values.versionName,
              };

              // Filter out any existing entry with the same versionName
              // const filtered = formData.manufacturersData.filter(
              //   (entry) => entry.versionName !== values.versionName
              // );

              // // Add the new/updated entry (only one allowed)
              // const updatedManufacturers = [...filtered, newEntry];

              updateFormData({
                ...formData,
                manufacturersData: [newEntry],  // ✅ Replace entire array
                manufacturerId: values.manufacturer,
              });

              nextStep();
            }}


          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              setFieldValue,
              handleSubmit,
            }) => {
              const selectedOption = options.find(
                (opt) => opt.value === values.manufacturer
              ) || null;

              return (
                <CForm onSubmit={handleSubmit} noValidate>
                  <CRow className="mb-3">
                    <CCol>
                      <CFormLabel htmlFor="manufacturer" className="fw-semibold">
                        Manufacturer <span className="text-danger">*</span>
                      </CFormLabel>

                      <CreatableSelect
                        id="manufacturer"
                        name="manufacturer"
                        isClearable
                        options={options}
                        value={selectedOption}
                        onChange={(newValue, actionMeta) => {
                          if (newValue) {
                            setFieldValue('manufacturer', newValue.value);
                            if (!values.versionName) {
                              setFieldValue('versionName', newValue.name);
                            }
                          } else {
                            setFieldValue('manufacturer', '');
                          }
                        }}
                        onBlur={() => {
                          handleBlur({ target: { name: 'manufacturer' } });
                        }}
                        isLoading={loading}
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 42,
                            borderRadius: 6,
                            borderColor:
                              errors.manufacturer && touched.manufacturer
                                ? '#dc3545'
                                : base.borderColor,
                            '&:hover': {
                              borderColor:
                                errors.manufacturer && touched.manufacturer
                                  ? '#dc3545'
                                  : base.borderColor,
                            },
                          }),
                          option: (base) => ({
                            ...base,
                            display: 'flex',
                            alignItems: 'center',
                          }),
                          singleValue: (base) => ({
                            ...base,
                            display: 'flex',
                            alignItems: 'center',
                          }),
                        }}
                        placeholder="Select Manufacturer"
                      />
                      {errors.manufacturer && touched.manufacturer && (
                        <CFormFeedback invalid style={{ display: 'block' }}>
                          {errors.manufacturer}
                        </CFormFeedback>
                      )}
                    </CCol>
                  </CRow>

                  <CRow className="mb-4">
                    <CCol>
                      <CFormLabel htmlFor="versionName" className="fw-semibold">
                        Version Name <span className="text-danger">*</span>
                      </CFormLabel>
                      <CFormInput
                        id="versionName"
                        name="versionName"
                        type="text"
                        placeholder="Enter version name"
                        value={values.versionName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        invalid={!!errors.versionName && touched.versionName}
                        style={{ height: '42px', borderRadius: '6px' }}
                      />
                      <CFormFeedback invalid>{errors.versionName}</CFormFeedback>
                    </CCol>
                  </CRow>

                  <div className="d-flex justify-content-between">
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
                    <CButton
                      type="submit"
                      color="primary"
                      style={{ borderRadius: '6px', minWidth: '90px' }}
                    >
                      Next
                    </CButton>
                  </div>
                </CForm>
              );
            }}
          </Formik>

          <div
            className="mt-5 p-4 rounded text-center"
            style={{
              backgroundColor: '#e9f0f6',
              border: '1px solid #b3c7db',
              color: '#2c3e50',
              fontSize: '0.95rem',
              margin: '0 auto',
            }}
          >
            <h6 className="mb-2 fw-semibold" style={{ letterSpacing: '0.03em' }}>
              Need another manufacturer?
            </h6>
            {/* <p className="mb-4" style={{ lineHeight: 1.4, fontWeight: 500 }}>
              Request via app or contact us via live chat.
            </p> */}
            <CButton
              color="primary"
              variant="outline"
              size="sm"
              style={{
                borderRadius: '25px',
                padding: '6px 20px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#0275d8';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#0275d8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#0275d8';
                e.currentTarget.style.borderColor = '#0275d8';
              }}
            >
              Add manufacturer
            </CButton>
          </div>

        </CCardBody>
      </CCard>
    </div >
  );
};

export default ManufacturerStep;
