# PDF Logo Display Fix - Implementation Summary

## Problem Identified
Order PDFs were not displaying logos because the backend was passing file paths as URLs to Puppeteer, which couldn't resolve them correctly during PDF generation. The frontend's proposal PDF preview works because it preloads logos and converts them to Data URIs before passing to the PDF builder.

## Root Cause
**Frontend Approach:**
- In `PrintProposalModal.jsx`, the `preloadLogoDataUri` function:
  1. Resolves the logo URL using `resolveAssetUrl`
  2. Fetches the image as a blob with authentication
  3. Converts the blob to a Data URI (base64)
  4. Adds it to `pdfCustomization` as `headerLogoDataUri`
  5. Passes this to the PDF builder

**Backend Original Issue:**
- `eventManager.js` was passing raw `pdfCustomization` with file paths (e.g., `/uploads/logo.png`)
- `buildPdfHeader` in `pdfStylingHelpers.js` would construct URLs like `/public-uploads/uploads/logo.png`
- Puppeteer couldn't resolve these URLs during PDF rendering

## Solution Implemented

### 1. Added Logo Conversion Helper (`eventManager.js`)
Created `convertLogoToDataUri` method that:
- Takes a logo file path (from `headerLogo`, `logo`, or `logoImage` fields)
- Handles various path formats (`/uploads/`, relative paths, etc.)
- Reads the file from the server filesystem
- Determines MIME type from extension
- Converts to base64 Data URI
- Returns `data:image/png;base64,{base64data}`

**Key Features:**
- Handles data URIs and absolute URLs (returns as-is)
- Resolves paths relative to `public/` directory
- Supports multiple image formats (PNG, JPG, GIF, SVG, WebP)
- Graceful error handling with console warnings

### 2. Updated Order PDF Generation (`buildNoPriceOrderHtml`)
Modified the method to:
1. Fetch `PdfCustomization` from database
2. Extract logo path from available fields
3. Convert logo to Data URI using the helper
4. Add `headerLogoDataUri` to `pdfCustomization` object
5. Pass enhanced customization to `buildPdfHeader`

### 3. Added Required Dependencies
- `fs.promises` for async file reading
- `path` for file path manipulation

## Code Changes

### `eventManager.js`
```javascript
// Added imports
const fs = require('fs').promises;
const path = require('path');

// Added method in EventManager class
async convertLogoToDataUri(logoPath) {
  // ... implementation details
}

// Updated buildNoPriceOrderHtml
async buildNoPriceOrderHtml(snapshot) {
  // ... fetch pdfCustomization

  // NEW: Convert logo to Data URI
  const logoPath = pdfCustomization.headerLogo ||
                   pdfCustomization.logo ||
                   pdfCustomization.logoImage;
  if (logoPath) {
    const logoDataUri = await this.convertLogoToDataUri(logoPath);
    if (logoDataUri) {
      pdfCustomization.headerLogoDataUri = logoDataUri;
    }
  }

  // ... rest of method
}
```

## How It Works Now

### Order PDF Flow:
1. User accepts proposal or generates order
2. `buildNoPriceOrderHtml` fetches PDF customization
3. Logo file path extracted from customization
4. `convertLogoToDataUri` reads file and converts to base64
5. Data URI added as `headerLogoDataUri` to customization
6. `buildPdfHeader` receives Data URI (prioritizes `headerLogoDataUri`)
7. HTML includes embedded image: `<img src="data:image/png;base64,...">`
8. Puppeteer renders PDF with embedded logo

### Proposal PDF Flow (Already Working):
1. User previews proposal
2. `preloadLogoDataUri` fetches logo via API
3. Converts blob to Data URI
4. Passes to PDF builder as `headerLogoDataUri`
5. Same result: embedded image in PDF

## Benefits
✅ **Consistent Logo Display:** Order PDFs now show logos just like proposal PDFs
✅ **No External Dependencies:** Logos embedded as Data URIs don't require network requests
✅ **Puppeteer Compatible:** Data URIs work reliably in headless browser contexts
✅ **Same Code Path:** Backend now uses same approach as frontend
✅ **Graceful Degradation:** If logo conversion fails, PDF generates without logo
✅ **Future-Proof:** Handles various image formats and path structures

## Testing Recommendations
1. Accept a proposal and verify order PDF shows logo
2. Test with different logo formats (PNG, JPG, SVG)
3. Test with logos in different path structures
4. Verify proposal PDF preview still works (no regression)
5. Test with missing/invalid logo paths (should gracefully skip)

## Related Files
- `utils/eventManager.js` - Order PDF generation with logo conversion
- `utils/pdfStylingHelpers.js` - Shared PDF styling utilities
- `frontend/src/components/model/PrintProposalModal.jsx` - Frontend logo preloading
- `frontend/src/utils/assetUtils.js` - Frontend URL resolution
- `frontend/src/helpers/proposalPdfBuilder.js` - Frontend PDF builder

## Additional Notes
- The `resolveLogoUrl` function in `pdfStylingHelpers.js` already prioritizes `headerLogoDataUri` first, so this approach works seamlessly
- Error handling ensures PDF generation continues even if logo conversion fails
- File paths are normalized to handle various formats consistently
- MIME type detection supports common image formats with fallback to PNG
