import React from 'react'
import { Box, HStack, IconButton, Text, createStandaloneToast } from '@chakra-ui/react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import theme from '../theme'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const toast = createStandaloneToast({
  theme,
})

const STATUS_MAP = {
  success: {
    icon: CheckCircle2,
    accent: 'brand.500',
  },
  error: {
    icon: AlertTriangle,
    accent: 'red.500',
  },
  info: {
    icon: Info,
    accent: 'brand.400',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'orange.400',
  },
}

const showToast = ({ status, title, description, duration = 4000 }) => {
  const mapping = STATUS_MAP[status] || STATUS_MAP.info
  const Icon = mapping.icon || Info

  toast({
    duration,
    position: 'top-right',
    isClosable: true,
    render: ({ onClose }) => (
      <Box
        bg="surface"
        color="text"
        border="1px solid"
        borderColor="border"
        borderLeftWidth="4px"
        borderLeftColor={mapping.accent}
        boxShadow="md"
        borderRadius="md"
        px={4}
        py={3}
        maxW="320px"
      >
        <HStack align="flex-start" spacing={3}>
          <Box color={mapping.accent} mt={0.5} aria-hidden>
            <Icon size={ICON_SIZE_MD} />
          </Box>
          <Box flex="1">
            <Text fontWeight="semibold" fontSize="sm">
              {title}
            </Text>
            {description ? (
              <Text fontSize="sm" color="muted" mt={1}>
                {description}
              </Text>
            ) : null}
          </Box>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close notification"
            icon={<X size={14} />}
            onClick={onClose}
          />
        </HStack>
      </Box>
    ),
  })
}

export const notifySuccess = (title = 'Success', text = '') =>
  showToast({ status: 'success', title, description: text })

export const notifyError = (title = 'Error', text = '') =>
  showToast({ status: 'error', title, description: text })

export const notifyInfo = (title = 'Info', text = '') =>
  showToast({ status: 'info', title, description: text })

export const notifyWarning = (title = 'Warning', text = '') =>
  showToast({ status: 'warning', title, description: text })

export const confirm = (title, text = '', _confirmButtonText = 'Yes') =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ isConfirmed: false, isDenied: false, isDismissed: true })
      return
    }

    const message = text ? `${title}\n\n${text}` : title
    const isConfirmed = window.confirm(message)
    resolve({
      isConfirmed,
      isDenied: false,
      isDismissed: !isConfirmed,
    })
  })

export default {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyWarning,
  confirm,
}
