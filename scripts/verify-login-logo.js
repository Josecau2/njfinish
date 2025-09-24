const fs = require('fs');
const path = require('path');
const { LOGIN_CUSTOMIZATION } = require('../frontend/src/config/loginCustomization');

const logoPath = LOGIN_CUSTOMIZATION.logo || '';
if (!logoPath) {
  console.error('Login customization logo is blank.');
  process.exit(1);
}

const resolveStaticPath = (relative) => {
  const trimmed = relative.replace(/^\/+/, '');
  return path.join(__dirname, '..', trimmed);
};

let absolute;
if (logoPath.startsWith('/assets/')) {
  absolute = resolveStaticPath(path.join('frontend', 'public', logoPath));
} else if (logoPath.startsWith('/uploads/')) {
  absolute = resolveStaticPath(logoPath);
} else {
  absolute = resolveStaticPath(path.join('frontend', 'public', logoPath));
}

if (!fs.existsSync(absolute)) {
  console.error(`Resolved logo path does not exist: ${absolute}`);
  process.exit(2);
}

console.log('Login logo resolved to:', logoPath);
console.log('Absolute file exists at:', absolute);
