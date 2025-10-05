import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorModeValue, Flex, IconButton, Text, Badge, Box } from '@chakra-ui/react'

const PaginationComponent = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  showPageLabel = true,
  itemsPerPage = 10,
  maxVisiblePages = 5,
}) => {
  const { t } = useTranslation()
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)

  // Dark mode colors
  const bgContainer = useColorModeValue('#f8f9fa', 'gray.800')
  const bgGradient = useColorModeValue('linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 'linear-gradient(135deg, #2D3748 0%, #1A202C 100%)')
  const borderColor = useColorModeValue('#dee2e6', 'gray.600')
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const badgeBg = useColorModeValue('white', 'gray.700')
  const badgeBorder = useColorModeValue('gray.300', 'gray.600')
  const badgeText = useColorModeValue('gray.800', 'gray.200')
  const buttonBg = useColorModeValue('white', 'gray.700')
  const buttonBorder = useColorModeValue('gray.300', 'gray.600')
  const buttonText = useColorModeValue('gray.600', 'gray.300')
  const ellipsisColor = useColorModeValue('gray.500', 'gray.400')
  const activeBg = useColorModeValue('indigo.600', 'indigo.500')
  const hoverBg = useColorModeValue('purple.50', 'purple.900')
  const hoverBorder = useColorModeValue('purple.300', 'purple.700')
  const hoverText = useColorModeValue('purple.700', 'purple.200')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 660)
      setIsSmallMobile(window.innerWidth <= 447)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const visiblePages = useMemo(() => {
    if (totalPages <= 0) {
      return []
    }

    const pages = []
    const maxVisible = isSmallMobile ? 3 : isMobile ? 4 : Math.max(1, maxVisiblePages)
    const halfWindow = Math.floor(maxVisible / 2)

    let start = Math.max(1, currentPage - halfWindow)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('ellipsis-start')
      }
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages, isMobile, isSmallMobile, maxVisiblePages])

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    onPageChange(page)
  }

  if (totalPages <= 0) {
    return null
  }

  return (
    <Flex
      direction={isMobile ? 'column' : 'row'}
      justify={isMobile ? 'center' : 'space-between'}
      align="center"
      p={isMobile ? '16px 12px' : '20px 24px'}
      gap={isMobile ? '16px' : '0'}
      bg={bgContainer}
      bgGradient={bgGradient}
      borderTop="1px solid"
      borderTopColor={borderColor}
      borderRadius="0 0 8px 8px"
      boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
    >
      <Flex
        align="center"
        gap={isSmallMobile ? '8px' : '12px'}
        order={isMobile ? 2 : 1}
        display={showPageLabel ? 'flex' : 'none'}
      >
        <Text
          fontSize={isSmallMobile ? 'xs' : 'sm'}
          fontWeight="500"
          color={labelColor}
          whiteSpace="nowrap"
        >
          {t('pagination.itemsPerPage')}
        </Text>
        <Badge
          bg={badgeBg}
          borderWidth="1px"
          borderColor={badgeBorder}
          borderRadius="6px"
          px={isSmallMobile ? 2 : 3}
          py={isSmallMobile ? 1 : '6px'}
          fontSize={isSmallMobile ? 'xs' : 'sm'}
          fontWeight="600"
          color={badgeText}
          boxShadow="0 2px 4px rgba(0,0,0,0.1)"
        >
          {itemsPerPage}
        </Badge>
      </Flex>

      <Flex
        align="center"
        gap={isSmallMobile ? '6px' : '8px'}
        order={isMobile ? 1 : 2}
        flexWrap="nowrap"
        justify="center"
      >
        {!isSmallMobile && (
          <IconButton
            onClick={() => handlePageClick(1)}
            isDisabled={currentPage === 1}
            w={isSmallMobile || isMobile ? '44px' : '40px'}
            h={isSmallMobile || isMobile ? '44px' : '40px'}
            borderWidth="1px"
            borderColor={buttonBorder}
            borderRadius="6px"
            bg={buttonBg}
            color={buttonText}
            fontSize="sm"
            fontWeight="500"
            transition="all 0.2s ease"
            _hover={{
              bg: hoverBg,
              borderColor: hoverBorder,
              color: hoverText,
            }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
            title={t('pagination.firstPageTitle')}
            aria-label={t('pagination.firstPageTitle')}
            icon={<Text>⇤</Text>}
          />
        )}

        <IconButton
          onClick={() => handlePageClick(currentPage - 1)}
          isDisabled={currentPage === 1}
          w={isSmallMobile || isMobile ? '44px' : '40px'}
          h={isSmallMobile || isMobile ? '44px' : '40px'}
          borderWidth="1px"
          borderColor={buttonBorder}
          borderRadius="6px"
          bg={buttonBg}
          color={buttonText}
          fontSize="sm"
          fontWeight="500"
          transition="all 0.2s ease"
          _hover={{
            bg: hoverBg,
            borderColor: hoverBorder,
            color: hoverText,
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          title={t('pagination.prevPageTitle')}
          aria-label={t('pagination.prevPageTitle')}
          icon={<Text>←</Text>}
        />

        {visiblePages.map((page, index) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <Box
                key={`ellipsis-${index}`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="32px"
                color={ellipsisColor}
                fontSize="lg"
              >
                ⋯
              </Box>
            )
          }

          const isActive = page === currentPage
          return (
            <IconButton
              key={page}
              onClick={() => handlePageClick(page)}
              w={isSmallMobile || isMobile ? '44px' : '40px'}
              h={isSmallMobile || isMobile ? '44px' : '40px'}
              borderWidth="1px"
              borderColor={isActive ? activeBg : buttonBorder}
              borderRadius="6px"
              bg={isActive ? activeBg : buttonBg}
              color={isActive ? 'white' : buttonText}
              fontSize="sm"
              fontWeight="500"
              transition="all 0.2s ease"
              _hover={{
                bg: isActive ? activeBg : hoverBg,
                borderColor: isActive ? activeBg : hoverBorder,
                color: isActive ? 'white' : hoverText,
              }}
              aria-label={t('pagination.pageNumberAria', { page })}
              icon={<Text>{page}</Text>}
            />
          )
        })}

        <IconButton
          onClick={() => handlePageClick(currentPage + 1)}
          isDisabled={currentPage === totalPages}
          w={isSmallMobile || isMobile ? '44px' : '40px'}
          h={isSmallMobile || isMobile ? '44px' : '40px'}
          borderWidth="1px"
          borderColor={buttonBorder}
          borderRadius="6px"
          bg={buttonBg}
          color={buttonText}
          fontSize="sm"
          fontWeight="500"
          transition="all 0.2s ease"
          _hover={{
            bg: hoverBg,
            borderColor: hoverBorder,
            color: hoverText,
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
          title={t('pagination.nextPageTitle')}
          aria-label={t('pagination.nextPageTitle')}
          icon={<Text>→</Text>}
        />

        {!isSmallMobile && (
          <IconButton
            onClick={() => handlePageClick(totalPages)}
            isDisabled={currentPage === totalPages}
            w={isSmallMobile || isMobile ? '44px' : '40px'}
            h={isSmallMobile || isMobile ? '44px' : '40px'}
            borderWidth="1px"
            borderColor={buttonBorder}
            borderRadius="6px"
            bg={buttonBg}
            color={buttonText}
            fontSize="sm"
            fontWeight="500"
            transition="all 0.2s ease"
            _hover={{
              bg: hoverBg,
              borderColor: hoverBorder,
              color: hoverText,
            }}
            _disabled={{
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
            title={t('pagination.lastPageTitle')}
            aria-label={t('pagination.lastPageTitle')}
            icon={<Text>⇥</Text>}
          />
        )}
      </Flex>

      <Text
        fontSize="sm"
        color={labelColor}
        order={3}
        whiteSpace="nowrap"
      >
        {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
      </Text>
    </Flex>
  )
}

export default PaginationComponent
