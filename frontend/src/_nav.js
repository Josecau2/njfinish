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

const ROLE_ADMIN = 2
const ROLE_USER = 3

const useNavItems = () => {
  const [navItems, setNavItems] = useState([])

  const user = useMemo(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }, [])

  useEffect(() => {
    const fetchNavItems = async () => {
      if (!user?.userId) {
        console.log('No user or userId found:', user);
        return;
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
          return;
        }
      }

      console.log('Final role for navigation:', role);
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

      if (role === ROLE_ADMIN) {
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
            { component: CNavItem, name: 'New Proposal', to: '/proposals' },
            { component: CNavItem, name: 'Contracts', to: '/contracts' },
          ],
        })
      } else {
        console.log('Role does not match any expected values. Role:', role, typeof role);
      }

      console.log('Final navigation items:', base);
      setNavItems(base)
    }

    fetchNavItems()
  }, [user?.userId])

  return navItems
}

export default useNavItems