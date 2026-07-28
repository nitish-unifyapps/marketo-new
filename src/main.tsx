import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ui-polish.css'
import './styles/detail-polish.css'
import './styles/crm-leads-directory.css'
import './styles/crm-accounts-directory.css'
import './styles/crm-directory-consistency.css'
import './styles/programs.css'
import './styles/programs-segment.css'
import './styles/programs-flow.css'
import './styles/programs-schedule-settings.css'
import './styles/programs-reports.css'
import './styles/programs-asset-editor.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
