import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Reset link sent to your email.');
        // navigate('/login');
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      setError('Error sending reset link.');
    }
  };


  return (
    <div className="container-fluid vh-100 d-flex p-0">
      {/* Left Panel */}
      <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-5">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          {/* <a href="/" className="text-decoration-none mb-4 d-inline-block">
            &larr; Back to login
          </a> */}
          <h2 className="fw-bold mb-2">Forgot Password</h2>
          <p className="mb-4 text-muted">Enter your email and we'll send you a link to reset your password.</p>
          {message && (
            <div className="alert alert-success" role="alert">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">Email address <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Send Reset Link
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">Remember your password? </span>
            <a href="/login">Sign In</a>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center login-right-panel">
        <div className="text-center px-5">
          {/* <img src="/logo.png" alt="TailAdmin" className="mb-3" style={{ height: '60px' }} /> */}
          <h2>NJ Cabinets</h2>
          <p className="text-light">Configure - Price - Quote</p>
          <p className="text-light">Dealer Portal</p>
          <p className="text-light">Manage end-to-end flow, from pricing cabinets to orders and returns with our premium sales automation software tailored to kitchen industry. A flexible and component-based B2B solution that can integrate with your existing inventory, accounting, and other systems.</p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
