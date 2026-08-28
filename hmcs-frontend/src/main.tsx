import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import axios from 'axios'
import { logout } from './services/auth.service'
import { showToast } from './utils/toast'

// Ensure cookies are sent with every axios request
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Global error handler for API responses
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Prevent showing multiple toasts if many requests fail at once
      if (!window.sessionStorage.getItem('session_expired_shown')) {
        window.sessionStorage.setItem('session_expired_shown', 'true');
        showToast('Your session has expired or is invalid. Please log in again.', 'error');
        
        // Auto-redirect to login after 2 seconds
        setTimeout(() => {
          logout().finally(() => {
            window.location.href = '/login?expired=true';
            window.sessionStorage.removeItem('session_expired_shown');
          });
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
