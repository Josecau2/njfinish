const LoginCustomization = require('../models/LoginCustomization');
const { cloneLoginCustomizationDefaults } = require('../constants/loginCustomizationDefaults');

let cachedCustomization = null;
let lastFetched = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const collectBenefitStrings = (input, target) => {
  if (input === undefined || input === null) {
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((item) => collectBenefitStrings(item, target));
    return;
  }

  if (typeof input === 'object') {
    collectBenefitStrings(Object.values(input), target);
    return;
  }

  let str = String(input || '').trim();
  if (!str) return;

  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        collectBenefitStrings(parsed, target);
        return;
      }
    } catch (err) {
      // fall back to newline splitting if JSON parsing fails
    }
  }

  if (str.startsWith('"')) {
    str = str.slice(1);
  }
  if (str.endsWith('"')) {
    str = str.slice(0, -1);
  }
  str = str.trim();

  str
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => target.push(item));
};

const normalizeBenefits = (value, fallback) => {
  const result = [];
  collectBenefitStrings(value, result);

  if (result.length > 0) {
    return result;
  }

  const fallbackResult = [];
  collectBenefitStrings(fallback, fallbackResult);
  return fallbackResult;
};

const coerceString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
};

const coerceInteger = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const coerceBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
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
  merged.smtpHost = coerceString(merged.smtpHost, defaults.smtpHost);
  const rawPort = Object.prototype.hasOwnProperty.call(raw, 'smtpPort') ? raw.smtpPort : merged.smtpPort;
  merged.smtpPort = rawPort === '' ? '' : coerceInteger(rawPort, defaults.smtpPort);
  const secureSource = Object.prototype.hasOwnProperty.call(raw, 'smtpSecure') ? raw.smtpSecure : merged.smtpSecure;
  merged.smtpSecure = coerceBoolean(secureSource, defaults.smtpSecure);
  merged.smtpUser = coerceString(merged.smtpUser, defaults.smtpUser);
  merged.smtpPass = coerceString(merged.smtpPass, defaults.smtpPass);
  merged.emailFrom = coerceString(merged.emailFrom, defaults.emailFrom);
  return merged;
};

const stripRuntimeFields = (customization = {}) => {
  const copy = { ...customization };
  delete copy._generated;
  delete copy._version;
  return copy;
};

const extractEmailSettings = (customization = {}) => {
  const compiled = compileCustomization(customization);
  const normalizedPort = compiled.smtpPort === null || compiled.smtpPort === undefined ? '' : compiled.smtpPort;
  return {
    smtpHost: coerceString(compiled.smtpHost, ''),
    smtpPort: normalizedPort,
    smtpSecure: coerceBoolean(compiled.smtpSecure, false),
    smtpUser: coerceString(compiled.smtpUser, ''),
    smtpPass: coerceString(compiled.smtpPass, ''),
    emailFrom: coerceString(compiled.emailFrom, ''),
  };
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
  stripRuntimeFields,
  extractEmailSettings
};




