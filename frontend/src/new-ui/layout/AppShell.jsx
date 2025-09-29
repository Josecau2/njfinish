import { Drawer, DrawerContent, DrawerOverlay, IconButton, useDisclosure } from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {
  Menu,
  Bell,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  FolderOpen,
} from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { motion, useReducedMotion } from 'framer-motion'
import AppProviders from '../providers/AppProviders'
import '../styles.css'

const navItems = ['dashboard', 'proposals', 'customers', 'resources']

const iconMap = {
  dashboard: LayoutDashboard,
  proposals: FileText,
  customers: Users,
  resources: FolderOpen,
}

const MotionDiv = motion.div

const NavContent = ({ onNavigate }) => {
  const { t } = useTranslation()

  return (
    <nav className="flex flex-col gap-3 py-6">
      {navItems.map((item) => {
        const Icon = iconMap[item]
        return (
          <button
            key={item}
            type="button"
            onClick={() => onNavigate?.(item)}
            className="group flex items-center gap-3 rounded-xl border border-transparent bg-white/60 px-4 py-3 text-left text-sm font-medium text-slate-600 shadow-sm transition duration-ui ease-emphasized hover:border-brand-500 hover:text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition duration-ui ease-emphasized group-hover:bg-brand-100">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-900">
                {t(`newUi.nav.${item}`)}
              </span>
              <span className="text-xs text-slate-500">{t(`newUi.navDescriptions.${item}`)}</span>
            </div>
          </button>
        )
      })}
    </nav>
  )
}

NavContent.propTypes = {
  onNavigate: PropTypes.func,
}

const AppShellBody = ({ children }) => {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty('overflow')
    }
  }, [isOpen])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <IconButton
              aria-label={t('newUi.navigation.openMenu')}
              icon={<Menu className="h-5 w-5" />}
              variant="ghost"
              className="inline-flex lg:hidden"
              onClick={onOpen}
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-600">
                {t('newUi.navigation.productName')}
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {t('newUi.navigation.primaryTitle')}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <IconButton
              aria-label={t('newUi.navigation.alerts')}
              variant="ghost"
              icon={<Bell className="h-5 w-5" />}
            />
            <IconButton
              aria-label={t('newUi.navigation.settings')}
              variant="ghost"
              icon={<Settings className="h-5 w-5" />}
            />
            <IconButton
              aria-label={t('newUi.navigation.signOut')}
              variant="outline"
              icon={<LogOut className="h-5 w-5" />}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-6 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <NavContent />
        </aside>
        <MotionDiv
          className={classNames('flex-1', 'space-y-6')}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {children}
        </MotionDiv>
      </div>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="full">
        <DrawerOverlay bg="blackAlpha.300" />
        <DrawerContent className="w-72 border-r border-slate-200 bg-white px-6">
          <div className="pt-6">
            <NavContent onNavigate={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

AppShellBody.propTypes = {
  children: PropTypes.node,
}

const AppShell = ({ children }) => (
  <AppProviders>
    <AppShellBody>{children}</AppShellBody>
  </AppProviders>
)

AppShell.propTypes = {
  children: PropTypes.node,
}

export default AppShell
