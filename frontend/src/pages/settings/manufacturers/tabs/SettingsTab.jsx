import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
import {
  CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableBody, CTableRow, CTableDataCell,
  CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
  CFormCheck, CFormSelect
} from '@coreui/react';
import PaginationControls from "../../../../components/PaginationControls";
import axiosInstance from '../../../../helpers/axiosInstance';

const SettingsTab = ({ manufacturer }) => {
  const { t } = useTranslation();
  const [styleCollection, setStyleCollection] = useState([]);
  const [catalogData, setCatalogData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchCode1, setSearchCode1] = useState('');
  const [page1, setPage1] = useState(1);
  const [itemsPerPage1, setItemsPerPage1] = useState(5);
  const [multiplier1, setMultiplier1] = useState('');
  const [selectedFields1, setSelectedFields1] = useState([]);
  const [multiplier1Error, setMultiplier1Error] = useState('');

  const [searchCode2, setSearchCode2] = useState('');
  const [page2, setPage2] = useState(1);
  const [itemsPerPage2, setItemsPerPage2] = useState(5);
  const [multiplier2, setMultiplier2] = useState('');
  const [selectedFields2, setSelectedFields2] = useState([]);
  const [multiplier2Error, setMultiplier2Error] = useState('');

  // Create allFields from baseColumns and limited dynamicColumns
  const allFields = useMemo(() => {
    const baseColumns = ['code', 'description'];
  const dynamicColumns = Array.isArray(styleCollection)
    ? styleCollection
      .slice(0, 3)
      .map(style => style?.style)
      .filter(v => typeof v === 'string' && v.trim() !== '') // ensure valid strings only
    : [];
    return [...baseColumns, ...dynamicColumns];
  }, [styleCollection]);

  // Set default selected fields when allFields is ready (only base columns + 2 styles max)
  useEffect(() => {
    if (allFields.length > 0) {
      // Limit default selection to CODE, DESCRIPTION and first 2 styles
      const defaultFields = allFields.slice(0, 4); // code, description, style1, style2
      setSelectedFields1(defaultFields);
      setSelectedFields2(defaultFields);
    }
  }, [allFields]);

  // Fetch catalog data for the manufacturer
  useEffect(() => {
    const fetchCatalogData = async () => {
      if (!manufacturer?.id) {
        setCatalogData([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/catalog`, {
          headers: getAuthHeaders(),
          params: {
            page: 1,
            limit: 100, // Get first 100 items for the sample table
            sortBy: 'code',
            sortOrder: 'ASC'
          }
        });
        
        if (response.data && Array.isArray(response.data.catalogData)) {
          setCatalogData(response.data.catalogData);
        } else {
          setCatalogData([]);
        }
      } catch (error) {
        console.error('Error fetching catalog data:', error);
        setCatalogData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, [manufacturer?.id]);

  // Fetch styleCollection
  useEffect(() => {
    const fetchStyles = async () => {
      if (!manufacturer?.id) return;
      try {
        const res = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/styles`, {
          headers: getAuthHeaders()
        });
        setStyleCollection(res.data);
      } catch (error) {
        console.error('Error fetching styles:', error);
      }
    };

    fetchStyles();
  }, [manufacturer?.id]);

  // Set multipliers initially
  useEffect(() => {
    if (manufacturer?.costMultiplier) {
      setMultiplier1(manufacturer.costMultiplier);
      setMultiplier2(manufacturer.costMultiplier);
    }
  }, [manufacturer]);

  const toggleField = (field, selectedFieldsSetter, selectedFields) => {
    if (typeof field !== 'string' || field.trim() === '') return; // ignore invalid fields
    selectedFieldsSetter(prev => {
      let updated;

      if (prev.includes(field)) {
        // Remove field if already selected
        updated = prev.filter(f => f !== field);
      } else {
        // Add new field, but limit to maximum 6 columns total to prevent horizontal overflow
        if (prev.length >= 6) {
          // Replace the last non-essential column with the new one
          const baseColumns = ['code', 'description'];
          const nonBaseColumns = prev.filter(f => !baseColumns.includes(f));
          if (nonBaseColumns.length > 0) {
            // Remove the last style column and add the new one
            updated = [...baseColumns, ...nonBaseColumns.slice(0, -1), field];
          } else {
            updated = prev; // Don't add if already at limit with base columns
          }
        } else {
          updated = [...prev, field];
        }
      }

      // Ensure CODE and DESCRIPTION are always first and in order
      const final = ['code', 'description', ...updated.filter(f => f !== 'code' && f !== 'description')];
      return final;
    });
  };


  // Filter and paginate data
  const filterData = (searchCode) =>
    catalogData?.filter(item =>
      typeof item.code === 'string' &&
      item.code.toLowerCase().includes(searchCode.toLowerCase())
    ) || [];

  const filteredData1 = filterData(searchCode1);
  const totalPages1 = Math.ceil(filteredData1.length / itemsPerPage1);
  const paginatedData1 = filteredData1.slice((page1 - 1) * itemsPerPage1, page1 * itemsPerPage1);

  const filteredData2 = filterData(searchCode2);
  const totalPages2 = Math.ceil(filteredData2.length / itemsPerPage2);
  const paginatedData2 = filteredData2.slice((page2 - 1) * itemsPerPage2, page2 * itemsPerPage2);

  // Reset pages on filter/column changes
  useEffect(() => { setPage1(1); }, [searchCode1, itemsPerPage1, selectedFields1]);
  useEffect(() => { setPage2(1); }, [searchCode2, itemsPerPage2, selectedFields2]);

  // Shared render functions
  const renderDropdown = (selectedFields, toggleHandler, prefix) => (
    <div className="d-flex align-items-center">
      <CDropdown className="ms-2">
        <CDropdownToggle color="secondary" variant="outline" size="sm">
          {selectedFields.length > 0
            ? selectedFields
                .slice(0, 3)
                .map(f => (typeof f === 'string' && f ? f.toUpperCase() : t('common.na', 'N/A')))
                .join(', ')
            : t('common.displayedColumns', 'Displayed Columns')}
          {selectedFields.length > 3 && '...'}
        </CDropdownToggle>
        <CDropdownMenu style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <CDropdownItem component="div" className="small text-muted px-3 py-1">
            CODE and DESCRIPTION are always shown. Max 6 columns total.
          </CDropdownItem>
          <hr className="dropdown-divider" />
          {allFields.map(field => {
            const isBaseColumn = ['code', 'description'].includes(field);
            return (
              <CDropdownItem key={field} component="div" className="form-check">
                <CFormCheck
                  type="checkbox"
                  id={`checkbox-${prefix}-${field}`}
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleHandler(field)}
                  disabled={isBaseColumn} // Disable base columns since they're always shown
                  label={
                    <span className={isBaseColumn ? "text-muted" : ""}>
                      {(typeof field === 'string' && field ? field.toUpperCase() : t('common.na', 'N/A'))} {isBaseColumn ? "(always shown)" : ""}
                    </span>
                  }
                />
              </CDropdownItem>
            );
          })}
        </CDropdownMenu>
      </CDropdown>
    </div>
  );

  const renderTable = (data, selectedFields, multiplierCalc) => (
    <div>
      <div className="mb-2 small text-muted">
        Showing {Math.min(data.length, 5)} sample items with price comparison across different styles
      </div>
      <CTable striped hover responsive>
        <CTableHead>
          <CTableRow>
      {selectedFields.map((field, fieldIndex) => (
              <CTableDataCell key={`header-${fieldIndex}`} style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
        {typeof field === 'string' && field ? field.toUpperCase() : t('common.na', 'N/A')}
              </CTableDataCell>
            ))}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {loading ? (
            <CTableRow>
              <CTableDataCell colSpan={selectedFields.length} className="text-center">
                {t('common.loading', 'Loading...')}
              </CTableDataCell>
            </CTableRow>
          ) : data.length > 0 ? (
            data.map(item => (
              <CTableRow key={item.id}>
                {selectedFields.map((field, fieldIndex) => (
                  <CTableDataCell key={`${item.id}-${fieldIndex}`}>
                    {typeof field === 'string' && ['code', 'description'].includes(field)
                      ? item[field]
                      : (typeof field === 'string' && item.style?.toLowerCase() === field.toLowerCase()
                        ? `$${multiplierCalc(item.price)}`
                        : '--')}
                  </CTableDataCell>

                ))}
              </CTableRow>
            ))
          ) : (
            <CTableRow>
              <CTableDataCell colSpan={selectedFields.length} className="text-center">
                {t('common.noData', 'No data found.')}
              </CTableDataCell>
            </CTableRow>
          )}
        </CTableBody>
      </CTable>
    </div>
  );

  return (
    <>
      {/* Cost Multiplier Card */}
      <CCard>
        <CCardBody>
          <p><strong>{t('settings.manufacturers.settings.costMultiplierTitle', 'Your cost multiplier')}</strong></p>
          <div className="border rounded p-2 mb-3 small" style={{ borderColor: '#0d6efd', backgroundColor: '#f0f8ff' }}>
            {t('settings.manufacturers.settings.costMultiplierHelp', 'Cost multiplier controls the price you pay to manufacturer. You can see your cost in Proposal when you turn off Customer multiplier.')}
          </div>
          <CFormInput
            value={multiplier1}
            onChange={e => {
              const value = e.target.value;
              setMultiplier1(value);
              setMultiplier1Error(value.trim() === '' ? t('settings.users.form.validation.required') : '');
            }}
            placeholder={t('settings.manufacturers.placeholders.costMultiplier', '1.000')}
            style={{ width: '100px' }}
            className="mb-2"
          />
          {multiplier1Error && <div className="text-danger mt-1 mb-2">{multiplier1Error}</div>}

          <CInputGroup className="mb-3">
            <CFormInput
              value={searchCode1}
              onChange={e => setSearchCode1(e.target.value)}
              placeholder={t('common.search') + '...'}
            />
            <CInputGroupText><i className="bi bi-search"></i></CInputGroupText>
            {renderDropdown(selectedFields1, field => toggleField(field, setSelectedFields1, selectedFields1), '1')}
          </CInputGroup>

          {renderTable(paginatedData1, selectedFields1, value =>
            (parseFloat(value) * parseFloat(multiplier1 || 1)).toFixed(2)
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>{t('common.pageOf', { page: page1, total: totalPages1, defaultValue: 'Page {{page}} of {{total}}' })}</div>
            <div>
              {t('common.itemsPerPage', 'Items per page:')}
              <CFormSelect
                size="sm"
                className="d-inline w-auto ms-2"
                value={itemsPerPage1}
                onChange={e => setItemsPerPage1(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </CFormSelect>
            </div>
            <PaginationControls
              page={page1}
              totalPages={totalPages1}
              goPrev={() => setPage1(p => Math.max(1, p - 1))}
              goNext={() => setPage1(p => Math.min(totalPages1, p + 1))}
            />
          </div>
        </CCardBody>
      </CCard>

      {/* Customer Multiplier Card */}
      <CCard className="mt-4">
        <CCardBody>
          <p><strong>{t('settings.manufacturers.settings.customerMultiplierTitle', 'Customer price multiplier')}</strong></p>
          <div className="border rounded p-2 mb-3 small" style={{ borderColor: '#198754', backgroundColor: '#e9fbe5' }}>
            {t('settings.manufacturers.settings.customerMultiplierHelp', 'Customer price multiplier controls the price at which you sell to your customers. This is what determines your profit.')}
          </div>
          <CFormInput
            value={multiplier2}
            onChange={e => {
              const value = e.target.value;
              setMultiplier2(value);
              setMultiplier2Error(value.trim() === '' ? t('settings.users.form.validation.required') : '');
            }}
            placeholder={t('settings.manufacturers.placeholders.costMultiplier', '1.000')}
            style={{ width: '100px' }}
            className="mb-2"
          />
          {multiplier2Error && <div className="text-danger mt-1 mb-2">{multiplier2Error}</div>}

          <CInputGroup className="mb-3">
            <CFormInput
              value={searchCode2}
              onChange={e => setSearchCode2(e.target.value)}
              placeholder={t('common.search') + '...'}
            />
            <CInputGroupText><i className="bi bi-search"></i></CInputGroupText>
            {renderDropdown(selectedFields2, field => toggleField(field, setSelectedFields2, selectedFields2), '2')}
          </CInputGroup>

          {renderTable(paginatedData2, selectedFields2, value =>
            (parseFloat(value) * parseFloat(multiplier1 || 1) * parseFloat(multiplier2 || 1)).toFixed(2)
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>{t('common.pageOf', { page: page2, total: totalPages2, defaultValue: 'Page {{page}} of {{total}}' })}</div>
            <div>
              {t('common.itemsPerPage', 'Items per page:')}
              <CFormSelect
                size="sm"
                className="d-inline w-auto ms-2"
                value={itemsPerPage2}
                onChange={e => setItemsPerPage2(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </CFormSelect>
            </div>
            <PaginationControls
              page={page2}
              totalPages={totalPages2}
              goPrev={() => setPage2(p => Math.max(1, p - 1))}
              goNext={() => setPage2(p => Math.min(totalPages2, p + 1))}
            />
          </div>
        </CCardBody>
      </CCard>
    </>
  );
};

export default SettingsTab;
