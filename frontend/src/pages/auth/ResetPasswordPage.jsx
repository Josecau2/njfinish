import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');



    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || 'Password reset successful.');
                setTimeout(() => navigate('/login'), 3000); // optional redirect
            } else {
                setError(data.message || 'Password reset failed.');
            }
        } catch (err) {
            setError('Failed to reset password.');
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


                    <form onSubmit={handleReset}>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-semibold">Reset Password<span className="text-danger">*</span></label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Reset</button>
                    </form>

                    {/* <div className="text-center mt-3">
                        <span className="text-muted">Remember your password? </span>
                        <a href="/login">Sign In</a>
                    </div> */}
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

export default ResetPasswordPage;
