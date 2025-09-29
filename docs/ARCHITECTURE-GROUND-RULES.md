# NJ Cabinets - Architecture Ground Rules

This document enforces the strict architectural patterns defined in Section 2 of the UI/UX playbook.

## 🚫 Enforced via ESLint

The following violations will **fail CI builds**:

### Legacy Stack Prohibitions
- ❌ `@coreui/*` → Use Chakra UI components
- ❌ `react-icons/*`, `@fortawesome/*` → Use `lucide-react` only
- ❌ `formik`, `yup` → Use React Hook Form
- ❌ `react-select` → Use Chakra Select or custom combobox
- ❌ `sweetalert2`, `react-toastify` → Use Chakra `useToast()`
- ❌ String literals in JSX → Use i18next `t()` function

## ✅ Required Patterns

### 1. Components: Chakra UI Only
```jsx
// ✅ Correct
import { Button, Input, Modal } from '@chakra-ui/react'

// ❌ Wrong - ESLint will fail
import { CButton } from '@coreui/react'
```

### 2. Layout: Tailwind Only
```jsx
// ✅ Correct
<div className="flex gap-4 p-6 sm:grid sm:grid-cols-2">

// ❌ Wrong - Mixed spacing systems
<Box className="flex gap-4" p={6}>
```

### 3. Icons: Lucide React Only
```jsx
// ✅ Correct
import { User, Settings, ChevronDown } from 'lucide-react'

// ❌ Wrong - ESLint will fail
import { FaUser } from 'react-icons/fa'
```

### 4. Forms: React Hook Form Only
```jsx
// ✅ Correct
import { useForm, Controller } from 'react-hook-form'

const MyForm = () => {
  const { control, handleSubmit } = useForm({ mode: 'onBlur' })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email is required' }}
        render={({ field }) => <Input {...field} />}
      />
    </form>
  )
}

// ❌ Wrong - ESLint will fail
import { Formik } from 'formik'
```

### 5. Animations: Framer Motion Only
```jsx
// ✅ Correct
import { motion, useReducedMotion } from 'framer-motion'

const AnimatedBox = () => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { scale: 1.02 }}
      transition={{ duration: 0.2 }}
    />
  )
}
```

### 6. Server State: TanStack Query Only
```jsx
// ✅ Correct
import { useQuery, useMutation } from '@tanstack/react-query'

const ProposalsList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: fetchProposals,
    staleTime: 60_000
  })

  // Never use Redux for server state
}
```

### 7. Images: React Lazy Load Component
```jsx
// ✅ Correct
import { LazyLoadImage } from 'react-lazy-load-image-component'

<LazyLoadImage
  src={imageSrc}
  alt="Description"
  width={400}
  height={300}
  placeholderSrc="blur.jpg"
/>

// ❌ Wrong
<img src={imageSrc} alt="Description" />
```

### 8. Text: i18next Only
```jsx
// ✅ Correct
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()

  return (
    <Button>{t('common.save')}</Button>
  )
}

// ❌ Wrong - ESLint will fail
<Button>Save</Button>
```

## 🎯 Breakpoint System

Single source of truth - Tailwind defaults mirrored in Chakra:

```js
// Tailwind (tailwind.config.cjs)
screens: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// Chakra (theme/index.js) - mirrors exactly
breakpoints: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

## 🔒 Spacing Rules

**Never mix Chakra spacing props with Tailwind classes on the same element:**

```jsx
// ✅ Correct - Tailwind for layout
<div className="p-6 m-4 gap-2">
  <Button colorScheme="brand">Save</Button>
</div>

// ❌ Wrong - Mixed systems
<Box className="flex gap-4" p={6} m={4}>
```

## 🚀 Performance Requirements

### Images
- Always set explicit `width`/`height`
- Use `LazyLoadImage` for all images > 10KB
- Prefer WebP/AVIF formats
- Include blurred placeholders

### Code Splitting
- Route-level splitting with `React.lazy()`
- Defer heavy widgets until needed
- Lazy load PDF viewers and editors

### Bundle Optimization
- Tree-shake icon imports: `import { User } from 'lucide-react'`
- Remove unused dependencies
- Keep list renders under 500 items

## 📋 Compliance Checklist

Before any PR merge, verify:

- [ ] ESLint passes with zero architectural violations
- [ ] No mixed Chakra/Tailwind spacing on same elements
- [ ] All icons from `lucide-react`
- [ ] All forms use React Hook Form
- [ ] All server state via TanStack Query
- [ ] All images use `LazyLoadImage`
- [ ] All text strings use `t()` from i18next
- [ ] Animations respect `useReducedMotion()`

**Failure to comply will result in failed CI builds and PR rejection.**
