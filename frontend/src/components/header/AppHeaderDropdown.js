import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { LogOut, User as UserIcon } from '@/icons-lucide'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { clearAllTokens } from '../../utils/authToken';
import { forceBrowserCleanup, forcePageReload } from '../../utils/browserCleanup';

const AppHeaderDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Step 1: Clear all tokens and memory cache
    clearAllTokens();

    // Step 2: Dispatch logout action (clears Redux state and more storage)
    dispatch(logout());

    // Step 3: Force complete browser cleanup
    forceBrowserCleanup();

    // Step 4: Force page reload to login with cache busting
    setTimeout(() => {
      window.location.href = '/login?_t=' + Date.now() + '&_fresh=1';
    }, 100);
  };

  return (
    <CDropdown
      variant="nav-item"
      placement="bottom-end"
      className="modern-header__nav-item header-dropdown"
      offset={[0, 12]}
      portal
    >
      <CDropdownToggle
        className="modern-header__dropdown-toggle nav-link border-0 bg-transparent position-relative d-flex align-items-center justify-content-center"
        caret={false}
        aria-label="Account menu"
      >
        <CAvatar
          size="md"
          style={{
            color: '#4a4a4a',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
          aria-hidden
        >
          <UserIcon size={20} aria-hidden />
        </CAvatar>
      </CDropdownToggle>
      <CDropdownMenu
        className="pt-0 header-dropdown__menu profile-dropdown__menu shadow-sm"
        style={{ minWidth: '220px' }}
      >
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">Account</CDropdownHeader>
        {/* <CDropdownItem href="#">
          <CIcon icon={cilBell} className="me-2" />
          Updates
          <CBadge color="info" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          <CBadge color="success" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilTask} className="me-2" />
          Tasks
          <CBadge color="danger" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilCommentSquare} className="me-2" />
          Comments
          <CBadge color="warning" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader> */}
        <CDropdownItem onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} aria-label="Profile">
          <UserIcon size={16} className="me-2" aria-hidden />
          Profile
        </CDropdownItem>
        <CDropdownItem href="#" onClick={handleLogout} aria-label="Logout">
          <LogOut size={16} className="me-2" aria-hidden />
          Logout
        </CDropdownItem>
        {/* <CDropdownItem href="#">
          <CIcon icon={cilCreditCard} className="me-2" />
          Payments
          <CBadge color="secondary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownItem href="#">
          <CIcon icon={cilFile} className="me-2" />
          Projects
          <CBadge color="primary" className="ms-2">
            42
          </CBadge>
        </CDropdownItem>
        <CDropdownDivider />
        <CDropdownItem href="#">
          <CIcon icon={cilLockLocked} className="me-2" />
          Lock Account
        </CDropdownItem> */}
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
