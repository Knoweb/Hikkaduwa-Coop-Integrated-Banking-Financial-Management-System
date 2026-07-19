import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const ToastContainer = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  useEffect(() => {
    const handleToast = (event: any) => {
      setMessage(event.detail.message);
      setSeverity(event.detail.severity || 'success');
      setOpen(true);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={4000} 
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%', fontWeight: 'bold' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};
