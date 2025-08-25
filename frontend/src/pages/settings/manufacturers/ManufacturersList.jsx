import { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Filter,
  SortAsc,
  SortDesc,
  Factory
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchManufacturers, updateManufacturerStatus } from '../../../store/slices/manufacturersSlice';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';

const ManufacturersList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: allManufacturers, loading, error } = useSelector(state => state.manufacturers);
  const [manufacturers, setManufacturers] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();
  const api_url = import.meta.env.VITE_API_URL;

  useEffect(() => {
    dispatch(fetchManufacturers());
  }, [dispatch]);

  const handleFilterChange = (e) => {
    setFilterText(e.target.value);
    filterManufacturers(e.target.value, sortBy, sortDirection);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
    filterManufacturers(filterText, e.target.value, sortDirection);
  };

  const handleSortDirectionChange = (e) => {
    setSortDirection(e.target.value);
    filterManufacturers(filterText, sortBy, e.target.value);
  };

  const toggleEnabled = (id, currentStatus) => {
    dispatch(updateManufacturerStatus({ id, enabled: !currentStatus }))
      .unwrap()
      .then((res) => {
        dispatch(fetchManufacturers())
        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: t('settings.manufacturers.toast.updateSuccess'),
          showConfirmButton: false,
          timer: 1500,
          width: '360px',
          didOpen: (toast) => {
            toast.style.padding = '8px 12px';
            toast.style.fontSize = '14px';
            toast.style.minHeight = 'auto';
          }
        });
      })
      .catch((err) => {
        console.error('Toggle failed:', err)
        Swal.fire({
          toast: true,
          position: "top",
          icon: "error",
          title: t('settings.manufacturers.toast.updateFailed'),
          showConfirmButton: false,
          timer: 1500,
          width: '330px',
          didOpen: (toast) => {
            toast.style.padding = '8px 12px';
            toast.style.fontSize = '14px';
            toast.style.minHeight = 'auto';
          }
        });
      })
  };

  useEffect(() => {
    filterManufacturers(filterText, sortBy, sortDirection);
  }, [allManufacturers, filterText, sortBy, sortDirection]);

  const filterManufacturers = (filter, sort, direction) => {
    let filtered = [...allManufacturers];
    if (filter) {
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(filter.toLowerCase()) ||
        m.email?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (a[sort] < b[sort]) return direction === 'asc' ? -1 : 1;
      if (a[sort] > b[sort]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setManufacturers(filtered);
  };

  const handleManuCreate = () => {
    navigate("/settings/manufacturers/create");
  }

  const handleEdit = (id) => {
    navigate(`/settings/manufacturers/edit/${id}`);
  }

  const cardStyles = {
    container: {
      padding: '8px 16px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    headerCard: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '16px'
    },
    controlsCard: {
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      marginBottom: '8px'
    },
    manufacturerCard: {
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      height: '100%',
      overflow: 'hidden'
    },
    badge: {
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      padding: '6px 12px'
    },
    inputGroup: {
      position: 'relative'
    },
    searchIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      color: '#6c757d'
    },
    searchInput: {
      paddingLeft: '40px',
      border: '1px solid #e3e6f0',
      borderRadius: '10px',
      fontSize: '14px',
      padding: '12px 16px 12px 40px'
    },
    editButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      backgroundColor: '#ffffff',
      border: '1px solid #e3e6f0',
      borderRadius: '8px',
      padding: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    logoContainer: {
      width: '80px',
      height: '80px',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0,
      border: '2px solid #e9ecef'
    }
  };

  return (
    <div style={cardStyles.container}>
      {/* Header Section */}
      <div className="card" style={cardStyles.headerCard}>
        <div className="card-body py-4">
          <div className="row align-items-center">
            <div className="col">
              <h3 className="text-white mb-1 fw-bold d-flex align-items-center">
                <Factory className="me-2" size={24} />
                {t('settings.manufacturers.header')}
              </h3>
              <p className="text-white-50 mb-0">{t('settings.manufacturers.subtitle')}</p>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-light shadow-sm px-4 fw-semibold"
                onClick={handleManuCreate}
                style={{ 
                  borderRadius: '5px',
                  border: 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <Plus className="me-2" size={16} />
                {t('settings.manufacturers.add')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="card" style={cardStyles.controlsCard}>
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-lg-4 col-md-6 mb-3 mb-lg-0">
              <label className="form-label fw-medium text-muted mb-2">
                <Search size={14} className="me-1" />
                {t('settings.manufacturers.search')}
              </label>
              <div style={cardStyles.inputGroup}>
                <Search size={16} style={cardStyles.searchIcon} />
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('settings.manufacturers.searchPlaceholder')}
                  value={filterText}
                  onChange={handleFilterChange}
                  style={cardStyles.searchInput}
                />
              </div>
            </div>
            <div className="col-lg-3 col-md-6 mb-3 mb-lg-0">
              <label className="form-label fw-medium text-muted mb-2">
                <Filter size={14} className="me-1" />
                {t('settings.manufacturers.sortBy')}
              </label>
              <select 
                className="form-select"
                value={sortBy} 
                onChange={handleSortByChange}
                style={{
                  border: '1px solid #e3e6f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  padding: '12px 16px'
                }}
              >
                <option value="id">{t('settings.manufacturers.sort.id')}</option>
                <option value="name">{t('settings.manufacturers.sort.name')}</option>
                <option value="email">{t('settings.manufacturers.sort.email')}</option>
                <option value="capacity">{t('settings.manufacturers.sort.capacity')}</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-6 mb-3 mb-lg-0">
              <label className="form-label fw-medium text-muted mb-2">
                {sortDirection === 'asc' ? <SortAsc size={14} className="me-1" /> : <SortDesc size={14} className="me-1" />}
                {t('settings.manufacturers.order')}
              </label>
              <select 
                className="form-select" 
                value={sortDirection} 
                onChange={handleSortDirectionChange}
                style={{
                  border: '1px solid #e3e6f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  padding: '12px 16px'
                }}
              >
                <option value="desc">{t('settings.manufacturers.orderOptions.descending')}</option>
                <option value="asc">{t('settings.manufacturers.orderOptions.ascending')}</option>
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <div className="d-flex justify-content-lg-end">
                <span 
                  className="badge bg-info"
                  style={{
                    ...cardStyles.badge,
                    // backgroundColor: '#e7f3ff !important',
                    // color: '#0d6efd'
                  }}
                >
                  {t('settings.manufacturers.stats.total', { count: allManufacturers?.length || 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card" style={cardStyles.controlsCard}>
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <p className="text-muted mb-0">{t('settings.manufacturers.loading')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card" style={cardStyles.controlsCard}>
          <div className="card-body">
            <div className="alert alert-danger mb-0">
              <strong>{t('settings.manufacturers.errorPrefix')}</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && manufacturers.length === 0 && (
        <div className="card" style={cardStyles.controlsCard}>
          <div className="card-body text-center py-5">
            <Factory size={48} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted mb-2">{t('settings.manufacturers.empty.title')}</h5>
            <p className="text-muted mb-0">
              {filterText ? t('settings.manufacturers.empty.subtitleFiltered') : t('settings.manufacturers.empty.subtitleStart')}
            </p>
          </div>
        </div>
      )}

      {/* Manufacturers Grid */}
      {!loading && manufacturers.length > 0 && (
        <div className="row">
          {manufacturers.map((manufacturer) => (
            <div className="col-xl-6 col-lg-6 col-md-12 mb-4" key={manufacturer.id}>
              <div 
                className="card" 
                style={cardStyles.manufacturerCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
              >
                <div className="card-body p-4" style={{ position: 'relative' }}>
                  {/* Edit Button */}
                  <button
                    style={cardStyles.editButton}
                    onClick={() => handleEdit(manufacturer.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e7f3ff';
                      e.currentTarget.style.borderColor = '#0d6efd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e3e6f0';
                    }}
                  >
                    <Edit3 size={16} style={{ color: '#0d6efd' }} />
                  </button>

                  <div className="d-flex">
                    {/* Logo Section */}
                    <div style={cardStyles.logoContainer} className="me-4">
                      <img
                        src={
                          manufacturer.image
                            ? `${api_url}/uploads/manufacturer_catalogs/${manufacturer.image}`
                            : "/images/nologo.png"
                        }
                        alt={`${manufacturer.name} logo`}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      {/* Name */}
                      <div className="mb-3">
                        <h5 className="mb-1 fw-bold text-dark d-flex align-items-center">
                          <Building2 size={18} className="me-2 text-primary" />
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>
                            {manufacturer.name}
                          </span>
                        </h5>
                      </div>

                      {/* Email */}
                      <div className="mb-3 d-flex align-items-center">
                        <Mail size={16} className="me-2 text-muted flex-shrink-0" />
                        <span 
                          className="text-muted"
                          style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            fontSize: '14px'
                          }}
                        >
                          {manufacturer.email}
                        </span>
                      </div>

                      {/* Capacity */}
                      <div className="mb-3 d-flex align-items-center">
                        <FileText size={16} className="me-2 text-muted flex-shrink-0" />
                        <span 
                          className="badge"
                          style={{
                            ...cardStyles.badge,
                            backgroundColor: '#f8f9fa',
                            color: '#495057',
                            border: '1px solid #e9ecef'
                          }}
                        >
                          {t('settings.manufacturers.labels.capacity', { capacity: manufacturer.capacity })}
                        </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`enabledSwitch${manufacturer.id}`}
                            checked={manufacturer.status}
                            onChange={() => toggleEnabled(manufacturer.id, manufacturer.status)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label 
                            className="form-check-label fw-medium" 
                            htmlFor={`enabledSwitch${manufacturer.id}`}
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                          >
                            {manufacturer.status ? t('settings.manufacturers.labels.active') : t('settings.manufacturers.labels.inactive')}
                          </label>
                        </div>
                        <span 
                          className={`badge ${manufacturer.status ? 'bg-success' : 'bg-secondary'}`}
                          style={cardStyles.badge}
                        >
                          {manufacturer.status ? t('settings.manufacturers.labels.enabled') : t('settings.manufacturers.labels.disabled')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManufacturersList;