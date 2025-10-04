import { Icon, Flex, IconButton, useColorModeValue } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const PaginationControls = ({ page, totalPages, goPrev, goNext }) => {
  const { t } = useTranslation()
  const hoverBg = useColorModeValue('#e9ecef', 'gray.700')
  const iconColor = useColorModeValue('#333', 'gray.200')
  const disabledColor = useColorModeValue('#ccc', 'gray.600')

  return (
    <Flex
      gap="12px"
      align="center"
      aria-label={t('common.ariaLabels.pagination', 'Pagination')}
      role="group"
    >
      <IconButton
        onClick={goPrev}
        isDisabled={page === 1}
        aria-label={t('common.ariaLabels.previous', 'Previous')}
        bg="transparent"
        border="none"
        p="6px"
        borderRadius="50%"
        fontSize="2xl"
        color={page === 1 ? disabledColor : iconColor}
        minW="44px"
        minH="44px"
        transition="background-color 0.2s ease, color 0.2s ease"
        _hover={{
          bg: page === 1 ? 'transparent' : hoverBg,
        }}
        _disabled={{
          cursor: 'not-allowed',
        }}
        icon={<Icon as={ChevronLeft} />}
      />

      <IconButton
        onClick={goNext}
        isDisabled={page === totalPages}
        aria-label={t('common.ariaLabels.next', 'Next')}
        bg="transparent"
        border="none"
        p="6px"
        borderRadius="50%"
        fontSize="2xl"
        color={page === totalPages ? disabledColor : iconColor}
        minW="44px"
        minH="44px"
        transition="background-color 0.2s ease, color 0.2s ease"
        _hover={{
          bg: page === totalPages ? 'transparent' : hoverBg,
        }}
        _disabled={{
          cursor: 'not-allowed',
        }}
        icon={<Icon as={ChevronRight} />}
      />
    </Flex>
  )
}

export default PaginationControls
