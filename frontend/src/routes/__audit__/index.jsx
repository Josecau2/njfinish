import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, SimpleGrid, Heading, Stack, Link, Text, Button, IconButton, VStack, HStack } from '@chakra-ui/react';

// Default manifest - will be loaded async
let manifestData = {
  modals: [],
  components: [],
  buttons: ["Primary", "Secondary", "Tertiary", "Destructive", "IconOnly"]
};

// Load manifest dynamically
async function loadManifest() {
  try {
    const response = await fetch('/AUDIT/manifest.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Could not load manifest.json', e);
  }
  return manifestData;
}

export function AuditRoutes() {
  // Block in production
  if (import.meta.env.PROD) {
    return <Box p={8}>Audit routes are dev-only</Box>;
  }

  return (
    <Routes>
      <Route index element={<AuditIndex />} />
      <Route path="modals" element={<ModalsPlayground />} />
      <Route path="components" element={<ComponentsGrid />} />
      <Route path="buttons" element={<ButtonVariants />} />
    </Routes>
  );
}

function AuditIndex() {
  return (
    <Box p={8}>
      <Heading size="md" mb={4}>UI Audit Playground</Heading>
      <Stack spacing={4}>
        <Link href="/__audit__/modals" color="brand.500">
          Modals Playground
        </Link>
        <Link href="/__audit__/components" color="brand.500">
          Components Grid
        </Link>
        <Link href="/__audit__/buttons" color="brand.500">
          Button Variants
        </Link>
      </Stack>
    </Box>
  );
}

function ModalsPlayground() {
  const params = new URLSearchParams(location.search);
  const modalName = params.get('open');
  const [isOpen, setIsOpen] = useState(false);
  const [ModalComponent, setModalComponent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [manifest, setManifest] = useState(manifestData);

  useEffect(() => {
    loadManifest().then(setManifest);
  }, []);

  const openModal = async (name) => {
    setLoadError(null);
    try {
      // Try different import paths for modals
      let module;
      try {
        module = await import(`../../components/${name}.jsx`);
      } catch {
        try {
          module = await import(`../../components/model/${name}.jsx`);
        } catch {
          module = await import(`../../components/${name}.tsx`);
        }
      }
      setModalComponent(() => module.default);
      setIsOpen(true);
    } catch (error) {
      setLoadError(`Failed to load modal: ${name}`);
      console.error('Modal load error:', error);
    }
  };

  if (!modalName) {
    return (
      <Box p={8}>
        <Heading size="md" mb={4}>Modal Playground</Heading>
        <Text mb={4} color="gray.600">
          Click a modal name to test it:
        </Text>
        <Stack spacing={2}>
          {manifest.modals.map(name => (
            <Button
              key={name}
              variant="outline"
              onClick={() => openModal(name)}
              size="sm"
              justifyContent="flex-start"
            >
              {name}
            </Button>
          ))}
          {manifest.modals.length === 0 && (
            <Text color="gray.500">No modals found in manifest</Text>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Modal Testing</Heading>
      <Button onClick={() => openModal(modalName)} colorScheme="brand" mb={4}>
        Open {modalName}
      </Button>
      {loadError && <Text color="red.500">{loadError}</Text>}
      {ModalComponent && (
        <ModalComponent
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          visible={isOpen}
          onReject={() => setIsOpen(false)}
        />
      )}
    </Box>
  );
}

function ComponentsGrid() {
  const [manifest, setManifest] = useState(manifestData);

  useEffect(() => {
    loadManifest().then(setManifest);
  }, []);

  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Components Grid</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {manifest.components.map(name => (
          <Box key={name} p={4} borderWidth="1px" borderRadius="md">
            <Heading size="sm" mb={2}>{name}</Heading>
            <Text fontSize="sm" color="gray.600">
              Component preview would go here
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function ButtonVariants() {
  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Button Variants - Tap Target Testing</Heading>
      <Text mb={6} color="gray.600">
        All buttons should be at least 44x44px for touch accessibility.
        Hover over buttons to see their dimensions.
      </Text>
      <VStack spacing={8} align="start">
        <Box>
          <Heading size="xs" mb={3}>Primary Buttons</Heading>
          <HStack spacing={4} wrap="wrap">
            <Button colorScheme="brand" size="sm">Small</Button>
            <Button colorScheme="brand" size="md">Medium</Button>
            <Button colorScheme="brand" size="lg">Large</Button>
          </HStack>
        </Box>

        <Box>
          <Heading size="xs" mb={3}>Secondary Buttons</Heading>
          <HStack spacing={4} wrap="wrap">
            <Button variant="outline" size="sm">Small Outline</Button>
            <Button variant="outline" size="md">Medium Outline</Button>
            <Button variant="outline" size="lg">Large Outline</Button>
          </HStack>
        </Box>

        <Box>
          <Heading size="xs" mb={3}>Tertiary Buttons</Heading>
          <HStack spacing={4} wrap="wrap">
            <Button variant="ghost" size="sm">Small Ghost</Button>
            <Button variant="ghost" size="md">Medium Ghost</Button>
            <Button variant="ghost" size="lg">Large Ghost</Button>
          </HStack>
        </Box>

        <Box>
          <Heading size="xs" mb={3}>Destructive Buttons</Heading>
          <HStack spacing={4} wrap="wrap">
            <Button colorScheme="red" size="sm">Delete Small</Button>
            <Button colorScheme="red" size="md">Delete Medium</Button>
            <Button colorScheme="red" size="lg">Delete Large</Button>
          </HStack>
        </Box>

        <Box>
          <Heading size="xs" mb={3}>Icon-Only Buttons (Must be >= 44x44px)</Heading>
          <HStack spacing={4} wrap="wrap">
            <IconButton aria-label="Menu" icon={<span>☰</span>} size="sm" />
            <IconButton aria-label="Search" icon={<span>🔍</span>} size="md" />
            <IconButton aria-label="Settings" icon={<span>⚙️</span>} size="lg" />
            <IconButton
              aria-label="Minimum size"
              icon={<span>✓</span>}
              minW="44px"
              minH="44px"
              bg="green.100"
            />
          </HStack>
        </Box>

        <Box>
          <Heading size="xs" mb={3}>Disabled States</Heading>
          <HStack spacing={4} wrap="wrap">
            <Button isDisabled>Disabled Primary</Button>
            <Button variant="outline" isDisabled>Disabled Outline</Button>
            <IconButton aria-label="Disabled" icon={<span>✗</span>} isDisabled />
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
}