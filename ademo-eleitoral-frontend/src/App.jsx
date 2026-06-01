import AppRoutes from './routes/AppRoutes'
import { Toaster } from 'sonner'
import './App.css'
import './styles/accessibility-tailwind.css'

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        closeButton
        position="top-right"
        richColors
        toastOptions={{
          className: 'app-toast',
        }}
      />
    </>
  )
}

export default App
