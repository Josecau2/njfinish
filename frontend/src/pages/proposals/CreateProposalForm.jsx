import StandardCard from '../../components/StandardCard'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
import { Badge, Box, Button, CardBody, Container, Flex, HStack, Icon, Spinner, Stack, Text, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import { ClipboardList, Settings as SettingsIcon, FileSignature, Printer, Mail, FileText } from 'lucide-react'

import CustomerInfoStep from './CreateProposal/CustomerInfo'
import ManufacturerStep from './CreateProposal/ManufacturerSelect'
import DesignImportStep from './CreateProposal/DesignUpload'
import ItemSelectionStep from './CreateProposal/ProposalSummary'
import PrintProposalModal from '../../components/model/PrintProposalModal'
import EmailProposalModal from '../../components/model/EmailProposalModal'
import EmailContractModal from '../../components/model/EmailContractModal'
import { fetchManufacturerById } from '../../store/slices/manufacturersSlice'
import { sendFormDataToBackend } from '../../queries/proposalQueries'
import withContractorScope from '../../components/withContractorScope'
import PageHeader from '../../components/PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const TOTAL_STEPS = 4

const stepDefinitions = (t) => [
  { number: 1, title: t('proposals.create.steps.1'), icon: ClipboardList },
  { number: 2, title: t('proposals.create.steps.2'), icon: SettingsIcon },
  { number: 3, title: t('proposals.create.steps.3'), icon: FileSignature },
  { number: 4, title: t('proposals.create.steps.4'), icon: Printer },
]

const ProposalForm = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const location = useLocation()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const queryParams = new URLSearchParams(location.search)
  const isQuick = queryParams.get('quick') === 'yes'

  const [currentStep, setCurrentStep] = useState(isQuick ? 2 : 1)
  const [backStep, setBackStep] = useState(false)
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    designer: '',
    description: '',
    measurementDone: false,
    designDone: false,
    measurementDate: null,
    designDate: null,
    location: '',
    salesRep: '',
    leadSource: '',
    type: '',
    manufacturerId: '',
    versionName: '',
    assembled: true,
    totalPrice: 0,
    status: '',
    manufacturersData: [],
  })
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [isFormDirty, setIsFormDirty] = useState(true)

  const manufacturerData = useSelector((state) => state.manufacturers.selected)

  useEffect(() => {
    if (!isFormDirty) return

    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const handlePopState = () => {
      const confirmLeave = window.confirm(
        t('common.unsavedConfirm', 'You have unsaved changes. Are you sure you want to leave?'),
      )

      if (!confirmLeave) {
        window.history.pushState(null, '', window.location.pathname)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }

    window.history.pushState(null, '', window.location.pathname)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isFormDirty, t])

  useEffect(() => {
    if (formData.manufacturerId) {
      dispatch(fetchManufacturerById({ id: formData.manufacturerId, includeCatalog: false }))
    }
  }, [dispatch, formData.manufacturerId])

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const handleStyleSelect = (styleId) => {
    const updatedData = [...formData.manufacturersData]
    const lastEntry = updatedData[updatedData.length - 1]

    if (lastEntry) {
      lastEntry.selectedStyle = styleId
      updatedData[updatedData.length - 1] = lastEntry

      updateFormData({ manufacturersData: updatedData })
    }

    nextStep()
  }

  const nextStep = () => {
    console.log('nextStep called, currentStep:', currentStep, 'TOTAL_STEPS:', TOTAL_STEPS)
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, TOTAL_STEPS)
      console.log('Setting currentStep from', prev, 'to', next)
      return next
    })
  }

  const prevStep = () => {
    if (currentStep <= 1) {
      navigate('/quotes')
      return
    }

    let step = backStep ? TOTAL_STEPS : currentStep - 1
    if (step < 1) step = 1
    setCurrentStep(step)
  }

  const sendToBackend = async (actionType) => {
    try {
      const payload = {
        action: actionType,
        formData: { ...formData, type: actionType },
      }

      const response = await sendFormDataToBackend(payload)

      if (response.data.success === true) {
        Swal.fire(
          t('common.success', 'Success'),
          t('proposals.toast.successSend', 'Quote sent successfully'),
          'success',
        )
        setIsFormDirty(false)
        navigate('/quotes')
      } else {
        Swal.fire(
          t('common.error', 'Error'),
          response.data?.message ||
            t('proposals.errors.operationFailed', 'Operation failed. Please try again.'),
          'error',
        )
      }
    } catch (error) {
      if (error.response?.status === 403) {
        Swal.fire(
          t('common.error', 'Error'),
          t('settings.customization.ui.alerts.saveFailed', 'Failed to save customization. Please try again.'),
          'error',
        )
      } else if (error.response?.status === 400) {
        const message =
          error.response?.data?.message ||
          t('proposals.errors.operationFailed', 'Operation failed. Please try again.')
        Swal.fire(t('common.error', 'Error'), message, 'error')
      } else {
        Swal.fire(
          t('common.error', 'Error'),
          error.message || t('proposals.toast.errorGeneric', 'An error occurred'),
          'error',
        )
      }
    }
  }

  const getStepInfo = () => {
    const steps = stepDefinitions(t)
    return steps.find((step) => step.number === currentStep) || steps[0]
  }

  const currentStepInfo = getStepInfo()

  const renderActionButtons = () => {
    if (currentStep !== TOTAL_STEPS) return null

    return (
      <HStack spacing={4} flexWrap="wrap">
        <Button
          colorScheme="green"
          leftIcon={<Icon as={Printer} boxSize={ICON_BOX_MD} />}
          minH="44px"
          maxW={{ base: "140px", md: "none" }}
          onClick={() => setShowPrintModal(true)}
          fontSize={{ base: "sm", md: "md" }}
        >
          {t('proposals.create.actions.print')}
        </Button>
        {!isContractor && (
          <>
            <Button
              colorScheme="brand"
              leftIcon={<Icon as={Mail} boxSize={ICON_BOX_MD} />}
              minH="44px"
              maxW={{ base: "140px", md: "none" }}
              onClick={() => setShowEmailModal(true)}
              fontSize={{ base: "sm", md: "md" }}
            >
              {t('proposals.create.actions.email')}
            </Button>
            <Button
              colorScheme="yellow"
              leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} />}
              minH="44px"
              maxW={{ base: "140px", md: "none" }}
              onClick={() => setShowContractModal(true)}
              fontSize={{ base: "sm", md: "md" }}
            >
              {t('proposals.create.actions.contract')}
            </Button>
          </>
        )}
      </HStack>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CustomerInfoStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            hideBack={false}
            isContractor={isContractor}
            contractorGroupId={contractorGroupId}
          />
        )
      case 2:
        return (
          <ManufacturerStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            hideBack={false}
          />
        )
      case 3:
        if (!manufacturerData || Object.keys(manufacturerData).length === 0) {
          return (
            <StandardCard variant="outline">
              <CardBody textAlign="center" py={10}>
                <Spinner size="lg" color="brand.500" />
                <Text mt={4} color={loadingTextColor}>
                  {t('proposals.create.loadingManufacturer')}
                </Text>
              </CardBody>
            </StandardCard>
          )
        }

        return (
          <DesignImportStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            manufacturerData={manufacturerData}
            onStyleSelect={handleStyleSelect}
            hideBack={false}
          />
        )
      case 4:
        return (
          <ItemSelectionStep
            setFormData={setFormData}
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            manufacturerData={manufacturerData}
            setCurrentStep={setCurrentStep}
            setBackStep={setBackStep}
            sendToBackend={sendToBackend}
            hideBack={false}
          />
        )
      default:
        return null
    }
  }

  const stickyBg = useColorModeValue('whiteAlpha.900', 'gray.800')
  const stickyBorder = useColorModeValue('gray.200', 'gray.700')
  const progressLineBg = useColorModeValue('gray.200', 'gray.700')
  const progressActiveBg = useColorModeValue('gray.900', 'gray.100')
  const stepActiveTextColor = useColorModeValue('white', 'gray.900')
  const stepInactiveBg = useColorModeValue('white', 'gray.800')
  const stepInactiveColor = useColorModeValue('gray.600', 'gray.300')
  const stepBorderInactive = useColorModeValue('gray.300', 'gray.600')
  const loadingTextColor = useColorModeValue("gray.500", "gray.400")

  const headerActions = [
    <Badge key="mode" variant="subtle" colorScheme={isQuick ? 'purple' : 'gray'} px={3} py={1} borderRadius="md">
      {isQuick ? t('proposals.create.quickMode') : t('proposals.create.standardMode')}
    </Badge>,
  ]

  const actionButtons = renderActionButtons()
  if (actionButtons) {
    headerActions.push(<Box key="actions">{actionButtons}</Box>)
  }

  return (
    <PageContainer className="proposal-create">
      <Stack spacing={6}>
        <PageHeader
          title={currentStepInfo.title}
          subtitle={t('proposals.create.stepOf', { current: currentStep, total: TOTAL_STEPS })}
          icon={currentStepInfo.icon}
          actions={headerActions}
        />

        <StandardCard variant="outline" aria-label={t('proposals.create.progress', 'Progress')}>
          <CardBody py={4}>
            <Box position="relative" px={{ base: 2, md: 6 }}>
              <Box
                position="absolute"
                left={0}
                right={0}
                top="50%"
                transform="translateY(-50%)"
                height="2px"
                bg={progressLineBg}
                zIndex={1}
              />
              <Box
                position="absolute"
                left={0}
                top="50%"
                transform="translateY(-50%)"
                height="2px"
                bg={progressActiveBg}
                width={`${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`}
                transition="width 0.3s ease"
                zIndex={2}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(((currentStep - 1) / (TOTAL_STEPS - 1)) * 100)}
                aria-label={t('proposals.create.stepOf', { current: currentStep, total: TOTAL_STEPS })}
              />
              <Flex justify="space-between" position="relative" zIndex={3}>
                {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((step) => {
                  const isActive = step <= currentStep
                  return (
                    <Flex
                      key={step}
                      align="center"
                      justify="center"
                      w={9}
                      h={9}
                      borderRadius="full"
                      bg={isActive ? progressActiveBg : stepInactiveBg}
                      color={isActive ? stepActiveTextColor : stepInactiveColor}
                      fontSize="sm"
                      fontWeight={isActive ? 'extrabold' : 'semibold'}
                      borderWidth="2px"
                      borderColor={isActive ? progressActiveBg : stepBorderInactive}
                      boxShadow={isActive ? 'md' : 'sm'}
                    >
                      {step}
                    </Flex>
                  )
                })}
              </Flex>
            </Box>
          </CardBody>
        </StandardCard>

        <Box>{renderStep()}</Box>

        {currentStep < TOTAL_STEPS && (
          <Box
            position="sticky"
            bottom={0}
            zIndex={1030}
            bg={stickyBg}
            borderTopWidth="1px"
            borderColor={stickyBorder}
            px={3}
            py={3}
            display={{ base: 'block', md: 'none' }}
            style={{ backdropFilter: 'saturate(140%) blur(8px)' }}
          >
            <HStack spacing={4}>
              <Button
                variant="outline"
                colorScheme="gray"
                onClick={prevStep}
                aria-label={t('common.back', 'Back')}
                flex={1}
                minH="44px"
              >
                {t('common.back', 'Back')}
              </Button>
              <Button
                colorScheme="brand"
                onClick={nextStep}
                aria-label={t('common.next', 'Next')}
                flex={1}
                minH="44px"
              >
                {t('common.next', 'Next')}
              </Button>
            </HStack>
          </Box>
        )}

        <PrintProposalModal
          show={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          formData={formData}
        />
        <EmailProposalModal
          show={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          formData={formData}
        />
        <EmailContractModal show={showContractModal} onClose={() => setShowContractModal(false)} />
      </Stack>
    </PageContainer>
  )
}

export default withContractorScope(ProposalForm, 'proposals', ['proposals:create'])
