// Component that ensures fresh session on app start
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { clearAllTokens } from '../utils/authToken';

const SessionRefresher = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if this is a fresh page load or a reload after logout
    const urlParams = new URLSearchParams(window.location.search);
    const isFreshLogin = urlParams.has('_fresh');
    const isLogoutReload = urlParams.has('_logout');
    
    // If URL has logout or fresh parameters, ensure complete cleanup
    if (isFreshLogin || isLogoutReload) {
      clearAllTokens();
      dispatch(logout());
      
      // Clean up URL parameters
      const url = new URL(window.location);
      url.searchParams.delete('_fresh');
      url.searchParams.delete('_logout');
      url.searchParams.delete('_t');
      
      if (url.search !== window.location.search) {
        window.history.replaceState({}, '', url);
      }
    }
    
    // Check for stale tokens on app start
    const checkTokenFreshness = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decode token to check expiration
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = payload.exp - now;
          
          // If token expires within 5 minutes, force fresh login
          if (timeUntilExpiry < 300) {
            console.log('[SESSION_REFRESHER] Token expiring soon, forcing fresh login');
            clearAllTokens();
            dispatch(logout());
            window.location.href = '/login?_fresh=1';
            return;
          }
        } catch (error) {
          // Invalid token format, clear it
          console.log('[SESSION_REFRESHER] Invalid token format, clearing');
          clearAllTokens();
          dispatch(logout());
        }
      }
    };
    
    checkTokenFreshness();
    
    // Set up periodic token freshness check (every 5 minutes)
    const interval = setInterval(checkTokenFreshness, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  return children;
};

export default SessionRefresher;
