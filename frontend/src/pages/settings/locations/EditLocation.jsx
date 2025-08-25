import { useEffect, useState, useRef } from 'react';
import {
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CRow,
  CCol,
  CFormFeedback,
} from '@coreui/react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ct from 'countries-and-timezones';
import moment from 'moment-timezone';
import { fetchLocationById, updateLocation } from '../../../store/slices/locationSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

const initialForm = {
  locationName: '',
  address: '',
  website: '',
  email: '',
  phone: '',
  country: '',
  timezone: '',
};

const LocationForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const initialFormRef = useRef(initialForm);
  const [errors, setErrors] = useState({});
  const [currentTime, setCurrentTime] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const countries = Object.values(ct.getAllCountries());
  const timezonesForCountry = formData.country
    ? ct.getCountry(formData.country)?.timezones || []
    : [];

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const res = await dispatch(fetchLocationById(id)).unwrap();
          setFormData(res);
          initialFormRef.current = res;
        } catch (err) {
          Swal.fire(t('common.error'), t('settings.locations.edit.loadFailedOne'), 'error');
        }
      }
    };
    fetchData();
  }, [id, dispatch]);

  useEffect(() => {
    if (formData.timezone) {
      const interval = setInterval(() => {
        setCurrentTime(moment().tz(formData.timezone).format('YYYY-MM-DD HH:mm:ss'));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [formData.timezone]);

  const validate = () => {
    const newErrors = {};
    if (!formData.locationName.trim()) newErrors.locationName = t('settings.locations.form.validation.locationNameRequired');
    if (!formData.address.trim()) newErrors.address = t('settings.locations.form.validation.addressRequired');
    if (!formData.website.trim()) newErrors.website = t('settings.locations.form.validation.websiteRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('settings.locations.form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('settings.locations.form.validation.invalidEmail');
    }
    if (!formData.phone.trim()) newErrors.phone = t('settings.locations.form.validation.phoneRequired');
    if (!formData.country) newErrors.country = t('settings.locations.form.validation.countryRequired');
    if (!formData.timezone) newErrors.timezone = t('settings.locations.form.validation.timezoneRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      const selectedTimezones = ct.getCountry(value)?.timezones || [];
      const firstTimezone = selectedTimezones[0] || '';
      setFormData((prev) => ({
        ...prev,
        country: value,
        timezone: firstTimezone,
      }));
      setCurrentTime(firstTimezone ? moment().tz(firstTimezone).format('YYYY-MM-DD HH:mm:ss') : '');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await dispatch(updateLocation({ id, data: formData })).unwrap();

      if (response?.status == 200) {
        Swal.fire(t('settings.locations.alerts.updatedTitle'), t('settings.locations.alerts.updatedText'), 'success');
        navigate('/settings/locations');
      }
    } catch (error) {
      Swal.fire(t('common.error'), error.message || t('settings.locations.alerts.genericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormRef.current);
  };

  return (
    <CContainer className="mt-4 mb-4">
      <CCard>
        <CCardHeader className="bg-body border-bottom">
          <h5 className="mb-2 mt-2">{t('settings.locations.edit.title')}</h5>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.locationName')}</CFormLabel>
                <CFormInput
                  name="locationName"
                  value={formData.locationName}
                  onChange={handleChange}
                  invalid={!!errors.locationName}
                />
                <CFormFeedback invalid>{errors.locationName}</CFormFeedback>
              </CCol>
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.address')}</CFormLabel>
                <CFormInput
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  invalid={!!errors.address}
                />
                <CFormFeedback invalid>{errors.address}</CFormFeedback>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.website')}</CFormLabel>
                <CFormInput
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  invalid={!!errors.website}
                />
                <CFormFeedback invalid>{errors.website}</CFormFeedback>
              </CCol>
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.email')}</CFormLabel>
                <CFormInput
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  invalid={!!errors.email}
                />
                <CFormFeedback invalid>{errors.email}</CFormFeedback>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.phone')}</CFormLabel>
                <CFormInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  invalid={!!errors.phone}
                />
                <CFormFeedback invalid>{errors.phone}</CFormFeedback>
              </CCol>
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.country')}</CFormLabel>
                <CFormSelect
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  invalid={!!errors.country}
                >
                  <option value="">{t('settings.locations.form.select.country')}</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </CFormSelect>
                <CFormFeedback invalid>{errors.country}</CFormFeedback>
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.timezone')}</CFormLabel>
                <CFormSelect
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  invalid={!!errors.timezone}
                >
                  <option value="">{t('settings.locations.form.select.timezone')}</option>
                  {timezonesForCountry.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </CFormSelect>
                <CFormFeedback invalid>{errors.timezone}</CFormFeedback>
              </CCol>
              <CCol md={6}>
                <CFormLabel>{t('settings.locations.form.labels.currentTime')}</CFormLabel>
                <CFormInput
                  value={currentTime}
                  readOnly
                  tabIndex={-1}
                  style={{
                    backgroundColor: '#e9ecef',
                    cursor: 'not-allowed',
                  }}
                />
              </CCol>
            </CRow>

            <hr className="my-4" />

            <div className="d-flex gap-2 mt-4">
      <CButton type="submit" color="success" disabled={loading}>
        {loading ? t('settings.locations.edit.updating') : t('settings.locations.edit.update')}
              </CButton>
              <CButton
                type="button"
                color="secondary"
                onClick={() => {
                  if (isFormDirty()) {
                    Swal.fire({
          title: t('common.confirm'),
          text: t('settings.locations.alerts.leaveWarning'),
                      icon: 'warning',
                      showCancelButton: true,
          confirmButtonText: t('settings.locations.alerts.leaveAnyway'),
          cancelButtonText: t('settings.locations.alerts.stayOnPage'),
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#6c757d',
                    }).then((result) => {
                      if (result.isConfirmed) {
                        navigate('/settings/locations');
                      }
                    });
                  } else {
                    navigate('/settings/locations');
                  }
                }}
              >
        {t('common.cancel')}
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default LocationForm;
