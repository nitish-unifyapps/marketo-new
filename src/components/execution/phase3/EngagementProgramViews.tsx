import { useState, type DragEvent } from 'react'
import { Modal } from '../../common/Modal'

interface StreamEmail {
  id: string
  name: string
  status: 'Approved' | 'Draft'
  source: 'Local' | 'Global'
}

interface EngagementStream {
  id: string
  name: string
  cadence: string
  emails: StreamEmail[]
}

const initialStreams: EngagementStream[] = [
  { id: 'stream-1', name: 'Welcome & Education', cadence: 'Every 7 days · Tuesday · 10:00 AM', emails: [
    { id: 'email-1', name: 'Welcome to Marketo Next', status: 'Approved', source: 'Local' },
    { id: 'email-2', name: 'Build Your First Journey', status: 'Approved', source: 'Global' },
    { id: 'email-3', name: 'Customer Success Story', status: 'Draft', source: 'Local' },
  ] },
  { id: 'stream-2', name: 'Product Value', cadence: 'Every 10 days · Thursday · 10:00 AM', emails: [
    { id: 'email-4', name: 'Unified Profile Deep Dive', status: 'Approved', source: 'Global' },
    { id: 'email-5', name: 'Revenue Attribution Guide', status: 'Approved', source: 'Local' },
  ] },
  { id: 'stream-3', name: 'Conversion', cadence: 'Every 14 days · Wednesday · 11:00 AM', emails: [
    { id: 'email-6', name: 'Your Personalized Demo', status: 'Approved', source: 'Local' },
    { id: 'email-7', name: 'Talk to a Revenue Expert', status: 'Draft', source: 'Global' },
  ] },
]

const engagementEmails: StreamEmail[] = [
  { id: 'available-1', name: 'Executive Guide to Automation', status: 'Approved', source: 'Global' },
  { id: 'available-2', name: 'Pipeline Benchmarks 2026', status: 'Approved', source: 'Local' },
  { id: 'available-3', name: 'Customer Story — FinArc', status: 'Approved', source: 'Global' },
  { id: 'available-4', name: 'Product Tour Invitation', status: 'Draft', source: 'Local' },
  { id: 'available-5', name: 'Integration Marketplace', status: 'Approved', source: 'Global' },
  { id: 'available-6', name: 'Re-engagement Offer', status: 'Draft', source: 'Local' },
]

const engagementMembers = [
  { id: 1, name: 'Sophia Kim', email: 'sophia.kim@northlane.com', stream: 'Product Value', status: 'Normal', activity: 'Clicked Revenue Attribution Guide · 2h ago' },
  { id: 2, name: 'Noah Patel', email: 'noah.patel@brightscale.io', stream: 'Conversion', status: 'Normal', activity: 'Received Your Personalized Demo · Yesterday' },
  { id: 3, name: 'Elena Garcia', email: 'elena.garcia@hexametrics.com', stream: 'Welcome & Education', status: 'Paused', activity: 'Paused manually · Jul 25' },
  { id: 4, name: 'Arjun Rao', email: 'arjun.rao@finarc.io', stream: 'Conversion', status: 'Exhausted', activity: 'Exhausted all content · Jul 24' },
  { id: 5, name: 'Grace Walker', email: 'grace.walker@cloudforge.net', stream: 'Product Value', status: 'Normal', activity: 'Opened Unified Profile Deep Dive · Jul 24' },
  { id: 6, name: 'Marcus Lee', email: 'marcus.lee@quantum.io', stream: 'Welcome & Education', status: 'Normal', activity: 'Entered program · Jul 23' },
]

export function EngagementStreamsTab() {
  const [streams, setStreams] = useState(initialStreams)
  const [dragged, setDragged] = useState<{ emailId: string; streamId: string } | null>(null)
  const [dropStream, setDropStream] = useState<string | null>(null)
  const [cadenceStream, setCadenceStream] = useState<EngagementStream | null>(null)
  const [transitionIndex, setTransitionIndex] = useState<number | null>(null)

  function moveEmail(targetStreamId: string) {
    if (!dragged) return
    let email: StreamEmail | undefined
    const without = streams.map((stream) => ({ ...stream, emails: stream.emails.filter((item) => { if (item.id === dragged.emailId) { email = item; return false } return true }) }))
    if (email) setStreams(without.map((stream) => stream.id === targetStreamId ? { ...stream, emails: [...stream.emails, email!] } : stream))
    setDragged(null)
    setDropStream(null)
  }

  function reorderEmail(streamId: string, emailId: string, direction: -1 | 1) {
    setStreams((current) => current.map((stream) => {
      if (stream.id !== streamId) return stream
      const index = stream.emails.findIndex((email) => email.id === emailId)
      const destination = index + direction
      if (destination < 0 || destination >= stream.emails.length) return stream
      const emails = [...stream.emails]
      const [email] = emails.splice(index, 1)
      emails.splice(destination, 0, email)
      return { ...stream, emails }
    }))
  }

  return <div className='engagementStreamsTab'><header><div><h3>Engagement Streams</h3><p>Sequence content by stream and control how people transition through the nurture journey.</p></div><button type='button' className='button outline accent'>＋ Add Stream</button></header><div className='streamsBoard'>{streams.map((stream, index) => <div className='streamColumnWrap' key={stream.id}>{index > 0 && <button type='button' className='transitionArrow' title='Edit transition rules' onClick={() => setTransitionIndex(index - 1)}>→</button>}<section className={`engagementStream ${dropStream === stream.id ? 'dropTarget' : ''}`} onDragOver={(event) => { event.preventDefault(); setDropStream(stream.id) }} onDragLeave={() => setDropStream(null)} onDrop={(event) => { event.preventDefault(); moveEmail(stream.id) }}><header><div><span>{index + 1}</span><input value={stream.name} onChange={(event) => setStreams((current) => current.map((item) => item.id === stream.id ? { ...item, name: event.target.value } : item))} /></div><button type='button'>•••</button><button type='button' className='streamCadence' onClick={() => setCadenceStream(stream)}>◷ {stream.cadence}</button></header><div className='streamEmailList'>{stream.emails.map((email, emailIndex) => <article draggable key={email.id} onDragStart={(event: DragEvent) => { event.dataTransfer.effectAllowed = 'move'; setDragged({ emailId: email.id, streamId: stream.id }) }}><span className='streamDrag'>⠿</span><span className='streamEmailIcon'>✉</span><div><strong>{email.name}</strong><small>{email.source} · {email.status}</small></div><em>{emailIndex + 1}</em><div><button type='button' onClick={() => reorderEmail(stream.id, email.id, -1)}>↑</button><button type='button' onClick={() => reorderEmail(stream.id, email.id, 1)}>↓</button><button type='button'>✎</button><button type='button' onClick={() => setStreams((current) => current.map((item) => item.id === stream.id ? { ...item, emails: item.emails.filter((mail) => mail.id !== email.id) } : item))}>×</button></div></article>)}<div className='streamDropZone'><span>＋</span>Drop email here</div></div><footer><span>{stream.emails.length} emails</span><span>{stream.emails.filter((email) => email.status === 'Approved').length} approved</span></footer></section></div>)}</div>{transitionIndex !== null && <TransitionRulesPopover from={streams[transitionIndex]} to={streams[transitionIndex + 1]} onClose={() => setTransitionIndex(null)} />}{cadenceStream && <CadenceModal stream={cadenceStream} onClose={() => setCadenceStream(null)} onSave={(cadence) => { setStreams((current) => current.map((stream) => stream.id === cadenceStream.id ? { ...stream, cadence } : stream)); setCadenceStream(null) }} />}</div>
}

function TransitionRulesPopover({ from, to, onClose }: { from: EngagementStream; to: EngagementStream; onClose: () => void }) {
  return <div className='transitionRulesPopover'><header><div><span>→</span><div><strong>Transition Rules</strong><small>{from.name} → {to.name}</small></div></div><button type='button' onClick={onClose}>×</button></header><p>Move people to the next stream when these conditions are met.</p><div className='transitionCondition'><select><option>Clicks Link in Email</option><option>Opens Email</option><option>Person Score</option><option>Program Status</option></select><select><option>is any</option><option>is</option><option>greater than</option></select><input placeholder='Select value' /><button type='button'>×</button></div><button type='button' className='addTransitionRule'>＋ Add Condition</button><label className='phase2ToggleRow'><span><strong>Require all conditions</strong><small>Use AND logic between conditions</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={onClose}>Save Rules</button></footer></div>
}

function CadenceModal({ stream, onClose, onSave }: { stream: EngagementStream; onClose: () => void; onSave: (cadence: string) => void }) {
  const [frequency, setFrequency] = useState('7')
  const [day, setDay] = useState('Tuesday')
  const [time, setTime] = useState('10:00')
  return <Modal title='Edit Stream Cadence' open onClose={onClose}><div className='cadenceModal'><div className='cadenceStreamName'><span>◷</span><div><strong>{stream.name}</strong><small>Configure when the next email is sent.</small></div></div><div className='cadenceFields'><label>Send every<input type='number' min='1' value={frequency} onChange={(event) => setFrequency(event.target.value)} /></label><label>Unit<select><option>Days</option><option>Weeks</option></select></label><label>Preferred day<select value={day} onChange={(event) => setDay(event.target.value)}><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option></select></label><label>Send time<input type='time' value={time} onChange={(event) => setTime(event.target.value)} /></label></div><label className='phase2ToggleRow'><span><strong>Use person timezone</strong><small>Deliver at the selected local time for each person</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={() => onSave(`Every ${frequency} days · ${day} · ${time}`)}>Save Cadence</button></footer></div></Modal>
}

export function EngagementContentTab() {
  const [filter, setFilter] = useState<'all' | 'local'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const visible = filter === 'all' ? engagementEmails : engagementEmails.filter((email) => email.source === 'Local')
  return <div className='engagementContentTab'><header><div><h3>Available Content</h3><p>Drag approved local or global emails into an Engagement Stream.</p></div><div><div className='engagementFilterToggle'><button type='button' className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button><button type='button' className={filter === 'local' ? 'active' : ''} onClick={() => setFilter('local')}>Local only</button></div><button type='button' className='button solid' onClick={() => setCreateOpen(true)}>＋ Create Email</button></div></header><div className='engagementEmailGrid'>{visible.map((email) => <article draggable key={email.id}><span className={`engagementEmailPreview source-${email.source.toLowerCase()}`}><i /><b /><i /></span><div><em>{email.source}</em><h4>{email.name}</h4><p>{email.status} · Modified recently</p><footer><button type='button'>Preview</button><button type='button'>＋ Add to Stream</button></footer></div></article>)}</div><Modal title='Create Local Email' open={createOpen} onClose={() => setCreateOpen(false)}><div className='contentBuilderLaunchModal'><span>✉</span><h3>Open the Email Builder?</h3><p>The new email will be local to this Engagement Program and available in all streams.</p><label>Email Name<input autoFocus placeholder='Untitled Engagement Email' /></label><footer><button type='button' className='button ghost' onClick={() => setCreateOpen(false)}>Cancel</button><button type='button' className='button solid' onClick={() => setCreateOpen(false)}>Create & Open Builder</button></footer></div></Modal></div>
}

export function EngagementMembersTab() {
  const [members, setMembers] = useState(engagementMembers)
  const [selected, setSelected] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [streamFilter, setStreamFilter] = useState('All streams')
  const [detailMember, setDetailMember] = useState<typeof engagementMembers[number] | null>(null)
  const filtered = members.filter((member) => (statusFilter === 'All statuses' || member.status === statusFilter) && (streamFilter === 'All streams' || member.stream === streamFilter))
  function updateSelected(updates: Partial<typeof engagementMembers[number]>) { setMembers((current) => current.map((member) => selected.includes(member.id) ? { ...member, ...updates } : member)) }
  return <div className='engagementMembersTab'><header><div><h3>Engagement Members</h3><p>Manage stream position and person-level nurture status.</p></div><button type='button' className='button outline accent'>＋ Add Members</button></header><div className='phase3MemberFilters engagementFilters'><label><span>⌕</span><input placeholder='Search people…' /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Normal</option><option>Paused</option><option>Exhausted</option></select><select value={streamFilter} onChange={(event) => setStreamFilter(event.target.value)}><option>All streams</option>{initialStreams.map((stream) => <option key={stream.id}>{stream.name}</option>)}</select><button type='button' className='button outline accent'>↓ Export</button></div><div className='phase3MembersTable engagementTable'><div><span><input type='checkbox' checked={selected.length === filtered.length && filtered.length > 0} onChange={(event) => setSelected(event.target.checked ? filtered.map((member) => member.id) : [])} /></span><span>Name</span><span>Email</span><span>Current Stream</span><span>Status</span><span>Last Activity</span><span /></div>{filtered.map((member) => <div key={member.id} onClick={() => setDetailMember(member)}><span onClick={(event) => event.stopPropagation()}><input type='checkbox' checked={selected.includes(member.id)} onChange={() => setSelected((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} /></span><span><i>{member.name.split(' ').map((part) => part[0]).join('')}</i><strong>{member.name}</strong></span><span>{member.email}</span><span><em className='streamPill'>{member.stream}</em></span><span><em className={`engagement-status-${member.status.toLowerCase()}`}>{member.status}</em></span><span>{member.activity}</span><button type='button'>›</button></div>)}</div>{selected.length > 0 && <div className='phase3BulkBar engagementBulk'><strong>{selected.length} selected</strong><button type='button' onClick={() => updateSelected({ status: 'Paused' })}>Ⅱ Pause</button><button type='button' onClick={() => updateSelected({ status: 'Normal' })}>▶ Resume</button><label>Move to<select defaultValue='' onChange={(event) => updateSelected({ stream: event.target.value })}><option value='' disabled>Choose stream</option>{initialStreams.map((stream) => <option key={stream.id}>{stream.name}</option>)}</select></label><button type='button' className='danger'>× Remove</button><button type='button'>↓ Export</button><button type='button' onClick={() => setSelected([])}>×</button></div>}{detailMember && <EngagementMemberDetail member={detailMember} onClose={() => setDetailMember(null)} onStatus={(status) => { setMembers((current) => current.map((member) => member.id === detailMember.id ? { ...member, status } : member)); setDetailMember({ ...detailMember, status }) }} />}</div>
}

function EngagementMemberDetail({ member, onClose, onStatus }: { member: typeof engagementMembers[number]; onClose: () => void; onStatus: (status: string) => void }) {
  const history = [{ icon: '✉', title: 'Received Revenue Attribution Guide', time: 'Today, 10:00 AM' }, { icon: '↗', title: 'Clicked “View the Guide”', time: 'Today, 10:18 AM' }, { icon: '→', title: `Transitioned to ${member.stream}`, time: 'Yesterday, 4:32 PM' }, { icon: '✉', title: 'Opened Unified Profile Deep Dive', time: 'Jul 24, 2026' }]
  return <><div className='memberDetailScrim' onClick={onClose} /><aside className='engagementMemberDetail'><header><div className='detailAvatar'>{member.name.split(' ').map((part) => part[0]).join('')}</div><div><strong>{member.name}</strong><small>{member.email}</small></div><button type='button' onClick={onClose}>×</button></header><div className='memberDetailBody'><section className='memberEngagementSummary'><div><span>Status</span><strong className={`engagement-status-${member.status.toLowerCase()}`}>{member.status}</strong></div><div><span>Current Stream</span><strong>{member.stream}</strong></div><div><span>Last Activity</span><strong>{member.activity}</strong></div></section><div className='memberDetailActions'><button type='button' className='button outline accent' onClick={() => onStatus(member.status === 'Paused' ? 'Normal' : 'Paused')}>{member.status === 'Paused' ? '▶ Resume' : 'Ⅱ Pause'}</button><button type='button' className='button outline accent'>Move Stream</button></div><section className='engagementHistory'><h4>Engagement History</h4>{history.map((item, index) => <div key={item.title}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.time}</small></div>{index < history.length - 1 && <i />}</div>)}</section></div></aside></>
}

export function EngagementSettingsTab({ programName, onProgramNameChange }: { programName: string; onProgramNameChange: (name: string) => void }) {
  const [tokens, setTokens] = useState([{ id: 1, name: 'NurtureName', type: 'Text', value: 'Enterprise Demo Nurture' }, { id: 2, name: 'CadenceDays', type: 'Number', value: '7' }, { id: 3, name: 'OwnerSignature', type: 'Text', value: 'Maya Chen' }])
  return <div className='engagementSettingsTab'><header><h3>Engagement Program Settings</h3><p>Control cadence limits, exclusions, and reusable Program Tokens.</p></header><div className='engagementSettingsGrid'><section><header><span>⚙</span><div><strong>General</strong><small>Program identity and behavior</small></div></header><label>Program Name<input value={programName} onChange={(event) => onProgramNameChange(event.target.value)} /></label><label>Description<textarea defaultValue='Continuous nurture for enterprise prospects who request a demo.' /></label><label>Exclusion Smart List<select><option>Global Suppression List</option><option>Customers and Competitors</option><option>None</option></select></label><label className='phase2ToggleRow'><span><strong>Pause on person engagement</strong><small>Pause cadence after a reply or high-value conversion</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></section><section><header><span>✉</span><div><strong>Communication Limits</strong><small>Maximum nurture emails per person</small></div></header><div className='communicationLimitGrid'><label>Maximum per day<input type='number' defaultValue='1' /></label><label>Maximum per week<input type='number' defaultValue='2' /></label></div><label className='phase2ToggleRow'><span><strong>Respect global communication limits</strong><small>Skip a send when the person reached their global limit</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label className='phase2ToggleRow'><span><strong>Pause exhausted members</strong><small>Set status to Exhausted after all stream content is sent</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></section><section className='engagementTokensCard'><header><span>{'{{}}'}</span><div><strong>Program Tokens</strong><small>Available in every stream email</small></div><button type='button' onClick={() => setTokens((current) => [...current, { id: Math.max(...current.map((token) => token.id)) + 1, name: 'NewToken', type: 'Text', value: '' }])}>＋ Add Token</button></header><div><div><span>Name</span><span>Type</span><span>Default Value</span><span /></div>{tokens.map((token) => <div key={token.id}><code>{`{{my.${token.name}}}`}</code><span>{token.type}</span><input value={token.value} onChange={(event) => setTokens((current) => current.map((item) => item.id === token.id ? { ...item, value: event.target.value } : item))} /><button type='button' onClick={() => setTokens((current) => current.filter((item) => item.id !== token.id))}>×</button></div>)}</div></section></div><footer><button type='button' className='button solid'>Save Engagement Settings</button></footer></div>
}
