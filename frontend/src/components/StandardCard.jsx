import { forwardRef } from 'react'
import { Card, CardBody, CardFooter, CardHeader, useColorModeValue } from '@chakra-ui/react'

/**
 * StandardCard - Consistent card styling across the entire app
 * Use this instead of raw <Card> to ensure consistency
 *
 * Usage:
 *   <StandardCard>
 *     <CardHeader>Title</CardHeader>
 *     <CardBody>Content with padding</CardBody>
 *   </StandardCard>
 *
 * @param {string} variant - Card variant: 'outline' (default), 'elevated', 'filled'
 * @param {boolean} interactive - If true, adds hover effects for clickable cards
 * @param {ReactNode} children - Card content (usually CardHeader, CardBody, CardFooter)
 * @param {object} ...props - Additional Chakra props
 */
export const StandardCard = forwardRef(function StandardCard(
  {
    variant = 'outline',
    interactive = false,
    children,
    bg,
    borderColor,
    ...props
  },
  ref,
) {
  // Use semantic tokens for dark mode support
  const defaultBg = useColorModeValue('surface', 'gray.800')
  const defaultBorderColor = useColorModeValue('border', 'gray.600')
  const hoverBorderColor = useColorModeValue('blue.300', 'blue.500')

  const interactiveProps = interactive
    ? {
        cursor: 'pointer',
        _hover: { shadow: 'md', borderColor: hoverBorderColor },
        transition: 'all 0.15s ease',
      }
    : {}

  const resolvedBg = bg ?? (variant === 'outline' ? defaultBg : undefined)
  const resolvedBorderColor = borderColor ?? (variant === 'outline' ? defaultBorderColor : undefined)

  return (
    <Card
      ref={ref}
      variant={variant}
      borderRadius="lg"
      w="full"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      bg={resolvedBg}
      borderColor={resolvedBorderColor}
      role="group"
      {...interactiveProps}
      {...props}
    >
      {children}
    </Card>
  )
})

/**
 * MobileListCard - Standardized card for mobile list/table views
 * Has built-in padding - DO NOT wrap content in <CardBody>
 *
 * Usage:
 *   <MobileListCard>
 *     <VStack>Direct content here</VStack>
 *   </MobileListCard>
 *
 * @param {boolean} interactive - If true, adds hover/click effects
 * @param {ReactNode} children - Direct content (NOT CardBody - padding already applied)
 * @param {object} ...props - Additional Chakra props
 */
export const MobileListCard = forwardRef(function MobileListCard(
  { interactive = false, children, ...props },
  ref,
) {
  return (
    <StandardCard
      ref={ref}
      interactive={interactive}
      p={{ base: 4, md: 5 }}
      w="full"
      {...props}
    >
      {children}
    </StandardCard>
  )
})

export default StandardCard
