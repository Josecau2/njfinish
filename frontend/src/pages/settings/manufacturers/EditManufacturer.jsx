import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react'
import EditManufacturerTab from './tabs/EditManufacturerTab'
import SettingsTab from './tabs/SettingsTab'
import CatalogMappingTab from './tabs/CatalogMappingTab'
import StylePicturesTab from './tabs/StylePicturesTab'
import TypesTab from './tabs/TypesTab'
import FilesHistoryTab from './tabs/FilesHistoryTab'
import { useParams } from 'react-router-dom'
import { decodeParam } from '../../../utils/obfuscate'
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

const EditManufacturer = () => {
  const { id: rawId } = useParams()
  const id = decodeParam(rawId)
  const dispatch = useDispatch()

  // Color mode values - all declared at top level
  const borderGray200 = useColorModeValue('gray.200', 'gray.600')
  const tabBg = useColorModeValue('gray.50', 'gray.700')
  const tabBgHover = useColorModeValue('white', 'gray.600')
  const tabColor = useColorModeValue('gray.600', 'gray.400')
  const tabColorHover = useColorModeValue('brand.600', 'brand.300')
  const tabBorderColor = useColorModeValue('gray.200', 'gray.600')
  const tabBorderHover = useColorModeValue('brand.200', 'brand.700')
  const tabBorderBottomHover = useColorModeValue('brand.300', 'brand.400')
  const tabSelectedBg = useColorModeValue('brand.500', 'brand.600')
  const tabSelectedColor = useColorModeValue('white', 'white')
  const scrollbarThumb = useColorModeValue('gray.300', 'gray.600')
  const tabShadow = useColorModeValue('sm', 'dark-lg')
  const tabShadowHover = useColorModeValue('md', 'dark-lg')
  const tabShadowSelected = useColorModeValue('lg', '0 8px 16px rgba(0, 0, 0, 0.4)')

  const [activeKey, setActiveKey] = useState(0)
  const manufacturer = useSelector((state) => state.manufacturers.selected)
  const { t } = useTranslation()

  useEffect(() => {
    if (id) {
      // Don't load catalog data initially for manufacturer editing - only load basic info
      dispatch(fetchManufacturerById({ id, includeCatalog: false }))
    }
  }, [id, dispatch])

  const tabColumns = useBreakpointValue({ base: 'repeat(2, minmax(0, 1fr))', md: 'none' })

  const tabs = useMemo(() => (
    [
      {
        key: 'details',
        label: t('settings.manufacturers.tabs.editDetails', 'Edit Manufacturer Details'),
        render: () => <EditManufacturerTab manufacturer={manufacturer} id={id} />,
      },
      {
        key: 'settings',
        label: t('settings.manufacturers.tabs.settings', 'Settings'),
        render: () => <SettingsTab manufacturer={manufacturer} />,
      },
      {
        key: 'catalogMapping',
        label: t('settings.manufacturers.tabs.catalogMapping', 'Catalog Mapping'),
        render: () => <CatalogMappingTab manufacturer={manufacturer} id={id} />,
      },
      {
        key: 'stylePictures',
        label: t('settings.manufacturers.tabs.stylePictures', 'Style Pictures'),
        render: () => <StylePicturesTab manufacturer={manufacturer} />,
      },
      {
        key: 'typePictures',
        label: t('settings.manufacturers.tabs.typePictures', 'Type Pictures'),
        render: () => <TypesTab manufacturer={manufacturer} />,
      },
      {
        key: 'filesHistory',
        label: t('settings.manufacturers.tabs.filesHistory', 'Files & History'),
        render: () => <FilesHistoryTab manufacturer={manufacturer} />,
      },
    ]
  ), [id, manufacturer, t])

  return (
    <Box>
      <Tabs index={activeKey} onChange={setActiveKey} variant="unstyled" isLazy>
        <TabList
          gap={{ base: 2, md: 3 }}
          flexWrap="wrap"
          display="flex"
          borderBottom="2px solid"
          borderColor={borderGray200}
          pb={0}
          overflowX={{ base: 'auto', md: 'visible' }}
          overflowY="visible"
          sx={{
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: scrollbarThumb,
              borderRadius: '2px',
            },
            // Tab button styling
            '& button[role="tab"]': {
              minW: { base: '140px', md: 'auto' },
              minH: { base: '48px', md: '44px' },
              maxW: { base: 'none', md: '220px' },
              borderRadius: '8px 8px 0 0',
              fontSize: { base: 'sm', md: 'md' },
              fontWeight: 600,
              px: { base: 3, md: 5 },
              py: { base: 2.5, md: 3 },
              border: '1px solid',
              borderColor: tabBorderColor,
              borderBottom: '3px solid',
              borderBottomColor: 'transparent',
              color: tabColor,
              bg: tabBg,
              transition: 'all 0.2s ease-in-out',
              whiteSpace: { base: 'normal', md: 'nowrap' },
              textAlign: 'center',
              lineHeight: '1.3',
              position: 'relative',
              boxShadow: tabShadow,
              flexShrink: { base: 0, md: 1 },
              // Hover state
              _hover: {
                color: tabColorHover,
                borderBottomColor: tabBorderBottomHover,
                bg: tabBgHover,
                borderColor: tabBorderHover,
                boxShadow: tabShadowHover,
                transform: 'translateY(-1px)',
              },
            },
            // Selected tab state
            '& button[role="tab"][aria-selected="true"]': {
              color: tabSelectedColor,
              bg: tabSelectedBg,
              borderColor: tabSelectedBg,
              borderBottomColor: tabSelectedBg,
              fontWeight: 700,
              boxShadow: tabShadowSelected,
              transform: { base: 'none', md: 'translateY(2px)' },
              _hover: {
                bg: tabSelectedBg,
                borderColor: tabSelectedBg,
                borderBottomColor: tabSelectedBg,
                transform: { base: 'none', md: 'translateY(2px)' },
              },
            },
            // Non-selected tabs have slight margin on desktop
            '& button[role="tab"][aria-selected="false"]': {
              mb: { base: 0, md: '2px' },
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.key} justifyContent="center">
              {tab.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels mt={{ base: 4, md: 6 }}>
          {tabs.map((tab) => (
            <TabPanel key={tab.key} px={0}>
              {tab.render()}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default EditManufacturer
