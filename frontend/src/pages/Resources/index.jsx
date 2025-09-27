import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axiosInstance from '../../helpers/axiosInstance';
import { getFreshestToken } from '../../utils/authToken';
import { getContrastColor } from '../../utils/colorUtils';
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CFormSwitch,
  CFormTextarea,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CListGroup,
  CListGroupItem,
  CNav,
  CNavItem,
  CNavLink,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilBullhorn,
  cilChart,
  cilArrowLeft,
  cilCloudDownload,
  cilCloudUpload,
  cilDescription,
  cilFolder,
  cilLink,
  cilList,
  cilPencil,
  cilSearch,
  cilPlus,
  cilTrash,
  cilBook,
  cilBookmark,
  cilBriefcase,
  cilBuilding,
  cilCamera,
  cilCode,
  cilCog,
  cilEducation,
  cilEnvelopeClosed,
  cilFile,
  cilGlobeAlt,
  cilHeart,
  cilHome,
  cilInfo,
  cilLaptop,
  cilLightbulb,
  cilMap,
  cilMedicalCross,
  cilMoney,
  cilPeople,
  cilPhone,
  cilSettings,
  cilStar,
  cilTag,
  cilUser,
  cilVideo,
  cilWallet
} from '@coreui/icons';
import PageHeader from '../../components/PageHeader';
import withContractorScope from '../../components/withContractorScope';
import FileViewerModal from '../../components/FileViewerModal';

const LINK_TYPE_OPTIONS = [
  { value: 'external', icon: cilLink, color: 'primary', key: 'resources.linkType.external' },
  { value: 'internal', icon: cilFolder, color: 'success', key: 'resources.linkType.internal' },
  { value: 'document', icon: cilDescription, color: 'info', key: 'resources.linkType.document' },
  { value: 'video', icon: cilBullhorn, color: 'dark', key: 'resources.linkType.video' },
  { value: 'help', icon: cilList, color: 'warning', key: 'resources.linkType.help' },
];

const FILE_TYPE_META = {
  pdf: { color: 'danger', icon: cilDescription, key: 'resources.fileType.pdf' },
  spreadsheet: { color: 'success', icon: cilChart, key: 'resources.fileType.spreadsheet' },
  document: { color: 'primary', icon: cilDescription, key: 'resources.fileType.document' },
  video: { color: 'dark', icon: cilBullhorn, key: 'resources.fileType.video' },
  audio: { color: 'secondary', icon: cilBullhorn, key: 'resources.fileType.audio' },
  image: { color: 'info', icon: cilDescription, key: 'resources.fileType.image' },
  archive: { color: 'secondary', icon: cilDescription, key: 'resources.fileType.archive' },
  other: { color: 'secondary', icon: cilDescription, key: 'resources.fileType.other' },
};

const GROUP_VISIBILITY_OPTIONS = ['admin', 'contractor'];

const ICON_OPTIONS = [
  { value: 'cil-folder', icon: cilFolder, label: 'Folder' },
  { value: 'cil-book', icon: cilBook, label: 'Book' },
  { value: 'cil-bookmark', icon: cilBookmark, label: 'Bookmark' },
  { value: 'cil-briefcase', icon: cilBriefcase, label: 'Briefcase' },
  { value: 'cil-building', icon: cilBuilding, label: 'Building' },
  { value: 'cil-bullhorn', icon: cilBullhorn, label: 'Bullhorn' },
  { value: 'cil-camera', icon: cilCamera, label: 'Camera' },
  { value: 'cil-chart', icon: cilChart, label: 'Chart' },
  { value: 'cil-cloud-download', icon: cilCloudDownload, label: 'Download' },
  { value: 'cil-cloud-upload', icon: cilCloudUpload, label: 'Upload' },
  { value: 'cil-code', icon: cilCode, label: 'Code' },
  { value: 'cil-cog', icon: cilCog, label: 'Settings' },
  { value: 'cil-description', icon: cilDescription, label: 'Document' },
  { value: 'cil-education', icon: cilEducation, label: 'Education' },
  { value: 'cil-envelope-closed', icon: cilEnvelopeClosed, label: 'Email' },
  { value: 'cil-file', icon: cilFile, label: 'File' },
  { value: 'cil-globe-alt', icon: cilGlobeAlt, label: 'Globe' },
  { value: 'cil-heart', icon: cilHeart, label: 'Heart' },
  { value: 'cil-home', icon: cilHome, label: 'Home' },
  { value: 'cil-info', icon: cilInfo, label: 'Information' },
  { value: 'cil-laptop', icon: cilLaptop, label: 'Laptop' },
  { value: 'cil-lightbulb', icon: cilLightbulb, label: 'Lightbulb' },
  { value: 'cil-link', icon: cilLink, label: 'Link' },
  { value: 'cil-list', icon: cilList, label: 'List' },
  { value: 'cil-map', icon: cilMap, label: 'Map' },
  { value: 'cil-medical-cross', icon: cilMedicalCross, label: 'Medical' },
  { value: 'cil-money', icon: cilMoney, label: 'Money' },
  { value: 'cil-people', icon: cilPeople, label: 'People' },
  { value: 'cil-phone', icon: cilPhone, label: 'Phone' },
  { value: 'cil-settings', icon: cilSettings, label: 'Gear' },
  { value: 'cil-star', icon: cilStar, label: 'Star' },
  { value: 'cil-tag', icon: cilTag, label: 'Tag' },
  { value: 'cil-user', icon: cilUser, label: 'User' },
  { value: 'cil-video', icon: cilVideo, label: 'Video' },
  { value: 'cil-wallet', icon: cilWallet, label: 'Wallet' }
];


const API_ROOT = '/api/resources';
const CATEGORY_ENDPOINT = `${API_ROOT}/categories`;
const LINKS_ENDPOINT = `${API_ROOT}/links`;
const FILES_ENDPOINT = `${API_ROOT}/files`;
const ANNOUNCEMENTS_ENDPOINT = `${API_ROOT}/announcements`;
const SCAFFOLD_ENDPOINT = `${CATEGORY_ENDPOINT}/scaffold`;

const emptyCategoryForm = {
  id: null,
  name: '',
  slug: '',
  description: '',
  color: '',
  icon: '',
  parentId: '',
  sortOrder: 0,
  isActive: true,
  isPinned: false,
  pinnedOrder: 0,
  pendingThumbnail: null,
  pendingThumbnailPreview: null,
};

const emptyLinkForm = {
  id: null,
  title: '',
  url: '',
  type: 'external',
  description: '',
  categoryId: '',
  thumbnailUrl: '',
  isPinned: false,
  pinnedOrder: 0,
  tags: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'active',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
};

const emptyFileForm = {
  id: null,
  name: '',
  description: '',
  categoryId: '',
  // Thumbnail upload flow (no direct URL)
  pendingThumbnail: null,
  pendingThumbnailPreview: null,
  uploadedThumbnailUrl: null, // served API URL for preview only
  isPinned: false,
  pinnedOrder: 0,
  tags: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'active',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
  file: null,
};

const emptyAnnouncementForm = {
  id: null,
  title: '',
  summary: '',
  body: '',
  categoryId: '',
  isPinned: false,
  pinnedOrder: 0,
  publishAt: '',
  expireAt: '',
  ctaLabel: '',
  ctaUrl: '',
  status: 'published',
  visibleToGroupTypes: ['admin'],
  visibleToGroupIds: '',
};

const flattenCategories = (categories = [], level = 0, list = []) => {
  categories.forEach((category) => {
    list.push({ id: category.id, name: category.name, level, data: category });
    if (Array.isArray(category.children) && category.children.length) {
      flattenCategories(category.children, level + 1, list);
    }
  });
  return list;
};

const buildCategoryMap = (categories = []) => {
  const map = new Map();
  const traverse = (nodes, parentId = null) => {
    nodes.forEach((node) => {
      map.set(node.id, { ...node, parentId });
      if (Array.isArray(node.children) && node.children.length) {
        traverse(node.children, node.id);
      }
    });
  };
  traverse(categories);
  return map;
};

const normalizeTagsInput = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length);
};

const serializeTags = (tags) => (Array.isArray(tags) && tags.length ? tags.join(', ') : '');

const normalizeVisibilityInput = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length);
};

const formatDateTimeForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => `${num}`.padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toISOStringOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const Resources = ({ isContractor, contractorGroupName }) => {
  const { t } = useTranslation();
  const customization = useSelector((state) => state.customization);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scaffoldLoading, setScaffoldLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [categoryReference, setCategoryReference] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoryId: 'all', medium: 'all' });
  const [fileDownloadPermissions, setFileDownloadPermissions] = useState({}); // Track download permissions per file ID
  const [categoryModal, setCategoryModal] = useState({ visible: false, isEdit: false, form: { ...emptyCategoryForm } });
  const [linkModal, setLinkModal] = useState({ visible: false, isEdit: false, form: { ...emptyLinkForm } });
  const [fileModal, setFileModal] = useState({ visible: false, isEdit: false, form: { ...emptyFileForm } });
  const [announcementModal, setAnnouncementModal] = useState({ visible: false, isEdit: false, form: { ...emptyAnnouncementForm } });
  const [viewerModal, setViewerModal] = useState({ visible: false, file: null });

  const isAdmin = !isContractor;

  // Uniform icon-only button style for actions (download, edit, delete)
  const iconBtnStyle = useMemo(
    () => ({
      width: 32,
      height: 32,
      padding: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
    }),
    []
  );

  // Function to check if a specific file can be downloaded
  const canDownloadFile = useCallback((fileId) => {
    return isAdmin || fileDownloadPermissions[fileId] === true;
  }, [isAdmin, fileDownloadPermissions]);

  // Function to toggle download permission for a specific file
  const toggleFileDownloadPermission = useCallback((fileId) => {
    setFileDownloadPermissions(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  }, []);
  const accentColor = customization?.primaryColor || '#321fdb';
  const resolveModalColor = useCallback((value, fallback = '#321fdb') => {
    if (!value) return fallback;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || fallback;
    }
    if (typeof value === 'object') {
      if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim();
      if (typeof value.value === 'string' && value.value.trim()) return value.value.trim();
    }
    return fallback;
  }, []);
  const modalHeaderBackground = useMemo(
    () => resolveModalColor(customization?.headerBg, accentColor),
    [customization?.headerBg, accentColor, resolveModalColor]
  );
  const modalHeaderTextColor = useMemo(
    () => getContrastColor(modalHeaderBackground),
    [modalHeaderBackground]
  );
  const modalHeaderStyle = useMemo(
    () => ({
      background: modalHeaderBackground,
      color: modalHeaderTextColor,
      borderBottom: `1px solid ${modalHeaderBackground}33`,
      '--cui-btn-close-color': modalHeaderTextColor,
      '--cui-btn-close-opacity': 0.85,
      '--cui-btn-close-hover-opacity': 1,
    }),
    [modalHeaderBackground, modalHeaderTextColor]
  );
  const renderBrandedModalHeader = useCallback(
    (title) => (
      <CModalHeader closeButton className="border-0" style={modalHeaderStyle}>
        <CModalTitle style={{ color: modalHeaderTextColor }}>{title}</CModalTitle>
      </CModalHeader>
    ),
    [modalHeaderStyle, modalHeaderTextColor]
  );
  const FolderIcon = useMemo(
    () => (iconProps) => <CIcon icon={cilFolder} {...iconProps} />,
    []
  );


  const apiBaseUrl = useMemo(() => {
    if (axiosInstance.defaults.baseURL) {
      return axiosInstance.defaults.baseURL;
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  }, []);

  const resolveFileUrl = useCallback(
    (file, mode = 'download') => {
      if (!file?.url) return null;
      const base = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      if (!base) return null;
      try {
        const url = new URL(file.url, base);
        if (mode && mode !== 'download') {
          url.searchParams.set('mode', mode);
        }
        const token = getFreshestToken();
        if (token) {
          url.searchParams.set('token', token);
        }
        return url.toString();
      } catch (error) {
        console.error('Error building secure resource URL', error);
        return null;
      }
    },
    [apiBaseUrl]
  );

  const resolveCategoryThumbUrl = useCallback((categoryOrUrl) => {
    const token = getFreshestToken();
    let urlStr = null;
    if (!categoryOrUrl) return null;
    if (typeof categoryOrUrl === 'string') {
      urlStr = categoryOrUrl;
    } else if (categoryOrUrl.thumbnailUrl) {
      urlStr = categoryOrUrl.thumbnailUrl;
    }
    if (!urlStr) return null;
    try {
      // Absolute external URL
      if (/^https?:\/\//i.test(urlStr)) {
        return urlStr;
      }
      const base = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      if (!base) return null;
      const u = new URL(urlStr, base);
      if (token) u.searchParams.set('token', token);
      return u.toString();
    } catch (e) {
      console.error('Error building category thumbnail URL', e);
      return null;
    }
  }, [apiBaseUrl]);

  // Determine file kind from mime/type or extension
  const getFileKind = useCallback((file) => {
    const type = (file?.mimeType || file?.mime_type || file?.fileType || '').toString().toLowerCase();
    const name = (file?.originalName || file?.original_name || file?.name || '').toString().toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';
    const isImage = type.startsWith('image/') || ['jpg','jpeg','png','gif','bmp','webp','svg'].includes(ext);
    const isVideo = type.startsWith('video/') || ['mp4','mov','m4v','webm','ogg','avi','mkv'].includes(ext);
    const isPdf = type.includes('pdf') || ext === 'pdf';
    if (isImage) return 'image';
    if (isVideo) return 'video';
    if (isPdf) return 'pdf';
    return 'other';
  }, []);

  // Build best-effort thumbnail URL for a file
  const resolveFileThumbUrl = useCallback((file) => {
    if (!file) return null;
    // If API provided a thumbnailUrl, secure it with token
    if (file.thumbnailUrl) {
      return resolveCategoryThumbUrl(file.thumbnailUrl);
    }
    const kind = getFileKind(file);
    // Try asking backend for a thumbnail if supported
    const apiThumb = resolveFileUrl(file, 'thumbnail');
    if (apiThumb) return apiThumb;
    // Fallbacks
    if (kind === 'image') {
      return resolveFileUrl(file); // use original image
    }
    return null;
  }, [getFileKind, resolveCategoryThumbUrl, resolveFileUrl]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(API_ROOT, {
        params: { includeInactive: isAdmin },
      });
      setResourceData(response.data?.data || null);
    } catch (error) {
      console.error('Error loading resources:', error);
      const message = error.response?.data?.message || t('resources.messages.loadFailed', 'Failed to load resources');
      showFeedback('danger', message);
      setResourceData(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, t]);

  const fetchCategories = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await axiosInstance.get(CATEGORY_ENDPOINT, {
        params: { includeInactive: true },
      });
      setCategoryReference(response.data?.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchResources();
    if (isAdmin) {
      fetchCategories();
    }
  }, [fetchResources, fetchCategories, isAdmin]);

  const categoriesForDisplay = useMemo(
    () => (isAdmin ? categoryReference : resourceData?.categories || []),
    [isAdmin, categoryReference, resourceData]
  );

  const categoryMap = useMemo(() => buildCategoryMap(categoriesForDisplay), [categoriesForDisplay]);

  const flattenedCategories = useMemo(() => flattenCategories(categoriesForDisplay), [categoriesForDisplay]);

  const parentCategoryOptions = useMemo(() => {
    const excludeId = categoryModal.isEdit ? categoryModal.form.id : null;
    return flattenedCategories.filter(({ id }) => String(id) !== String(excludeId));
  }, [flattenedCategories, categoryModal.isEdit, categoryModal.form.id]);

  const normalizedSearch = useMemo(() => filters.search.trim().toLowerCase(), [filters.search]);

  const passesCategory = useCallback(
    (categoryId) => {
      if (filters.categoryId === 'all') return true;
      if (filters.categoryId === 'uncategorized') return !categoryId;
      return Number(filters.categoryId) === Number(categoryId);
    },
    [filters.categoryId]
  );

  const passesFilters = useCallback(
    (item, type) => {
      const categoryId = item?.categoryId ?? item?.category_id ?? null;
      if (filters.medium !== 'all' && filters.medium !== type) {
        return false;
      }
      if (!passesCategory(categoryId)) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const haystack = [];
      if (type === 'announcements') {
        haystack.push(item.title, item.summary, item.body);
      } else if (type === 'links') {
        haystack.push(item.title, item.url, item.description);
      } else if (type === 'files') {
        haystack.push(item.name, item.originalName || item.original_name, item.description);
      }
      return haystack.some((value) => value && value.toLowerCase().includes(normalizedSearch));
    },
    [filters.medium, normalizedSearch, passesCategory]
  );

  // Same as passesFilters, but ignore the medium filter (used for tab counts)
  const passesFiltersIgnoringMedium = useCallback(
    (item, type) => {
      const categoryId = item?.categoryId ?? item?.category_id ?? null;
      if (!passesCategory(categoryId)) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const haystack = [];
      if (type === 'announcements') {
        haystack.push(item.title, item.summary, item.body);
      } else if (type === 'links') {
        haystack.push(item.title, item.url, item.description);
      } else if (type === 'files') {
        haystack.push(item.name, item.originalName || item.original_name, item.description);
      }
      return haystack.some((value) => value && value.toLowerCase().includes(normalizedSearch));
    },
    [normalizedSearch, passesCategory]
  );

  const resourcesByCategory = useMemo(() => {
    const buckets = {};
    const ensure = (key) => {
      if (!buckets[key]) {
        buckets[key] = { announcements: [], links: [], files: [] };
      }
      return buckets[key];
    };

    flattenedCategories.forEach(({ id }) => ensure(String(id)));

    if (resourceData) {
      const assign = (list = [], type) => {
        list.forEach((item) => {
          const categoryId = item?.categoryId ?? item?.category_id ?? null;
          const key = categoryId != null ? String(categoryId) : 'uncategorized';
          ensure(key)[type].push(item);
        });
      };
      assign(resourceData.announcements, 'announcements');
      assign(resourceData.links, 'links');
      assign(resourceData.files, 'files');
    }

    return buckets;
  }, [flattenedCategories, resourceData]);

  const hasUncategorized = useMemo(() => {
    if (!resourceData) return false;
    return (
      resourceData.links?.some((link) => !link.categoryId) ||
      resourceData.files?.some((file) => !file.categoryId) ||
      resourceData.announcements?.some((announcement) => !announcement.categoryId)
    );
  }, [resourceData]);

  // Helpers to aggregate by category (including descendants)
  const getDescendantIds = useCallback((category) => {
    const ids = [];
    const walk = (node) => {
      if (!node) return;
      if (Array.isArray(node.children)) {
        node.children.forEach((child) => {
          ids.push(child.id);
          walk(child);
        });
      }
    };
    walk(category);
    return ids;
  }, []);

  const aggregateCategoryData = useCallback((category) => {
    const allIds = new Set([String(category.id), ...getDescendantIds(category).map(String)]);
    const anns = (resourceData?.announcements || []).filter((a) => allIds.has(String(a?.categoryId ?? a?.category_id)) && passesFiltersIgnoringMedium(a, 'announcements'));
    const links = (resourceData?.links || []).filter((l) => allIds.has(String(l?.categoryId ?? l?.category_id)) && passesFiltersIgnoringMedium(l, 'links'));
    const files = (resourceData?.files || []).filter((f) => allIds.has(String(f?.categoryId ?? f?.category_id)) && passesFiltersIgnoringMedium(f, 'files'));

    const sortPinnedThen = (arr, by) => arr.slice().sort((a, b) => {
      const pc = comparePinned(a, b);
      if (pc !== 0) return pc;
      if (by === 'date') {
        const da = a?.publishAt ? new Date(a.publishAt).getTime() : 0;
        const db = b?.publishAt ? new Date(b.publishAt).getTime() : 0;
        return db - da;
      }
      return String((a?.title || a?.name || '')).localeCompare(String((b?.title || b?.name || '')));
    });

    const annsSorted = sortPinnedThen(anns, 'date');
    const linksSorted = sortPinnedThen(links, 'alpha');
    const filesSorted = sortPinnedThen(files, 'alpha');

    // Build a mixed preview list (max 3)
    const preview = [];
    annsSorted.slice(0, 1).forEach((a) => preview.push({ type: 'announcement', item: a }));
    linksSorted.slice(0, 1).forEach((l) => preview.push({ type: 'link', item: l }));
    filesSorted.slice(0, 1).forEach((f) => preview.push({ type: 'file', item: f }));
    // If less than 3, fill with remaining by highest volumes
    const remaining = [
      ...annsSorted.slice(1),
      ...linksSorted.slice(1),
      ...filesSorted.slice(1),
    ].slice(0, Math.max(0, 3 - preview.length));
    remaining.forEach((it) => {
      const type = it.title ? 'announcement' : (it.url ? 'link' : 'file');
      preview.push({ type, item: it });
    });

    const totals = { announcements: anns.length, links: links.length, files: files.length };
    const dominant = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'links';
    return { totals, preview, dominant };
  }, [getDescendantIds, resourceData, passesFiltersIgnoringMedium]);

  const renderCategoryTile = useCallback((category) => {
    const { totals, preview, dominant } = aggregateCategoryData(category);
    const goToCategory = () => {
      // Jump to the most relevant type for this category
      setFilters((prev) => ({ ...prev, categoryId: String(category.id), medium: dominant }));
    };
    const color = category.color || accentColor;
    const thumbUrl = resolveCategoryThumbUrl(category);
    return (
      <CCol key={`tile-${category.id}`} md={6} lg={4} xl={3} className="d-flex">
        <CCard
          className="shadow-sm flex-fill h-100 position-relative overflow-hidden"
          role="button"
          tabIndex={0}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '--hover-transform': 'translateY(-4px)',
            '--hover-shadow': '0 8px 25px rgba(0,0,0,0.15)',
            border: '3px solid #dee2e6',
            borderRadius: '8px',
            minHeight: '320px',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={() => goToCategory()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToCategory(); } }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'var(--hover-transform)';
            e.currentTarget.style.boxShadow = 'var(--hover-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          {thumbUrl && (
            <div className="position-relative" style={{ height: '120px', overflow: 'hidden' }}>
              <img
                src={thumbUrl}
                alt={category.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease'
                }}
                className="category-thumb"
              />
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                  background: `linear-gradient(135deg, ${color}15 0%, transparent 50%)`,
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}

          <CCardHeader className="bg-transparent border-0 pb-2">
            <div className="d-flex w-100 align-items-start justify-content-between">
              <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: `${color}20`,
                    border: `2px solid ${color}40`
                  }}
                >
                  <CIcon icon={cilFolder} style={{ color, fontSize: '14px' }} />
                </div>
                <div className="min-w-0 flex-grow-1">
                  <h6 className="mb-0 fw-bold text-truncate" title={category.name} style={{ fontSize: '0.9rem' }}>
                    {category.name}
                  </h6>
                  {category.isPinned && (
                    <CBadge color="warning" className="mt-1" style={{ fontSize: '0.65rem' }}>
                      {t('resources.labels.pinned', 'Pinned')}
                    </CBadge>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="d-flex align-items-center gap-1 opacity-75 admin-controls"
                     style={{ transition: 'opacity 0.2s ease' }}>
                  <CButton
                    size="sm"
                    color="secondary"
                    variant="ghost"
                    className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px', fontSize: '12px' }}
                    title={t('common.edit', 'Edit')}
                    onClick={(e) => { e.stopPropagation(); openCategoryModal(category); }}
                  >
                    <CIcon icon={cilPencil} />
                  </CButton>
                  <CButton
                    size="sm"
                    color="success"
                    variant="ghost"
                    className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px', fontSize: '12px' }}
                    title={t('resources.actions.newCategory', 'Add Subcategory')}
                    onClick={(e) => { e.stopPropagation(); openCategoryModal(null, category.id); }}
                  >
                    <CIcon icon={cilPlus} />
                  </CButton>
                  <CButton
                    size="sm"
                    color="danger"
                    variant="ghost"
                    className="p-1 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px', fontSize: '12px' }}
                    title={t('common.delete', 'Delete')}
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                  >
                    <CIcon icon={cilTrash} />
                  </CButton>
                </div>
              )}
            </div>
          </CCardHeader>

          <CCardBody className="pt-0" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {category.description && (
              <p className="text-muted small mb-3 lh-sm" style={{
                fontSize: '0.8rem',
                maxHeight: '2.4rem',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {category.description}
              </p>
            )}

            <div className="d-flex flex-wrap gap-1 mb-3">
              <CBadge
                color="warning"
                className="px-2 py-1 rounded-pill d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', fontWeight: '500' }}
              >
                <CIcon icon={cilBullhorn} style={{ fontSize: '10px' }} />
                {totals.announcements}
              </CBadge>
              <CBadge
                color="success"
                className="px-2 py-1 rounded-pill d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', fontWeight: '500' }}
              >
                <CIcon icon={cilLink} style={{ fontSize: '10px' }} />
                {totals.links}
              </CBadge>
              <CBadge
                color="info"
                className="px-2 py-1 rounded-pill d-flex align-items-center gap-1"
                style={{ fontSize: '0.7rem', fontWeight: '500' }}
              >
                <CIcon icon={cilCloudDownload} style={{ fontSize: '10px' }} />
                {totals.files}
              </CBadge>
            </div>

            {preview.length > 0 ? (
              <div className="preview-section" style={{ flex: 1, minHeight: '100px', maxHeight: '100px', overflow: 'hidden' }}>
                <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                  {t('resources.labels.preview', 'Preview')}
                </h6>
                <div className="d-flex flex-column gap-1" style={{ maxHeight: '70px', overflowY: 'auto' }}>
                  {preview.slice(0, 2).map(({ type, item }, idx) => {
                    const icon = type === 'announcement' ? cilBullhorn : type === 'link' ? cilLink : cilCloudDownload;
                    const label = item.title || item.name || item.url || '';
                    const onClick = (e) => {
                      e.stopPropagation();
                      if (type === 'link') handleOpenLink(item);
                      if (type === 'file') handleDownloadFile(item);
                      if (type === 'announcement') setFilters((prev) => ({ ...prev, medium: 'announcements', categoryId: String(category.id) }));
                    };
                    return (
                      <div
                        key={`prev-${category.id}-${idx}`}
                        className="d-flex align-items-center gap-2 p-2 rounded preview-item"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          fontSize: '0.8rem'
                        }}
                        onClick={onClick}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)'}
                      >
                        <CIcon icon={icon} className="text-muted flex-shrink-0" style={{ fontSize: '12px' }} />
                        <span className="text-truncate fw-medium" title={label}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-3" style={{ flex: 1, minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <CIcon icon={cilFolder} className="text-muted mb-2" style={{ fontSize: '24px', opacity: 0.3 }} />
                <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                  {t('resources.messages.noContent', 'No content available')}
                </p>
              </div>
            )}
          </CCardBody>

          <div className="position-absolute bottom-0 end-0 p-2">
            <CButton
              size="sm"
              color="primary"
              className="px-3 py-1 fw-medium view-button"
              style={{
                fontSize: '0.75rem',
                borderRadius: '16px',
                transition: 'all 0.2s ease'
              }}
              onClick={(e) => { e.stopPropagation(); goToCategory(); }}
            >
              {t('common.view', 'View')}
            </CButton>
          </div>
        </CCard>
      </CCol>
    );
  }, [aggregateCategoryData, accentColor, t, isAdmin, resolveCategoryThumbUrl]);

  const renderCategoryTilesGrid = useCallback(() => {
    // Show only top-level categories as tiles
    const roots = Array.isArray(categoriesForDisplay) ? categoriesForDisplay : [];
    if (roots.length === 0 && !hasUncategorized) {
      return (
        <CCard className="border-0 shadow-sm">
          <CCardBody className="text-center text-muted py-5">{t('resources.messages.noCategories', 'No categories available')}</CCardBody>
        </CCard>
      );
    }
    return (
      <CRow className="g-3 mb-4">
        {roots.map((cat) => renderCategoryTile(cat))}
        {hasUncategorized && (
          <CCol key="tile-uncategorized" md={6} lg={4} xl={3} className="d-flex">
            <CCard
              className="shadow-sm flex-fill h-100"
              style={{
                border: '3px solid #dee2e6',
                borderRadius: '8px',
                minHeight: '320px',
                maxHeight: '320px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CCardHeader className="bg-transparent border-0 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <CIcon icon={cilFolder} className="text-secondary" />
                  <span className="fw-semibold">{t('resources.categories.uncategorized', 'Uncategorized')}</span>
                </div>
                <CButton size="sm" color="primary" variant="outline" onClick={() => setFilters((prev) => ({ ...prev, categoryId: 'uncategorized', medium: 'links' }))}>
                  {t('common.view', 'View')}
                </CButton>
              </CCardHeader>
              <CCardBody>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <CBadge color="warning">{t('resources.stats.announcements', 'Announcements')}: {(resourceData?.announcements || []).filter((a) => !a.categoryId).length}</CBadge>
                  <CBadge color="success">{t('resources.stats.links', 'Links')}: {(resourceData?.links || []).filter((l) => !l.categoryId).length}</CBadge>
                  <CBadge color="info">{t('resources.stats.files', 'Files')}: {(resourceData?.files || []).filter((f) => !f.categoryId).length}</CBadge>
                </div>
                <div className="text-muted small">{t('resources.categories.uncategorizedDescription', 'Items that have not been assigned to any category')}</div>
              </CCardBody>
            </CCard>
          </CCol>
        )}
      </CRow>
    );
  }, [categoriesForDisplay, hasUncategorized, renderCategoryTile, resourceData, t]);

  const categoryFilterOptions = useMemo(() => {
    const options = [
      { value: 'all', label: t('resources.filters.allCategories') },
    ];
    if (hasUncategorized) {
      options.push({ value: 'uncategorized', label: t('resources.filters.uncategorized', 'Uncategorized') });
    }
    flattenedCategories.forEach(({ id, name, level }) => {
      const prefix = level ? `${'— '.repeat(level)}` : '';
      options.push({ value: String(id), label: `${prefix}${name}` });
    });
    return options;
  }, [flattenedCategories, hasUncategorized, t]);

  const mediumOptions = useMemo(
    () => [
      { value: 'all', label: t('resources.filters.medium.all') },
      { value: 'announcements', label: t('resources.filters.medium.announcements') },
      { value: 'links', label: t('resources.filters.medium.links') },
      { value: 'files', label: t('resources.filters.medium.files') },
    ],
    [t]
  );

  const filteredAnnouncements = useMemo(
    () => (resourceData?.announcements || []).filter((announcement) => passesFilters(announcement, 'announcements')),
    [resourceData, passesFilters]
  );

  const filteredLinks = useMemo(
    () => (resourceData?.links || []).filter((link) => passesFilters(link, 'links')),
    [resourceData, passesFilters]
  );

  const filteredFiles = useMemo(
    () => (resourceData?.files || []).filter((file) => passesFilters(file, 'files')),
    [resourceData, passesFilters]
  );

  // Sorted views (pinned first, then order by date/name)
  const comparePinned = (a, b) => {
    const pa = a?.isPinned ? 1 : 0;
    const pb = b?.isPinned ? 1 : 0;
    if (pa !== pb) return pb - pa; // pinned first
    const poa = Number(a?.pinnedOrder ?? a?.pinned_order ?? 0);
    const pob = Number(b?.pinnedOrder ?? b?.pinned_order ?? 0);
    if (poa !== pob) return poa - pob; // lower pinned order first
    return 0;
  };

  const sortedAnnouncements = useMemo(() => {
    const list = [...filteredAnnouncements];
    list.sort((a, b) => {
      const pinnedCmp = comparePinned(a, b);
      if (pinnedCmp !== 0) return pinnedCmp;
      const da = a?.publishAt ? new Date(a.publishAt).getTime() : 0;
      const db = b?.publishAt ? new Date(b.publishAt).getTime() : 0;
      if (da !== db) return db - da; // newest first
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return list;
  }, [filteredAnnouncements]);

  const sortedLinks = useMemo(() => {
    const list = [...filteredLinks];
    list.sort((a, b) => {
      const pinnedCmp = comparePinned(a, b);
      if (pinnedCmp !== 0) return pinnedCmp;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    return list;
  }, [filteredLinks]);

  const sortedFiles = useMemo(() => {
    const list = [...filteredFiles];
    list.sort((a, b) => {
      const pinnedCmp = comparePinned(a, b);
      if (pinnedCmp !== 0) return pinnedCmp;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return list;
  }, [filteredFiles]);

  // Render a unified Files grid (used in Files tab and inside category cards)
  const renderFilesGrid = (filesList = sortedFiles) => {
    return (
      <CCard
        className="shadow-sm mb-4"
        style={{ border: '3px solid #dee2e6', borderRadius: '8px' }}
      >
        <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent border-0">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilCloudUpload} className="text-primary" />
            <h5 className="mb-0">{t('resources.files.title')}</h5>
            <CBadge color="primary" className="ms-2">{filesList.length}</CBadge>
          </div>
          {isAdmin && (
            <CButton color="info" size="sm" onClick={() => openFileModal()}>
              <CIcon icon={cilCloudUpload} className="me-2" />
              {t('resources.actions.uploadFile')}
            </CButton>
          )}
        </CCardHeader>
        <CCardBody>
          {filesList.length === 0 ? (
            <div className="text-muted">{t('resources.media.empty')}</div>
          ) : (
            <CRow className="g-3">
              {filesList.map((file) => (
                <CCol key={`files-grid-${file.id}`} xs={12} sm={6} md={4} lg={3}>
                  <CCard
                    className="h-100 shadow-sm"
                    style={{ border: '3px solid #dee2e6', borderRadius: '8px' }}
                    role="button"
                    onClick={() => openViewer(file)}
                  >
                    <CCardBody>
                      {/* Thumbnail */}
                      <div className="mb-2" style={{ width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(() => {
                          const thumb = resolveFileThumbUrl(file);
                          const kind = getFileKind(file);
                          if (thumb) {
                            return (
                              <img
                                src={thumb}
                                alt={file.name}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={(e) => { e.stopPropagation(); openViewer(file); }}
                              />
                            );
                          }
                          // Icon fallback
                          const fallbackIcon = kind === 'video' ? cilVideo : kind === 'pdf' ? cilFile : cilFile;
                          return <CIcon icon={fallbackIcon} size="xxl" className="text-muted" />;
                        })()}
                      </div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <CBadge color="info" className="text-uppercase">{file.fileType || 'file'}</CBadge>
                        <div className="d-flex gap-2 flex-wrap align-items-center justify-content-end">
                          {(isAdmin || canDownloadFile(file.id)) && (
                            <CButton
                              size="sm"
                              color="info"
                              variant="outline"
                              style={iconBtnStyle}
                              onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }}
                              aria-label={t('resources.actions.download', 'Download')}
                              title={t('resources.actions.download', 'Download')}
                            >
                              <CIcon icon={cilCloudDownload} style={{ width: 16, height: 16 }} />
                            </CButton>
                          )}
                          {isAdmin && (
                            <>
                              <CButton
                                size="sm"
                                color="secondary"
                                variant="outline"
                                style={iconBtnStyle}
                                onClick={(e) => { e.stopPropagation(); openFileModal(file); }}
                                aria-label={t('resources.actions.edit', 'Edit')}
                                title={t('resources.actions.edit', 'Edit')}
                              >
                                <CIcon icon={cilPencil} style={{ width: 16, height: 16 }} />
                              </CButton>
                              <CButton
                                size="sm"
                                color="danger"
                                variant="outline"
                                style={iconBtnStyle}
                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                                aria-label={t('resources.actions.delete', 'Delete')}
                                title={t('resources.actions.delete', 'Delete')}
                              >
                                <CIcon icon={cilTrash} style={{ width: 16, height: 16 }} />
                              </CButton>
                            </>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="d-flex align-items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                          <CFormSwitch
                            size="lg"
                            id={`download-${file.id}`}
                            checked={fileDownloadPermissions[file.id] || false}
                            onChange={() => toggleFileDownloadPermission(file.id)}
                            title={t('resources.toggles.allowDownloadTitle', 'Toggle download for all users')}
                            style={{ accentColor }}
                            className="switch-contrast"
                          />
                          <span className="small text-nowrap">
                            {t('resources.toggles.allowDownload', 'Allow download')}:
                          </span>
                          <CBadge color={fileDownloadPermissions[file.id] ? 'success' : 'secondary'}>
                            {fileDownloadPermissions[file.id] ? t('common.on', 'On') : t('common.off', 'Off')}
                          </CBadge>
                        </div>
                      )}
                      <div className="text-truncate fw-semibold" title={file.name}>{file.name}</div>
                      {file.description && (
                        <div className="text-muted small mt-1 text-truncate" title={file.description}>{file.description}</div>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
            </CRow>
          )}
        </CCardBody>
      </CCard>
    );
  };

  const pinned = resourceData?.pinned || { announcements: [], links: [], files: [] };
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleBackToAll = useCallback(() => {
    setFilters({ search: '', categoryId: 'all', medium: 'all' });
  }, []);

  const refreshData = async () => {
    await fetchResources();
    if (isAdmin) {
      await fetchCategories();
    }
  };

  const handleCreateCategoryScaffold = async () => {
    if (scaffoldLoading) {
      return;
    }
    if (!window.confirm(t('resources.messages.confirmScaffold', 'Are you sure you want to create starter categories?'))) {
      return;
    }
    try {
      setScaffoldLoading(true);
      const response = await axiosInstance.post(SCAFFOLD_ENDPOINT);
      const createdCount = Array.isArray(response.data?.created) ? response.data.created.length : 0;
      const message = createdCount > 0
        ? t('resources.messages.scaffoldCreated', 'Starter categories created successfully')
        : t('resources.messages.scaffoldAlreadyExists', 'Categories already exist');
      showFeedback('success', message);
      await refreshData();
    } catch (error) {
      console.error('Error creating scaffolded categories:', error);
      const message = error.response?.data?.message || t('resources.messages.scaffoldFailed', 'Failed to create categories');
      showFeedback('danger', message);
    } finally {
      setScaffoldLoading(false);
    }
  };

  const openCategoryModal = (category = null, parentId = null) => {
    if (category) {
      setCategoryModal({
        visible: true,
        isEdit: true,
        form: {
          id: category.id,
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          color: category.color || '',
          icon: category.icon || '',
          parentId: category.parentId ? String(category.parentId) : '',
          sortOrder: category.sortOrder ?? 0,
          isActive: category.isActive ?? true,
          isPinned: category.isPinned ?? false,
          pinnedOrder: category.pinnedOrder ?? 0,
          // Keep the currently-served thumbnail URL only for preview; do not persist or submit
          existingThumbnailUrl: category.thumbnailUrl || null,
        },
      });
    } else {
      setCategoryModal({
        visible: true,
        isEdit: false,
        form: { ...emptyCategoryForm, parentId: parentId ? String(parentId) : '' },
      });
    }
  };

  const closeCategoryModal = () => {
    // Clean up any pending thumbnail preview URL
    if (categoryModal.form.pendingThumbnailPreview) {
      URL.revokeObjectURL(categoryModal.form.pendingThumbnailPreview);
    }
    setCategoryModal({ visible: false, isEdit: false, form: { ...emptyCategoryForm } });
  };

  const handleCategoryFieldChange = (field, value) => {
    setCategoryModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };

  const handleCategorySubmit = async () => {
    const form = categoryModal.form;
    if (!form.name.trim()) {
      showFeedback('danger', t('resources.messages.categoryNameRequired', 'Category name is required'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description || null,
      color: form.color || null,
      icon: form.icon || null,
      parent_id: form.parentId ? Number(form.parentId) : null,
      sort_order: Number(form.sortOrder) || 0,
      is_active: !!form.isActive,
      is_pinned: !!form.isPinned,
      pinned_order: Number(form.pinnedOrder) || 0,
    };

    try {
      setActionLoading(true);
      let categoryId = form.id;

      if (categoryModal.isEdit && form.id) {
        await axiosInstance.put(`${CATEGORY_ENDPOINT}/${form.id}`, payload);
        showFeedback('success', t('resources.messages.categoryUpdated', 'Category updated successfully'));
      } else {
        const { data } = await axiosInstance.post(CATEGORY_ENDPOINT, payload);
        categoryId = data?.data?.id;
        showFeedback('success', t('resources.messages.categoryCreated', 'Category created successfully'));
      }

      // Upload pending thumbnail if exists
      if (form.pendingThumbnail && categoryId) {
        try {
          const fd = new FormData();
          fd.append('thumbnail', form.pendingThumbnail);
          await axiosInstance.post(`${CATEGORY_ENDPOINT}/${categoryId}/thumbnail`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'));
        } catch (thumbnailError) {
          console.error('Error uploading pending thumbnail:', thumbnailError);
          showFeedback('warning', t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail'));
        }
      }

      closeCategoryModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving category:', error);
      const message = error.response?.data?.message || t('resources.messages.categorySaveFailed', 'Failed to save category');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategoryThumbnailSelection = async (file) => {
    const form = categoryModal.form;
    if (!file) return;

    // If this is a new category, store the file for later upload
    if (!categoryModal.isEdit || !form.id) {
      setCategoryModal((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          pendingThumbnail: file,
          pendingThumbnailPreview: URL.createObjectURL(file)
        }
      }));
      showFeedback('info', t('resources.messages.thumbnailWillUpload', 'Thumbnail will be uploaded when category is saved'));
      return;
    }

    // Upload immediately for existing categories
    try {
      setActionLoading(true);
      const fd = new FormData();
      fd.append('thumbnail', file);
      const { data } = await axiosInstance.post(`${CATEGORY_ENDPOINT}/${form.id}/thumbnail`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = data?.data;
      setCategoryModal((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          // Do not set thumbnailUrl to the served API URL to avoid persisting it on save
          uploadedThumbnailUrl: updated?.thumbnailUrl || prev.form.uploadedThumbnailUrl,
          pendingThumbnail: null,
          pendingThumbnailPreview: null
        },
      }));
      await refreshData();
      showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'));
    } catch (error) {
      console.error('Error uploading category thumbnail:', error);
      const message = error.response?.data?.message || t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(t('resources.messages.confirmDeleteCategory', { name: category.name }))) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`${CATEGORY_ENDPOINT}/${category.id}`);
      showFeedback('success', t('resources.messages.categoryDeleted', 'Category deleted successfully'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting category:', error);
      const message = error.response?.data?.message || t('resources.messages.categoryDeleteFailed', 'Failed to delete category');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const openLinkModal = (link = null) => {
    if (link) {
      setLinkModal({
        visible: true,
        isEdit: true,
        form: {
          id: link.id,
          title: link.title || '',
          url: link.url || '',
          type: link.type || 'external',
          description: link.description || '',
          categoryId: link.categoryId ? String(link.categoryId) : '',
          thumbnailUrl: link.thumbnailUrl || '',
          isPinned: !!link.isPinned,
          pinnedOrder: link.pinnedOrder ?? 0,
          tags: serializeTags(link.tags),
          ctaLabel: link.ctaLabel || '',
          ctaUrl: link.ctaUrl || '',
          status: link.status || 'active',
          visibleToGroupTypes: Array.isArray(link.visibleToGroupTypes) && link.visibleToGroupTypes.length ? link.visibleToGroupTypes : ['admin'],
          visibleToGroupIds: Array.isArray(link.visibleToGroupIds) ? link.visibleToGroupIds.join(', ') : '',
        },
      });
    } else {
      setLinkModal({ visible: true, isEdit: false, form: { ...emptyLinkForm } });
    }
  };

  const closeLinkModal = () => {
    setLinkModal({ visible: false, isEdit: false, form: { ...emptyLinkForm } });
  };

  const handleLinkFieldChange = (field, value) => {
    setLinkModal((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }));
  };

  const handleLinkSubmit = async () => {
    const form = linkModal.form;
    if (!form.title.trim() || !form.url.trim()) {
      showFeedback('danger', t('resources.messages.linkRequired', 'Link title and URL are required'));
      return;
    }

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      type: form.type,
      description: form.description || null,
      category_id: form.categoryId || null,
      thumbnail_url: form.thumbnailUrl || null,
      is_pinned: !!form.isPinned,
      pinned_order: Number(form.pinnedOrder) || 0,
      tags: normalizeTagsInput(form.tags),
      cta_label: form.ctaLabel || null,
    };
    try {
      setActionLoading(true);
      if (linkModal.isEdit && form.id) {
        await axiosInstance.put(`${LINKS_ENDPOINT}/${form.id}`, payload);
        showFeedback('success', t('resources.messages.linkUpdated', 'Link updated successfully'));
      } else {
        await axiosInstance.post(LINKS_ENDPOINT, payload);
        showFeedback('success', t('resources.messages.linkCreated', 'Link created successfully'));
      }
      closeLinkModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving link:', error);
      const message = error.response?.data?.message || t('resources.messages.linkSaveFailed', 'Failed to save link');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLink = async (link) => {
    if (!window.confirm(t('resources.messages.confirmDeleteLink', { title: link.title }))) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`${LINKS_ENDPOINT}/${link.id}`);
      showFeedback('success', t('resources.messages.linkDeleted', 'Link deleted successfully'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting link:', error);
      const message = error.response?.data?.message || t('resources.messages.linkDeleteFailed', 'Failed to delete link');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const openFileModal = (file = null) => {
    if (file) {
      setFileModal({
        visible: true,
        isEdit: true,
        form: {
          id: file.id,
          name: file.name || '',
          description: file.description || '',
          categoryId: file.categoryId ? String(file.categoryId) : '',
          // Keep the currently-served thumbnail URL only for preview; do not persist or submit
          existingThumbnailUrl: file.thumbnailUrl || null,
          isPinned: !!file.isPinned,
          pinnedOrder: file.pinnedOrder ?? 0,
          tags: serializeTags(file.tags),
          ctaLabel: file.ctaLabel || '',
          ctaUrl: file.ctaUrl || '',
          status: file.status || 'active',
          visibleToGroupTypes: Array.isArray(file.visibleToGroupTypes) && file.visibleToGroupTypes.length ? file.visibleToGroupTypes : ['admin'],
          visibleToGroupIds: Array.isArray(file.visibleToGroupIds) ? file.visibleToGroupIds.join(', ') : '',
          file: null,
          pendingThumbnail: null,
          pendingThumbnailPreview: null,
          uploadedThumbnailUrl: null,
        },
      });
    } else {
      setFileModal({ visible: true, isEdit: false, form: { ...emptyFileForm } });
    }
  };

  const closeFileModal = () => {
    if (fileModal.form?.pendingThumbnailPreview) {
      URL.revokeObjectURL(fileModal.form.pendingThumbnailPreview);
    }
    setFileModal({ visible: false, isEdit: false, form: { ...emptyFileForm } });
  };

  const handleFileFieldChange = (field, value) => {
    setFileModal((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }));
  };

  const handleFileSelection = (file) => {
    setFileModal((prev) => ({
      ...prev,
      form: { ...prev.form, file },
    }));
  };

  const handleFileSubmit = async () => {
    const form = fileModal.form;
    if (!fileModal.isEdit && !form.file) {
      showFeedback('danger', t('resources.messages.fileRequired'));
      return;
    }

    console.log('Uploading file:', form.file?.name, 'type:', form.file?.type, 'size:', form.file?.size);

    const payload = new FormData();
    if (form.name) payload.append('name', form.name);
    if (form.description) payload.append('description', form.description);
    payload.append('category_id', form.categoryId || '');
  // Do not send thumbnail_url; we upload via dedicated endpoint
    payload.append('is_pinned', form.isPinned ? 'true' : 'false');
    payload.append('pinned_order', form.pinnedOrder ? String(form.pinnedOrder) : '0');
    payload.append('tags', JSON.stringify(normalizeTagsInput(form.tags)));
    payload.append('cta_label', form.ctaLabel || '');
    payload.append('cta_url', form.ctaUrl || '');
    payload.append('status', form.status || 'active');
    payload.append('visible_to_group_types', JSON.stringify(form.visibleToGroupTypes || ['admin']));
    payload.append('visible_to_group_ids', JSON.stringify(normalizeVisibilityInput(form.visibleToGroupIds)));
    if (form.file) {
      payload.append('file', form.file);
    }

    try {
      setActionLoading(true);
      if (fileModal.isEdit && form.id) {
        const { data } = await axiosInstance.put(`${FILES_ENDPOINT}/${form.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showFeedback('success', t('resources.messages.fileUpdated'));
        // If a pending thumbnail exists, upload it now
        if (form.pendingThumbnail) {
          try {
            const fd = new FormData();
            fd.append('thumbnail', form.pendingThumbnail);
            await axiosInstance.post(`${FILES_ENDPOINT}/${form.id}/thumbnail`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'));
          } catch (thumbnailError) {
            console.error('Error uploading file thumbnail:', thumbnailError);
            showFeedback('warning', t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail'));
          }
        }
      } else {
        const { data } = await axiosInstance.post(FILES_ENDPOINT, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showFeedback('success', t('resources.messages.fileUploaded'));
        // If we created a new file and have a pending thumbnail, upload it to the newly created id
        const newId = data?.data?.id;
        if (newId && form.pendingThumbnail) {
          try {
            const fd = new FormData();
            fd.append('thumbnail', form.pendingThumbnail);
            await axiosInstance.post(`${FILES_ENDPOINT}/${newId}/thumbnail`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'));
          } catch (thumbnailError) {
            console.error('Error uploading file thumbnail (create):', thumbnailError);
            showFeedback('warning', t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail'));
          }
        }
      }
      closeFileModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving file:', error);
      const message = error.response?.data?.message || t('resources.messages.fileSaveFailed');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileThumbnailSelection = async (file) => {
    const form = fileModal.form;
    if (!file) return;
    // If this is a new file (no id yet), stage for later upload
    if (!fileModal.isEdit || !form.id) {
      setFileModal((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          pendingThumbnail: file,
          pendingThumbnailPreview: URL.createObjectURL(file),
        },
      }));
      showFeedback('info', t('resources.messages.thumbnailWillUpload', 'Thumbnail will be uploaded when file is saved'));
      return;
    }
    // Upload immediately for existing files
    try {
      setActionLoading(true);
      const fd = new FormData();
      fd.append('thumbnail', file);
      const { data } = await axiosInstance.post(`${FILES_ENDPOINT}/${form.id}/thumbnail`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updated = data?.data;
      setFileModal((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          uploadedThumbnailUrl: updated?.thumbnailUrl || prev.form.uploadedThumbnailUrl,
          pendingThumbnail: null,
          pendingThumbnailPreview: null,
        },
      }));
      await refreshData();
      showFeedback('success', t('resources.messages.thumbnailUploaded', 'Thumbnail uploaded successfully'));
    } catch (error) {
      console.error('Error uploading file thumbnail:', error);
      const message = error.response?.data?.message || t('resources.messages.thumbnailUploadFailed', 'Failed to upload thumbnail');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(t('resources.messages.confirmDeleteFile', { name: file.originalName || file.name }))) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`${FILES_ENDPOINT}/${file.id}`);
      showFeedback('success', t('resources.messages.fileDeleted'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting file:', error);
      const message = error.response?.data?.message || t('resources.messages.fileDeleteFailed');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const openAnnouncementModal = (announcement = null) => {
    if (announcement) {
      setAnnouncementModal({
        visible: true,
        isEdit: true,
        form: {
          id: announcement.id,
          title: announcement.title || '',
          summary: announcement.summary || '',
          body: announcement.body || '',
          categoryId: announcement.categoryId ? String(announcement.categoryId) : '',
          isPinned: !!announcement.isPinned,
          pinnedOrder: announcement.pinnedOrder ?? 0,
          publishAt: formatDateTimeForInput(announcement.publishAt),
          expireAt: formatDateTimeForInput(announcement.expireAt),
          ctaLabel: announcement.ctaLabel || '',
          ctaUrl: announcement.ctaUrl || '',
          status: announcement.status || 'published',
          visibleToGroupTypes: Array.isArray(announcement.visibleToGroupTypes) && announcement.visibleToGroupTypes.length ? announcement.visibleToGroupTypes : ['admin'],
          visibleToGroupIds: Array.isArray(announcement.visibleToGroupIds) ? announcement.visibleToGroupIds.join(', ') : '',
        },
      });
    } else {
      setAnnouncementModal({ visible: true, isEdit: false, form: { ...emptyAnnouncementForm } });
    }
  };

  const closeAnnouncementModal = () => {
    setAnnouncementModal({ visible: false, isEdit: false, form: { ...emptyAnnouncementForm } });
  };

  const handleAnnouncementFieldChange = (field, value) => {
    setAnnouncementModal((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }));
  };

  const handleAnnouncementSubmit = async () => {
    const form = announcementModal.form;
    if (!form.title.trim()) {
      showFeedback('danger', t('resources.messages.announcementTitleRequired'));
      return;
    }

    const payload = {
      title: form.title.trim(),
      summary: form.summary || null,
      body: form.body || null,
      category_id: form.categoryId || null,
      is_pinned: !!form.isPinned,
      pinned_order: Number(form.pinnedOrder) || 0,
      publish_at: toISOStringOrNull(form.publishAt),
      expire_at: toISOStringOrNull(form.expireAt),
      cta_label: form.ctaLabel || null,
      cta_url: form.ctaUrl || null,
      status: form.status || 'published',
      visible_to_group_types: form.visibleToGroupTypes || ['admin'],
      visible_to_group_ids: normalizeVisibilityInput(form.visibleToGroupIds),
    };

    try {
      setActionLoading(true);
      if (announcementModal.isEdit && form.id) {
        await axiosInstance.put(`${ANNOUNCEMENTS_ENDPOINT}/${form.id}`, payload);
        showFeedback('success', t('resources.messages.announcementUpdated'));
      } else {
        await axiosInstance.post(ANNOUNCEMENTS_ENDPOINT, payload);
        showFeedback('success', t('resources.messages.announcementCreated'));
      }
      closeAnnouncementModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      const message = error.response?.data?.message || t('resources.messages.announcementSaveFailed');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcement) => {
    if (!window.confirm(t('resources.messages.confirmDeleteAnnouncement', { title: announcement.title }))) {
      return;
    }
    try {
      setActionLoading(true);
      await axiosInstance.delete(`${ANNOUNCEMENTS_ENDPOINT}/${announcement.id}`);
      showFeedback('success', t('resources.messages.announcementDeleted'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      const message = error.response?.data?.message || t('resources.messages.announcementDeleteFailed');
      showFeedback('danger', message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenLink = (link) => {
    if (link?.url) {
      window.open(link.url, '_blank', 'noopener');
    }
  };

  const handleDownloadFile = (file) => {
    // Check download permissions for this specific file
    if (!canDownloadFile(file.id)) {
      showFeedback('warning', t('resources.messages.downloadNotAllowed', 'Downloads are not allowed for this file. Contact an administrator for access.'));
      return;
    }

    const url = resolveFileUrl(file);
    if (!url) {
      showFeedback('danger', t('resources.messages.fileAccessFailed'));
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    }
  };

  const openViewer = (file) => {
    if (!file) return;
    setViewerModal({ visible: true, file });
  };
  const closeViewer = () => setViewerModal({ visible: false, file: null });
  const renderPinnedHighlights = () => {
    if (!pinned.announcements.length && !pinned.links.length && !pinned.files.length) {
      return null;
    }
    return (
      <CRow className="g-3 mb-4">
        {pinned.announcements.length > 0 && (
          <CCol md={4}>
            <CCard className="border-0 shadow-sm h-100">
              <CCardHeader className="bg-transparent border-0">
                <h6 className="mb-0 d-flex align-items-center gap-2 text-warning">
                  <CIcon icon={cilBullhorn} />
                  {t('resources.pinned.announcements')}
                </h6>
              </CCardHeader>
              <CCardBody>
                <CListGroup flush>
                  {pinned.announcements.slice(0, 5).map((announcement) => (
                    <CListGroupItem key={`pin-announcement-${announcement.id}`} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{announcement.title}</div>
                        {announcement.summary && <div className="small text-muted">{announcement.summary}</div>}
                      </div>
                      {isAdmin && (
                        <div className="d-flex gap-2">
                          <CButton color="secondary" size="sm" variant="ghost" onClick={() => openAnnouncementModal(announcement)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteAnnouncement(announcement)}>
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </div>
                      )}
                    </CListGroupItem>
                  ))}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>
        )}
        {pinned.links.length > 0 && (
          <CCol md={4}>
            <CCard className="border-0 shadow-sm h-100">
              <CCardHeader className="bg-transparent border-0">
                <h6 className="mb-0 d-flex align-items-center gap-2 text-success">
                  <CIcon icon={cilLink} />
                  {t('resources.pinned.links')}
                </h6>
              </CCardHeader>
              <CCardBody>
                <CListGroup flush>
                  {pinned.links.slice(0, 5).map((link) => (
                    <CListGroupItem key={`pin-link-${link.id}`} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{link.title}</div>
                        <div className="small text-muted text-break">{link.url}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <CButton color="primary" size="sm" variant="ghost" onClick={() => handleOpenLink(link)}>
                          <CIcon icon={cilLink} />
                        </CButton>
                        {isAdmin && (
                          <CButton color="secondary" size="sm" variant="ghost" onClick={() => openLinkModal(link)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                        )}
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>
        )}
        {pinned.files.length > 0 && (
          <CCol md={4}>
            <CCard className="border-0 shadow-sm h-100">
              <CCardHeader className="bg-transparent border-0">
                <h6 className="mb-0 d-flex align-items-center gap-2 text-info">
                  <CIcon icon={cilCloudDownload} />
                  {t('resources.pinned.files')}
                </h6>
              </CCardHeader>
              <CCardBody>
                <CListGroup flush>
                  {pinned.files.slice(0, 5).map((file) => (
                    <CListGroupItem key={`pin-file-${file.id}`} className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{file.name}</div>
                        <div className="small text-muted">{file.size}</div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap align-items-center justify-content-end">
                        {(isAdmin || canDownloadFile(file.id)) && (
                          <CButton
                            color="info"
                            size="sm"
                            variant="outline"
                            style={iconBtnStyle}
                            onClick={() => handleDownloadFile(file)}
                            aria-label={t('resources.actions.download', 'Download')}
                          >
                            <CIcon icon={cilCloudDownload} style={{ width: 16, height: 16 }} />
                          </CButton>
                        )}
                        {isAdmin && (
                          <>
                            <div className="d-flex align-items-center gap-2">
                              <CFormSwitch
                                size="lg"
                                id={`pinned-download-${file.id}`}
                                checked={fileDownloadPermissions[file.id] || false}
                                onChange={() => toggleFileDownloadPermission(file.id)}
                                title={t('resources.toggles.allowDownloadTitle', 'Toggle download for all users')}
                                style={{ accentColor }}
                                className="switch-contrast"
                              />
                              <span className="small text-nowrap">
                                {t('resources.toggles.allowDownload', 'Allow download')}:
                              </span>
                              <CBadge color={fileDownloadPermissions[file.id] ? 'success' : 'secondary'}>
                                {fileDownloadPermissions[file.id] ? t('common.on', 'On') : t('common.off', 'Off')}
                              </CBadge>
                            </div>
                            <CButton
                              color="secondary"
                              size="sm"
                              variant="outline"
                              style={iconBtnStyle}
                              onClick={() => openFileModal(file)}
                              aria-label={t('resources.actions.edit', 'Edit')}
                            >
                              <CIcon icon={cilPencil} style={{ width: 16, height: 16 }} />
                            </CButton>
                          </>
                        )}
                      </div>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              </CCardBody>
            </CCard>
          </CCol>
        )}
      </CRow>
    );
  };

  const renderFilters = () => {
    const visibleAnnouncementsCount = (resourceData?.announcements || []).filter((a) => passesFiltersIgnoringMedium(a, 'announcements')).length;
    const visibleLinksCount = (resourceData?.links || []).filter((l) => passesFiltersIgnoringMedium(l, 'links')).length;
    const visibleFilesCount = (resourceData?.files || []).filter((f) => passesFiltersIgnoringMedium(f, 'files')).length;

    const topLevelCategories = Array.isArray(categoriesForDisplay) ? categoriesForDisplay.slice(0, 6) : [];
    const showBackToAll = filters.categoryId !== 'all' || filters.medium !== 'all';

    return (
      <CCard className="border-0 shadow-sm mb-4">
        {showBackToAll && (
          <CCardHeader className="bg-transparent border-0 pt-3 pb-0">
            <CButton color="secondary" variant="ghost" className="px-0 d-inline-flex align-items-center" onClick={handleBackToAll}>
              <CIcon icon={cilArrowLeft} className="me-2" />
              {t('common.back')}
            </CButton>
          </CCardHeader>
        )}
        <CCardBody>
          {/* Medium tabs - only show when not viewing a specific category */}
          {filters.categoryId === 'all' && (
            <CNav variant="pills" role="tablist" className="mb-3 flex-wrap">
              {[{ key: 'all', label: t('resources.filters.medium.all'), count: visibleAnnouncementsCount + visibleLinksCount + visibleFilesCount },
                { key: 'announcements', label: t('resources.filters.medium.announcements'), count: visibleAnnouncementsCount },
                { key: 'links', label: t('resources.filters.medium.links'), count: visibleLinksCount },
                { key: 'files', label: t('resources.filters.medium.files'), count: visibleFilesCount }].map((tab) => (
                <CNavItem key={tab.key}>
                  <CNavLink active={filters.medium === tab.key} onClick={() => handleFilterChange('medium', tab.key)} className="d-flex align-items-center gap-2">
                    <span>{tab.label}</span>
                    <CBadge color={filters.medium === tab.key || tab.key === 'all' ? 'primary' : 'secondary'}>{tab.count}</CBadge>
                  </CNavLink>
                </CNavItem>
              ))}
            </CNav>
          )}

          {/* Search and select filters (no medium dropdown; tabs above handle medium) */}
          <CForm>
            <CRow className="g-3 align-items-end">
              <CCol md={4}>
                <CFormLabel className="fw-semibold">{t('resources.filters.search')}</CFormLabel>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    value={filters.search}
                    placeholder={t('resources.filters.searchPlaceholder')}
                    onChange={(event) => handleFilterChange('search', event.target.value)}
                  />
                </CInputGroup>
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold">{t('resources.filters.category')}</CFormLabel>
                <CFormSelect value={filters.categoryId} onChange={(event) => handleFilterChange('categoryId', event.target.value)}>
                  {categoryFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>
    );
  };

  const renderAnnouncementListItem = (announcement) => (
    <CListGroupItem key={`announcement-${announcement.id}`} className="d-flex justify-content-between align-items-start">
      <div>
        <div className="fw-semibold d-flex align-items-center gap-2">
          {announcement.title}
          {announcement.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
        </div>
        {announcement.summary && <div className="text-muted small">{announcement.summary}</div>}
        <div className="text-muted small mt-1">
          {announcement.publishAt && (
            <span>
              {t('resources.labels.published')} {new Date(announcement.publishAt).toLocaleDateString()}
            </span>
          )}
          {announcement.expireAt && (
            <span className="ms-2">
              {t('resources.labels.expires')} {new Date(announcement.expireAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="d-flex gap-2">
        {isAdmin && (
          <>
            <CButton color="secondary" size="sm" variant="ghost" onClick={() => openAnnouncementModal(announcement)}>
              <CIcon icon={cilPencil} />
            </CButton>
            <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteAnnouncement(announcement)}>
              <CIcon icon={cilTrash} />
            </CButton>
          </>
        )}
      </div>
    </CListGroupItem>
  );

  const renderAnnouncementsSection = () => {
    if (filters.medium !== 'all' && filters.medium !== 'announcements') {
      return null;
    }
    return (
      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent border-0">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilBullhorn} className="text-warning" />
            <h5 className="mb-0">{t('resources.announcements.title')}</h5>
            <CBadge color="warning" className="ms-2">
              {filteredAnnouncements.length}
            </CBadge>
          </div>
          {isAdmin && (
            <CButton color="warning" size="sm" onClick={() => openAnnouncementModal()}>
              <CIcon icon={cilPlus} className="me-2" />
              {t('resources.actions.newAnnouncement')}
            </CButton>
          )}
        </CCardHeader>
        <CCardBody>
          {sortedAnnouncements.length === 0 ? (
            <div className="text-muted">{t('resources.announcements.empty')}</div>
          ) : (
            <CListGroup flush>
              {sortedAnnouncements.map((announcement) => renderAnnouncementListItem(announcement))}
            </CListGroup>
          )}
        </CCardBody>
      </CCard>
    );
  };

// removed legacy renderMediaLibrary; unified grid is handled by renderFilesGrid

const getLinkTypeMeta = (type) => LINK_TYPE_OPTIONS.find((option) => option.value === type) || LINK_TYPE_OPTIONS[0];

  const getFileTypeMeta = (type) => FILE_TYPE_META[type] || FILE_TYPE_META.other;

  const renderCategoryResources = (categoryId) => {
    const bucket = resourcesByCategory[String(categoryId)] || { announcements: [], links: [], files: [] };
    const announcements = bucket.announcements.filter((item) => passesFiltersIgnoringMedium(item, 'announcements'));
    const links = bucket.links.filter((item) => passesFiltersIgnoringMedium(item, 'links'));
    const files = bucket.files.filter((item) => passesFiltersIgnoringMedium(item, 'files'));

    if (!announcements.length && !links.length && !files.length) {
      return <div className="text-muted small">{t('resources.messages.noMatching')}</div>;
    }

    return (
      <>
        {announcements.length > 0 && (
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-2">{t('resources.announcements.title')}</h6>
            <CListGroup flush>
              {[...announcements]
                .sort((a, b) => {
                  const pinnedCmp = comparePinned(a, b);
                  if (pinnedCmp !== 0) return pinnedCmp;
                  const da = a?.publishAt ? new Date(a.publishAt).getTime() : 0;
                  const db = b?.publishAt ? new Date(b.publishAt).getTime() : 0;
                  if (da !== db) return db - da;
                  return String(a.title || '').localeCompare(String(b.title || ''));
                })
                .map((announcement) => renderAnnouncementListItem(announcement))}
            </CListGroup>
          </div>
        )}
        {links.length > 0 && (
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-2">{t('resources.links.title')}</h6>
            <CListGroup flush>
              {[...links]
                .sort((a, b) => {
                  const pinnedCmp = comparePinned(a, b);
                  if (pinnedCmp !== 0) return pinnedCmp;
                  return String(a.title || '').localeCompare(String(b.title || ''));
                })
                .map((link) => {
                const meta = getLinkTypeMeta(link.type);
                return (
                  <CListGroupItem key={`link-${link.id}`} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <CIcon icon={meta.icon} className={`text-${meta.color}`} />
                        <span role="button" className="text-primary" onClick={() => handleOpenLink(link)}>
                          {link.title}
                        </span>
                        {link.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                      </div>
                      {link.description && <div className="text-muted small">{link.description}</div>}
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <CButton color="primary" size="sm" variant="ghost" onClick={() => handleOpenLink(link)}>
                        <CIcon icon={cilLink} />
                      </CButton>
                      {isAdmin && (
                        <>
                          <CButton color="secondary" size="sm" variant="ghost" onClick={() => openLinkModal(link)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteLink(link)}>
                            <CIcon icon={cilTrash} />
                          </CButton>
                        </>
                      )}
                    </div>
                  </CListGroupItem>
                );
              })}
            </CListGroup>
          </div>
        )}
        {files.length > 0 && (
          <CRow className="g-3">
            {[...files]
              .sort((a, b) => {
                const pinnedCmp = comparePinned(a, b);
                if (pinnedCmp !== 0) return pinnedCmp;
                return String(a.name || '').localeCompare(String(b.name || ''));
              })
              .map((file) => (
                <CCol key={`file-${file.id}`} xs={12} sm={6} md={4} lg={3}>
                  <CCard className="h-100 border-0 shadow-sm" role="button" onClick={() => openViewer(file)}>
                    <CCardBody>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <CBadge color="info" className="text-uppercase">{file.fileType || 'file'}</CBadge>
                        <div className="d-flex gap-2 flex-wrap align-items-center justify-content-end">
                          {(isAdmin || canDownloadFile(file.id)) && (
                            <CButton
                              color="info"
                              size="sm"
                              variant="outline"
                              style={iconBtnStyle}
                              onClick={(e) => { e.stopPropagation(); handleDownloadFile(file); }}
                              aria-label={t('resources.actions.download', 'Download')}
                              title={t('resources.actions.download', 'Download')}
                            >
                              <CIcon icon={cilCloudDownload} style={{ width: 16, height: 16 }} />
                            </CButton>
                          )}
                          {isAdmin && (
                            <>
                              <CButton
                                color="secondary"
                                size="sm"
                                variant="outline"
                                style={iconBtnStyle}
                                onClick={(e) => { e.stopPropagation(); openFileModal(file); }}
                                aria-label={t('resources.actions.edit', 'Edit')}
                                title={t('resources.actions.edit', 'Edit')}
                              >
                                <CIcon icon={cilPencil} style={{ width: 16, height: 16 }} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                variant="outline"
                                style={iconBtnStyle}
                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                                aria-label={t('resources.actions.delete', 'Delete')}
                                title={t('resources.actions.delete', 'Delete')}
                              >
                                <CIcon icon={cilTrash} style={{ width: 16, height: 16 }} />
                              </CButton>
                            </>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="d-flex align-items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                          <CFormSwitch
                            size="lg"
                            id={`file-download-${file.id}`}
                            checked={fileDownloadPermissions[file.id] || false}
                            onChange={() => toggleFileDownloadPermission(file.id)}
                            title={t('resources.toggles.allowDownloadTitle', 'Toggle download for all users')}
                            style={{ accentColor }}
                            className="switch-contrast"
                          />
                          <span className="small text-nowrap">
                            {t('resources.toggles.allowDownload', 'Allow download')}:
                          </span>
                          <CBadge color={fileDownloadPermissions[file.id] ? 'success' : 'secondary'}>
                            {fileDownloadPermissions[file.id] ? t('common.on', 'On') : t('common.off', 'Off')}
                          </CBadge>
                        </div>
                      )}
                      <div className="text-truncate fw-semibold" title={file.name}>{file.name}</div>
                      {file.description && (
                        <div className="text-muted small mt-1 text-truncate" title={file.description}>{file.description}</div>
                      )}
                    </CCardBody>
                  </CCard>
                </CCol>
              ))}
          </CRow>
        )}
      </>
    );
  };

  const renderCategoryCard = (category, depth = 0) => {
    const allowActions = isAdmin && category.allowActions !== false;
    return (
      <div key={category.id} className={`mb-4 ${depth ? 'ms-lg-4' : ''}`}>
        <CCard className="border-0 shadow-sm">
          <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent border-0">
            <div>
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <CIcon icon={cilFolder} style={{ color: category.color || accentColor }} />
                <span>{category.name}</span>
                {category.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                {category.isActive === false && <CBadge color="secondary">{t('resources.labels.inactive')}</CBadge>}
              </h5>
              {category.description && <small className="text-muted">{category.description}</small>}
            </div>
            {allowActions && (
              <div className="d-flex gap-2">
                <CButton color="dark" size="sm" variant="ghost" onClick={() => openCategoryModal(null, category.id)}>
                  <CIcon icon={cilPlus} />
                </CButton>
                <CButton color="secondary" size="sm" variant="ghost" onClick={() => openCategoryModal(category)}>
                  <CIcon icon={cilPencil} />
                </CButton>
                <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteCategory(category)}>
                  <CIcon icon={cilTrash} />
                </CButton>
              </div>
            )}
          </CCardHeader>
          <CCardBody>{renderCategoryResources(category.id)}</CCardBody>
        </CCard>
        {Array.isArray(category.children) && category.children.length > 0 && (
          <div className="mt-3">
            {category.children.map((child) => renderCategoryCard(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderUncategorizedCard = () => {
    const bucket = resourcesByCategory.uncategorized;
    if (!bucket || (!bucket.announcements.length && !bucket.links.length && !bucket.files.length)) {
      return null;
    }
    const pseudoCategory = {
      id: 'uncategorized',
      name: t('resources.categories.uncategorized'),
      description: t('resources.categories.uncategorizedDescription'),
      color: accentColor,
      allowActions: false,
      children: [],
    };
    return renderCategoryCard(pseudoCategory);
  };
  const headerSubtitle = isAdmin
    ? t('resources.headerAdmin', 'Manage categories, links, announcements and files')
    : t('resources.headerContractor', { group: contractorGroupName || '' }, `Resources for ${contractorGroupName || 'your group'}`);

  return (
    <CContainer fluid className="resources-page pb-5" style={{ '--accent-color': accentColor }}>
      <style>{`
        /* Scoped styles for Resources page */
        .resources-page .switch-contrast.form-check-input:not(:checked) {
          background-color: #e9ecef !important; /* light gray track */
          border-color: #6c757d !important;     /* darker gray border */
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.12);
        }
        .resources-page .switch-contrast.form-check-input:checked {
          background-color: var(--accent-color) !important;
          border-color: var(--accent-color) !important;
        }
        .resources-page .switch-contrast.form-check-input:focus {
          box-shadow: 0 0 0 .2rem rgba(0,0,0,.08);
        }
      `}</style>
      <PageHeader
        title={t('nav.resources', 'Resources')}
        subtitle={headerSubtitle}
        icon={FolderIcon}
        mobileLayout="stack"
        rightContent={
          isAdmin && (
            <div className="d-flex flex-wrap gap-2">
              <CButton
                color="primary"
                size="sm"
                className="use-header-color d-flex align-items-center"
                onClick={handleCreateCategoryScaffold}
                disabled={scaffoldLoading}
              >
                {scaffoldLoading ? (
                  <CSpinner size="sm" className="me-2" />
                ) : (
                  <CIcon icon={cilFolder} className="me-2" />
                )}
                {t('resources.actions.scaffoldCategories', 'Create Starter Categories')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                variant="outline"
                className="use-header-color"
                onClick={() => openCategoryModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                {t('resources.actions.newCategory', 'New Category')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                className="use-header-color"
                onClick={() => openAnnouncementModal()}
              >
                <CIcon icon={cilBullhorn} className="me-2" />
                {t('resources.actions.newAnnouncement')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                className="use-header-color"
                onClick={() => openLinkModal()}
              >
                <CIcon icon={cilLink} className="me-2" />
                {t('resources.actions.newLink')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                className="use-header-color"
                onClick={() => openFileModal()}
              >
                <CIcon icon={cilCloudUpload} className="me-2" />
                {t('resources.actions.uploadFile')}
              </CButton>
            </div>
          )
        }
      />

      {feedback && (
        <CAlert color={feedback.type} className="shadow-sm" dismissible onClose={() => setFeedback(null)}>
          {feedback.message}
        </CAlert>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <CSpinner color="primary" className="me-3" />
          <span className="text-muted">{t('resources.messages.loading')}</span>
        </div>
      ) : (
        <>
          {renderFilters()}

          {/* Show category tiles on All view with no explicit category filter */}
          {filters.medium === 'all' && filters.categoryId === 'all' && renderCategoryTilesGrid()}

          {/* If a specific medium is chosen, show only that section */}
          {filters.medium === 'announcements' && renderAnnouncementsSection()}
          {filters.medium === 'files' && renderFilesGrid(sortedFiles)}
          {filters.medium === 'links' && (
            <CCard className="border-0 shadow-sm mb-4">
              <CCardHeader className="d-flex justify-content-between align-items-center bg-transparent border-0">
                <div className="d-flex align-items-center gap-2">
                  <CIcon icon={cilLink} className="text-success" />
                  <h5 className="mb-0">{t('resources.links.title')}</h5>
                  <CBadge color="success" className="ms-2">{sortedLinks.length}</CBadge>
                </div>
                {isAdmin && (
                  <CButton color="success" size="sm" onClick={() => openLinkModal()}>
                    <CIcon icon={cilPlus} className="me-2" />
                    {t('resources.actions.newLink')}
                  </CButton>
                )}
              </CCardHeader>
              <CCardBody>
                {sortedLinks.length === 0 ? (
                  <div className="text-muted">{t('resources.links.empty')}</div>
                ) : (
                  <CListGroup flush>
                    {sortedLinks.map((link) => {
                      const meta = getLinkTypeMeta(link.type);
                      return (
                        <CListGroupItem key={`link-tab-${link.id}`} className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold d-flex align-items-center gap-2">
                              <CIcon icon={meta.icon} className={`text-${meta.color}`} />
                              <span role="button" className="text-primary" onClick={() => handleOpenLink(link)}>
                                {link.title}
                              </span>
                              {link.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                            </div>
                            {link.description && <div className="text-muted small">{link.description}</div>}
                          </div>
                          <div className="d-flex gap-2 align-items-center">
                            <CButton color="primary" size="sm" variant="ghost" onClick={() => handleOpenLink(link)}>
                              <CIcon icon={cilLink} />
                            </CButton>
                            {isAdmin && (
                              <>
                                <CButton color="secondary" size="sm" variant="ghost" onClick={() => openLinkModal(link)}>
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteLink(link)}>
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </>
                            )}
                          </div>
                        </CListGroupItem>
                      );
                    })}
                  </CListGroup>
                )}
              </CCardBody>
            </CCard>
          )}

          {/* Legacy category tree removed from All view to reduce redundancy */}
        </>
      )}

      {/* Universal File Viewer Modal */}
      <FileViewerModal
        visible={viewerModal.visible}
        file={viewerModal.file}
        onClose={closeViewer}
        resolveFileUrl={resolveFileUrl}
        onDownload={handleDownloadFile}
      />

      {/* Category Modal */}
      <CModal visible={categoryModal.visible} onClose={closeCategoryModal} alignment="center">
        {renderBrandedModalHeader(
          categoryModal.isEdit ? t('resources.modals.editCategory', 'Edit Category') : t('resources.modals.newCategory', 'New Category')
        )}
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.categoryName', 'Category Name')}</CFormLabel>
                <CFormInput value={categoryModal.form.name} onChange={(event) => handleCategoryFieldChange('name', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.slug', 'Slug')}</CFormLabel>
                <CFormInput value={categoryModal.form.slug} onChange={(event) => handleCategoryFieldChange('slug', event.target.value)} placeholder={t('resources.fields.slugHelp', 'Used for URLs and quick references')} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.description', 'Description')}</CFormLabel>
                <CFormTextarea rows={3} value={categoryModal.form.description} onChange={(event) => handleCategoryFieldChange('description', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.parentCategory', 'Parent Category')}</CFormLabel>
                <CFormSelect value={categoryModal.form.parentId} onChange={(event) => handleCategoryFieldChange('parentId', event.target.value)}>
                  <option value="">{t('resources.fields.noParent', 'No Parent')}</option>
                  {parentCategoryOptions.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {`${'— '.repeat(level)}${name}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.color', 'Color')}</CFormLabel>
                <div className="color-picker-container">
                  {/* Compact Color Gradient Area */}
                  <div className="color-picker-main" style={{ position: 'relative', width: '150px', height: '100px', marginBottom: '8px' }}>
                    <canvas
                      ref={(canvas) => {
                        if (canvas && !canvas.colorPickerInitialized) {
                          canvas.colorPickerInitialized = true;
                          const ctx = canvas.getContext('2d');
                          canvas.width = 150;
                          canvas.height = 100;

                          // Create gradient
                          const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, 0);
                          gradient1.addColorStop(0, '#ffffff');
                          gradient1.addColorStop(1, '#ff0000');
                          ctx.fillStyle = gradient1;
                          ctx.fillRect(0, 0, canvas.width, canvas.height);

                          const gradient2 = ctx.createLinearGradient(0, 0, 0, canvas.height);
                          gradient2.addColorStop(0, 'rgba(0,0,0,0)');
                          gradient2.addColorStop(1, '#000000');
                          ctx.fillStyle = gradient2;
                          ctx.fillRect(0, 0, canvas.width, canvas.height);

                          canvas.addEventListener('click', (e) => {
                            const rect = canvas.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            const imageData = ctx.getImageData(x, y, 1, 1);
                            const [r, g, b] = imageData.data;
                            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            handleCategoryFieldChange('color', hex);
                          });
                        }
                      }}
                      style={{
                        cursor: 'crosshair',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px'
                      }}
                    />
                  </div>

                  {/* Compact Hue Bar */}
                  <div style={{ marginBottom: '8px' }}>
                    <canvas
                      ref={(canvas) => {
                        if (canvas && !canvas.hueBarInitialized) {
                          canvas.hueBarInitialized = true;
                          const ctx = canvas.getContext('2d');
                          canvas.width = 150;
                          canvas.height = 12;

                          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                          gradient.addColorStop(0, '#ff0000');
                          gradient.addColorStop(1/6, '#ffff00');
                          gradient.addColorStop(2/6, '#00ff00');
                          gradient.addColorStop(3/6, '#00ffff');
                          gradient.addColorStop(4/6, '#0000ff');
                          gradient.addColorStop(5/6, '#ff00ff');
                          gradient.addColorStop(1, '#ff0000');

                          ctx.fillStyle = gradient;
                          ctx.fillRect(0, 0, canvas.width, canvas.height);

                          canvas.addEventListener('click', (e) => {
                            const rect = canvas.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const imageData = ctx.getImageData(x, 6, 1, 1);
                            const [r, g, b] = imageData.data;
                            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                            handleCategoryFieldChange('color', hex);
                          });
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        border: '1px solid #dee2e6',
                        borderRadius: '2px',
                        display: 'block'
                      }}
                    />
                  </div>

                  {/* Compact RGB Inputs */}
                  <div className="d-flex gap-1 mb-2">
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>R</label>
                      <CFormInput
                        type="number"
                        min="0"
                        max="255"
                        size="sm"
                        style={{ fontSize: '11px', padding: '2px 4px' }}
                        value={categoryModal.form.color ? parseInt(categoryModal.form.color.slice(1, 3), 16) || 0 : 0}
                        onChange={(e) => {
                          const r = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                          const currentColor = categoryModal.form.color || '#000000';
                          const g = parseInt(currentColor.slice(3, 5), 16) || 0;
                          const b = parseInt(currentColor.slice(5, 7), 16) || 0;
                          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                          handleCategoryFieldChange('color', hex);
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>G</label>
                      <CFormInput
                        type="number"
                        min="0"
                        max="255"
                        size="sm"
                        style={{ fontSize: '11px', padding: '2px 4px' }}
                        value={categoryModal.form.color ? parseInt(categoryModal.form.color.slice(3, 5), 16) || 0 : 0}
                        onChange={(e) => {
                          const g = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                          const currentColor = categoryModal.form.color || '#000000';
                          const r = parseInt(currentColor.slice(1, 3), 16) || 0;
                          const b = parseInt(currentColor.slice(5, 7), 16) || 0;
                          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                          handleCategoryFieldChange('color', hex);
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: '#666', display: 'block' }}>B</label>
                      <CFormInput
                        type="number"
                        min="0"
                        max="255"
                        size="sm"
                        style={{ fontSize: '11px', padding: '2px 4px' }}
                        value={categoryModal.form.color ? parseInt(categoryModal.form.color.slice(5, 7), 16) || 0 : 0}
                        onChange={(e) => {
                          const b = Math.max(0, Math.min(255, parseInt(e.target.value) || 0));
                          const currentColor = categoryModal.form.color || '#000000';
                          const r = parseInt(currentColor.slice(1, 3), 16) || 0;
                          const g = parseInt(currentColor.slice(3, 5), 16) || 0;
                          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                          handleCategoryFieldChange('color', hex);
                        }}
                      />
                    </div>
                  </div>

                  {/* Compact Hex Input and Preview */}
                  <div className="d-flex align-items-center gap-2">
                    <CFormInput
                      type="text"
                      size="sm"
                      style={{ fontSize: '11px', flex: 1 }}
                      value={categoryModal.form.color || '#000000'}
                      onChange={(event) => {
                        let value = event.target.value;
                        if (!value.startsWith('#')) value = '#' + value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          handleCategoryFieldChange('color', value);
                        }
                      }}
                      placeholder="#000000"
                    />
                    {categoryModal.form.color && (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: categoryModal.form.color,
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                </div>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.icon', 'Icon')}</CFormLabel>
                <CFormSelect value={categoryModal.form.icon} onChange={(event) => handleCategoryFieldChange('icon', event.target.value)}>
                  <option value="">{t('resources.fields.selectIcon', 'Select an icon...')}</option>
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect>
                {categoryModal.form.icon && (
                  <div className="mt-2 d-flex align-items-center gap-2">
                    <CIcon icon={ICON_OPTIONS.find(opt => opt.value === categoryModal.form.icon)?.icon || cilFolder} />
                    <small className="text-muted">{t('resources.fields.iconPreview', 'Preview')}</small>
                  </div>
                )}
              </CCol>
              {/* Thumbnail Upload */}
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.thumbnailUpload', 'Thumbnail Upload')}</CFormLabel>
                <CFormInput
                  type="file"
                  accept="image/*"
                  disabled={actionLoading}
                  onChange={(event) => handleCategoryThumbnailSelection(event.target.files?.[0] || null)}
                />
                {categoryModal.form && (categoryModal.form.pendingThumbnailPreview || categoryModal.form.uploadedThumbnailUrl || categoryModal.form.existingThumbnailUrl) && (
                  <div className="mt-2">
                    <img
                      src={categoryModal.form.pendingThumbnailPreview || resolveCategoryThumbUrl(categoryModal.form.uploadedThumbnailUrl || categoryModal.form.existingThumbnailUrl)}
                      alt={categoryModal.form.name || 'thumbnail'}
                      style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'cover' }}
                      className="rounded border"
                    />
                    {categoryModal.form.pendingThumbnailPreview && (
                      <div className="mt-1">
                        <small className="text-muted">{t('resources.fields.pendingUpload', 'Will be uploaded when saved')}</small>
                      </div>
                    )}
                  </div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.sortOrder', 'Sort Order')}</CFormLabel>
                <CFormInput type="number" value={categoryModal.form.sortOrder} onChange={(event) => handleCategoryFieldChange('sortOrder', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.pinnedOrder', 'Pinned Order')}</CFormLabel>
                <CFormInput type="number" value={categoryModal.form.pinnedOrder} onChange={(event) => handleCategoryFieldChange('pinnedOrder', event.target.value)} />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="category-active-switch"
                  label={t('resources.fields.active', 'Active')}
                  checked={categoryModal.form.isActive}
                  onChange={(event) => handleCategoryFieldChange('isActive', event.target.checked)}
                />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="category-pinned-switch"
                  label={t('resources.fields.pinned', 'Pinned')}
                  checked={categoryModal.form.isPinned}
                  onChange={(event) => handleCategoryFieldChange('isPinned', event.target.checked)}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeCategoryModal} disabled={actionLoading}>
            {t('common.cancel', 'Cancel')}
          </CButton>
          <CButton color="primary" onClick={handleCategorySubmit} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : t('common.save', 'Save')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Link Modal */}
      <CModal visible={linkModal.visible} onClose={closeLinkModal} alignment="center">
        {renderBrandedModalHeader(
          linkModal.isEdit ? t('resources.modals.editLink') : t('resources.modals.newLink')
        )}
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.title')}</CFormLabel>
                <CFormInput value={linkModal.form.title} onChange={(event) => handleLinkFieldChange('title', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.url')}</CFormLabel>
                <CFormInput value={linkModal.form.url} onChange={(event) => handleLinkFieldChange('url', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.linkType')}</CFormLabel>
                <CFormSelect value={linkModal.form.type} onChange={(event) => handleLinkFieldChange('type', event.target.value)}>
                  {LINK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.key)}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.category')}</CFormLabel>
                <CFormSelect value={linkModal.form.categoryId} onChange={(event) => handleLinkFieldChange('categoryId', event.target.value)}>
                  <option value="">{t('resources.fields.noCategory')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {`${'— '.repeat(level)}${name}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.description')}</CFormLabel>
                <CFormTextarea rows={3} value={linkModal.form.description} onChange={(event) => handleLinkFieldChange('description', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.tags')}</CFormLabel>
                <CFormInput value={linkModal.form.tags} onChange={(event) => handleLinkFieldChange('tags', event.target.value)} placeholder="tag1, tag2" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.thumbnailUrl')}</CFormLabel>
                <CFormInput value={linkModal.form.thumbnailUrl} onChange={(event) => handleLinkFieldChange('thumbnailUrl', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaLabel')}</CFormLabel>
                <CFormInput value={linkModal.form.ctaLabel} onChange={(event) => handleLinkFieldChange('ctaLabel', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaUrl')}</CFormLabel>
                <CFormInput value={linkModal.form.ctaUrl} onChange={(event) => handleLinkFieldChange('ctaUrl', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.status')}</CFormLabel>
                <CFormSelect value={linkModal.form.status} onChange={(event) => handleLinkFieldChange('status', event.target.value)}>
                  <option value="active">{t('resources.status.active')}</option>
                  <option value="hidden">{t('resources.status.hidden')}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.pinnedOrder')}</CFormLabel>
                <CFormInput type="number" value={linkModal.form.pinnedOrder} onChange={(event) => handleLinkFieldChange('pinnedOrder', event.target.value)} />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="link-pinned-switch"
                  label={t('resources.fields.pinned')}
                  checked={linkModal.form.isPinned}
                  onChange={(event) => handleLinkFieldChange('isPinned', event.target.checked)}
                />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibility')}</CFormLabel>
                <div className="d-flex gap-3">
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <CFormSwitch
                      key={option}
                      label={t(`resources.visibility.${option}`)}
                      checked={linkModal.form.visibleToGroupTypes.includes(option)}
                      onChange={() =>
                        setLinkModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: (() => {
                              const next = new Set(prev.form.visibleToGroupTypes || []);
                              if (next.has(option)) {
                                next.delete(option);
                              } else {
                                next.add(option);
                              }
                              if (next.size === 0) {
                                next.add('admin');
                              }
                              return Array.from(next);
                            })(),
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibleGroupIds')}</CFormLabel>
                <CFormInput
                  value={linkModal.form.visibleToGroupIds}
                  onChange={(event) => handleLinkFieldChange('visibleToGroupIds', event.target.value)}
                  placeholder="1, 2, 3"
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeLinkModal} disabled={actionLoading}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={handleLinkSubmit} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : t('common.save')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* File Modal */}
      <CModal visible={fileModal.visible} onClose={closeFileModal} alignment="center">
        {renderBrandedModalHeader(
          fileModal.isEdit ? t('resources.modals.editFile') : t('resources.modals.uploadFile')
        )}
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.fileName')}</CFormLabel>
                <CFormInput value={fileModal.form.name} onChange={(event) => handleFileFieldChange('name', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.description')}</CFormLabel>
                <CFormTextarea rows={3} value={fileModal.form.description} onChange={(event) => handleFileFieldChange('description', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.file')}</CFormLabel>
                <CFormInput type="file" onChange={(event) => handleFileSelection(event.target.files?.[0] || null)} />
                {fileModal.isEdit && <small className="text-muted">{t('resources.fields.fileReplaceHint')}</small>}
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.category')}</CFormLabel>
                <CFormSelect value={fileModal.form.categoryId} onChange={(event) => handleFileFieldChange('categoryId', event.target.value)}>
                  <option value="">{t('resources.fields.noCategory')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {`${'— '.repeat(level)}${name}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.tags')}</CFormLabel>
                <CFormInput value={fileModal.form.tags} onChange={(event) => handleFileFieldChange('tags', event.target.value)} placeholder="tag1, tag2" />
              </CCol>
              {/* File Thumbnail Upload */}
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.thumbnailUpload', 'Thumbnail Upload')}</CFormLabel>
                <CFormInput
                  type="file"
                  accept="image/*"
                  disabled={actionLoading}
                  onChange={(event) => handleFileThumbnailSelection(event.target.files?.[0] || null)}
                />
                {fileModal.form && (fileModal.form.pendingThumbnailPreview || fileModal.form.uploadedThumbnailUrl || fileModal.form.existingThumbnailUrl) && (
                  <div className="mt-2">
                    <img
                      src={fileModal.form.pendingThumbnailPreview || resolveCategoryThumbUrl(fileModal.form.uploadedThumbnailUrl || fileModal.form.existingThumbnailUrl)}
                      alt={fileModal.form.name || 'thumbnail'}
                      style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'cover' }}
                      className="rounded border"
                    />
                    {fileModal.form.pendingThumbnailPreview && (
                      <div className="mt-1">
                        <small className="text-muted">{t('resources.fields.pendingUpload', 'Will be uploaded when saved')}</small>
                      </div>
                    )}
                  </div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaLabel')}</CFormLabel>
                <CFormInput value={fileModal.form.ctaLabel} onChange={(event) => handleFileFieldChange('ctaLabel', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaUrl')}</CFormLabel>
                <CFormInput value={fileModal.form.ctaUrl} onChange={(event) => handleFileFieldChange('ctaUrl', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.status')}</CFormLabel>
                <CFormSelect value={fileModal.form.status} onChange={(event) => handleFileFieldChange('status', event.target.value)}>
                  <option value="active">{t('resources.status.active')}</option>
                  <option value="hidden">{t('resources.status.hidden')}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.pinnedOrder')}</CFormLabel>
                <CFormInput type="number" value={fileModal.form.pinnedOrder} onChange={(event) => handleFileFieldChange('pinnedOrder', event.target.value)} />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="file-pinned-switch"
                  label={t('resources.fields.pinned')}
                  checked={fileModal.form.isPinned}
                  onChange={(event) => handleFileFieldChange('isPinned', event.target.checked)}
                />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibility')}</CFormLabel>
                <div className="d-flex gap-3">
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <CFormSwitch
                      key={option}
                      label={t(`resources.visibility.${option}`)}
                      checked={fileModal.form.visibleToGroupTypes.includes(option)}
                      onChange={() =>
                        setFileModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: (() => {
                              const next = new Set(prev.form.visibleToGroupTypes || []);
                              if (next.has(option)) {
                                next.delete(option);
                              } else {
                                next.add(option);
                              }
                              if (next.size === 0) {
                                next.add('admin');
                              }
                              return Array.from(next);
                            })(),
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibleGroupIds')}</CFormLabel>
                <CFormInput value={fileModal.form.visibleToGroupIds} onChange={(event) => handleFileFieldChange('visibleToGroupIds', event.target.value)} placeholder="1, 2, 3" />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeFileModal} disabled={actionLoading}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={handleFileSubmit} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : t('common.save')}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Announcement Modal */}
      <CModal visible={announcementModal.visible} onClose={closeAnnouncementModal} alignment="center">
        {renderBrandedModalHeader(
          announcementModal.isEdit ? t('resources.modals.editAnnouncement') : t('resources.modals.newAnnouncement')
        )}
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.title')}</CFormLabel>
                <CFormInput value={announcementModal.form.title} onChange={(event) => handleAnnouncementFieldChange('title', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.summary')}</CFormLabel>
                <CFormTextarea rows={3} value={announcementModal.form.summary} onChange={(event) => handleAnnouncementFieldChange('summary', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.body')}</CFormLabel>
                <CFormTextarea rows={5} value={announcementModal.form.body} onChange={(event) => handleAnnouncementFieldChange('body', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.category')}</CFormLabel>
                <CFormSelect value={announcementModal.form.categoryId} onChange={(event) => handleAnnouncementFieldChange('categoryId', event.target.value)}>
                  <option value="">{t('resources.fields.noCategory')}</option>
                  {flattenedCategories.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {`${'— '.repeat(level)}${name}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.status')}</CFormLabel>
                <CFormSelect value={announcementModal.form.status} onChange={(event) => handleAnnouncementFieldChange('status', event.target.value)}>
                  <option value="published">{t('resources.status.published')}</option>
                  <option value="draft">{t('resources.status.draft')}</option>
                  <option value="hidden">{t('resources.status.hidden')}</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.publishAt')}</CFormLabel>
                <CFormInput type="datetime-local" value={announcementModal.form.publishAt} onChange={(event) => handleAnnouncementFieldChange('publishAt', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.expireAt')}</CFormLabel>
                <CFormInput type="datetime-local" value={announcementModal.form.expireAt} onChange={(event) => handleAnnouncementFieldChange('expireAt', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.pinnedOrder')}</CFormLabel>
                <CFormInput type="number" value={announcementModal.form.pinnedOrder} onChange={(event) => handleAnnouncementFieldChange('pinnedOrder', event.target.value)} />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="announcement-pinned-switch"
                  label={t('resources.fields.pinned')}
                  checked={announcementModal.form.isPinned}
                  onChange={(event) => handleAnnouncementFieldChange('isPinned', event.target.checked)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaLabel')}</CFormLabel>
                <CFormInput value={announcementModal.form.ctaLabel} onChange={(event) => handleAnnouncementFieldChange('ctaLabel', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.ctaUrl')}</CFormLabel>
                <CFormInput value={announcementModal.form.ctaUrl} onChange={(event) => handleAnnouncementFieldChange('ctaUrl', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibility')}</CFormLabel>
                <div className="d-flex gap-3">
                  {GROUP_VISIBILITY_OPTIONS.map((option) => (
                    <CFormSwitch
                      key={option}
                      label={t(`resources.visibility.${option}`)}
                      checked={announcementModal.form.visibleToGroupTypes.includes(option)}
                      onChange={() =>
                        setAnnouncementModal((prev) => ({
                          ...prev,
                          form: {
                            ...prev.form,
                            visibleToGroupTypes: (() => {
                              const next = new Set(prev.form.visibleToGroupTypes || []);
                              if (next.has(option)) {
                                next.delete(option);
                              } else {
                                next.add(option);
                              }
                              if (next.size === 0) {
                                next.add('admin');
                              }
                              return Array.from(next);
                            })(),
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.visibleGroupIds')}</CFormLabel>
                <CFormInput
                  value={announcementModal.form.visibleToGroupIds}
                  onChange={(event) => handleAnnouncementFieldChange('visibleToGroupIds', event.target.value)}
                  placeholder="1, 2, 3"
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeAnnouncementModal} disabled={actionLoading}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={handleAnnouncementSubmit} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : t('common.save')}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default withContractorScope(Resources, 'resources');


