import { useState } from 'react'
import { Modal } from '../../common/Modal'

const eventAssets = {
  Emails: [
    { name: 'Registration Confirmation', status: 'Approved', modified: 'Today' },
    { name: '24 Hour Reminder', status: 'Approved', modified: 'Yesterday' },
    { name: 'Thank You Email', status: 'Draft', modified: 'Jul 26' },
    { name: 'No Show Replay', status: 'Draft', modified: 'Jul 25' },
  ],
  'Landing Pages': [{ name: 'Webinar Registration', status: 'Published', modified: 'Jul 24' }],
  Forms: [{ name: 'Webinar Registration Form', status: 'Approved', modified: 'Jul 24' }],
}

const eventMembers = [
  { id: 1, name: 'Sophia Kim', email: 'sophia.kim@northlane.com', status: 'Attended', registered: 'Jul 18, 2026' },
  { id: 2, name: 'Noah Patel', email: 'noah.patel@brightscale.io', status: 'Registered', registered: 'Jul 19, 2026' },
  { id: 3, name: 'Elena Garcia', email: 'elena.garcia@hexametrics.com', status: 'Invited', registered: '—' },
  { id: 4, name: 'Arjun Rao', email: 'arjun.rao@finarc.io', status: 'No Show', registered: 'Jul 20, 2026' },
  { id: 5, name: 'Grace Walker', email: 'grace.walker@cloudforge.net', status: 'Cancelled', registered: 'Jul 21, 2026' },
  { id: 6, name: 'Marcus Lee', email: 'marcus.lee@quantum.io', status: 'Registered', registered: 'Jul 23, 2026' },
]

interface EventStep {
  id: number
  icon: string
  label: string
  summary: string
  branch?: 'yes' | 'no'
}

const defaultEventSteps: EventStep[] = [
  { id: 1, icon: '⚡', label: 'Registration Trigger', summary: 'Fills Out Webinar Registration Form' },
  { id: 2, icon: '⇄', label: 'Change Program Status', summary: 'Status → Registered' },
  { id: 3, icon: '◷', label: 'Wait Until Event Date', summary: '{{my.EventDate}} · 24 hours before' },
  { id: 4, icon: '✉', label: 'Send Email', summary: '24 Hour Reminder' },
  { id: 5, icon: '◷', label: 'Wait', summary: '1 hour after event ends' },
  { id: 6, icon: '◇', label: 'Decision', summary: 'Attended? CRM check-in or attendance data' },
  { id: 7, icon: '✓', label: 'Change Status', summary: 'Attended · Send Thank You', branch: 'yes' },
  { id: 8, icon: '×', label: 'Change Status', summary: 'No Show · Send Replay', branch: 'no' },
]

export function EventSetupTab({ channel }: { channel: string }) {
  const [waitlist, setWaitlist] = useState(true)
  const [saved, setSaved] = useState(true)
  const [eventName, setEventName] = useState('Revenue Leaders Webinar')
  const [startDate, setStartDate] = useState('2026-08-15T10:00')
  const [endDate, setEndDate] = useState('2026-08-15T11:30')
  const [capacity, setCapacity] = useState('500')
  const [venue, setVenue] = useState('Virtual Event · Zoom Webinar')
  const generatedTokens = [
    { name: 'EventName', value: eventName },
    { name: 'EventDate', value: startDate.split('T')[0] },
    { name: 'EventStartTime', value: startDate.split('T')[1] },
    { name: 'EventEndTime', value: endDate.split('T')[1] },
    { name: 'EventCapacity', value: capacity },
    { name: 'EventVenue', value: venue },
    { name: 'EventChannel', value: channel },
  ]
  const changed = () => setSaved(false)

  return <div className='eventSetupTab'><header><div><h3>Event Setup</h3><p>Configure event logistics. Every field is automatically available as a Program Token.</p></div><span className={saved ? 'saved' : 'unsaved'}>{saved ? '✓ All changes saved' : '• Unsaved changes'}</span></header><div className='eventSetupGrid'><section className='eventSetupForm'><header><span>□</span><div><strong>Event Details</strong><small>Required event information</small></div></header><label>Event Name<input value={eventName} onChange={(event) => { setEventName(event.target.value); changed() }} /></label><div className='eventDateGrid'><label>Start Date & Time<input type='datetime-local' value={startDate} onChange={(event) => { setStartDate(event.target.value); changed() }} /></label><label>End Date & Time<input type='datetime-local' value={endDate} onChange={(event) => { setEndDate(event.target.value); changed() }} /></label></div><label>Timezone<select onChange={changed}><option>America/Los_Angeles (PDT)</option><option>America/New_York (EDT)</option><option>Europe/London (BST)</option><option>Asia/Kolkata (IST)</option></select></label><div className='eventCapacityRow'><label>Capacity<input type='number' value={capacity} onChange={(event) => { setCapacity(event.target.value); changed() }} /></label><label className='eventWaitlistToggle'><span><strong>Enable Waitlist</strong><small>Automatically waitlist after capacity</small></span><input type='checkbox' className='toggleSwitch' checked={waitlist} onChange={(event) => { setWaitlist(event.target.checked); changed() }} /></label></div><label>Venue / Access Details<input value={venue} onChange={(event) => { setVenue(event.target.value); changed() }} /></label><label>Description<div className='eventRichToolbar'><button type='button'><b>B</b></button><button type='button'><i>I</i></button><button type='button'>☷</button><button type='button'>↗</button><button type='button'>{'{{}}'}</button></div><textarea defaultValue='Join revenue leaders for a practical session on orchestrating personalized B2B journeys and measuring pipeline impact.' onChange={changed} /></label><footer><button type='button' className='button solid' onClick={() => setSaved(true)}>Save Event Setup</button></footer></section><aside className='autoTokenPreview'><header><span>{'{{}}'}</span><div><strong>Auto-generated Tokens</strong><small>Updated from Event Setup</small></div></header><p>Use these tokens in emails, landing pages, forms, and Schedule steps.</p><div>{generatedTokens.map((token) => <div key={token.name}><code>{`{{my.${token.name}}}`}</code><span>{token.value || 'Not set'}</span><i>✓</i></div>)}</div><footer>Changes resolve automatically in asset previews.</footer></aside></div></div>
}

export function EventAssetsTab() {
  const [folder, setFolder] = useState<keyof typeof eventAssets>('Emails')
  const [createOpen, setCreateOpen] = useState(false)
  const [builderType, setBuilderType] = useState<string | null>(null)
  const folders: Array<{ name: keyof typeof eventAssets; icon: string }> = [{ name: 'Emails', icon: '✉' }, { name: 'Landing Pages', icon: '▤' }, { name: 'Forms', icon: '☷' }]
  return <div className='eventAssetsTab'><header><div><h3>Event Assets</h3><p>Local content created specifically for this Event Program.</p></div><div className='eventCreateAsset'><button type='button' className='button solid' onClick={() => setCreateOpen((value) => !value)}>＋ Create</button>{createOpen && <div><button type='button' onClick={() => setBuilderType('Email')}>✉ New Email</button><button type='button' onClick={() => setBuilderType('Landing Page')}>▤ New Landing Page</button><button type='button' onClick={() => setBuilderType('Form')}>☷ New Form</button></div>}</div></header><div className='eventAssetFolders'>{folders.map((item) => <button type='button' key={item.name} className={folder === item.name ? 'active' : ''} onClick={() => setFolder(item.name)}><span>{item.icon}</span><div><strong>{item.name}</strong><small>{eventAssets[item.name].length} local assets</small></div><i>›</i></button>)}</div><section className='eventAssetSubgrid'><header><div><span>{folders.find((item) => item.name === folder)?.icon}</span><div><strong>{folder}</strong><small>{eventAssets[folder].length} assets in this program</small></div></div><button type='button'>View as List</button></header><div>{eventAssets[folder].map((asset) => <article key={asset.name}><span className={`eventAssetPreview asset-${folder.toLowerCase().replace(' ', '-')}`}><i>{folders.find((item) => item.name === folder)?.icon}</i><b /></span><div><em>{asset.status}</em><h4>{asset.name}</h4><p>Modified {asset.modified}</p><footer><button type='button'>Edit</button><button type='button'>Preview</button><button type='button'>•••</button></footer></div></article>)}</div></section><EventScheduleSummary /><Modal title={`Create ${builderType}`} open={Boolean(builderType)} onClose={() => setBuilderType(null)}><div className='contentBuilderLaunchModal'><span>{builderType === 'Email' ? '✉' : builderType === 'Form' ? '☷' : '▤'}</span><h3>Open the {builderType} Builder?</h3><p>A new local {builderType?.toLowerCase()} will be created inside this Event Program with Event Tokens available automatically.</p><label>Asset Name<input autoFocus placeholder={`Untitled ${builderType}`} /></label><footer><button type='button' className='button ghost' onClick={() => setBuilderType(null)}>Cancel</button><button type='button' className='button solid' onClick={() => setBuilderType(null)}>Create & Open Builder</button></footer></div></Modal></div>
}

function EventScheduleSummary() {
  const summary = ['Registration Trigger', 'Wait Until Event Date', 'Reminder Email', 'Wait', 'Attendance Decision', 'Follow-up']
  return <section className='eventScheduleSummary'><header><div><span>⑂</span><div><strong>Program Schedule</strong><small>Read-only summary · Managed in the Schedule tab</small></div></div><button type='button'>Open Schedule →</button></header><div>{summary.map((step, index) => <div key={step}><span>{index + 1}</span><strong>{step}</strong>{index < summary.length - 1 && <i>→</i>}</div>)}</div></section>
}

export function EventMembersTab({ channel }: { channel: string }) {
  const [members, setMembers] = useState(eventMembers)
  const [selected, setSelected] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const filtered = statusFilter === 'All statuses' ? members : members.filter((member) => member.status === statusFilter)
  void channel
  function changeStatus(status: string) { setMembers((current) => current.map((member) => selected.includes(member.id) ? { ...member, status } : member)) }
  return <div className='eventMembersTab'><header><div><h3>Event Members</h3><p>Manage registration and attendance lifecycle statuses.</p></div><div><button type='button' className='button outline accent'>＋ Add Members</button><button type='button' className='button outline accent'>⚙ Manage Statuses</button></div></header><div className='phase3MemberFilters'><label><span>⌕</span><input placeholder='Search event members…' /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Invited</option><option>Registered</option><option>Attended</option><option>No Show</option><option>Cancelled</option></select><button type='button' className='button outline accent'>↓ Export</button></div><div className='phase3MembersTable eventTable'><div><span><input type='checkbox' checked={selected.length === filtered.length && filtered.length > 0} onChange={(event) => setSelected(event.target.checked ? filtered.map((member) => member.id) : [])} /></span><span>Name</span><span>Email</span><span>Status</span><span>Registration Date</span><span /></div>{filtered.map((member) => <div key={member.id}><span><input type='checkbox' checked={selected.includes(member.id)} onChange={() => setSelected((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} /></span><span><i>{member.name.split(' ').map((part) => part[0]).join('')}</i><strong>{member.name}</strong></span><span>{member.email}</span><span><em className={`event-status-${member.status.toLowerCase().replace(' ', '-')}`}>{member.status}</em></span><span>{member.registered}</span><button type='button'>•••</button></div>)}</div>{selected.length > 0 && <div className='phase3BulkBar'><strong>{selected.length} selected</strong><label>Change Status<select defaultValue='' onChange={(event) => changeStatus(event.target.value)}><option value='' disabled>Select status</option><option>Invited</option><option>Registered</option><option>Attended</option><option>No Show</option><option>Cancelled</option></select></label><button type='button'>✉ Send Email</button><button type='button'>↓ Export</button><button type='button' onClick={() => setSelected([])}>×</button></div>}</div>
}

export function EventScheduleTab() {
  const [steps, setSteps] = useState(defaultEventSteps)
  const [view, setView] = useState<'steps' | 'visual'>('steps')
  const [addOpen, setAddOpen] = useState(false)
  const [nextId, setNextId] = useState(9)
  const stepOptions = [{ icon: '✉', label: 'Send Email' }, { icon: '◷', label: 'Wait' }, { icon: '⇄', label: 'Change Status' }, { icon: '◇', label: 'Decision' }, { icon: '↗', label: 'Call Webhook' }]
  function addStep(option: { icon: string; label: string }) { setSteps((current) => [...current, { id: nextId, icon: option.icon, label: option.label, summary: 'Configure this step' }]); setNextId((value) => value + 1); setAddOpen(false) }
  return <div className='eventScheduleTab'><header><div><h3>Event Automation</h3><p>Registration, reminders, attendance decisions, and follow-up in one editable flow.</p></div><button type='button' className='visualFlowToggle' onClick={() => setView((current) => current === 'steps' ? 'visual' : 'steps')}><span>{view === 'steps' ? '⑂' : '☷'}</span>{view === 'steps' ? 'Visual Canvas' : 'Step List'}</button></header>{view === 'steps' ? <div className='eventStepList'>{steps.map((step, index) => <div className={`eventAutomationStep ${step.branch ? `branch-${step.branch}` : ''}`} key={step.id}><span className='sixDotHandle'>⠿</span><span className='eventStepIcon'>{step.icon}</span><div><strong>{step.label}</strong><p>{step.summary}</p></div>{step.branch && <em>{step.branch === 'yes' ? 'YES · ATTENDED' : 'NO · NO SHOW'}</em>}<div><button type='button'>↑</button><button type='button'>↓</button><button type='button'>✎</button><button type='button' onClick={() => setSteps((current) => current.filter((item) => item.id !== step.id))}>×</button></div>{index < steps.length - 1 && !step.branch && <i className='eventStepLine' />}</div>)}<div className='eventAddStep'><button type='button' className='button outline accent' onClick={() => setAddOpen((value) => !value)}>＋ Add Step</button>{addOpen && <div>{stepOptions.map((option) => <button type='button' key={option.label} onClick={() => addStep(option)}><span>{option.icon}</span>{option.label}</button>)}</div>}</div></div> : <EventVisualCanvas steps={steps} />}</div>
}

function EventVisualCanvas({ steps }: { steps: EventStep[] }) {
  return <div className='eventVisualCanvas'><div className='eventVisualControls'><button type='button'>−</button><span>100%</span><button type='button'>＋</button><button type='button'>⌗</button></div><div className='eventVisualInner'>{steps.filter((step) => !step.branch).map((step) => <div key={step.id}><button type='button'><span>{step.icon}</span><div><strong>{step.label}</strong><small>{step.summary}</small></div><em>•••</em></button>{step.label === 'Decision' ? <div className='eventDecisionBranches'><span>YES</span><span>NO</span>{steps.filter((item) => item.branch).map((branch) => <button type='button' key={branch.id} className={branch.branch}><i>{branch.icon}</i><div><strong>{branch.label}</strong><small>{branch.summary}</small></div></button>)}</div> : <i />}</div>)}</div><div className='visualMinimap'><i /><i /><i /><i /><span /></div></div>
}
