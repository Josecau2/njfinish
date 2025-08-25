# Permission System Documentation

## Overview
This permission system extends the existing role-based authentication to support module-based permissions for contractor groups while maintaining backward compatibility with existing user roles.

## Permission Keys
The system introduces granular permission keys aligned with module toggles:

### Module Permissions
- **contractors:read** - Access contractor dashboard
- **proposals:read** - View proposals
- **proposals:create** - Create new proposals  
- **proposals:update** - Edit existing proposals
- **proposals:accept** - Accept/approve proposals
- **customers:read** - View customers
- **customers:create** - Create new customers
- **customers:update** - Edit existing customers  
- **resources:read** - View resources

## Group Types

### Standard Groups (Existing Behavior)
- Get all permissions by default
- No module toggles
- Maintains existing functionality

### Contractor Groups (New)
- Permissions based on module toggles
- Four modules: dashboard, proposals, customers, resources
- Each enabled module grants specific permissions

## Module to Permission Mapping

### Dashboard Module
When enabled grants:
- `contractors:read`

### Proposals Module  
When enabled grants:
- `proposals:read`
- `proposals:create`
- `proposals:update` 
- `proposals:accept`

### Customers Module
When enabled grants:
- `customers:read`
- `customers:create`
- `customers:update`

### Resources Module
When enabled grants:
- `resources:read`

## File Structure

```
constants/
  permissions.js          # Permission constants and utility functions
middleware/
  permissions.js          # Permission check middleware
utils/
  permissionDemo.js       # Demonstration utility
```

## Usage Examples

### Backend Route Protection
```javascript
const { verifyToken } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

// Protect a route with specific permission
router.get('/proposals', 
  verifyToken, 
  requirePermission(PERMISSIONS.PROPOSALS.READ), 
  proposalsController.fetch
);

// Multiple permission options (any one required)
router.post('/customers', 
  verifyToken, 
  requireAnyPermission([PERMISSIONS.CUSTOMERS.CREATE]), 
  customerController.add
);
```

### Frontend Permission Checks
```javascript
// User permissions are included in API responses
const userGroup = {
  id: 1,
  name: "Contractors",
  group_type: "contractor", 
  modules: {
    dashboard: true,
    proposals: true,
    customers: false,
    resources: true
  },
  permissions: [
    "contractors:read",
    "proposals:read", 
    "proposals:create",
    "proposals:update",
    "proposals:accept",
    "resources:read"
  ]
};

// Check permissions in components
const canCreateProposals = userGroup.permissions.includes('proposals:create');
const canViewCustomers = userGroup.permissions.includes('customers:read');
```

## Database Schema

### UserGroup Model Extensions
```sql
ALTER TABLE user_groups 
ADD COLUMN group_type ENUM('standard', 'contractor') DEFAULT 'standard',
ADD COLUMN modules JSON DEFAULT NULL;
```

### Example Module Data
```json
{
  "dashboard": true,
  "proposals": true, 
  "customers": false,
  "resources": true
}
```

## Backward Compatibility

### Existing Roles
- **Admin** - Gets all permissions
- **Manufacturers** - Gets all permissions  
- **User** - Gets standard group permissions

### Existing Groups
- Groups without `group_type` default to "standard"
- Standard groups get all permissions (existing behavior)
- No changes to current functionality

## API Responses

User group endpoints now include computed permissions:

```json
{
  "id": 1,
  "name": "Contractors",
  "group_type": "contractor",
  "modules": {
    "dashboard": true,
    "proposals": true,
    "customers": false, 
    "resources": true
  },
  "permissions": [
    "contractors:read",
    "proposals:read",
    "proposals:create", 
    "proposals:update",
    "proposals:accept",
    "resources:read"
  ]
}
```

## Testing

Run the demonstration utility to see the permission system in action:

```bash
node utils/permissionDemo.js
```

This will show:
- Permission mappings for different module combinations
- Example usage scenarios
- Middleware usage examples

## Implementation Status

### ✅ Completed
- Permission constants definition
- Module to permission mapping logic
- Permission middleware for route protection
- UserGroup controller updates with permission computation
- Backward compatibility with existing roles
- Documentation and examples

### 🚧 Not Implemented (By Design)
- Actual permission enforcement in routes (to be added later)
- Frontend permission-based UI hiding (to be added later)
- Database migration execution (prepared but not run)

## Notes

- This system is designed to be additive - no existing functionality is broken
- Permission enforcement logic can be added incrementally to routes
- Frontend can use the permissions array for conditional rendering
- The system is extensible for future permission types
