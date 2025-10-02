# StandardCard & MobileListCard Guide

## Why these components exist
- Provide one place to tune borders, shadows, radius, and background for every card surface.
- Eliminate one-off CSS overrides (`.card`, `.card-body`, etc.) that previously produced inconsistent spacing.
- Ensure clickable cards share the same hover affordances across desktop and mobile experiences.

## `StandardCard`
- Default props: `variant="outline"`, `borderRadius="lg"`, `bg="white"`, `borderColor="gray.200"`, full-width column layout.
- Automatically stretches to fill its container and stacks children vertically.
- Pass the usual Chakra subcomponents (`CardHeader`, `CardBody`, `CardFooter`) inside. They inherit the standardized padding from Chakra.
- Set `interactive` when the card itself should be clickable. This toggles pointer/hover state; supply `onClick`, `role="button"`, and keyboard handlers where appropriate.

```jsx
import StandardCard from '@/components/StandardCard'
import { CardHeader, CardBody, CardFooter, Heading, Button } from '@chakra-ui/react'

function UpcomingJobsCard({ jobs, onViewAll }) {
  return (
    <StandardCard interactive onClick={onViewAll} role="button" tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onViewAll()
        }
      }}
    >
      <CardHeader>
        <Heading size="md">Upcoming Jobs</Heading>
      </CardHeader>
      <CardBody>
        {/* card contents go here */}
      </CardBody>
      <CardFooter>
        <Button colorScheme="blue">View schedule</Button>
      </CardFooter>
    </StandardCard>
  )
}
```

### Dos and Don'ts
| ✅ Do | 🚫 Don't |
| --- | --- |
| Import `StandardCard`/`MobileListCard` from `@/components/StandardCard` | Import Chakra's `Card`/`CardBody` directly |
| Use Chakra card subcomponents inside `StandardCard` | Add Bootstrap/Tailwind `.card`, `.card-body`, etc. classes |
| Override spacing via Chakra props (`p`, `px`, `py`) when needed | Mutate padding with ad-hoc CSS overrides |
| Mark clickable cards with `interactive`, `onClick`, and keyboard access | Leave cards clickable without a hover cue |

## `MobileListCard`
- Wraps `StandardCard` with mobile-friendly padding `p={{ base: 4, md: 5 }}`.
- Always stretches to 100% of the stack width.
- Designed for stacked list views (orders, proposals, notifications, etc.).
- **Never** add a `CardBody` wrapper; place content directly inside a layout primitive (`VStack`, `Flex`, etc.).

```jsx
import { VStack, Text, Button } from '@chakra-ui/react'
import { MobileListCard } from '@/components/StandardCard'

function OrdersMobileList({ orders, onOpen }) {
  return (
    <VStack spacing={4} align="stretch">
      {orders.map((order) => (
        <MobileListCard
          key={order.id}
          minH="280px"
          interactive
          onClick={() => onOpen(order.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpen(order.id)
            }
          }}
        >
          <VStack spacing={4} align="stretch" h="full" justify="space-between">
            <Text fontWeight="semibold">{order.customerName}</Text>
            <Text color="gray.600">Order #: {order.orderNumber}</Text>
            <Button colorScheme="blue">Make Payment</Button>
          </VStack>
        </MobileListCard>
      ))}
    </VStack>
  )
}
```

### Checklist for mobile cards
- `VStack`/`Flex` parents should use `align="stretch"` so cards span the full width.
- Use `minH` (e.g. `minH="280px"`) to keep cards visually balanced when content length varies.
- Inside the card, set `h="full"` + `justify="space-between"` to anchor actions at the bottom.
- Buttons inside the card must call `event.stopPropagation()` to avoid triggering the card click handler.

## Migration reminders
- Delete any leftover `.card`/`.card-body` CSS overrides; they are superseded by `StandardCard`.
- If a component still renders `<div className="card">`, convert it to `StandardCard` or `MobileListCard` before touching layout.
- Prefer Chakra props over bespoke utility classes for spacing/borders so the design system stays centralized.

## Related work
- `frontend/src/components/StandardCard.jsx`
- `frontend/src/pages/orders/OrdersList.jsx` demonstrates the mobile list layout.
- `docs/unified-proposal-editor.md` covers proposal-specific card patterns built atop the same primitives.
