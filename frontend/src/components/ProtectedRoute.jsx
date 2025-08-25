import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const token = useSelector(state => state.auth?.token);
  const user = useSelector(state => state.auth?.user);
  
  // Check both Redux store and localStorage for backward compatibility
  const isAuthenticated = token || localStorage.getItem('token');
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
