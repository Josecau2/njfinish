import { useEffect, useState, useMemo } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilCog,
  cilDrop,
  cilPuzzle,
  cilSpeedometer,
  cilCalendar,
  cilFolderOpen  
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import axiosInstance from './helpers/axiosInstance'

const ROLE_ADMIN = 2
const ROLE_USER = 3

const useNavItems = () => {
  const [navItems, setNavItems] = useState([])

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), [])

  useEffect(() => {
    const fetchNavItems = async () => {
      if (!user?.userId) return

      try {
        const res = await axiosInstance.get(`/api/user-role/${user.userId}`)
        const role = res.data.role

        const base = [
          {
            component: CNavItem,
            name: 'Dashboard',
            to: '/',
            icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
          }
        ]

        if (role === ROLE_ADMIN) {
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
                { component: CNavItem, name: 'New Proposal', to: '/proposals' },
                { component: CNavItem, name: 'Contracts', to: '/contracts' },
              ],
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
                { component: CNavItem, name: 'Taxes', to: '/settings/taxes' },
                { component: CNavItem, name: 'Locations', to: '/settings/locations' },
                // { component: CNavItem, name: 'Customization', to: '/settings/customization' },
                // { component: CNavItem, name: 'Pdf Layout Customization', to: '/settings/pdflayoutcustomization' },
                // { component: CNavItem, name: 'Login Page', to: '/settings/loginlayoutcustomization' },
                { component: CNavItem, name: 'UI Customization', to: '/settings/ui-customization' },

              ],
            }
          )
        } else if (role === ROLE_USER) {
          base.push({
            component: CNavGroup,
            name: 'Proposals',
            icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
            items: [
              { component: CNavItem, name: 'New Proposal', to: '/proposals' },
              { component: CNavItem, name: 'Contracts', to: '/contracts' },
            ],
          })
        }

        setNavItems(base)
      } catch (err) {
        console.error('Failed to fetch role-based nav:', err)
      }
    }

    fetchNavItems()
  }, [user?.userId])

  return navItems
}

export default useNavItems
