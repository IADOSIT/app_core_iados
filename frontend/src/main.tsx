import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

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
          style: {
            background: '#1A1A24',
            color: '#fff',
            border: '1px solid rgba(0,230,118,0.2)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#00E676', secondary: '#0A0A0F' },
          },
          error: {
            iconTheme: { primary: '#FF5252', secondary: '#0A0A0F' },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);
