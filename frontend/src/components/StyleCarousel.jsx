import React, { useRef } from 'react'
import {
  Box,
  HStack,
  IconButton,
  Image,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'

const ITEM_WIDTH = 148
const SCROLL_AMOUNT = ITEM_WIDTH * 2

const StyleCarousel = ({ items = [], selectedId, onSelect, title = 'Styles', className = '' }) => {
  const scrollerRef = useRef(null)

  const scrollBy = (distance) => {
    const node = scrollerRef.current
    if (!node) return
    node.scrollBy({ left: distance, behavior: 'smooth' })
  }

  const handleSelect = (id) => {
    if (typeof onSelect === 'function') {
      onSelect(id)
    }
  }

  return (
    <VStack align="stretch" spacing={4} className={className}>
      <HStack justify="space-between" align="center">
        <Text fontWeight="semibold">{title}</Text>
        <HStack spacing={4}>
          <IconButton
            aria-label="Scroll left"
            icon={<ChevronLeft size={ICON_SIZE_MD} />}
            variant="ghost"
            onClick={() => scrollBy(-SCROLL_AMOUNT)}
          />
          <IconButton
            aria-label="Scroll right"
            icon={<ChevronRight size={ICON_SIZE_MD} />}
            variant="ghost"
            onClick={() => scrollBy(SCROLL_AMOUNT)}
          />
        </HStack>
      </HStack>

      <HStack
        ref={scrollerRef}
        spacing={4}
        overflowX="auto"
        py={1}
        role="list"
        aria-label={title}
      >
        {items.length === 0 && (
          <Box px={3} py={2} color="gray.500" fontSize="sm">
            No styles
          </Box>
        )}

        {items.map((item) => {
          const id = item?.id ?? item?.value ?? item?.key
          const name = item?.name ?? item?.label ?? String(id)
          const imageUrl = item?.imageUrl
          const isSelected = selectedId != null && String(selectedId) === String(id)

          return (
            <Box
              key={id}
              flex="0 0 auto"
              w={`${ITEM_WIDTH}px`}
              role="listitem"
            >
              <Button
                variant="outline"
                borderColor={isSelected ? 'brand.500' : 'gray.200'}
                bg={isSelected ? 'brand.50' : 'white'}
                w="full"
                h="full"
                p={2}
                borderRadius="lg"
                display="block"
                onClick={() => handleSelect(id)}
                aria-pressed={isSelected}
              >
                <VStack spacing={4} align="stretch">
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    bg="gray.100"
                    h="96px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {imageUrl ? (
                      <Image src={imageUrl} alt="" objectFit="cover" w="full" h="full" />
                    ) : (
                      <Box w="full" h="full" />
                    )}
                  </Box>
                  <Text fontSize="sm" noOfLines={1}>
                    {name}
                  </Text>
                </VStack>
              </Button>
            </Box>
          )
        })}
      </HStack>
    </VStack>
  )
}

export default StyleCarousel
