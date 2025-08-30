import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setUser } from '../store/slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth?.token);
  const user = useSelector(state => state.auth?.user);
  
  // Restore user data from localStorage if not in Redux
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        dispatch(setUser({ user: parsedUser, token: storedToken }));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [dispatch, user]);
  
  // Check both Redux store and localStorage for backward compatibility
  const isAuthenticated = token || localStorage.getItem('token');
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
