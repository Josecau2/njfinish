import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice'
import { sendFormDataToBackend } from '../../../queries/proposalQueries'
import axiosInstance from '../../../helpers/axiosInstance'
import CreatableSelect from 'react-select/creatable'
import { Formik } from 'formik'
import * as Yup from 'yup'
import DatePicker from 'react-datepicker'
import { Copy, Edit, File, List, MoreHorizontal, Trash, Trash2, Calendar } from 'lucide-react'
import Swal from 'sweetalert2'
import ItemSelectionContent from '../../../components/ItemSelectionContent'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../../constants/iconSizes'
import FileUploadSection from './FileUploadSection'
import { setSelectVersionNew } from '../../../store/slices/selectVersionNewSlice'
import { validateProposalSubTypeRequirements, showSubTypeValidationError } from '../../../helpers/subTypeValidation'
import 'react-datepicker/dist/react-datepicker.css'

const ItemSelectionStep = ({
  setFormData,
  formData,
  updateFormData,
  setCurrentStep,
  setBackStep,
  sendToBackend,
  prevStep,
  hideBack,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required(t('proposals.create.customerInfo.validation.customerName')),
    description: Yup.string().required(t('proposals.create.customerInfo.validation.description')),
    designer: Yup.string().required(t('proposals.create.customerInfo.validation.designer')),
  })

  const statusOptions = [
    { label: t('proposals.status.draft'), value: 'Draft' },
    { label: t('proposals.status.followUp1'), value: 'Follow up 1' },
    { label: t('proposals.status.followUp2'), value: 'Follow up 2' },
    { label: t('proposals.status.followUp3'), value: 'Follow up 3' },
    { label: t('proposals.status.measurementScheduled'), value: 'Measurement Scheduled' },
    { label: t('proposals.status.measurementDone'), value: 'Measurement done' },
    { label: t('proposals.status.designDone'), value: 'Design done' },
    { label: t('proposals.status.proposalAccepted'), value: 'Proposal accepted' },
    { label: t('proposals.status.proposalRejected'), value: 'Proposal rejected' },
  ]

  const [activeTab, setActiveTab] = useState('item')
  const { list: users } = useSelector((state) => state.users)
  const loggedInUser = JSON.parse(localStorage.getItem('user'))
  const loggedInUserId = loggedInUser.userId

  // Check if user is a contractor (should not see manufacturer version names)
  const isContractor = loggedInUser?.group && loggedInUser.group.group_type === 'contractor'

  const manufacturersById = useSelector((state) => state.manufacturers.byId)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentEditIndex, setCurrentEditIndex] = useState(null)
  const [currentDeleteIndex, setCurrentDeleteIndex] = useState(null)
  const [editedVersionName, setEditedVersionName] = useState('')
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBadgeClick = (index, version) => {
    setSelectedVersionIndex(index)
    setSelectedVersion(version)
  }

  useEffect(() => {
    // Mirror the currently selected version into Redux only when it changes meaningfully
    if (selectedVersion && typeof selectedVersion === 'object') {
      dispatch(setSelectVersionNew(selectedVersion))
    }
  }, [selectedVersion?.versionName, selectedVersion?.manufacturer, dispatch])

  useEffect(() => {
    formData.manufacturersData?.forEach((item) => {
      if (item.manufacturer) {
        // Don't load full catalog data for proposal summary - only manufacturer info needed
        dispatch(fetchManufacturerById({ id: item.manufacturer, includeCatalog: false }))
      }
    })
  }, [formData.manufacturersData, dispatch])

  const versionDetails = formData?.manufacturersData?.map((item) => ({
    ...item,
    manufacturerData: manufacturersById[item.manufacturer],
  }))
  const selectVersion = versionDetails[selectedVersionIndex]

  useEffect(() => {
    if (versionDetails?.length > 0 && selectedVersionIndex === null) {
      setSelectedVersionIndex(0)
      // Initialize with the first version object, not the whole array
      setSelectedVersion(versionDetails[0])
    }
  }, [versionDetails, selectedVersionIndex])

  const handleSaveOrder = () => {
    sendToBackend('0')
  }

  const handleAcceptOrder = async () => {
    if (isSubmitting) return // Prevent duplicate submissions

    try {
      // First, validate sub-type requirements if there are items and a manufacturer
      if (selectedVersion?.items && selectedVersion.items.length > 0 && formData.manufacturerId) {
        const validation = await validateProposalSubTypeRequirements(
          selectedVersion.items,
          formData.manufacturerId,
        )

        if (!validation.isValid) {
          if (import.meta?.env?.DEV)
            console.warn(
              'Sub-type validation failed in ProposalSummary:',
              validation.missingRequirements,
            )
          await showSubTypeValidationError(validation.missingRequirements, Swal)
          return
        }
      }

      const result = await Swal.fire({
        title: t('proposals.confirm.submitTitle', 'Confirm Quote Submission'),
        html: `
          <div style="text-align:left">
            <p>${t('proposals.confirm.submitText', 'Once you submit this quote, it will be sent to production and cannot be changed.')}</p>
            <p>${t('proposals.confirm.submitWarning', 'By continuing, you confirm that all details are correct and you accept the Terms & Conditions.')}</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: t('proposals.confirm.submitConfirm', 'Accept and Submit'),
        cancelButtonText: t('proposals.confirm.goBack', 'Go Back'),
        reverseButtons: true,
        focusCancel: true,
      })

      if (result.isConfirmed) {
        setIsSubmitting(true)

        try {
          // Step 1: First create the proposal (save as draft)
          const createPayload = {
            action: '0', // Save as draft first
            formData: { ...formData, type: '0' },
          }

          const createResponse = await dispatch(sendFormDataToBackend(createPayload))

          if (!createResponse.payload.success) {
            throw new Error(createResponse.payload.message || 'Failed to create quote')
          }

          const newProposalId = createResponse.payload.data?.id

          if (!newProposalId) {
            throw new Error('Quote created but no ID returned')
          }

          // Step 2: Now accept the newly created proposal using the acceptance API
          const acceptResponse = await axiosInstance.post(
            `/api/proposals/${newProposalId}/accept`,
            {
              // No additional data needed for internal acceptance
            },
          )

          if (acceptResponse.data.success) {
            Swal.fire(
              t('common.success', 'Success'),
              t('proposals.success.acceptConverted', 'Quote accepted and converted to order!'),
              'success',
            )
            // Navigate away to prevent duplicate submissions
            navigate('/orders') // Navigate to orders since it's now an accepted quote
          } else {
            throw new Error(acceptResponse.data.message || 'Failed to accept quote')
          }
        } catch (error) {
          if (import.meta?.env?.DEV)
            console.error('Error in handleAcceptOrder:', {
              error: error.message,
              response: error.response?.data,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            })

          // Check if this is a sub-type validation error from backend
          if (error.response?.status === 400 && error.response?.data?.missingRequirements) {
            await showSubTypeValidationError(error.response.data.missingRequirements, Swal)
          } else {
            Swal.fire(
              t('common.error', 'Error'),
              error.message ||
                t('proposals.errors.acceptFailed', 'Failed to accept quote. Please try again.'),
              'error',
            )
          }
          setIsSubmitting(false)
        }
      }
    } catch (_) {
      setIsSubmitting(false)
    }
  }

  const handleRejectOrder = () => {
    sendToBackend('2')
  }

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
  }

  const handleSubmit = (values) => {
    updateFormData(values)
  }

  const openEditModal = (index) => {
    setCurrentEditIndex(index)
    setEditedVersionName(versionDetails[index].versionName)
    setEditModalOpen(true)
  }

  const saveEditVersionName = () => {
    const existingEntry = formData.manufacturersData.find(
      (entry) => entry.versionName === editedVersionName,
    )

    if (existingEntry) {
      Swal.fire({
        icon: 'error',
        title: t('common.error', 'Error'),
        text: t('proposals.create.summary.duplicate', 'Duplicate'),
      })
      return
    }

    const updatedManufacturersData = [...formData.manufacturersData]
    updatedManufacturersData[currentEditIndex].versionName = editedVersionName
    updateFormData({ manufacturersData: updatedManufacturersData })
    setEditModalOpen(false)
  }

  const openDeleteModal = (index) => {
    setCurrentDeleteIndex(index)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    const updatedManufacturersData = formData.manufacturersData.filter(
      (_, i) => i !== currentDeleteIndex,
    )
    updateFormData({ manufacturersData: updatedManufacturersData })
    setDeleteModalOpen(false)
  }

  const duplicateVersion = (index) => {
    const copy = { ...formData.manufacturersData[index] }
    copy.versionName = `${t('common.copyOf', 'Copy of')} ${copy.versionName}`
    updateFormData({ manufacturersData: [...formData.manufacturersData, copy] })
  }

  const designerOptions = users
    .filter((user) => user.id !== loggedInUserId)
    .map((user) => ({ value: user.id, label: user.name }))

  return (
    <>
      <style>{`
        .proposal-summary-form .btn { min-height: 44px; }
        .proposal-version-badges { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      <div className="quote-form-mobile">
        <div className="button-group">
          {!hideBack && (
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={prevStep}
              aria-label={t('common.back', 'Back')}
              borderRadius="6px"
              minW="90px"
              minH="44px"
            >
              Back
            </Button>
          )}
        </div>
        <Formik
          initialValues={formData}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit }) => (
            <React.Fragment>
              <FormControl onSubmit={handleSubmit} className="proposal-summary-form">
                <div className="form-section">
                  <Flex>
                    <Box xs={12} md={2}>
                      <FormLabel htmlFor="designer">Designer *</FormLabel>
                      <CreatableSelect
                        isClearable
                        id="designer"
                        name="designer"
                        options={designerOptions}
                        value={designerOptions.find((opt) => opt.value === values.designer) || null}
                        onChange={(selectedOption) => {
                          updateFormData({
                            ...formData,
                            designer: selectedOption?.value || '',
                          })
                        }}
                        onBlur={handleBlur}
                      />
                      {errors.designer && touched.designer && (
                        <div>{errors.designer}</div>
                      )}
                    </Box>

                    <Box xs={12} md={2}>
                      <FormLabel htmlFor="description">
                        {t('proposals.create.customerInfo.description')} *
                      </FormLabel>
                      <Input
                        type="text"
                        id="description"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={t('proposals.create.customerInfo.descriptionPlaceholder')}
                      />
                      {errors.description && touched.description && (
                        <div>{errors.description}</div>
                      )}
                    </Box>

                    <Box xs={12} md={2}>
                      <FormLabel htmlFor="status">{t('proposals.headers.status')}</FormLabel>
                      <CreatableSelect
                        isClearable
                        options={statusOptions}
                        value={statusOptions.find(
                          (opt) => opt.value === (values.status || 'Draft'),
                        )}
                        onChange={(selectedOption) => {
                          updateFormData({
                            ...formData,
                            status: selectedOption?.value || 'Draft',
                          })
                        }}
                        onBlur={handleBlur}
                        inputId="status"
                      />
                    </Box>

                    <Box xs={12} md={2}>
                      <div style={{ position: 'relative' }}>
                        <FormLabel htmlFor="date">{t('proposals.headers.date')}</FormLabel>
                        <DatePicker
                          id="date"
                          selected={values.date ? new Date(values.date) : null}
                          onChange={(date) => {
                            const current = values.date ? new Date(values.date) : null
                            const changed =
                              (!current && !!date) ||
                              (!!current && !date) ||
                              (!!current && !!date && current.getTime() !== date.getTime())
                            if (changed) {
                              handleChange({ target: { name: 'date', value: date } })
                              updateFormData({ ...formData, date })
                            }
                          }}
                         
                          dateFormat="MM/dd/yyyy"
                          wrapperClassName="w-100"
                          placeholderText={t('proposals.headers.date')}
                        />
                        <Icon as={Calendar}
                          style={{
                            position: 'absolute',
                            top: '70%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            color: "gray.500",
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    </Box>

                    <Box xs={12} md={2}>
                      <div style={{ position: 'relative' }}>
                        <FormLabel htmlFor="designDate">
                          {t('proposals.create.customerInfo.designDoneDate')}
                        </FormLabel>
                        <DatePicker
                          id="designDate"
                          selected={values.designDate ? new Date(values.designDate) : null}
                          onChange={(date) => {
                            const current = values.designDate ? new Date(values.designDate) : null
                            const changed =
                              (!current && !!date) ||
                              (!!current && !date) ||
                              (!!current && !!date && current.getTime() !== date.getTime())
                            if (changed) {
                              handleChange({ target: { name: 'designDate', value: date } })
                              updateFormData({ ...formData, designDate: date })
                            }
                          }}
                         
                          dateFormat="MM/dd/yyyy"
                          wrapperClassName="w-100"
                          placeholderText={t('proposals.create.customerInfo.designDoneDate')}
                        />
                        <Icon as={Calendar}
                          style={{
                            position: 'absolute',
                            top: '70%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            color: "gray.500",
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    </Box>

                    <Box xs={12} md={2}>
                      <div style={{ position: 'relative' }}>
                        <FormLabel htmlFor="measurementDate">
                          {t('proposals.create.customerInfo.measurementDoneDate')}
                        </FormLabel>
                        <DatePicker
                          id="measurementDate"
                          selected={
                            values.measurementDate ? new Date(values.measurementDate) : null
                          }
                          onChange={(date) => {
                            const current = values.measurementDate
                              ? new Date(values.measurementDate)
                              : null
                            const changed =
                              (!current && !!date) ||
                              (!!current && !date) ||
                              (!!current && !!date && current.getTime() !== date.getTime())
                            if (changed) {
                              handleChange({ target: { name: 'measurementDate', value: date } })
                              updateFormData({ ...formData, measurementDate: date })
                            }
                          }}
                         
                          dateFormat="MM/dd/yyyy"
                          wrapperClassName="w-100"
                          placeholderText={t('proposals.create.customerInfo.measurementDoneDate')}
                        />
                        <Icon as={Calendar}
                          style={{
                            position: 'absolute',
                            top: '70%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            color: "gray.500",
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    </Box>

                    {/* Follow up dates commented out
                  <Box xs={12} md={2}>
                    <div style={{ position: 'relative' }}>
                      <FormLabel htmlFor="followUp1Date">{t('proposals.status.followUp1')} {t('proposals.headers.date')}</FormLabel>
                      <DatePicker
                        id="followUp1Date"
                        selected={values.followUp1Date ? new Date(values.followUp1Date) : null}
                        onChange={(date) => {
                          const current = values.followUp1Date ? new Date(values.followUp1Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp1Date', value: date } });
                            updateFormData({ ...formData, followUp1Date: date });
                          }
                        }}
                       
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp1')} ${t('proposals.headers.date')}`}
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: "gray.500",
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </Box>

                  <Box xs={12} md={2}>
                    <div style={{ position: 'relative' }}>
                      <FormLabel htmlFor="followUp2Date">{t('proposals.status.followUp2')} {t('proposals.headers.date')}</FormLabel>
                      <DatePicker
                        id="followUp2Date"
                        selected={values.followUp2Date ? new Date(values.followUp2Date) : null}
                        onChange={(date) => {
                          const current = values.followUp2Date ? new Date(values.followUp2Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp2Date', value: date } });
                            updateFormData({ ...formData, followUp2Date: date });
                          }
                        }}
                       
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp2')} ${t('proposals.headers.date')}`}
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: "gray.500",
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </Box>

                  <Box xs={12} md={2}>
                    <div style={{ position: 'relative' }}>
                      <FormLabel htmlFor="followUp3Date">{t('proposals.status.followUp3')} {t('proposals.headers.date')}</FormLabel>
                      <DatePicker
                        id="followUp3Date"
                        selected={values.followUp3Date ? new Date(values.followUp3Date) : null}
                        onChange={(date) => {
                          const current = values.followUp3Date ? new Date(values.followUp3Date) : null;
                          const changed = (!current && !!date) || (!!current && !date) || (!!current && !!date && current.getTime() !== date.getTime());
                          if (changed) {
                            handleChange({ target: { name: 'followUp3Date', value: date } });
                            updateFormData({ ...formData, followUp3Date: date });
                          }
                        }}
                       
                        dateFormat="MM/dd/yyyy"
                        placeholderText={`${t('proposals.status.followUp3')} ${t('proposals.headers.date')}`}
                        wrapperClassName="w-100"
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          top: '70%',
                          right: '12px',
                          transform: 'translateY(-50%)',
                          color: "gray.500",
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </Box>
                  */}
                  </Flex>
                </div>
              </FormControl>

              <div className="proposal-version-badges">
                {versionDetails.map((version, index) => {
                  const isSelected = index === selectedVersionIndex
                  return (
                    <Badge
                      key={index}
                      className={`proposal-version-badge p-2 d-flex ${isSelected ? 'selected' : ''}`}
                      style={{ fontSize: "sm",
                        backgroundColor: isSelected ? '#084298' : '#d0e7ff',
                        color: isSelected ? '#d0e7ff' : '#084298',
                        borderRadius: '5px',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => handleBadgeClick(index, version)}
                    >
                      <div>
                        {!isContractor && (
                          <strong style={{ display: 'block' }}>{version.versionName}</strong>
                        )}
                        <small
                          style={{ fontSize: "xs", color: isSelected ? '#a9c7ff' : '#4a6fa5' }}
                        >
                          $ {version.manufacturerData?.costMultiplier || 'N/A'}
                        </small>
                      </div>

                      {!isContractor && (
                        <Menu onClick={(e) => e.stopPropagation()}>
                          <MenuButton
                            color="transparent"
                            size="sm"
                            style={{
                              padding: '0 4px',
                              color: isSelected ? '#d0e7ff' : '#084298',
                              backgroundColor: 'transparent',
                              border: 'none',
                              outline: 'none',
                              boxShadow: 'none',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon as={MoreHorizontal} />
                          </MenuButton>
                          <MenuList
                            style={{
                              minWidth: '120px',
                              border: '1px solid #e0e0e0',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              borderRadius: '4px',
                              padding: '4px 0',
                            }}
                          >
                            <MenuItem
                              onClick={() => openEditModal(index)}
                              style={{ padding: '6px 12px',
                                fontSize: "sm",
                                color: '#333',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Icon as={Edit} /> {t('common.edit')}
                            </MenuItem>
                            <MenuItem
                              onClick={() => openDeleteModal(index)}
                              style={{ padding: '6px 12px',
                                fontSize: "sm",
                                color: "red.500",
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Icon as={Trash} /> {t('common.delete')}
                            </MenuItem>
                            <MenuItem
                              onClick={() => duplicateVersion(index)}
                              style={{ padding: '6px 12px',
                                fontSize: "sm",
                                color: '#333',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Icon as={Copy} />{' '}
                              {t('proposals.create.summary.duplicate')}
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      )}
                    </Badge>
                  )
                })}
              </div>
              <Divider my={6} />

              <Tabs
                index={activeTab === 'file' ? 1 : 0}
                onChange={(index) => handleTabSelect(index === 1 ? 'file' : 'item')}
                colorScheme='brand'
                variant='enclosed'
              >
                <TabList>
                  <Tab>
                    <Flex align='center' gap={4}>
                      <Icon as={List} boxSize={ICON_BOX_MD} />
                      <Text>{t('proposalColumns.items')}</Text>
                    </Flex>
                  </Tab>
                  <Tab>
                    <Flex align='center' gap={4}>
                      <Icon as={File} boxSize={ICON_BOX_MD} />
                      <Text>{t('proposals.create.files.title')}</Text>
                    </Flex>
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <ItemSelectionContent
                      selectedVersion={selectedVersion}
                      formData={formData}
                      setFormData={setFormData}
                      setSelectedVersion={setSelectedVersion}
                      selectVersion={selectVersion}
                    />
                  </TabPanel>
                  <TabPanel px={0}>
                    <Stack spacing={4} mt={2} color='gray.600'>
                      <Text fontSize='lg' fontWeight='semibold' color='gray.800'>
                        {t('proposals.create.files.title')}
                      </Text>
                      <Text>{t('proposals.create.files.subtitle')}</Text>
                      <FileUploadSection
                        proposalId={formData.id}
                        onFilesChange={(files) => updateFormData({ ...formData, files })}
                      />
                    </Stack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Divider my={6} />
              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={4}
                justify='flex-start'
                align={{ base: 'stretch', md: 'center' }}
              >
                <Button variant='outline' colorScheme='gray' onClick={handleSaveOrder}>
                  {t('common.save')}
                </Button>
                <Button
                  colorScheme='green'
                  onClick={handleAcceptOrder}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : t('proposals.create.summary.acceptAndOrder')}
                </Button>
                <Button variant='outline' colorScheme='red' onClick={handleRejectOrder}>
                  {t('proposals.create.summary.rejectAndArchive')}
                </Button>
              </Stack>
              </React.Fragment>
          )}
        </Formik>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('proposals.create.summary.editVersionTitle')}</ModalHeader>
          <ModalBody>
            <Input
              value={editedVersionName}
              onChange={(e) => setEditedVersionName(e.target.value)}
              placeholder={t('proposals.create.manufacturer.labels.versionName')}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" colorScheme="gray" onClick={() => setEditModalOpen(false)} mr={3}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="brand" onClick={saveEditVersionName}>
              {t('common.save')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} size={{ base: 'full', md: 'md' }} scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('customers.confirmTitle')}</ModalHeader>
          <ModalBody>{t('proposals.create.summary.confirmDeleteVersion')}</ModalBody>
          <ModalFooter>
            <Button variant="ghost" colorScheme="gray" onClick={() => setDeleteModalOpen(false)} mr={3}>
              {t('common.cancel')}
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ItemSelectionStep







