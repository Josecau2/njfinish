#!/usr/bin/env node

/**
 * Terminal Error Monitoring Agent
 * Continuously monitors dev server output for errors and warnings
 * Reports issues immediately when detected during file modifications
 */

const { spawn } = require('child_process')
const chalk = require('chalk')

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Error patterns to detect
const ERROR_PATTERNS = [
  /error/i,
  /failed/i,
  /cannot find/i,
  /module not found/i,
  /syntax error/i,
  /unexpected token/i,
  /reference error/i,
  /type error/i,
  /undefined is not/i,
  /cannot read propert/i,
  /✘ \[ERROR\]/,
  /\[vite\] internal server error/i
]

// Warning patterns to detect
const WARNING_PATTERNS = [
  /warning/i,
  /deprecated/i,
  /⚠/,
  /\[vite\] hmr update error/i
]

// Patterns to ignore (noise)
const IGNORE_PATTERNS = [
  /downloading update/i,
  /update available/i,
  /npm notice/i,
  /peer dep/i
]

let errorCount = 0
let warningCount = 0
let lastError = null
let lastWarning = null

function shouldIgnore(line) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(line))
}

function isError(line) {
  return ERROR_PATTERNS.some(pattern => pattern.test(line))
}

function isWarning(line) {
  return WARNING_PATTERNS.some(pattern => pattern.test(line))
}

function formatTimestamp() {
  const now = new Date()
  return now.toTimeString().split(' ')[0]
}

function logError(line) {
  errorCount++
  lastError = { line, timestamp: new Date() }

  console.error(`\n${colors.red}╔════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.error(`${colors.red}║ 🚨 ERROR DETECTED [${formatTimestamp()}] (Total: ${errorCount})${colors.reset}`)
  console.error(`${colors.red}╠════════════════════════════════════════════════════════════════╣${colors.reset}`)
  console.error(`${colors.red}║${colors.reset} ${line.trim().substring(0, 60)}`)
  console.error(`${colors.red}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`)
}

function logWarning(line) {
  warningCount++
  lastWarning = { line, timestamp: new Date() }

  console.warn(`${colors.yellow}⚠️  WARNING [${formatTimestamp()}]: ${line.trim()}${colors.reset}`)
}

function logInfo(line) {
  // Normal log output - just pass through with timestamp for important events
  if (line.includes('ready in') || line.includes('server running') || line.includes('VITE')) {
    console.log(`${colors.green}✓${colors.reset} ${line.trim()}`)
  } else {
    console.log(line)
  }
}

console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`)
console.log(`${colors.cyan}║         Terminal Error Monitoring Agent Active 🔍            ║${colors.reset}`)
console.log(`${colors.cyan}╠════════════════════════════════════════════════════════════════╣${colors.reset}`)
console.log(`${colors.cyan}║ Monitoring dev server output for errors and warnings...      ║${colors.reset}`)
console.log(`${colors.cyan}║ Press Ctrl+C to stop                                          ║${colors.reset}`)
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`)

// Start the dev server
const devServer = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: __dirname
})

// Monitor stdout
devServer.stdout.on('data', (data) => {
  const lines = data.toString().split('\n')

  lines.forEach(line => {
    if (!line.trim()) return

    if (shouldIgnore(line)) {
      return
    }

    if (isError(line)) {
      logError(line)
    } else if (isWarning(line)) {
      logWarning(line)
    } else {
      logInfo(line)
    }
  })
})

// Monitor stderr
devServer.stderr.on('data', (data) => {
  const lines = data.toString().split('\n')

  lines.forEach(line => {
    if (!line.trim()) return

    if (shouldIgnore(line)) {
      return
    }

    // stderr is typically errors
    if (isError(line) || line.trim().length > 0) {
      logError(line)
    }
  })
})

devServer.on('close', (code) => {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════╗${colors.reset}`)
  console.log(`${colors.cyan}║              Monitoring Session Summary                       ║${colors.reset}`)
  console.log(`${colors.cyan}╠════════════════════════════════════════════════════════════════╣${colors.reset}`)
  console.log(`${colors.red}║ Errors detected: ${errorCount}${colors.reset}`)
  console.log(`${colors.yellow}║ Warnings detected: ${warningCount}${colors.reset}`)
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`)

  if (code !== 0) {
    console.error(`${colors.red}Dev server exited with code ${code}${colors.reset}`)
  }

  process.exit(code)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n${colors.cyan}Stopping error monitor...${colors.reset}`)
  devServer.kill('SIGINT')
  setTimeout(() => {
    process.exit(0)
  }, 1000)
})
