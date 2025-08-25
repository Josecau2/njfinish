# Production Image Handling Setup Guide

## Overview
This guide covers the complete setup for proper image handling in production for manufacturer logos and other images in the NJ Cabinets application.

## 🔧 Configuration Changes Made

### 1. Upload Directory Structure
```
uploads/
├── images/                    # All manufacturer logos and images
├── manufacturer_catalogs/     # Catalog files and style images
└── resources/                 # Resource files
```

### 2. Static File Serving Routes
The application now serves static files from:
- `/uploads` → `./uploads/` (root uploads directory)
- `/uploads/images` → `./uploads/images/` (manufacturer logos)
- `/uploads/manufacturer_catalogs` → `./uploads/manufacturer_catalogs/` (catalogs and style images)

### 3. File Upload Configurations
- **Images**: 5MB limit, JPEG/PNG/WebP/GIF formats
- **Catalog files**: 50MB limit, PDF/Excel/CSV formats
- **Security**: File type validation and size limits enforced

## 📋 Production Deployment Checklist

### Before Deployment

1. **Run the production setup check:**
   ```bash
   node check-production-setup.js
   ```

2. **Migrate existing images (if upgrading):**
   ```bash
   node migrate-manufacturer-images.js
   ```

3. **Verify directory permissions:**
   ```bash
   # Ensure web server can read/write to uploads directory
   chmod -R 755 uploads/
   chown -R www-data:www-data uploads/  # For Apache/Nginx
   ```

### Environment Variables

Set these environment variables in production:

```bash
NODE_ENV=production
PORT=8080
UPLOAD_PATH=./uploads
RESOURCES_UPLOAD_DIR=./uploads/resources

# Optional: Customize upload paths
# UPLOAD_PATH=/var/www/uploads
# RESOURCES_UPLOAD_DIR=/var/www/uploads/resources
```

### Web Server Configuration

#### Nginx Configuration
```nginx
server {
    # ... other config

    # Serve uploaded files directly
    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 1M;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:8080;
        # ... other proxy settings
    }
}
```

#### Apache Configuration
```apache
# In your virtual host or .htaccess
Alias /uploads /path/to/your/app/uploads
<Directory "/path/to/your/app/uploads">
    Require all granted
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</Directory>
```

## 🔍 Production Monitoring

### Image Operation Logging
The application now logs all image operations to `logs/image-operations.log` in production:
- Upload events with file sizes
- Delete operations with success/failure status
- Access attempts and errors

### Monitor Log File
```bash
# Watch the image operations log
tail -f logs/image-operations.log

# Check for errors
grep "ERROR" logs/image-operations.log
```

## 🛠️ Troubleshooting

### Common Issues

1. **Images not displaying:**
   - Check directory permissions
   - Verify web server can serve static files from `/uploads/`
   - Check browser console for 404 errors

2. **Upload failures:**
   - Check disk space
   - Verify directory write permissions
   - Check file size limits (5MB for images, 50MB for catalogs)

3. **Performance issues:**
   - Consider using a CDN for uploaded files
   - Enable web server compression for images
   - Implement image optimization/resizing

### Manual Verification

1. **Test image upload:**
   - Create a manufacturer with a logo
   - Verify file is saved in `uploads/images/`
   - Check if image displays in the UI

2. **Test image access:**
   ```bash
   curl -I http://your-domain.com/uploads/images/test-image.jpg
   # Should return 200 OK
   ```

3. **Check directory structure:**
   ```bash
   ls -la uploads/
   # Should show: images/, manufacturer_catalogs/, resources/
   ```

## 📊 Performance Optimization

### Image Optimization (Optional)
Consider implementing:
- Automatic image resizing on upload
- WebP conversion for better compression
- Progressive JPEG encoding
- Lazy loading in the frontend

### Caching Strategy
- Set appropriate cache headers (already configured)
- Consider using a CDN for uploaded files
- Implement browser caching for static assets

## 🔒 Security Considerations

1. **File Type Validation:**
   - Only allowed image types: JPEG, PNG, WebP, GIF
   - Catalog files: PDF, Excel, CSV only

2. **File Size Limits:**
   - Images: 5MB maximum
   - Catalog files: 50MB maximum

3. **Directory Security:**
   - Ensure uploads directory is not executable
   - Implement proper access controls
   - Regular security audits of uploaded files

## 🚀 Production Deployment Steps

1. **Stop the application**
2. **Deploy the updated code**
3. **Run setup check:** `node check-production-setup.js`
4. **Run image migration:** `node migrate-manufacturer-images.js`
5. **Update web server configuration** (if needed)
6. **Start the application**
7. **Verify image functionality**
8. **Monitor logs** for any issues

## 📞 Support

If you encounter issues:
1. Check the application logs
2. Review the image operations log
3. Verify web server configuration
4. Test with the provided verification scripts

---
*Last updated: December 2024*
