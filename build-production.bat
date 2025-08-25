@echo off
REM Production Build Script for NJ Cabinets (Windows)
REM This script handles the complete build and setup process for production deployment

echo.
echo ===================================================
echo 🚀 Starting NJ Cabinets Production Build Process...
echo ===================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo 📝 Node.js version:
node --version
echo 📝 npm version:
npm --version
echo.

REM Install backend dependencies
echo 📝 Installing backend dependencies...
npm install --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    exit /b 1
)
echo ✅ Backend dependencies installed
echo.

REM Install frontend dependencies and build
echo 📝 Installing frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    exit /b 1
)
echo ✅ Frontend dependencies installed
echo.

echo 📝 Building frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed
    cd ..
    exit /b 1
)
echo ✅ Frontend build completed
echo.

REM Return to root directory
cd ..

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found.
    if exist .env.example (
        copy .env.example .env >nul
        echo 📝 Copied .env.example to .env. Please review and update the configuration.
    ) else (
        echo ⚠️  No .env.example found. Please create .env file manually.
    )
    echo.
)

REM Check production setup
echo 📝 Running production environment check...
node check-production-setup.js
if %errorlevel% neq 0 (
    echo ❌ Production environment check failed
    exit /b 1
)
echo ✅ Production environment check passed
echo.

REM Run production setup
echo 📝 Setting up production data...
node setup-production.js
if %errorlevel% neq 0 (
    echo ❌ Production data setup failed
    exit /b 1
)
echo ✅ Production data setup completed
echo.

REM Verify image setup
echo 📝 Verifying production image setup...
node verify-production-images.js
if %errorlevel% neq 0 (
    echo ⚠️  Image setup verification had issues (check logs for details)
) else (
    echo ✅ Image setup verification passed
)
echo.

REM Create logs directory if it doesn't exist
if not exist logs (
    mkdir logs
    echo 📝 Created logs directory
)

echo.
echo ===================================================
echo ✅ NJ Cabinets Production Build Completed Successfully!
echo ===================================================
echo.

echo 📋 NEXT STEPS:
echo 1. Review and update the .env file with your production settings
echo 2. Configure your web server (IIS/Apache/Nginx) to serve static files
echo 3. Set up SSL certificates for HTTPS
echo 4. Configure your process manager (PM2, Windows Service, etc.)
echo 5. Set up monitoring and backup procedures
echo.

echo 🔑 DEFAULT ADMIN CREDENTIALS:
echo    Email: joseca@symmetricalwolf.com
echo    Password: admin123
echo    ⚠️  IMPORTANT: Change the password after first login!
echo.

echo 🚀 TO START THE APPLICATION:
echo    Production: npm start
echo    With PM2: pm2 start app.js --name njcabinets
echo.

echo 📖 For detailed deployment instructions, see:
echo    - PRODUCTION-IMAGE-SETUP.md
echo    - README.md
echo.

pause
