import {
  format,
  parseISO,
  isValid,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns'
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * Replace moment.js functionality with date-fns
 * This file provides common date utilities used throughout the app
 */

// Format date with timezone support
export const formatDate = (date, formatString = 'yyyy-MM-dd', timezone = 'UTC') => {
  if (!date) return ''

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''

    if (timezone === 'UTC') {
      return format(dateObj, formatString)
    }

    return formatInTimeZone(dateObj, timezone, formatString)
  } catch (error) {
    console.warn('Date formatting error:', error)
    return ''
  }
}

// Format date and time
export const formatDateTime = (date, timezone = 'UTC') => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss', timezone)
}

// Format date for display
export const formatDisplayDate = (date, timezone = 'UTC') => {
  return formatDate(date, 'MMM dd, yyyy', timezone)
}

// Parse ISO date string
export const parseDate = (dateString) => {
  if (!dateString) return null
  const date = parseISO(dateString)
  return isValid(date) ? date : null
}

// Convert to UTC
export const toUtc = (date, timezone) => {
  return fromZonedTime(date, timezone)
}

// Convert from UTC to timezone
export const fromUtc = (date, timezone) => {
  return toZonedTime(date, timezone)
}

// Add/subtract days
export const addDaysToDate = (date, days) => {
  return addDays(date, days)
}

export const subtractDaysFromDate = (date, days) => {
  return subDays(date, days)
}

// Start/end of day
export const getStartOfDay = (date) => {
  return startOfDay(date)
}

export const getEndOfDay = (date) => {
  return endOfDay(date)
}

// Start/end of week
export const getStartOfWeek = (date = new Date()) => {
  return startOfWeek(date)
}

export const getEndOfWeek = (date = new Date()) => {
  return endOfWeek(date)
}

// Check if date is between two dates (inclusive)
export const isBetween = (date, startDate, endDate) => {
  return isWithinInterval(date, { start: startDate, end: endDate })
}

// Check if date is valid
export const isValidDate = (date) => {
  return isValid(date)
}

// Get current date
export const getCurrentDate = () => {
  return new Date()
}

// Get today formatted as YYYY-MM-DD
export const getTodayFormatted = () => {
  return formatDate(new Date(), 'yyyy-MM-dd')
}

// Legacy moment-like interface for easier migration
export const moment = (date) => ({
  format: (formatString) => formatDate(date, formatString),
  utc: () => moment(toUtc(date, 'UTC')),
  tz: (timezone) => moment(fromUtc(date, timezone)),
  add: (amount, unit) => {
    if (unit === 'days') return moment(addDays(date, amount))
    return moment(date)
  },
  subtract: (amount, unit) => {
    if (unit === 'days') return moment(subDays(date, amount))
    return moment(date)
  },
  startOf: (unit) => {
    if (unit === 'week') return moment(getStartOfWeek(date))
    if (unit === 'day') return moment(getStartOfDay(date))
    return moment(date)
  },
  endOf: (unit) => {
    if (unit === 'week') return moment(getEndOfWeek(date))
    if (unit === 'day') return moment(getEndOfDay(date))
    return moment(date)
  },
  isBetween: (start, end, granularity, inclusivity) => {
    const startDate = typeof start === 'string' ? parseISO(start) : start
    const endDate = typeof end === 'string' ? parseISO(end) : end
    return isBetween(date, startDate, endDate)
  },
  isValid: () => isValid(date),
  toDate: () => date,
})
