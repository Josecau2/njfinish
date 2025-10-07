import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '../../store/slices/authSlice';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Heading, Text, FormControl, FormLabel, Input, InputGroup, InputRightElement, IconButton, Button, Checkbox, Link, Alert, AlertIcon, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getOptimalColors } from '../../utils/colorUtils';
import BrandLogo from '../../components/BrandLogo';
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand';
import { clearAllTokens } from '../../utils/authToken';
import { markSessionActive } from '../../utils/authSession';
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'
import AuthLayout from '../../components/AuthLayout';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const api_url = import.meta.env.VITE_API_URL;
  const { t } = useTranslation();

  const brand = getBrand();
  const loginBrand = getLoginBrand();
  const brandColors = getBrandColors();
  const logoHeight = Number(loginBrand.logoHeight) || 60;
  const loginBackground = loginBrand.backgroundColor || brandColors.surface || "gray.900";

  // Color mode values
  const bgWhite = useColorModeValue("white", "gray.800")
  const textGray700 = useColorModeValue("gray.700", "gray.300")
  const linkBlue = useColorModeValue("blue.600", "blue.300")

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');


  useEffect(() => {
    try {
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light');
    } catch (_) {
      // ignore storage failures
    }
  }, []);

  // Detect redirect reasons (e.g., session expired) and show a banner
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const reason = params.get('reason') || sessionStorage.getItem('logout_reason') || '';
      if (reason) {
        // Clear the stored reason so it doesn't persist
        try { sessionStorage.removeItem('logout_reason'); } catch {}
      }
      if (reason === 'expired' || reason === 'auth-error') {
        setNoticeMessage(t('auth.sessionExpired') || 'Your session expired. Please sign in again.');
      } else if (reason) {
        setNoticeMessage(t('auth.loginRequired') || 'Please sign in to continue.');
      }
    } catch (_) {
      // no-op
    }
  }, [location.search, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiBase = api_url ? api_url.replace(/\/+$/, '') : '';
      const loginUrl = apiBase ? `${apiBase}/api/auth/login` : '/api/auth/login';
      const response = await axios.post(loginUrl, {
        email,
        password,
      }, { withCredentials: true });

      const { sessionActive, userId, name, role, role_id, group_id, group, email: responseEmail } = response.data || {};
      const resolvedEmail = responseEmail || email;
      const normalizedRole = String(role || '').toLowerCase();
      const user = { email: resolvedEmail, userId, name, role: normalizedRole, role_id, group_id, group };

      if (!sessionActive) {
        throw new Error('Session not established');
      }

      clearAllTokens({ preserveUser: false });
      markSessionActive();
      try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
      try { window.localStorage.setItem('__auth_changed__', String(Date.now())); } catch {}

      dispatch(setUser({ user, token: null }));

      localStorage.setItem('coreui-free-react-admin-template-theme', 'light');

      const returnTo = (() => { try { return sessionStorage.getItem('return_to') || '/' } catch { return '/' } })();
      try { sessionStorage.removeItem('return_to'); } catch {}
      navigate(returnTo);
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('auth.loginFailed');
      dispatch(setError(errorMsg));
      setErrorMessage(errorMsg);
    }
  };


  // Compute optimal text colors for the right panel based on background
  const rightPanelColors = getOptimalColors(loginBackground);

  const leftPanel = (
    <VStack spacing={6} maxW="lg" textAlign="center">
      <Heading as="h1" size="2xl" color={rightPanelColors.text}>
        {loginBrand.rightTitle}
      </Heading>
      <Text fontSize="xl" color={rightPanelColors.subtitle}>
        {loginBrand.rightSubtitle}
      </Text>
      <Text fontSize="md" color={rightPanelColors.subtitle}>
        {loginBrand.rightDescription}
      </Text>
    </VStack>
  );

  return (
    <AuthLayout
      leftContent={leftPanel}
      leftBg={loginBackground}
      leftTextColor={rightPanelColors.text}
      rightBg={useColorModeValue('gray.50', 'gray.900')}
      languageSwitcherProps={{ compact: true }}
    >
      <VStack spacing={{ base: 8, md: 10 }} align="stretch" px={{ base: 0, md: 2 }} position="relative" zIndex={2}>
            <Box textAlign="center" mb={{ base: -2, md: -2 }}>
              <BrandLogo size={logoHeight} />
            </Box>
            <Box textAlign="center" px={{ base: 0, md: 4 }}>
              <Heading
                as="h2"
                size={{ base: 'xl', md: '2xl' }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color={useColorModeValue('gray.900', 'white')}
                mb={3}
              >
                {loginBrand.title}
              </Heading>
              <Text
                color={useColorModeValue('gray.600', 'gray.400')}
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="400"
                lineHeight="1.6"
              >
                {loginBrand.subtitle}
              </Text>
            </Box>

            {noticeMessage && (
              <Alert
                status="info"
                borderRadius="xl"
                boxShadow="sm"
                fontSize={{ base: 'sm', md: 'md' }}
                bg={useColorModeValue('blue.50', 'blue.900')}
                border="1px solid"
                borderColor={useColorModeValue('blue.200', 'blue.700')}
              >
                <AlertIcon />
                {noticeMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert
                status="error"
                borderRadius="xl"
                boxShadow="sm"
                fontSize={{ base: 'sm', md: 'md' }}
                bg={useColorModeValue('red.50', 'red.900')}
                border="1px solid"
                borderColor={useColorModeValue('red.200', 'red.700')}
              >
                <AlertIcon />
                {errorMessage}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={{ base: 6, md: 5 }}>
                <FormControl isRequired>
                  <FormLabel
                    htmlFor="email"
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    mb={2}
                    color={useColorModeValue('gray.700', 'gray.300')}
                    letterSpacing="tight"
                  >
                    {t('auth.email')}
                  </FormLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    size="lg"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    minH={{ base: '52px', md: '56px' }}
                    borderRadius="xl"
                    fontSize={{ base: 'md', md: 'lg' }}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{
                      borderColor: useColorModeValue('gray.300', 'gray.500'),
                      bg: useColorModeValue('white', 'gray.650'),
                    }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                      bg: useColorModeValue('white', 'gray.700'),
                    }}
                    transition="all 0.2s"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel
                    htmlFor="password"
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    mb={2}
                    color={useColorModeValue('gray.700', 'gray.300')}
                    letterSpacing="tight"
                  >
                    {t('auth.password')}
                  </FormLabel>
                  <InputGroup size="lg">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      minH={{ base: '52px', md: '56px' }}
                      borderRadius="xl"
                      fontSize={{ base: 'md', md: 'lg' }}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      border="1px solid"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                      _hover={{
                        borderColor: useColorModeValue('gray.300', 'gray.500'),
                        bg: useColorModeValue('white', 'gray.650'),
                      }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        bg: useColorModeValue('white', 'gray.700'),
                      }}
                      transition="all 0.2s"
                    />
                    <InputRightElement width="56px" height={{ base: '52px', md: '56px' }}>
                      <IconButton
                        aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        icon={showPassword ? <EyeOff size={ICON_SIZE_MD} /> : <Eye size={ICON_SIZE_MD} />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        tabIndex={-1}
                        minW="44px"
                        minH="44px"
                        borderRadius="xl"
                        _hover={{
                          bg: useColorModeValue('gray.100', 'gray.600'),
                        }}
                        transition="all 0.2s"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Flex
                  justify="space-between"
                  align="center"
                  w="100%"
                  flexDirection={{ base: 'column', sm: 'row' }}
                  gap={{ base: 4, sm: 0 }}
                  pt={1}
                >
                  {loginBrand.showKeepLoggedIn && (
                    <Checkbox
                      id="keepLoggedIn"
                      isChecked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      minH="44px"
                      display="flex"
                      alignItems="center"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="500"
                      color={useColorModeValue('gray.700', 'gray.300')}
                    >
                      {t('auth.keepLoggedIn')}
                    </Checkbox>
                  )}
                  {loginBrand.showForgotPassword && (
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color={useColorModeValue('brand.600', 'brand.300')}
                      minH="44px"
                      display="flex"
                      alignItems="center"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="600"
                      _hover={{
                        textDecoration: 'underline',
                        color: useColorModeValue('brand.700', 'brand.400'),
                      }}
                      transition="color 0.2s"
                    >
                      {t('auth.forgotPasswordLink')}
                    </Link>
                  )}
                </Flex>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  minH={{ base: '52px', md: '56px' }}
                  borderRadius="xl"
                  fontWeight="700"
                  fontSize={{ base: 'md', md: 'lg' }}
                  letterSpacing="tight"
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  mt={2}
                >
                  {t('auth.signIn')}
                </Button>
              </VStack>
            </Box>

            <Box
              textAlign="center"
              pt={{ base: 4, md: 2 }}
              borderTop="1px solid"
              borderColor={useColorModeValue('gray.100', 'gray.700')}
            >
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color={useColorModeValue('gray.600', 'gray.400')}
              >
                {t('auth.noAccountPrompt')}{' '}
                <Link
                  as={RouterLink}
                  to="/request-access"
                  color={useColorModeValue('brand.600', 'brand.300')}
                  fontWeight="600"
                  _hover={{
                    textDecoration: 'underline',
                    color: useColorModeValue('brand.700', 'brand.400'),
                  }}
                  transition="color 0.2s"
                >
                  {t('auth.requestAccess.submit')}
                </Link>
              </Text>
            </Box>
          </VStack>
    </AuthLayout>
  );
};

export default LoginPage;

