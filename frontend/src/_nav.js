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
  Settings2,
  Building2,
  Wrench,
  Paintbrush,
  MapPin,
  CreditCard,
  CircleDollarSign,
  Cog,
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
          icon: icon(FileText),
        })
      } else {
        items.push({
          type: 'group',
          label: t('nav.orders', 'Orders'),
          icon: icon(FileText),
          children: [
            { type: 'link', label: t('nav.orders', 'Orders'), to: '/orders', icon: icon(FileText) },
            { type: 'link', label: t('nav.myOrders', 'My Orders'), to: '/my-orders', icon: icon(FileText) },
          ],
        })
      }
    }

    if (hasPermission(user, 'proposals:read')) {
      items.push({
        type: 'link',
        label: t('nav.payments', 'Payments'),
        to: '/payments',
        icon: icon(CircleDollarSign),
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
          icon: icon(Settings2),
          children: adminChildren,
        })
      }
    }

    if (hasPermission(user, 'settings:customization') || hasPermission(user, 'settings:users')) {
      const settingsChildren = []

      if (hasPermission(user, 'settings:users')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.users'),
          to: '/settings/users',
          icon: icon(Users),
        })
        settingsChildren.push({
          type: 'link',
          label: t('nav.groups'),
          to: '/settings/users/group',
          icon: icon(Building2),
        })
      }

      if (hasPermission(user, 'settings:locations')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.locations'),
          to: '/settings/locations',
          icon: icon(MapPin),
        })
      }

      if (hasPermission(user, 'settings:taxes')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.taxes'),
          to: '/settings/taxes',
          icon: icon(CreditCard),
        })
      }

      if (hasPermission(user, 'settings:customization')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.customization'),
          to: '/settings/customization',
          icon: icon(Paintbrush),
        })
      }

      if (hasPermission(user, 'settings:manufacturers')) {
        settingsChildren.push({
          type: 'link',
          label: t('nav.manufacturers'),
          to: '/settings/manufacturers',
          icon: icon(Building2),
        })
      }

      if (settingsChildren.length > 0) {
        items.push({
          type: 'group',
          label: t('nav.settings'),
          icon: icon(Cog),
          children: settingsChildren,
        })
      }
    }

    setNavItems(items)
  }, [t, user])

  return navItems
}

export default useNavItems
