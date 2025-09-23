const { Op } = require('sequelize');
const { Lead } = require('../models');
const { sendMail, transporter, getDefaultFrom } = require('../utils/mail');
const { getRequestAccessConfig } = require('../services/loginCustomizationCache');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STATUSES = new Set(['new', 'reviewing', 'contacted', 'closed']);

const normalize = (value) => (typeof value === 'string' ? value.trim() : '');

const clamp = (value, maxLength) => {
  if (!value) return '';
  return value.length > maxLength ? value.slice(0, maxLength) : value;
};

const toNull = (value) => (value && value.length ? value : null);

const splitNameParts = (value) => {
  if (!value) return { firstName: '', lastName: '' };
  const parts = value.split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  const [first, ...rest] = parts;
  return { firstName: first, lastName: rest.join(' ') };
};

const normalizeState = (value) => {
  const trimmed = normalize(value);
  if (!trimmed) return '';
  if (trimmed.length <= 3) {
    return trimmed.toUpperCase();
  }
  return trimmed;
};

const ensureMetadata = (existing = {}) => {
  if (!existing) return {};

  // If stored as JSON string (legacy/DB), parse it
  if (typeof existing === 'string') {
    try {
      const parsed = JSON.parse(existing);
      existing = parsed;
    } catch {
      return {};
    }
  }

  // If some code accidentally saved an array, wrap into an object
  if (Array.isArray(existing)) {
    return { value: existing };
  }

  if (typeof existing !== 'object') return {};

  return { ...existing };
};

const renderTemplate = (template = '', context = {}) => {
  if (!template) return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const replacement = context[key];
    return replacement === undefined || replacement === null ? '' : String(replacement);
  });
};

const toHtml = (value = '') => {
  if (!value) return '';
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => (line.length ? line : '&nbsp;'))
    .join('<br />');
};

const buildLeadContext = ({
  name,
  firstName,
  lastName,
  email,
  company,
  message,
  phone,
  city,
  state,
  zip,
}) => {
  const normalizedName = normalize(name);
  const normalizedFirst = normalize(firstName);
  const normalizedLast = normalize(lastName);
  const fallbackParts = splitNameParts(normalizedName);
  const safeFirst = normalizedFirst || fallbackParts.firstName || 'there';
  const safeLast = normalizedLast || fallbackParts.lastName;
  const fullName = normalizedName || [safeFirst, safeLast].filter(Boolean).join(' ').trim();
  const companyLine = company ? `\nCompany: ${company}` : '';
  const messageBlock = message ? `\n\nMessage:\n${message}` : '';
  const phoneLine = phone ? `\nPhone: ${phone}` : '';
  const locationParts = [city, state, zip].map((part) => normalize(part)).filter(Boolean);
  const location = locationParts.join(', ');
  const locationLine = location ? `\nLocation: ${location}` : '';
  return {
    name: fullName,
    firstName: safeFirst,
    lastName: safeLast,
    email,
    company,
    message,
    phone,
    city,
    state,
    zip,
    location,
    companyLine,
    phoneLine,
    locationLine,
    messageBlock,
  };
};

const appendHistory = (metadata, entry) => {
  const history = Array.isArray(metadata.history) ? [...metadata.history] : [];
  history.push(entry);
  metadata.history = history;
  return metadata;
};

exports.submitLead = async (req, res) => {
  try {
    const rawName = normalize(req.body?.name);
    let firstName = normalize(req.body?.firstName);
    let lastName = normalize(req.body?.lastName);
    const email = normalize(req.body?.email).toLowerCase();
    const company = clamp(normalize(req.body?.company), 191);
    let message = normalize(req.body?.message);
    let phone = clamp(normalize(req.body?.phone), 32);
    let city = clamp(normalize(req.body?.city), 191);
    let state = clamp(normalizeState(req.body?.state), 64);
    let zip = clamp(normalize(req.body?.zip), 32);

    const partsFromRaw = splitNameParts(rawName);
    if (!firstName && partsFromRaw.firstName) {
      firstName = partsFromRaw.firstName;
    }
    if (!lastName && partsFromRaw.lastName) {
      lastName = partsFromRaw.lastName;
    }

    let name = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!name) {
      name = rawName;
    }

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const partsFromName = splitNameParts(name);
    if (!firstName) {
      firstName = partsFromName.firstName;
    }
    if (!lastName && partsFromName.lastName) {
      lastName = partsFromName.lastName;
    }

    firstName = clamp(firstName, 191);
    lastName = clamp(lastName, 191);
    name = clamp(name, 191);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (message.length > 2000) {
      message = message.slice(0, 2000);
    }

    const nowIso = new Date().toISOString();
    const context = buildLeadContext({
      name,
      firstName,
      lastName,
      email,
      company,
      message,
      phone,
      city,
      state,
      zip,
    });
    const requestAccessConfig = await getRequestAccessConfig();

    let lead = await Lead.findOne({ where: { email } });

    if (lead) {
      const metadata = ensureMetadata(lead.metadata);
      metadata.ip = req.ip;
      metadata.userAgent = req.headers['user-agent'] || null;
      metadata.lastSubmissionAt = nowIso;
      metadata.contact = {
        name,
        firstName: toNull(firstName),
        lastName: toNull(lastName),
        phone: toNull(phone),
        city: toNull(city),
        state: toNull(state),
        zip: toNull(zip),
      };
      appendHistory(metadata, {
        action: 'resubmitted',
        status: 'new',
        at: nowIso,
      });

      await lead.update({
        name,
        firstName: firstName || lead.firstName || null,
        lastName: lastName || lead.lastName || null,
        phone: phone || lead.phone || null,
        city: city || lead.city || null,
        state: state || lead.state || null,
        zip: zip || lead.zip || null,
        company: company || lead.company || null,
        message: message || lead.message || null,
        status: 'new',
        metadata,
      });
    } else {
      const metadata = {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || null,
        requestedAt: nowIso,
        lastSubmissionAt: nowIso,
      };
      metadata.contact = {
        name,
        firstName: toNull(firstName),
        lastName: toNull(lastName),
        phone: toNull(phone),
        city: toNull(city),
        state: toNull(state),
        zip: toNull(zip),
      };
      appendHistory(metadata, {
        action: 'submitted',
        status: 'new',
        at: nowIso,
      });

      lead = await Lead.create({
        name,
        firstName: toNull(firstName),
        lastName: toNull(lastName),
        phone: toNull(phone),
        city: toNull(city),
        state: toNull(state),
        zip: toNull(zip),
        email,
        company: toNull(company),
        message: message || null,
        status: 'new',
        metadata,
      });
    }

    const adminRecipients = (process.env.ADMIN_NOTIFY_EMAIL || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const fallbackAdmin = getDefaultFrom();

    let adminEmailSent = false;
    let userEmailSent = false;

    if (transporter) {
      const adminTo = adminRecipients.length ? adminRecipients : (fallbackAdmin ? [fallbackAdmin] : []);

      if (adminTo.length) {
        try {
          const adminBody = renderTemplate(requestAccessConfig.adminBody, context);
          await sendMail({
            to: adminTo,
            subject: requestAccessConfig.adminSubject,
            html: toHtml(adminBody),
          });
          adminEmailSent = true;
        } catch (err) {
          console.error('Failed to send admin lead notification:', err?.message || err);
        }
      }

      try {
        const leadBody = renderTemplate(requestAccessConfig.leadBody, context);
        await sendMail({
          to: email,
          subject: requestAccessConfig.leadSubject,
          html: toHtml(leadBody),
        });
        userEmailSent = true;
      } catch (err) {
        console.error('Failed to send lead confirmation email:', err?.message || err);
      }
    }

    const responseMessage = requestAccessConfig.successMessage || 'Your request has been submitted. We will contact you soon.';
    const leadData = lead.toJSON ? lead.toJSON() : lead;

    return res.status(201).json({
      success: true,
      message: responseMessage,
      lead: leadData,
      notifications: {
        adminEmailSent,
        userEmailSent,
      },
    });
  } catch (error) {
    console.error('submitLead error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit request at this time.' });
  }
};

exports.listLeads = async (req, res) => {
  try {
    const where = {};
    const { status, search } = req.query || {};

    if (status) {
      const statuses = String(status)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => ALLOWED_STATUSES.has(value));

      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { [Op.in]: statuses };
      }
    }

    if (search) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { firstName: { [Op.like]: term } },
        { lastName: { [Op.like]: term } },
        { email: { [Op.like]: term } },
        { company: { [Op.like]: term } },
        { phone: { [Op.like]: term } },
        { city: { [Op.like]: term } },
        { state: { [Op.like]: term } },
        { zip: { [Op.like]: term } },
      ];
    }

    const leads = await Lead.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });

    return res.json({ success: true, leads });
  } catch (error) {
    console.error('listLeads error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch leads. Please try again.' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const incomingStatus = normalize(req.body?.status)?.toLowerCase();
    const adminNote = normalize(req.body?.adminNote);

    if (!incomingStatus && !adminNote) {
      return res.status(400).json({ success: false, message: 'No updates were provided.' });
    }

    if (incomingStatus && !ALLOWED_STATUSES.has(incomingStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found.' });
    }

    let updated = false;
    const metadata = ensureMetadata(lead.metadata);
    const nowIso = new Date().toISOString();

    if (incomingStatus && incomingStatus !== lead.status) {
      appendHistory(metadata, {
        action: 'status_changed',
        status: incomingStatus,
        from: lead.status,
        at: nowIso,
        by: req.user?.id || null,
      });
      if (incomingStatus === 'contacted') {
        metadata.lastContactedAt = nowIso;
      }
      lead.status = incomingStatus;
      updated = true;
    }

    if (adminNote) {
      const notes = Array.isArray(metadata.notes) ? metadata.notes : [];
      notes.unshift({
        note: adminNote,
        at: nowIso,
        by: req.user?.id || null,
        byName: req.user?.name || null,
      });
      metadata.notes = notes.slice(0, 100);
      metadata.lastNoteAt = nowIso;
      updated = true;
    }

    if (!updated) {
      return res.json({ success: true, lead: lead.toJSON ? lead.toJSON() : lead, message: 'No changes were applied.' });
    }

    metadata.lastUpdatedAt = nowIso;
    metadata.lastUpdatedBy = req.user?.id || null;
    lead.metadata = metadata;
    lead.changed('metadata', true); // Force Sequelize to recognize JSON change
    await lead.save();

    const leadData = lead.toJSON ? lead.toJSON() : lead;
    return res.json({ success: true, lead: leadData });
  } catch (error) {
    console.error('updateLead error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update lead. Please try again.' });
  }
};
