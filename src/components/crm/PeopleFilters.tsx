import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

export type LeadColumnKey = 'name' | 'email' | 'company' | 'lifecycleStage' | 'score' | 'lastActivity' | 'owner' | 'title' | 'location'
export type LeadViewMode = 'table' | 'kanban'
export type LeadSortKey = 'recent' | 'score-desc' | 'name-asc' | 'company-asc'

export interface NewLeadDraft {
  name: string
  email: string
  company: string
  owner: string
  lifecycleStage: 'Lead' | 'MQL' | 'SQL' | 'Customer'
}

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
  viewMode: LeadViewMode
  sortKey: LeadSortKey
  onColumnsChange: (columns: LeadColumnKey[]) => void
  onFilterChange: (filters: LeadFilterState) => void
  onViewModeChange: (mode: LeadViewMode) => void
  onSortChange: (sort: LeadSortKey) => void
  onImport: (file: File) => void
  onExport: () => void
  onCreateLead: (lead: NewLeadDraft) => void
}

const defaultColumns: LeadColumnKey[] = ['name', 'email', 'company', 'lifecycleStage', 'score', 'lastActivity']

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
  Owner: ['Maya Chen', 'Rita Nair', 'Liam Ortiz', 'Unassigned'],
}

interface SavedLeadView {
  id: string
  name: string
  filters: LeadFilterState
  columns: LeadColumnKey[]
  mode: LeadViewMode
}

function ToolbarIcon({ children }: { children: ReactNode }) {
  return <svg viewBox='0 0 20 20' aria-hidden='true'>{children}</svg>
}

export function PeopleFilters({
  totalCount,
  visibleColumns,
  viewMode,
  sortKey,
  onColumnsChange,
  onFilterChange,
  onViewModeChange,
  onSortChange,
  onImport,
  onExport,
  onCreateLead,
}: PeopleFiltersProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [rules, setRules] = useState<LeadFilterRule[]>([])
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [filterOpen, setFilterOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [allViewsOpen, setAllViewsOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [activeViewId, setActiveViewId] = useState('all-leads')
  const [nextRuleId, setNextRuleId] = useState(10)
  const [createDate, setCreateDate] = useState('any')
  const [activityDate, setActivityDate] = useState('any')
  const [leadDraft, setLeadDraft] = useState<NewLeadDraft>({ name: '', email: '', company: '', owner: 'Unassigned', lifecycleStage: 'Lead' })
  const [savedViews, setSavedViews] = useState<SavedLeadView[]>([
    { id: 'all-leads', name: 'All leads', filters: { query: '', rules: [], logic: 'AND' }, columns: defaultColumns, mode: 'table' },
    { id: 'my-leads', name: 'My leads', filters: { query: '', rules: [{ id: 1, field: 'Owner', operator: 'is', value: 'Maya Chen' }], logic: 'AND' }, columns: defaultColumns, mode: 'table' },
    { id: 'unassigned-leads', name: 'Unassigned leads', filters: { query: '', rules: [{ id: 2, field: 'Owner', operator: 'is', value: 'Unassigned' }], logic: 'AND' }, columns: defaultColumns, mode: 'table' },
    { id: 'lifecycle-pipeline', name: 'Lifecycle pipeline', filters: { query: '', rules: [], logic: 'AND' }, columns: defaultColumns, mode: 'kanban' },
    { id: 'high-intent', name: 'High intent leads', filters: { query: '', rules: [{ id: 3, field: 'Score', operator: 'greater than', value: '70' }], logic: 'AND' }, columns: defaultColumns, mode: 'table' },
  ])

  function emit(nextQuery = query, nextRules = rules, nextLogic = logic) {
    onFilterChange({ query: nextQuery, rules: nextRules, logic: nextLogic })
  }

  function addRule() {
    const nextRule: LeadFilterRule = { id: nextRuleId, field: 'Lifecycle Stage', operator: 'is', value: 'MQL' }
    const nextRules = [...rules, nextRule]
    setNextRuleId((value) => value + 1)
    setRules(nextRules)
    setActiveViewId('custom')
    emit(query, nextRules)
  }

  function updateRule(id: number, updates: Partial<LeadFilterRule>) {
    const nextRules = rules.map((rule) => rule.id === id ? { ...rule, ...updates } : rule)
    setRules(nextRules)
    setActiveViewId('custom')
    emit(query, nextRules)
  }

  function removeRule(id: number) {
    const nextRules = rules.filter((rule) => rule.id !== id)
    setRules(nextRules)
    setActiveViewId('custom')
    emit(query, nextRules)
  }

  function setQuickRule(field: 'Owner' | 'Lifecycle Stage', value: string) {
    const existing = rules.find((rule) => rule.field === field)
    let nextRules: LeadFilterRule[]
    if (!value) nextRules = rules.filter((rule) => rule.field !== field)
    else if (existing) nextRules = rules.map((rule) => rule.id === existing.id ? { ...rule, operator: 'is', value } : rule)
    else {
      nextRules = [...rules, { id: nextRuleId, field, operator: 'is', value }]
      setNextRuleId((current) => current + 1)
    }
    setRules(nextRules)
    setActiveViewId('custom')
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
    setCreateDate('any')
    setActivityDate('any')
    onColumnsChange(view.columns)
    onViewModeChange(view.mode)
    onFilterChange(view.filters)
    setAllViewsOpen(false)
  }

  function saveView() {
    if (!viewName.trim()) return
    const view: SavedLeadView = {
      id: `view-${Date.now()}`,
      name: viewName.trim(),
      filters: { query, rules, logic },
      columns: visibleColumns,
      mode: viewMode,
    }
    setSavedViews((current) => [...current, view])
    setActiveViewId(view.id)
    setSaveOpen(false)
    setViewName('')
  }

  function toggleColumn(column: LeadColumnKey, checked: boolean) {
    onColumnsChange(checked ? [...visibleColumns, column] : visibleColumns.filter((key) => key !== column))
  }

  function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!leadDraft.name.trim() || !leadDraft.email.trim()) return
    onCreateLead({ ...leadDraft, name: leadDraft.name.trim(), email: leadDraft.email.trim(), company: leadDraft.company.trim() })
    setLeadDraft({ name: '', email: '', company: '', owner: 'Unassigned', lifecycleStage: 'Lead' })
    setCreateOpen(false)
  }

  const hiddenCount = columnOptions.length - visibleColumns.length
  const ownerRule = rules.find((rule) => rule.field === 'Owner' && rule.operator === 'is')
  const statusRule = rules.find((rule) => rule.field === 'Lifecycle Stage' && rule.operator === 'is')
  const primaryViews = savedViews.slice(0, 3)

  return (
    <section className='leadsToolbar'>
      <header className='leadsPageHeading crmDirectoryHeader'>
        <div className='leadsTitleGroup crmDirectoryTitle'><h2>Leads</h2><span>{totalCount.toLocaleString()} records</span></div>
        <div className='leadHeaderActions crmDirectoryActions'>
          <button type='button' className='button outline leadImportButton' onClick={() => importInputRef.current?.click()}><span aria-hidden='true'>↥</span> Import</button>
          <div className='leadActionsWrap'>
            <button type='button' className='button outline' aria-haspopup='menu' aria-expanded={actionsOpen} onClick={() => setActionsOpen((value) => !value)}>Actions <span aria-hidden='true'>⌄</span></button>
            {actionsOpen && <div className='leadActionsMenu' role='menu'>
              <button type='button' role='menuitem' onClick={() => { setSaveOpen(true); setActionsOpen(false) }}>Save current view</button>
              <button type='button' role='menuitem' onClick={() => { selectView('all-leads'); setActionsOpen(false) }}>Reset view</button>
              <button type='button' role='menuitem' onClick={() => { onExport(); setActionsOpen(false) }}>Export current view</button>
            </div>}
          </div>
          <button type='button' className='button solid leadCreateButton' onClick={() => setCreateOpen(true)}><span aria-hidden='true'>＋</span> Create lead</button>
          <input
            ref={importInputRef}
            className='leadImportInput'
            type='file'
            accept='.csv,text/csv'
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onImport(file)
              event.target.value = ''
            }}
          />
        </div>
      </header>

      <nav className='leadSavedViews' aria-label='Saved lead views'>
        {primaryViews.map((view) => <button type='button' key={view.id} className={activeViewId === view.id ? 'active' : ''} aria-current={activeViewId === view.id ? 'page' : undefined} onClick={() => selectView(view.id)}>{view.name}</button>)}
        <div className='allLeadViewsWrap'>
          <button type='button' className={!primaryViews.some((view) => view.id === activeViewId) && activeViewId !== 'custom' ? 'active' : ''} aria-haspopup='menu' aria-expanded={allViewsOpen} onClick={() => setAllViewsOpen((value) => !value)}>All views <span aria-hidden='true'>⌄</span></button>
          {allViewsOpen && <div className='allLeadViewsMenu' role='menu'><header>Saved views</header>{savedViews.map((view) => <button type='button' role='menuitem' key={view.id} className={view.id === activeViewId ? 'active' : ''} onClick={() => selectView(view.id)}>{view.name}<small>{view.mode === 'table' ? 'Table' : 'Board'}</small></button>)}<footer><button type='button' onClick={() => { setSaveOpen(true); setAllViewsOpen(false) }}>＋ Save current view</button></footer></div>}
        </div>
      </nav>

      <div className='leadQuickFilters' aria-label='Quick filters'>
        <label><span>Lead owner</span><select value={ownerRule?.value ?? ''} onChange={(event) => setQuickRule('Owner', event.target.value)}><option value=''>All owners</option>{fieldValues.Owner?.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Create date</span><select value={createDate} onChange={(event) => setCreateDate(event.target.value)}><option value='any'>Any time</option><option value='7d'>Last 7 days</option><option value='30d'>Last 30 days</option><option value='90d'>Last 90 days</option></select></label>
        <label><span>Last activity date</span><select value={activityDate} onChange={(event) => setActivityDate(event.target.value)}><option value='any'>Any time</option><option value='today'>Today</option><option value='7d'>Last 7 days</option><option value='30d'>Last 30 days</option></select></label>
        <label><span>Lead status</span><select value={statusRule?.value ?? ''} onChange={(event) => setQuickRule('Lifecycle Stage', event.target.value)}><option value=''>All statuses</option>{fieldValues['Lifecycle Stage']?.map((value) => <option key={value}>{value}</option>)}</select></label>
        <button type='button' className={`leadAddFilter ${rules.length ? 'active' : ''}`} aria-expanded={filterOpen} onClick={() => setFilterOpen((value) => !value)}><span aria-hidden='true'>＋</span> Add filter {rules.length > 0 && <b>{rules.length}</b>}</button>
        <label className='leadSortControl'><span className='srOnly'>Sort leads</span><select aria-label='Sort leads' value={sortKey} onChange={(event) => onSortChange(event.target.value as LeadSortKey)}><option value='recent'>Sort: Recent activity</option><option value='score-desc'>Sort: Highest score</option><option value='name-asc'>Sort: Name A–Z</option><option value='company-asc'>Sort: Company A–Z</option></select></label>
      </div>

      <div className='leadsViewToolbar'>
        <label className='savedViewSelect'>
          <span>Saved view</span>
          <select value={activeViewId} onChange={(event) => selectView(event.target.value)}>
            {savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
          </select>
        </label>

        <div className='leadViewMode' role='group' aria-label='Lead layout'>
          <button type='button' title='Table view' aria-label='Table view' className={viewMode === 'table' ? 'active' : ''} onClick={() => onViewModeChange('table')} aria-pressed={viewMode === 'table'}><ToolbarIcon><path d='M3 4.5h14v11H3zM3 8h14M3 12h14M7.5 4.5v11' /></ToolbarIcon></button>
          <button type='button' title='Board view' aria-label='Board view' className={viewMode === 'kanban' ? 'active' : ''} onClick={() => onViewModeChange('kanban')} aria-pressed={viewMode === 'kanban'}><ToolbarIcon><rect x='3' y='4' width='4' height='12' rx='1' /><rect x='8' y='4' width='4' height='8' rx='1' /><rect x='13' y='4' width='4' height='10' rx='1' /></ToolbarIcon></button>
        </div>

        <label className='searchInputWrap leadSearch'>
          <WireframeIcon name='search' className='iconSmall muted' />
          <input
            type='search'
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveViewId('custom')
              emit(event.target.value)
            }}
            className='searchInput'
            placeholder='Search leads'
            aria-label='Search leads by name, email, or company'
          />
        </label>

        <div className='leadFilterWrap'>
          <button type='button' className={`button outline leadAdvancedFilterTrigger ${rules.length ? 'accent active' : ''}`} onClick={() => setFilterOpen((value) => !value)}>
            ☷ Filters {rules.length > 0 && <span>{rules.length}</span>}
          </button>
          {filterOpen && (
            <div className='dynamicFilterPopover'>
              <header>
                <div><strong>Filter Leads</strong><small>Build reusable field-based conditions</small></div>
                <div>
                  <button type='button' className={logic === 'AND' ? 'active' : ''} onClick={() => changeLogic('AND')}>AND</button>
                  <button type='button' className={logic === 'OR' ? 'active' : ''} onClick={() => changeLogic('OR')}>OR</button>
                </div>
              </header>
              <div>
                {rules.map((rule, index) => (
                  <div className='dynamicFilterRow' key={rule.id}>
                    <span>{index + 1}</span>
                    <select value={rule.field} onChange={(event) => updateRule(rule.id, { field: event.target.value as LeadFilterRule['field'], value: '' })}>
                      <option>Lifecycle Stage</option><option>Score</option><option>Company</option><option>Owner</option><option>Job Title</option><option>Location</option>
                    </select>
                    <select value={rule.operator} onChange={(event) => updateRule(rule.id, { operator: event.target.value as LeadFilterRule['operator'] })}>
                      <option>is</option><option>is not</option><option>contains</option><option>greater than</option><option>less than</option>
                    </select>
                    {fieldValues[rule.field] ? (
                      <select value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })}>
                        <option value=''>Select value</option>
                        {fieldValues[rule.field]?.map((value) => <option key={value}>{value}</option>)}
                      </select>
                    ) : (
                      <input type={rule.field === 'Score' ? 'number' : 'text'} value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} placeholder='Enter value' />
                    )}
                    <button type='button' onClick={() => removeRule(rule.id)} aria-label={`Remove filter ${index + 1}`}>×</button>
                  </div>
                ))}
                {rules.length === 0 && <div className='noLeadFilters'><span>☷</span><p>No filters applied</p><small>Add a condition to narrow this view.</small></div>}
              </div>
              <footer>
                <button type='button' className='button ghost' onClick={() => { setRules([]); setActiveViewId('custom'); emit(query, []) }}>Clear All</button>
                <button type='button' className='button outline accent' onClick={addRule}>+ Add Filter</button>
                <button type='button' className='button solid' onClick={() => setFilterOpen(false)}>Done</button>
              </footer>
            </div>
          )}
        </div>

        <div className='leadColumnsWrap'>
          <button type='button' className='button outline' onClick={() => setColumnsOpen((value) => !value)}>
            ▦ Edit columns {hiddenCount > 0 && <span>{hiddenCount} hidden</span>}
          </button>
          {columnsOpen && (
            <div className='leadColumnsMenu'>
              <header><strong>Edit table columns</strong><small>Add, remove, or hide fields from the table</small></header>
              {columnOptions.map((column) => (
                <label key={column.key}>
                  <input type='checkbox' checked={visibleColumns.includes(column.key)} disabled={column.fixed} onChange={(event) => toggleColumn(column.key, event.target.checked)} />
                  <span>{column.label}</span>
                  {column.fixed && <em>Required</em>}
                </label>
              ))}
              <footer>
                <button type='button' onClick={() => onColumnsChange(columnOptions.map((column) => column.key))}>Show all</button>
                <button type='button' onClick={() => onColumnsChange(defaultColumns)}>Reset</button>
                <button type='button' onClick={() => setColumnsOpen(false)}>Done</button>
              </footer>
            </div>
          )}
        </div>
        <button type='button' className='button outline leadExportButton' onClick={onExport}><span aria-hidden='true'>↧</span> Export</button>
      </div>

      {rules.length > 0 && <div className='activeLeadFilters'>
        {rules.map((rule) => <button type='button' key={rule.id} onClick={() => removeRule(rule.id)}><strong>{rule.field}</strong> {rule.operator} {rule.value || '…'} <span>×</span></button>)}
      </div>}

      <Modal title='Save Lead View' open={saveOpen} onClose={() => setSaveOpen(false)}>
        <div className='saveLeadViewModal'>
          <label>View name<input autoFocus value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder='e.g. High intent MQLs' /></label>
          <div><span>Filters</span><strong>{rules.length} conditions</strong><span>Layout</span><strong>{viewMode === 'table' ? 'Table' : 'Board'}</strong><span>Visible columns</span><strong>{visibleColumns.length} columns</strong></div>
          <label className='saveViewToggle'><span><strong>Make this my default Leads view</strong><small>Open this view whenever Leads is selected</small></span><input type='checkbox' className='toggleSwitch' /></label>
          <footer><button type='button' className='button ghost' onClick={() => setSaveOpen(false)}>Cancel</button><button type='button' className='button solid' disabled={!viewName.trim()} onClick={saveView}>Save view</button></footer>
        </div>
      </Modal>

      <Modal title='Create lead' open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className='createLeadModal' onSubmit={createLead}>
          <p>Add a lead to this workspace. Required fields are marked with an asterisk.</p>
          <div className='createLeadFields'>
            <label>Full name *<input autoFocus required value={leadDraft.name} onChange={(event) => setLeadDraft((current) => ({ ...current, name: event.target.value }))} placeholder='e.g. Alex Morgan' /></label>
            <label>Email *<input required type='email' value={leadDraft.email} onChange={(event) => setLeadDraft((current) => ({ ...current, email: event.target.value }))} placeholder='alex@company.com' /></label>
            <label>Company<input value={leadDraft.company} onChange={(event) => setLeadDraft((current) => ({ ...current, company: event.target.value }))} placeholder='Company name' /></label>
            <label>Lead owner<select value={leadDraft.owner} onChange={(event) => setLeadDraft((current) => ({ ...current, owner: event.target.value }))}>{fieldValues.Owner?.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Lead status<select value={leadDraft.lifecycleStage} onChange={(event) => setLeadDraft((current) => ({ ...current, lifecycleStage: event.target.value as NewLeadDraft['lifecycleStage'] }))}>{fieldValues['Lifecycle Stage']?.map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>
          <footer><button type='button' className='button ghost' onClick={() => setCreateOpen(false)}>Cancel</button><button type='submit' className='button solid'>Create lead</button></footer>
        </form>
      </Modal>
    </section>
  )
}
