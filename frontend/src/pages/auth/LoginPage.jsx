import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setError } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const api_url = import.meta.env.VITE_API_URL;

  const [customization, setCustomization] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axios.get(`${api_url}/api/login-customization`);
        if (res.data.customization) {
          setCustomization(res.data.customization);
        }
      } catch (err) {
        console.error('Failed to load customization settings:', err);
      }
    };

    fetchCustomization();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${api_url}/api/login`, {
        email,
        password,
      });

      const { token, userId, name, role, role_id } = response.data;
      const user = { email, userId, name, role, role_id };

      dispatch(setUser({ user, token }));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch(setError(errorMsg));
      setErrorMessage(errorMsg);
    }
  };

  const settings = customization || {
    logo: "",
    title: "Sign In",
    subtitle: "Enter your email and password to sign in!",
    backgroundColor: "#0e1446",
    showForgotPassword: true,
    showKeepLoggedIn: true,
    rightTitle: "NJ Cabinets",
    rightSubtitle: "Configure - Price - Quote",
    rightTagline: "Dealer Portal",
    rightDescription:
      "Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.",
  };

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100">
      {/* Left Form */}
      <div className="d-flex align-items-center justify-content-center w-100 w-md-50 px-4 py-5 bg-white">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          {settings.logo && (
            <div className="text-center mb-3">
              <img src={settings.logo} alt="Logo" style={{ height: 50 }} />
            </div>
          )}
          <h2 className="mb-1 fw-bold">{settings.title}</h2>
          <p className="text-muted mb-4">{settings.subtitle}</p>

          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-medium">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="info@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-medium">
                Password <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              {settings.showKeepLoggedIn && (
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="keepLoggedIn"
                    checked={keepLoggedIn}
                    onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                  />
                  <label className="form-check-label" htmlFor="keepLoggedIn">
                    Keep me logged in
                  </label>
                </div>
              )}
              {settings.showForgotPassword && (
                <a href="/reset-password" className="text-primary">
                  Forgot password?
                </a>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Sign in
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="d-flex align-items-center justify-content-center w-100 w-md-50 px-4 py-5 text-white"
        style={{ backgroundColor: settings.backgroundColor }}
      >
        <div className="text-center px-5">
          <h2>{settings.rightTitle}</h2>
          <p className="text-light">{settings.rightSubtitle}</p>
          <p className="text-light">{settings.rightTagline}</p>
          <p className="text-light">{settings.rightDescription}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
