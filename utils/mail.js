const nodemailer = require('nodemailer');
require('dotenv').config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
};

const buildTransportConfig = () => {
  const {
    SMTP_SERVICE,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    GMAIL_USER,
    GMAIL_APP_PASS,
  } = process.env;

  const hasCustomSmtp = SMTP_HOST || SMTP_SERVICE || (SMTP_USER && SMTP_PASS);
  const hasGmail = GMAIL_USER && GMAIL_APP_PASS;

  if (!hasCustomSmtp && !hasGmail) {
    return null;
  }

  const config = {};

  if (hasCustomSmtp) {
    if (SMTP_SERVICE) {
      config.service = SMTP_SERVICE;
    }

    if (SMTP_HOST) {
      config.host = SMTP_HOST;
    }

    if (SMTP_PORT) {
      config.port = Number(SMTP_PORT);
    }

    if (config.port === undefined && !config.service) {
      config.port = 587;
    }

    if (SMTP_SECURE !== undefined) {
      config.secure = parseBoolean(SMTP_SECURE, config.port === 465);
    } else if (config.port !== undefined) {
      config.secure = Number(config.port) === 465;
    }

    if (SMTP_USER && SMTP_PASS) {
      config.auth = {
        user: SMTP_USER,
        pass: SMTP_PASS,
      };
    } else if (hasGmail && !config.auth) {
      config.auth = {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASS,
      };
    }
  } else if (hasGmail) {
    config.service = 'gmail';
    config.auth = {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASS,
    };
  }

  if (Object.keys(config).length === 0) {
    return null;
  }

  return config;
};

let transporter = null;
const transportConfig = buildTransportConfig();
if (transportConfig) {
  transporter = nodemailer.createTransport(transportConfig);
} else {
  console.warn('[mail] No SMTP configuration detected. Email sending is disabled.');
}

const defaultFrom = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || undefined;

const sendMail = async (options) => {
  if (!transporter) {
    throw new Error('Email transporter is not configured. Please set SMTP or Gmail credentials.');
  }

  const mailOptions = { ...options };
  if (!mailOptions.from && defaultFrom) {
    mailOptions.from = defaultFrom;
  }

  return transporter.sendMail(mailOptions);
};

module.exports = {
  transporter,
  sendMail,
  getDefaultFrom: () => defaultFrom,
};
