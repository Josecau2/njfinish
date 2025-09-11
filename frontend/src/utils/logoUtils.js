/**
 * Logo URL Utility
 *
 * Helper functions for handling logo URLs in the embedded customization system.
 * This handles both embedded assets (/assets/customization/) and legacy backend assets (/uploads/).
 */

/**
 * Gets the correct logo URL for display
 * @param {string} logoPath - The logo path from customization config
 * @param {string} apiUrl - The API URL for backend assets
 * @returns {string} - The complete URL for the logo
 */
export const getLogoUrl = (logoPath, apiUrl) => {
  if (!logoPath) return null

  // If it's an embedded asset (starts with /assets/), use as-is
  if (logoPath.startsWith('/assets/')) {
    return logoPath
  }

  // If it's a legacy backend asset (starts with /uploads/), prepend API URL
  if (logoPath.startsWith('/uploads/')) {
    return `${apiUrl}${logoPath}`
  }

  // Fallback: assume it's a backend asset and prepend API URL
  return `${apiUrl}${logoPath}`
}

/**
 * Checks if a logo path is an embedded asset
 * @param {string} logoPath - The logo path to check
 * @returns {boolean} - True if it's an embedded asset
 */
export const isEmbeddedAsset = (logoPath) => {
  return logoPath && logoPath.startsWith('/assets/')
}

/**
 * Checks if a logo path is a legacy backend asset
 * @param {string} logoPath - The logo path to check
 * @returns {boolean} - True if it's a backend asset
 */
export const isBackendAsset = (logoPath) => {
  return logoPath && logoPath.startsWith('/uploads/')
}
