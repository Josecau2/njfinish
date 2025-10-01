import React, { useState } from 'react'
import { CardBody, Flex, Box, Link } from '@chakra-ui/react'
import StandardCard from '../../../components/StandardCard'
import CustomizationPage from './CustomizationPage'
import PdfLayoutCustomization from './PdfLayoutCustomization'
import LoginCustomizerPage from './LoginCustomizerPage'

const CustomizationIndex = () => {
  const [activeKey, setActiveKey] = useState(1)

  return (
    <StandardCard className="main-div-cutomization">
      <CardBody>
        <Flex role="tablist" gap={4}>
          <Box>
            <Link onClick={() => setActiveKey(1)} style={{ cursor: 'pointer', fontWeight: activeKey === 1 ? 600 : 400 }}>
              General Customization
            </Link>
          </Box>
          <Box>
            <Link onClick={() => setActiveKey(2)} style={{ cursor: 'pointer', fontWeight: activeKey === 2 ? 600 : 400 }}>
              PDF Layout
            </Link>
          </Box>
          <Box>
            <Link onClick={() => setActiveKey(3)} style={{ cursor: 'pointer', fontWeight: activeKey === 3 ? 600 : 400 }}>
              Login Page
            </Link>
          </Box>
        </Flex>

        <Box>
          <Box display={activeKey === 1 ? 'block' : 'none'}>
            <CustomizationPage />
          </Box>
          <Box display={activeKey === 2 ? 'block' : 'none'}>
            <PdfLayoutCustomization />
          </Box>
          <Box display={activeKey === 3 ? 'block' : 'none'}>
            <LoginCustomizerPage />
          </Box>
        </Box>
      </CardBody>
    </StandardCard>
  )
}

export default CustomizationIndex
