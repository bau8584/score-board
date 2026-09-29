import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'
import './styles/baseball.css'
import './styles/general.css'
import './styles/kinball.css'
import './styles/timer.css'
import './styles/settings.css'
import './styles/curling.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
