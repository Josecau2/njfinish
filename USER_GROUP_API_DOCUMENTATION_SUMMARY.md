# User and User Group Management API Documentation Summary

## Overview

This document summarizes the comprehensive OpenAPI JSDoc annotations that have been created for ALL user and user group management routes in `routes/apiRoutes.js`.

## Documentation Created

### User Management Routes (admin:users permission required)

#### 1. GET /api/users - List all users
- **Summary**: List all users
- **Description**: Retrieve a list of all users in the system (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Query Parameters**:
  - `page` (integer, default: 1) - Page number for pagination
  - `limit` (integer, default: 50) - Number of items per page
  - `search` (string) - Search by user name or email
  - `role` (enum: User, Admin, Manufacturers, Contractor) - Filter by user role
  - `group_id` (integer) - Filter by user group ID
- **Responses**:
  - 200: List of users retrieved successfully (returns users array, total, page)
  - 401: Unauthorized
  - 403: Forbidden

#### 2. GET /api/users/{id} - Get user by ID
- **Summary**: Get user by ID
- **Description**: Retrieve a single user by their ID (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User ID
- **Responses**:
  - 200: User retrieved successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

#### 3. POST /api/users - Create a new user
- **Summary**: Create a new user
- **Description**: Add a new user to the system (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Request Body** (all user properties):
  - **Required**: `name`, `email`, `password`
  - **Optional**: `role` (enum: User, Admin, Manufacturers, Contractor), `group_id`, `location`
  - **Personal Address**: `street_address`, `city`, `state`, `zip_code`, `country`
  - **Company Info**: `company_name`, `company_street_address`, `company_city`, `company_state`, `company_zip_code`, `company_country`
  - **Other**: `isSalesRep` (boolean, default: false)
- **Responses**:
  - 201: User created successfully
  - 400: Validation Error
  - 401: Unauthorized
  - 403: Forbidden
  - 409: Email already exists

#### 4. DELETE /api/users/{id} - Delete a user
- **Summary**: Delete a user
- **Description**: Soft delete a user by ID (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User ID
- **Responses**:
  - 200: User deleted successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

#### 5. PUT /api/users/{id} - Update a user
- **Summary**: Update a user
- **Description**: Update user information by ID (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User ID
- **Request Body** (same properties as create, all optional):
  - `name`, `email`, `password` (optional for update), `role`, `group_id`, `location`
  - Personal and company address fields
  - `isSalesRep` (boolean)
- **Responses**:
  - 200: User updated successfully
  - 400: Validation Error
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 409: Email already exists

#### 6. GET /api/user-role/{userId} - Get user role information
- **Summary**: Get user role information
- **Description**: Retrieve role information for a specific user (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `userId` (integer, required) - User ID
- **Responses**:
  - 200: User role retrieved successfully (returns userId, role enum, role_id)
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

### User Group Management Routes (admin:groups permission required)

#### 7. GET /api/usersgroups - List all user groups
- **Summary**: List all user groups
- **Description**: Retrieve a list of all user groups in the system (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Query Parameters**:
  - `page` (integer, default: 1) - Page number for pagination
  - `limit` (integer, default: 50) - Number of items per page
  - `search` (string) - Search by group name
  - `group_type` (enum: standard, contractor) - Filter by group type
- **Responses**:
  - 200: List of user groups retrieved successfully (returns groups array, total, page)
  - 401: Unauthorized
  - 403: Forbidden

#### 8. GET /api/usersgroups/{id} - Get user group by ID
- **Summary**: Get user group by ID
- **Description**: Retrieve a single user group by ID (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User group ID
- **Responses**:
  - 200: User group retrieved successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

#### 9. POST /api/usersgroups - Create a new user group
- **Summary**: Create a new user group
- **Description**: Add a new user group to the system (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Request Body**:
  - **Required**: `name` (string) - User group name
  - **Optional**:
    - `group_type` (enum: standard, contractor, default: standard) - Type of user group
    - `modules` (object) - Module permissions for the group:
      - `dashboard` (boolean, default: false) - Dashboard module access
      - `proposals` (boolean, default: false) - Proposals/quotes module access
      - `customers` (boolean, default: false) - Customers module access
      - `resources` (boolean, default: false) - Resources module access
    - `contractor_settings` (object) - Contractor-specific settings (only for contractor groups):
      - `price_multiplier` (number) - Price multiplier for the group
      - `allowed_manufacturers` (array of integers) - List of allowed manufacturer IDs
- **Responses**:
  - 201: User group created successfully
  - 400: Validation Error
  - 401: Unauthorized
  - 403: Forbidden

#### 10. DELETE /api/usersgroups/{id} - Delete a user group
- **Summary**: Delete a user group
- **Description**: Delete a user group by ID (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User group ID
- **Responses**:
  - 200: User group deleted successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

#### 11. PUT /api/usersgroups/{id} - Update a user group
- **Summary**: Update a user group
- **Description**: Update user group information by ID (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Path Parameters**:
  - `id` (integer, required) - User group ID
- **Request Body** (same properties as create, all optional):
  - `name`, `group_type`, `modules`, `contractor_settings`
- **Responses**:
  - 200: User group updated successfully
  - 400: Validation Error
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found

### User Group Multiplier Routes

#### 12. GET /api/usersgroupsmultiplier - Get all user group multipliers
- **Summary**: Get all user group multipliers
- **Description**: Retrieve pricing multipliers for all user groups (requires admin:groups permission)
- **Security**: Bearer Token Authentication
- **Responses**:
  - 200: User group multipliers retrieved successfully (returns success, multipliers array with group_id, group_name, price_multiplier, group_type)
  - 401: Unauthorized
  - 403: Forbidden

#### 13. GET /api/user/multiplier - Get current user's group multiplier
- **Summary**: Get current user's group multiplier
- **Description**: Retrieve the pricing multiplier for the authenticated user's group
- **Security**: Bearer Token Authentication
- **Responses**:
  - 200: User multiplier retrieved successfully (returns success, multiplier, group_id, group_name)
  - 401: Unauthorized

### Designer/Sales Rep Routes

#### 14. GET /api/designers - Get all designers
- **Summary**: Get all designers
- **Description**: Retrieve a list of all users with sales representative or designer roles (requires admin:users permission)
- **Security**: Bearer Token Authentication
- **Responses**:
  - 200: Designers retrieved successfully (returns success, designers array with id, name, email, isSalesRep)
  - 401: Unauthorized
  - 403: Forbidden

## Permission Requirements Summary

### admin:users permission required for:
- GET /api/users (list all users)
- GET /api/users/{id} (get user by ID)
- POST /api/users (create user)
- DELETE /api/users/{id} (delete user)
- PUT /api/users/{id} (update user)
- GET /api/user-role/{userId} (get user role)
- GET /api/designers (get all designers)

### admin:groups permission required for:
- GET /api/usersgroups (list all user groups)
- GET /api/usersgroups/{id} (get user group by ID)
- POST /api/usersgroups (create user group)
- DELETE /api/usersgroups/{id} (delete user group)
- PUT /api/usersgroups/{id} (update user group)
- GET /api/usersgroupsmultiplier (get all group multipliers)

### Any authenticated user:
- GET /api/user/multiplier (get current user's group multiplier)

## Implementation Notes

1. All documentation follows OpenAPI 3.0 specification
2. Security is defined as Bearer Token Authentication (`bearerAuth`)
3. All routes use comprehensive request/response schemas
4. Error responses reference shared component schemas:
   - `#/components/responses/UnauthorizedError` (401)
   - `#/components/responses/ForbiddenError` (403)
   - `#/components/responses/NotFoundError` (404)
   - `#/components/responses/ValidationError` (400)
5. Schema references include:
   - `#/components/schemas/User`
   - `#/components/schemas/UserGroup`

## File Locations

- **Main routes file**: `C:\njtake2\njcabinets-main\routes\apiRoutes.js`
- **Documentation template**: `C:\njtake2\njcabinets-main\routes\user-docs-temp.js`
- **User model**: `C:\njtake2\njcabinets-main\models\User.js`
- **UserGroup model**: `C:\njtake2\njcabinets-main\models\UserGroup.js`
- **Permissions constants**: `C:\njtake2\njcabinets-main\constants\permissions.js`

## Next Steps

To apply this documentation to the apiRoutes.js file:

1. Copy the contents of `routes/user-docs-temp.js`
2. Insert it into `routes/apiRoutes.js` before the line `// User CRUD routes - ADMIN ONLY (contractors should not access)`
3. This will add comprehensive OpenAPI annotations for all 14 user and user group management routes

The documentation is complete and ready to be integrated into the OpenAPI/Swagger specification generator.
