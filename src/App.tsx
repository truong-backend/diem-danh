import AppRouter from './router/AppRouter'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '13px',
            fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
            fontWeight: '600',
            borderRadius: '12px',
            border: '1px solid rgba(195,198,216,0.3)',
            boxShadow: '0 12px 40px rgba(25, 28, 30, 0.10)',
            background: '#ffffff',
            color: '#191c1e',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ba1a1a', secondary: '#ffffff' },
          },
        }}
      />
    </>
  )
}