import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); // or check Redux store

  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
