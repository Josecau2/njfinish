# MCP Servers Setup for NJ Cabinets

All MCP servers have been installed globally and configured in `.claude/mcp.json`.

## 🎉 Installed MCP Servers

### ✅ IMMEDIATE VALUE (Installed)

1. **Filesystem MCP** - `@modelcontextprotocol/server-filesystem`
   - Fast file operations across your entire codebase
   - Better search and pattern matching
   - Efficient log file analysis

2. **Git MCP** - `@cyanheads/git-mcp-server`
   - Git operations: commit, branch, diff, log, status, push, pull, merge
   - No need to switch to terminal for git commands
   - Better commit message generation

3. **MySQL MCP** - `enhanced-postgres-mcp-server`
   - Direct SQL queries from Claude
   - Schema inspection
   - Data validation and test data generation
   - Connected to: `njcabinets_db`

### ✅ HIGH VALUE (Installed)

4. **Playwright MCP** - `@playwright/mcp`
   - Browser automation for UI testing
   - Screenshot generation
   - Web scraping capabilities
   - Accessibility testing integration

5. **Stripe MCP** - `@stripe/mcp`
   - Stripe payment operations
   - Customer management
   - Payment testing
   - **Pre-configured with your live Stripe key**

6. **GitHub MCP** - `@modelcontextprotocol/server-github`
   - GitHub issues and PR management
   - Repository operations
   - **⚠️ Requires GitHub Personal Access Token** (see below)

### ✅ NICE TO HAVE (Installed)

7. **Puppeteer MCP** - `@modelcontextprotocol/server-puppeteer`
   - Browser automation using Puppeteer
   - Perfect for testing your PDF generation (pdfmake + puppeteer-core)

8. **Memory MCP** - `@modelcontextprotocol/server-memory`
   - Persistent memory across sessions
   - Knowledge graph for Claude
   - Context retention

9. **Everything MCP** - `@modelcontextprotocol/server-everything`
   - Test server with all MCP features
   - Useful for debugging MCP setup

### 🎨 DESIGN SYSTEMS (Style Like a Pro!)

10. **Chakra UI MCP** - `@chakra-ui/react-mcp`
   - Access ALL Chakra UI components with props, examples, and usage patterns
   - Design tokens and theme customization guidance
   - Migration help from other frameworks to Chakra
   - Component recommendations based on your use case
   - **Perfect for your Chakra UI + Lucide stack!**

11. **Material UI MCP** - `@mui/mcp`
   - Material UI components and documentation
   - Code examples and best practices
   - Alternative design system reference
   - Great for cross-framework comparisons

### 🐛 ERROR TRACKING & MONITORING (Production Quality!)

12. **Sentry MCP** - `@sentry/mcp-server`
   - Track runtime errors in production
   - Monitor application performance
   - Search events and issues with AI
   - Debug production bugs faster
   - **⚠️ Requires Sentry account and access token**

### 📡 API VALIDATION & CONSISTENCY (Quality Assurance!)

13. **OpenAPI MCP** - `@ivotoby/openapi-mcp-server`
   - Explore OpenAPI/Swagger specifications
   - Validate API endpoint definitions
   - Check route consistency across your API
   - Auto-generate API documentation

14. **Swagger Parser MCP** - `mcp-swagger-parser`
   - Parse and validate OpenAPI 2.0 and 3.x specs
   - Extract endpoint schemas and security schemes
   - Generate TypeScript models from API specs
   - Multi-format support (JSON, YAML, URL, files)

## 🚀 How to Use

### Restart Claude Code
1. Close and reopen Claude Code OR
2. Reload the window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Verify MCP Servers are Running
Claude Code will automatically start these servers when needed. You should see them available in the MCP tools menu.

### Using the Servers

**Filesystem:**
- "Read all files in frontend/src/components"
- "Search for all uses of useState in the codebase"
- "Show me all files that import axios"

**Git:**
- "Show me the git diff for the current branch"
- "Create a commit with message 'fix: resolve table overflow'"
- "Show me the last 10 commits"

**MySQL:**
- "Show me all tables in njcabinets_db"
- "Query all customers from the last 7 days"
- "Show me the schema for the Orders table"

**Playwright:**
- "Open the leads page and take a screenshot"
- "Test the login flow and verify it works"
- "Check accessibility issues on the dashboard"

**Stripe:**
- "List all customers from Stripe"
- "Create a test product"
- "Check recent payments"

**Puppeteer:**
- "Generate a PDF of a sample proposal"
- "Test the PDF generation with a screenshot"

**Chakra UI:**
- "Show me all available Chakra UI button variants"
- "What props does the Chakra Modal component accept?"
- "Generate a responsive card component using Chakra UI"
- "How do I customize the Chakra theme colors?"
- "Show me examples of Chakra Stack layouts"
- "What's the best Chakra component for a pricing table?"

**Material UI:**
- "Compare Chakra Box vs MUI Box component"
- "Show me MUI DataGrid examples"
- "What are the theming differences between Chakra and MUI?"

**Sentry (Error Tracking):**
- "Show me all errors from the last 24 hours"
- "What are the most common runtime errors in production?"
- "Find all TypeError issues related to proposals"
- "Show me the stack trace for error ID abc123"
- "What percentage of users are affected by this error?"

**OpenAPI/Swagger (API Validation):**
- "Analyze the OpenAPI spec and list all endpoints"
- "Check if all API routes have proper validation"
- "Show me endpoints missing authentication"
- "Generate TypeScript types from the Swagger spec"
- "Find inconsistencies in API route naming"
- "Validate that all routes follow REST conventions"

## ⚙️ Configuration

### Add GitHub Token (Optional)
To use the GitHub MCP server:

1. Create a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `read:org`, `workflow`

2. Edit `.claude/mcp.json`:
   ```json
   "github": {
     "env": {
       "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
     }
   }
   ```

### MySQL Connection
The MySQL server is pre-configured with:
- Host: `localhost`
- Port: `3306`
- Database: `njcabinets_db`
- User: `root`
- Password: (empty)

If your database credentials are different, edit `.claude/mcp.json`.

### Stripe Configuration
The Stripe MCP is pre-configured with your **LIVE** Stripe key. To use test mode instead:

1. Get your test key from Stripe Dashboard
2. Edit `.claude/mcp.json`:
   ```json
   "stripe": {
     "args": [
       "-y",
       "@stripe/mcp",
       "--tools=all",
       "--api-key=sk_test_YOUR_TEST_KEY_HERE"
     ]
   }
   ```

### Sentry Configuration (Optional)
To use the Sentry MCP for error tracking:

1. Create a Sentry account at https://sentry.io (free tier available)
2. Create a new organization and project
3. Get your Auth Token:
   - Go to Settings → Account → API Keys
   - Create new auth token with `event:read`, `project:read`, `org:read` scopes
4. Edit `.claude/mcp.json`:
   ```json
   "sentry": {
     "env": {
       "SENTRY_ACCESS_TOKEN": "your_sentry_auth_token_here",
       "SENTRY_HOST": "https://sentry.io"
     }
   }
   ```

**Note:** Sentry MCP requires an active Sentry account. It's optional but highly recommended for production monitoring.

### OpenAPI/Swagger Configuration
The OpenAPI servers work with any Swagger/OpenAPI specification:

- **If you have an OpenAPI spec file**: Place it in your project root or provide the URL
- **If you don't have one**: You can generate it from your Express routes using packages like:
  - `swagger-jsdoc` - Generate from JSDoc comments
  - `swagger-autogen` - Auto-generate from Express routes

## 🔧 Troubleshooting

### MCP Server Not Starting
1. Check that npm global packages are installed:
   ```bash
   npm list -g @modelcontextprotocol/server-filesystem
   ```

2. Verify `.claude/mcp.json` syntax is valid

3. Check Claude Code logs:
   - `Ctrl+Shift+P` → "Developer: Show Logs"

### Performance Issues
If MCP servers are slow:
- Disable unused servers by removing them from `.claude/mcp.json`
- Start with just `filesystem` and `git` for best performance

### Path Issues on Windows
If paths don't work:
- Use double backslashes: `c:\\njtake2\\njcabinets-main`
- Or use forward slashes: `c:/njtake2/njcabinets-main`

## 📊 What You Can Build Now

### Faster Development Workflows
- "Find all components using deprecated Bootstrap classes and migrate to Chakra UI"
- "Generate a migration script to update all database tables"
- "Create a new proposal page component following existing patterns"

### Automated Testing
- "Run Playwright tests on all authentication pages"
- "Check if all forms have proper accessibility attributes"
- "Test the checkout flow end-to-end"

### Data Operations
- "Export all customers to CSV"
- "Find duplicate entries in the manufacturers table"
- "Generate sample test data for development"

### Stripe Integration
- "List all failed payments from the last month"
- "Create a test subscription plan"
- "Check webhook delivery status"

### Git Operations
- "Create a feature branch for the new dashboard redesign"
- "Generate a changelog from the last 50 commits"
- "Show me all files changed in the njnewui branch"

### 🎨 Pro Styling & Design (NEW!)
- **Component Generation:**
  - "Create a Chakra UI pricing table with 3 tiers using your brand colors"
  - "Build a mobile-responsive navigation menu with Chakra UI"
  - "Generate a dashboard layout using Chakra Grid and Stack"
  - "Create a form with validation using Chakra Input, FormControl, and FormErrorMessage"

- **Design Tokens & Theming:**
  - "Show me all available Chakra color schemes"
  - "How do I override the default Button styles in my Chakra theme?"
  - "Create a custom theme extending the base Chakra theme"
  - "What spacing tokens does Chakra use? (px, py, margin, etc.)"

- **Component Migration:**
  - "Convert this Bootstrap modal to Chakra UI Modal"
  - "Migrate this CSS-in-JS component to use Chakra UI props"
  - "Replace all CoreUI badges with Chakra UI Badge components"

- **Accessibility & Best Practices:**
  - "What ARIA attributes should I add to this Chakra Menu?"
  - "Check if my Chakra form components have proper labels"
  - "What's the accessible way to create a Chakra disclosure/accordion?"

- **Responsive Design:**
  - "Make this component responsive using Chakra's breakpoint syntax"
  - "Show me how to use Chakra's `display` prop for mobile/desktop"
  - "Create a responsive grid that's 1 col on mobile, 3 cols on desktop"

## 🎯 Next Steps

1. **Test the setup:**
   - Ask Claude: "Use the filesystem MCP to list all files in frontend/src/pages"
   - Ask Claude: "Use the git MCP to show me the current branch"
   - Ask Claude: "Show me all Chakra UI button variants with examples"

2. **Start using in your workflow:**
   - Use MySQL MCP for database queries instead of switching to MySQL Workbench
   - Use Git MCP for commits instead of switching to terminal
   - Use Playwright MCP for UI testing automation
   - **Use Chakra UI MCP for component generation and styling guidance**

3. **Customize as needed:**
   - Add more MCP servers from https://github.com/punkpeye/awesome-mcp-servers
   - Disable servers you don't use to improve performance
   - Create custom MCP servers for your specific workflows

## 📚 Resources

**General MCP:**
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

**Design Systems:**
- [Chakra UI MCP Docs](https://chakra-ui.com/docs/get-started/ai/mcp-server)
- [Material UI MCP Docs](https://mui.com/material-ui/getting-started/mcp/)
- [Chakra UI Component Library](https://chakra-ui.com/docs/components)
- [MUI Component Library](https://mui.com/material-ui/all-components/)

**Error Tracking & Monitoring:**
- [Sentry MCP Documentation](https://docs.sentry.io/product/sentry-mcp/)
- [Sentry MCP Blog Post](https://blog.sentry.io/monitoring-mcp-server-sentry/)
- [Sentry Free Account](https://sentry.io/signup/)

**API Validation:**
- [OpenAPI MCP Server](https://www.npmjs.com/package/@ivotoby/openapi-mcp-server)
- [Swagger Parser MCP](https://www.npmjs.com/package/mcp-swagger-parser)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Installed on:** October 2, 2025
**Project:** NJ Cabinets (njcabinets-main)
**Total Servers:** 14
- 9 Core Development Tools
- 2 Design Systems
- 1 Error Tracking
- 2 API Validation

**Status:** ✅ Ready to use

**Latest Additions:**
- 🎨 Chakra UI MCP + Material UI MCP (Design Systems)
- 🐛 Sentry MCP (Error Tracking & Monitoring)
- 📡 OpenAPI + Swagger Parser MCP (API Validation)
