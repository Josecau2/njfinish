const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const env = require('../config/env');
const {
  ResourceCategory,
  ResourceLink,
  ResourceFile,
  ResourceAnnouncement,
} = require('../models');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STORAGE_ROOT = path.isAbsolute(env.RESOURCES_UPLOAD_DIR)
  ? env.RESOURCES_UPLOAD_DIR
  : path.resolve(PROJECT_ROOT, env.RESOURCES_UPLOAD_DIR);
const IS_WINDOWS = process.platform === 'win32';

const PROTECTED_CATEGORY_SLUGS = new Set([
  'announcements',
  'getting-started',
  'catalogues',
  'catalogs',
  'video-training',
  'audio-guides',
  'reference-documents',
]);

const LINK_TYPES = new Set(['external', 'internal', 'document', 'video', 'help']);
const LINK_STATUS_VALUES = new Set(['active', 'inactive', 'archived']);
const FILE_STATUS_VALUES = new Set(['active', 'inactive', 'archived']);
const ANNOUNCEMENT_STATUS_VALUES = new Set(['published', 'draft', 'hidden']);
const INLINE_MIME_WHITELIST = ['video/', 'audio/', 'image/', 'application/pdf'];

const DEFAULT_CATEGORY_SCAFFOLD = [
  {
    name: 'Announcements',
    slug: 'announcements',
    description: 'Important product and platform updates.',
    color: '#F97316',
    icon: 'cil-bullhorn',
    sort_order: 1,
    is_pinned: true,
    pinned_order: 1,
  },
  {
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Onboarding resources to help new users learn the platform.',
    color: '#2563EB',
    icon: 'cil-lightbulb',
    sort_order: 2,
    is_pinned: true,
    pinned_order: 2,
  },
  {
    name: 'Catalogues',
    slug: 'catalogues',
    description: 'Latest manufacturer catalogues and product sheets.',
    color: '#059669',
    icon: 'cil-library',
    sort_order: 3,
  },
  {
    name: 'Video Training',
    slug: 'video-training',
    description: 'Recorded walkthroughs and feature highlights.',
    color: '#D97706',
    icon: 'cil-movie',
    sort_order: 4,
  },
  {
    name: 'Audio Guides',
    slug: 'audio-guides',
    description: 'Listen to quick tips and updates on the go.',
    color: '#7C3AED',
    icon: 'cil-headphones',
    sort_order: 5,
  },
  {
    name: 'Reference Documents',
    slug: 'reference-documents',
    description: 'Policies, templates, and other key documentation.',
    color: '#0EA5E9',
    icon: 'cil-description',
    sort_order: 6,
  },
];

function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'object') {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
}

function normalizeArrayInput(value, fallback = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item === undefined || item === null ? '' : String(item).trim()))
      .filter(Boolean);
  }
  if (value === undefined || value === null || value === '') {
    return fallback.slice();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback.slice();
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item === undefined || item === null ? '' : String(item).trim()))
          .filter(Boolean);
      }
    } catch (error) {
      // Fallback to comma-separated parsing
    }
    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function normalizeGroupIds(value) {
  return normalizeArrayInput(value).map((item) => {
    const numeric = Number(item);
    return Number.isFinite(numeric) && String(numeric) === String(parseInt(numeric, 10))
      ? parseInt(numeric, 10)
      : String(item);
  });
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function parseNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toISOString(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function slugify(value) {
  if (!value) {
    return '';
  }
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function pathsShareBase(basePath, targetPath) {
  if (IS_WINDOWS) {
    return targetPath.toLowerCase().startsWith(basePath.toLowerCase());
  }
  return targetPath.startsWith(basePath);
}

function safeResolveStoragePath(relativePath) {
  const storage = path.resolve(STORAGE_ROOT);
  const target = path.resolve(storage, relativePath || '');
  if (!pathsShareBase(storage, target)) {
    throw new Error('Resolved path escapes storage root');
  }
  return target;
}

function toRelativeStoragePath(absolutePath) {
  const storage = path.resolve(STORAGE_ROOT);
  const resolved = path.resolve(absolutePath);
  if (!pathsShareBase(storage, resolved)) {
    return path.basename(resolved);
  }
  const relative = path.relative(storage, resolved);
  return relative.replace(/\\+/g, '/');
}

function removeFileQuietly(absolutePath) {
  try {
    if (absolutePath && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.warn('Failed to remove resource file from disk:', error.message);
  }
}

function detectFileMedium({ mimeType, originalName }) {
  const lowered = (mimeType || '').toLowerCase();
  const extension = path.extname(originalName || '').toLowerCase();

  if (lowered.startsWith('video/')) return 'video';
  if (lowered.startsWith('audio/')) return 'audio';
  if (lowered.startsWith('image/')) return 'image';
  if (extension === '.pdf') return 'pdf';
  if (['.xls', '.xlsx', '.csv', '.ods'].includes(extension)) return 'spreadsheet';
  if (['.doc', '.docx', '.txt', '.rtf', '.odt'].includes(extension)) return 'document';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) return 'archive';
  if (lowered === 'application/pdf') return 'pdf';
  return 'other';
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const formatted = size / Math.pow(1024, index);
  return `${formatted % 1 === 0 ? formatted : formatted.toFixed(1)} ${units[index]}`;
}

function userIsAdmin(user) {
  if (!user) {
    return false;
  }
  const role = String(user.role || '').toLowerCase();
  if (['owner', 'admin', 'super_admin', 'superadmin', 'super-admin'].includes(role)) {
    return true;
  }
  const groupType = getUserGroupType(user);
  return groupType === 'admin';
}

function getUserGroupType(user) {
  return user?.group?.group_type || user?.group?.type || null;
}

function getUserGroupId(user) {
  if (user?.group_id !== undefined && user.group_id !== null) {
    return user.group_id;
  }
  if (user?.group?.id !== undefined && user.group.id !== null) {
    return user.group.id;
  }
  return null;
}

function normalizeVisibilityForRecord(record, fallbackTypes = ['admin']) {
  const types = normalizeArrayInput(record?.visible_to_group_types ?? record?.visibleToGroupTypes ?? fallbackTypes, fallbackTypes);
  const groupIds = normalizeGroupIds(record?.visible_to_group_ids ?? record?.visibleToGroupIds ?? []);
  return {
    visibleToGroupTypes: types.length ? types : fallbackTypes.slice(),
    visibleToGroupIds: groupIds,
  };
}

function isVisibleToUser(record, user, { isAdmin } = {}) {
  if (isAdmin) {
    return true;
  }
  const { visibleToGroupTypes, visibleToGroupIds } = normalizeVisibilityForRecord(record);
  if (!visibleToGroupTypes.length && !visibleToGroupIds.length) {
    // Default to admin-only when visibility is not configured
    return false;
  }
  if (visibleToGroupTypes.includes('public') || visibleToGroupTypes.includes('all')) {
    return true;
  }
  const groupType = getUserGroupType(user);
  if (groupType && visibleToGroupTypes.map((value) => value.toLowerCase()).includes(groupType.toLowerCase())) {
    return true;
  }
  const groupId = getUserGroupId(user);
  if (groupId !== null && groupId !== undefined) {
    const stringId = String(groupId);
    if (visibleToGroupIds.map((value) => String(value)).includes(stringId)) {
      return true;
    }
  }
  return false;
}

function mapCategory(raw) {
  const plain = raw?.get ? raw.get({ plain: true }) : raw;
  if (!plain) {
    return null;
  }
  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description || '',
    color: plain.color || null,
    icon: plain.icon || null,
    parentId: plain.parent_id || null,
    sortOrder: parseNumber(plain.sort_order, 0),
    isActive: parseBoolean(plain.is_active, true),
    isPinned: parseBoolean(plain.is_pinned, false),
    pinnedOrder: parseNumber(plain.pinned_order, 0),
    thumbnailUrl: plain.thumbnail_url || null,
    metadata: plain.metadata || null,
    allowActions: !PROTECTED_CATEGORY_SLUGS.has(String(plain.slug || '').toLowerCase()),
    createdAt: toISOString(plain.createdAt || plain.created_at),
    updatedAt: toISOString(plain.updatedAt || plain.updated_at),
    children: [],
  };
}

function buildCategoryTree(records) {
  const mapped = records
    .map(mapCategory)
    .filter(Boolean);
  const byId = new Map();
  mapped.forEach((node) => {
    node.children = node.children || [];
    byId.set(node.id, node);
  });
  const roots = [];
  mapped.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const orderDiff = parseNumber(a.sortOrder, 0) - parseNumber(b.sortOrder, 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    nodes.forEach((child) => sortNodes(child.children));
  };
  sortNodes(roots);
  return roots;
}

function pickCategorySummary(category) {
  if (!category) {
    return null;
  }
  const plain = category.get ? category.get({ plain: true }) : category;
  return {
    id: plain.id,
    name: plain.name,
    color: plain.color || null,
    icon: plain.icon || null,
  };
}

function mapLink(raw) {
  const plain = raw?.get ? raw.get({ plain: true }) : raw;
  if (!plain) {
    return null;
  }
  const visibility = normalizeVisibilityForRecord(plain);
  return {
    id: plain.id,
    title: plain.title,
    url: plain.url,
    type: plain.type,
    description: plain.description || '',
    categoryId: plain.category_id || null,
    category: pickCategorySummary(plain.category),
    thumbnailUrl: plain.thumbnail_url || null,
    isPinned: parseBoolean(plain.is_pinned, false),
    pinnedOrder: parseNumber(plain.pinned_order, 0),
    tags: normalizeArrayInput(plain.tags),
    ctaLabel: plain.cta_label || null,
    ctaUrl: plain.cta_url || null,
    status: plain.status || 'active',
    metadata: plain.metadata || null,
    visibleToGroupTypes: visibility.visibleToGroupTypes,
    visibleToGroupIds: visibility.visibleToGroupIds,
    createdAt: toISOString(plain.createdAt || plain.created_at),
    updatedAt: toISOString(plain.updatedAt || plain.updated_at),
  };
}

function mapFile(raw) {
  const plain = raw?.get ? raw.get({ plain: true }) : raw;
  if (!plain) {
    return null;
  }
  const visibility = normalizeVisibilityForRecord(plain);
  const fileType = plain.file_type || detectFileMedium({
    mimeType: plain.mime_type,
    originalName: plain.original_name,
  });
  const fileSize = parseNumber(plain.file_size, 0);
  return {
    id: plain.id,
    name: plain.name,
    description: plain.description || '',
    categoryId: plain.category_id || null,
    category: pickCategorySummary(plain.category),
    thumbnailUrl: plain.thumbnail_url || null,
    isPinned: parseBoolean(plain.is_pinned, false),
    pinnedOrder: parseNumber(plain.pinned_order, 0),
    tags: normalizeArrayInput(plain.tags),
    ctaLabel: plain.cta_label || null,
    ctaUrl: plain.cta_url || null,
    status: plain.status || 'active',
    visibleToGroupTypes: visibility.visibleToGroupTypes,
    visibleToGroupIds: visibility.visibleToGroupIds,
    originalName: plain.original_name,
    filePath: plain.file_path,
    fileSize,
    size: formatFileSize(fileSize),
    fileType,
    type: fileType,
    mimeType: plain.mime_type,
    metadata: plain.metadata || null,
    url: `/api/resources/files/download/${plain.id}`,
    createdAt: toISOString(plain.createdAt || plain.created_at),
    updatedAt: toISOString(plain.updatedAt || plain.updated_at),
    uploadedAt: toISOString(plain.createdAt || plain.created_at),
  };
}

function mapAnnouncement(raw) {
  const plain = raw?.get ? raw.get({ plain: true }) : raw;
  if (!plain) {
    return null;
  }
  const visibility = normalizeVisibilityForRecord(plain, ['admin']);
  return {
    id: plain.id,
    title: plain.title,
    summary: plain.summary || '',
    body: plain.body || '',
    categoryId: plain.category_id || null,
    category: pickCategorySummary(plain.category),
    isPinned: parseBoolean(plain.is_pinned, false),
    pinnedOrder: parseNumber(plain.pinned_order, 0),
    publishAt: toISOString(plain.publish_at),
    expireAt: toISOString(plain.expire_at),
    ctaLabel: plain.cta_label || null,
    ctaUrl: plain.cta_url || null,
    status: plain.status || 'draft',
    visibleToGroupTypes: visibility.visibleToGroupTypes,
    visibleToGroupIds: visibility.visibleToGroupIds,
    metadata: plain.metadata || null,
    createdAt: toISOString(plain.createdAt || plain.created_at),
    updatedAt: toISOString(plain.updatedAt || plain.updated_at),
  };
}

function sortByPinnedPriority(list) {
  return list.slice().sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    const orderDiff = parseNumber(a.pinnedOrder, 0) - parseNumber(b.pinnedOrder, 0);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    const aDate = toISOString(a.updatedAt || a.createdAt) || '1970-01-01T00:00:00.000Z';
    const bDate = toISOString(b.updatedAt || b.createdAt) || '1970-01-01T00:00:00.000Z';
    return bDate.localeCompare(aDate);
  });
}

function collectFileTypeCounts(files) {
  return files.reduce((acc, file) => {
    const key = file.type || 'other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function resolveUniqueSlug(baseValue, existingId = null) {
  const baseSlug = slugify(baseValue);
  if (!baseSlug) {
    throw new Error('Unable to derive slug from provided value');
  }
  let candidate = baseSlug;
  let suffix = 1;
  const whereExclusion = existingId ? { id: { [Op.ne]: existingId } } : {};
  // Try up to 1000 variations before giving up
  while (suffix < 1000) {
    const existing = await ResourceCategory.findOne({
      where: {
        slug: candidate,
        ...whereExclusion,
      },
      attributes: ['id'],
    });
    if (!existing) {
      return candidate;
    }
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
    if (candidate.length > 160) {
      const trimmed = baseSlug.slice(0, Math.max(0, 160 - (`-${suffix}`).length));
      candidate = `${trimmed}-${suffix}`;
    }
  }
  throw new Error('Unable to generate unique slug');
}

function normalizeCategoryId(value) {
  if (value === undefined || value === null || value === '' || value === 'null') {
    return null;
  }
  const numeric = Number(value);
  return Number.isInteger(numeric) ? numeric : null;
}

function prepareVisibilityPayload(source, fallbackTypes = ['admin']) {
  const types = normalizeArrayInput(
    source.visible_to_group_types ?? source.visibleToGroupTypes ?? fallbackTypes,
    fallbackTypes
  );
  const finalTypes = types.length ? types : fallbackTypes.slice();
  const ids = normalizeGroupIds(source.visible_to_group_ids ?? source.visibleToGroupIds ?? []);
  return { types: finalTypes, ids };
}

function normalizeTagsInput(value) {
  return normalizeArrayInput(value);
}

function normalizeMetadata(value) {
  const parsed = safeJsonParse(value, null);
  return parsed || null;
}

function normalizeLinkStatus(value) {
  const normalized = String(value || '').toLowerCase();
  return LINK_STATUS_VALUES.has(normalized) ? normalized : 'active';
}

function normalizeFileStatus(value) {
  const normalized = String(value || '').toLowerCase();
  return FILE_STATUS_VALUES.has(normalized) ? normalized : 'active';
}

function normalizeAnnouncementStatus(value) {
  const normalized = String(value || '').toLowerCase();
  return ANNOUNCEMENT_STATUS_VALUES.has(normalized) ? normalized : 'draft';
}

function normalizeLinkType(value) {
  const normalized = String(value || '').toLowerCase();
  return LINK_TYPES.has(normalized) ? normalized : 'external';
}

function buildContentDisposition(filename, inline = false) {
  const fallback = 'resource';
  const safeName = String(filename || fallback)
    .replace(/[\r\n]/g, ' ')
    .replace(/"/g, "'");
  const encoded = encodeURIComponent(filename || fallback);
  const type = inline ? 'inline' : 'attachment';
  return `${type}; filename="${safeName}"; filename*=UTF-8''${encoded}`;
}
async function getResources(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const isAdmin = userIsAdmin(user);
    const includeInactive = isAdmin && parseBoolean(req.query.includeInactive, false);
    const now = new Date();

    const categoryWhere = includeInactive ? {} : { is_active: true };
    const [categoriesRaw, announcementsRaw, linksRaw, filesRaw] = await Promise.all([
      ResourceCategory.findAll({
        where: categoryWhere,
        order: [
          ['sort_order', 'ASC'],
          ['name', 'ASC'],
        ],
      }),
      ResourceAnnouncement.findAll({
        where: includeInactive
          ? undefined
          : {
              [Op.and]: [
                { status: 'published' },
                {
                  [Op.or]: [
                    { publish_at: null },
                    { publish_at: { [Op.lte]: now } },
                  ],
                },
                {
                  [Op.or]: [
                    { expire_at: null },
                    { expire_at: { [Op.gt]: now } },
                  ],
                },
              ],
            },
        order: [
          ['is_pinned', 'DESC'],
          ['pinned_order', 'ASC'],
          ['publish_at', 'DESC'],
          ['created_at', 'DESC'],
        ],
        include: [
          {
            model: ResourceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon'],
          },
        ],
      }),
      ResourceLink.findAll({
        where: includeInactive ? undefined : { status: 'active' },
        order: [
          ['is_pinned', 'DESC'],
          ['pinned_order', 'ASC'],
          ['createdAt', 'DESC'],
        ],
        include: [
          {
            model: ResourceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon'],
          },
        ],
      }),
      ResourceFile.findAll({
        where: {
          [Op.and]: [
            { is_deleted: false },
            ...(includeInactive ? [] : [{ status: 'active' }]),
          ],
        },
        order: [
          ['is_pinned', 'DESC'],
          ['pinned_order', 'ASC'],
          ['created_at', 'DESC'],
        ],
        include: [
          {
            model: ResourceCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon'],
          },
        ],
      }),
    ]);

    const announcements = sortByPinnedPriority(
      announcementsRaw
        .filter((record) => isVisibleToUser(record, user, { isAdmin }))
        .map((record) => mapAnnouncement(record))
        .filter(Boolean)
    );

    const links = sortByPinnedPriority(
      linksRaw
        .filter((record) => isVisibleToUser(record, user, { isAdmin }))
        .map((record) => mapLink(record))
        .filter(Boolean)
    );

    const files = sortByPinnedPriority(
      filesRaw
        .filter((record) => isVisibleToUser(record, user, { isAdmin }))
        .map((record) => mapFile(record))
        .filter(Boolean)
    );

    const pinned = {
      announcements: announcements.filter((item) => item.isPinned),
      links: links.filter((item) => item.isPinned),
      files: files.filter((item) => item.isPinned),
    };

    const categories = buildCategoryTree(categoriesRaw);

    const stats = {
      totals: {
        categories: categoriesRaw.length,
        announcements: announcements.length,
        links: links.length,
        files: files.length,
      },
      filesByType: collectFileTypeCounts(files),
    };

    return res.json({
      success: true,
      data: {
        categories,
        announcements,
        links,
        files,
        pinned,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return res.status(500).json({ success: false, message: 'Failed to load resources' });
  }
}

async function getCategories(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const includeInactive = parseBoolean(req.query.includeInactive, false);
    const categoriesRaw = await ResourceCategory.findAll({
      where: includeInactive ? {} : { is_active: true },
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return res.json({ success: true, data: buildCategoryTree(categoriesRaw) });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
}

async function scaffoldCategories(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const createdSlugs = [];
    for (const blueprint of DEFAULT_CATEGORY_SCAFFOLD) {
      const defaults = {
        name: blueprint.name,
        slug: blueprint.slug,
        description: blueprint.description || null,
        color: blueprint.color || null,
        icon: blueprint.icon || null,
        sort_order: blueprint.sort_order ?? 0,
        is_active: true,
        is_pinned: blueprint.is_pinned ?? false,
        pinned_order: blueprint.pinned_order ?? 0,
        thumbnail_url: blueprint.thumbnail_url ?? null,
        metadata: blueprint.metadata ?? null,
      };
      const [record, wasCreated] = await ResourceCategory.findOrCreate({
        where: { slug: blueprint.slug },
        defaults,
      });
      if (wasCreated) {
        createdSlugs.push(record.slug);
      }
    }

    const categoriesRaw = await ResourceCategory.findAll({
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const message = createdSlugs.length
      ? 'Starter categories created successfully'
      : 'Starter categories already exist';

    return res.json({
      success: true,
      data: buildCategoryTree(categoriesRaw),
      message,
      created: createdSlugs,
    });
  } catch (error) {
    console.error('Error scaffolding categories:', error);
    return res.status(500).json({ success: false, message: 'Failed to scaffold categories' });
  }
}

async function createCategory(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { body } = req;
    const name = String(body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const parentId = normalizeCategoryId(body.parent_id ?? body.parentId ?? null);
    if (parentId) {
      const parent = await ResourceCategory.findByPk(parentId);
      if (!parent) {
        return res.status(400).json({ success: false, message: 'Parent category not found' });
      }
    }
    const desiredSlug = String(body.slug || '').trim() || name;
    const slug = await resolveUniqueSlug(desiredSlug);
    const payload = {
      name,
      slug,
      description: body.description || null,
      color: body.color || null,
      icon: body.icon || null,
      parent_id: parentId,
      sort_order: parseNumber(body.sort_order ?? body.sortOrder, 0),
      is_active: parseBoolean(body.is_active ?? body.isActive, true),
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder, 0),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? null,
      metadata: normalizeMetadata(body.metadata),
    };
    const category = await ResourceCategory.create(payload);
    return res.status(201).json({ success: true, data: mapCategory(category), message: 'Category created' });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
}

async function updateCategory(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    const category = await ResourceCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const { body } = req;
    const name = String(body.name || category.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const parentId = normalizeCategoryId(body.parent_id ?? body.parentId ?? category.parent_id);
    if (parentId) {
      if (parentId === id) {
        return res.status(400).json({ success: false, message: 'Category cannot be its own parent' });
      }
      let ancestorId = parentId;
      while (ancestorId) {
        if (ancestorId === id) {
          return res.status(400).json({ success: false, message: 'Cannot set descendant as parent' });
        }
        const ancestor = await ResourceCategory.findByPk(ancestorId, { attributes: ['parent_id'] });
        if (!ancestor || !ancestor.parent_id) {
          break;
        }
        ancestorId = ancestor.parent_id;
      }
    }
    const desiredSlug = String(body.slug || category.slug || '').trim() || name;
    const slug = desiredSlug === category.slug ? category.slug : await resolveUniqueSlug(desiredSlug, id);
    const payload = {
      name,
      slug,
      description: body.description ?? category.description,
      color: body.color ?? category.color,
      icon: body.icon ?? category.icon,
      parent_id: parentId,
      sort_order: parseNumber(body.sort_order ?? body.sortOrder ?? category.sort_order, 0),
      is_active: parseBoolean(body.is_active ?? body.isActive ?? category.is_active, true),
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned ?? category.is_pinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder ?? category.pinned_order, 0),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? category.thumbnail_url,
      metadata: normalizeMetadata(body.metadata ?? category.metadata),
    };
    await category.update(payload);
    return res.json({ success: true, data: mapCategory(category), message: 'Category updated' });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    const category = await ResourceCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    if (PROTECTED_CATEGORY_SLUGS.has(String(category.slug || '').toLowerCase())) {
      return res.status(400).json({ success: false, message: 'This category is protected and cannot be removed' });
    }
    const [childCount, fileCount, linkCount, announcementCount] = await Promise.all([
      ResourceCategory.count({ where: { parent_id: id } }),
      ResourceFile.count({ where: { category_id: id, is_deleted: false } }),
      ResourceLink.count({ where: { category_id: id } }),
      ResourceAnnouncement.count({ where: { category_id: id } }),
    ]);
    if (childCount > 0) {
      return res.status(400).json({ success: false, message: 'Move or delete child categories first' });
    }
    if (fileCount + linkCount + announcementCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category in use. Reassign files, links, and announcements before deleting.',
      });
    }
    await category.destroy();
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
}
async function getLinks(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const isAdmin = userIsAdmin(user);
    const includeInactive = parseBoolean(req.query.includeInactive, isAdmin);
    const records = await ResourceLink.findAll({
      where: includeInactive ? undefined : { status: 'active' },
      order: [
        ['is_pinned', 'DESC'],
        ['pinned_order', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      include: [
        {
          model: ResourceCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
    });
    const data = records
      .filter((record) => isVisibleToUser(record, user, { isAdmin }))
      .map((record) => mapLink(record))
      .filter(Boolean);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching links:', error);
    return res.status(500).json({ success: false, message: 'Failed to load links' });
  }
}

async function saveLink(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { body } = req;
    const title = String(body.title || '').trim();
    const url = String(body.url || '').trim();
    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }
    const type = normalizeLinkType(body.type);
    if (type === 'external') {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ success: false, message: 'Invalid external URL' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid external URL' });
      }
    }
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const payload = {
      title,
      url,
      type,
      description: body.description || null,
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? null,
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder, 0),
      tags: normalizeTagsInput(body.tags),
      cta_label: body.cta_label ?? body.ctaLabel ?? null,
      cta_url: body.cta_url ?? body.ctaUrl ?? null,
      status: normalizeLinkStatus(body.status),
      metadata: normalizeMetadata(body.metadata),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
    };
    const link = await ResourceLink.create(payload);
    await link.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.status(201).json({ success: true, data: mapLink(link), message: 'Link created' });
  } catch (error) {
    console.error('Error saving link:', error);
    return res.status(500).json({ success: false, message: 'Failed to save link' });
  }
}

async function updateLink(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid link ID' });
    }
    const link = await ResourceLink.findByPk(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }
    const { body } = req;
    const title = String(body.title || link.title || '').trim();
    const url = String(body.url || link.url || '').trim();
    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }
    const type = normalizeLinkType(body.type ?? link.type);
    if (type === 'external') {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ success: false, message: 'Invalid external URL' });
        }
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Invalid external URL' });
      }
    }
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const payload = {
      title,
      url,
      type,
      description: body.description ?? link.description,
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId ?? link.category_id),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? link.thumbnail_url,
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned ?? link.is_pinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder ?? link.pinned_order, 0),
      tags: normalizeTagsInput(body.tags ?? link.tags),
      cta_label: body.cta_label ?? body.ctaLabel ?? link.cta_label,
      cta_url: body.cta_url ?? body.ctaUrl ?? link.cta_url,
      status: normalizeLinkStatus(body.status ?? link.status),
      metadata: normalizeMetadata(body.metadata ?? link.metadata),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
    };
    await link.update(payload);
    await link.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.json({ success: true, data: mapLink(link), message: 'Link updated' });
  } catch (error) {
    console.error('Error updating link:', error);
    return res.status(500).json({ success: false, message: 'Failed to update link' });
  }
}

async function deleteLink(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid link ID' });
    }
    const link = await ResourceLink.findByPk(id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }
    await link.destroy();
    return res.json({ success: true, message: 'Link deleted' });
  } catch (error) {
    console.error('Error deleting link:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete link' });
  }
}

async function getFiles(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const isAdmin = userIsAdmin(user);
    const includeInactive = parseBoolean(req.query.includeInactive, isAdmin);
    const filesRaw = await ResourceFile.findAll({
      where: {
        [Op.and]: [
          { is_deleted: false },
          ...(includeInactive ? [] : [{ status: 'active' }]),
        ],
      },
      order: [
        ['is_pinned', 'DESC'],
        ['pinned_order', 'ASC'],
        ['created_at', 'DESC'],
      ],
      include: [
        {
          model: ResourceCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
    });
    const data = filesRaw
      .filter((record) => isVisibleToUser(record, user, { isAdmin }))
      .map((record) => mapFile(record))
      .filter(Boolean);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({ success: false, message: 'Failed to load files' });
  }
}

async function saveFile(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const filePayload = req.file;
    if (!filePayload) {
      return res.status(400).json({ success: false, message: 'File upload is required' });
    }
    const { body } = req;
    const storedPath = toRelativeStoragePath(filePayload.path);
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const name = String(body.name || filePayload.originalname || '').trim() || filePayload.filename;
    const fileType = detectFileMedium({ mimeType: filePayload.mimetype, originalName: filePayload.originalname });
    const payload = {
      name,
      original_name: filePayload.originalname,
      description: body.description || null,
      file_path: storedPath,
      file_size: filePayload.size,
      file_type: fileType,
      file_category: fileType,
      mime_type: filePayload.mimetype,
      status: normalizeFileStatus(body.status),
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? null,
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder, 0),
      tags: normalizeTagsInput(body.tags),
      cta_label: body.cta_label ?? body.ctaLabel ?? null,
      cta_url: body.cta_url ?? body.ctaUrl ?? null,
      metadata: normalizeMetadata(body.metadata),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
      is_deleted: false,
    };
    const record = await ResourceFile.create(payload);
    await record.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.status(201).json({ success: true, data: mapFile(record), message: 'File uploaded' });
  } catch (error) {
    console.error('Error saving file:', error);
    return res.status(500).json({ success: false, message: 'Failed to save file' });
  }
}

async function updateFile(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    const record = await ResourceFile.findByPk(id);
    if (!record || record.is_deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const { body } = req;
    const newFile = req.file;
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const updates = {
      name: String(body.name || record.name || '').trim() || record.name,
      description: body.description ?? record.description,
      status: normalizeFileStatus(body.status ?? record.status),
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId ?? record.category_id),
      thumbnail_url: body.thumbnail_url ?? body.thumbnailUrl ?? record.thumbnail_url,
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned ?? record.is_pinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder ?? record.pinned_order, 0),
      tags: normalizeTagsInput(body.tags ?? record.tags),
      cta_label: body.cta_label ?? body.ctaLabel ?? record.cta_label,
      cta_url: body.cta_url ?? body.ctaUrl ?? record.cta_url,
      metadata: normalizeMetadata(body.metadata ?? record.metadata),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
    };
    if (newFile) {
      const oldPath = record.file_path ? safeResolveStoragePath(record.file_path) : null;
      updates.original_name = newFile.originalname;
      updates.file_path = toRelativeStoragePath(newFile.path);
      updates.file_size = newFile.size;
      const fileType = detectFileMedium({ mimeType: newFile.mimetype, originalName: newFile.originalname });
      updates.file_type = fileType;
      updates.file_category = fileType;
      updates.mime_type = newFile.mimetype;
      removeFileQuietly(oldPath);
    }
    await record.update(updates);
    await record.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.json({ success: true, data: mapFile(record), message: 'File updated' });
  } catch (error) {
    console.error('Error updating file:', error);
    return res.status(500).json({ success: false, message: 'Failed to update file' });
  }
}

async function deleteFile(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    const record = await ResourceFile.findByPk(id);
    if (!record || record.is_deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const absolutePath = record.file_path ? safeResolveStoragePath(record.file_path) : null;
    await record.update({ is_deleted: true, status: 'inactive' });
    removeFileQuietly(absolutePath);
    return res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
}
async function downloadFile(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid file ID' });
    }
    const record = await ResourceFile.findByPk(id);
    if (!record || record.is_deleted) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const isAdmin = userIsAdmin(user);
    if (!isAdmin && record.status !== 'active') {
      return res.status(403).json({ success: false, message: 'You do not have access to this file' });
    }
    if (!isVisibleToUser(record, user, { isAdmin })) {
      return res.status(403).json({ success: false, message: 'You do not have access to this file' });
    }
    if (!record.file_path) {
      return res.status(404).json({ success: false, message: 'File path missing' });
    }
    let absolutePath;
    try {
      absolutePath = safeResolveStoragePath(record.file_path);
    } catch (error) {
      console.error('Download path resolution error:', error);
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    if (!fs.existsSync(absolutePath)) {
      console.warn('Resource file missing on disk:', absolutePath);
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    const stat = fs.statSync(absolutePath);
    const total = stat.size;
    const mode = String(req.query.mode || '').toLowerCase();
    const mimeType = record.mime_type || 'application/octet-stream';
    const inlineAllowed = mode === 'inline' && INLINE_MIME_WHITELIST.some((prefix) => mimeType.startsWith(prefix));
    const disposition = buildContentDisposition(record.original_name, inlineAllowed);
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (!match) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : total - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= total || end >= total) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Content-Disposition': disposition,
      });
      const stream = fs.createReadStream(absolutePath, { start, end });
      stream.on('error', (error) => {
        console.error('Stream error while serving range:', error);
        res.end();
      });
      return stream.pipe(res);
    }

    res.setHeader('Content-Length', total);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (error) => {
      console.error('Stream error while serving file:', error);
      res.status(500).end();
    });
    return stream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    return res.status(500).json({ success: false, message: 'Failed to download file' });
  }
}

async function getAnnouncements(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const isAdmin = userIsAdmin(user);
    const includeInactive = parseBoolean(req.query.includeInactive, isAdmin);
    const now = new Date();
    const records = await ResourceAnnouncement.findAll({
      where: includeInactive
        ? undefined
        : {
            [Op.and]: [
              { status: 'published' },
              {
                [Op.or]: [
                  { publish_at: null },
                  { publish_at: { [Op.lte]: now } },
                ],
              },
              {
                [Op.or]: [
                  { expire_at: null },
                  { expire_at: { [Op.gt]: now } },
                ],
              },
            ],
          },
      order: [
        ['is_pinned', 'DESC'],
        ['pinned_order', 'ASC'],
        ['publish_at', 'DESC'],
        ['created_at', 'DESC'],
      ],
      include: [
        {
          model: ResourceCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon'],
        },
      ],
    });
    const data = sortByPinnedPriority(
      records
        .filter((record) => isVisibleToUser(record, user, { isAdmin }))
        .map((record) => mapAnnouncement(record))
        .filter(Boolean)
    );
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return res.status(500).json({ success: false, message: 'Failed to load announcements' });
  }
}

async function createAnnouncement(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { body } = req;
    const title = String(body.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Announcement title is required' });
    }
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const payload = {
      title,
      summary: body.summary || null,
      body: body.body || null,
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId),
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder, 0),
      publish_at: parseDate(body.publish_at ?? body.publishAt),
      expire_at: parseDate(body.expire_at ?? body.expireAt),
      cta_label: body.cta_label ?? body.ctaLabel ?? null,
      cta_url: body.cta_url ?? body.ctaUrl ?? null,
      status: normalizeAnnouncementStatus(body.status),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
      metadata: normalizeMetadata(body.metadata),
      created_by: req.user?.id || null,
      updated_by: req.user?.id || null,
    };
    const record = await ResourceAnnouncement.create(payload);
    await record.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.status(201).json({ success: true, data: mapAnnouncement(record), message: 'Announcement created' });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(500).json({ success: false, message: 'Failed to create announcement' });
  }
}

async function updateAnnouncement(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
    }
    const record = await ResourceAnnouncement.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    const { body } = req;
    const title = String(body.title || record.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'Announcement title is required' });
    }
    const { types, ids } = prepareVisibilityPayload(body, ['admin']);
    const payload = {
      title,
      summary: body.summary ?? record.summary,
      body: body.body ?? record.body,
      category_id: normalizeCategoryId(body.category_id ?? body.categoryId ?? record.category_id),
      is_pinned: parseBoolean(body.is_pinned ?? body.isPinned ?? record.is_pinned, false),
      pinned_order: parseNumber(body.pinned_order ?? body.pinnedOrder ?? record.pinned_order, 0),
      publish_at: parseDate(body.publish_at ?? body.publishAt ?? record.publish_at),
      expire_at: parseDate(body.expire_at ?? body.expireAt ?? record.expire_at),
      cta_label: body.cta_label ?? body.ctaLabel ?? record.cta_label,
      cta_url: body.cta_url ?? body.ctaUrl ?? record.cta_url,
      status: normalizeAnnouncementStatus(body.status ?? record.status),
      visible_to_group_types: types,
      visible_to_group_ids: ids,
      metadata: normalizeMetadata(body.metadata ?? record.metadata),
      updated_by: req.user?.id || null,
    };
    await record.update(payload);
    await record.reload({
      include: [{ model: ResourceCategory, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
    });
    return res.json({ success: true, data: mapAnnouncement(record), message: 'Announcement updated' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(500).json({ success: false, message: 'Failed to update announcement' });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    if (!userIsAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid announcement ID' });
    }
    const record = await ResourceAnnouncement.findByPk(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    await record.destroy();
    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement' });
  }
}

module.exports = {
  getResources,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  scaffoldCategories,
  getLinks,
  saveLink,
  updateLink,
  deleteLink,
  getFiles,
  saveFile,
  updateFile,
  deleteFile,
  downloadFile,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
