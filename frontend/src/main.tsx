import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { initTheme } from './store/themeStore';
import './index.css';

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'toast-themed',
          style: {
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#00C853', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#FF5252', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
