const deepClone = (value) => JSON.parse(JSON.stringify(value));

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const envSmtpPort = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587;
const envSmtpSecure = process.env.SMTP_SECURE !== undefined ? parseBoolean(process.env.SMTP_SECURE, false) : false;

const REQUEST_ACCESS_BENEFITS = [
  'Generate accurate cabinet quotes in minutes',
  'Submit and track orders from one dashboard',
  'Collaborate directly with our support specialists'
];

const LOGIN_CUSTOMIZATION_DEFAULTS = {
  logo: '',
  title: 'Sign In',
  subtitle: 'Enter your email and password to sign in!',
  backgroundColor: '#0e1446',
  showForgotPassword: true,
  showKeepLoggedIn: true,
  rightTitle: 'See Your Cabinet Price in Seconds!',
  rightSubtitle: 'CABINET PORTAL',
  rightTagline: 'Dealer Portal',
  rightDescription: 'Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.',
  logoHeight: 60,
  requestAccessTitle: 'Request Access',
  requestAccessSubtitle: 'Interested in partnering with NJ Cabinets?',
  requestAccessDescription: 'Tell us a bit about your business and we\'ll follow up with onboarding details.',
  requestAccessBenefits: REQUEST_ACCESS_BENEFITS,
  requestAccessSuccessMessage: "Thank you! We've received your request and will be in touch soon.",
  requestAccessAdminSubject: 'New Access Request Submitted',
  requestAccessAdminBody: 'You have a new access request from {{name}} ({{email}}).{{companyLine}}{{phoneLine}}{{locationLine}}{{messageBlock}}',
  requestAccessLeadSubject: 'We received your request',
  requestAccessLeadBody: 'Hi {{firstName}},\n\nThank you for your interest in the NJ Cabinets platform. Our team will review your request and reach out shortly with next steps.\n\nIf you have immediate questions, simply reply to this email.\n\n— The NJ Cabinets Team',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: envSmtpPort,
  smtpSecure: envSmtpSecure,
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || process.env.SMTP_USER || ''
};

const cloneLoginCustomizationDefaults = () => deepClone(LOGIN_CUSTOMIZATION_DEFAULTS);

module.exports = {
  REQUEST_ACCESS_BENEFITS,
  LOGIN_CUSTOMIZATION_DEFAULTS,
  cloneLoginCustomizationDefaults
};



