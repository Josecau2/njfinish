# Ubuntu Production Deployment

## Quick Deploy

For Ubuntu/Linux production deployment, simply run:

```bash
npm run build
npm start
```

That's it! The build process will automatically:
- Install all dependencies
- Build the frontend
- Set up upload directories
- Create admin user (joseca@symmetricalwolf.com / admin123)
- Configure default settings
- Prepare the app for production

## What Happens Automatically

### During Build (`npm run build`)
1. ✅ Install backend dependencies
2. ✅ Install frontend dependencies  
3. ✅ Build frontend for production
4. ✅ Create upload directories with proper permissions
5. ✅ Create logs directory
6. ✅ Generate .env file if missing

### During First App Start (`npm start`)
1. ✅ Sync database schema
2. ✅ Create admin user group
3. ✅ Create admin user: joseca@symmetricalwolf.com / admin123
4. ✅ Set up default location
5. ✅ Configure default tax rates
6. ✅ Create default customizations
7. ✅ Add default resource links
8. ✅ Migrate any existing images

## Environment Variables

The app will create a basic `.env` file automatically. You can customize it:

```bash
NODE_ENV=production
PORT=8080
UPLOAD_PATH=./uploads
RESOURCES_UPLOAD_DIR=./uploads/resources
```

## Process Management

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start index.js --name njcabinets

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using systemd
```bash
sudo nano /etc/systemd/system/njcabinets.service
```

```ini
[Unit]
Description=NJ Cabinets Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/njcabinets
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable njcabinets
sudo systemctl start njcabinets
```

## Web Server Configuration

### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded files directly
    location /uploads/ {
        alias /path/to/njcabinets/uploads/;
        expires 1M;
        access_log off;
    }
}
```

## Security Checklist

- [ ] Change admin password after first login
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall (only allow necessary ports)
- [ ] Set up regular backups
- [ ] Update server and dependencies regularly
- [ ] Use strong database passwords
- [ ] Restrict file upload sizes
- [ ] Monitor logs regularly

## Default Admin Access

**Email:** joseca@symmetricalwolf.com  
**Password:** admin123  
**⚠️ IMPORTANT:** Change this password immediately after first login!

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs njcabinets

# Or if using systemd
sudo journalctl -u njcabinets -f
```

### Database connection issues
1. Ensure MySQL/MariaDB is running
2. Check database credentials in .env
3. Verify database exists and user has permissions

### Upload issues
```bash
# Check permissions
ls -la uploads/
chmod -R 755 uploads/
```

### Frontend not loading
```bash
# Rebuild frontend
cd frontend
npm run build
cd ..
```

## Support

The app includes comprehensive logging and automatic setup. Most issues are resolved automatically during the build and startup process.
