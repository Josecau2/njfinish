import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '../../store/slices/authSlice';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Heading, Text, FormControl, FormLabel, Input, InputGroup, InputRightElement, IconButton, Button, Checkbox, Link, Alert, AlertIcon, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../../helpers/axiosInstance';
import { useTranslation } from 'react-i18next';
import { getOptimalColors } from '../../utils/colorUtils';
import BrandLogo from '../../components/BrandLogo';
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand';
import { installTokenEverywhere } from '../../utils/authToken';
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

  // Derive accent colors from login background for consistent theming
  const isLoginBgLight = loginBackground.startsWith('#') ?
    (parseInt(loginBackground.slice(1, 3), 16) + parseInt(loginBackground.slice(3, 5), 16) + parseInt(loginBackground.slice(5, 7), 16)) / 3 > 128 :
    false;

  // Use login background color as the accent for focus/hover states
  const accentColor = loginBackground.startsWith('#') ? loginBackground : 'blue.500';
  const accentColorLight = loginBackground.startsWith('#') ? `${loginBackground}15` : 'blue.50';
  const accentColorBorder = loginBackground.startsWith('#') ? `${loginBackground}80` : 'blue.400';

  // Color mode values
  const bgWhite = useColorModeValue("white", "gray.800")
  const textGray700 = useColorModeValue("gray.700", "gray.300")
  const linkBlue = useColorModeValue("blue.600", "blue.300")
  const rightBg = useColorModeValue('gray.50', 'gray.900')

  // Heading and text colors
  const headingColor = useColorModeValue('gray.900', 'white')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')

  // Alert colors
  const alertInfoBg = useColorModeValue('blue.50', 'blue.900')
  const alertInfoBorderColor = useColorModeValue('blue.200', 'blue.700')
  const alertErrorBg = useColorModeValue('red.50', 'red.900')
  const alertErrorBorderColor = useColorModeValue('red.200', 'red.700')

  // Form label colors
  const labelColor = useColorModeValue('gray.700', 'gray.300')

  // Input colors
  const inputBg = useColorModeValue('gray.50', 'gray.700')
  const inputBorderColor = useColorModeValue('gray.200', 'gray.600')
  const inputHoverBorderColor = useColorModeValue('gray.300', 'gray.500')
  const inputHoverBg = useColorModeValue('white', 'gray.650')
  const inputFocusBg = useColorModeValue('white', 'gray.700')

  // Button colors
  const togglePasswordHoverBg = useColorModeValue('gray.100', 'gray.600')

  // Checkbox color
  const checkboxColor = useColorModeValue('gray.700', 'gray.300')

  // Link colors - use login background color
  const linkColor = loginBackground.startsWith('#') ? accentColor : useColorModeValue('blue.600', 'blue.400')
  const linkHoverColor = loginBackground.startsWith('#') ? accentColor : useColorModeValue('blue.700', 'blue.500')

  // Divider color
  const dividerBorderColor = useColorModeValue('gray.100', 'gray.700')

  // Bottom text color
  const bottomTextColor = useColorModeValue('gray.600', 'gray.400')

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
      const loginUrl = '/api/auth/login';
      console.log('[Login] Attempting login to:', loginUrl);

      const response = await axiosInstance.post(loginUrl, {
        email,
        password,
      });

      console.log('[Login] Response received:', response.status, response.data);

      const { sessionActive, userId, name, role, role_id, group_id, group, email: responseEmail, token } = response.data || {};
      const resolvedEmail = responseEmail || email;
      const normalizedRole = String(role || '').toLowerCase();
      const user = { email: resolvedEmail, userId, name, role: normalizedRole, role_id, group_id, group };

      console.log('[Login] Parsed user data:', { sessionActive, userId, name, role: normalizedRole });

      if (!sessionActive) {
        throw new Error('Session not established');
      }

      try { window.localStorage.setItem('__auth_changed__', String(Date.now())); } catch {}

      // Install token in memory for components that check getFreshestToken()
      if (token) {
        installTokenEverywhere(token, { preserveUser: false });
      }

      dispatch(setUser({ user }));
      console.log('[Login] User set in Redux store');

      localStorage.setItem('coreui-free-react-admin-template-theme', 'light');

      const returnTo = (() => { try { return sessionStorage.getItem('return_to') || '/' } catch { return '/' } })();
      try { sessionStorage.removeItem('return_to'); } catch {}
      console.log('[Login] Navigating to:', returnTo);
      navigate(returnTo);
    } catch (err) {
      console.error('[Login] Error:', err);
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
      rightBg={rightBg}
      accentColor={accentColor}
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
                color={headingColor}
                mb={3}
              >
                {loginBrand.title}
              </Heading>
              <Text
                color={subtitleColor}
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
                bg={alertInfoBg}
                border="1px solid"
                borderColor={alertInfoBorderColor}
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
                bg={alertErrorBg}
                border="1px solid"
                borderColor={alertErrorBorderColor}
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
                    color={labelColor}
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
                    bg={inputBg}
                    border="1px solid"
                    borderColor={inputBorderColor}
                    _hover={{
                      borderColor: loginBackground.startsWith('#') ? accentColorBorder : inputHoverBorderColor,
                      bg: inputHoverBg,
                    }}
                    _focus={{
                      borderColor: loginBackground.startsWith('#') ? accentColor : 'brand.500',
                      boxShadow: loginBackground.startsWith('#') ? `0 0 0 3px ${accentColorLight}` : '0 0 0 3px rgba(66, 153, 225, 0.1)',
                      bg: inputFocusBg,
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
                    color={labelColor}
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
                      bg={inputBg}
                      border="1px solid"
                      borderColor={inputBorderColor}
                      _hover={{
                        borderColor: loginBackground.startsWith('#') ? accentColorBorder : inputHoverBorderColor,
                        bg: inputHoverBg,
                      }}
                      _focus={{
                        borderColor: loginBackground.startsWith('#') ? accentColor : 'brand.500',
                        boxShadow: loginBackground.startsWith('#') ? `0 0 0 3px ${accentColorLight}` : '0 0 0 3px rgba(66, 153, 225, 0.1)',
                        bg: inputFocusBg,
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
                          bg: togglePasswordHoverBg,
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
                      color={checkboxColor}
                    >
                      {t('auth.keepLoggedIn')}
                    </Checkbox>
                  )}
                  {loginBrand.showForgotPassword && (
                    <Link
                      as={RouterLink}
                      to="/forgot-password"
                      color={linkColor}
                      minH="44px"
                      display="flex"
                      alignItems="center"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="600"
                      _hover={{
                        textDecoration: 'underline',
                        color: linkHoverColor,
                      }}
                      transition="color 0.2s"
                    >
                      {t('auth.forgotPasswordLink')}
                    </Link>
                  )}
                </Flex>

                <Button
                  type="submit"
                  bg={loginBackground.startsWith('#') ? accentColor : 'brand.500'}
                  color={loginBackground.startsWith('#') ? (isLoginBgLight ? 'gray.900' : 'white') : 'white'}
                  size="lg"
                  width="100%"
                  minH={{ base: '52px', md: '56px' }}
                  borderRadius="xl"
                  fontWeight="700"
                  fontSize={{ base: 'md', md: 'lg' }}
                  letterSpacing="tight"
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                  _hover={{
                    bg: loginBackground.startsWith('#') ? (isLoginBgLight ? `${accentColor}E6` : `${accentColor}CC`) : 'brand.600',
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
              borderColor={dividerBorderColor}
            >
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color={bottomTextColor}
              >
                {t('auth.noAccountPrompt')}{' '}
                <Link
                  as={RouterLink}
                  to="/request-access"
                  color={linkColor}
                  fontWeight="600"
                  _hover={{
                    textDecoration: 'underline',
                    color: linkHoverColor,
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

