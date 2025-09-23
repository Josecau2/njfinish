import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const ResetPasswordPage = () => {
    const api_url = import.meta.env.VITE_API_URL;
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
            const res = await fetch(`${api_url}/api/reset-password`, {
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
                    {message && (
                        <div className="alert alert-success" role="status" aria-live="polite">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}


                    <form onSubmit={handleReset}>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label fw-semibold">Reset Password<span className="text-danger">*</span></label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" style={{ minHeight: 44 }}>Reset</button>
                    </form>

                    <div className="text-center mt-3">
                        <Link to="/login" className="text-decoration-none">Back to login</Link>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center login-right-panel">
                <div className="text-center px-5">
                    {/* <img src="/logo.png" alt="TailAdmin" className="mb-3" style={{ height: '60px' }} /> */}
                    <h2>NJ Cabinets</h2>
                    {false && <p className="text-light"></p>}
                    <p className="text-light">Dealer Portal</p>
                    {false && <p className="text-light"></p>}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
