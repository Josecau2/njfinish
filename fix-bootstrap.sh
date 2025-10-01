#!/bin/bash

# Batch fix Bootstrap conflicts in JSX files
# This script removes common Bootstrap class patterns

files=(
  "frontend/src/pages/admin/ContractorDetail/ProposalsTab.jsx"
  "frontend/src/pages/admin/ContractorDetail/SettingsTab.jsx"
  "frontend/src/pages/orders/OrdersList.jsx"
  "frontend/src/pages/payments/PaymentsList.jsx"
  "frontend/src/pages/customers/AddCustomerForm.jsx"
  "frontend/src/pages/customers/CustomerForm.jsx"
  "frontend/src/pages/profile/index.jsx"
  "frontend/src/pages/settings/globalMods/GlobalModsPage.jsx"
  "frontend/src/pages/settings/locations/CreateLocation.jsx"
  "frontend/src/pages/settings/manufacturers/ManufacturersForm.jsx"
  "frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx"
  "frontend/src/pages/settings/manufacturers/tabs/FilesHistoryTab.jsx"
  "frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx"
  "frontend/src/pages/settings/multipliers/EditManuMultiplier.jsx"
  "frontend/src/pages/settings/users/UserList.jsx"
  "frontend/src/pages/settings/usersGroup/CreateUserGroup.jsx"
)

echo "Fixing Bootstrap className conflicts..."
echo "Files to process: ${#files[@]}"

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"

    # Remove common Bootstrap classes
    sed -i 's/ className="text-center"//g' "$file"
    sed -i 's/ className="text-muted"//g' "$file"
    sed -i 's/ className="text-primary"//g' "$file"
    sed -i 's/ className="text-success"//g' "$file"
    sed -i 's/ className="text-warning"//g' "$file"
    sed -i 's/ className="text-info"//g' "$file"
    sed -i 's/ className="text-danger"//g' "$file"
    sed -i 's/ className="mb-[0-9]"//g' "$file"
    sed -i 's/ className="mt-[0-9]"//g' "$file"
    sed -i 's/ className="me-[0-9]"//g' "$file"
    sed -i 's/ className="ms-[0-9]"//g' "$file"
    sed -i 's/ className="p-[0-9]"//g' "$file"
    sed -i 's/ className="d-flex justify-content-between align-items-center"//g' "$file"
    sed -i 's/ className="d-flex"//g' "$file"
    sed -i 's/ className="d-none d-md-block"//g' "$file"
    sed -i 's/ className="d-md-none"//g' "$file"
    sed -i 's/ className="border-end"//g' "$file"

  else
    echo "File not found: $file"
  fi
done

echo "✓ Batch fix complete"
