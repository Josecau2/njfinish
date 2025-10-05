import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import {
  Box,
  SimpleGrid,
  Heading,
  Stack,
  Link,
  Text,
  Code,
  Button,
  IconButton,
  VStack,
  HStack,
  Divider,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { RefreshCcw, ExternalLink } from 'lucide-react'

const FALLBACK_MANIFEST = {
  routes: [],
  modals: [],
  components: [],
  buttons: ['Primary', 'Secondary', 'Tertiary', 'Destructive', 'IconOnly'],
}

let manifestPromise

const manifestUrl = new URL('../../../../AUDIT/manifest.json', import.meta.url)

async function fetchManifest() {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        const response = await fetch(`${manifestUrl.href}?t=${Date.now()}`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        return {
          ...FALLBACK_MANIFEST,
          ...data,
        }
      } catch (error) {
        console.warn('[__audit__] Failed to load manifest.json, using fallback', error)
        return FALLBACK_MANIFEST
      }
    })()
  }

  return manifestPromise
}

function useManifest() {
  const [manifest, setManifest] = useState(FALLBACK_MANIFEST)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchManifest().then((data) => {
      if (!cancelled) {
        setManifest(data)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { manifest, loading }
}

const componentModules = import.meta.glob('../../components/**/*.{jsx,tsx}', { eager: false })

function resolveModuleImporter(name, { allowNonComponent = false } = {}) {
  const normalized = `${name}`.replace(/\.jsx?$/i, '').replace(/\.tsx?$/i, '')
  const entry = Object.entries(componentModules).find(([path]) => {
    if (!allowNonComponent && path.includes('/__tests__/')) return false
    return path.endsWith(`/${normalized}.jsx`) || path.endsWith(`/${normalized}.tsx`)
  })
  return entry ? entry[1] : null
}


export function AuditRoutes() {
  if (import.meta.env.PROD) {
    return <Box p={8}>Audit routes are dev-only</Box>
  }

  return (
    <Routes>
      <Route index element={<AuditIndex />} />
      <Route path="modals" element={<ModalsPlayground />} />
      <Route path="components" element={<ComponentsGrid />} />
      <Route path="buttons" element={<ButtonVariants />} />
    </Routes>
  )
}

function ManifestHeader({ title, description, actions }) {
  return (
    <Box mb={6}>
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      {description ? (
        <Text color={useColorModeValue("gray.600","gray.300")} mb={actions?.length ? 4 : 0}>
          {description}
        </Text>
      ) : null}
      {actions?.length ? (
        <HStack spacing={3}>{actions}</HStack>
      ) : null}
    </Box>
  )
}

function AuditIndex() {
  const { manifest, loading } = useManifest()

  return (
    <Box p={8}>
      <ManifestHeader
        title="UI Audit Playground"
        description="Manifest-backed dashboards for ad-hoc component, modal, and button verification."
        actions={[
          <Button
            key="refresh"
            leftIcon={<RefreshCcw size={16} />}
            variant="outline"
            size="sm"
            onClick={() => {
              manifestPromise = null
              fetchManifest().then(() => window.location.reload())
            }}
          >
            Refresh manifest
          </Button>,
          <Button
            key="open"
            rightIcon={<ExternalLink size={16} />}
            as={Link}
            href="/AUDIT/manifest.json"
            variant="ghost"
            size="sm"
            isExternal
          >
            Manifest JSON
          </Button>,
        ]}
      />

      <Stack spacing={4}>
        <Link href="/__audit__/modals" color="brand.500" minH="44px" py={2}>
          Modals Playground
          <Badge ml={2}>{loading ? '…' : manifest.modals.length}</Badge>
        </Link>
        <Link href="/__audit__/components" color="brand.500" minH="44px" py={2}>
          Components Grid
          <Badge ml={2}>{loading ? '…' : manifest.components.length}</Badge>
        </Link>
        <Link href="/__audit__/buttons" color="brand.500" minH="44px" py={2}>
          Button Variants
          <Badge ml={2}>{loading ? '…' : manifest.buttons.length}</Badge>
        </Link>
      </Stack>
    </Box>
  )
}

function ModalsPlayground() {
  const params = new URLSearchParams(window.location.search)
  const modalName = params.get('open')
  const { manifest } = useManifest()
  const [ModalComponent, setModalComponent] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const openModal = async (name) => {
    setLoadError(null)
    const importer = resolveModuleImporter(name, { allowNonComponent: true })

    if (!importer) {
      setLoadError(`No module matching ${name}`)
      return
    }

    try {
      const module = await importer()
      const Comp = module?.default || module?.[name]
      if (!Comp) {
        throw new Error('Module does not export a component')
      }
      setModalComponent(() => Comp)
      setIsOpen(true)
    } catch (error) {
      console.error('Modal load error:', error)
      setLoadError(`Failed to load modal: ${name}`)
    }
  }

  useEffect(() => {
    if (modalName) {
      openModal(modalName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalName])

  if (!modalName) {
    return (
      <Box p={8}>
        <ManifestHeader
          title="Modal Playground"
          description="Click a manifest-backed modal to open it inline."
        />
        <Stack spacing={2}>
          {manifest.modals.map((name) => (
            <Button
              key={name}
              variant="outline"
              onClick={() => openModal(name)}
              size="sm"
              justifyContent="flex-start"
              minH="44px"
            >
              {name}
            </Button>
          ))}
          {manifest.modals.length === 0 && (
            <Text color={useColorModeValue("gray.500","gray.400")}>No modals defined in manifest.json</Text>
          )}
        </Stack>
      </Box>
    )
  }

  return (
    <Box p={8}>
      <ManifestHeader
        title={`Testing modal: ${modalName}`}
        description="Modals are mounted with minimal props. Provide dedicated playgrounds if additional setup is required."
        actions={[
          <Button key="back" variant="ghost" onClick={() => window.history.back()}>
            Back
          </Button>,
        ]}
      />
      <Button onClick={() => openModal(modalName)} colorScheme="brand" mb={4}>
        Re-open {modalName}
      </Button>
      {loadError && <Text color={useColorModeValue("red.500","red.300")}>{loadError}</Text>}
      {ModalComponent && (
        <ModalComponent
          isOpen={isOpen}
          visible={isOpen}
          onClose={() => setIsOpen(false)}
          onReject={() => setIsOpen(false)}
        />
      )}
    </Box>
  )
}

function ComponentsGrid() {
  const { manifest } = useManifest()

  return (
    <Box p={8}>
      <ManifestHeader
        title="Components"
        description="Inventory sourced from AUDIT/manifest.json. Render props are not auto-generated to avoid runtime crashes—use this grid as a navigation aid."
      />
      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
        {manifest.components.map((name) => (
          <Box key={name} p={4} borderWidth="1px" borderRadius="md" minH="120px">
            <Heading size="sm" mb={2}>
              {name}
            </Heading>
            <Text fontSize="sm" color={useColorModeValue("gray.600","gray.300")}>
              Add a bespoke preview if this component needs runtime props.
            </Text>
            {!resolveModuleImporter(name) && (
              <Text mt={3} fontSize="xs" color={useColorModeValue("red.500","red.300")}>
                Component module not found in src/components (check manifest entry)
              </Text>
            )}
          </Box>
        ))}
        {manifest.components.length === 0 && (
          <Box p={6} borderWidth="1px" borderRadius="md">
            <Heading size="sm" mb={2}>
              No shared components found
            </Heading>
            <Text color={useColorModeValue("gray.600","gray.300")}>
              Populate AUDIT/manifest.json via the generator script.
            </Text>
          </Box>
        )}
      </SimpleGrid>
    </Box>
  )
}

const BUTTON_VARIANT_PRESETS = {
  Primary: (props) => (
    <Button colorScheme="brand" minH="44px" {...props}>
      Primary
    </Button>
  ),
  Secondary: (props) => (
    <Button variant="outline" minH="44px" {...props}>
      Secondary
    </Button>
  ),
  Tertiary: (props) => (
    <Button variant="ghost" minH="44px" {...props}>
      Tertiary
    </Button>
  ),
  Destructive: (props) => (
    <Button colorScheme="red" minH="44px" {...props}>
      Destructive
    </Button>
  ),
  IconOnly: (props) => (
    <IconButton aria-label="Icon only" icon={<ExternalLink size={16} />} minW="44px" minH="44px" {...props} />
  ),
}

function ButtonVariants() {
  const { manifest } = useManifest()
  const variants = manifest.buttons.length ? manifest.buttons : FALLBACK_MANIFEST.buttons

  return (
    <Box p={8}>
      <ManifestHeader
        title="Button Variants"
        description="Validate hit-area and styling for each declared button variant."
      />
      <VStack spacing={8} align="stretch">
        {variants.map((variant) => {
          const Renderer = BUTTON_VARIANT_PRESETS[variant]
          return (
            <Box key={variant}>
              <Heading size="xs" mb={3} textTransform="uppercase" letterSpacing="0.08em">
                {variant}
              </Heading>
              <HStack spacing={4} wrap="wrap">
                {Renderer ? (
                  <>
                    <Renderer size="sm" />
                    <Renderer size="md" />
                    <Renderer size="lg" />
                  </>
                ) : (
                  <Text color="orange.500">No preset for variant "{variant}"</Text>
                )}
              </HStack>
            </Box>
          )
        })}
        <Divider />
        <Text fontSize="sm" color={useColorModeValue("gray.600","gray.300")}>
          Need bespoke fixtures? Extend BUTTON_VARIANT_PRESETS in <Code>src/routes/__audit__/index.jsx</Code>.
        </Text>
      </VStack>
    </Box>
  )
}


