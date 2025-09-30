import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, SimpleGrid, Heading, Stack, Link, Text } from '@chakra-ui/react';
import manifest from '../../../AUDIT/manifest.json';

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

  if (!modalName) {
    return (
      <Box p={8}>
        <Heading size="md" mb={4}>Modal Playground</Heading>
        <Text mb={4} color="gray.600">
          Click a modal name to open it:
        </Text>
        <Stack spacing={2}>
          {manifest.modals.map(name => (
            <Link key={name} href={`?open=${name}`} color="brand.500">
              {name}
            </Link>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <Heading size="md" mb={4}>Modal: {modalName}</Heading>
      <Text color="gray.600">
        Modal would be opened here in a real implementation.
        This requires dynamic imports based on modal name.
      </Text>
    </Box>
  );
}

function ComponentsGrid() {
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
      <Heading size="md" mb={4}>Button Variants</Heading>
      <Stack spacing={4}>
        {manifest.buttons.map(variant => (
          <Box key={variant}>
            <Heading size="xs" mb={2}>{variant}</Heading>
            <Text fontSize="sm" color="gray.600">
              Button variant preview would go here
            </Text>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}