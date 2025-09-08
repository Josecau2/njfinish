import React from 'react'
import { useLocation } from 'react-router-dom'

import routes from '../routes'

import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes.find((route) => route.path === pathname)
    return currentRoute ? currentRoute.name : false
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    location.split('/').reduce((prev, curr, index, array) => {
      const currentPathname = `${prev}/${curr}`
      const routeName = getRouteName(currentPathname, routes)
      routeName &&
        breadcrumbs.push({
          pathname: currentPathname,
          name: routeName,
          active: index + 1 === array.length ? true : false,
        })
      return currentPathname
    })
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <>
      <style>{`
        /* Breadcrumbs: compact, no wrap on mobile, scroll instead of overflow */
        .modern-breadcrumb {
          margin: 0;
          padding: .25rem .5rem;
          background: transparent;
        }
        .modern-breadcrumb .breadcrumb { margin: 0; }
        .modern-breadcrumb .breadcrumb-item { white-space: nowrap; }
        @media (max-width: 575.98px){
          .modern-breadcrumb { padding: .25rem 0; }
          .modern-breadcrumb .breadcrumb {
            display: flex;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: .25rem;
          }
          .modern-breadcrumb .breadcrumb::-webkit-scrollbar{ display:none; }
        }
      `}</style>
      <CBreadcrumb className="my-0 modern-breadcrumb">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => {
        return (
          <CBreadcrumbItem
            {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
            key={index}
          >
            {breadcrumb.name}
          </CBreadcrumbItem>
        )
      })}
      </CBreadcrumb>
    </>
  )
}

export default React.memo(AppBreadcrumb)
