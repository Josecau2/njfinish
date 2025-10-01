# Playbook Audit Summary

**Date:** 2025-10-01
**Script:** `scripts/audit-playbook-violations.mjs`
**Based on:** `UI_EXECUTION_PLAYBOOK.md`

---

## 📊 Total Violations Found: 1,993

This audit is MORE comprehensive than AUDIT-VIOLATIONS.md because it checks for:
- All UI_EXECUTION_PLAYBOOK.md requirements
- i18n coverage (hardcoded strings)
- Data attributes for testing
- Focus indicators
- Icon sizing standards
- More granular spacing checks

---

## Violations by Category

### 1. Hardcoded Colors: 194
**Playbook Rule:** Use Chakra color tokens (theme.colors)
**Status:** ✅ Partially fixed (7 instances)
**Remaining:** 187

**Issues:**
- Colors in useColorModeValue() calls
- Colors in linear-gradient CSS
- Colors in complex conditional logic
- Custom contrast calculation functions

**Manual Work Required:**
- Many are in DataTable components with useColorModeValue
- Some are in contrast/accessibility helper functions (intentional)
- Linear gradients need gradient() Chakra syntax

---

### 2. Hardcoded px Values: 116
**Playbook Rule:** Use spacing tokens (4, 6, 8, etc.) not hardcoded px
**Status:** ⚠️ Not fixed
**Remaining:** 116

**Issues:**
- Skeleton loading heights (60px, 200px, 150px, 48px)
- Border widths (1px)
- Specific spacing values (8px, 44px)

**Why Not Fixed:**
- 44px is WCAG tap target minimum (intentional)
- 1px borders are standard (not spacing)
- Skeleton heights are content-specific

**Recommendation:** Accept these as valid exceptions

---

### 3. Inline Styles: 246
**Playbook Rule:** Use Chakra props, not style={{}}
**Status:** ✅ Partially fixed (12 instances in earlier session)
**Remaining:** 234

**Issues:**
- Complex multi-property styles
- Dynamic computed styles
- Third-party component wrappers

**Manual Work Required:**
- Convert style objects to Chakra props case-by-case
- Some may need custom components

---

### 4. Missing i18n: 55
**Playbook Rule:** All user-facing strings via i18n keys
**Status:** ⚠️ Not automated
**Remaining:** 55

**Common violations:**
- "Submit", "Cancel", "Save", "Delete", "Edit"
- "Create", "Add", "Remove"
- "Search", "Filter", "Export"
- "Loading", "Error", "Success"

**Manual Work Required:**
- Wrap each string with t('key', 'fallback')
- Add keys to translation files

---

### 5. Small Tap Targets (<44x44px): 808
**Playbook Rule:** All interactive elements >= 44×44px
**Status:** ✅ Partially fixed (18+ manually from earlier)
**Remaining:** ~790

**Issues:**
- Buttons without minH="44px"
- IconButtons without minW/minH="44px"

**Why Not Automated:**
- Regex breaks arrow functions in JSX
- Requires AST-based tooling or manual fixes

---

### 6. Missing minW (overflow risk): 10
**Playbook Rule:** Elements with overflow should have minW="0"
**Status:** ⚠️ Low priority
**Remaining:** 10

**Manual Review Needed:** Check if these actually cause overflow

---

### 7. Modal Issues: 68
**Playbook Rule:** scrollBehavior="inside" on all Modals
**Status:** ⚠️ Not automated
**Remaining:** 68

**Why Not Fixed:**
- Same regex issue as buttons (breaks arrow functions)
- Manual addition required

---

### 8. Non-Standard Spacing: 22
**Playbook Rule:** Use spacing={4} or spacing={6}
**Status:** ✅ Mostly fixed (363 in earlier session)
**Remaining:** 22

**Remaining are likely:**
- spacing={0} (intentional)
- spacing={8} (intentional large gaps)
- Custom layout-specific values

---

### 9. Non-Standard Icon Sizes: 1
**Playbook Rule:** Use 16px, 20px, 24px (ICON.sm/md/lg)
**Status:** ✅ Mostly compliant
**Remaining:** 1

**Low Priority** - audit may have false positive

---

### 10. Bootstrap Classes: 490
**Playbook Rule:** Use Chakra components, not Bootstrap
**Status:** ⚠️ Not automated
**Remaining:** 490

**Common classes:**
- `d-flex`, `d-block`, `d-none`
- `justify-content-*`, `align-items-*`
- `container`, `container-fluid`, `row`, `col-*`
- `p-*`, `m-*`, `pt-*`, `pb-*`
- `bg-*`, `border-*`, `rounded-*`

**Manual Work Required:**
- Convert Bootstrap grid to Chakra Grid/SimpleGrid
- Convert utility classes to Chakra props
- Large refactoring effort

---

### 11. Custom CSS Blocks: 20
**Playbook Rule:** No <style> tags, use Chakra props
**Status:** ⚠️ Not automated
**Remaining:** 20

**Files with <style> blocks:**
- withDynamicContrast.jsx
- PrintPaymentReceiptModal.jsx
- calender/index.jsx
- contracts/index.jsx
- And 16 more

**Manual Work Required:**
- Complex CSS needs component restructuring
- Some may require CSS-in-JS libraries

---

### 12. Missing Data Attributes: 3
**Playbook Rule:** Add data-app-header, data-page-container for testing
**Status:** ✅ Easy fix
**Remaining:** 3

**Files:**
- CreateProposalForm.jsx
- CustomizationPage.jsx
- CreateUserGroup.jsx

**Manual Fix:** Add appropriate data-* attributes

---

### 13. Missing Focus Indicators: 1
**Playbook Rule:** outline="none" must have _focus replacement
**Status:** ✅ Easy fix
**Remaining:** 1

**File:** ManufacturerSelect.jsx:276

**Manual Fix:** Add focusBorderColor or _focus={{}}

---

## 🎯 Priority Fixes

### High Priority (Impacts UX/A11y)
1. **Tap Targets (808)** - WCAG AA compliance
2. **i18n (55)** - Internationalization
3. **Modal scrollBehavior (68)** - Mobile UX

### Medium Priority (Code Quality)
4. **Bootstrap Classes (490)** - Technical debt
5. **Inline Styles (234)** - Maintainability
6. **Hardcoded Colors (187)** - Design system consistency

### Low Priority (Edge Cases)
7. **Custom CSS (20)** - Complex refactoring
8. **Data Attributes (3)** - Testing helpers
9. **Focus Indicators (1)** - Single instance
10. **Hardcoded px (116)** - Mostly valid exceptions

---

## 🔧 Scripts Created

1. **audit-playbook-violations.mjs** ✅ - Comprehensive audit (13 categories)
2. **fix-all-safe-violations.mjs** ✅ - Master fix script (safe transformations)
3. **fix-colors-only.mjs** ✅ - Enhanced with 9 additional colors
4. **fix-inline-styles.mjs** ✅ - Simple inline style conversions
5. **fix-spacing.mjs** ✅ - Spacing standardization

---

## 📈 Progress Tracking

### Session 1 (AUDIT-VIOLATIONS.md)
- Started: 1,591 violations
- Fixed: 491 violations (31%)
- Remaining: 1,100 violations

### Session 2 (Playbook Audit)
- Found: 2,000 violations (more comprehensive)
- Fixed: 7 violations (colors)
- Remaining: 1,993 violations

### Combined Total
- **Violations Fixed: 498**
- **Violations Remaining: ~3,093** (with overlap)

---

## 🚀 Recommendations

### For Immediate Action
1. Manually fix 3 data attributes (5 minutes)
2. Fix 1 focus indicator (2 minutes)
3. Start i18n migration (1-2 days)

### For Sprint Planning
1. **Tap Targets Fix** - Dedicate 2-3 days for manual minH additions
2. **Modal Updates** - 1 day to add scrollBehavior to 68 modals
3. **Bootstrap Migration** - Multi-week effort, plan phased approach

### For Long-term Roadmap
1. **i18n Complete Coverage** - Ongoing as features are added
2. **Bootstrap Removal** - Gradual migration to pure Chakra
3. **Custom CSS Elimination** - Component library improvements

---

## ✅ Definition of Done

A violation is "fixed" when:
- [ ] Code follows UI_EXECUTION_PLAYBOOK.md exactly
- [ ] Build passes
- [ ] Playwright tests pass
- [ ] No visual regressions
- [ ] Committed with descriptive message

---

**Generated:** 2025-10-01
**Next Run:** `node scripts/audit-playbook-violations.mjs`
**View Details:** `playbook-audit-report.json`
