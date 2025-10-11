const express = require('express')
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  issueApiToken,
} = require('../controllers/authController')
const { createRateLimiter } = require('../middleware/rateLimiter')
const { verifyToken, verifyTokenWithGroup } = require('../middleware/auth')
const router = express.Router()

// Helper function to safely parse positive integers from env vars
const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

// Rate limiters for authentication routes (prevent brute force attacks)
const loginLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.AUTH_LOGIN_WINDOW_MS, 10 * 60 * 1000), // 10 minutes default
  max: toPositiveInt(process.env.AUTH_LOGIN_MAX_ATTEMPTS, 10), // 10 attempts default
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return email ? `auth-login:${req.ip}:${email}` : `auth-login:${req.ip}`
  },
})

const signupLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.AUTH_SIGNUP_WINDOW_MS, 60 * 60 * 1000), // 1 hour default
  max: toPositiveInt(process.env.AUTH_SIGNUP_MAX_ATTEMPTS, 20), // 20 attempts default
  keyGenerator: (req) => `auth-signup:${req.ip}`,
})

const forgotPasswordLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.AUTH_FORGOT_WINDOW_MS, 30 * 60 * 1000), // 30 minutes default
  max: toPositiveInt(process.env.AUTH_FORGOT_MAX_ATTEMPTS, 5), // 5 attempts default
  keyGenerator: (req) => `auth-forgot:${req.ip}`,
})

const resetPasswordLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.AUTH_RESET_WINDOW_MS, 30 * 60 * 1000), // 30 minutes default
  max: toPositiveInt(process.env.AUTH_RESET_MAX_ATTEMPTS, 5), // 5 attempts default
  keyGenerator: (req) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.slice(0, 12) : ''
    return token ? `auth-reset:${token}` : `auth-reset:${req.ip}`
  },
})

const tokenLimiter = createRateLimiter({
  windowMs: toPositiveInt(process.env.AUTH_TOKEN_WINDOW_MS, 5 * 60 * 1000), // 5 minutes default
  max: toPositiveInt(process.env.AUTH_TOKEN_MAX_ATTEMPTS, 30),
  keyGenerator: (req) => `auth-token:${req.ip}`,
})

// Auth routes with rate limiting to prevent abuse

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Too many signup attempts
 */
router.post('/signup', signupLimiter, signup)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login to the system
 *     description: Authenticate with email and password to receive a JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', loginLimiter, login)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout from the system
 *     description: Invalidate the current JWT token
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', verifyToken, logout)

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send a password reset email to the user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       429:
 *         description: Too many reset attempts
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword)

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Reset password using the token from the reset email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       429:
 *         description: Too many reset attempts
 */
router.post('/reset-password', resetPasswordLimiter, resetPassword)

/**
 * @openapi
 * /api/auth/token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Issue API token
 *     description: Generate a new API token for programmatic access
 *     responses:
 *       200:
 *         description: Token issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Too many token requests
 */
router.post('/token', tokenLimiter, verifyTokenWithGroup, issueApiToken)

module.exports = router
