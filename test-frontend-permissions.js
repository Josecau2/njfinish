// Simulate frontend permission checking with both admin users

const workingAdminData = {
  "userId": 1,
  "name": "Jose Fleitas",
  "role": "Admin",
  "role_id": 2,
  "group_id": 1,
  "group": {
    "id": 1,
    "name": "Admin",
    "group_type": "standard",
    "modules": "{\"dashboard\":true,\"proposals\":true,\"customers\":true,\"resources\":true}"
  }
};

const brokenAdminData = {
  "userId": 30,
  "name": "Jose Fleitas",
  "role": "Admin",
  "role_id": 2,
  "group_id": 1,
  "group": {
    "id": 1,
    "name": "Admin",
    "group_type": "standard",
    "modules": "{\"dashboard\":true,\"proposals\":true,\"customers\":true,\"resources\":true}"
  }
};

// Copy the frontend permission functions exactly
const isAdmin = (user) => {
  if (!user || !user.role) return false;
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
  return role === 'admin' || role === 'super_admin';
};

const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // ADMIN USERS HAVE ACCESS TO EVERYTHING - NO RESTRICTIONS
  if (isAdmin(user)) {
    return true;
  }
  
  // Other logic would be here for non-admins...
  return false;
};

const hasModuleAccess = (user, module) => {
  // ADMIN USERS HAVE ACCESS TO ALL MODULES
  if (isAdmin(user)) return true;
  
  // Other logic would be here...
  return false;
};

console.log('🧪 Frontend Permission Testing\n');

console.log('WORKING ADMIN (joseca@symmetricalwolf.com):');
console.log('  User ID:', workingAdminData.userId);
console.log('  Role:', workingAdminData.role);
console.log('  isAdmin():', isAdmin(workingAdminData));
console.log('  hasPermission("customers:read"):', hasPermission(workingAdminData, 'customers:read'));
console.log('  hasPermission("settings:users"):', hasPermission(workingAdminData, 'settings:users'));
console.log('  hasModuleAccess("dashboard"):', hasModuleAccess(workingAdminData, 'dashboard'));
console.log('  hasModuleAccess("proposals"):', hasModuleAccess(workingAdminData, 'proposals'));

console.log('\nBROKEN ADMIN (joseca@swolfai.com):');
console.log('  User ID:', brokenAdminData.userId);
console.log('  Role:', brokenAdminData.role);
console.log('  isAdmin():', isAdmin(brokenAdminData));
console.log('  hasPermission("customers:read"):', hasPermission(brokenAdminData, 'customers:read'));
console.log('  hasPermission("settings:users"):', hasPermission(brokenAdminData, 'settings:users'));
console.log('  hasModuleAccess("dashboard"):', hasModuleAccess(brokenAdminData, 'dashboard'));
console.log('  hasModuleAccess("proposals"):', hasModuleAccess(brokenAdminData, 'proposals'));

console.log('\n🔍 Detailed Inspection:');
console.log('Working admin role type:', typeof workingAdminData.role);
console.log('Working admin role value:', workingAdminData.role);
console.log('Working admin role.toLowerCase():', workingAdminData.role.toLowerCase());

console.log('Broken admin role type:', typeof brokenAdminData.role);
console.log('Broken admin role value:', brokenAdminData.role);
console.log('Broken admin role.toLowerCase():', brokenAdminData.role.toLowerCase());

// Check if there are any hidden characters or encoding issues
console.log('Working admin role charCodes:', [...workingAdminData.role].map(c => c.charCodeAt(0)));
console.log('Broken admin role charCodes:', [...brokenAdminData.role].map(c => c.charCodeAt(0)));

console.log('\nBoth should be identical and both should return true for isAdmin()');
