/**
 * Standard error shape for Redux slices
 * @typedef {Object} ErrorState
 * @property {string} message - User-friendly error message
 * @property {string} [code] - Error code for programmatic handling
 * @property {*} [details] - Additional error details
 */

/**
 * Normalize error to standard shape
 * @param {*} error - Error from API or other source
 * @returns {ErrorState} Normalized error object
 */
export function normalizeError(error) {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      code: 'UNKNOWN_ERROR',
      details: null,
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      code: error.name || 'ERROR',
      details: error.stack,
    }
  }

  // Handle API error responses
  if (error?.response?.data) {
    return {
      message: error.response.data.message || 'An error occurred',
      code: error.response.data.code || `HTTP_${error.response.status}`,
      details: error.response.data,
    }
  }

  // Handle objects with message property
  if (error?.message) {
    return {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      details: error,
    }
  }

  // Fallback for unknown error shapes
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: error,
  }
}
