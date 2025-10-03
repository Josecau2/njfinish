import React, { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, Flex, Container, Heading, Text, FormControl, FormLabel, Input, InputGroup, InputRightElement, IconButton, Button, Link, Alert, AlertIcon, VStack, useColorModeValue } from '@chakra-ui/react'
import { Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { getOptimalColors } from '../../utils/colorUtils'
import { getLoginBrand, getBrandColors } from '../../brand/useBrand'
import { ICON_SIZE_MD } from '../../constants/iconSizes'

const SignupPage = () => {
  const navigate = useNavigate()
  const api_url = import.meta.env.VITE_API_URL

  const loginBrand = getLoginBrand()
  const brandColors = getBrandColors()
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || "gray.900"

  // Color mode values
  const bgWhite = useColorModeValue("white", "gray.800")
  const textGray600 = useColorModeValue("gray.600", "gray.400")
  const linkBlue = useColorModeValue("blue.600", "blue.300")

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const response = await axios.post(`${api_url}/api/signup`, formData)

      alert('Signup successful!')
      navigate('/login')
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  // Compute optimal text colors for the right panel based on background
  const rightPanelColors = getOptimalColors(loginBackground)

  return (
    <Flex minH="100vh">
      {/* Left Panel - Form */}
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        bg={bgWhite}
      >
        <Container maxW="md" py={8}>
          <VStack spacing={6} align="stretch">
            <Heading as="h2" size="lg" fontWeight="bold">
              Sign Up
            </Heading>
            <Text color={textGray600}>
              Create your account to get started.
            </Text>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="username" fontWeight="600">
                    Username
                  </FormLabel>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    size="lg"
                    placeholder="john_doe"
                    value={formData.username}
                    onChange={handleChange}
                    minH="44px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="email" fontWeight="600">
                    Email
                  </FormLabel>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    size="lg"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    minH="44px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="password" fontWeight="600">
                    Password
                  </FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      minH="44px"
                    />
                    <InputRightElement width="44px" height="44px">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <EyeOff size={ICON_SIZE_MD} /> : <Eye size={ICON_SIZE_MD} />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        tabIndex={-1}
                        minW="44px"
                        minH="44px"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  minH="44px"
                >
                  Sign Up
                </Button>
              </VStack>
            </Box>

            <Text textAlign="center">
              Already have an account?{' '}
              <Link as={RouterLink} to="/login" color={linkBlue} minH="44px" py={2}>
                Sign In
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>

      {/* Right Panel - Branding */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        flex="1"
        bg={loginBackground}
        alignItems="center"
        justifyContent="center"
        px={8}
        className="login-right-panel"
      >
        <VStack spacing={4} maxW="500px" textAlign="center">
          <Heading as="h2" size="2xl" color={rightPanelColors.text}>
            NJ Cabinets
          </Heading>
          <Text fontSize="xl" color={rightPanelColors.subtitle}>
            Dealer Portal
          </Text>
        </VStack>
      </Box>
    </Flex>
  )
}

export default SignupPage
