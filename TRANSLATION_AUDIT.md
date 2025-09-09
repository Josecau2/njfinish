# Translation Audit (EN/ES) – Initial Pass

Purpose: Track hard‑coded (or currently untranslated) UI strings that must be externalized for English / Spanish localization. Seeded from Mobile Optimization Audit scope: Login, Locations, Manufacturers, Multipliers, Manufacturer Select (Create Proposal), Notifications, Orders, Payments, Quotes (Proposals), Global Mods, Modals (ModificationBrowserModal, ModificationModal, ModificationModalEdit, EditGroupModal, PrintProposalModal, ProposalAcceptanceModal, TermsModal).

Legend:
- STATUS: pending = not yet extracted to i18n keys; partial = some keys exist, some hardcoded remain; done = all strings mapped to keys.
- KEY SUGGESTION: Proposed i18n key namespace. Adjust to project conventions.
- NOTES: Context / plurals / interpolation / a11y.

## 1. Global / Common
| String (EN) | Location(s) | Suggested Key | Notes | Status |
|-------------|-------------|---------------|-------|--------|
| Accept | various modals/buttons | common.accept | Confirm semantic vs. Accept Terms vs. Accept Proposal (use specific keys where needed). | pending |
| Cancel | various | common.cancel | Already exists (seen in `t('common.cancel')`). | done |
| Success | SweetAlert, toasts | common.success | Ensure Spanish accent (Éxito?) chosen per style guide (often just "Éxito" or "Correcto"). | partial |
| Error | alerts, SweetAlert | common.error | Exists. Verify consistent usage. | partial |
| Warning | SweetAlert, alerts | common.warning | Provide consistent capitalization. | partial |
| N/A | table fallbacks | common.na | Exists. | done |

## 2. TermsModal (`components/TermsModal.jsx`)
Refactored: All previously hardcoded strings replaced with `termsModal.*` keys (see locale files). Status: done

## 3. ProposalAcceptanceModal (`components/ProposalAcceptanceModal.jsx`)
Most strings already using `t()`. Verify keys exist:
- proposalAcceptance.title, details, labels.customer, labels.total, labels.status, labels.description, warningTitle, warningText, externalCheck, externalInfo, signerName, signerNamePlaceholder, signerEmail, signerEmailPlaceholder, externalHint, acceptButton, errors.*
Status: done (no apparent hardcoded user‑visible text outside translations)

## 4. ModificationBrowserModal (`components/model/ModificationBrowserModal.jsx`)
Refactored: All enumerated strings replaced with `modificationBrowser.*` keys. Remaining TODO: pluralization for "modification(s)" count label and dynamic side labels inside configurable sections if added later. Status: done (except pluralization enhancement)

## 5. LocationList (`pages/settings/locations/LocationList.jsx`)
Already translated via t(): header, subtitle, add button, search placeholder, stats, table headers, empty state, actions, pagination, etc. No remaining raw user‑facing strings except possibly icon alt text (none) and numeric '#'.
Status: done

## 6. Remaining Target Components (survey – not yet deeply scanned this pass)
List from Mobile Optimization Audit needing review for hardcoded strings:
- LoginPage
- CreateLocation / EditLocation
- ManufacturersList / ManufacturersForm / EditManufacturer & Tabs (TypesTab, StylePicturesTab, SettingsTab, FilesHistoryTab, EditManufacturerTab, CatalogMappingTab)
- ManuMultipliers (User Group Multipliers)
- ManufacturerSelect (in CreateProposal step component: `ManufacturerStep` / `ManufacturerSelect`)
- NotificationsPage & related components (alerts, modals, badges, toasts subfolders) – ensure dynamic labels/pagination
- Orders (list/cards)
- Payments + PaymentSuccess / PaymentCancel / PaymentTest pages
- Proposals: Proposals.jsx (listing), CreateProposalForm.jsx, EditProposal.jsx, PrintProposalModal.jsx
- ModificationModal / ModificationModalEdit
- EditGroupModal
- PrintPaymentReceiptModal

Action: Each file requires grep for visible strings not already wrapped with t().

## 7. Methodology for Extraction
1. Scan components for string literals inside JSX that are not:
   - Passed to t('...')
   - Part of config/placeholder data coming from backend (unless fallback hardcoded)
2. For each, propose key: <area>.<component>.<semanticName>
3. Add to this file with Status pending.
4. Implement i18n extraction in code: replace literal with {t('key', { vars })}.
5. Add Spanish translation file entries (e.g., `frontend/src/locales/es/<namespace>.json`).
6. Mark items as done.

## 8. Spanish Translation Guidelines (Draft)
- Maintain sentence case unless UI style guide specifies Title Case.
- Avoid literal translation of domain-specific terms if brand uses English (e.g., "mod" vs. "modificación"). Provide glossary (future section).
- Use interpolations for dynamic values: {count}, {name}, {days}, etc.
- For buttons, prefer concise verbs: Save = Guardar, Cancel = Cancelar, Accept = Aceptar, Close = Cerrar, Back = Atrás.

## 9. Next Steps Checklist
- [ ] Deep scan remaining components (Section 6) and append findings here.
- [ ] Approve key naming convention.
- [ ] Generate initial EN & ES resource JSON with new keys.
- [ ] Refactor components (TermsModal, ModificationBrowserModal, etc.).
- [ ] QA pass with language toggle.

## 10. Example Resource Snippet (EN)
```
{
  "terms": {
    "title": "Terms & Conditions",
    "empty": "No terms available.",
    "forced": { "requiredLabel": "Required:", "requiredMessage": "You must accept these terms to continue using the application." },
    "scrollPrompt": "Scroll to enable Accept",
    "reviewPrompt": "Review terms",
    "rejectAndLogout": "Reject & Logout",
    "accept": "Accept"
  },
  "modificationBrowser": {
    "title": "Modifications",
    "breadcrumb": { "root": "All" },
    "buttons": { "back": "Back", "close": "Close" },
    "search": { "placeholder": "Search" },
    "loading": "Loading modifications...",
    "empty": { "title": "No Modifications Available", "subtitle": "No modifications have been assigned to this catalog item.", "hint": "Contact your administrator to set up modifications for this item." },
    "category": { "browse": "Browse →" },
    "template": { "configure": "Configure →", "status": { "ready": "Ready", "draft": "Draft" }, "price": { "overrideShort": "(Override)", "overrideLabel": "Override price" } },
    "leadTime": { "noticeTitle": "Please Note:", "noticeText": "This item has an extended lead time of {{days}} days." },
    "qty": { "label": "Qty" },
    "actions": { "addModification": "Add modification" },
    "config": {
      "sideSelection": "Side Selection",
      "side": { "left": "Left", "right": "Right" },
      "notes": { "label": "Notes", "empty": "No additional notes configured for this modification." },
      "fileUpload": { "defaultTitle": "File Upload", "aria": "Upload files for modification" }
    }
  }
}
```

## 11. Example Resource Snippet (ES Draft – requires review)
```
{
  "terms": {
    "title": "Términos y Condiciones",
    "empty": "No hay términos disponibles.",
    "forced": { "requiredLabel": "Requerido:", "requiredMessage": "Debe aceptar estos términos para continuar usando la aplicación." },
    "scrollPrompt": "Desplácese para habilitar Aceptar",
    "reviewPrompt": "Revisar términos",
    "rejectAndLogout": "Rechazar y Cerrar sesión",
    "accept": "Aceptar"
  },
  "modificationBrowser": {
    "title": "Modificaciones",
    "breadcrumb": { "root": "Todas" },
    "buttons": { "back": "Atrás", "close": "Cerrar" },
    "search": { "placeholder": "Buscar" },
    "loading": "Cargando modificaciones...",
    "empty": { "title": "No hay modificaciones", "subtitle": "No se han asignado modificaciones a este artículo del catálogo.", "hint": "Contacte a su administrador para configurarlas." },
    "category": { "browse": "Explorar →" },
    "template": { "configure": "Configurar →", "status": { "ready": "Lista", "draft": "Borrador" }, "price": { "overrideShort": "(Anulado)", "overrideLabel": "Precio anulado" } },
    "leadTime": { "noticeTitle": "Nota:", "noticeText": "Este artículo tiene un tiempo adicional de entrega de {{days}} días." },
    "qty": { "label": "Cant." },
    "actions": { "addModification": "Agregar modificación" },
    "config": {
      "sideSelection": "Selección de lado",
      "side": { "left": "Izquierda", "right": "Derecha" },
      "notes": { "label": "Notas", "empty": "No hay notas adicionales configuradas para esta modificación." },
      "fileUpload": { "defaultTitle": "Subir archivo", "aria": "Subir archivos para la modificación" }
    }
  }
}
```

---
Incremental updates: continue appending new findings below.
