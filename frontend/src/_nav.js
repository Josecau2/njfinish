import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
  cilIndustry,
  cilChatBubble
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { hasPermission, isContractor, hasModuleAccess, isAdmin } from './helpers/permissions'

const useNavItems = () => {
  const [navItems, setNavItems] = useState([])
  const { t, i18n } = useTranslation()

  // Prefer Redux auth user, fallback to localStorage once on mount
  const authUser = useSelector((state) => state.auth?.user)
  const user = useMemo(() => {
    if (authUser) return authUser
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  }, [authUser])

  useEffect(() => {
    const buildNavigation = () => {
      // Check for user ID in multiple possible locations
      const hasUserId = user?.userId || user?.id;
      if (!hasUserId) {
        setNavItems([]);
        return;
      }

      const navigationItems = [];

      // Dashboard - always visible
      navigationItems.push({
        component: CNavItem,
        name: t('nav.dashboard'),
        to: '/',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
      });

  // Proposals section
      if (hasPermission(user, 'proposals:read')) {
        const proposalItems = [
          { component: CNavItem, name: t('nav.viewProposals'), to: '/quotes' }
        ];

        if (hasPermission(user, 'proposals:create')) {
          proposalItems.push({ component: CNavItem, name: t('nav.createProposal'), to: '/quotes/create' });
        }

  // Contracts: visible only to non-contractors
  if (!isContractor(user)) {
          proposalItems.push({ component: CNavItem, name: t('nav.contracts'), to: '/contracts' });
        }

        navigationItems.push({
          component: CNavGroup,
          name: t('nav.proposals'),
          icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
          items: proposalItems,
        });
      }

  // Orders section - visible when user can read proposals
      if (hasPermission(user, 'proposals:read')) {
        if (isContractor(user)) {
          // Contractors: single link to My Orders (no dropdown)
          navigationItems.push({
            component: CNavItem,
            name: t('nav.myOrders', 'My Orders'),
            to: '/my-orders',
            icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
          })
        } else {
          // Admins/standard users: dropdown with Orders (all) and My Orders
          const ordersItems = [
            { component: CNavItem, name: t('nav.orders', 'Orders'), to: '/orders' },
            { component: CNavItem, name: t('nav.myOrders', 'My Orders'), to: '/my-orders' },
          ]
          navigationItems.push({
            component: CNavGroup,
            name: t('nav.orders', 'Orders'),
            icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
            items: ordersItems,
          })
        }
      }

      // Customers section
      if (hasPermission(user, 'customers:read')) {
        const customerItems = [
          { component: CNavItem, name: t('nav.viewCustomers'), to: '/customers' }
        ];

        if (hasPermission(user, 'customers:create')) {
          customerItems.push({ component: CNavItem, name: t('nav.addCustomer'), to: '/customers/add' });
        }

        navigationItems.push({
          component: CNavGroup,
          name: t('nav.customers'),
          icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
          items: customerItems,
        });
      }

      // Resources section
      if (hasPermission(user, 'resources:read')) {
        navigationItems.push({
          component: CNavItem,
          name: t('nav.resources'),
          to: '/resources',
          icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
        });
      }

      // Contact Us - visible to all authenticated users
      navigationItems.push({
        component: CNavItem,
        name: t('nav.contactUs'),
        to: '/contact',
        icon: <CIcon icon={cilChatBubble} customClassName="nav-icon" />,
      });

      // Notifications - show as a direct link for non-admin users
      if (!isAdmin(user)) {
        navigationItems.push({
          component: CNavItem,
          name: t('nav.notifications'),
          to: '/notifications',
          icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
        });
      }

      // Calendar section
      if (hasModuleAccess(user, 'calendar')) {
        navigationItems.push({
          component: CNavItem,
          name: t('nav.calendar'),
          to: '/calender',
          icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
        });
      }

      // Admin section
      if (isAdmin(user)) {
        const adminItems = [];

        if (hasPermission(user, 'admin:contractors')) {
          adminItems.push({ component: CNavItem, name: t('nav.contractors'), to: '/admin/contractors' });
        }

        if (hasPermission(user, 'admin:notifications')) {
          adminItems.push({ component: CNavItem, name: t('nav.notifications'), to: '/admin/notifications' });
        }

        if (adminItems.length > 0) {
          navigationItems.push({
            component: CNavGroup,
            name: t('nav.admin'),
            icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
            items: adminItems,
          });
        }
      }

      // Settings section - only for admin users
      if (isAdmin(user)) {
        const settingsItems = [];

        // User Management
        if (hasPermission(user, 'settings:users') || hasPermission(user, 'settings:groups')) {
          const userManagementItems = [];
          
          // Add Users if user has permission
          if (hasPermission(user, 'settings:users')) {
            userManagementItems.push({ component: CNavItem, name: t('nav.users'), to: '/settings/users' });
          }
          
          // Add User Groups if user has permission
          if (hasPermission(user, 'settings:groups')) {
            userManagementItems.push({ component: CNavItem, name: t('nav.userGroups'), to: '/settings/users/groups' });
          }
          
          settingsItems.push({
            component: CNavGroup,
            name: t('nav.userManagement'),
            icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
            items: userManagementItems,
          });
        }

        // Manufacturers
        if (hasPermission(user, 'settings:manufacturers')) {
          settingsItems.push({
            component: CNavGroup,
            name: t('nav.manufacturers'),
            icon: <CIcon icon={cilIndustry} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: t('nav.manufacturers'), to: '/settings/manufacturers' },
              { component: CNavItem, name: t('nav.multipliers'), to: '/settings/usergroup/multipliers' },
            ],
          });
        }

        // Locations
        if (hasPermission(user, 'settings:locations')) {
          settingsItems.push({
            component: CNavItem,
            name: t('nav.locations'),
            to: '/settings/locations',
            icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
          });
        }

        // Taxes
        if (hasPermission(user, 'settings:taxes')) {
          settingsItems.push({
            component: CNavItem,
            name: t('nav.taxes'),
            to: '/settings/taxes',
            icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
          });
        }

        // Customization
        if (hasPermission(user, 'settings:customization')) {
          settingsItems.push({
            component: CNavGroup,
            name: t('nav.customization'),
            icon: <CIcon icon={cilBrush} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: t('nav.general'), to: '/settings/customization' },
              { component: CNavItem, name: t('nav.pdfLayout'), to: '/settings/pdflayoutcustomization' },
              { component: CNavItem, name: t('nav.loginPage'), to: '/settings/loginlayoutcustomization' },
              { component: CNavItem, name: t('nav.uiCustomization'), to: '/settings/ui-customization' },
              { component: CNavItem, name: t('nav.terms', 'Terms & Conditions'), to: '/settings/terms' },
            ],
          });
        }

        if (settingsItems.length > 0) {
          navigationItems.push({
            component: CNavGroup,
            name: t('nav.settings'),
            icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
            items: settingsItems,
          });
        }
      }

      setNavItems(navigationItems);
    };

    buildNavigation();
  }, [user, i18n.language]);

  return navItems;
};

export default useNavItems;
