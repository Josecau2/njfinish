import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axiosInstance from '../../helpers/axiosInstance';
import { getFreshestToken } from '../../utils/authToken';
import { getContrastColor } from '../../utils/colorUtils';
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
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
  cilCalendar,
  cilChart,
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
} from '@coreui/icons';
import PageHeader from '../../components/PageHeader';
import withContractorScope from '../../components/withContractorScope';

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
  thumbnailUrl: '',
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
  thumbnailUrl: '',
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
  const [categoryModal, setCategoryModal] = useState({ visible: false, isEdit: false, form: { ...emptyCategoryForm } });
  const [linkModal, setLinkModal] = useState({ visible: false, isEdit: false, form: { ...emptyLinkForm } });
  const [fileModal, setFileModal] = useState({ visible: false, isEdit: false, form: { ...emptyFileForm } });
  const [announcementModal, setAnnouncementModal] = useState({ visible: false, isEdit: false, form: { ...emptyAnnouncementForm } });

  const isAdmin = !isContractor;
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
      const message = error.response?.data?.message || t('resources.messages.loadFailed');
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

  const categoryFilterOptions = useMemo(() => {
    const options = [
      { value: 'all', label: t('resources.filters.allCategories') },
    ];
    if (hasUncategorized) {
      options.push({ value: 'uncategorized', label: t('resources.filters.uncategorized') });
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

const mediaBuckets = useMemo(() => ({
    video: filteredFiles.filter((file) => file.fileType === 'video'),
    audio: filteredFiles.filter((file) => file.fileType === 'audio'),
    image: filteredFiles.filter((file) => file.fileType === 'image'),
    document: filteredFiles.filter((file) => ['pdf', 'spreadsheet', 'document'].includes(file.fileType)),
    other: filteredFiles.filter((file) => !['video', 'audio', 'image', 'pdf', 'spreadsheet', 'document'].includes(file.fileType)),
  }), [filteredFiles]);

  const pinned = resourceData?.pinned || { announcements: [], links: [], files: [] };
  const stats = resourceData?.stats;
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

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
    if (!window.confirm(t('resources.messages.confirmScaffold'))) {
      return;
    }
    try {
      setScaffoldLoading(true);
      const response = await axiosInstance.post(SCAFFOLD_ENDPOINT);
      const createdCount = Array.isArray(response.data?.created) ? response.data.created.length : 0;
      const message = createdCount > 0
        ? t('resources.messages.scaffoldCreated')
        : t('resources.messages.scaffoldAlreadyExists');
      showFeedback('success', message);
      await refreshData();
    } catch (error) {
      console.error('Error creating scaffolded categories:', error);
      const message = error.response?.data?.message || t('resources.messages.scaffoldFailed');
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
          thumbnailUrl: category.thumbnailUrl || '',
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
      showFeedback('danger', t('resources.messages.categoryNameRequired'));
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
      thumbnail_url: form.thumbnailUrl || null,
    };

    try {
      setActionLoading(true);
      if (categoryModal.isEdit && form.id) {
        await axiosInstance.put(`${CATEGORY_ENDPOINT}/${form.id}`, payload);
        showFeedback('success', t('resources.messages.categoryUpdated'));
      } else {
        await axiosInstance.post(CATEGORY_ENDPOINT, payload);
        showFeedback('success', t('resources.messages.categoryCreated'));
      }
      closeCategoryModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving category:', error);
      const message = error.response?.data?.message || t('resources.messages.categorySaveFailed');
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
      showFeedback('success', t('resources.messages.categoryDeleted'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting category:', error);
      const message = error.response?.data?.message || t('resources.messages.categoryDeleteFailed');
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
      showFeedback('danger', t('resources.messages.linkRequired'));
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
      cta_url: form.ctaUrl || null,
      status: form.status || 'active',
      visible_to_group_types: form.visibleToGroupTypes || ['admin'],
      visible_to_group_ids: normalizeVisibilityInput(form.visibleToGroupIds),
    };

    try {
      setActionLoading(true);
      if (linkModal.isEdit && form.id) {
        await axiosInstance.put(`${LINKS_ENDPOINT}/${form.id}`, payload);
        showFeedback('success', t('resources.messages.linkUpdated'));
      } else {
        await axiosInstance.post(LINKS_ENDPOINT, payload);
        showFeedback('success', t('resources.messages.linkCreated'));
      }
      closeLinkModal();
      await refreshData();
    } catch (error) {
      console.error('Error saving link:', error);
      const message = error.response?.data?.message || t('resources.messages.linkSaveFailed');
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
      showFeedback('success', t('resources.messages.linkDeleted'));
      await refreshData();
    } catch (error) {
      console.error('Error deleting link:', error);
      const message = error.response?.data?.message || t('resources.messages.linkDeleteFailed');
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
          thumbnailUrl: file.thumbnailUrl || '',
          isPinned: !!file.isPinned,
          pinnedOrder: file.pinnedOrder ?? 0,
          tags: serializeTags(file.tags),
          ctaLabel: file.ctaLabel || '',
          ctaUrl: file.ctaUrl || '',
          status: file.status || 'active',
          visibleToGroupTypes: Array.isArray(file.visibleToGroupTypes) && file.visibleToGroupTypes.length ? file.visibleToGroupTypes : ['admin'],
          visibleToGroupIds: Array.isArray(file.visibleToGroupIds) ? file.visibleToGroupIds.join(', ') : '',
          file: null,
        },
      });
    } else {
      setFileModal({ visible: true, isEdit: false, form: { ...emptyFileForm } });
    }
  };

  const closeFileModal = () => {
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

    const payload = new FormData();
    if (form.name) payload.append('name', form.name);
    if (form.description) payload.append('description', form.description);
    payload.append('category_id', form.categoryId || '');
    payload.append('thumbnail_url', form.thumbnailUrl || '');
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
        await axiosInstance.put(`${FILES_ENDPOINT}/${form.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showFeedback('success', t('resources.messages.fileUpdated'));
      } else {
        await axiosInstance.post(FILES_ENDPOINT, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showFeedback('success', t('resources.messages.fileUploaded'));
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
    const url = resolveFileUrl(file);
    if (!url) {
      showFeedback('danger', t('resources.messages.fileAccessFailed'));
      return;
    }
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener');
    }
  };
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
                      <div className="d-flex gap-2">
                        <CButton color="info" size="sm" variant="ghost" onClick={() => handleDownloadFile(file)}>
                          <CIcon icon={cilCloudDownload} />
                        </CButton>
                        {isAdmin && (
                          <CButton color="secondary" size="sm" variant="ghost" onClick={() => openFileModal(file)}>
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
      </CRow>
    );
  };

  const renderStats = () => {
    if (!stats?.totals) return null;
    return (
      <CRow className="g-3 mb-4">
        <CCol md={4}>
          <CCard className="border-0 shadow-sm text-center h-100">
            <CCardBody>
              <CIcon icon={cilBullhorn} size="xl" className="text-warning mb-2" />
              <div className="fs-2 fw-bold">{stats.totals.announcements || 0}</div>
              <div className="text-muted">{t('resources.stats.announcements')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm text-center h-100">
            <CCardBody>
              <CIcon icon={cilLink} size="xl" className="text-success mb-2" />
              <div className="fs-2 fw-bold">{stats.totals.links || 0}</div>
              <div className="text-muted">{t('resources.stats.links')}</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="border-0 shadow-sm text-center h-100">
            <CCardBody>
              <CIcon icon={cilCloudDownload} size="xl" className="text-info mb-2" />
              <div className="fs-2 fw-bold">{stats.totals.files || 0}</div>
              <div className="text-muted">{t('resources.stats.files')}</div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  };

  const renderFilters = () => (
    <CCard className="border-0 shadow-sm mb-4">
      <CCardBody>
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
            <CCol md={4}>
              <CFormLabel className="fw-semibold">{t('resources.filters.medium.title')}</CFormLabel>
              <CFormSelect value={filters.medium} onChange={(event) => handleFilterChange('medium', event.target.value)}>
                {mediumOptions.map((option) => (
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
          {filteredAnnouncements.length === 0 ? (
            <div className="text-muted">{t('resources.announcements.empty')}</div>
          ) : (
            <CListGroup flush>
              {filteredAnnouncements.map((announcement) => renderAnnouncementListItem(announcement))}
            </CListGroup>
          )}
        </CCardBody>
      </CCard>
    );
  };

const renderMediaLibrary = () => {
    if (filters.medium !== 'all' && filters.medium !== 'files') {
      return null;
    }

    const sections = [
      { key: 'video', label: t('resources.media.video'), items: mediaBuckets.video },
      { key: 'audio', label: t('resources.media.audio'), items: mediaBuckets.audio },
      { key: 'image', label: t('resources.media.images'), items: mediaBuckets.image },
      { key: 'document', label: t('resources.media.documents'), items: mediaBuckets.document },
      { key: 'other', label: t('resources.media.other'), items: mediaBuckets.other },
    ];

    const hasAnyMedia = sections.some((section) => section.items.length > 0);

    return (
      <CCard className="border-0 shadow-sm mb-4">
        <CCardHeader className="bg-transparent border-0">
          <div className="d-flex align-items-center gap-2">
            <CIcon icon={cilCloudUpload} className="text-primary" />
            <h5 className="mb-0">{t('resources.media.libraryTitle')}</h5>
          </div>
        </CCardHeader>
        <CCardBody>
          <CAccordion alwaysOpen>
            {sections.map(({ key, label, items }) => (
              <CAccordionItem itemKey={key} key={`media-${key}`}>
                <CAccordionHeader>
                  <span className="d-flex align-items-center gap-2">{label}</span>
                  <CBadge color="light" className="ms-2 text-dark">{items.length}</CBadge>
                </CAccordionHeader>
                <CAccordionBody>
                  {items.length === 0 ? (
                    <div className="text-muted">{t('resources.media.empty')}</div>
                  ) : (
                    <CListGroup flush>
                      {items.map((file) => {
                        const meta = getFileTypeMeta(file.fileType);
                        const previewUrl = resolveFileUrl(file, 'inline');
                        return (
                          <CListGroupItem key={`media-${key}-${file.id}`} className="border-0 p-0 mb-3">
                            <div className="fw-semibold d-flex align-items-center gap-2">
                              <CIcon icon={meta.icon} className={`text-${meta.color}`} />
                              {file.name}
                              {file.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                            </div>
                            <div className="text-muted small mt-1">
                              {file.size}
                              {file.category?.name && (
                                <span className="ms-2">- {t('resources.fields.category')}: {file.category.name}</span>
                              )}
                            </div>
                            {file.description && <div className="text-muted small mt-2">{file.description}</div>}
                            <div className="mt-3">
                              {file.fileType === 'video' && previewUrl && (
                                <video src={previewUrl} controls style={{ width: '100%', maxHeight: '220px' }} className="rounded" />
                              )}
                              {file.fileType === 'audio' && previewUrl && (
                                <audio src={previewUrl} controls style={{ width: '100%' }} />
                              )}
                              {file.fileType === 'image' && previewUrl && (
                                <img src={previewUrl} alt={file.name} style={{ width: '100%', maxHeight: '220px', objectFit: 'cover' }} className="rounded" />
                              )}
                              {['video', 'audio', 'image'].includes(file.fileType) && !previewUrl && (
                                <div className="text-muted small">{t('resources.messages.fileAccessFailed')}</div>
                              )}
                            </div>
                            <div className="d-flex gap-2 mt-3">
                              <CButton size="sm" color="info" variant="ghost" onClick={() => handleDownloadFile(file)}>
                                <CIcon icon={cilCloudDownload} className="me-2" />
                                {t('resources.actions.download')}
                              </CButton>
                              {isAdmin && (
                                <>
                                  <CButton size="sm" color="secondary" variant="ghost" onClick={() => openFileModal(file)}>
                                    <CIcon icon={cilPencil} className="me-2" />
                                    {t('common.edit')}
                                  </CButton>
                                  <CButton size="sm" color="danger" variant="ghost" onClick={() => handleDeleteFile(file)}>
                                    <CIcon icon={cilTrash} className="me-2" />
                                    {t('common.delete')}
                                  </CButton>
                                </>
                              )}
                            </div>
                          </CListGroupItem>
                        );
                      })}
                    </CListGroup>
                  )}
                </CAccordionBody>
              </CAccordionItem>
            ))}
          </CAccordion>
          {isAdmin && !hasAnyMedia && (
            <div className="text-center mt-3">
              <CButton color="info" size="sm" onClick={() => openFileModal()}>
                <CIcon icon={cilCloudUpload} className="me-2" />
                {t('resources.actions.uploadFile')}
              </CButton>
            </div>
          )}
        </CCardBody>
      </CCard>
    );
  };

const getLinkTypeMeta = (type) => LINK_TYPE_OPTIONS.find((option) => option.value === type) || LINK_TYPE_OPTIONS[0];

  const getFileTypeMeta = (type) => FILE_TYPE_META[type] || FILE_TYPE_META.other;

  const renderCategoryResources = (categoryId) => {
    const bucket = resourcesByCategory[String(categoryId)] || { announcements: [], links: [], files: [] };
    const announcements = bucket.announcements.filter((item) => passesFilters(item, 'announcements'));
    const links = bucket.links.filter((item) => passesFilters(item, 'links'));
    const files = bucket.files.filter((item) => passesFilters(item, 'files'));

    if (!announcements.length && !links.length && !files.length) {
      return <div className="text-muted small">{t('resources.messages.noMatching')}</div>;
    }

    return (
      <>
        {announcements.length > 0 && (
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-2">{t('resources.announcements.title')}</h6>
            <CListGroup flush>
              {announcements.map((announcement) => renderAnnouncementListItem(announcement))}
            </CListGroup>
          </div>
        )}
        {links.length > 0 && (
          <div className="mb-4">
            <h6 className="text-uppercase text-muted fw-semibold mb-2">{t('resources.links.title')}</h6>
            <CListGroup flush>
              {links.map((link) => {
                const meta = getLinkTypeMeta(link.type);
                return (
                  <CListGroupItem key={`link-${link.id}`} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <CIcon icon={meta.icon} className={`text-${meta.color}`} />
                        {link.title}
                        {link.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                      </div>
                      {link.description && <div className="text-muted small">{link.description}</div>}
                      <div className="text-muted small text-break">{link.url}</div>
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
          <div>
            <h6 className="text-uppercase text-muted fw-semibold mb-2">{t('resources.files.title')}</h6>
            <CListGroup flush>
              {files.map((file) => {
                const meta = getFileTypeMeta(file.fileType);
                const inlineUrl = resolveFileUrl(file, 'inline');
                return (
                  <CListGroupItem key={`file-${file.id}`} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold d-flex align-items-center gap-2">
                        <CIcon icon={meta.icon} className={`text-${meta.color}`} />
                        {file.name}
                        {file.isPinned && <CBadge color="warning">{t('resources.labels.pinned')}</CBadge>}
                      </div>
                      <div className="text-muted small">{file.size}</div>
                      {file.fileType === 'video' && inlineUrl && (
                        <video src={inlineUrl} controls style={{ width: '100%', maxHeight: '180px' }} className="mt-2 rounded" />
                      )}
                      {file.fileType === 'audio' && inlineUrl && (
                        <audio src={inlineUrl} controls style={{ width: '100%' }} className="mt-2" />
                      )}
                      {file.fileType === 'image' && inlineUrl && (
                        <img src={inlineUrl} alt={file.name} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover' }} className="mt-2 rounded" />
                      )}
                      {['video', 'audio', 'image'].includes(file.fileType) && !inlineUrl && (
                        <div className="text-muted small">{t('resources.messages.fileAccessFailed')}</div>
                      )}
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <CButton color="info" size="sm" variant="ghost" onClick={() => handleDownloadFile(file)}>
                        <CIcon icon={cilCloudDownload} />
                      </CButton>
                      {isAdmin && (
                        <>
                          <CButton color="secondary" size="sm" variant="ghost" onClick={() => openFileModal(file)}>
                            <CIcon icon={cilPencil} />
                          </CButton>
                          <CButton color="danger" size="sm" variant="ghost" onClick={() => handleDeleteFile(file)}>
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
    ? t('resources.headerAdmin')
    : t('resources.headerContractor', { group: contractorGroupName || '' });

  return (
    <CContainer fluid className="resources-page pb-5">
      <PageHeader
        title={t('nav.resources')}
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
                {t('resources.actions.scaffoldCategories')}
              </CButton>
              <CButton
                color="primary"
                size="sm"
                variant="outline"
                className="use-header-color"
                onClick={() => openCategoryModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                {t('resources.actions.newCategory')}
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
          {renderPinnedHighlights()}
          {renderStats()}
          {renderFilters()}
          {renderAnnouncementsSection()}
          {renderMediaLibrary()}

          {categoriesForDisplay.length === 0 && !hasUncategorized ? (
            <CCard className="border-0 shadow-sm">
              <CCardBody className="text-center text-muted py-5">
                {t('resources.messages.noCategories')}
              </CCardBody>
            </CCard>
          ) : (
            <>
              {categoriesForDisplay.map((category) => renderCategoryCard(category))}
              {hasUncategorized && renderUncategorizedCard()}
            </>
          )}
        </>
      )}

      {/* Category Modal */}
      <CModal visible={categoryModal.visible} onClose={closeCategoryModal} alignment="center">
        {renderBrandedModalHeader(
          categoryModal.isEdit ? t('resources.modals.editCategory') : t('resources.modals.newCategory')
        )}
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.categoryName')}</CFormLabel>
                <CFormInput value={categoryModal.form.name} onChange={(event) => handleCategoryFieldChange('name', event.target.value)} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.slug')}</CFormLabel>
                <CFormInput value={categoryModal.form.slug} onChange={(event) => handleCategoryFieldChange('slug', event.target.value)} placeholder={t('resources.fields.slugHelp')} />
              </CCol>
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.description')}</CFormLabel>
                <CFormTextarea rows={3} value={categoryModal.form.description} onChange={(event) => handleCategoryFieldChange('description', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.parentCategory')}</CFormLabel>
                <CFormSelect value={categoryModal.form.parentId} onChange={(event) => handleCategoryFieldChange('parentId', event.target.value)}>
                  <option value="">{t('resources.fields.noParent')}</option>
                  {parentCategoryOptions.map(({ id, name, level }) => (
                    <option key={id} value={id}>
                      {`${'— '.repeat(level)}${name}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.color')}</CFormLabel>
                <CFormInput type="text" value={categoryModal.form.color} onChange={(event) => handleCategoryFieldChange('color', event.target.value)} placeholder="#321fdb" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.icon')}</CFormLabel>
                <CFormInput value={categoryModal.form.icon} onChange={(event) => handleCategoryFieldChange('icon', event.target.value)} placeholder="cil-folder" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.thumbnailUrl')}</CFormLabel>
                <CFormInput value={categoryModal.form.thumbnailUrl} onChange={(event) => handleCategoryFieldChange('thumbnailUrl', event.target.value)} placeholder="https://" />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.sortOrder')}</CFormLabel>
                <CFormInput type="number" value={categoryModal.form.sortOrder} onChange={(event) => handleCategoryFieldChange('sortOrder', event.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold">{t('resources.fields.pinnedOrder')}</CFormLabel>
                <CFormInput type="number" value={categoryModal.form.pinnedOrder} onChange={(event) => handleCategoryFieldChange('pinnedOrder', event.target.value)} />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="category-active-switch"
                  label={t('resources.fields.active')}
                  checked={categoryModal.form.isActive}
                  onChange={(event) => handleCategoryFieldChange('isActive', event.target.checked)}
                />
              </CCol>
              <CCol md={6} className="d-flex align-items-center gap-2">
                <CFormSwitch
                  id="category-pinned-switch"
                  label={t('resources.fields.pinned')}
                  checked={categoryModal.form.isPinned}
                  onChange={(event) => handleCategoryFieldChange('isPinned', event.target.checked)}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={closeCategoryModal} disabled={actionLoading}>
            {t('common.cancel')}
          </CButton>
          <CButton color="primary" onClick={handleCategorySubmit} disabled={actionLoading}>
            {actionLoading ? <CSpinner size="sm" /> : t('common.save')}
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
              <CCol md={12}>
                <CFormLabel className="fw-semibold">{t('resources.fields.thumbnailUrl')}</CFormLabel>
                <CFormInput value={fileModal.form.thumbnailUrl} onChange={(event) => handleFileFieldChange('thumbnailUrl', event.target.value)} placeholder="https://" />
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


