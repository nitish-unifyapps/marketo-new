import { useState } from 'react'
import { Modal } from '../../common/Modal'

type FlowStepType = 'send-email' | 'wait' | 'change-data' | 'add-list' | 'remove-list' | 'webhook' | 'sync-crm' | 'task' | 'alert' | 'moment' | 'split' | 'end'

interface FlowStep {
  id: number
  type: FlowStepType
  label: string
  summary: string
  icon: string
}

const stepCatalog: Array<{ type: FlowStepType; label: string; icon: string; defaultSummary: string }> = [
  { type: 'send-email', label: 'Send Email', icon: '✉', defaultSummary: 'Select an email' },
  { type: 'wait', label: 'Wait', icon: '◷', defaultSummary: 'Wait 3 days' },
  { type: 'change-data', label: 'Change Data Value', icon: '⇄', defaultSummary: 'Person Score +50' },
  { type: 'add-list', label: 'Add to List', icon: '＋', defaultSummary: 'Select a static list' },
  { type: 'remove-list', label: 'Remove from List', icon: '−', defaultSummary: 'Select a static list' },
  { type: 'webhook', label: 'Call Webhook', icon: '↗', defaultSummary: 'Select a webhook' },
  { type: 'sync-crm', label: 'Sync to CRM', icon: '⇅', defaultSummary: 'Push mapped Lead fields' },
  { type: 'task', label: 'Create Task', icon: '✓', defaultSummary: 'Follow up with new MQL' },
  { type: 'alert', label: 'Send Alert', icon: '!', defaultSummary: 'Notify assigned owner' },
  { type: 'moment', label: 'Interesting Moment', icon: '★', defaultSummary: 'High intent activity' },
  { type: 'split', label: 'Split (A/B Test)', icon: '⑂', defaultSummary: '50% Path A · 50% Path B' },
  { type: 'end', label: 'End', icon: '⊗', defaultSummary: 'Campaign complete' },
]

const initialSteps: FlowStep[] = [
  { id: 1, type: 'send-email', label: 'Send Email', summary: 'Send: Newsletter Q3', icon: '✉' },
  { id: 2, type: 'wait', label: 'Wait', summary: 'Wait 3 days', icon: '◷' },
  { id: 3, type: 'change-data', label: 'Change Data Value', summary: 'Person Score: increment by 50', icon: '⇄' },
  { id: 4, type: 'alert', label: 'Send Alert', summary: 'Notify: Assigned Sales Owner', icon: '!' },
  { id: 5, type: 'end', label: 'End', summary: 'Goal: Sales notified', icon: '⊗' },
]

export function FlowEditor({ programTokens = [] }: { programTokens?: string[] }) {
  const [steps, setSteps] = useState<FlowStep[]>(initialSteps)
  const [view, setView] = useState<'classic' | 'visual'>('classic')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null)
  const [deleteStep, setDeleteStep] = useState<FlowStep | null>(null)
  const [nextId, setNextId] = useState(6)
  const selectedStep = steps.find((step) => step.id === selectedStepId)

  function addStep(type: FlowStepType) {
    const catalog = stepCatalog.find((item) => item.type === type)
    if (!catalog) return
    const step: FlowStep = { id: nextId, type, label: catalog.label, summary: catalog.defaultSummary, icon: catalog.icon }
    setSteps((current) => type === 'end' ? [...current, step] : [...current.filter((item) => item.type !== 'end'), step, ...current.filter((item) => item.type === 'end')])
    setNextId((value) => value + 1)
    setSelectedStepId(step.id)
    setAddOpen(false)
  }

  function moveStep(id: number, direction: -1 | 1) {
    setSteps((current) => {
      const index = current.findIndex((step) => step.id === id)
      const destination = index + direction
      if (index < 0 || destination < 0 || destination >= current.length) return current
      const next = [...current]
      const [step] = next.splice(index, 1)
      next.splice(destination, 0, step)
      return next
    })
  }

  function updateSummary(summary: string) {
    setSteps((current) => current.map((step) => step.id === selectedStepId ? { ...step, summary } : step))
  }

  return <div className={`phase2FlowEditor view-${view}`}>
    <header className='flowEditorHeader'><div><h3>Campaign Flow</h3><p>{steps.length} steps execute from top to bottom for each qualifying person.</p></div><button type='button' className='visualFlowToggle' onClick={() => setView((current) => current === 'classic' ? 'visual' : 'classic')}><span>{view === 'classic' ? '⑂' : '☷'}</span>{view === 'classic' ? 'Switch to Visual Editor' : 'Classic Flow'}</button></header>
    {view === 'classic' ? <div className='classicFlowWorkspace'><div className='classicFlowList'><div className='flowStartMarker'><span>⚡</span><div><strong>Start</strong><small>Smart List audience qualifies</small></div></div>{steps.map((step, index) => <div className='classicStepWrap' key={step.id}><i className='flowStepConnector' /> <article className={`classicFlowStep ${selectedStepId === step.id ? 'selected' : ''}`} onClick={() => setSelectedStepId(step.id)}><span className='sixDotHandle'>⠿</span><span className={`stepTypeIcon type-${step.type}`}>{step.icon}</span><div><strong>{step.label}</strong><p>{step.summary}</p></div><em>Step {index + 1}</em><div className='flowStepHoverActions'><button type='button' title='Move up' onClick={(event) => { event.stopPropagation(); moveStep(step.id, -1) }}>↑</button><button type='button' title='Move down' onClick={(event) => { event.stopPropagation(); moveStep(step.id, 1) }}>↓</button><button type='button' title='Edit' onClick={(event) => { event.stopPropagation(); setSelectedStepId(step.id) }}>✎</button><button type='button' title='Delete' onClick={(event) => { event.stopPropagation(); setDeleteStep(step) }}>⌫</button></div></article></div>)}<div className='addFlowStepWrap'><i /><button type='button' className='button outline accent' onClick={() => setAddOpen((value) => !value)}>＋ Add Step</button>{addOpen && <div className='addStepDropdown'>{stepCatalog.map((item, index) => <button type='button' key={item.type} className={index === 2 || index === 10 ? 'groupStart' : ''} onClick={() => addStep(item.type)}><span>{item.icon}</span><div><strong>{item.label}</strong><small>{item.defaultSummary}</small></div></button>)}</div>}</div></div></div> : <VisualFlowCanvas steps={steps} selectedId={selectedStepId} onSelect={setSelectedStepId} />}
    {selectedStep && <StepConfigurationPanel step={selectedStep} programTokens={programTokens} onClose={() => setSelectedStepId(null)} onSummaryChange={updateSummary} />}
    <Modal title='Delete Flow Step' open={Boolean(deleteStep)} onClose={() => setDeleteStep(null)}><div className='phase2DeleteConfirm'><span>!</span><h3>Delete “{deleteStep?.label}”?</h3><p>People currently at this step may be affected when the campaign is activated.</p><footer><button type='button' className='button ghost' onClick={() => setDeleteStep(null)}>Cancel</button><button type='button' className='button dangerButton' onClick={() => { if (deleteStep) setSteps((current) => current.filter((step) => step.id !== deleteStep.id)); setDeleteStep(null) }}>Delete Step</button></footer></div></Modal>
  </div>
}

function VisualFlowCanvas({ steps, selectedId, onSelect }: { steps: FlowStep[]; selectedId: number | null; onSelect: (id: number) => void }) {
  return <div className='phase2VisualCanvas'><div className='visualCanvasControls'><button type='button'>↶</button><button type='button'>↷</button><i /><button type='button'>−</button><span>100%</span><button type='button'>＋</button><button type='button'>⌗</button></div><div className='phase2VisualInner'><div className='visualStartNode'><span>⚡</span><strong>Smart List</strong><small>Entry Audience</small></div>{steps.map((step) => <div key={step.id} className='visualStepGroup'><i className='visualConnection' /><button type='button' className={`phase2VisualNode ${selectedId === step.id ? 'selected' : ''}`} onClick={() => onSelect(step.id)}><span>{step.icon}</span><div><strong>{step.label}</strong><small>{step.summary}</small></div><em>•••</em><i className='visualInputHandle' /><i className='visualOutputHandle' /></button>{step.type === 'split' && <div className='visualSplitBranches'><span>Path A · 50%</span><span>Path B · 50%</span></div>}</div>)}</div><div className='visualMinimap'><i /><i /><i /><i /><span /></div></div>
}

function StepConfigurationPanel({ step, programTokens, onClose, onSummaryChange }: { step: FlowStep; programTokens: string[]; onClose: () => void; onSummaryChange: (summary: string) => void }) {
  return <aside className='stepConfigurationPanel'><header><span>{step.icon}</span><div><strong>{step.label}</strong><small>Flow Step Configuration</small></div><button type='button' onClick={onClose}>×</button></header><div className='stepConfigBody'>{step.type === 'send-email' ? <SendEmailStep programTokens={programTokens} onSummaryChange={onSummaryChange} /> : step.type === 'wait' ? <WaitStep /> : step.type === 'change-data' ? <ChangeDataStep /> : step.type === 'webhook' ? <WebhookStep /> : step.type === 'sync-crm' ? <SyncCrmStep /> : step.type === 'task' ? <TaskStep /> : step.type === 'alert' ? <AlertStep /> : <GenericStep step={step} />}<footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={onClose}>Save Step</button></footer></div></aside>
}

function SendEmailStep({ programTokens, onSummaryChange }: { programTokens: string[]; onSummaryChange: (summary: string) => void }) {
  const [email, setEmail] = useState('Newsletter Q3')
  const [tokenPickerOpen, setTokenPickerOpen] = useState(false)
  return <><label className='phase2Field'>Email<label className='phase2SearchSelect'><span>⌕</span><input value={email} onChange={(event) => setEmail(event.target.value)} /></label></label><div className='phase2EmailSelection'><div className='miniEmailThumb'><i /><b /><i /></div><div><strong>{email}</strong><small>Approved · Modified today</small><button type='button'>Preview Email ↗</button></div></div><label className='phase2Field'>Suppression List<select><option>Global Unsubscribes</option><option>Competitors</option><option>None</option></select></label><button type='button' className='button outline accent fullButton' onClick={() => setTokenPickerOpen((value) => !value)}>{'{{}}'} Insert Token</button>{tokenPickerOpen && <Phase2TokenPicker programTokens={programTokens} onClose={() => setTokenPickerOpen(false)} />}<label className='phase2ToggleRow'><span><strong>Track opens and clicks</strong><small>Write engagement to the activity log</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><button type='button' className='phase2ApplySummary' onClick={() => onSummaryChange(`Send: ${email}`)}>Use “{email}”</button></>
}

function WaitStep() {
  const [type, setType] = useState('duration')
  return <><label className='phase2Field'>Duration Type<select value={type} onChange={(event) => setType(event.target.value)}><option value='duration'>For a set duration</option><option value='date'>Until specific date</option><option value='dynamic'>Until dynamic date (token)</option></select></label>{type === 'duration' && <div className='phase2SplitFields'><label>Duration<input type='number' defaultValue='3' /></label><label>Unit<select><option>Days</option><option>Hours</option><option>Weeks</option></select></label></div>}{type === 'date' && <><label className='phase2Field'>Date<input type='date' defaultValue='2026-08-15' /></label><label className='phase2Field'>Time<input type='time' defaultValue='09:00' /></label></>}{type === 'dynamic' && <label className='phase2Field'>Date Token<select><option>{'{{my.EventDate}}'}</option><option>{'{{Person.RenewalDate}}'}</option><option>{'{{Trigger.EventDate}}'}</option></select></label>}<label className='phase2ToggleRow'><span><strong>Use person timezone</strong><small>Resume at the same local time</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></>
}

function ChangeDataStep() { return <><label className='phase2Field'>Person Field<select><option>Person Score</option><option>Lifecycle Stage</option><option>Lead Source</option><option>Owner</option></select></label><label className='phase2Field'>Operator<select><option>Set value</option><option>Increment</option><option>Decrement</option><option>Clear value</option></select></label><label className='phase2Field'>Value<input defaultValue='+50' /></label></> }
function WebhookStep() { return <><label className='phase2Field'>Webhook<select><option>Enrich Person — Clearbit</option><option>Notify Slack Channel</option><option>Custom Revenue API</option></select></label><div className='payloadPreview'><header><strong>Payload Preview</strong><button type='button'>Edit</button></header><pre>{`{
  "email": "{{Person.Email}}",
  "score": "{{Person.Score}}",
  "campaign": "{{my.ProgramName}}"
}`}</pre></div></> }
function SyncCrmStep() { const [action, setAction] = useState('all'); return <><label className='phase2Field'>CRM Object<select><option>Lead</option><option>Contact</option><option>Account</option></select></label><label className='phase2Field'>Sync Action<select value={action} onChange={(event) => setAction(event.target.value)}><option value='all'>Push all mapped fields</option><option value='specific'>Push specific fields</option></select></label>{action === 'specific' && <div className='crmFieldPicker'>{['First Name', 'Last Name', 'Email', 'Company', 'Lifecycle Stage'].map((field) => <label key={field}><input type='checkbox' defaultChecked />{field}</label>)}</div>}</> }
function TaskStep() { return <><label className='phase2Field'>Task Subject<input defaultValue='Follow up with {{Person.FirstName}}' /></label><label className='phase2Field'>Due Date<select><option>Today</option><option>Tomorrow</option><option>3 business days</option><option>Custom date</option></select></label><label className='phase2Field'>Assign To<select><option>Person Owner</option><option>Account Owner</option><option>Specific User</option></select></label><label className='phase2Field'>Priority<select><option>Normal</option><option>High</option></select></label></> }
function AlertStep() { return <><label className='phase2Field'>Recipient<select><option>Assigned Owner</option><option>Account Owner</option><option>Specific User</option><option>Custom Email</option></select></label><label className='phase2Field'>Subject<input defaultValue='New MQL: {{Person.FullName}}' /></label><label className='phase2Field'>Message<textarea defaultValue='{{Person.FirstName}} from {{Person.Company}} has reached MQL status.' /></label><button type='button' className='button outline accent fullButton'>{'{{}}'} Insert Token</button></> }
function GenericStep({ step }: { step: FlowStep }) { return <><label className='phase2Field'>Step Summary<input defaultValue={step.summary} /></label><label className='phase2Field'>Notes<textarea placeholder='Optional internal notes' /></label></> }

function Phase2TokenPicker({ programTokens, onClose }: { programTokens: string[]; onClose: () => void }) {
  const [tab, setTab] = useState('program')
  const tokens: Record<string, string[]> = { program: programTokens, person: ['{{Person.FirstName}}', '{{Person.Company}}', '{{Person.Email}}', '{{Person.Score}}'], system: ['{{System.Date}}', '{{System.Year}}', '{{System.SenderName}}'], trigger: ['{{Trigger.FormName}}', '{{Trigger.ClickLink}}'] }
  return <div className='phase2TokenPicker'><header><strong>Insert Token</strong><button type='button' onClick={onClose}>×</button></header><nav>{[['program', 'Program Tokens'], ['person', 'Person Fields'], ['system', 'System Tokens'], ['trigger', 'Trigger Tokens']].map(([key, label]) => <button type='button' key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav><label><span>⌕</span><input placeholder='Search tokens…' /></label><div>{tokens[tab].map((token) => <button type='button' key={token} onClick={onClose}><code>{token}</code><span>＋</span></button>)}</div></div>
}

