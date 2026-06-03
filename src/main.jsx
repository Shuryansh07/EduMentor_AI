import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { GoogleAuthProvider } from './components/GoogleAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <GoogleAuthProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                className:
                  'dark:!bg-slate-800 dark:!text-slate-100 !rounded-xl !text-sm',
                duration: 3500,
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </GoogleAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
