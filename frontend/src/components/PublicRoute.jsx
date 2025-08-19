import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  // If already authenticated, redirect to dashboard
  return token ? <Navigate to="/" replace /> : children;
};

export default PublicRoute;
