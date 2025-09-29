This folder contains Create Proposal steps.

Recently fixed components:
- CustomerInfo.jsx: added missing Chakra Flex import.
- DesignUpload.jsx: fully replaced with valid Chakra-based implementation.
- FileUploadSection.jsx: fixed Modal structure and upload toast errors.
- ManufacturerSelect.jsx: cleaned corrupted JSX around onKeyDown handler and trailing junk.
- ProposalEditor.jsx: replaced with a small Chakra Alert placeholder.

Note: Removed the duplicate mistakenly-named file `FileUploadSection .jsx` (with a space) if present; ensure imports reference `./FileUploadSection`.
