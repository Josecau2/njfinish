import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  FileSignature,
  ClipboardList,
  Users,
  UserPlus,
  FolderOpen,
  MessageCircle,
  Bell,
  CalendarDays,
  Settings,
  Building2,
  Factory,
  Paintbrush,
  MapPin,
  CreditCard,
  Calculator,
  User,
  Settings2,
  FileImage,
  BookOpen,
  ScrollText,
  Cog,
  Box as BoxIcon,
} from 'lucide-react'
import { hasPermission, isContractor, hasModuleAccess, isAdmin } from './helpers/permissions'

const icon = (IconComponent) => IconComponent

const useNavItems = () => {
  const { t } = useTranslation()
  const authUser = useSelector((state) => state.auth?.user)
  const user = useMemo(() => {
    if (authUser) return authUser
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }, [authUser])

  const [navItems, setNavItems] = useState([])

  useEffect(() => {
    if (!user?.userId && !user?.id) {
      setNavItems([])
      return
    }

    const items = []

    items.push({
      type: 'link',
      label: t('nav.dashboard'),
      to: '/',
      icon: icon(LayoutDashboard),
    })

    if (hasPermission(user, 'proposals:read')) {
      const proposalChildren = [
        { type: 'link', label: t('nav.viewQuotes', 'View Quotes'), to: '/quotes', icon: icon(FileText) },
      ]

      if (hasPermission(user, 'proposals:create')) {
        proposalChildren.push({
          type: 'link',
          label: t('nav.createQuote', 'Create Quote'),
          to: '/quotes/create',
          icon: icon(FilePlus),
        })
      }

      if (!isContractor(user)) {
        proposalChildren.push({
          type: 'link',
          label: t('nav.contracts', 'Contracts'),
          to: '/contracts',
          icon: icon(FileSignature),
        })
      }

      items.push({
        type: 'group',
        label: t('nav.quotes', 'Quotes'),
        icon: icon(ClipboardList),
        children: proposalChildren,
      })
    }

    if (hasPermission(user, 'proposals:read')) {
      if (isContractor(user)) {
        items.push({
          type: 'link',
          label: t('nav.myOrders', 'My Orders'),
          to: '/my-orders',
          icon: icon(ClipboardList),
        })
      } else {
        items.push({
          type: 'group',
          label: t('nav.orders', 'Orders'),
          icon: icon(ClipboardList),
          children: [
            { type: 'link', label: t('nav.orders', 'Orders'), to: '/orders', icon: icon(ClipboardList) },
            { type: 'link', label: t('nav.myOrders', 'My Orders'), to: '/my-orders', icon: icon(ClipboardList) },
          ],
        })
      }
    }

    if (hasPermission(user, 'proposals:read')) {
      items.push({
        type: 'link',
        label: t('nav.payments', 'Payments'),
        to: '/payments',
        icon: icon(CreditCard),
      })
    }

    if (hasPermission(user, 'customers:read')) {
      const customerChildren = [
        { type: 'link', label: t('nav.viewCustomers'), to: '/customers', icon: icon(Users) },
      ]

      if (hasPermission(user, 'customers:create')) {
        customerChildren.push({
          type: 'link',
          label: t('nav.addCustomer'),
          to: '/customers/add',
          icon: icon(UserPlus),
        })
      }

      items.push({
        type: 'group',
        label: t('nav.customers'),
        icon: icon(Users),
        children: customerChildren,
      })
    }

    if (hasPermission(user, 'resources:read')) {
      items.push({
        type: 'link',
        label: t('nav.resources'),
        to: '/resources',
        icon: icon(FolderOpen),
      })
    }

    items.push({
      type: 'link',
      label: t('nav.3dKitchen', '3D Kitchen'),
      to: '/3d-kitchen',
      icon: icon(BoxIcon),
    })

    items.push({
      type: 'link',
      label: t('nav.contactUs'),
      to: '/contact',
      icon: icon(MessageCircle),
    })

    if (!isAdmin(user)) {
      items.push({
        type: 'link',
        label: t('nav.notifications'),
        to: '/notifications',
        icon: icon(Bell),
      })
    }

    if (hasModuleAccess(user, 'calendar')) {
      items.push({
        type: 'link',
        label: t('nav.calendar'),
        to: '/calender',
        icon: icon(CalendarDays),
      })
    }

    if (isAdmin(user)) {
      const adminChildren = []

      if (hasPermission(user, 'admin:contractors')) {
        adminChildren.push({
          type: 'link',
          label: t('nav.contractors'),
          to: '/admin/contractors',
          icon: icon(Building2),
        })
      }

      if (hasPermission(user, 'admin:notifications')) {
        adminChildren.push({
          type: 'link',
          label: t('nav.notifications'),
          to: '/admin/notifications',
          icon: icon(Bell),
        })
      }

      if (hasPermission(user, 'admin:leads')) {
        adminChildren.push({
          type: 'link',
          label: t('nav.leads'),
          to: '/admin/leads',
          icon: icon(MessageCircle),
        })
      }

      if (adminChildren.length > 0) {
        items.push({
          type: 'group',
          label: t('nav.admin'),
          icon: icon(Users),
          children: adminChildren,
        })
      }
    }

    // Settings section - only for admin users
    if (isAdmin(user)) {
      const settingsChildren = []

      // User Management Group
      if (hasPermission(user, 'settings:users') || hasPermission(user, 'settings:groups')) {
        const userManagementChildren = []

        if (hasPermission(user, 'settings:users')) {
          userManagementChildren.push({
            type: 'link',
            label: t('nav.users'),
            to: '/settings/users',
            icon: icon(Users),
          })
        }

        if (hasPermission(user, 'settings:groups')) {
          userManagementChildren.push({
            type: 'link',
            label: t('nav.userGroups'),
            to: '/settings/users/groups',
            icon: icon(Building2),
          })
        }

        if (userManagementChildren.length > 0) {
          settingsChildren.push({
            type: 'group',
            label: t('nav.userManagement'),
            icon: icon(User),
            children: userManagementChildren,
          })
        }
      }

      // Manufacturers Group
      if (hasPermission(user, 'settings:manufacturers')) {
        settingsChildren.push({
          type: 'group',
          label: t('nav.manufacturers'),
          icon: icon(Factory),
          children: [
            {
              type: 'link',
              label: t('nav.manufacturers'),
              to: '/settings/manufacturers',
              icon: icon(Factory),
            },
            {
              type: 'link',
              label: t('nav.multipliers'),
              to: '/settings/usergroup/multipliers',
              icon: icon(Calculator),
            },
          ],
        })
      }

      // Locations
      if (hasPermission(user, 'settings:locations')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.locations'),
          to: '/settings/locations',
          icon: icon(MapPin),
        })
      }

      // Taxes
      if (hasPermission(user, 'settings:taxes')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.taxes'),
          to: '/settings/taxes',
          icon: icon(Calculator),
        })
      }

      // Customization Group
      if (hasPermission(user, 'settings:customization')) {
        settingsChildren.push({
          type: 'group',
          label: t('nav.customization'),
          icon: icon(Paintbrush),
          children: [
            {
              type: 'link',
              label: t('nav.general'),
              to: '/settings/customization',
              icon: icon(Settings),
            },
            {
              type: 'link',
              label: t('nav.pdfLayout'),
              to: '/settings/pdflayoutcustomization',
              icon: icon(FileImage),
            },
            {
              type: 'link',
              label: t('nav.loginPage'),
              to: '/settings/loginlayoutcustomization',
              icon: icon(User),
            },
            {
              type: 'link',
              label: t('nav.uiCustomization'),
              to: '/settings/ui-customization',
              icon: icon(Paintbrush),
            },
            {
              type: 'link',
              label: t('nav.terms', 'Terms & Conditions'),
              to: '/settings/terms',
              icon: icon(ScrollText),
            },
          ],
        })
      }

      // Payment Configuration
      if (hasPermission(user, 'admin:settings')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.paymentConfig', 'Payment Configuration'),
          to: '/settings/payment-config',
          icon: icon(CreditCard),
        })
      }

      if (settingsChildren.length > 0) {
        items.push({
          type: 'group',
          label: t('nav.settings'),
          icon: icon(Settings),
          children: settingsChildren,
        })
      }
    }

    setNavItems(items)
  }, [t, user])

  return navItems
}

export default useNavItems
