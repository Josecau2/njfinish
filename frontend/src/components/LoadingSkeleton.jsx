import { Skeleton, Stack, SimpleGrid } from '@chakra-ui/react';

export function PageSkeleton() {
  return (
    <Stack spacing={6}>
      <Skeleton height="60px" />
      <Skeleton height="200px" />
      <Skeleton height="150px" />
    </Stack>
  );
}

export function TileSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton height="150px" borderRadius="md" /> {/* Image */}
      <Skeleton height="20px" width="60%" />
      <Skeleton height="16px" width="40%" />
    </Stack>
  );
}

export function TileGridSkeleton({ count = 8 }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
      {Array.from({ length: count }).map((_, i) => (
        <TileSkeleton key={i} />
      ))}
    </SimpleGrid>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <Stack spacing={4}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="48px" />
      ))}
    </Stack>
  );
}