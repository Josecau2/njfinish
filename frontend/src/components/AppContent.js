import React, { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Box, Center, Spinner } from '@chakra-ui/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useSelector } from 'react-redux'
import routes from '../routes'
import RouteGuard from './RouteGuard'
import { filterRoutesByPermission } from '../helpers/permissions'

const AppContent = () => {
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()
  const reduxUser = useSelector((state) => state.auth?.user)
  const user =
    reduxUser ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('user')) || null
      } catch {
        return null
      }
    })()

  const allowedRoutes = user ? filterRoutesByPermission(routes, user) : []

  const transition = {
    duration: prefersReducedMotion ? 0 : 0.32,
    ease: 'easeOut',
  }

  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }
  const exit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }

  return (
    <Box
      className="modern-content"
      w="full"
      maxW={{ base: '100%', xl: '1180px', '2xl': '1320px' }}
      mx="auto"
      px={{ base: 2, md: 3, lg: 4, xl: 6 }}
      overflowX="hidden"
    >
      <Suspense
        fallback={
          <Center py={10}>
            <Spinner size="lg" color="brand.500" thickness="3px" speed="0.65s" />
          </Center>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {allowedRoutes.map((route, idx) => {
              return (
                route.element && (
                  <Route
                    key={idx}
                    path={route.path}
                    exact={route.exact}
                    name={route.name}
                    element={
                      <RouteGuard
                        permission={route.permission}
                        module={route.module}
                        adminOnly={route.adminOnly}
                      >
                        <motion.div
                          style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
                          initial={initial}
                          animate={{ opacity: 1, y: 0 }}
                          exit={exit}
                          transition={transition}
                        >
                          <route.element />
                        </motion.div>
                      </RouteGuard>
                    }
                  />
                )
              )
            })}
            {/* Fallback route for unauthorized access */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Box>
  )
}

export default AppContent
