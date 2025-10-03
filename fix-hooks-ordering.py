import os
import re
import sys

def fix_hooks_ordering(file_path):
    """Fix React hooks ordering by moving inline useColorModeValue to top level."""

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False

    # Check if file uses useColorModeValue
    if 'useColorModeValue' not in content:
        return False

    # Find all inline useColorModeValue calls with their contexts
    inline_pattern = r'(\w+)=\{useColorModeValue\("([^"]+)",\s*"([^"]+)"\)\}'
    matches = re.findall(inline_pattern, content)

    if not matches:
        # Already fixed or no inline usage
        return False

    # Generate unique variable names for each color mode value
    color_vars = {}
    for prop, light, dark in matches:
        key = f"{light}|{dark}"
        if key not in color_vars:
            # Generate a sensible variable name
            if 'gray.50' in light or 'gray.100' in light or 'white' in light:
                var_name = f"bg{len(color_vars)+1}Color" if 'bg' in prop else f"color{len(color_vars)+1}"
            else:
                var_name = f"{prop}Color{len(color_vars)+1}" if len(color_vars) > 0 else f"{prop}Color"

            # Make unique
            base_var = var_name
            counter = 1
            while var_name in color_vars.values():
                var_name = f"{base_var}{counter}"
                counter += 1

            color_vars[key] = var_name

    # Find the component function declaration
    comp_pattern = r'(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)'
    comp_match = re.search(comp_pattern, content)

    if not comp_match:
        print(f"Could not find component declaration in {file_path}")
        return False

    # Find where to insert color declarations (after hooks like useState, useRef, etc.)
    insert_pos = comp_match.end()

    # Look for the last hook call or first const declaration
    hooks_pattern = r'(const\s+\w+\s*=\s*use\w+\([^)]*\))'
    hooks_matches = list(re.finditer(hooks_pattern, content[insert_pos:insert_pos+2000]))

    if hooks_matches:
        last_hook = hooks_matches[-1]
        insert_pos += last_hook.end()

    # Generate color variable declarations
    color_decls = []
    for key, var_name in color_vars.items():
        light, dark = key.split('|')
        color_decls.append(f'  const {var_name} = useColorModeValue("{light}", "{dark}")')

    # Insert color declarations
    if color_decls:
        insertion = '\n\n  // Dark mode colors\n' + '\n'.join(color_decls) + '\n'
        content = content[:insert_pos] + insertion + content[insert_pos:]

    # Replace inline calls with variables
    for prop, light, dark in matches:
        key = f"{light}|{dark}"
        var_name = color_vars[key]
        old = f'{prop}={{useColorModeValue("{light}", "{dark}")}}'
        new = f'{prop}={{{var_name}}}'
        content = content.replace(old, new)

    # Write back
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False

def main():
    # List of files to fix
    files = [
        "frontend/src/pages/proposals/CreateProposalForm.jsx",
        "frontend/src/pages/customers/CustomerForm.jsx",
        "frontend/src/pages/customers/EditCustomerPage.jsx",
        "frontend/src/pages/customers/AddCustomerForm.jsx",
        "frontend/src/components/ItemSelectionContent.jsx",
        "frontend/src/pages/settings/taxes/TaxesPage.jsx",
        "frontend/src/pages/settings/locations/EditLocation.jsx",
        "frontend/src/pages/settings/locations/CreateLocation.jsx",
        "frontend/src/pages/settings/locations/LocationList.jsx",
        "frontend/src/pages/settings/manufacturers/tabs/CatalogMappingTab.jsx",
        "frontend/src/pages/settings/manufacturers/tabs/TypesTab.jsx",
        "frontend/src/pages/settings/customization/PdfLayoutCustomization.jsx",
        "frontend/src/pages/admin/LeadsPage.jsx",
        "frontend/src/pages/contractor/ContractorDashboard.jsx",
        "frontend/src/pages/proposals/EditProposal.jsx",
        "frontend/src/pages/contracts/index.jsx",
        "frontend/src/components/model/ModificationBrowserModal.jsx",
        "frontend/src/pages/settings/users/CreateUser.jsx",
        "frontend/src/pages/settings/customization/CustomizationPage.jsx",
        "frontend/src/pages/settings/customization/LoginCustomizerPage.jsx",
        "frontend/src/pages/settings/manufacturers/ManufacturersList.jsx",
        "frontend/src/pages/settings/users/UserList.jsx",
        "frontend/src/pages/admin/Contractors.jsx",
        "frontend/src/pages/customers/Customers.jsx",
        "frontend/src/pages/dashboard/Dashboard.jsx",
        "frontend/src/pages/orders/OrdersList.jsx",
        "frontend/src/pages/proposals/Proposals.jsx",
        "frontend/src/pages/payments/PaymentConfiguration.jsx",
        "frontend/src/pages/payments/PaymentsList.jsx",
        "frontend/src/pages/settings/usersGroup/UserGroupList.jsx",
        "frontend/src/pages/settings/multipliers/ManuMultipliers.jsx",
        "frontend/src/pages/proposals/CreateProposal/ManufacturerSelect.jsx",
    ]

    fixed_count = 0
    for file_path in files:
        if os.path.exists(file_path):
            if fix_hooks_ordering(file_path):
                fixed_count += 1
        else:
            print(f"File not found: {file_path}")

    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
