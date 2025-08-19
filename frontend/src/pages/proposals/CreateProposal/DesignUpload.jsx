import React, { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CNav,
  CNavItem,
  CNavLink,
  CButton,
  CFormInput,
  CSpinner,
} from '@coreui/react'
import axiosInstance from '../../../helpers/axiosInstance';

const DesignImportStep = ({ updateFormData, manufacturerData, onStyleSelect, formData, hideBack, prevStep }) => {

  const api_url = import.meta.env.VITE_API_URL;
  const [activeTab, setActiveTab] = useState('import')
  const [searchTerm, setSearchTerm] = useState("")
  const [hoveredId, setHoveredId] = useState(null)
  const [manufacturerCollections, setManufacturerCollections] = useState([]);

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    updateFormData({ designFile: file })
  }

  // const filteredCollections = manufacturerData?.collections.filter(c =>
  //   c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   c.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  // )
 const filteredCollections = manufacturerCollections?.length
  ? Array.from(
      new Map(
        manufacturerCollections
          .flatMap(catalog =>
            catalog.styleVariants?.map(style => ({
              ...style,
              catalogName: catalog.style,
              catalogId: catalog.id,
            })) || []
          )
          .map(item => [
            // Use composite key to deduplicate
            `${item.catalogName}_${item.shortName}`,
            item
          ])
      ).values()
    ).filter(style =>
      style.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  useEffect(() => {
    // Assuming we fetch collection only for the first manufacturer

    const selectedManufacturerId = formData.manufacturersData?.[0]?.manufacturer;
    if (selectedManufacturerId) {
      fetchManufacturerCollection(selectedManufacturerId);
    }
  }, [formData]);

  const fetchManufacturerCollection = async (manufacturerId) => {
    try {
      const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styleswithcatalog`);
      setManufacturerCollections(response.data); // assuming array
    } catch (error) {
      console.error('Error fetching manufacturer collection', error);
    }
  };


  return (
    <div className="w-100">
      <CCard className="my-4 shadow-sm w-100">
        <CCardBody className="p-4">
          <div className="d-flex justify-content-between">
            <h5 className="mb-4 text-dark fw-semibold">Design Import</h5>

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

          <CNav variant="tabs" role="tablist" className="mb-4">
            <CNavItem>
              <CNavLink
                active={activeTab === 'import'}
                onClick={() => handleTabSelect('import')}
                style={{ cursor: 'pointer' }}
              >
                Import 2020 Design
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'manual'}
                onClick={() => handleTabSelect('manual')}
                style={{ cursor: 'pointer' }}
              >
                Select Style & Enter Parts Manually
              </CNavLink>
            </CNavItem>
          </CNav>

          {activeTab === 'import' ? (
            <div className="text-center py-5">
              <p className="text-muted mb-4">Supported file types: <strong>.TXT</strong>, <strong>.CSV</strong></p>

              <div
                className="upload-area p-5 border border-dashed rounded mb-4 bg-light d-flex flex-column align-items-center justify-content-center"
                style={{ cursor: 'pointer' }}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <i className="bi bi-cloud-upload fs-1 text-muted mb-3"></i>
                <p className="text-muted mb-2">Select the exported design file</p>
                <CButton color="success" onClick={() => document.getElementById('fileInput').click()}>
                  Select a File
                </CButton>
                <CFormInput
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept=".txt,.csv"
                />
              </div>

              <p className="text-primary mb-2" style={{ cursor: 'pointer' }} onClick={() => handleTabSelect('manual')}>
                I don’t have a 2020 design. Let me enter parts manually.
              </p>

              <CButton color="link" className="text-primary p-0">
                <i className="bi bi-question-circle me-1"></i> How to export a design file?
              </CButton>
            </div>
          ) : (
            // filteredCollections &&
            //   filteredCollections.length == 0 ? (
            //   <div className="text-center py-5">
            //     <h6 className="text-muted mb-3">Manual Entry</h6>
            //     <p className="text-muted">You can manually select cabinet styles and enter individual parts here.</p>
            //     <p className="text-muted">This section will guide you through step-by-step inputs.</p>
            //     <CButton color="info" variant="outline" size="sm" onClick={() => alert('To be implemented')}>
            //       Simulate Manual Form
            //     </CButton>
            //   </div>
            // ) : (
              <div className="text-center py-5">
                <div className="mb-4 d-flex justify-content-center">
                  <CFormInput
                    placeholder="Search Style..."
                    style={{ maxWidth: 300 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-4">
                  <div className="d-flex flex-wrap justify-content-center gap-4">
                    {filteredCollections?.map((style) => (
                      <div
                        key={style.catalog_id}
                        className="position-relative text-center"
                        style={{ width: 100, cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredId(style.catalog_id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onStyleSelect(style.catalog_id)}
                      >
                        <div
                          className="collection-hover border rounded shadow-sm position-relative"
                          style={{
                            overflow: 'hidden',
                            borderRadius: '8px',
                            transition: 'transform 0.3s ease',
                          }}
                        >
                          <img
                            // src={style.image}
                            src={
                              style.image
                                ? `${api_url}/uploads/manufacturer_catalogs/${style.image}`
                                : "/images/nologo.png"
                            }
                            alt={style.shortName}
                            style={{
                              width: '100%',
                              height: 210,
                              objectFit: 'cover',
                              borderRadius: '8px',
                              transition: 'transform 0.3s ease',
                              transform: hoveredId === style.catalog_id ? 'scale(1.05)' : 'scale(1)',
                            }}
                            className="img-fluid"
                          />
                          <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: '#fff',
                              opacity: hoveredId === style.catalog_id ? 1 : 0,
                              transition: 'opacity 0.3s ease',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              borderRadius: '8px',
                            }}
                          >
                            {style.catalogName || 'No Name'}
                          </div>
                        </div>
                        <div className="mt-2 text-muted fw-semibold">{style.shortName}</div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            // )
          )}

        </CCardBody>
      </CCard>
    </div>
  )
}

export default DesignImportStep
