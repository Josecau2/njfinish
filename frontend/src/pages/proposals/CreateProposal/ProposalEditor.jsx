import React from 'react'
import { Alert, AlertDescription, AlertIcon, Box } from '@chakra-ui/react'

const ProposalEditor = () => {
  return (
    <Box p={4} role="status" aria-live="polite">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          This editor is not used directly. Please use CreateProposalForm.
        </AlertDescription>
      </Alert>
    </Box>
  )
}

export default ProposalEditor
