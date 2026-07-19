export const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
  const event = new CustomEvent('app-toast', { detail: { message, severity } });
  window.dispatchEvent(event);
};

// Also expose globally for easy replacement of native alert
(window as any).showToast = showToast;
