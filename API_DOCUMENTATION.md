# NJCabinets API Documentation

## Overview

This document describes the NJCabinets API documentation system and how to use the MCP (Model Context Protocol) server to enable AI assistants to interact with the API.

## API Documentation Access

### Swagger UI (Interactive Documentation)

⚠️ **IMPORTANT: API documentation requires admin authentication**

Access the interactive API documentation at:

```
http://localhost:8080/api-docs
```

**Authentication Required:**
- You must be logged in as an **admin user**
- Include your JWT token in the Authorization header
- Use the "Authorize" button in Swagger UI to add your token
- Non-admin users will receive a 403 Forbidden error

Features:
- Browse all available endpoints organized by tags
- View request/response schemas
- Test API endpoints directly from the browser (once authenticated)
- See authentication requirements for each endpoint

### OpenAPI Specification (JSON)

⚠️ **IMPORTANT: Requires admin authentication**

The machine-readable OpenAPI 3.0 specification is available at:

```
http://localhost:8080/api-docs.json
```

**Authentication Required:**
- Must include valid JWT token with `Authorization: Bearer TOKEN` header
- Must be an admin user
- This endpoint is protected to prevent unauthorized access to API structure

This JSON file can be used by:
- API client generators
- Testing tools
- MCP servers (with admin token)
- Documentation generators

## API Overview

### Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://app.nj.contractors`

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To obtain a token, use the `/api/auth/login` endpoint.

### API Endpoints by Category

#### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/logout` - Logout and invalidate token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/token` - Issue API token for programmatic access

#### Users
- `GET /api/me` - Get current user profile
- `PUT /api/me` - Update current user profile

#### Customers
- `GET /api/customers` - List all customers (with pagination and search)
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers/add` - Create a new customer
- `PUT /api/customers/update/:id` - Update customer information
- `DELETE /api/customers/delete/:id` - Delete a customer

#### Manufacturers
- `GET /api/manufacturers` - List all manufacturers
- `GET /api/manufacturers/:id` - Get manufacturer by ID
- `POST /api/manufacturers/create` - Create a new manufacturer (admin only)
- `PUT /api/manufacturers/:id/update` - Update manufacturer (admin only)
- `PUT /api/manufacturers/status/:id` - Update manufacturer status (admin only)

## MCP Server Setup

The MCP (Model Context Protocol) server allows AI assistants like Claude to interact with your API programmatically.

### Prerequisites

- Node.js installed
- NJCabinets backend server running (`npm run dev`)
- `@openapi-mcp/server` package installed globally (already done)

### Configuration

#### 1. Set Environment Variables

Create a `.env.mcp` file or set these environment variables:

```bash
# API base URL (use your actual server URL)
API_BASE_URL=http://localhost:8080

# JWT token for authentication (optional, but required for most endpoints)
# Obtain this by logging in via /api/auth/login
API_TOKEN=your_jwt_token_here
```

#### 2. Run the MCP Server

##### Option A: Standalone Execution

```bash
# Set environment variables and run
API_BASE_URL=http://localhost:8080 API_TOKEN=your_token node mcp-server.js
```

##### Option B: Add to Claude Desktop Configuration

Add the MCP server to your Claude Desktop `claude_desktop_config.json`:

**Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Configuration:**

```json
{
  "mcpServers": {
    "njcabinets-api": {
      "command": "node",
      "args": ["C:\\njtake2\\njcabinets-main\\mcp-server.js"],
      "env": {
        "API_BASE_URL": "http://localhost:8080",
        "API_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

Replace the path with your actual project path.

##### Option C: Use with npm script

Add to `package.json`:

```json
{
  "scripts": {
    "mcp:server": "node mcp-server.js"
  }
}
```

Then run:

```bash
API_BASE_URL=http://localhost:8080 API_TOKEN=your_token npm run mcp:server
```

### Getting an API Token

1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Login via API:
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your_email@example.com","password":"your_password"}'
   ```

3. Copy the `token` from the response and use it as `API_TOKEN`.

### Testing the MCP Server

Once configured in Claude Desktop, you can ask Claude to:

- "List all customers"
- "Get manufacturer details for ID 1"
- "Create a new customer with name John Doe and email john@example.com"
- "Update customer 5 with new phone number"

Claude will automatically use the MCP server to make API calls.

### MCP Server Features

- **Automatic Tool Generation**: All API endpoints are automatically exposed as tools
- **Type Safety**: Request/response schemas are validated against OpenAPI spec
- **Authentication**: JWT tokens are automatically included in requests
- **Error Handling**: API errors are properly reported to the AI assistant
- **Pagination Support**: Handles paginated endpoints automatically

## Adding New Endpoints to Documentation

To document new API endpoints:

1. **Add JSDoc annotations** to your route files (e.g., `routes/apiRoutes.js`):

```javascript
/**
 * @openapi
 * /api/example/{id}:
 *   get:
 *     tags:
 *       - Examples
 *     summary: Get example by ID
 *     description: Retrieve a single example resource
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Example ID
 *     responses:
 *       200:
 *         description: Example retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/example/:id', verifyTokenWithGroup, exampleController.getById);
```

2. **Restart the server** to regenerate the OpenAPI spec:
   ```bash
   npm run dev
   ```

3. **Verify in Swagger UI**: Visit `http://localhost:8080/api-docs` to see your new endpoint.

4. **MCP server automatically picks up changes** by fetching the updated OpenAPI spec.

## Extending the OpenAPI Configuration

Edit `config/swagger.js` to:

- Add new component schemas
- Define reusable response templates
- Add security schemes
- Configure servers and base URLs

## Troubleshooting

### Swagger UI shows no endpoints

- Check that route files are included in `apis` array in `config/swagger.js`
- Ensure JSDoc comments use `@openapi` tag (not `@swagger`)
- Restart the server after adding annotations

### MCP Server connection fails

- Verify backend server is running: `curl http://localhost:8080/api-docs.json`
- Check `API_BASE_URL` matches your server address
- Ensure `API_TOKEN` is valid (tokens may expire)
- Look for errors in Claude Desktop logs

### Authentication errors

- Verify JWT token is still valid (tokens expire after 8 hours by default)
- Check token has correct permissions for the endpoint
- Ensure `Authorization` header is properly formatted

## Production Deployment

For production:

1. **Update server URL** in `config/swagger.js`:
   ```javascript
   servers: [
     {
       url: 'https://app.nj.contractors',
       description: 'Production Server',
     },
   ],
   ```

2. **Secure API documentation** by adding authentication middleware to `/api-docs` route

3. **Use environment-specific tokens** for MCP server

4. **Enable CORS** for documentation endpoints if accessing from different domains

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
