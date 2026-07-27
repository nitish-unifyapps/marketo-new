import { useMemo, useState } from 'react'
import type { PersonRecord } from '../../types/crm'

interface SmartListEditorPageProps {
  initialName: string
  description: string
  rows: PersonRecord[]
  onCancel: () => void
  onSave: (name: string, description: string, memberCount: number) => void
}

interface SmartListCondition {
  id: number
  field: 'Lifecycle Stage' | 'Person Score' | 'Company' | 'Owner' | 'Job Title' | 'Country'
  operator: 'is' | 'is not' | 'contains' | 'greater than' | 'less than'
  value: string
}

const filterGroups = [
  { name: 'Person Attributes', icon: '♙', items: ['Lifecycle Stage', 'Person Score', 'Job Title', 'Country'] },
  { name: 'Account Attributes', icon: '▣', items: ['Company', 'Industry', 'Revenue'] },
  { name: 'Activity History', icon: '◷', items: ['Opened Email', 'Clicked Link', 'Filled Out Form', 'Visited Web Page'] },
  { name: 'Program Membership', icon: '✣', items: ['Member of Program', 'Program Status', 'Success'] },
  { name: 'Smart List Membership', icon: '☷', items: ['Member of Smart List', 'Not Member of Smart List'] },
]

function conditionMatches(person: PersonRecord, condition: SmartListCondition) {
  const source = condition.field === 'Lifecycle Stage' ? person.lifecycleStage : condition.field === 'Person Score' ? person.score : condition.field === 'Company' ? person.company : condition.field === 'Owner' ? person.owner : condition.field === 'Job Title' ? person.title : person.location
  if (!condition.value) return true
  const sourceValue = String(source).toLowerCase()
  const targetValue = condition.value.toLowerCase()
  if (condition.operator === 'is') return sourceValue === targetValue
  if (condition.operator === 'is not') return sourceValue !== targetValue
  if (condition.operator === 'contains') return sourceValue.includes(targetValue)
  if (condition.operator === 'greater than') return Number(source) > Number(condition.value)
  return Number(source) < Number(condition.value)
}

export function SmartListEditorPage({ initialName, description, rows, onCancel, onSave }: SmartListEditorPageProps) {
  const [name, setName] = useState(initialName)
  const [activeTab, setActiveTab] = useState<'smart-list' | 'preview'>('smart-list')
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [conditions, setConditions] = useState<SmartListCondition[]>([
    { id: 1, field: 'Lifecycle Stage', operator: 'is', value: 'MQL' },
  ])
  const [nextId, setNextId] = useState(2)
  const [expandedGroups, setExpandedGroups] = useState(() => new Set(['Person Attributes', 'Activity History']))
  const [previewed, setPreviewed] = useState(false)

  const previewRows = useMemo(() => rows.filter((person) => logic === 'AND' ? conditions.every((condition) => conditionMatches(person, condition)) : conditions.some((condition) => conditionMatches(person, condition))), [conditions, logic, rows])

  function addCondition(field: SmartListCondition['field'] = 'Lifecycle Stage') {
    setConditions((current) => [...current, { id: nextId, field, operator: 'is', value: '' }])
    setNextId((value) => value + 1)
  }

  function updateCondition(id: number, updates: Partial<SmartListCondition>) {
    setConditions((current) => current.map((condition) => condition.id === id ? { ...condition, ...updates } : condition))
  }

  function previewMembers() {
    setPreviewed(true)
    setActiveTab('preview')
  }

  return <section className='crmSmartListEditor'>
    <header className='smartListEditorPageHeader'><div className='smartListEditorIdentity'><button type='button' onClick={onCancel}>←</button><div><span>Segments / Smart Lists</span><input value={name} onChange={(event) => setName(event.target.value)} aria-label='Smart List name' /></div><em>Draft</em></div><div><button type='button' className='button outline accent' onClick={onCancel}>Cancel</button><button type='button' className='button outline accent' onClick={previewMembers}>Preview Members</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onSave(name.trim(), description, previewRows.length)}>Save & Close</button></div></header>
    <nav className='smartListEditorTabs'><button type='button' className={activeTab === 'smart-list' ? 'active' : ''} onClick={() => setActiveTab('smart-list')}>Smart List</button><button type='button' className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Preview Members <span>{previewRows.length}</span></button></nav>
    {activeTab === 'smart-list' ? <div className='crmSmartListWorkspace'><aside className='crmFilterLibrary'><header><strong>Filters</strong><small>Drag or click a filter to add it</small></header><label><span>⌕</span><input placeholder='Search filters…' /></label><div>{filterGroups.map((group) => <section key={group.name}><button type='button' onClick={() => setExpandedGroups((current) => { const next = new Set(current); if (next.has(group.name)) next.delete(group.name); else next.add(group.name); return next })}><span>{group.icon}</span><strong>{group.name}</strong><i>{expandedGroups.has(group.name) ? '⌄' : '›'}</i></button>{expandedGroups.has(group.name) && group.items.map((item) => <button type='button' draggable className='crmFilterLibraryItem' key={item} onClick={() => { if (['Lifecycle Stage', 'Person Score', 'Company', 'Owner', 'Job Title', 'Country'].includes(item)) addCondition(item as SmartListCondition['field']) }}><span>⋮⋮</span>{item}<b>＋</b></button>)}</section>)}</div></aside><main className='crmSmartListCanvas'><header><div><span>☷</span><div><strong>Smart List Rules</strong><small>{conditions.length} active conditions</small></div></div><div><button type='button' className={logic === 'AND' ? 'active' : ''} onClick={() => setLogic('AND')}>AND</button><button type='button' className={logic === 'OR' ? 'active' : ''} onClick={() => setLogic('OR')}>OR</button></div></header><div className='crmSmartListConditions'>{conditions.map((condition, index) => <div key={condition.id}><span>{index + 1}</span><em>{index === 0 ? 'WHERE' : logic}</em><select value={condition.field} onChange={(event) => updateCondition(condition.id, { field: event.target.value as SmartListCondition['field'], value: '' })}><option>Lifecycle Stage</option><option>Person Score</option><option>Company</option><option>Owner</option><option>Job Title</option><option>Country</option></select><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value as SmartListCondition['operator'] })}><option>is</option><option>is not</option><option>contains</option><option>greater than</option><option>less than</option></select>{condition.field === 'Lifecycle Stage' ? <select value={condition.value} onChange={(event) => updateCondition(condition.id, { value: event.target.value })}><option value=''>Select stage</option><option>Lead</option><option>MQL</option><option>SQL</option><option>Customer</option></select> : <input type={condition.field === 'Person Score' ? 'number' : 'text'} value={condition.value} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder='Enter value' />}<button type='button' onClick={() => setConditions((current) => current.filter((item) => item.id !== condition.id))}>×</button></div>)}</div><footer><button type='button' className='button outline accent' onClick={() => addCondition()}>＋ Add Filter</button><button type='button' className='button outline accent'>＋ Add Group</button><div><span>Estimated members</span><strong>{previewed ? previewRows.length.toLocaleString() : '—'}</strong></div><button type='button' className='button solid' onClick={previewMembers}>Preview Member Count</button></footer></main></div> : <SmartListMemberPreview rows={previewRows} />}
  </section>
}

function SmartListMemberPreview({ rows }: { rows: PersonRecord[] }) {
  return <div className='smartListMemberPreview'><header><div><h3>Member Preview</h3><p>People who currently match the Smart List rules. Results update as CRM data changes.</p></div><div><label><span>⌕</span><input placeholder='Search preview results…' /></label><button type='button' className='button outline accent'>↓ Export CSV</button></div></header><div className='smartListPreviewStats'><div><span>Matching People</span><strong>{rows.length.toLocaleString()}</strong></div><div><span>Preview Limit</span><strong>1,000</strong></div><div><span>Last Refreshed</span><strong>Just now</strong></div></div><div className='smartListPreviewTable'><div><span>Name</span><span>Email</span><span>Company</span><span>Lifecycle Stage</span><span>Score</span><span>Last Activity</span></div>{rows.map((person) => <div key={person.id}><span><i>{person.name.split(' ').map((part) => part[0]).join('')}</i><strong>{person.name}</strong></span><span>{person.email}</span><span>{person.company}</span><span><em>{person.lifecycleStage}</em></span><span>{person.score}</span><span>{person.lastActivity}</span></div>)}{rows.length === 0 && <p>No leads match the current Smart List rules.</p>}</div></div>
}
