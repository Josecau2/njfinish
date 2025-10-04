import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '../../store/slices/authSlice';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Box, Flex, Container, Heading, Text, FormControl, FormLabel, Input, InputGroup, InputRightElement, IconButton, Button, Checkbox, Link, Alert, AlertIcon, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getOptimalColors } from '../../utils/colorUtils';
import BrandLogo from '../../components/BrandLogo';
import { getBrand, getLoginBrand, getBrandColors } from '../../brand/useBrand';
import { installTokenEverywhere } from '../../utils/authToken';
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'
import LanguageSwitcher from '../../components/LanguageSwitcher';

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
      const response = await axios.post(`${api_url}/api/login`, {
        email,
        password,
      });

      const { token, userId, name, role, role_id, group_id, group } = response.data;
      const user = { email, userId, name, role: String(role || '').toLowerCase(), role_id, group_id, group };

      // Force complete token cleanup before installing new token
      // This ensures no stale tokens interfere with the new session
      try {
        // Clear any existing tokens first
        localStorage.clear(); // Complete clean slate
        sessionStorage.clear(); // Complete clean slate
      } catch {}

      // Install token everywhere (hard reset) and persist user
      installTokenEverywhere(token, { preserveUser: false });
      try { localStorage.setItem('user', JSON.stringify(user)); } catch {}

      // Wait a brief moment to ensure token is fully installed before proceeding
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify token was installed correctly
      const verifyToken = sessionStorage.getItem('token');
      if (!verifyToken || verifyToken !== token) {
        throw new Error('Token installation failed');
      }

      // Notify other tabs
      try { window.localStorage.setItem('__auth_changed__', String(Date.now())); } catch {}

      dispatch(setUser({ user, token }));

      // Force light mode as default theme on login
      localStorage.setItem('coreui-free-react-admin-template-theme', 'light');

      const returnTo = (() => { try { return sessionStorage.getItem('return_to') || '/' } catch { return '/' } })();
      try { sessionStorage.removeItem('return_to'); } catch {}
      navigate(returnTo);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || t('auth.loginFailed');
      dispatch(setError(errorMsg));
      setErrorMessage(errorMsg);
    }
  };


  // Compute optimal text colors for the right panel based on background
  const rightPanelColors = getOptimalColors(loginBackground);

  return (
    <Flex minH="100vh" className="login-page-wrapper">
      {/* Left Panel - Illustration and Branding */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        flex="1"
        bg={loginBackground}
        alignItems="center"
        justifyContent="center"
        px={8}
        className="login-left-panel"
      >
        <VStack spacing={4} maxW="500px" textAlign="center">
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
      </Box>

      {/* Right Panel - Form */}
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        bg={bgWhite}
        className="login-right-panel"
        position="relative"
      >
        <Box position="absolute" top={4} right={4}>
          <LanguageSwitcher compact />
        </Box>
        <Container maxW="md" py={8}>
          <VStack spacing={6} align="stretch">
            <Box textAlign="center">
              <BrandLogo size={logoHeight} />
            </Box>
            <Heading as="h2" size="lg" textAlign="center">
              {loginBrand.title}
            </Heading>
            <Text textAlign="center" color={textGray700}>
              {loginBrand.subtitle}
            </Text>

            {noticeMessage && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                {noticeMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {errorMessage}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel htmlFor="email" fontWeight="500">
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
                    minH="44px"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel htmlFor="password" fontWeight="500">
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
                      minH="44px"
                    />
                    <InputRightElement width="44px" height="44px">
                      <IconButton
                        aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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

                <Flex justify="space-between" align="center" w="100%">
                  {loginBrand.showKeepLoggedIn && (
                    <Checkbox
                      id="keepLoggedIn"
                      isChecked={keepLoggedIn}
                      onChange={(e) => setKeepLoggedIn(e.target.checked)}
                      minH="44px"
                      display="flex"
                      alignItems="center"
                    >
                      {t('auth.keepLoggedIn')}
                    </Checkbox>
                  )}
                  {loginBrand.showForgotPassword && (
                    <Link as={RouterLink} to="/forgot-password" color={linkBlue} minH="44px" display="flex" alignItems="center">
                      {t('auth.forgotPasswordLink')}
                    </Link>
                  )}
                </Flex>

                <Button
                  type="submit"
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  minH="44px"
                >
                  {t('auth.signIn')}
                </Button>
              </VStack>
            </Box>

            <Text textAlign="center">
              {t('auth.noAccountPrompt')}{' '}
              <Link as={RouterLink} to="/request-access" color={linkBlue} minH="44px" py={2}>
                {t('auth.requestAccess.submit')}
              </Link>
            </Text>
          </VStack>
        </Container>
      </Flex>
    </Flex>
  );
};

export default LoginPage;