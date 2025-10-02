/**
 * Centralized Status Color Definitions
 *
 * This utility provides consistent color schemes for status indicators across the application.
 * All status colors use Chakra UI's semantic color tokens for theme compatibility.
 */

/**
 * Master status color mapping
 * Maps status values to Chakra UI colorScheme values
 */
export const STATUS_COLORS = {
  // Order statuses
  accepted: 'green',
  'proposal accepted': 'green',
  sent: 'blue',
  draft: 'gray',

  // Payment statuses
  paid: 'green',
  completed: 'green',
  pending: 'orange',
  processing: 'blue',
  failed: 'red',
  overdue: 'red',
  cancelled: 'gray',

  // Lead statuses
  new: 'blue',
  reviewing: 'teal',
  contacted: 'green',
  closed: 'gray',

  // Proposal statuses
  approved: 'green',
  rejected: 'red',
  expired: 'gray',
  in_progress: 'blue',

  // Contract statuses
  'measurement scheduled': 'purple',
  'measurement done': 'blue',
  'design done': 'green',
  'follow up 1': 'orange',
  'follow up 2': 'orange',
  'follow up 3': 'red',

  // General statuses
  active: 'green',
  inactive: 'red',
  enabled: 'green',
  disabled: 'gray',
  success: 'green',
  error: 'red',
  warning: 'orange',
  info: 'blue',

  // User/Account statuses
  online: 'green',
  offline: 'gray',
  away: 'yellow',
  busy: 'red',
}

/**
 * Get colorScheme for a given status
 * @param {string} status - The status value
 * @param {string} fallback - Fallback colorScheme if status not found (default: 'gray')
 * @returns {string} Chakra UI colorScheme
 */
export const getStatusColor = (status, fallback = 'gray') => {
  if (!status) return fallback

  // Normalize status to lowercase for case-insensitive matching
  const normalizedStatus = status.toString().toLowerCase().trim()

  return STATUS_COLORS[normalizedStatus] || fallback
}

/**
 * Get colorScheme for order status
 * @param {string} status - Order status
 * @returns {string} Chakra UI colorScheme
 */
export const getOrderStatusColor = (status) => {
  return getStatusColor(status, 'green')
}

/**
 * Get colorScheme for payment status
 * @param {string} status - Payment status
 * @returns {string} Chakra UI colorScheme
 */
export const getPaymentStatusColor = (status) => {
  const colorMap = {
    paid: 'green',
    completed: 'green',
    pending: 'orange',
    processing: 'blue',
    failed: 'red',
    overdue: 'red',
    cancelled: 'gray',
    refunded: 'purple',
  }

  const normalizedStatus = status?.toString().toLowerCase()
  return colorMap[normalizedStatus] || 'gray'
}

/**
 * Get colorScheme for proposal status
 * @param {string} status - Proposal status
 * @returns {string} Chakra UI colorScheme
 */
export const getProposalStatusColor = (status) => {
  const colorMap = {
    accepted: 'green',
    'proposal accepted': 'green',
    sent: 'blue',
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    expired: 'gray',
    draft: 'gray',
    in_progress: 'blue',
    completed: 'green',
  }

  const normalizedStatus = status?.toString().toLowerCase()
  return colorMap[normalizedStatus] || 'gray'
}

/**
 * Get colorScheme for lead status
 * @param {string} status - Lead status
 * @returns {string} Chakra UI colorScheme
 */
export const getLeadStatusColor = (status) => {
  const colorMap = {
    new: 'blue',
    reviewing: 'teal',
    contacted: 'green',
    closed: 'gray',
    lost: 'red',
    won: 'green',
  }

  const normalizedStatus = status?.toString().toLowerCase()
  return colorMap[normalizedStatus] || 'gray'
}

/**
 * Get colorScheme for contract status
 * @param {string} status - Contract status
 * @returns {string} Chakra UI colorScheme
 */
export const getContractStatusColor = (status) => {
  const colorMap = {
    draft: 'gray',
    'measurement scheduled': 'purple',
    'measurement done': 'blue',
    'design done': 'green',
    'follow up 1': 'orange',
    'follow up 2': 'orange',
    'follow up 3': 'red',
    'proposal accepted': 'green',
  }

  const normalizedStatus = status?.toString().toLowerCase()
  return colorMap[normalizedStatus] || 'gray'
}

/**
 * Status badge variant mapping
 * Use 'subtle' for secondary info, 'solid' for primary status
 */
export const STATUS_VARIANTS = {
  primary: 'solid',
  secondary: 'subtle',
  outline: 'outline',
}

/**
 * Get badge props for a status
 * Returns complete props object for Badge component
 * @param {string} status - Status value
 * @param {object} options - Additional options
 * @param {string} options.variant - Badge variant ('solid' | 'subtle' | 'outline')
 * @param {boolean} options.withIcon - Whether to expect an icon
 * @returns {object} Badge component props
 */
export const getStatusBadgeProps = (status, options = {}) => {
  const {
    variant = 'solid',
    withIcon = false,
  } = options

  return {
    colorScheme: getStatusColor(status),
    variant,
    borderRadius: 'full',
    px: withIcon ? 2 : 3,
    py: 1,
    fontSize: 'xs',
    fontWeight: '600',
    textTransform: 'none',
  }
}

export default {
  STATUS_COLORS,
  getStatusColor,
  getOrderStatusColor,
  getPaymentStatusColor,
  getProposalStatusColor,
  getLeadStatusColor,
  getContractStatusColor,
  getStatusBadgeProps,
}
