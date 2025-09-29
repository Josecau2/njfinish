import React, { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Box } from '@chakra-ui/react'
import routes from '../routes'

const AppBreadcrumb = () => {
  const location = useLocation()

  const breadcrumbs = useMemo(() => {
    const getRouteName = (pathname) => {
      const currentRoute = routes.find((route) => route.path === pathname)
      return currentRoute ? currentRoute.name : null
    }

    const segments = location.pathname.split('/').filter(Boolean)
    const crumbs = []

    segments.reduce((prev, curr, index) => {
      const currentPath = `${prev}/${curr}`
      const routeName = getRouteName(currentPath)

      if (routeName) {
        crumbs.push({
          pathname: currentPath,
          name: routeName,
          isLast: index === segments.length - 1,
        })
      }

      return currentPath
    }, '')

    return crumbs
  }, [location.pathname])

  return (
    <Box px={{ base: 3, md: 4, lg: 6 }} py={2} bg="transparent">
      <Breadcrumb
        separator="/"
        fontSize="sm"
        color="muted"
        display="flex"
        overflowX={{ base: 'auto', sm: 'visible' }}
        whiteSpace="nowrap"
        sx={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
          <BreadcrumbItem key={crumb.pathname} isCurrentPage={crumb.isLast}>
            {crumb.isLast ? (
              <BreadcrumbLink color="brand.600" aria-current="page">
                {crumb.name}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbLink as={Link} to={crumb.pathname}>
                {crumb.name}
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
    </Box>
  )
}
export default React.memo(AppBreadcrumb)
