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
      rightBg={bgWhite}
      languageSwitcherProps={{ compact: true }}
    >
      <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={{ base: 2, md: 0 }}>
              <BrandLogo size={logoHeight} />
            </Box>
            <Heading 
              as="h2" 
              size={{ base: 'lg', md: 'xl' }} 
              textAlign="center"
              fontWeight="bold"
              letterSpacing="tight"
              color={useColorModeValue('gray.900', 'white')}
            >
              {loginBrand.title}
            </Heading>
            <Text 
              textAlign="center" 
              color={textGray700}
              fontSize={{ base: 'sm', md: 'md' }}
              fontWeight="medium"
            >
              {loginBrand.subtitle}
            </Text>

            {noticeMessage && (
              <Alert 
                status="info" 
                borderRadius={{ base: 'lg', md: 'md' }}
                boxShadow="sm"
                fontSize={{ base: 'sm', md: 'md' }}
              >
                <AlertIcon />
                {noticeMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert 
                status="error" 
                borderRadius={{ base: 'lg', md: 'md' }}
                boxShadow="sm"
                fontSize={{ base: 'sm', md: 'md' }}
              >
                <AlertIcon />
                {errorMessage}
              </Alert>
            )}

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={{ base: 5, md: 4 }}>
                <FormControl isRequired>
                  <FormLabel 
                    htmlFor="email" 
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    mb={2}
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
                    minH="44px"
                    borderRadius={{ base: 'lg', md: 'md' }}
                    fontSize={{ base: 'md', md: 'lg' }}
                    _focus={{
                      borderColor: 'brand.500',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                    }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel 
                    htmlFor="password" 
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    mb={2}
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
                      minH="44px"
                      borderRadius={{ base: 'lg', md: 'md' }}
                      fontSize={{ base: 'md', md: 'lg' }}
                      _focus={{
                        borderColor: 'brand.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
                      }}
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
                        borderRadius={{ base: 'lg', md: 'md' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Flex 
                  justify="space-between" 
                  align="center" 
                  w="100%" 
                  flexDirection={{ base: 'column', sm: 'row' }}
                  gap={{ base: 3, sm: 0 }}
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
                      fontWeight="medium"
                    >
                      {t('auth.keepLoggedIn')}
                    </Checkbox>
                  )}
                  {loginBrand.showForgotPassword && (
                    <Link 
                      as={RouterLink} 
                      to="/forgot-password" 
                      color={linkBlue} 
                      minH="44px" 
                      display="flex" 
                      alignItems="center"
                      fontSize={{ base: 'sm', md: 'md' }}
                      fontWeight="600"
                      _hover={{
                        textDecoration: 'underline',
                      }}
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
                  minH="44px"
                  borderRadius={{ base: 'lg', md: 'md' }}
                  fontWeight="bold"
                  fontSize={{ base: 'md', md: 'lg' }}
                  boxShadow="sm"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'md',
                  }}
                  transition="all 0.2s"
                >
                  {t('auth.signIn')}
                </Button>
              </VStack>
            </Box>

            <Text 
              textAlign="center"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              {t('auth.noAccountPrompt')}{' '}
              <Link 
                as={RouterLink} 
                to="/request-access" 
                color={linkBlue} 
                minH="44px" 
                py={2}
                fontWeight="600"
                _hover={{
                  textDecoration: 'underline',
                }}
              >
                {t('auth.requestAccess.submit')}
              </Link>
            </Text>
          </VStack>
    </AuthLayout>
  );
};

export default LoginPage;
