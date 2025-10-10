import React from 'react'
import { Card, CardBody, TableContainer, useColorModeValue } from '@chakra-ui/react'

/**
 * TableCard - Reusable table wrapper component with consistent styling
 *
 * Provides:
 * - Card elevation/shadow for depth
 * - Border with theme-aware colors
 * - Rounded corners
 * - Dark mode support
 * - Consistent spacing
 *
 * @param {React.ReactNode} children - Table component to wrap
 * @param {object} cardProps - Additional props to pass to Card component
 * @param {object} containerProps - Additional props to pass to TableContainer
 */
export const TableCard = ({
  children,
  cardProps = {},
  containerProps = {},
  ...rest
}) => {
  // Theme-aware colors
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const bgColor = useColorModeValue('white', 'gray.900')

  return (
    <Card
      mb={6}
      bg={bgColor}
      boxShadow="sm"
      borderRadius="lg"
      overflow="hidden"
      {...cardProps}
      {...rest}
    >
      <CardBody p={0}>
        <TableContainer
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          overflowX="auto"
          sx={{
            // Enable smooth scrolling on touch devices
            WebkitOverflowScrolling: 'touch',
            // Responsive table scrolling
            '@media (max-width: 768px)': {
              maxWidth: '100vw',
            },
          }}
          {...containerProps}
        >
          {children}
        </TableContainer>
      </CardBody>
    </Card>
  )
}

export default TableCard
