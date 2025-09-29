import React, { useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { encodeId, decodeParam, genNoise } from '../utils/obfuscate'

// Generic redirect helper component factory
function makeRedirect(buildTargetPath) {
  return function Redirector() {
    const navigate = useNavigate()
    const params = useParams()
    const location = useLocation()

    useEffect(() => {
      try {
        const noise1 = genNoise()
        const noise2 = genNoise()
        const target = buildTargetPath({ params, noise1, noise2 })
        if (target && target !== location.pathname) {
          navigate(target + (location.search || ''), { replace: true })
        }
      } catch (_) {
        // If something goes wrong, just stay on the current page
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
  }
}

export const RedirectToNoisyEditProposal = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/proposals/edit/${encodeId(id)}`
})

export const RedirectToNoisyEditCustomer = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/customers/edit/${encodeId(id)}`
})

export const RedirectToNoisyEditManufacturer = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/settings/manufacturers/edit/${encodeId(id)}`
})

export const RedirectToNoisyEditUser = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/settings/users/edit/${encodeId(id)}`
})

export const RedirectToNoisyEditUserGroup = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/settings/users/group/edit/${encodeId(id)}`
})

export const RedirectToNoisyEditLocation = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.id
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/settings/locations/edit/${encodeId(id)}`
})

export const RedirectToNoisyContractorDetail = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.groupId
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/admin/contractors/${encodeId(id)}`
})

export const RedirectToNoisyAdminProposalView = makeRedirect(({ params, noise1, noise2 }) => {
  const raw = params?.proposalId
  const id = decodeParam(raw)
  return `/${noise1}/${noise2}/proposals/${encodeId(id)}/admin-view`
})

export default {
  RedirectToNoisyEditProposal,
  RedirectToNoisyEditCustomer,
  RedirectToNoisyEditManufacturer,
  RedirectToNoisyEditUser,
  RedirectToNoisyEditUserGroup,
  RedirectToNoisyEditLocation,
  RedirectToNoisyContractorDetail,
  RedirectToNoisyAdminProposalView,
}
