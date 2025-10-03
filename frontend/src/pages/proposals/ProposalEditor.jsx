import React from 'react'
import { Box, Container } from '@chakra-ui/react'

// Placeholder component to avoid broken imports; real editor lives in EditProposal and CreateProposalForm flow.
const ProposalEditor = () => {
  return (
    <Container py={4} role="status" aria-live="polite">
      <Box>Proposal editor is handled by the Create and Edit flows.</Box>
    </Container>
  )
}

export default ProposalEditor
