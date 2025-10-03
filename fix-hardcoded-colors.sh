#!/bin/bash

# Fix hardcoded colors in specific files
# This script targets the most common hardcoded color patterns

echo "Fixing hardcoded colors in PaymentConfiguration.jsx..."
sed -i 's/color="gray\.700"/color={labelColor}/g' frontend/src/pages/payments/PaymentConfiguration.jsx

echo "Fixing hardcoded colors in profile/index.jsx..."
sed -i 's/color="gray\.700"/color={labelColor}/g' frontend/src/pages/profile/index.jsx

echo "Fixing hardcoded colors in CreateProposal files..."
sed -i 's/color="gray\.700"/color={headingColor}/g' frontend/src/pages/proposals/CreateProposal/CustomerInfo.jsx
sed -i 's/color="gray\.700"/color={headingColor}/g' frontend/src/pages/proposals/CreateProposal/FileUploadSection.jsx

echo "Fixing hardcoded colors in SettingsTab.jsx..."
sed -i 's/color="gray\.700"/color={labelColor}/g' frontend/src/pages/settings/manufacturers/tabs/SettingsTab.jsx

echo "Done!"
