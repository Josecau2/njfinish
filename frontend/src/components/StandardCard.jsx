import { Card } from '@chakra-ui/react'

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
export function StandardCard({
  variant = 'outline',
  interactive = false,
  children,
  ...props
}) {
  const interactiveProps = interactive
    ? {
        cursor: 'pointer',
        _hover: { shadow: 'md', borderColor: 'blue.300' },
        transition: 'all 0.15s ease',
      }
    : {}

  return (
    <Card
      variant={variant}
      borderRadius="lg"
      {...interactiveProps}
      {...props}
    >
      {children}
    </Card>
  )
}

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
export function MobileListCard({ interactive = false, children, ...props }) {
  return (
    <StandardCard
      interactive={interactive}
      p={{ base: 4, md: 5 }}
      {...props}
    >
      {children}
    </StandardCard>
  )
}

export default StandardCard
