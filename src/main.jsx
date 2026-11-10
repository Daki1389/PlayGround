import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { GameProvider } from './context/GameContext'
import { ToastProvider } from './components/Toast'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <GameProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </GameProvider>
    </HashRouter>
  </StrictMode>,
)
