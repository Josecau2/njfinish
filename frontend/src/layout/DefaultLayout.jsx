import React, { useEffect, useMemo, useState } from 'react'
import { Flex, Box, Center, Spinner, Text } from '@chakra-ui/react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components/index'
import TermsModal from '../components/TermsModal'
import { useSelector, useDispatch } from 'react-redux'
import { getLatestTerms } from '../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../helpers/permissions'
import { logout } from '../store/slices/authSlice'
import { useLocation, useNavigate } from 'react-router-dom'
import { setSidebarShow } from '../store/slices/sidebarSlice'
import AppBreadcrumb from '../components/AppBreadcrumb'

const DefaultLayout = () => {
  const user = useSelector((s) => s.auth.user)
  const { sidebarUnfoldable, sidebarPinned } = useSelector((state) => state.sidebar)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  const [forceTerms, setForceTerms] = useState(false)
  const [latestVersion, setLatestVersion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  // Calculate sidebar width based on state
  const sidebarWidth = useMemo(() => {
    const collapsed = !sidebarPinned && sidebarUnfoldable
    return collapsed ? "56px" : "256px"
  }, [sidebarPinned, sidebarUnfoldable])

  useEffect(() => {
    const updateDensity = () => {
      if (window.innerWidth <= 576) {
        document.documentElement.dataset.density = 'compact'
      } else {
        delete document.documentElement.dataset.density
      }
    }

    updateDensity()
    window.addEventListener('resize', updateDensity)
    return () => window.removeEventListener('resize', updateDensity)
  }, [])

  useEffect(() => {
    if (!user) {
      if (!hasInitialized) {
        setLoading(true)
        return
      }
      setLoading(false)
      navigate('/login', { replace: true })
      return
    }

    if (!hasInitialized) {
      setHasInitialized(true)
    }

    ;(async () => {
      try {
        if (isAdmin) {
          setForceTerms(false)
          setLoading(false)
          return
        }

        const res = await getLatestTerms()
        const v = res?.data?.data?.version
        const alreadyAccepted = !!res?.data?.data?.accepted
        setLatestVersion(v || null)

        if (v) {
          const key = `terms.accepted.v${v}`
          if (alreadyAccepted) {
            localStorage.setItem(key, '1')
            setForceTerms(false)
          } else {
            const cached = localStorage.getItem(key)
            setForceTerms(!cached)
          }
        } else {
          setForceTerms(false)
        }
        setLoading(false)
      } catch {
        setForceTerms(false)
        setLoading(false)
      }
    })()
  }, [user, isAdmin, hasInitialized, navigate])

  const handleAccepted = () => {
    if (latestVersion) {
      localStorage.setItem(`terms.accepted.v${latestVersion}`, '1')
    }
    setForceTerms(false)
  }

  const handleRejected = () => {
    dispatch(logout())
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      dispatch(setSidebarShow(false))
    }
  }, [location.pathname, dispatch])

  if (loading) {
    return (
      <Center minH="100vh" bg="background">
        <Spinner size="lg" color="brand.500" />
      </Center>
    )
  }

  if (!user) {
    return null
  }

  if (!isAdmin && forceTerms) {
    return (
      <Center minH="100vh" bg="background" textAlign="center">
        <Box maxW="420px">
          <Text fontSize="lg" fontWeight="semibold" mb={4}>
            Terms & Conditions Required
          </Text>
          <Text color="muted" mb={4}>
            You must review and accept the terms and conditions to continue.
          </Text>
          <TermsModal
            visible={true}
            onClose={handleAccepted}
            onReject={handleRejected}
            isForced={true}
            requireScroll={true}
          />
        </Box>
      </Center>
    )
  }

  return (
    <Box minH="100vh" background="background">
      <AppSidebar />
      <Box
        ml={{ base: 0, lg: sidebarWidth }}
        transition="margin-left 0.15s ease-in-out"
        minH="100vh"
        className="main-content-area"
      >
        <Flex direction="column" minH="100vh">
          <AppHeader />
          <AppBreadcrumb />
          <Box as="main" flex="1" pb={6} className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AppContent />
          </Box>
          <AppFooter />
        </Flex>
      </Box>
    </Box>
  )
}

export default DefaultLayout
