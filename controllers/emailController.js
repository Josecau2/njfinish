const { getPuppeteer } = require('../utils/puppeteerLauncher');

require('dotenv').config();
const { sanitizeHtml } = require('../utils/htmlSanitizer');

// Nodemailer transporter
const { sendMail } = require('../utils/mail');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT_LENGTH = 160;

const sanitizeSubject = (value) => {
  if (!value) return 'Your Proposal';
  const cleaned = sanitizeHtml(String(value), {
    allowedTags: [],
    allowedAttributes: {},
    allowDataAttributes: false,
  })
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Your Proposal';
  return cleaned.slice(0, MAX_SUBJECT_LENGTH);
};

const sanitizeFilename = (value) => {
  const fallback = 'Proposal.pdf';
  if (!value) return fallback;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;
  const safe = trimmed.replace(/[^a-z0-9_\-.]+/gi, '_');
  if (!safe.toLowerCase().endsWith('.pdf')) {
    return `${safe}.pdf`;
  }
  return safe;
};

exports.sendProposalEmail = async (req, res) => {
  try {
    const {
      email,
      body,
      htmlContent,
      noSend,
      subject: incomingSubject,
      attachmentFilename,
    } = req.body || {};

    const recipient = typeof email === 'string' ? email.trim() : '';
    if (!recipient || recipient.length > 320 || !EMAIL_REGEX.test(recipient)) {
      return res.status(400).json({ success: false, error: 'A valid recipient email is required.' });
    }

    const trimmedHtml = typeof htmlContent === 'string' ? htmlContent.trim() : '';
    if (!trimmedHtml || trimmedHtml.length < 100) {
      return res.status(400).json({ success: false, error: 'Invalid or empty htmlContent received' });
    }

    const sanitizedHtml = sanitizeHtml(trimmedHtml, { allowIframes: false });
    const sanitizedBody = body ? sanitizeHtml(String(body)) : '';

    const { puppeteer, launchOptions } = getPuppeteer();
    const browser = await puppeteer.launch(launchOptions);
    let page;
    let pdfBuffer;
    try {
      page = await browser.newPage();

      const allowedHosts = new Set();
      const appendHost = (value) => {
        if (!value) return;
        const trimmed = String(value).trim();
        if (!trimmed) return;
        try {
          const parsed = new URL(trimmed);
          if (parsed.hostname) {
            allowedHosts.add(parsed.hostname);
            return;
          }
        } catch (_) {
          // ignore, fall through to raw host handling below
        }
        allowedHosts.add(trimmed.replace(/^https?:\/\//, ''));
      };

      appendHost(process.env.APP_URL);
      appendHost(process.env.STATIC_ASSET_URL);
      (process.env.PUPPETEER_ALLOWED_HOSTS || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach(appendHost);

      await page.setRequestInterception(true);
      const requestHandler = (request) => {
        const url = request.url();
        if (url.startsWith('data:') || url.startsWith('about:')) {
          return request.continue();
        }

        let parsed;
        try {
          parsed = new URL(url);
        } catch (_) {
          return request.abort();
        }

        if (parsed.protocol !== 'https:') {
          return request.abort();
        }

        if (allowedHosts.size && !allowedHosts.has(parsed.hostname)) {
          return request.abort();
        }

        if (!['GET', 'HEAD'].includes(request.method())) {
          return request.abort();
        }

        if (request.isNavigationRequest() && request.frame() === page.mainFrame() && parsed.origin !== 'about:blank') {
          return request.abort();
        }

        return request.continue();
      };

      page.on('request', requestHandler);

      await page.setContent(sanitizedHtml, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });
    } finally {
      if (page) {
        page.removeAllListeners('request');
      }
      await browser.close().catch(() => {});
    }

    let pdfBytes = 0;
    if (Buffer.isBuffer(pdfBuffer)) {
      pdfBytes = pdfBuffer.length;
    } else if (pdfBuffer && typeof pdfBuffer.byteLength === 'number') {
      pdfBytes = pdfBuffer.byteLength;
    } else if (pdfBuffer && typeof pdfBuffer.length === 'number') {
      pdfBytes = pdfBuffer.length;
    }

    if (process.env.DEBUG_EMAIL_PDF === '1') {
      try {
        console.error(`[EMAIL PDF] Incoming htmlContent length=${trimmedHtml.length}`);
        console.error(`[EMAIL PDF] Generated pdfBytes=${pdfBytes}`);
      } catch (_) {}
    }

    if (noSend || process.env.EMAIL_DRY_RUN === '1') {
      return res.status(200).json({ success: true, message: 'PDF generated (email skipped)', skippedSend: true, pdfBytes });
    }

    const subject = sanitizeSubject(incomingSubject);
    const filename = sanitizeFilename(attachmentFilename);

    await sendMail({
      to: recipient,
      subject,
      html: sanitizedBody || '<p>Please see the attached proposal.</p>',
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully', pdfBytes });
  } catch (error) {
    console.error('Error sending proposal email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
};
