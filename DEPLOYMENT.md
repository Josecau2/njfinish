# NJ Cabinets - Environment Setup Guide

## Development Setup

### Backend (.env)
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=njcabinets_db
DB_PORT=3306
PORT=8080
JWT_SECRET=dev-jwt-secret-change-in-production
NODE_ENV=development
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8080
VITE_NODE_ENV=development
VITE_DEBUG=false
```

## Production Setup

### Backend (.env)
```bash
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=njcabinets_db
DB_PORT=3306
PORT=8080
JWT_SECRET=your-super-secure-jwt-secret-generate-new-one
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@njcontractors.com
EMAIL_PASSWORD=your-app-password
```

### Frontend (.env)
```bash
VITE_API_URL=https://app.njcontractors.com
VITE_NODE_ENV=production
VITE_DEBUG=false
```

## CORS Configuration

The app is configured to allow requests from:
- `https://app.njcontractors.com` (production)
- `http://localhost:3000` (development - React)
- `http://localhost:8080` (development - backend)
- `http://localhost:5173` (development - Vite)

## Security Notes

1. **JWT Secret**: Generate a strong, unique JWT secret for production
2. **Database**: Use a secure database password and consider database user with limited privileges
3. **HTTPS**: Ensure production uses HTTPS
4. **Environment Variables**: Never commit actual .env files to version control

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
The backend serves the built frontend from the `frontend/build` directory.

## Domain Configuration

Make sure your domain `app.njcontractors.com` points to your production server and that your SSL certificate is properly configured.
