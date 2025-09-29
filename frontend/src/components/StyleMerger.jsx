import React, { useState } from 'react'
import { Box, Button, FormControl, FormLabel, Select, Stack } from '@chakra-ui/react'

export default function StyleMerger({ leftStyles = [], rightStyles = [], onMerge }) {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!left || !right || left === right) return
    if (onMerge) {
      onMerge(left, right)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} role="group" aria-label="Select styles to merge">
          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">
              From
            </FormLabel>
            <Select value={left} onChange={(event) => setLeft(event.target.value)} aria-label="Source style">
              <option value="" disabled>
                Choose source style.
              </option>
              {leftStyles.map((style) => (
                <option key={style.value ?? style.id} value={style.value ?? style.id}>
                  {style.label ?? style.name ?? style.id}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" color="gray.500">
              Into
            </FormLabel>
            <Select value={right} onChange={(event) => setRight(event.target.value)} aria-label="Target style">
              <option value="" disabled>
                Choose target style.
              </option>
              {rightStyles.map((style) => (
                <option key={style.value ?? style.id} value={style.value ?? style.id}>
                  {style.label ?? style.name ?? style.id}
                </option>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button
          type="submit"
          variant="outline"
          colorScheme="blue"
          alignSelf="flex-start"
          isDisabled={!left || !right || left === right}
        >
          Merge
        </Button>
      </Stack>
    </Box>
  )
}
