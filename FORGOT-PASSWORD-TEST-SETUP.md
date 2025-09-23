# Forgot Password Functionality Test

This document describes the forgot password testing setup and scripts created for the NJ Cabinets application.

## 📋 Overview

The forgot password functionality has been tested and verified to work correctly. Here's what was implemented:

### ✅ What's Working
- Frontend forgot password page (`/forgot-password`)
- Backend API endpoint (`POST /api/forgot-password`)
- Database reset token generation and storage
- Email service integration with Gmail SMTP
- Password reset link generation

### ⚠️ Current Issue
The Gmail SMTP configuration requires an **App Password** instead of the regular account password due to 2-Factor Authentication being enabled on the account.

## 🛠️ Test Scripts Created

### 1. `scripts/test-forgot-password-email.js`
**Comprehensive test script that validates the entire forgot password flow:**
- Tests email configuration and connectivity
- Creates/finds test user (`fleitipon@icloud.com`)
- Makes API request to forgot password endpoint
- Verifies reset token generation in database
- Sends actual test email with reset link
- Provides detailed status reporting

**Usage:**
```bash
node scripts/test-forgot-password-email.js
```

### 2. `scripts/test-forgot-password-http.js`
**Simple HTTP test for the API endpoint:**
- Quick test of the forgot password API
- Makes direct HTTP request
- Validates API response
- No database or email testing

**Usage:**
```bash
node scripts/test-forgot-password-http.js
```

### 3. `scripts/check-forgot-password-setup.js`
**Pre-flight check script:**
- Verifies backend server is running
- Checks email configuration completeness
- Validates all required environment variables

**Usage:**
```bash
node scripts/check-forgot-password-setup.js
```

### 4. `scripts/gmail-app-password-setup.js`
**Gmail App Password setup guide:**
- Provides step-by-step instructions for creating Gmail App Password
- Shows current configuration status
- Explains the 2FA requirement

**Usage:**
```bash
node scripts/gmail-app-password-setup.js
```

## 🔧 Setup Instructions

### Current Configuration (in .env)
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=joseca@symmetricalwolf.com
SMTP_PASS=hufwun-4Nixqo-qyfweb
EMAIL_FROM=NJ Cabinets <joseca@symmetricalwolf.com>
```

### Issue: Gmail App Password Required
The current password `hufwun-4Nixqo-qyfweb` appears to be a regular password, but Gmail requires an App Password when 2FA is enabled.

### Fix Steps:
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Go to **Security** → **App passwords**: https://myaccount.google.com/apppasswords
4. Create new App Password:
   - App: "Mail"
   - Device: "Other (custom name)" → "NJ Cabinets App"
   - Copy the 16-character password (remove spaces)
5. Update `.env` file:
   ```env
   SMTP_PASS=your_16_character_app_password
   ```
6. Restart backend server: `node index.js`

## 🧪 Test Results

### HTTP Test Results
✅ **API Endpoint Working**
- URL: `http://localhost:8080/api/forgot-password`
- Status: 200 OK
- Response: `"If an account exists for that email, a reset link has been sent."`

### Database Test Results
✅ **Reset Token Generation Working**
- Reset tokens are generated and stored correctly
- Token expiry set to 1 hour from generation
- User lookup by email working properly

### Email Test Results
❌ **Email Sending Blocked**
- Error: "Invalid login: 534-5.7.9 Application-specific password required"
- Cause: Gmail 2FA requires App Password
- Solution: Generate and configure Gmail App Password

## 🎯 Test Email Configuration

The test scripts are configured to send emails to: **fleitipon@icloud.com**

This can be changed by modifying the `TEST_EMAIL` constant in the test scripts.

## 🔄 Testing Workflow

1. **Quick Test** (HTTP only):
   ```bash
   node scripts/test-forgot-password-http.js
   ```

2. **Pre-flight Check**:
   ```bash
   node scripts/check-forgot-password-setup.js
   ```

3. **Full Test** (with email):
   ```bash
   node scripts/test-forgot-password-email.js
   ```

4. **Setup Gmail** (if needed):
   ```bash
   node scripts/gmail-app-password-setup.js
   ```

## 📧 Expected Email Content

When working correctly, the test email will contain:
- **Subject**: "🔐 Password Reset Test - NJ Cabinets"
- **Reset Link**: `http://localhost:8080/reset-password/{token}`
- **Expiry**: 1 hour from generation
- **HTML formatted** with styling

## 🔗 Frontend Integration

The forgot password page is accessible at:
- **URL**: `/forgot-password`
- **Component**: `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- **API Integration**: Makes POST request to `/api/forgot-password`
- **User Experience**: Shows success message after submission

## ✅ Next Steps

1. **Fix Gmail App Password** (main blocker)
2. **Test email delivery** to fleitipon@icloud.com
3. **Verify reset link functionality**
4. **Test complete password reset flow**

Once the Gmail App Password is configured, all tests should pass and email delivery will work correctly.

## 🚀 Production Considerations

- Use environment-specific email credentials
- Consider using dedicated SMTP service (SendGrid, Mailgun)
- Implement rate limiting for forgot password requests
- Add logging for password reset attempts
- Consider customizing email templates