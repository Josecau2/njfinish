import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spinner,
  Text,
  useColorModeValue,
  useMergeRefs,
  useOutsideClick,
} from '@chakra-ui/react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'

const defaultGetOptionLabel = (option) => option?.label ?? ''
const defaultGetOptionValue = (option) => option?.value ?? option?.label ?? ''

const CreatableCombobox = forwardRef(
  (
    {
      options = [],
      value = null,
      onChange,
      onCreateOption,
      placeholder,
      isDisabled = false,
      isInvalid = false,
      isLoading = false,
      isCreating = false,
      isClearable = true,
      size = 'md',
      id,
      name,
      noOptionsMessage,
      createOptionLabel,
      renderOption,
      getOptionLabel = defaultGetOptionLabel,
      getOptionValue = defaultGetOptionValue,
      inputProps = {},
      maxVisibleOptions = 8,
      autoFocus = false,
      allowEmptySearch = true,
    },
    ref,
  ) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const localInputRef = useRef(null)
    const containerRef = useRef(null)
    const mergedRef = useMergeRefs(localInputRef, ref)

    const listBg = useColorModeValue('white', 'gray.800')
    const listBorder = useColorModeValue('gray.200', 'gray.700')
    const listShadow = useColorModeValue('md', 'dark-lg')
    const itemHoverBg = useColorModeValue('gray.100', 'gray.700')
    const itemActiveBg = useColorModeValue('brand.100', 'gray.600')
    const itemText = useColorModeValue('gray.800', 'gray.100')
    const createTextColor = useColorModeValue('brand.600', 'brand.300')

    const selectedLabel = useMemo(() => {
      if (!value) return ''
      return typeof value === 'string' ? value : getOptionLabel(value)
    }, [value, getOptionLabel])

    useEffect(() => {
      setInputValue(selectedLabel)
    }, [selectedLabel])

    const normalizedOptions = useMemo(() => options ?? [], [options])

    const filteredOptions = useMemo(() => {
      const query = inputValue?.trim().toLowerCase() ?? ''
      if (!query && !allowEmptySearch) {
        return normalizedOptions
      }
      if (!query) {
        return normalizedOptions.slice(0, maxVisibleOptions)
      }
      return normalizedOptions
        .filter((option) => getOptionLabel(option).toLowerCase().includes(query))
        .slice(0, maxVisibleOptions)
    }, [inputValue, normalizedOptions, getOptionLabel, allowEmptySearch, maxVisibleOptions])

    const showCreateOption = useMemo(() => {
      if (!onCreateOption) return false
      const trimmed = inputValue.trim()
      if (!trimmed) return false
      return !normalizedOptions.some(
        (option) => getOptionLabel(option).toLowerCase() === trimmed.toLowerCase(),
      )
    }, [inputValue, normalizedOptions, getOptionLabel, onCreateOption])

    useOutsideClick({
      ref: containerRef,
      handler: () => setIsOpen(false),
    })

    const openList = () => {
      if (isDisabled) return
      setIsOpen(true)
      setHighlightIndex((prev) => (prev === -1 ? 0 : prev))
    }

    const closeList = () => {
      setIsOpen(false)
      setHighlightIndex(-1)
    }

    const handleSelect = (option) => {
      if (isDisabled) return
      closeList()
      if (onChange) {
        onChange(option ?? null)
      }
    }

    const handleClear = (event) => {
      event.preventDefault()
      event.stopPropagation()
      setInputValue('')
      handleSelect(null)
    }

    const handleCreate = async () => {
      if (!onCreateOption || isDisabled) return
      const label = inputValue.trim()
      if (!label) return
      const maybeOption = await onCreateOption(label)
      if (maybeOption) {
        handleSelect(maybeOption)
      }
    }

    const totalRows = filteredOptions.length + (showCreateOption ? 1 : 0)

    const moveHighlight = (direction) => {
      if (!totalRows) return
      setHighlightIndex((prev) => {
        const next = prev + direction
        if (next < 0) return totalRows - 1
        if (next >= totalRows) return 0
        return next
      })
    }

    const handleKeyDown = async (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (!isOpen) {
          openList()
        } else {
          moveHighlight(1)
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!isOpen) {
          openList()
        } else {
          moveHighlight(-1)
        }
      } else if (event.key === 'Enter') {
        if (!isOpen) {
          openList()
          event.preventDefault()
          return
        }
        if (highlightIndex >= 0) {
          event.preventDefault()
          if (highlightIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightIndex])
          } else if (showCreateOption) {
            await handleCreate()
          }
        } else if (showCreateOption) {
          event.preventDefault()
          await handleCreate()
        }
      } else if (event.key === 'Escape') {
        if (isOpen) {
          event.preventDefault()
          closeList()
        }
      }
    }

    const renderOptionContent = (option, isActive) => {
      if (renderOption) {
        return renderOption(option, { isActive })
      }
      return (
        <Flex align="center" justify="space-between" gap={4}>
          <Text color={itemText}>{getOptionLabel(option)}</Text>
          {value && getOptionValue(option) === getOptionValue(value) && (
            <Icon as={Check} boxSize={4} color="brand.500" />
          )}
        </Flex>
      )
    }

    return (
      <Box ref={containerRef} position="relative" width="full">
        <InputGroup size={size}>
          <Input
            id={id}
            name={name}
            ref={mergedRef}
            value={inputValue}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isInvalid={isInvalid}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(event) => {
              setInputValue(event.target.value)
              if (!isOpen) {
                openList()
              }
            }}
            onFocus={openList}
            onKeyDown={handleKeyDown}
            {...inputProps}
          />
          <InputRightElement width="auto" gap={1} pr={1}>
            {isLoading && <Spinner size="sm" />}
            {isClearable && selectedLabel && (
              <IconButton
                aria-label={t('form.actions.clearSelection', 'Clear selection')}
                size="sm"
                variant="ghost"
                icon={<Icon as={X} boxSize={3} />}
                onMouseDown={handleClear}
              />
            )}
            <IconButton
              aria-label={t('form.actions.toggleOptions', 'Toggle options')}
              size="sm"
              variant="ghost"
              icon={<Icon as={ChevronsUpDown} boxSize={3} />}
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (isOpen) {
                  closeList()
                } else {
                  openList()
                  localInputRef.current?.focus()
                }
              }}
            />
          </InputRightElement>
        </InputGroup>

        {isOpen && !isDisabled && (
          <Box
            position="absolute"
            top="calc(100% + 4px)"
            insetX={0}
            bg={listBg}
            borderWidth="1px"
            borderColor={listBorder}
            borderRadius="md"
            boxShadow={listShadow}
            zIndex={10}
            maxHeight="240px"
            overflowY="auto"
          >
            {filteredOptions.map((option, index) => {
              const isActive = index === highlightIndex
              return (
                <Flex
                  key={getOptionValue(option) ?? index}
                  align="center"
                  px={3}
                  py={2.5}
                  gap={3}
                  cursor="pointer"
                  bg={isActive ? itemActiveBg : 'transparent'}
                  _hover={{ bg: itemHoverBg }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    handleSelect(option)
                  }}
                >
                  {renderOptionContent(option, isActive)}
                </Flex>
              )
            })}

            {showCreateOption && (
              <Flex
                align="center"
                gap={3}
                px={3}
                py={2.5}
                cursor="pointer"
                borderTopWidth={filteredOptions.length ? '1px' : '0'}
                borderColor={listBorder}
                color={createTextColor}
                _hover={{ bg: itemHoverBg }}
                onMouseDown={async (event) => {
                  event.preventDefault()
                  if (!isCreating) {
                    await handleCreate()
                  }
                }}
              >
                {isCreating ? (
                  <Spinner size="sm" />
                ) : (
                  <Icon as={Plus} boxSize={4} />
                )}
                <Text fontWeight="medium">
                  {typeof createOptionLabel === 'function'
                    ? createOptionLabel(inputValue.trim())
                    : createOptionLabel || `Create "${inputValue.trim()}"`}
                </Text>
              </Flex>
            )}

            {!filteredOptions.length && !showCreateOption && !isLoading && (
              <Box px={3} py={2.5} color={itemText}>
                {noOptionsMessage || 'No options'}
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  },
)

CreatableCombobox.displayName = 'CreatableCombobox'

export default CreatableCombobox
