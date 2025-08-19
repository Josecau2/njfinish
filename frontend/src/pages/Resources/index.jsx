import { useState, useEffect } from 'react';
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
    
    cilGlobeAlt,
    cilHome,
    cilBook,
    
    
    cilDescription,
    cilChart,
    cilCloudUpload
} from '@coreui/icons';

const Resources = () => {
    const [links, setLinks] = useState([
        { 
            id: 1, 
            title: "Google Drive", 
            url: "https://drive.google.com", 
            type: "external", 
            createdAt: "2025-01-15" 
        },
        { 
            id: 2, 
            title: "Internal Dashboard", 
            url: "/dashboard", 
            type: "internal", 
            createdAt: "2025-01-14" 
        },
        { 
            id: 3, 
            title: "Help Documentation", 
            url: "https://help.example.com", 
            type: "help", 
            createdAt: "2025-01-13" 
        }
    ]);
    
    const [files, setFiles] = useState([
        { 
            id: 1, 
            name: "User Manual.pdf", 
            type: "pdf", 
            size: "2.4 MB", 
            uploadedAt: "2025-01-15",
            url: "#"
        },
        { 
            id: 2, 
            name: "Sales Report.xlsx", 
            type: "excel", 
            size: "1.8 MB", 
            uploadedAt: "2025-01-14",
            url: "#"
        }
    ]);

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
        { value: 'external', label: 'External Link', icon: cilGlobeAlt },
        { value: 'internal', label: 'Internal Link', icon: cilHome },
        { value: 'document', label: 'Document', icon: cilBook },
        { value: 'help', label: 'Help/Support', icon: cilBook },
    ];

    const fileTypes = [
        { value: 'pdf', label: 'PDF Document', icon: cilDescription },
        { value: 'excel', label: 'Excel Spreadsheet', icon: cilChart },
        { value: 'word', label: 'Word Document', icon: cilDescription },
        { value: 'video', label: 'Video File', icon: cilDescription },
        { value: 'image', label: 'Image File', icon: cilDescription },
        { value: 'other', label: 'Other', icon: cilDescription },
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

    const handleAddLink = () => {
        resetLinkForm();
        setShowLinkModal(true);
    };

    const handleEditLink = (link) => {
        setLinkForm({
            title: link.title,
            url: link.url,
            type: link.type
        });
        setEditingLink(link);
        setShowLinkModal(true);
    };

    const handleDeleteLink = (linkId) => {
        setLinks(links.filter(link => link.id !== linkId));
    };

    const handleSaveLink = () => {
        if (!linkForm.title.trim() || !linkForm.url.trim()) {
            return;
        }

        setIsLoading(true);
        
        setTimeout(() => {
            if (editingLink) {
                setLinks(links.map(link => 
                    link.id === editingLink.id 
                        ? { ...editingLink, ...linkForm }
                        : link
                ));
            } else {
                const newLink = {
                    id: Date.now(),
                    ...linkForm,
                    createdAt: new Date().toISOString().split('T')[0]
                };
                setLinks([...links, newLink]);
            }
            
            resetLinkForm();
            setShowLinkModal(false);
            setIsLoading(false);
        }, 1000);
    };

    const handleAddFile = () => {
        resetFileForm();
        setShowFileModal(true);
    };

    const handleEditFile = (file) => {
        setFileForm({
            name: file.name,
            file: null,
            type: file.type
        });
        setEditingFile(file);
        setShowFileModal(true);
    };

    const handleDeleteFile = (fileId) => {
        setFiles(files.filter(file => file.id !== fileId));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const extension = file.name.split('.').pop().toLowerCase();
            let type = 'other';

            if (['pdf'].includes(extension)) type = 'pdf';
            else if (['xlsx', 'xls', 'csv'].includes(extension)) type = 'excel';
            else if (['docx', 'doc'].includes(extension)) type = 'word';
            else if (['mp4', 'avi', 'mov'].includes(extension)) type = 'video';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) type = 'image';

            setFileForm({
                ...fileForm,
                name: file.name,
                file: file,
                type: type
            });
        }
    };

    const handleSaveFile = () => {
        if (!fileForm.name.trim() || (!fileForm.file && !editingFile)) {
            return;
        }

        setIsLoading(true);
        
        setTimeout(() => {
            if (editingFile) {
                setFiles(files.map(file =>
                    file.id === editingFile.id
                        ? {
                            ...file,
                            name: fileForm.name,
                            type: fileForm.type,
                            uploadedAt: new Date().toISOString().split('T')[0]
                        }
                        : file
                ));
            } else {
                const newFile = {
                    id: Date.now(),
                    name: fileForm.name,
                    type: fileForm.type,
                    size: fileForm.file ? `${(fileForm.file.size / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
                    uploadedAt: new Date().toISOString().split('T')[0],
                    url: '#'
                };
                setFiles([...files, newFile]);
            }
            
            resetFileForm();
            setShowFileModal(false);
            setIsLoading(false);
        }, 1500);
    };

    const ResourceCard = ({ title, icon, children, gradient, onAddClick, addButtonText, emptyStateIcon, emptyStateText, emptyStateSubtext }) => (
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
                            <p className="text-white-50 mb-0 small">Manage your {title.toLowerCase()}</p>
                        </div>
                    </div>
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
                </div>
            </CCardHeader>
            <CCardBody className="p-0">
                {children}
            </CCardBody>
        </CCard>
    );

    const EmptyState = ({ icon, title, subtitle, onAddClick, buttonText }) => (
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
        </div>
    );

    const ResourceItem = ({ item, isFile = false, onEdit, onDelete, onDownload }) => (
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
                                {isFile ? item.name : item.title}
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
                                {item.url}
                            </p>
                        )}
                        {isFile && (
                            <p className="text-muted small mb-1">
                                Size: {item.size}
                            </p>
                        )}
                        <small className="text-muted">
                            {isFile ? 'Uploaded' : 'Added'}: {new Date(isFile ? item.uploadedAt : item.createdAt).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                <div className="d-flex gap-1 ms-2 flex-shrink-0">
                    {isFile && (
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
                        >
                            <CIcon icon={cilGlobeAlt} size="sm" />
                        </CButton>
                    )}
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
                    >
                        <CIcon icon={cilPencil} size="sm" />
                    </CButton>
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
                    >
                        <CIcon icon={cilTrash} size="sm" />
                    </CButton>
                </div>
            </div>
        </CListGroupItem>
    );

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
                    Cancel
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
                            <h2 className="text-white mb-1 fw-bold">Resources</h2>
                            <p className="text-white-50 mb-0">Manage your links and files in one place</p>
                        </div>
                    </div>
                </CCardBody>
            </CCard>

            <CRow className="g-4">
                {/* Links Section */}
                <CCol lg={6} className="mb-4">
                    <ResourceCard
                        title="Links"
                        icon={cilLink}
                        gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                        onAddClick={handleAddLink}
                        addButtonText="Add Link"
                        emptyStateIcon={cilLink}
                        emptyStateText="No links added yet"
                        emptyStateSubtext="Start by adding your first link"
                        
                    >
                        {links.length === 0 ? (
                            <EmptyState
                                icon={cilLink}
                                title="No links added yet"
                                subtitle="Start by adding your first useful link"
                                onAddClick={handleAddLink}
                                buttonText="Add First Link"
                            />
                        ) : (
                            <CListGroup flush>
                                {links.map((link) => (
                                    <ResourceItem
                                        key={link.id}
                                        item={link}
                                        isFile={false}
                                        onEdit={handleEditLink}
                                        onDelete={handleDeleteLink}
                                    />
                                ))}
                            </CListGroup>
                        )}
                    </ResourceCard>
                </CCol>

                {/* Files Section */}
                <CCol lg={6} className="mb-4">
                    <ResourceCard
                        title="Files"
                        icon={cilFolder}
                        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        onAddClick={handleAddFile}
                        addButtonText="Add File"
                        emptyStateIcon={cilFolder}
                        emptyStateText="No files uploaded yet"
                        emptyStateSubtext="Upload your first file"
                    >
                        {files.length === 0 ? (
                            <EmptyState
                                icon={cilCloudUpload}
                                title="No files uploaded yet"
                                subtitle="Start by uploading your first document"
                                onAddClick={handleAddFile}
                                buttonText="Upload First File"
                            />
                        ) : (
                            <CListGroup flush>
                                {files.map((file) => (
                                    <ResourceItem
                                        key={file.id}
                                        item={file}
                                        isFile={true}
                                        onEdit={handleEditFile}
                                        onDelete={handleDeleteFile}
                                        onDownload={(file) => window.open(file.url, '_blank')}
                                    />
                                ))}
                            </CListGroup>
                        )}
                    </ResourceCard>
                </CCol>
            </CRow>

            {/* Link Modal */}
            <ModalComponent
                visible={showLinkModal}
                onClose={() => { setShowLinkModal(false); resetLinkForm(); }}
                title={editingLink ? 'Edit Link' : 'Add New Link'}
                onSave={handleSaveLink}
                saveButtonText={editingLink ? 'Update Link' : 'Add Link'}
                isLoading={isLoading}
            >
                <CForm>
                    <CustomFormInput
                        label="Link Title"
                        name="title"
                        required
                        icon={cilLink}
                        placeholder="Enter link title"
                        value={linkForm.title}
                        onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    />
                    <CustomFormInput
                        label="URL"
                        name="url"
                        type="url"
                        required
                        icon={cilGlobeAlt}
                        placeholder="https://example.com"
                        value={linkForm.url}
                        onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    />
                    <CustomFormSelect
                        label="Link Type"
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
                title={editingFile ? 'Edit File' : 'Upload New File'}
                onSave={handleSaveFile}
                saveButtonText={editingFile ? 'Update File' : 'Upload File'}
                isLoading={isLoading}
            >
                <CForm>
                    <CustomFormInput
                        label="File"
                        name="file"
                        type="file"
                        required={!editingFile}
                        icon={cilCloudUpload}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                    />
                    {editingFile && (
                        <small className="text-muted d-block mb-3">Leave empty to keep current file</small>
                    )}
                    <CustomFormInput
                        label="File Name"
                        name="name"
                        required
                        icon={cilDescription}
                        placeholder="Enter file name"
                        value={fileForm.name}
                        onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                    />
                    <CustomFormSelect
                        label="File Type"
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
        </CContainer>
    );
};

export default Resources;