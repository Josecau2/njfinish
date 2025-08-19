import { useEffect, useMemo, useState } from 'react';
import {
  CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableBody, CTableRow, CTableDataCell,
  CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem,
  CFormCheck, CFormSelect
} from '@coreui/react';
import PaginationControls from "../../../../components/PaginationControls";
import axiosInstance from '../../../../helpers/axiosInstance';

const SettingsTab = ({ manufacturer }) => {
  const [styleCollection, setStyleCollection] = useState([]);

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

  // Create allFields from baseColumns and dynamicColumns
  const allFields = useMemo(() => {
    const baseColumns = ['code', 'description'];
    const dynamicColumns = Array.isArray(styleCollection)
      ? styleCollection.map(style => style.style)
      : [];
    return [...baseColumns, ...dynamicColumns];
  }, [styleCollection]);

  // Fetch styleCollection
  useEffect(() => {
    const fetchStyles = async () => {
      if (!manufacturer?.id) return;
      try {
        const res = await axiosInstance.get(`/api/manufacturers/${manufacturer.id}/styles`);
        setStyleCollection(res.data);
      } catch (error) {
        console.error('Error fetching styles:', error);
      }
    };

    fetchStyles();
  }, [manufacturer?.id]);

  // Set default selected fields when allFields is ready
  useEffect(() => {
    if (allFields.length > 0) {
      setSelectedFields1(allFields);
      setSelectedFields2(allFields);
    }
  }, [allFields]);

  // Set multipliers initially
  useEffect(() => {
    if (manufacturer?.costMultiplier) {
      setMultiplier1(manufacturer.costMultiplier);
      setMultiplier2(manufacturer.costMultiplier);
    }
  }, [manufacturer]);

  const toggleField = (field, selectedFieldsSetter, selectedFields) => {
    selectedFieldsSetter(prev => {
      let updated;

      if (prev.includes(field)) {
        // Remove field if already selected
        updated = prev.filter(f => f !== field);
      } else {
        // Add new field (except code/description, which we fix anyway)
        updated = [...prev, field];
      }

      // Ensure CODE and DESCRIPTION are always first and in order
      const final = ['code', 'description', ...updated.filter(f => f !== 'code' && f !== 'description')];
      return final;
    });
  };


  // Filter and paginate data
  const filterData = (searchCode) =>
    manufacturer?.catalogData?.filter(item =>
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
    <CDropdown className="ms-2">
      <CDropdownToggle color="secondary" variant="outline">
        {selectedFields.length > 0
          ? selectedFields.slice(0, 4).map(f => f.toUpperCase()).join(', ')
          : 'Displayed Columns'}
        {selectedFields.length > 4 && '...'}
      </CDropdownToggle>
      <CDropdownMenu style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {allFields.map(field => (
          <CDropdownItem key={field} component="div" className="form-check">
            <CFormCheck
              type="checkbox"
              id={`checkbox-${prefix}-${field}`}
              checked={selectedFields.includes(field)}
              onChange={() => toggleHandler(field)}
              label={field.toUpperCase()}
            />
          </CDropdownItem>
        ))}
      </CDropdownMenu>
    </CDropdown>
  );

  const renderTable = (data, selectedFields, multiplierCalc) => (
    <CTable striped hover responsive>
      <CTableHead>
        <CTableRow>
          {selectedFields.map(field => (
            <CTableDataCell key={field} style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
              {field.toUpperCase()}
            </CTableDataCell>
          ))}
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {data.length > 0 ? (
          data.map(item => (
            <CTableRow key={item.id}>
              {selectedFields1.map(field => (
                <CTableDataCell key={field}>
                  {['code', 'description'].includes(field)
                    ? item[field]
                    : (item.style?.toLowerCase() === field.toLowerCase()
                      ? `$${multiplierCalc(item.price)}`
                      : '--')}
                </CTableDataCell>

              ))}
            </CTableRow>
          ))
        ) : (
          <CTableRow>
            <CTableDataCell colSpan={selectedFields.length} className="text-center">
              No data found.
            </CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  );

  return (
    <>
      {/* Cost Multiplier Card */}
      <CCard>
        <CCardBody>
          <p><strong>Your cost multiplier</strong></p>
          <div className="border rounded p-2 mb-3 small" style={{ borderColor: '#0d6efd', backgroundColor: '#f0f8ff' }}>
            Cost multiplier controls the price you pay to manufacturer. You can see your cost in Proposal when you turn off Customer multiplier.
          </div>
          <CFormInput
            value={multiplier1}
            onChange={e => {
              const value = e.target.value;
              setMultiplier1(value);
              setMultiplier1Error(value.trim() === '' ? 'Cost multiplier is required' : '');
            }}
            placeholder="1.000"
            style={{ width: '100px' }}
            className="mb-2"
          />
          {multiplier1Error && <div className="text-danger mt-1 mb-2">{multiplier1Error}</div>}

          <CInputGroup className="mb-3">
            <CFormInput
              value={searchCode1}
              onChange={e => setSearchCode1(e.target.value)}
              placeholder="Enter part code..."
            />
            <CInputGroupText><i className="bi bi-search"></i></CInputGroupText>
            {/* {renderDropdown(selectedFields1, field => toggleField(field, setSelectedFields1, selectedFields1), '1')} */}
          </CInputGroup>

          {renderTable(paginatedData1, selectedFields1, value =>
            (parseFloat(value) * parseFloat(multiplier1 || 1)).toFixed(2)
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>Page {page1} of {totalPages1}</div>
            <div>
              Items per page:
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
          <p><strong>Customer price multiplier</strong></p>
          <div className="border rounded p-2 mb-3 small" style={{ borderColor: '#198754', backgroundColor: '#e9fbe5' }}>
            Customer price multiplier controls the price at which you sell to your customers. This is what determines your profit.
          </div>
          <CFormInput
            value={multiplier2}
            onChange={e => {
              const value = e.target.value;
              setMultiplier2(value);
              setMultiplier2Error(value.trim() === '' ? 'Multiplier is required' : '');
            }}
            placeholder="1.000"
            style={{ width: '100px' }}
            className="mb-2"
          />
          {multiplier2Error && <div className="text-danger mt-1 mb-2">{multiplier2Error}</div>}

          <CInputGroup className="mb-3">
            <CFormInput
              value={searchCode2}
              onChange={e => setSearchCode2(e.target.value)}
              placeholder="Enter part code..."
            />
            <CInputGroupText><i className="bi bi-search"></i></CInputGroupText>
            {/* {renderDropdown(selectedFields2, field => toggleField(field, setSelectedFields2, selectedFields2), '2')} */}
          </CInputGroup>

          {renderTable(paginatedData2, selectedFields2, value =>
            (parseFloat(value) * parseFloat(multiplier1 || 1) * parseFloat(multiplier2 || 1)).toFixed(2)
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>Page {page2} of {totalPages2}</div>
            <div>
              Items per page:
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
