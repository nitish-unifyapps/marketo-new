import { useState } from 'react'
import { Modal } from '../../common/Modal'

const emailOptions = [
  { id: 'local-q3', name: 'Newsletter Q3', source: 'Local Asset', status: 'Draft', modified: 'Today, 10:24 AM', tone: 'warm' },
  { id: 'global-launch', name: 'Q3 Product Launch', source: 'Global Content', status: 'Approved', modified: 'Yesterday', tone: 'blue' },
  { id: 'global-welcome', name: 'Enterprise Welcome', source: 'Global Content', status: 'Approved', modified: 'Jul 25, 2026', tone: 'green' },
  { id: 'local-follow', name: 'Launch Follow-up', source: 'Local Asset', status: 'Draft', modified: 'Jul 24, 2026', tone: 'violet' },
]

interface EmailFlowStep {
  id: number
  type: 'email' | 'wait'
  label: string
  summary: string
}

export function EmailProgramEmailTab() {
  const [emailId, setEmailId] = useState('local-q3')
  const [changeOpen, setChangeOpen] = useState(false)
  const [flowSteps, setFlowSteps] = useState<EmailFlowStep[]>([{ id: 1, type: 'email', label: 'Send Email', summary: 'Newsletter Q3' }])
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [nextId, setNextId] = useState(2)
  const selectedEmail = emailOptions.find((email) => email.id === emailId) ?? emailOptions[0]

  function addWait() {
    const wait: EmailFlowStep = { id: nextId, type: 'wait', label: 'Wait', summary: 'Wait 1 day' }
    setNextId((value) => value + 1)
    setFlowSteps((current) => [...current, wait])
    setSelectedStep(wait.id)
  }

  return <div className='emailProgramTab'>
    <header><div><h3>Email Program Content</h3><p>Choose the email and optional wait steps that run for this batch program.</p></div><button type='button' className='button outline accent' onClick={() => setChangeOpen(true)}>Change Email</button></header>
    <div className='emailProgramWorkspace'>
      <main className='emailProgramPreviewArea'><div className='programEmailPreview'><div className='emailBrowserBar'><span /><span /><span /><strong>Sample recipient: John Smith · Northlane Systems</strong></div><div className='programEmailHero'><small>MARKETO NEXT · Q3 NEWSLETTER</small><h1>Your next best action starts here, John.</h1><p>See the product updates built to help Northlane Systems turn every buyer signal into pipeline.</p><a href='#email-cta'>Explore the Q3 release</a></div><div className='programEmailFeatures'><div><span>01</span><strong>Unified profiles</strong><p>Bring every person and account signal together.</p></div><div><span>02</span><strong>Smarter journeys</strong><p>Adapt every experience in real time.</p></div></div><footer>You are receiving this product update from Marketo Next. Unsubscribe · View online</footer></div><div className='selectedEmailStatus'><span className={`emailStatusDot ${selectedEmail.status.toLowerCase()}`} /><p>Selected email: <strong>“{selectedEmail.name}”</strong> ({selectedEmail.status.toLowerCase()})</p><button type='button'>Open in Email Editor ↗</button></div></main>
      <aside className='emailProgramMiniFlow'><header><strong>Delivery Flow</strong><small>{flowSteps.length} configured steps</small></header><div className='miniFlowStart'><span>●</span><div><strong>Start</strong><small>Smart List audience</small></div></div>{flowSteps.map((step, index) => <div className='miniEmailStepWrap' key={step.id}><i /><button type='button' className={selectedStep === step.id ? 'selected' : ''} onClick={() => setSelectedStep(step.id)}><span>{step.type === 'email' ? '✉' : '◷'}</span><div><strong>{step.label}</strong><small>{step.summary}</small></div><em>{index + 1}</em></button></div>)}<div className='miniEmailStepWrap'><i /><div className='miniFlowEnd'><span>⊗</span><div><strong>End</strong><small>Program complete</small></div></div></div><button type='button' className='button outline accent addEmailWait' onClick={addWait}>＋ Add Wait Step</button></aside>
    </div>
    {selectedStep && <aside className='emailProgramStepPanel'><header><span>{flowSteps.find((step) => step.id === selectedStep)?.type === 'email' ? '✉' : '◷'}</span><div><strong>Configure {flowSteps.find((step) => step.id === selectedStep)?.label}</strong><small>Email Program Step</small></div><button type='button' onClick={() => setSelectedStep(null)}>×</button></header><div>{flowSteps.find((step) => step.id === selectedStep)?.type === 'email' ? <><label>Subject<input defaultValue='Your Q3 product update, {{Person.FirstName}}' /></label><label>Preheader<input defaultValue='See what’s new for {{Person.Company}}' /></label><button type='button' className='button outline accent fullButton' onClick={() => setTokenOpen((value) => !value)}>{'{{}}'} Insert Token</button>{tokenOpen && <div className='emailProgramTokenPicker'><header><strong>Insert Token</strong><button type='button' onClick={() => setTokenOpen(false)}>×</button></header>{['{{Person.FirstName}}', '{{Person.Company}}', '{{my.OfferName}}', '{{System.Year}}'].map((token) => <button type='button' key={token} onClick={() => setTokenOpen(false)}>{token}<span>＋</span></button>)}</div>}</> : <><label>Wait Duration<input type='number' defaultValue='1' /></label><label>Unit<select><option>Days</option><option>Hours</option><option>Weeks</option></select></label></>}<footer><button type='button' className='button ghost' onClick={() => setSelectedStep(null)}>Cancel</button><button type='button' className='button solid' onClick={() => setSelectedStep(null)}>Save Step</button></footer></div></aside>}
    <Modal title='Select Email' open={changeOpen} onClose={() => setChangeOpen(false)}><div className='selectProgramEmailModal'><header><label><span>⌕</span><input placeholder='Search local and global emails…' /></label><select><option>All Sources</option><option>Local Assets</option><option>Global Content</option></select></header><div>{emailOptions.map((email) => <button type='button' key={email.id} className={email.id === emailId ? 'selected' : ''} onClick={() => setEmailId(email.id)}><span className={`emailOptionThumb tone-${email.tone}`}><i /><b /><i /></span><span><strong>{email.name}</strong><small>{email.source} · {email.status}</small><em>Modified {email.modified}</em></span><i>{email.id === emailId ? '✓' : ''}</i></button>)}</div><footer><button type='button' className='button ghost' onClick={() => setChangeOpen(false)}>Cancel</button><button type='button' className='button solid' onClick={() => { setFlowSteps((current) => current.map((step) => step.type === 'email' ? { ...step, summary: selectedEmail.name } : step)); setChangeOpen(false) }}>Use Selected Email</button></footer></div></Modal>
  </div>
}
