import { useEffect, useState } from 'react'
import {
  Box,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
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

  const tabs = [
    {
      label: t('settings.manufacturers.tabs.editDetails', 'Edit Manufacturer Details'),
      render: () => <EditManufacturerTab manufacturer={manufacturer} id={id} />,
    },
    {
      label: t('settings.manufacturers.tabs.settings', 'Settings'),
      render: () => <SettingsTab manufacturer={manufacturer} />,
    },
    {
      label: t('settings.manufacturers.tabs.catalogMapping', 'Catalog Mapping'),
      render: () => <CatalogMappingTab manufacturer={manufacturer} id={id} />,
    },
    {
      label: t('settings.manufacturers.tabs.stylePictures', 'Style Pictures'),
      render: () => <StylePicturesTab manufacturer={manufacturer} />,
    },
    {
      label: t('settings.manufacturers.tabs.typePictures', 'Type Pictures'),
      render: () => <TypesTab manufacturer={manufacturer} />,
    },
    {
      label: t('settings.manufacturers.tabs.filesHistory', 'Files & History'),
      render: () => <FilesHistoryTab manufacturer={manufacturer} />,
    },
  ]

  return (
    <Box className="edit-manufacturer-page">
      <Tabs index={activeKey} onChange={setActiveKey} variant="unstyled" isLazy>
        <TabList
          gap={{ base: 2, md: 3 }}
          flexWrap={{ base: 'wrap', md: 'nowrap' }}
          display={{ base: 'grid', md: 'flex' }}
          gridTemplateColumns={tabColumns}
          borderBottom="1px solid"
          borderColor="gray.200"
          pb={{ base: 2, md: 0 }}
          className="manufacturer-tabs"
          sx={{
            '& button[role="tab"]': {
              minHeight: '44px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 500,
              paddingInline: '20px',
              paddingBlock: '12px',
              border: '1px solid',
              borderColor: 'gray.200',
              color: 'brand.600',
              transition: 'all 0.15s ease',
            },
            '& button[role="tab"].chakra-tabs__tab--selected': {
              backgroundColor: 'brand.500',
              borderColor: 'brand.500',
              color: 'white',
              boxShadow: 'sm',
            },
            '& button[role="tab"]:hover': {
              borderColor: 'brand.400',
              boxShadow: 'xs',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={tab.label} justifyContent="center">
              {tab.label}
            </Tab>
          ))}
        </TabList>

        <TabPanels mt={4}>
          {tabs.map((tab) => (
            <TabPanel key={tab.label} px={0}>
              {tab.render()}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default EditManufacturer
