# Customization Assets Persistence

## Overview
Customization assets (logos, branding images) are now persistent across Docker container rebuilds. This means you won't lose your uploaded logos when updating the application.

## How it Works
- Customization assets are stored in `/srv/njcabinets/customization` on the host
- This directory is mounted to `/app/build/assets/customization` in the container
- When you upload logos through the admin interface, they are copied to both:
  - `frontend/public/assets/customization/` (for development)
  - `build/assets/customization/` (for production persistence)

## Migration for Existing Installations
If you have existing customization assets, run this command to migrate them:

```bash
node migrate-customization-assets.js
```

## Docker Setup
The docker-compose.yml now includes:
```yaml
volumes:
  - /srv/njcabinets/customization:/app/build/assets/customization
```

## Directory Structure
```
/srv/njcabinets/
├── uploads/           # General file uploads
├── backups/           # Database backups
└── customization/     # Logos and branding assets
    ├── logo.png       # Main application logo
    └── login-logo.png # Login page logo (if different)
```

## Benefits
1. **Persistence**: Logos survive Docker rebuilds and updates
2. **Backup-friendly**: Customization assets are in a predictable location
3. **Zero-downtime updates**: No need to re-upload logos after app updates
4. **Version control**: Assets are separate from application code

## Troubleshooting
If logos don't appear after an update:
1. Check if `/srv/njcabinets/customization` exists and contains your files
2. Verify Docker mount permissions: `ls -la /srv/njcabinets/customization`
3. Restart the container to ensure mounts are properly connected
4. Check container logs for any asset copying errors
