import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { isAdmin } from '../../../helpers/permissions';

const ManufacturerStep = ({ formData, updateFormData, nextStep, prevStep, hideBack }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: allManufacturers, loading } = useSelector((state) => state.manufacturers);
  const authUser = useSelector((state) => state.auth?.user);
  const isUserAdmin = isAdmin(authUser);
  const api_url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    dispatch(fetchManufacturers());
  }, [dispatch]);

  const validationSchema = Yup.object().shape({
    manufacturer: Yup.string().required(
      t('proposals.create.manufacturer.validation.manufacturerRequired')
    ),
    ...(isUserAdmin
      ? {
          versionName: Yup.string().required(
            t('proposals.create.manufacturer.validation.versionNameRequired')
          ),
        }
      : {}),
  });

  const options = allManufacturers.map((m) => ({
    value: m.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={`${api_url}/uploads/images/${m.image}`}
          alt={m.name}
          style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 10 }}
        />
        <span>{m.name}</span>
      </div>
    ),
    name: m.name,
  }));

  return (
    <div className="my-4 w-100 proposal-form-mobile">
      <CCard>
        <CCardBody className="p-4">
          <h4 className="mb-4 fw-semibold">{t('proposals.create.manufacturer.title')}</h4>

          <Formik
            initialValues={{
              manufacturer: formData.manufacturer,
              versionName: formData.versionName || '',
            }}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={(values) => {
              const newEntry = {
                manufacturer: values.manufacturer,
                versionName: values.versionName || '',
              };

              updateFormData({
                ...formData,
                manufacturersData: [newEntry],
                manufacturerId: values.manufacturer,
              });

              nextStep();
            }}
          >
            {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit }) => {
              const selectedOption =
                options.find((opt) => opt.value === values.manufacturer) || null;

              return (
                <CForm onSubmit={handleSubmit} noValidate>
                  <div className="form-section">
                    <CRow className="mb-3">
                      <CCol>
                        <CFormLabel htmlFor="manufacturer" className="fw-semibold">
                          {t('proposals.create.manufacturer.labels.manufacturer')}{' '}
                          <span className="text-danger">*</span>
                        </CFormLabel>

                      <CreatableSelect
                        id="manufacturer"
                        name="manufacturer"
                        isClearable
                        options={options}
                        value={selectedOption}
                        onChange={(newValue) => {
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
                        placeholder={t(
                          'proposals.create.manufacturer.placeholders.selectManufacturer'
                        )}
                      />
                      {errors.manufacturer && touched.manufacturer && (
                        <CFormFeedback invalid style={{ display: 'block' }}>
                          {errors.manufacturer}
                        </CFormFeedback>
                      )}
                    </CCol>
                  </CRow>

                  {isUserAdmin && (
                    <CRow className="mb-4">
                      <CCol>
                        <CFormLabel htmlFor="versionName" className="fw-semibold">
                          {t('proposals.create.manufacturer.labels.versionName')}{' '}
                          <span className="text-danger">*</span>
                        </CFormLabel>
                        <CFormInput
                          id="versionName"
                          name="versionName"
                          type="text"
                          placeholder={t(
                            'proposals.create.manufacturer.placeholders.enterVersionName'
                          )}
                          value={values.versionName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          invalid={!!errors.versionName && touched.versionName}
                          style={{ height: '42px', borderRadius: '6px' }}
                        />
                        <CFormFeedback invalid>{errors.versionName}</CFormFeedback>
                      </CCol>
                    </CRow>
                  )}
                  
                  </div> {/* End form-section */}

                  <div className="button-group">
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
                    <CButton type="submit" color="primary" style={{ borderRadius: '6px', minWidth: '90px' }}>
                      {t('common.next')}
                    </CButton>
                  </div>
                </CForm>
              );
            }}
          </Formik>

      {isUserAdmin && (
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
                {t('proposals.create.manufacturer.cta.needAnother')}
              </h6>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0275d8';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = '#0275d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#0275d8';
                  e.currentTarget.style.borderColor = '#0275d8';
                }}
              >
                {t('proposals.create.manufacturer.cta.addManufacturer')}
              </CButton>
            </div>
          )}
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ManufacturerStep;
