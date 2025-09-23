const LoginCustomization = require('../models/LoginCustomization');
const { cloneLoginCustomizationDefaults } = require('../constants/loginCustomizationDefaults');

let cachedCustomization = null;
let lastFetched = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const normalizeBenefits = (value, fallback) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  return Array.isArray(fallback) ? [...fallback] : [];
};

const coerceString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
};

const compileCustomization = (raw = {}) => {
  const defaults = cloneLoginCustomizationDefaults();
  const merged = { ...defaults, ...raw };
  merged.requestAccessBenefits = normalizeBenefits(raw.requestAccessBenefits ?? merged.requestAccessBenefits, defaults.requestAccessBenefits);
  merged.requestAccessTitle = coerceString(raw.requestAccessTitle, defaults.requestAccessTitle);
  merged.requestAccessSubtitle = coerceString(raw.requestAccessSubtitle, defaults.requestAccessSubtitle);
  merged.requestAccessDescription = coerceString(raw.requestAccessDescription, defaults.requestAccessDescription);
  merged.requestAccessSuccessMessage = coerceString(raw.requestAccessSuccessMessage, defaults.requestAccessSuccessMessage);
  merged.requestAccessAdminSubject = coerceString(raw.requestAccessAdminSubject, defaults.requestAccessAdminSubject);
  merged.requestAccessAdminBody = coerceString(raw.requestAccessAdminBody, defaults.requestAccessAdminBody);
  merged.requestAccessLeadSubject = coerceString(raw.requestAccessLeadSubject, defaults.requestAccessLeadSubject);
  merged.requestAccessLeadBody = coerceString(raw.requestAccessLeadBody, defaults.requestAccessLeadBody);
  return merged;
};

const stripRuntimeFields = (customization = {}) => {
  const copy = { ...customization };
  delete copy._generated;
  delete copy._version;
  return copy;
};

async function fetchCustomizationFromDb() {
  const record = await LoginCustomization.findOne({ where: { id: 1 } });
  return record ? record.toJSON() : {};
}

async function getLoginCustomization(forceRefresh = false) {
  const now = Date.now();
  if (!cachedCustomization || forceRefresh || now - lastFetched > CACHE_TTL_MS) {
    const raw = await fetchCustomizationFromDb();
    cachedCustomization = compileCustomization(raw);
    lastFetched = now;
  }
  return cachedCustomization;
}

async function refreshLoginCustomization() {
  const raw = await fetchCustomizationFromDb();
  cachedCustomization = compileCustomization(raw);
  lastFetched = Date.now();
  return cachedCustomization;
}

const getRequestAccessConfig = async (forceRefresh = false) => {
  const customization = await getLoginCustomization(forceRefresh);
  return {
    title: customization.requestAccessTitle,
    subtitle: customization.requestAccessSubtitle,
    description: customization.requestAccessDescription,
    benefits: customization.requestAccessBenefits,
    successMessage: customization.requestAccessSuccessMessage,
    adminSubject: customization.requestAccessAdminSubject,
    adminBody: customization.requestAccessAdminBody,
    leadSubject: customization.requestAccessLeadSubject,
    leadBody: customization.requestAccessLeadBody,
  };
};

module.exports = {
  getLoginCustomization,
  refreshLoginCustomization,
  getRequestAccessConfig,
  compileCustomization,
  stripRuntimeFields
};
