const nodemailer = require('nodemailer');
require('dotenv').config();

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  const str = String(value).trim();
  return str.length ? str : undefined;
};

const normalizePort = (value) => {
  const cleaned = normalizeString(value);
  if (cleaned === undefined) return undefined;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const computeDefaultFrom = (settings = {}) => {
  return (
    normalizeString(settings.emailFrom) ||
    normalizeString(settings.smtpUser) ||
    normalizeString(process.env.EMAIL_FROM) ||
    normalizeString(process.env.SMTP_USER) ||
    normalizeString(process.env.GMAIL_USER) ||
    undefined
  );
};

const buildTransportConfig = (overrides = {}) => {
  const smtpHost = normalizeString(overrides.smtpHost) || normalizeString(process.env.SMTP_HOST);
  const smtpService = normalizeString(overrides.smtpService) || normalizeString(process.env.SMTP_SERVICE);
  const smtpPort = overrides.smtpPort !== undefined ? normalizePort(overrides.smtpPort) : normalizePort(process.env.SMTP_PORT);
  const smtpSecure = overrides.smtpSecure !== undefined
    ? parseBoolean(overrides.smtpSecure, undefined)
    : parseBoolean(process.env.SMTP_SECURE, undefined);
  const smtpUser = normalizeString(overrides.smtpUser) || normalizeString(process.env.SMTP_USER);
  const smtpPass = normalizeString(overrides.smtpPass) || normalizeString(process.env.SMTP_PASS);
  const gmailUser = normalizeString(process.env.GMAIL_USER);
  const gmailPass = normalizeString(process.env.GMAIL_APP_PASS);
  const emailFrom = normalizeString(overrides.emailFrom) || normalizeString(process.env.EMAIL_FROM) || smtpUser || gmailUser;

  const config = {};
  const meta = {
    smtpHost: smtpHost || null,
    smtpPort: smtpPort ?? null,
    smtpSecure: smtpSecure ?? null,
    smtpUser: smtpUser || null,
    smtpPassSet: Boolean(smtpPass || gmailPass),
    emailFrom: emailFrom || null,
    source: Object.keys(overrides || {}).length ? 'overrides' : 'env',
  };

  if (smtpService) {
    config.service = smtpService;
  }

  if (smtpHost) {
    config.host = smtpHost;
  }

  if (!config.service && !config.host && gmailUser && gmailPass) {
    config.service = 'gmail';
    config.auth = {
      user: gmailUser,
      pass: gmailPass,
    };
    meta.smtpUser = gmailUser;
    meta.smtpPassSet = true;
    meta.source = meta.source === 'overrides' ? meta.source : 'gmail-env';
  } else {
    if (smtpPort !== undefined) {
      config.port = smtpPort;
      meta.smtpPort = smtpPort;
    }

    if (smtpSecure !== undefined) {
      config.secure = smtpSecure;
      meta.smtpSecure = smtpSecure;
    } else if (config.port === 465) {
      config.secure = true;
      meta.smtpSecure = true;
    }

    const chosenUser = smtpUser || gmailUser;
    const chosenPass = smtpPass || (smtpUser ? gmailPass : undefined);

    if (chosenUser && chosenPass) {
      config.auth = {
        user: chosenUser,
        pass: chosenPass,
      };
      meta.smtpUser = chosenUser;
      meta.smtpPassSet = true;
    } else if (chosenUser && smtpPass) {
      config.auth = {
        user: chosenUser,
        pass: smtpPass,
      };
      meta.smtpUser = chosenUser;
      meta.smtpPassSet = true;
    }
  }

  if (!config.service && !config.host) {
    meta.reason = 'missing-host-or-service';
    return null;
  }

  return {
    transportOptions: config,
    defaultFrom: emailFrom || computeDefaultFrom(overrides),
    meta,
  };
};

let transporter = null;
let defaultFrom = computeDefaultFrom();
let lastConfigSummary = null;

const applyTransportConfig = (overrides = null) => {
  const result = buildTransportConfig(overrides || {});
  if (!result) {
    transporter = null;
    defaultFrom = computeDefaultFrom(overrides || {});
    lastConfigSummary = null;
    return { success: false, reason: 'missing-credentials' };
  }

  transporter = nodemailer.createTransport(result.transportOptions);
  defaultFrom = result.defaultFrom || computeDefaultFrom(overrides || {});
  lastConfigSummary = {
    ...result.meta,
    defaultFrom: defaultFrom || null,
  };

  return { success: true, meta: lastConfigSummary };
};

const ensureTransporterConfigured = () => {
  if (!transporter) {
    const outcome = applyTransportConfig();
    if (!outcome.success) {
      throw new Error('Email transporter is not configured. Please set SMTP or Gmail credentials.');
    }
  }
};

const sendMail = async (options) => {
  ensureTransporterConfigured();
  const mailOptions = { ...options };
  if (!mailOptions.from && defaultFrom) {
    mailOptions.from = defaultFrom;
  }
  return transporter.sendMail(mailOptions);
};

const createTestTransporter = (overrides = {}) => {
  const result = buildTransportConfig(overrides || {});
  if (!result) {
    throw new Error('Email transporter is not configured. Please set SMTP or Gmail credentials.');
  }
  return {
    transporter: nodemailer.createTransport(result.transportOptions),
    defaultFrom: result.defaultFrom,
    meta: result.meta,
  };
};

const getDefaultFrom = () => defaultFrom;
const getCurrentConfigSummary = () => lastConfigSummary;

const bootstrapResult = applyTransportConfig();
if (!bootstrapResult.success) {
  console.warn('[mail] No SMTP configuration detected. Email sending is disabled.');
}

const exported = {
  sendMail,
  getDefaultFrom,
  applyTransportConfig,
  buildTransportConfig,
  createTestTransporter,
  getCurrentConfigSummary,
  ensureTransporterConfigured,
};

Object.defineProperty(exported, 'transporter', {
  enumerable: true,
  get() {
    return transporter;
  },
});

module.exports = exported;
