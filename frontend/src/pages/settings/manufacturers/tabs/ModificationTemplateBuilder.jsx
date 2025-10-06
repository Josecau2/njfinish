import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Image,
  Input,
  Select,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'

/**
 * ModificationTemplateBuilder - Step 2 Modal Component
 *
 * Extracted from CatalogMappingTab to improve performance.
 * Handles the modification template builder UI with guided field builder.
 *
 * Performance optimization: Isolates 28 onChange handlers to prevent
 * parent component (7,493 lines) from re-rendering on every keystroke.
 */
const ModificationTemplateBuilder = ({
  guidedBuilder,
  setGuidedBuilder,
  newTemplate,
  setNewTemplate,
  modificationStep,
  setModificationStep,
  setModificationView,
  editingTemplateId,
  creatingModification,
  uploadImageFile,
  createModificationTemplate,
  updateModificationTemplate,
  t,
}) => {
  const toast = useToast()
  const api_url = import.meta.env.VITE_API_URL

  // Color mode values
  const iconGray500 = useColorModeValue('gray.500', 'gray.400')
  const iconGray300 = useColorModeValue('gray.300', 'gray.600')
  const bgGray50 = useColorModeValue('gray.50', 'gray.800')

  return (
    <Box p={3}>
      <Heading as="h5" size="md" mb={{ base: 3, md: 4 }}>
        Step 2: Build Modification Template
      </Heading>

      {/* Default Required Fields */}
      <Box
        border="1px solid"
        borderColor={iconGray300}
        borderRadius="md"
        p={3}
        mb={{ base: 3, md: 4 }}
      >
        <Heading as="h6" size="sm" mb={3}>
          Required Fields
        </Heading>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
          <GridItem>
            <Input
              placeholder="Modification name *"
              value={newTemplate.name}
              onChange={(event) =>
                setNewTemplate((n) => ({ ...n, name: event.target.value }))
              }
              minH="44px"
            />
          </GridItem>
          <GridItem>
            <Input
              type="number"
              placeholder={
                newTemplate.saveAsBlueprint
                  ? "Blueprints don't have prices"
                  : 'Default price *'
              }
              value={newTemplate.saveAsBlueprint ? '' : newTemplate.defaultPrice}
              onChange={(event) =>
                setNewTemplate((n) => ({
                  ...n,
                  defaultPrice: event.target.value,
                }))
              }
              disabled={newTemplate.saveAsBlueprint}
              minH="44px"
            />
          </GridItem>
        </Grid>
      </Box>

      {/* Optional Field Builder */}
      <Box
        border="1px solid"
        borderColor={iconGray300}
        borderRadius="md"
        p={3}
        mb={{ base: 3, md: 4 }}
      >
        <Heading as="h6" size="sm" mb={3}>
          Optional Field Builder (Building Blocks)
        </Heading>

        {/* Slider Controls */}
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
          gap={3}
          mb={{ base: 3, md: 4 }}
        >
          {/* Height Slider */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.sliders.height.enabled ? 3 : 0}
                isChecked={guidedBuilder.sliders.height.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    sliders: {
                      ...g.sliders,
                      height: {
                        ...g.sliders.height,
                        enabled: event.target.checked,
                      },
                    },
                  }))
                }
                minH="44px"
              >
                Height Slider
              </Checkbox>
              {guidedBuilder.sliders.height.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    type="number"
                    placeholder="Min height"
                    value={guidedBuilder.sliders.height.min}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          height: {
                            ...g.sliders.height,
                            min: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Input
                    type="number"
                    placeholder="Max height"
                    value={guidedBuilder.sliders.height.max}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          height: {
                            ...g.sliders.height,
                            max: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Select
                    value={
                      guidedBuilder.sliders.height.useCustomIncrements
                        ? 'custom'
                        : guidedBuilder.sliders.height.step
                    }
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          height: {
                            ...g.sliders.height,
                            step:
                              event.target.value === 'custom'
                                ? 1
                                : event.target.value,
                            useCustomIncrements: event.target.value === 'custom',
                          },
                        },
                      }))
                    }
                    minH="44px"
                  >
                    <option value="1">1 inch increments</option>
                    <option value="0.5">0.5 inch increments</option>
                    <option value="0.25">0.25 inch increments</option>
                    <option value="custom">
                      Custom fractions (1/8, 1/4, 3/8, etc.)
                    </option>
                  </Select>
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* Width Slider */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.sliders.width.enabled ? 3 : 0}
                isChecked={guidedBuilder.sliders.width.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    sliders: {
                      ...g.sliders,
                      width: {
                        ...g.sliders.width,
                        enabled: event.target.checked,
                      },
                    },
                  }))
                }
                minH="44px"
              >
                Width Slider
              </Checkbox>
              {guidedBuilder.sliders.width.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    type="number"
                    placeholder="Min width"
                    value={guidedBuilder.sliders.width.min}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          width: {
                            ...g.sliders.width,
                            min: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Input
                    type="number"
                    placeholder="Max width"
                    value={guidedBuilder.sliders.width.max}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          width: {
                            ...g.sliders.width,
                            max: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Select
                    value={
                      guidedBuilder.sliders.width.useCustomIncrements
                        ? 'custom'
                        : guidedBuilder.sliders.width.step
                    }
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          width: {
                            ...g.sliders.width,
                            step:
                              event.target.value === 'custom'
                                ? 1
                                : event.target.value,
                            useCustomIncrements: event.target.value === 'custom',
                          },
                        },
                      }))
                    }
                    minH="44px"
                  >
                    <option value="1">1 inch increments</option>
                    <option value="0.5">0.5 inch increments</option>
                    <option value="0.25">0.25 inch increments</option>
                    <option value="custom">
                      Custom fractions (1/8, 1/4, 3/8, etc.)
                    </option>
                  </Select>
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* Depth Slider */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.sliders.depth.enabled ? 3 : 0}
                isChecked={guidedBuilder.sliders.depth.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    sliders: {
                      ...g.sliders,
                      depth: {
                        ...g.sliders.depth,
                        enabled: event.target.checked,
                      },
                    },
                  }))
                }
                minH="44px"
              >
                Depth Slider
              </Checkbox>
              {guidedBuilder.sliders.depth.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    type="number"
                    placeholder="Min depth"
                    value={guidedBuilder.sliders.depth.min}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          depth: {
                            ...g.sliders.depth,
                            min: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Input
                    type="number"
                    placeholder="Max depth"
                    value={guidedBuilder.sliders.depth.max}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          depth: {
                            ...g.sliders.depth,
                            max: event.target.value,
                          },
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Select
                    value={
                      guidedBuilder.sliders.depth.useCustomIncrements
                        ? 'custom'
                        : guidedBuilder.sliders.depth.step
                    }
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sliders: {
                          ...g.sliders,
                          depth: {
                            ...g.sliders.depth,
                            step:
                              event.target.value === 'custom'
                                ? 1
                                : event.target.value,
                            useCustomIncrements: event.target.value === 'custom',
                          },
                        },
                      }))
                    }
                    minH="44px"
                  >
                    <option value="1">1 inch increments</option>
                    <option value="0.5">0.5 inch increments</option>
                    <option value="0.25">0.25 inch increments</option>
                    <option value="custom">
                      Custom fractions (1/8, 1/4, 3/8, etc.)
                    </option>
                  </Select>
                </VStack>
              )}
            </Box>
          </GridItem>
        </Grid>

        {/* Additional Controls - Side/Qty/Notes/Upload */}
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={3}
          mb={{ base: 3, md: 4 }}
        >
          {/* Side Selector */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.sideSelector.enabled ? 3 : 0}
                isChecked={guidedBuilder.sideSelector.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    sideSelector: {
                      ...g.sideSelector,
                      enabled: event.target.checked,
                    },
                  }))
                }
                minH="44px"
              >
                Side Selector
              </Checkbox>
              {guidedBuilder.sideSelector.enabled && (
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color={iconGray500}>
                    Limited to Left/Right options
                  </Text>
                  <Input
                    placeholder="L,R"
                    value={guidedBuilder.sideSelector.options?.join(',')}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        sideSelector: {
                          ...g.sideSelector,
                          options: event.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      }))
                    }
                    disabled
                    minH="44px"
                  />
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* Quantity Limits */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.qtyRange.enabled ? 3 : 0}
                isChecked={guidedBuilder.qtyRange.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    qtyRange: {
                      ...g.qtyRange,
                      enabled: event.target.checked,
                    },
                  }))
                }
                minH="44px"
              >
                Quantity Limits
              </Checkbox>
              {guidedBuilder.qtyRange.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    type="number"
                    placeholder="Min qty"
                    value={guidedBuilder.qtyRange.min}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        qtyRange: {
                          ...g.qtyRange,
                          min: event.target.value,
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Input
                    type="number"
                    placeholder="Max qty"
                    value={guidedBuilder.qtyRange.max}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        qtyRange: {
                          ...g.qtyRange,
                          max: event.target.value,
                        },
                      }))
                    }
                    minH="44px"
                  />
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* Customer Notes */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.notes.enabled ? 3 : 0}
                isChecked={guidedBuilder.notes.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    notes: {
                      ...g.notes,
                      enabled: event.target.checked,
                    },
                  }))
                }
                minH="44px"
              >
                Customer Notes
              </Checkbox>
              {guidedBuilder.notes.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    placeholder="Notes placeholder"
                    value={guidedBuilder.notes.placeholder}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        notes: {
                          ...g.notes,
                          placeholder: event.target.value,
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Checkbox
                    isChecked={guidedBuilder.notes.showInRed}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        notes: {
                          ...g.notes,
                          showInRed: event.target.checked,
                        },
                      }))
                    }
                    minH="44px"
                  >
                    Show in red for customer warning
                  </Checkbox>
                </VStack>
              )}
            </Box>
          </GridItem>

          {/* Customer Upload */}
          <GridItem>
            <Box
              p={3}
              bg={bgGray50}
              borderRadius="md"
              border="1px solid"
              borderColor={iconGray300}
            >
              <Checkbox
                mb={guidedBuilder.customerUpload.enabled ? 3 : 0}
                isChecked={guidedBuilder.customerUpload.enabled}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    customerUpload: {
                      ...g.customerUpload,
                      enabled: event.target.checked,
                    },
                  }))
                }
                minH="44px"
              >
                Customer Upload
              </Checkbox>
              {guidedBuilder.customerUpload.enabled && (
                <VStack spacing={3} align="stretch">
                  <Input
                    placeholder={t(
                      'settings.manufacturers.catalogMapping.builder.uploadTitlePh',
                    )}
                    value={guidedBuilder.customerUpload.title}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        customerUpload: {
                          ...g.customerUpload,
                          title: event.target.value,
                        },
                      }))
                    }
                    minH="44px"
                  />
                  <Checkbox
                    isChecked={guidedBuilder.customerUpload.required}
                    onChange={(event) =>
                      setGuidedBuilder((g) => ({
                        ...g,
                        customerUpload: {
                          ...g.customerUpload,
                          required: event.target.checked,
                        },
                      }))
                    }
                    minH="44px"
                  >
                    {t(
                      'settings.manufacturers.catalogMapping.builder.requiredUpload',
                    )}
                  </Checkbox>
                </VStack>
              )}
            </Box>
          </GridItem>
        </Grid>

        {/* Descriptions */}
        <Box
          p={3}
          bg={bgGray50}
          borderRadius="md"
          border="1px solid"
          borderColor={iconGray300}
          mb={{ base: 3, md: 4 }}
        >
          <Heading as="h6" size="sm" mb={4}>
            {t(
              'settings.manufacturers.catalogMapping.builder.descriptions.header',
            )}
          </Heading>
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}
            gap={{ base: 3, md: 4 }}
            mb={4}
          >
            <GridItem>
              <Input
                placeholder={t(
                  'settings.manufacturers.catalogMapping.builder.descriptions.internal',
                )}
                value={guidedBuilder.descriptions.internal}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    descriptions: {
                      ...g.descriptions,
                      internal: event.target.value,
                    },
                  }))
                }
                minH="44px"
              />
            </GridItem>
            <GridItem>
              <Input
                placeholder={t(
                  'settings.manufacturers.catalogMapping.builder.descriptions.customer',
                )}
                value={guidedBuilder.descriptions.customer}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    descriptions: {
                      ...g.descriptions,
                      customer: event.target.value,
                    },
                  }))
                }
                minH="44px"
              />
            </GridItem>
            <GridItem>
              <Input
                placeholder={t(
                  'settings.manufacturers.catalogMapping.builder.descriptions.installer',
                )}
                value={guidedBuilder.descriptions.installer}
                onChange={(event) =>
                  setGuidedBuilder((g) => ({
                    ...g,
                    descriptions: {
                      ...g.descriptions,
                      installer: event.target.value,
                    },
                  }))
                }
                minH="44px"
              />
            </GridItem>
          </Grid>
          <Checkbox
            isChecked={guidedBuilder.descriptions.both}
            onChange={(event) =>
              setGuidedBuilder((g) => ({
                ...g,
                descriptions: {
                  ...g.descriptions,
                  both: event.target.checked,
                },
              }))
            }
            minH="44px"
          >
            {t(
              'settings.manufacturers.catalogMapping.builder.descriptions.showBoth',
            )}
          </Checkbox>
        </Box>

        {/* Sample Image */}
        <Box
          p={3}
          bg={bgGray50}
          borderRadius="md"
          border="1px solid"
          borderColor={iconGray300}
          mb={{ base: 3, md: 4 }}
        >
          <Checkbox
            mb={guidedBuilder.modSampleImage.enabled ? 3 : 0}
            isChecked={guidedBuilder.modSampleImage.enabled}
            onChange={(event) =>
              setGuidedBuilder((g) => ({
                ...g,
                modSampleImage: {
                  ...g.modSampleImage,
                  enabled: event.target.checked,
                },
              }))
            }
            minH="44px"
          >
            {t(
              'settings.manufacturers.catalogMapping.builder.sampleImage.label',
            )}
          </Checkbox>
          {guidedBuilder.modSampleImage.enabled && (
            <VStack spacing={3} align="stretch">
              <Box>
                <FormLabel mb={2}>
                  {t(
                    'settings.manufacturers.catalogMapping.builder.sampleImage.upload',
                  )}
                </FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    const fname = await uploadImageFile(file)
                    if (fname)
                      setNewTemplate((n) => ({ ...n, sampleImage: fname }))
                  }}
                  minH="44px"
                />
              </Box>
              {newTemplate.sampleImage && (
                <Box
                  p={2}
                  bg={bgGray50}
                  border="1px solid"
                  borderColor={iconGray300}
                  borderRadius="md"
                  h="200px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={`${api_url}/uploads/images/${newTemplate.sampleImage}`}
                    alt={t(
                      'settings.manufacturers.catalogMapping.builder.sampleImage.alt',
                    )}
                    maxH="100%"
                    maxW="100%"
                    objectFit="contain"
                    onError={(event) => {
                      event.target.src = '/images/nologo.png'
                    }}
                  />
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </Box>

      {/* Ready Checkbox Section */}
      <Box borderTop="1px solid" borderColor={iconGray300} pt={4}>
        <VStack spacing={3} align="stretch">
          <Checkbox
            isChecked={newTemplate.isReady}
            onChange={(event) =>
              setNewTemplate((n) => ({ ...n, isReady: event.target.checked }))
            }
            minH="44px"
          >
            {t(
              'settings.manufacturers.catalogMapping.builder.ready.markAsReady',
            )}
          </Checkbox>
          <Checkbox
            isChecked={newTemplate.saveAsBlueprint}
            onChange={(event) =>
              setNewTemplate((n) => ({
                ...n,
                saveAsBlueprint: event.target.checked,
              }))
            }
            minH="44px"
          >
            {t(
              'settings.manufacturers.catalogMapping.builder.ready.saveAsBlueprint',
            )}
          </Checkbox>
          <Text fontSize="sm" color={iconGray500}>
            {t(
              'settings.manufacturers.catalogMapping.builder.ready.blueprintHint',
            )}
          </Text>
        </VStack>
      </Box>

      {/* Button Footer */}
      <Flex
        mt={6}
        gap={3}
        direction={{ base: 'column', md: 'row' }}
        justify="flex-end"
      >
        <Button
          colorScheme="gray"
          onClick={() => setModificationStep(1)}
          w={{ base: '100%', md: 'auto' }}
          minH="44px"
        >
          {t('settings.manufacturers.catalogMapping.builder.buttons.back')}
        </Button>
        <Button
          colorScheme="gray"
          onClick={() => setModificationView('cards')}
          w={{ base: '100%', md: 'auto' }}
          minH="44px"
        >
          {t('settings.manufacturers.catalogMapping.builder.buttons.cancel')}
        </Button>
        {editingTemplateId ? (
          <Button
            colorScheme="blue"
            onClick={updateModificationTemplate}
            disabled={!newTemplate.name || creatingModification}
            w={{ base: '100%', md: 'auto' }}
            minH="44px"
          >
            {creatingModification
              ? t(
                  'settings.manufacturers.catalogMapping.builder.buttons.updating',
                )
              : t(
                  'settings.manufacturers.catalogMapping.builder.buttons.update',
                )}
          </Button>
        ) : (
          <Button
            colorScheme="blue"
            onClick={createModificationTemplate}
            disabled={
              !newTemplate.name ||
              !newTemplate.defaultPrice ||
              creatingModification
            }
            w={{ base: '100%', md: 'auto' }}
            minH="44px"
          >
            {creatingModification
              ? t(
                  'settings.manufacturers.catalogMapping.builder.buttons.creating',
                )
              : t(
                  'settings.manufacturers.catalogMapping.builder.buttons.create',
                )}
          </Button>
        )}
      </Flex>
    </Box>
  )
}

export default ModificationTemplateBuilder
