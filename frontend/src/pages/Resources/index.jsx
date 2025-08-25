import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axiosInstance from '../../helpers/axiosInstance';
import {
    CContainer,
    CRow,
    CCol,
    CCard,
    CCardBody,
    CCardHeader,
    CButton,
    CForm,
    CFormInput,
    CFormSelect,
    CListGroup,
    CListGroupItem,
    CBadge,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CSpinner,
    CFormLabel,
    CInputGroup,
    CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
    cilLink,
    cilFolder,
    cilPlus,
    cilPencil,
    cilTrash,
    cilMagnifyingGlass,
    cilGlobeAlt,
    cilHome,
    cilBook,
    
    
    cilDescription,
    cilChart,
    cilCloudUpload
} from '@coreui/icons';
import withContractorScope from '../../components/withContractorScope';

// Externalized input components to prevent remount/focus loss on keystrokes
const CustomFormInput = ({ 
    label, 
    name, 
    type = "text", 
    required = false, 
    icon = null,
    placeholder = "",
    value,
    onChange,
    ...props 
}) => (
    <div className="mb-3">
        <CFormLabel className="fw-medium text-dark mb-2">
            {label}
            {required && <span className="text-danger ms-1">*</span>}
        </CFormLabel>
        <CInputGroup>
            {icon && (
                <CInputGroupText 
                    style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        border: '1px solid #e3e6f0',
                        borderRight: 'none',
                        borderRadius: '10px 0 0 10px'
                    }}
                >
                    <CIcon icon={icon} size="sm" style={{ color: '#6c757d' }} />
                </CInputGroupText>
            )}
            <CFormInput
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: icon ? '0 10px 10px 0' : '10px',
                    fontSize: '14px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease',
                    borderLeft: icon ? 'none' : '1px solid #e3e6f0'
                }}
                {...props}
            />
        </CInputGroup>
    </div>
);

const CustomFormSelect = ({ 
    label, 
    name, 
    required = false, 
    icon = null,
    children,
    value,
    onChange,
    ...props 
}) => (
    <div className="mb-3">
        <CFormLabel className="fw-medium text-dark mb-2">
            {label}
            {required && <span className="text-danger ms-1">*</span>}
        </CFormLabel>
        <CInputGroup>
            {icon && (
                <CInputGroupText 
                    style={{ 
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        border: '1px solid #e3e6f0',
                        borderRight: 'none',
                        borderRadius: '10px 0 0 10px'
                    }}
                >
                    <CIcon icon={icon} size="sm" style={{ color: '#6c757d' }} />
                </CInputGroupText>
            )}
            <CFormSelect
                name={name}
                value={value}
                onChange={onChange}
                style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: icon ? '0 10px 10px 0' : '10px',
                    fontSize: '14px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease',
                    borderLeft: icon ? 'none' : '1px solid #e3e6f0'
                }}
                {...props}
            >
                {children}
            </CFormSelect>
        </CInputGroup>
    </div>
);

const Resources = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
    const { t } = useTranslation();
    const [links, setLinks] = useState([]);
    const [files, setFiles] = useState([]);
    const [filteredLinks, setFilteredLinks] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [linkTypeFilter, setLinkTypeFilter] = useState('all');
    const [fileTypeFilter, setFileTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [editingFile, setEditingFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [linkForm, setLinkForm] = useState({
        title: '',
        url: '',
        type: 'external'
    });

    const [fileForm, setFileForm] = useState({
        name: '',
        file: null,
        type: 'pdf'
    });

    const linkTypes = [
        { value: 'external', label: t('resources.linkType.external'), icon: cilGlobeAlt },
        { value: 'internal', label: t('resources.linkType.internal'), icon: cilHome },
        { value: 'document', label: t('resources.linkType.document'), icon: cilBook },
        { value: 'help', label: t('resources.linkType.help'), icon: cilBook },
    ];

    const fileTypes = [
        { value: 'pdf', label: t('resources.fileType.pdf'), icon: cilDescription },
        { value: 'excel', label: t('resources.fileType.excel'), icon: cilChart },
        { value: 'word', label: t('resources.fileType.word'), icon: cilDescription },
        { value: 'video', label: t('resources.fileType.video'), icon: cilDescription },
        { value: 'image', label: t('resources.fileType.image'), icon: cilDescription },
        { value: 'other', label: t('resources.fileType.other'), icon: cilDescription },
    ];

    const getTypeColor = (type) => {
        switch (type) {
            case 'external': return 'primary';
            case 'internal': return 'success';
            case 'document': return 'info';
            case 'help': return 'warning';
            case 'pdf': return 'danger';
            case 'excel': return 'success';
            case 'word': return 'primary';
            case 'video': return 'dark';
            case 'image': return 'info';
            default: return 'secondary';
        }
    };

    const getTypeIcon = (type, isFile = false) => {
        if (isFile) {
            const fileType = fileTypes.find(t => t.value === type);
            return fileType ? fileType.icon : cilDescription;
        } else {
            const linkType = linkTypes.find(t => t.value === type);
            return linkType ? linkType.icon : cilLink;
        }
    };

    const resetLinkForm = () => {
        setLinkForm({ title: '', url: '', type: 'external' });
        setEditingLink(null);
    };

    const resetFileForm = () => {
        setFileForm({ name: '', file: null, type: 'pdf' });
        setEditingFile(null);
    };

    // API functions
    const fetchResources = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get('/api/resources?scope=contractor', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setLinks(response.data.data.links);
                setFiles(response.data.data.files);
                setFilteredLinks(response.data.data.links);
                setFilteredFiles(response.data.data.files);
            }
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter functions
    const applyFilters = () => {
        let filteredLinksResult = links;
        let filteredFilesResult = files;

        // Apply search term
        if (searchTerm) {
            filteredLinksResult = filteredLinksResult.filter(link =>
                link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                link.url.toLowerCase().includes(searchTerm.toLowerCase())
            );
            filteredFilesResult = filteredFilesResult.filter(file =>
                file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply type filters
        if (linkTypeFilter !== 'all') {
            filteredLinksResult = filteredLinksResult.filter(link => link.type === linkTypeFilter);
        }
        if (fileTypeFilter !== 'all') {
            filteredFilesResult = filteredFilesResult.filter(file => file.type === fileTypeFilter);
        }

        setFilteredLinks(filteredLinksResult);
        setFilteredFiles(filteredFilesResult);
    };

    // Effects
    useEffect(() => {
        if (isContractor) {
            fetchResources();
        }
    }, [isContractor]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, linkTypeFilter, fileTypeFilter, links, files]);

    const handleAddLink = () => {
        // For contractors, this should be disabled or hidden
        // Only admins can add resources
    };

    const handleEditLink = (link) => {
        // For contractors, this should be disabled or hidden
    };

    const handleDeleteLink = (id) => {
        // For contractors, this should be disabled or hidden
    };

    const handleSaveLink = () => {
        // For contractors, this should be disabled or hidden
    };

    const handleAddFile = () => {
        // For contractors, this should be disabled or hidden
    };

    const handleEditFile = (file) => {
        // For contractors, this should be disabled or hidden
    };

    const handleDeleteFile = (id) => {
        // For contractors, this should be disabled or hidden
    };

    const handleFileChange = (event) => {
        // For contractors, this should be disabled or hidden
    };

    const handleSaveFile = () => {
        // For contractors, this should be disabled or hidden
    };

    const handleDownloadFile = (file) => {
        // Open file URL for download
        window.open(file.url, '_blank');
    };

    const ResourceCard = ({ title, icon, children, gradient, onAddClick, addButtonText, emptyStateIcon, emptyStateText, emptyStateSubtext, showAddButton = true }) => (
        <CCard className="border-0 shadow-sm mb-2 h-100" style={{ borderRadius: '16px' }}>
            <CCardHeader 
                className="border-0 pb-2"
                style={{
                    background: gradient,
                    borderRadius: '5px 5px 0 0',
                    padding: '1.5rem'
                }}
            >
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <CIcon icon={icon} size="lg" className="text-white" />
                        </div>
                        <div>
                            <h5 className="text-white mb-1 fw-bold">{title}</h5>
                            <p className="text-white-50 mb-0 small">{t('resources.manage', { title })}</p>
                        </div>
                    </div>
                    {showAddButton && onAddClick && (
                        <CButton
                            color="light"
                            className="shadow-sm fw-semibold"
                            onClick={onAddClick}
                            style={{
                                borderRadius: '12px',
                                border: 'none',
                                padding: '8px 20px',
                                minWidth: '120px'
                            }}
                        >
                            <CIcon icon={cilPlus} className="me-2" size="sm" />
                            {addButtonText}
                        </CButton>
                    )}
                </div>
            </CCardHeader>
            <CCardBody className="p-0">
                {children}
            </CCardBody>
        </CCard>
    );

    const EmptyState = ({ icon, title, subtitle, onAddClick, buttonText, showButton = true }) => (
        <div className="text-center py-5">
            <div 
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#f1f5f9',
                    opacity: 0.7
                }}
            >
                <CIcon icon={icon} size="xl" style={{ color: '#94a3b8' }} />
            </div>
            <h6 className="text-muted mb-2">{title}</h6>
            <p className="text-muted small mb-3">{subtitle}</p>
            {showButton && onAddClick && (
                <CButton
                    variant="outline"
                    color="primary"
                    onClick={onAddClick}
                    style={{
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0',
                        padding: '8px 20px'
                    }}
                >
                    <CIcon icon={cilPlus} className="me-2" size="sm" />
                    {buttonText}
                </CButton>
            )}
        </div>
    );

    const ResourceItem = ({ item, isFile = false, onEdit, onDelete, onDownload, isContractor = false }) => (
        <CListGroupItem 
            className="border-0 px-4 py-3"
            style={{ 
                borderBottom: '1px solid #f1f5f9',
                transition: 'all 0.2s ease'
            }}
        >
            <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-start flex-grow-1">
                    <div 
                        className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: `var(--cui-${getTypeColor(item.type)}-100, #f1f5f9)`,
                            color: `var(--cui-${getTypeColor(item.type)}, #6366f1)`
                        }}
                    >
                        <CIcon icon={getTypeIcon(item.type, isFile)} size="sm" />
                    </div>
                    <div className="flex-grow-1 min-width-0">
                        <div className="d-flex align-items-center mb-2 flex-wrap gap-2">
                            <h6 className="mb-0 fw-semibold text-dark text-truncate">
                                {isFile ? (item.original_name || item.name) : item.title}
                            </h6>
                            <CBadge 
                                color={getTypeColor(item.type)} 
                                shape="rounded-pill" 
                                className="small"
                            >
                                {item.type}
                            </CBadge>
                        </div>
                        {!isFile && (
                            <p className="text-muted small mb-1 text-truncate">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                    {item.url}
                                </a>
                            </p>
                        )}
                        {isFile && (
                            <p className="text-muted small mb-1">
                                {t('resources.size')}: {item.size}
                            </p>
                        )}
                        <small className="text-muted">
                            {isFile ? t('resources.uploaded') : t('resources.added')}: {new Date(isFile ? item.uploadedAt : item.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                <div className="d-flex gap-1 ms-2 flex-shrink-0">
                    {isFile && onDownload && (
                        <CButton
                            size="sm"
                            variant="ghost"
                            color="success"
                            onClick={() => onDownload(item)}
                            style={{ 
                                borderRadius: '8px', 
                                padding: '6px 8px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            className="hover-shadow"
                            title={t('resources.downloadFile')}
                        >
                            <CIcon icon={cilGlobeAlt} size="sm" />
                        </CButton>
                    )}
                    {!isFile && !isContractor && (
                        <CButton
                            size="sm"
                            variant="ghost"
                            color="info"
                            onClick={() => window.open(item.url, '_blank')}
                            style={{ 
                                borderRadius: '8px', 
                                padding: '6px 8px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            className="hover-shadow"
                            title={t('resources.openLink')}
                        >
                            <CIcon icon={cilGlobeAlt} size="sm" />
                        </CButton>
                    )}
                    {!isContractor && onEdit && (
                        <CButton
                            size="sm"
                            variant="ghost"
                            color="primary"
                            onClick={() => onEdit(item)}
                            style={{ 
                                borderRadius: '8px', 
                                padding: '6px 8px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            className="hover-shadow"
                            title={t('common.edit')}
                        >
                            <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                    )}
                    {!isContractor && onDelete && (
                        <CButton
                            size="sm"
                            variant="ghost"
                            color="danger"
                            onClick={() => onDelete(item.id)}
                            style={{ 
                                borderRadius: '8px', 
                                padding: '6px 8px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s ease'
                            }}
                            className="hover-shadow"
                            title={t('common.delete')}
                        >
                            <CIcon icon={cilTrash} size="sm" />
                        </CButton>
                    )}
                </div>
            </div>
        </CListGroupItem>
    );

    

    const ModalComponent = ({ visible, onClose, title, children, onSave, saveButtonText, isLoading }) => (
        <CModal 
            visible={visible} 
            onClose={onClose} 
            size="lg"
            className="modern-modal"
        >
            <CModalHeader 
                style={{ 
                    borderRadius: '16px 16px 0 0', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                }}
            >
                <CModalTitle className="fw-bold text-white">
                    {title}
                </CModalTitle>
            </CModalHeader>
            <CModalBody className="p-4" style={{ backgroundColor: '#fafbfc' }}>
                {children}
            </CModalBody>
            <CModalFooter 
                style={{ 
                    borderRadius: '0 0 16px 16px', 
                    backgroundColor: '#fafbfc',
                    border: 'none',
                    padding: '1.5rem'
                }}
            >
                <CButton
                    color="light"
                    onClick={onClose}
                    style={{ 
                        borderRadius: '12px', 
                        fontWeight: '600',
                        padding: '8px 20px',
                        border: '1px solid #e3e6f0'
                    }}
                >
                    {t('common.cancel')}
                </CButton>
                <CButton
                    style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        padding: '8px 24px'
                    }}
                    className="text-white"
                    onClick={onSave}
                    disabled={isLoading}
                >
                    {isLoading && <CSpinner size="sm" className="me-2" />}
                    {saveButtonText}
                </CButton>
            </CModalFooter>
        </CModal>
    );

    return (
        <CContainer fluid className="p-2 p-md-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <style>
                {`
                    .hover-shadow:hover {
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                        transform: translateY(-1px);
                    }
                    
                    .modern-modal .modal-content {
                        border-radius: 16px !important;
                        border: none !important;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    }
                    
                    @media (max-width: 768px) {
                        .d-flex.justify-content-between.align-items-center.flex-wrap {
                            flex-direction: column;
                            align-items: flex-start !important;
                            gap: 1rem;
                        }
                        
                        .d-flex.gap-1.ms-2.flex-shrink-0 {
                            margin-left: 0 !important;
                            margin-top: 0.5rem;
                        }
                        
                        .min-width-0 {
                            min-width: 0;
                            width: 100%;
                        }
                        
                        .text-truncate {
                            max-width: 200px;
                        }
                    }
                    
                    @media (max-width: 576px) {
                        .px-4 {
                            padding-left: 1rem !important;
                            padding-right: 1rem !important;
                        }
                        
                        .flex-wrap.gap-3 > div:first-child {
                            width: 100%;
                        }
                        
                        .flex-wrap.gap-3 > div:last-child {
                            width: 100%;
                            text-align: center;
                        }
                    }
                `}
            </style>

            {/* Header Section */}
            <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '5px' }}>
                <CCardBody className="py-4 ">
                    <div className="d-flex align-items-center">
                        <div 
                            className="rounded-circle d-flex align-items-center justify-content-center me-3"
                            style={{
                                width: '60px',
                                height: '60px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <CIcon icon={cilFolder} size="xl" className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white mb-1 fw-bold">{t('nav.resources')}</h2>
                            <p className="text-white-50 mb-0">{isContractor ? t('resources.headerContractor') : t('resources.headerAdmin')}</p>
                        </div>
                    </div>
                </CCardBody>
            </CCard>

            {/* Search and Filter Section */}
            <CCard className="border-0 shadow-sm mb-4">
                <CCardBody>
                    <CRow className="g-3">
                        <CCol md={6}>
                            <CInputGroup>
                                <CInputGroupText>
                                    <CIcon icon={cilMagnifyingGlass} />
                                </CInputGroupText>
                                <CFormInput
                                    placeholder={t('resources.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </CInputGroup>
                        </CCol>
                        <CCol md={3}>
                            <CFormSelect
                                value={linkTypeFilter}
                                onChange={(e) => setLinkTypeFilter(e.target.value)}
                            >
                                <option value="all">{t('resources.allLinkTypes')}</option>
                                {linkTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </CFormSelect>
                        </CCol>
                        <CCol md={3}>
                            <CFormSelect
                                value={fileTypeFilter}
                                onChange={(e) => setFileTypeFilter(e.target.value)}
                            >
                                <option value="all">{t('resources.allFileTypes')}</option>
                                {fileTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </CFormSelect>
                        </CCol>
                    </CRow>
                </CCardBody>
            </CCard>

            <CRow className="g-4">
                {/* Loading State */}
                {loading ? (
                        <CCol className="text-center py-5">
                        <CSpinner color="primary" />
                            <div className="mt-3 text-muted">{t('resources.loading')}</div>
                    </CCol>
                ) : (
                    <>
                        {/* Links Section */}
                        <CCol lg={6} className="mb-4">
                            <ResourceCard
                title={t('resources.links')}
                                icon={cilLink}
                                gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                                onAddClick={!isContractor ? handleAddLink : null}
                addButtonText={t('resources.addLink')}
                                emptyStateIcon={cilLink}
                emptyStateText={t('resources.noLinks')}
                emptyStateSubtext={isContractor ? t('resources.noLinksContractor') : t('resources.noLinksAdmin')}
                                showAddButton={!isContractor}
                            >
                                {filteredLinks.length === 0 ? (
                                    <EmptyState
                                        icon={cilLink}
                    title={t('resources.noLinks')}
                    subtitle={isContractor ? t('resources.noLinksContractor') : t('resources.noLinksAdminAlt')}
                                        onAddClick={!isContractor ? handleAddLink : null}
                    buttonText={t('resources.addFirstLink')}
                                        showButton={!isContractor}
                                    />
                                ) : (
                                    <CListGroup flush>
                                        {filteredLinks.map((link) => (
                                            <ResourceItem
                                                key={link.id}
                                                item={link}
                                                isFile={false}
                                                onEdit={!isContractor ? handleEditLink : null}
                                                onDelete={!isContractor ? handleDeleteLink : null}
                                                isContractor={isContractor}
                                            />
                                        ))}
                                    </CListGroup>
                                )}
                            </ResourceCard>
                        </CCol>

                        {/* Files Section */}
                        <CCol lg={6} className="mb-4">
                            <ResourceCard
                title={t('resources.files')}
                                icon={cilFolder}
                                gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                onAddClick={!isContractor ? handleAddFile : null}
                addButtonText={t('resources.addFile')}
                                emptyStateIcon={cilFolder}
                emptyStateText={t('resources.noFiles')}
                emptyStateSubtext={isContractor ? t('resources.noFilesContractor') : t('resources.noFilesAdmin')}
                                showAddButton={!isContractor}
                            >
                                {filteredFiles.length === 0 ? (
                                    <EmptyState
                                        icon={cilCloudUpload}
                    title={t('resources.noFiles')}
                    subtitle={isContractor ? t('resources.noFilesContractor') : t('resources.noFilesAdminAlt')}
                                        onAddClick={!isContractor ? handleAddFile : null}
                    buttonText={t('resources.uploadFirstFile')}
                                        showButton={!isContractor}
                                    />
                                ) : (
                                    <CListGroup flush>
                                        {filteredFiles.map((file) => (
                                            <ResourceItem
                                                key={file.id}
                                                item={file}
                                                isFile={true}
                                                onEdit={!isContractor ? handleEditFile : null}
                                                onDelete={!isContractor ? handleDeleteFile : null}
                                                onDownload={handleDownloadFile}
                                                isContractor={isContractor}
                                            />
                                        ))}
                                    </CListGroup>
                                )}
                            </ResourceCard>
                        </CCol>
                    </>
                )}
            </CRow>

            {/* Admin Modals - Hidden for contractors */}
            {!isContractor && (
                <>
                    {/* Link Modal */}
                    <ModalComponent
                        visible={showLinkModal}
                        onClose={() => { setShowLinkModal(false); resetLinkForm(); }}
            title={editingLink ? t('resources.editLink') : t('resources.addNewLink')}
                        onSave={handleSaveLink}
            saveButtonText={editingLink ? t('resources.updateLink') : t('resources.addLink')}
                        isLoading={isLoading}
                    >
                        <CForm>
                            <CustomFormInput
                label={t('resources.linkTitle')}
                                name="title"
                                required
                                icon={cilLink}
                placeholder={t('resources.enterLinkTitle')}
                                value={linkForm.title}
                                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                            />
                            <CustomFormInput
                label={t('resources.url')}
                                name="url"
                                type="url"
                                required
                                icon={cilGlobeAlt}
                placeholder={t('resources.urlPlaceholder')}
                                value={linkForm.url}
                                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                            />
                            <CustomFormSelect
                label={t('resources.linkType.label')}
                                name="type"
                                icon={cilBook}
                                value={linkForm.type}
                                onChange={(e) => setLinkForm({ ...linkForm, type: e.target.value })}
                            >
                                {linkTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </CustomFormSelect>
                        </CForm>
                    </ModalComponent>

                    {/* File Modal */}
                    <ModalComponent
                        visible={showFileModal}
                        onClose={() => { setShowFileModal(false); resetFileForm(); }}
            title={editingFile ? t('resources.editFile') : t('resources.uploadNewFile')}
                        onSave={handleSaveFile}
            saveButtonText={editingFile ? t('resources.updateFile') : t('resources.uploadFile')}
                        isLoading={isLoading}
                    >
                        <CForm>
                            <CustomFormInput
                label={t('resources.file')}
                                name="file"
                                type="file"
                                required={!editingFile}
                                icon={cilCloudUpload}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                            />
                            {editingFile && (
                <small className="text-muted d-block mb-3">{t('resources.leaveEmpty')}</small>
                            )}
                            <CustomFormInput
                label={t('resources.fileName')}
                                name="name"
                                required
                                icon={cilDescription}
                placeholder={t('resources.enterFileName')}
                                value={fileForm.name}
                                onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                            />
                            <CustomFormSelect
                label={t('resources.fileType.label')}
                                name="type"
                                icon={cilChart}
                                value={fileForm.type}
                                onChange={(e) => setFileForm({ ...fileForm, type: e.target.value })}
                            >
                                {fileTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </CustomFormSelect>
                        </CForm>
                    </ModalComponent>
                </>
            )}
        </CContainer>
    );
};

export default withContractorScope(Resources, 'resources');