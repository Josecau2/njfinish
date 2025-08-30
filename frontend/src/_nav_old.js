import { useEffect, useState, useMemo } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilCog,
  cilDrop,
  cilPuzzle,
  cilSpeedometer,
  cilCalendar,
  cilFolderOpen,
  cilPeople,
  cilSettings,
  cilUser,
  cilGroup,
  cilBell,
  cilNotes,
  cilLocationPin,
  cilCalculator,
  cilBrush,
  cilIndustry
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { hasPermission, isContractor, hasModuleAccess, isAdmin } from './helpers/permissions'

const useNavItems = () => {
  const [navItems, setNavItems] = useState([])

  const user = useMemo(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }, [])

  useEffect(() => {
    const buildNavigation = () => {
      if (!user?.userId) {
        console.log('No user or userId found:', user);
        setNavItems([]);
        return;
      }

      console.log('Building navigation for user:', user);
      console.log('User role:', user.role);
      console.log('User group:', user.group);

      const navigationItems = [];

      // Dashboard - always visible
      navigationItems.push({
        component: CNavItem,
        name: 'Dashboard',
        to: '/',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
      });

      // Proposals section
      if (hasPermission(user, 'proposals:read')) {
        const proposalItems = [
          { component: CNavItem, name: 'View Proposals', to: '/quotes' }
        ];

        if (hasPermission(user, 'proposals:create')) {
          proposalItems.push({ component: CNavItem, name: 'Create Proposal', to: '/quotes/create' });
        }

  // Contracts: visible only to non-contractors
  if (!isContractor(user)) {
          proposalItems.push({ component: CNavItem, name: 'Contracts', to: '/contracts' });
        }

        navigationItems.push({
          component: CNavGroup,
          name: 'Proposals',
          icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
          items: proposalItems,
        });
      }

      // Customers section
      if (hasPermission(user, 'customers:read')) {
        const customerItems = [
          { component: CNavItem, name: 'View Customers', to: '/customers' }
        ];

        if (hasPermission(user, 'customers:create')) {
          customerItems.push({ component: CNavItem, name: 'Add Customer', to: '/customers/add' });
        }

        navigationItems.push({
          component: CNavGroup,
          name: 'Customers',
          icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
          items: customerItems,
        });
      }

      // Resources section
      if (hasPermission(user, 'resources:read')) {
        navigationItems.push({
          component: CNavItem,
          name: 'Resources',
          to: '/resources',
          icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
        });
      }

      // Calendar section
      if (hasModuleAccess(user, 'calendar')) {
        navigationItems.push({
          component: CNavItem,
          name: 'Calendar',
          to: '/calender',
          icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
        });
      }

      // Admin section
      if (isAdmin(user)) {
        const adminItems = [];

        if (hasPermission(user, 'admin:contractors')) {
          adminItems.push({ component: CNavItem, name: 'Contractors', to: '/admin/contractors' });
        }

        if (hasPermission(user, 'admin:notifications')) {
          adminItems.push({ component: CNavItem, name: 'Notifications', to: '/notifications' });
        }

        if (adminItems.length > 0) {
          navigationItems.push({
            component: CNavGroup,
            name: 'Admin',
            icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
            items: adminItems,
          });
        }
      }

      // Settings section - only for admin users
      if (isAdmin(user)) {
        const settingsItems = [];

        // User Management
        if (hasPermission(user, 'settings:users')) {
          settingsItems.push({
            component: CNavGroup,
            name: 'User Management',
            icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'Users', to: '/settings/users' },
              { component: CNavItem, name: 'User Groups', to: '/settings/users/groups' },
            ],
          });
        }

        // Manufacturers
        if (hasPermission(user, 'settings:manufacturers')) {
          settingsItems.push({
            component: CNavGroup,
            name: 'Manufacturers',
            icon: <CIcon icon={cilIndustry} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'Manufacturers', to: '/settings/manufacturers' },
              { component: CNavItem, name: 'Multipliers', to: '/settings/usergroup/multipliers' },
            ],
          });
        }

        // Locations
        if (hasPermission(user, 'settings:locations')) {
          settingsItems.push({
            component: CNavItem,
            name: 'Locations',
            to: '/settings/locations',
            icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
          });
        }

        // Taxes
        if (hasPermission(user, 'settings:taxes')) {
          settingsItems.push({
            component: CNavItem,
            name: 'Taxes',
            to: '/settings/taxes',
            icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
          });
        }

        // Customization
        if (hasPermission(user, 'settings:customization')) {
          settingsItems.push({
            component: CNavGroup,
            name: 'Customization',
            icon: <CIcon icon={cilBrush} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'General', to: '/settings/customization' },
              { component: CNavItem, name: 'PDF Layout', to: '/settings/pdflayoutcustomization' },
              { component: CNavItem, name: 'Login Page', to: '/settings/loginlayoutcustomization' },
              { component: CNavItem, name: 'UI Customization', to: '/settings/ui-customization' },
            ],
          });
        }

        if (settingsItems.length > 0) {
          navigationItems.push({
            component: CNavGroup,
            name: 'Settings',
            icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
            items: settingsItems,
          });
        }
      }

      console.log('Final navigation items:', navigationItems);
      setNavItems(navigationItems);
    };

    buildNavigation();
  }, [user]);

  return navItems;
};

export default useNavItems;
      }

      // Use role_id from localStorage if available, otherwise fallback to API call
      let role = user.role_id;
      console.log('User data:', user);
      console.log('Role from localStorage:', role);
      
      if (!role) {
        try {
          const axiosInstance = (await import('./helpers/axiosInstance')).default;
          const res = await axiosInstance.get(`/api/user-role/${user.userId}`);
          role = res.data.role;
          console.log('Role from API:', role);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          console.warn('User not found in database, clearing localStorage and defaulting to basic navigation');
          
          // Clear invalid user data from localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          
          // Set a default role for basic navigation or redirect to login
          role = ROLE_USER; // or redirect to login page
        }
      }

      console.log('Final role for navigation:', role);
      console.log('User group info:', user.group);
      console.log('ROLE_ADMIN constant:', ROLE_ADMIN);
      console.log('ROLE_USER constant:', ROLE_USER);

      const base = [
        {
          component: CNavItem,
          name: 'Dashboard',
          to: '/',
          icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
        }
      ]

      // Check if user is in a contractor group
      const isContractor = user.group && user.group.group_type === 'contractor';
      const contractorModulesObj = user.group?.modules || {};
      const contractorModules = Object.keys(contractorModulesObj).filter(key => contractorModulesObj[key] === true);

      if (isContractor) {
        console.log('Adding contractor navigation items');
        console.log('Contractor modules:', contractorModules);
        
        // Only show base dashboard (always visible)
        const contractorNav = [];

        // Add modules based on enabled toggles
        if (contractorModules.includes('proposals')) {
          contractorNav.push({
            component: CNavGroup,
            name: 'Proposals',
            icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'View Proposals', to: '/quotes' },
              { component: CNavItem, name: 'Create Proposal', to: '/quotes/create' },
            ],
          });
        }

        if (contractorModules.includes('customers')) {
          contractorNav.push({
            component: CNavItem,
            name: 'Customers',
            to: '/customers',
            icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
          });
        }

        if (contractorModules.includes('resources')) {
          contractorNav.push({
            component: CNavItem,
            name: 'Resources',
            to: '/resources',
            icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
          });
        }

        base.push(...contractorNav);
      } else if (role === ROLE_ADMIN) {
        console.log('Adding admin navigation items');
        base.push(
          {
            component: CNavItem,
            name: 'Customers',
            to: '/customers',
            icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
          },
          {
            component: CNavGroup,
            name: 'Proposals',
            icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'New Proposal', to: '/quotes' },
              { component: CNavItem, name: 'Contracts', to: '/contracts' },
            ],
          },
          {
            component: CNavItem,
            name: 'Contractors',
            to: '/admin/contractors',
            icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
          },
          {
            component: CNavItem,
            name: 'Calender',
            to: '/calender',
            icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
          },
          {
            component: CNavItem,
            name: 'Resources',
            to: '/resources',
            icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
          },
          {
            component: CNavGroup,
            name: 'Settings',
            icon: <CIcon icon={cilCog} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'Manufactureres', to: '/settings/manufacturers' },
              { component: CNavItem, name: 'User Group Multipliers', to: '/settings/usergroup/multipliers' },
              { component: CNavItem, name: 'Users', to: '/settings/users' },
              { component: CNavItem, name: 'User Groups', to: '/settings/users/groups' },
              { component: CNavItem, name: 'Taxes', to: '/settings/taxes' },
              { component: CNavItem, name: 'Locations', to: '/settings/locations' },
              { component: CNavItem, name: 'UI Customization', to: '/settings/ui-customization' },
            ],
          }
        )
      } else if (role === ROLE_USER) {
        console.log('Adding user navigation items');
        base.push({
          component: CNavGroup,
          name: 'Proposals',
          icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
          items: [
            { component: CNavItem, name: 'New Proposal', to: '/quotes' },
            { component: CNavItem, name: 'Contracts', to: '/contracts' },
          ],
        })
      } else {
        console.log('Role does not match any expected values. Role:', role, typeof role);
        console.log('Is contractor:', isContractor);
      }

      console.log('Final navigation items:', base);
      setNavItems(base)
    }

    fetchNavItems()
  }, [user?.userId])

  return navItems
}

export default useNavItems