# Codex UI Migration Instructions

## Current Stage (as of latest session)
- Project mid-migration from CoreUI to Chakra UI per `nj-cabinets-ui-ux-playbook.md`.
- High-level layout/components (App shell, modals, contact module, dashboard, manufacturers list, calendar) now Chakra-based and compiling.
- Proposal-specific modules (`ItemSelectionContent`, `ItemSelectionContentEdit`, `EditProposal`, etc.) remain partially converted; they still contain CoreUI fragments and broken JSX, blocking `vite build`.
- Build currently fails at `frontend/src/pages/proposals/EditProposal/EditProposal.jsx` due to malformed JSX after partial migration.

## Immediate Priorities
1. **Proposal Editing Module**
   - Convert `ItemSelectionContent.jsx` and `ItemSelectionContentEdit.jsx` by mirroring the legacy (`git show HEAD:`) structure and replacing CoreUI controls (`CFormCheck`, `CFormSwitch`, `CIcon`, etc.) with Chakra + `lucide-react` equivalents.
   - Remove inline Bootstrap classes where possible; use Chakra props for spacing/flex while retaining layout fidelity.
   - Reconcile large helper functions (pricing, showroom logic) unchanged—only touch JSX/wiring for UI elements.
2. **`EditProposal.jsx`**
   - Rebuild form shell, inline styles, modals, and action bars with Chakra components.
   - Keep Formik logic intact; ensure `pageInlineStyles` is either converted to Chakra responsive props or left as a `<style>` block if necessary, but ensure JSX closes properly.
3. **Re-run `npm run build:frontend`** after each major module to surface remaining syntax issues.
4. Continue with remaining files from `Files with Problems - Grouped.txt`, tackling group by group until build passes.

## Conversion Pattern (repeat for each file)
1. **Inspect Legacy Reference**
   - `git show HEAD:<path>` to capture the last known working CoreUI layout.
   - Note component imports, layout structure, and interactive behaviors.
2. **Review Current File**
   - Identify partial conversions, stray closing tags, leftover CoreUI components.
   - List elements to swap (e.g., `CButton → Button`, `CListGroup → Stack`, `CIcon → Icon`).
3. **Rewrite JSX Segments**
   - Replace CoreUI components with Chakra analogs.
   - Recreate layout using Chakra primitives (`Flex`, `Stack`, `Grid`, `Card`, `Badge`, etc.).
   - Ensure touch targets ≥ 44px, apply responsive props per playbook.
4. **Icons**
   - Import icons from `lucide-react` or existing centralized exports (e.g., `@/icons-lucide`) per playbook guidance.
5. **Forms/Inputs**
   - Use Chakra `FormControl`, `FormLabel`, `Input`, `Select`, `Checkbox`, `Switch`, `Textarea`.
6. **Buttons & Links**
   - `Button` with `variant`/`colorScheme`; convert inline bootstrap classes to Chakra props.
7. **Conditional Renders**
   - Maintain logic; rewrite wrappers using Chakra `Box`/`Flex`.
8. **Clean Up**
   - Remove leftover inline `<style>` blocks when feasible; if complexity high, keep but ensure closing tags correct.
   - Strip unused imports.
9. **Validate**
   - Run `rg "C[A-Z]"` to ensure no CoreUI components remain.
   - `npm run build:frontend` after batch conversions.

## Outstanding Work Queue (ordered)
1. `frontend/src/components/ItemSelectionContent.jsx` (large Chakra rebuild)
2. `frontend/src/components/ItemSelectionContentEdit.jsx`
3. `frontend/src/pages/proposals/EditProposal/EditProposal.jsx`
4. Remaining proposal subcomponents (check `Files with Problems - Grouped.txt` Group 3A)
5. Remaining settings/manufacturer files (Group 3C) not yet converted
6. Miscellaneous components listed in Group 1D once core proposal paths compile

## Notes & Reminders
- Do **not** alter business logic or data flow—UI markup only.
- Keep translations (`t('...')`) untouched.
- Preserve accessibility (aria-labels, focus management, keyboard handlers).
- For reusable icons, consider centralizing imports (`@/icons-lucide`) to avoid import sprawl.
- After each major change, commit logically if version control is used (not requested yet, but keep diffs clean).
