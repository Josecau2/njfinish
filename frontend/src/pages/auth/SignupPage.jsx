import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const SignupPage = () => {
  const navigate = useNavigate()
  const api_url = import.meta.env.VITE_API_URL

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
      const response = await axios.post(`${api_url}/api/signup`, formData) // Adjust URL if needed

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

  return (
    <div className="container-fluid vh-100 d-flex p-0">
      {/* Left Panel */}
      <div className="col-md-6 d-flex flex-column justify-content-center align-items-center p-5">
        <div maxW="400px">
          {/* <a href="/" className="text-decoration-none mb-4 d-inline-block">
            &larr; Back to login
          </a> */}
          <h2 className="fw-bold mb-2">Sign Up</h2>
          <p className="mb-4 text-muted">Create your account to get started.</p>

          {error && (
            <div className="alert alert-danger" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="form-label fw-semibold">
                Username <span>*</span>
              </label>
              <input
                type="text"
               
                id="username"
                name="username"
                placeholder="john_doe"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label fw-semibold">
                Email <span>*</span>
              </label>
              <input
                type="email"
               
                id="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3 position-relative">
              <label htmlFor="password" className="form-label fw-semibold">
                Password <span>*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                 
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{ minHeight: 44, minWidth: 44 }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" style={{ minHeight: 44 }}>
              Sign Up
            </button>
          </form>

          <div className="text-center mt-3">
            <span>Already have an account? </span>
            <a href="/login" style={{ minHeight: '44px', padding: '8px 0', display: 'inline-block' }}>Sign In</a>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center login-right-panel">
        <div className="text-center px-5">
          <h2>NJ Cabinets</h2>
          <p className="text-light">Dealer Portal</p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
