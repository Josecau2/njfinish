# Data Model Extensions Migration Summary

## Migration Status: ✅ COMPLETED SUCCESSFULLY

**Executed on:** August 20, 2025  
**Migration Files:** 
- `migrate-data-model-extensions.js`
- `verify-migration-prerequisites.js`

## Database Changes Applied

### 1. User Groups Table Extensions
✅ **Table:** `user_groups`
- `group_type` - ENUM('standard', 'contractor') DEFAULT 'standard' 
- `modules` - JSON field for module toggles
- `contractor_settings` - JSON field for future contractor defaults (price_multiplier, allowed manufacturers)

### 2. Customers Table Extensions  
✅ **Table:** `customers`
- `group_id` - Foreign key to user_groups (owning contractor group)
- `created_by_user_id` - Foreign key to users (who created the customer)
- `phone` - Primary phone number field
- `deleted_at` - Soft delete timestamp
- **Indexes Added:**
  - `idx_customers_group_id` on (group_id)
  - `idx_customers_created_by` on (created_by_user_id)  
  - `idx_customers_group_name` on (group_id, name)

### 3. Proposals Table Extensions
✅ **Table:** `proposals`
- `owner_group_id` - Foreign key to user_groups (owning contractor/admin group)
- `accepted_at` - Timestamp when proposal was accepted
- `accepted_by` - User ID or external signer name who accepted
- `is_locked` - Boolean to lock prices after acceptance
- **Status Enum Extended:** Added 'draft', 'sent', 'accepted', 'rejected', 'expired' while preserving existing values
- **Indexes Added:**
  - `idx_proposals_owner_group` on (owner_group_id)
  - `idx_proposals_owner_status` on (owner_group_id, status)

### 4. Notifications Table Created
✅ **Table:** `notifications` (NEW)
- `id` - Primary key
- `recipient_user_id` - Foreign key to users
- `type` - Notification type string
- `payload` - JSON field for additional data
- `read_at` - Timestamp when read (nullable)
- `created_at`, `updated_at` - Standard timestamps
- **Indexes Added:**
  - `idx_notifications_recipient_read` on (recipient_user_id, read_at)
  - `idx_notifications_type` on (type)
  - `idx_notifications_created_at` on (created_at)

## Data Migration & Backward Compatibility

### ✅ Existing Data Preserved
- **User Groups:** 2 records preserved
- **Customers:** 1 record preserved  
- **Proposals:** 8 records preserved
- **Users:** 3 records preserved

### ✅ Backward Compatibility Applied
1. **Proposals Status Mapping:** Existing status values mapped to new standardized enum
2. **Default Ownership:** All existing proposals assigned to admin group (ID: 1)
3. **Accepted Timestamps:** Proposals with 'accepted' status got `accepted_at` set to their `updatedAt` value
4. **Foreign Keys:** All nullable to avoid breaking existing data

## Model Updates Applied

### ✅ Sequelize Models Updated
- **UserGroup.js** - Added contractor_settings field
- **Customer.js** - Added group_id, created_by_user_id, phone, deleted_at with soft delete support
- **Proposals.js** - Added owner_group_id, accepted_at, accepted_by, is_locked with extended status enum
- **Notification.js** - New model created
- **index.js** - Added associations and exported Notification model

### ✅ New Associations Created
```javascript
// User Groups can own customers and proposals
UserGroup.hasMany(Customer, { foreignKey: 'group_id', as: 'customers' });
UserGroup.hasMany(Proposals, { foreignKey: 'owner_group_id', as: 'proposals' });

// Customers belong to groups and have creators
Customer.belongsTo(UserGroup, { foreignKey: 'group_id', as: 'group' });
Customer.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'createdBy' });

// Proposals belong to owner groups
Proposals.belongsTo(UserGroup, { foreignKey: 'owner_group_id', as: 'ownerGroup' });

// Users can create customers and receive notifications
User.hasMany(Customer, { foreignKey: 'created_by_user_id', as: 'createdCustomers' });
User.hasMany(Notification, { foreignKey: 'recipient_user_id', as: 'notifications' });

// Notifications belong to users
Notification.belongsTo(User, { foreignKey: 'recipient_user_id', as: 'recipient' });
```

## Permission System Integration

### ✅ Permission Constants Ready
- Permission system from previous step fully compatible
- Module toggles map to permission sets
- Contractor groups get permissions based on enabled modules

### ✅ Enhanced API Responses
User group endpoints now return computed permissions based on module toggles:
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
  "contractor_settings": null,
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

## New Capabilities Enabled

### 🎯 Scoping & Ownership
- Customers can be owned by specific contractor groups
- Proposals can be owned by contractor or admin groups
- User groups support contractor type with module-based permissions

### 🎯 Enhanced Proposal Workflow
- New standardized status flow: draft → sent → accepted/rejected/expired
- Acceptance tracking with timestamps and signer information
- Price locking after acceptance
- Backward compatibility with existing status values

### 🎯 Notifications Infrastructure
- System ready for real-time notifications
- User-specific notification delivery
- JSON payload support for rich notification data
- Read/unread tracking

### 🎯 Audit Trail Support
- Customer creation tracking (who created each customer)
- Soft delete support for customers
- Proposal ownership and acceptance audit trail

## Next Steps

### 🔄 Ready for Implementation
1. **Frontend UI Updates** - Use new fields in customer/proposal forms
2. **Permission Enforcement** - Apply permission middleware to routes
3. **Notification System** - Implement notification creation and delivery
4. **Scoped Data Access** - Filter data by group ownership

### 🔄 No Breaking Changes
- All existing API endpoints continue to work
- Frontend can progressively adopt new features
- Database queries remain compatible

## Verification Commands

```bash
# Test the migration completed successfully
node verify-migration-prerequisites.js

# Test permission system
node utils/permissionDemo.js

# Check database structure
mysql -u root -p -e "DESCRIBE njcabinets_db.user_groups;"
mysql -u root -p -e "DESCRIBE njcabinets_db.customers;" 
mysql -u root -p -e "DESCRIBE njcabinets_db.proposals;"
mysql -u root -p -e "DESCRIBE njcabinets_db.notifications;"
```

---

✅ **STEP 4 COMPLETED**: Data model extensions with migrations applied successfully. All new fields are visible to ORM and no data was lost. The system now supports scoping, customer ownership, enhanced proposals, and notifications while maintaining full backward compatibility.
