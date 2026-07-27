import { useState } from 'react'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

export type LeadColumnKey = 'name' | 'email' | 'company' | 'lifecycleStage' | 'score' | 'lastActivity' | 'owner' | 'title' | 'location'

export interface LeadFilterRule {
  id: number
  field: 'Lifecycle Stage' | 'Score' | 'Company' | 'Owner' | 'Job Title' | 'Location'
  operator: 'is' | 'is not' | 'contains' | 'greater than' | 'less than'
  value: string
}

export interface LeadFilterState {
  query: string
  rules: LeadFilterRule[]
  logic: 'AND' | 'OR'
}

interface PeopleFiltersProps {
  totalCount: number
  visibleColumns: LeadColumnKey[]
  onColumnsChange: (columns: LeadColumnKey[]) => void
  onFilterChange: (filters: LeadFilterState) => void
  onCreateSmartListFromView: () => void
}

const columnOptions: Array<{ key: LeadColumnKey; label: string; fixed?: boolean }> = [
  { key: 'name', label: 'Name', fixed: true },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'lifecycleStage', label: 'Lifecycle Stage' },
  { key: 'score', label: 'Score' },
  { key: 'lastActivity', label: 'Last Activity' },
  { key: 'owner', label: 'Owner' },
  { key: 'title', label: 'Job Title' },
  { key: 'location', label: 'Location' },
]

const fieldValues: Partial<Record<LeadFilterRule['field'], string[]>> = {
  'Lifecycle Stage': ['Lead', 'MQL', 'SQL', 'Customer'],
  Owner: ['Maya Chen', 'Rita Nair', 'Liam Ortiz'],
}

interface SavedLeadView {
  id: string
  name: string
  filters: LeadFilterState
  columns: LeadColumnKey[]
}

export function PeopleFilters({ totalCount, visibleColumns, onColumnsChange, onFilterChange, onCreateSmartListFromView }: PeopleFiltersProps) {
  const [query, setQuery] = useState('')
  const [rules, setRules] = useState<LeadFilterRule[]>([])
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
    const [filterOpen, setFilterOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [activeViewId, setActiveViewId] = useState('all-leads')
  const [nextRuleId, setNextRuleId] = useState(1)
  const [savedViews, setSavedViews] = useState<SavedLeadView[]>([
    { id: 'all-leads', name: 'All Leads', filters: { query: '', rules: [], logic: 'AND' }, columns: visibleColumns },
  ])

  function emit(nextQuery = query, nextRules = rules, nextLogic = logic) {
    onFilterChange({ query: nextQuery, rules: nextRules, logic: nextLogic })
  }

  function addRule() {
    const nextRule: LeadFilterRule = { id: nextRuleId, field: 'Lifecycle Stage', operator: 'is', value: 'MQL' }
    const nextRules = [...rules, nextRule]
    setNextRuleId((value) => value + 1)
    setRules(nextRules)
    emit(query, nextRules)
  }

  function updateRule(id: number, updates: Partial<LeadFilterRule>) {
    const nextRules = rules.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)
    setRules(nextRules)
    emit(query, nextRules)
  }

  function removeRule(id: number) {
    const nextRules = rules.filter((rule) => rule.id !== id)
    setRules(nextRules)
    emit(query, nextRules)
  }

  function changeLogic(nextLogic: 'AND' | 'OR') {
    setLogic(nextLogic)
    emit(query, rules, nextLogic)
  }

  function selectView(id: string) {
    const view = savedViews.find((item) => item.id === id)
    if (!view) return
    setActiveViewId(id)
    setQuery(view.filters.query)
    setRules(view.filters.rules)
    setLogic(view.filters.logic)
    onColumnsChange(view.columns)
    onFilterChange(view.filters)
  }

  function saveView() {
    if (!viewName.trim()) return
    const view: SavedLeadView = { id: `view-${savedViews.length + 1}`, name: viewName.trim(), filters: { query, rules, logic }, columns: visibleColumns }
    setSavedViews((current) => [...current, view])
    setActiveViewId(view.id)
    setSaveOpen(false)
    setViewName('')
  }

  const hiddenCount = columnOptions.length - visibleColumns.length

  return <section className='leadsToolbar'>
    <header className='leadsPageHeading'><div><h2>Leads</h2><p>{totalCount.toLocaleString()} people in this workspace</p></div><div><button type='button' className='button outline accent' onClick={() => setSaveOpen(true)}>Save View</button><button type='button' className='button solid' onClick={onCreateSmartListFromView}>Create Smart List from View</button></div></header>
    <div className='leadsViewToolbar'>
      <label className='savedViewSelect'><span>View</span><select value={activeViewId} onChange={(event) => selectView(event.target.value)}>{savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
      <label className='searchInputWrap leadSearch'><WireframeIcon name='search' className='iconSmall muted' /><input type='text' value={query} onChange={(event) => { setQuery(event.target.value); emit(event.target.value) }} className='searchInput' placeholder='Search leads by name, email, or company…' /></label>
      <div className='leadFilterWrap'><button type='button' className={`button outline ${rules.length ? 'accent active' : ''}`} onClick={() => setFilterOpen((value) => !value)}>☷ Filters {rules.length > 0 && <span>{rules.length}</span>}</button>{filterOpen && <div className='dynamicFilterPopover'><header><div><strong>Filter Leads</strong><small>Build reusable field-based conditions</small></div><div><button type='button' className={logic === 'AND' ? 'active' : ''} onClick={() => changeLogic('AND')}>AND</button><button type='button' className={logic === 'OR' ? 'active' : ''} onClick={() => changeLogic('OR')}>OR</button></div></header><div>{rules.map((rule, index) => <div className='dynamicFilterRow' key={rule.id}><span>{index + 1}</span><select value={rule.field} onChange={(event) => updateRule(rule.id, { field: event.target.value as LeadFilterRule['field'], value: '' })}><option>Lifecycle Stage</option><option>Score</option><option>Company</option><option>Owner</option><option>Job Title</option><option>Location</option></select><select value={rule.operator} onChange={(event) => updateRule(rule.id, { operator: event.target.value as LeadFilterRule['operator'] })}><option>is</option><option>is not</option><option>contains</option><option>greater than</option><option>less than</option></select>{fieldValues[rule.field] ? <select value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })}><option value=''>Select value</option>{fieldValues[rule.field]?.map((value) => <option key={value}>{value}</option>)}</select> : <input type={rule.field === 'Score' ? 'number' : 'text'} value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} placeholder='Enter value' />}<button type='button' onClick={() => removeRule(rule.id)}>×</button></div>)}{rules.length === 0 && <div className='noLeadFilters'><span>☷</span><p>No filters applied</p><small>Add a condition to narrow this view.</small></div>}</div><footer><button type='button' className='button ghost' onClick={() => { setRules([]); emit(query, []) }}>Clear All</button><button type='button' className='button outline accent' onClick={addRule}>＋ Add Condition</button><button type='button' className='button solid' onClick={() => setFilterOpen(false)}>Apply Filters</button></footer></div>}</div>
      <div className='leadColumnsWrap'><button type='button' className='button outline accent' onClick={() => setColumnsOpen((value) => !value)}>▦ Columns {hiddenCount > 0 && <span>{hiddenCount} hidden</span>}</button>{columnsOpen && <div className='leadColumnsMenu'><header><strong>Table Columns</strong><small>Choose which fields are visible</small></header>{columnOptions.map((column) => <label key={column.key}><input type='checkbox' checked={visibleColumns.includes(column.key)} disabled={column.fixed} onChange={(event) => onColumnsChange(event.target.checked ? [...visibleColumns, column.key] : visibleColumns.filter((key) => key !== column.key))} /><span>{column.label}</span>{column.fixed && <em>Required</em>}</label>)}<footer><button type='button' onClick={() => onColumnsChange(['name', 'email', 'company', 'lifecycleStage', 'score', 'lastActivity'])}>Reset Defaults</button><button type='button' onClick={() => setColumnsOpen(false)}>Done</button></footer></div>}</div>
      <button type='button' className='iconButton subtle leadMoreButton' aria-label='More lead view actions'>•••</button>
    </div>
    <div className='activeLeadFilters'>{rules.map((rule) => <button type='button' key={rule.id} onClick={() => removeRule(rule.id)}><strong>{rule.field}</strong> {rule.operator} {rule.value || '…'} <span>×</span></button>)}{rules.length === 0 && <span>No filters applied</span>}</div>
    <Modal title='Save Lead View' open={saveOpen} onClose={() => setSaveOpen(false)}><div className='saveLeadViewModal'><label>View Name<input autoFocus value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder='e.g. High Intent MQLs' /></label><div><span>Filters</span><strong>{rules.length} conditions</strong><span>Visible Columns</span><strong>{visibleColumns.length} columns</strong></div><label className='saveViewToggle'><span><strong>Make this my default Leads view</strong><small>Open this view whenever Leads is selected</small></span><input type='checkbox' className='toggleSwitch' /></label><footer><button type='button' className='button ghost' onClick={() => setSaveOpen(false)}>Cancel</button><button type='button' className='button solid' disabled={!viewName.trim()} onClick={saveView}>Save View</button></footer></div></Modal>
  </section>
}
