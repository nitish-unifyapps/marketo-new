import { useState } from 'react'
import { Modal } from '../../common/Modal'

interface ProgramToken {
  id: number
  name: string
  type: string
  value: string
}

const localAssets = [
  { id: 1, name: 'Executive Outreach', type: 'Email', status: 'Approved', modified: 'Today, 9:42 AM', tone: 'warm' },
  { id: 2, name: 'ABM Account Experience', type: 'Landing Page', status: 'Published', modified: 'Yesterday', tone: 'blue' },
  { id: 3, name: 'Executive Contact Form', type: 'Form', status: 'Draft', modified: 'Jul 25, 2026', tone: 'green' },
  { id: 4, name: 'Customer Proof Points', type: 'Email', status: 'Draft', modified: 'Jul 23, 2026', tone: 'violet' },
]

const defaultMembers = [
  { id: 1, name: 'Sophia Kim', email: 'sophia.kim@northlane.com', status: 'Engaged', activity: 'Opened Executive Outreach · 2h ago' },
  { id: 2, name: 'Noah Patel', email: 'noah.patel@brightscale.io', status: 'Invited', activity: 'Added manually · Yesterday' },
  { id: 3, name: 'Elena Garcia', email: 'elena.garcia@hexametrics.com', status: 'Responded', activity: 'Submitted contact form · Jul 25' },
  { id: 4, name: 'Arjun Rao', email: 'arjun.rao@finarc.io', status: 'Member', activity: 'Status changed · Jul 24' },
  { id: 5, name: 'Grace Walker', email: 'grace.walker@cloudforge.net', status: 'Invited', activity: 'Added manually · Jul 22' },
]

export function DefaultProgramOverview({ name, onNameChange }: { name: string; onNameChange: (name: string) => void }) {
  const [description, setDescription] = useState('Account-based marketing program for high-priority enterprise opportunities.')
  const [tokens, setTokens] = useState<ProgramToken[]>([
    { id: 1, name: 'OfferName', type: 'Text', value: 'Enterprise Growth Workshop' },
    { id: 2, name: 'SalesRegion', type: 'Text', value: 'North America' },
    { id: 3, name: 'ExpiryDate', type: 'Date', value: '2026-09-30' },
  ])
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<ProgramToken | null>(null)

  function saveToken(token: ProgramToken) {
    setTokens((current) => editingToken ? current.map((item) => item.id === token.id ? token : item) : [...current, { ...token, id: Math.max(0, ...current.map((item) => item.id)) + 1 }])
    setTokenModalOpen(false)
    setEditingToken(null)
  }

  return <div className='defaultOverview'><section className='defaultOverviewFields'><header><span>✣</span><div><h3>Program Information</h3><p>Maintain the core details for this manual program.</p></div></header><label>Program Name<input value={name} onChange={(event) => onNameChange(event.target.value)} /></label><label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className='defaultMetadata'><div><span>Program Type</span><strong>Default Program</strong></div><div><span>Created</span><strong>Jul 18, 2026</strong></div><div><span>Program ID</span><strong>PRG-10482</strong></div></div><button type='button' className='button solid'>Save Changes</button></section><section className='defaultTokenCard'><header><div><span>{'{{}}'}</span><div><h3>Program Tokens</h3><p>Reusable values available to local assets.</p></div></div><button type='button' className='button outline accent' onClick={() => { setEditingToken(null); setTokenModalOpen(true) }}>＋ Add Token</button></header><div className='defaultTokenTable'><div><span>Name</span><span>Type</span><span>Default Value</span><span /></div>{tokens.map((token) => <div key={token.id}><code>{`{{my.${token.name}}}`}</code><span>{token.type}</span><span>{token.value || '—'}</span><span><button type='button' onClick={() => { setEditingToken(token); setTokenModalOpen(true) }}>✎</button><button type='button' onClick={() => setTokens((current) => current.filter((item) => item.id !== token.id))}>×</button></span></div>)}</div><footer><span>Tokens are scoped to this program.</span><button type='button'>View Token Usage ↗</button></footer></section>{tokenModalOpen && <DefaultTokenModal token={editingToken} onClose={() => setTokenModalOpen(false)} onSave={saveToken} />}</div>
}

function DefaultTokenModal({ token, onClose, onSave }: { token: ProgramToken | null; onClose: () => void; onSave: (token: ProgramToken) => void }) {
  const [name, setName] = useState(token?.name ?? '')
  const [type, setType] = useState(token?.type ?? 'Text')
  const [value, setValue] = useState(token?.value ?? '')
  return <Modal title={token ? 'Edit Program Token' : 'Add Program Token'} open onClose={onClose}><div className='defaultTokenModal'><label>Token Name<input autoFocus value={name} onChange={(event) => setName(event.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} /></label><div><span>Reference</span><code>{`{{my.${name || 'TokenName'}}}`}</code></div><label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option>Text</option><option>Number</option><option>Date</option><option>Boolean</option><option>URL</option></select></label><label>Default Value<input type={type === 'Date' ? 'date' : type === 'Number' ? 'number' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} /></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name} onClick={() => onSave({ id: token?.id ?? Date.now(), name, type, value })}>Save Token</button></footer></div></Modal>
}

export function DefaultProgramAssets() {
  const [createOpen, setCreateOpen] = useState(false)
  return <div className='defaultAssetsView'><header><div><h3>Local Assets</h3><p>Content available only within this program.</p></div><div><label><span>⌕</span><input placeholder='Search assets…' /></label><div className='defaultAssetCreate'><button type='button' className='button solid' onClick={() => setCreateOpen((value) => !value)}>＋ Create Local Asset</button>{createOpen && <div><button type='button'>✉ Email</button><button type='button'>▤ Landing Page</button><button type='button'>☷ Form</button></div>}</div></div></header><div className='defaultAssetGrid'>{localAssets.map((asset) => <article key={asset.id}><span className={`defaultAssetThumb tone-${asset.tone}`}><i>{asset.type === 'Email' ? '✉' : asset.type === 'Form' ? '☷' : '▤'}</i><b /></span><div><small>{asset.type}</small><h4>{asset.name}</h4><p>Modified {asset.modified}</p><footer><em className={`asset-${asset.status.toLowerCase()}`}>{asset.status}</em><button type='button'>•••</button></footer></div></article>)}</div></div>
}

export function DefaultProgramMembers() {
  const [members, setMembers] = useState(defaultMembers)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [status, setStatus] = useState('All statuses')
  const filtered = status === 'All statuses' ? members : members.filter((member) => member.status === status)

  function changeStatus(nextStatus: string) {
    setMembers((current) => current.map((member) => selectedIds.includes(member.id) ? { ...member, status: nextStatus } : member))
  }

  return <div className='defaultMembersView'><header><div><h3>Program Members</h3><p>Manage people and custom membership statuses manually.</p></div><div><button type='button' className='button outline accent'>＋ Add Members</button><button type='button' className='button outline accent'>⚙ Manage Statuses</button></div></header><div className='defaultMembersToolbar'><label><span>⌕</span><input placeholder='Search members…' /></label><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Member</option><option>Invited</option><option>Engaged</option><option>Responded</option></select><button type='button' className='button outline accent'>↓ Export</button></div><div className='defaultMembersTable'><div><span><input type='checkbox' checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={(event) => setSelectedIds(event.target.checked ? filtered.map((member) => member.id) : [])} /></span><span>Name</span><span>Email</span><span>Status</span><span>Last Activity</span><span /></div>{filtered.map((member) => <div key={member.id}><span><input type='checkbox' checked={selectedIds.includes(member.id)} onChange={() => setSelectedIds((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} /></span><span><i>{member.name.split(' ').map((part) => part[0]).join('')}</i><strong>{member.name}</strong></span><span>{member.email}</span><span><em>{member.status}</em></span><span>{member.activity}</span><button type='button'>•••</button></div>)}</div>{selectedIds.length > 0 && <div className='defaultMemberBulkBar'><strong>{selectedIds.length} selected</strong><label>Change Status<select defaultValue='' onChange={(event) => changeStatus(event.target.value)}><option value='' disabled>Select status</option><option>Member</option><option>Invited</option><option>Engaged</option><option>Responded</option></select></label><button type='button'>✉ Send Email</button><button type='button'>↓ Export</button><button type='button' onClick={() => setSelectedIds([])}>×</button></div>}</div>
}
