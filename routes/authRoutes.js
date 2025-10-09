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
router.post('/signup', signupLimiter, signup)
router.post('/login', loginLimiter, login)
router.post('/logout', verifyToken, logout)
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword)
router.post('/reset-password', resetPasswordLimiter, resetPassword)
router.post('/token', tokenLimiter, verifyTokenWithGroup, issueApiToken)

module.exports = router
