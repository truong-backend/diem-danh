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
          style: { fontSize: '14px', borderRadius: '10px' }
        }}
      />
    </>
  )
}