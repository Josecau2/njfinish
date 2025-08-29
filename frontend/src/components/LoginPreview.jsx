import React, { useState } from "react";
import { useSelector } from 'react-redux';
import { getContrastColor, getOptimalColors } from '../utils/colorUtils';
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const LoginPreview = ({ config }) => {
  const [showPassword, setShowPassword] = useState(false);
  const customization = useSelector((state) => state.customization);
  
  const headerBg = customization.headerBg || '#667eea';
  const textColor = getContrastColor(headerBg);

  return (
    <div className="d-flex flex-column flex-md-row min-vh-100 border rounded shadow overflow-hidden">
      {/* Left Panel */}
  <div className="d-flex align-items-center justify-content-center w-100 w-md-50 px-4 py-5 bg-body">
        <div className="w-100" style={{ maxWidth: "400px" }}>
          {config.logo && (
            <img
              src={config.logo}
              alt="Logo"
              className="mb-4"
              style={{ height: "60px", objectFit: "contain" }}
            />
          )}
          <h2 className="mb-1 fw-bold">{config.title}</h2>
          <p className="text-muted mb-4">{config.subtitle}</p>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <label className="form-label fw-medium">Email</label>
              <input type="email" className="form-control" disabled />
            </div>

            <div className="mb-3">
              <label className="form-label fw-medium">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  disabled
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
              {config.showKeepLoggedIn && (
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" disabled />
                  <label className="form-check-label">Keep me logged in</label>
                </div>
              )}
              {config.showForgotPassword && (
                <a href="#" className="text-primary text-decoration-none">Forgot password?</a>
              )}
            </div>

            <button 
              type="submit" 
              className="btn w-100" 
              disabled
              style={{
                background: headerBg,
                color: textColor,
                border: 'none'
              }}
            >
              Sign in
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="d-flex align-items-center justify-content-center w-100 w-md-50 px-4 py-5"
        style={{ backgroundColor: config.backgroundColor }}
      >
        {(() => {
          const colors = getOptimalColors(config.backgroundColor || '#0e1446');
          return (
            <div className="text-center px-4">
              <h2 style={{ color: colors.text }}>{config.rightTitle}</h2>
              <p className="mb-1" style={{ color: colors.subtitle }}>{config.rightSubtitle}</p>
              <p className="mb-2" style={{ color: colors.subtitle }}>{config.rightTagline}</p>
              <p style={{ color: colors.subtitle }}>{config.rightDescription}</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default LoginPreview;
