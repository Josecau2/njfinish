import { Box, Button, Heading, Icon, Text, VStack, useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box as BoxIcon, ArrowLeft } from 'lucide-react'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD } from '../../constants/iconSizes'

const ComingSoon = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const iconColor = useColorModeValue('brand.500', 'brand.300')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const accentBg = useColorModeValue('brand.50', 'brand.900')

  return (
    <PageContainer>
      <PageHeader
        title={t('3dKitchen.title', '3D Kitchen')}
        breadcrumbs={[
          { label: t('nav.home', 'Home'), to: '/dashboard' },
          { label: t('3dKitchen.title', '3D Kitchen') },
        ]}
      />

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="60vh"
        py={12}
      >
        <VStack spacing={6} textAlign="center" maxW="lg">
          <Box
            w={24}
            h={24}
            borderRadius="full"
            bg={accentBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={BoxIcon} boxSize={12} color={iconColor} />
          </Box>

          <Heading size="xl" fontWeight="bold">
            {t('3dKitchen.comingSoon.title', 'Coming Soon')}
          </Heading>

          <Text fontSize="lg" color={textColor} maxW="md">
            {t(
              '3dKitchen.comingSoon.description',
              'Our 3D Kitchen Designer is currently under development. This powerful tool will allow you to visualize and customize kitchen designs in an immersive 3D environment.'
            )}
          </Text>

          <Text fontSize="md" color={textColor}>
            {t(
              '3dKitchen.comingSoon.features',
              'Features will include real-time 3D rendering, cabinet customization, material selection, and instant proposal generation.'
            )}
          </Text>

          <Button
            leftIcon={<Icon as={ArrowLeft} boxSize={ICON_SIZE_MD} />}
            colorScheme="brand"
            size="lg"
            onClick={() => navigate('/dashboard')}
            mt={4}
          >
            {t('common.backToDashboard', 'Back to Dashboard')}
          </Button>
        </VStack>
      </Box>
    </PageContainer>
  )
}

export default ComingSoon
