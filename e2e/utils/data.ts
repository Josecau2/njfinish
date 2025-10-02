export const uniqueId = (prefix = 'auto') => {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

export const uniqueEmail = (prefix = 'user') => {
  return `${uniqueId(prefix)}@example.com`.toLowerCase();
};

export const randomPhone = (prefix = '555') => {
  const random = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${random}`;
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));