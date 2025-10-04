import React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Box, Button, CardBody, HStack, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import StandardCard from '../StandardCard'
import { motion } from 'framer-motion'
import { Download, Edit2, Trash2, File, Image } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const MotionButton = motion.create(Button)

// Simple, generic content tile used to display a file/link-like item.
// ACCESSIBILITY COMPLIANT: All touch targets ≥44×44px with proper ARIA labels
// Props:
// - title: string
// - description: string
// - type: 'file' | 'image' | 'video' | string (used for badge)
// - onOpen: () => void  (tile click/open)
// - onDownload: () => void
// - onEdit: () => void
// - onDelete: () => void
export default function ContentTile({
  title,
  description,
  type = 'file',
  onOpen,
  onDownload,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation()
  const isImage = String(type).toLowerCase() === 'image'
  const badgeColorScheme = isImage ? 'blue' : 'gray'

  return (
    <StandardCard
      height="100%"
      shadow="sm"
      cursor="pointer"
      onClick={onOpen}
      _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
      transition="all 0.2s"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.()
        }
      }}
    >
      <CardBody p={4}>
        <VStack align="stretch" spacing={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Badge
              colorScheme={badgeColorScheme}
              textTransform="uppercase"
              fontSize="xs"
            >
              {type || 'file'}
            </Badge>
            <HStack spacing={4}>
              {onDownload && (
                <MotionButton
                  variant="ghost"
                  colorScheme="brand"
                  height="44px"
                  minW="44px"
                  p={2}
                  aria-label={t('files.actions.download', 'Download file')}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload()
                  }}
                >
                  <Download size={ICON_SIZE_MD} />
                </MotionButton>
              )}
              {onEdit && (
                <MotionButton
                  variant="ghost"
                  colorScheme="gray"
                  height="44px"
                  minW="44px"
                  p={2}
                  aria-label={t('files.actions.edit', 'Edit file')}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit2 size={ICON_SIZE_MD} />
                </MotionButton>
              )}
              {onDelete && (
                <MotionButton
                  variant="ghost"
                  colorScheme="red"
                  height="44px"
                  minW="44px"
                  p={2}
                  aria-label={t('files.actions.delete', 'Delete file')}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                >
                  <Trash2 size={ICON_SIZE_MD} />
                </MotionButton>
              )}
            </HStack>
          </Box>

          <HStack spacing={4} align="flex-start">
            <Box color={useColorModeValue("gray.500","gray.400")} flexShrink={0} mt={0.5}>
              {isImage ? <Image size={ICON_SIZE_MD} /> : <File size={ICON_SIZE_MD} />}
            </Box>
            <VStack align="flex-start" spacing={4} flex={1} minW={0}>
              <Text
                fontWeight="semibold"
                noOfLines={1}
                title={title}
                fontSize="sm"
              >
                {title || 'Untitled'}
              </Text>
              {description && (
                <Text
                  color={useColorModeValue("gray.500","gray.400")}
                  fontSize="xs"
                  noOfLines={2}
                  title={description}
                >
                  {description}
                </Text>
              )}
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </StandardCard>
  )
}
