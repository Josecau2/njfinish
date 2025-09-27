const DEFAULT_MIN_LENGTH = 12;

const MIN_LENGTH = (() => {
  const raw = process.env.PASSWORD_MIN_LENGTH;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed >= 10) {
      return parsed;
    }
  }
  return DEFAULT_MIN_LENGTH;
})();

const complexityChecks = [
  { regex: /[a-z]/, message: 'at least one lowercase letter' },
  { regex: /[A-Z]/, message: 'at least one uppercase letter' },
  { regex: /[0-9]/, message: 'at least one number' },
  { regex: /[^A-Za-z0-9]/, message: 'at least one symbol' }
];

const passwordPolicyHint = () => `Password must be at least ${MIN_LENGTH} characters long and include uppercase, lowercase, number, and symbol characters.`;

function validatePassword(password) {
  const candidate = typeof password === 'string' ? password : '';
  const normalized = candidate.trim();

  if (!normalized) {
    return { valid: false, message: 'Password is required.' };
  }

  if (normalized.length < MIN_LENGTH) {
    return { valid: false, message: `Password must be at least ${MIN_LENGTH} characters long.` };
  }

  for (const rule of complexityChecks) {
    if (!rule.regex.test(candidate)) {
      return { valid: false, message: `Password must include ${rule.message}.` };
    }
  }

  return { valid: true };
}

module.exports = {
  MIN_LENGTH,
  validatePassword,
  passwordPolicyHint,
};
