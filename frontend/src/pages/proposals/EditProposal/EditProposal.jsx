import React from 'react'
import withContractorScope from '../../../components/withContractorScope'
import EditProposal from '../EditProposal'

const EditProposalWithScope = (props) => <EditProposal {...props} />

export default withContractorScope(EditProposalWithScope, 'proposals')
