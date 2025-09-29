import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
import i18n from '../../i18n'
import theme from '../theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      cacheTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
      suspense: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

const AppProviders = ({ children }) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('bg-slate-50')
      return () => document.body.classList.remove('bg-slate-50')
    }
    return undefined
  }, [])

  return (
    <ChakraProvider theme={theme} resetCSS={false}>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nextProvider>
    </ChakraProvider>
  )
}

AppProviders.propTypes = {
  children: PropTypes.node,
}

export default AppProviders
