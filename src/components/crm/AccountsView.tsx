import { useMemo, useState } from 'react'
import { BulkActionBar } from '../common/BulkActionBar'
import { WireframeIcon } from '../common/WireframeIcon'
import type { AccountRecord } from '../../types/crm'

interface AccountsViewProps {
  rows: AccountRecord[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onToggleAll: (selected: boolean) => void
  onOpenAccount: (id: string) => void
}

type AccountColumn = 'accountName' | 'industry' | 'status' | 'owner' | 'revenue' | 'numberOfContacts' | 'createDate' | 'lastActivity'
type SavedView = 'all' | 'mine' | 'unassigned' | 'views'

interface AccountMetadata {
  owner: string
  status: 'Customer' | 'Prospect' | 'Target'
  createDate: string
  createAge: '30' | '90' | 'older'
  lastActivity: string
  activityAge: '7' | '30' | 'older'
}

const owners = ['Maya Chen', 'Rita Nair', 'Liam Ortiz', 'Unassigned']
const statuses: AccountMetadata['status'][] = ['Customer', 'Prospect', 'Target']
const columnOptions: Array<{ key: AccountColumn; label: string; required?: boolean }> = [
  { key: 'accountName', label: 'Account name', required: true },
  { key: 'industry', label: 'Industry' },
  { key: 'status', label: 'Account status' },
  { key: 'owner', label: 'Account owner' },
  { key: 'revenue', label: 'Annual revenue' },
  { key: 'numberOfContacts', label: 'Contacts' },
  { key: 'createDate', label: 'Create date' },
  { key: 'lastActivity', label: 'Last activity date' },
]
const defaultColumns: AccountColumn[] = ['accountName', 'industry', 'status', 'owner', 'revenue', 'numberOfContacts', 'lastActivity']

function metadataFor(account: AccountRecord): AccountMetadata {
  const seed = [...account.id].reduce((total, character) => total + character.charCodeAt(0), 0)
  const createDates = [{ label: 'Jul 18, 2026', age: '30' as const }, { label: 'Jun 12, 2026', age: '90' as const }, { label: 'Mar 04, 2026', age: 'older' as const }]
  const activityDates = [{ label: 'Today, 9:42 AM', age: '7' as const }, { label: 'Jul 16, 2026', age: '30' as const }, { label: 'Jun 21, 2026', age: 'older' as const }]
  const created = createDates[seed % createDates.length]
  const activity = activityDates[(seed + 1) % activityDates.length]
  return { owner: owners[seed % owners.length], status: statuses[seed % statuses.length], createDate: created.label, createAge: created.age, lastActivity: activity.label, activityAge: activity.age }
}

function revenueValue(revenue: string) {
  const amount = Number(revenue.replace(/[^0-9.]/g, '')) || 0
  return revenue.includes('B') ? amount * 1000 : amount
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function AccountsView({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenAccount,
}: AccountsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<SavedView>('all')
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
  const [visibleColumns, setVisibleColumns] = useState<AccountColumn[]>(defaultColumns)
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [createFilter, setCreateFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')
  const [profileFilter, setProfileFilter] = useState('all')
  const [minimumContacts, setMinimumContacts] = useState(0)
  const [sortBy, setSortBy] = useState('name-asc')
  const [notice, setNotice] = useState('')

  const accountMetadata = useMemo(() => new Map(rows.map((account) => [account.id, metadataFor(account)])), [rows])
  const industries = useMemo(() => [...new Set(rows.map((account) => account.industry))].sort(), [rows])
  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return rows.filter((account) => {
      const meta = accountMetadata.get(account.id)!
      const matchesView = activeView === 'all' || activeView === 'views' || (activeView === 'mine' ? meta.owner === 'Maya Chen' : meta.owner === 'Unassigned')
      const matchesQuery = !query || [account.accountName, account.industry, account.revenue, meta.owner, meta.status].some((value) => value.toLowerCase().includes(query))
      return matchesView && matchesQuery && (ownerFilter === 'all' || meta.owner === ownerFilter) && (createFilter === 'all' || meta.createAge === createFilter) && (activityFilter === 'all' || meta.activityAge === activityFilter) && (profileFilter === 'all' || meta.status === profileFilter || account.industry === profileFilter) && account.numberOfContacts >= minimumContacts
    }).sort((left, right) => sortBy === 'name-desc' ? right.accountName.localeCompare(left.accountName) : sortBy === 'revenue-desc' ? revenueValue(right.revenue) - revenueValue(left.revenue) : sortBy === 'contacts-desc' ? right.numberOfContacts - left.numberOfContacts : left.accountName.localeCompare(right.accountName))
  }, [accountMetadata, activeView, activityFilter, createFilter, minimumContacts, ownerFilter, profileFilter, rows, searchQuery, sortBy])

  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  function columnValue(account: AccountRecord, column: AccountColumn) {
    const meta = accountMetadata.get(account.id)!
    if (column === 'accountName') return account.accountName
    if (column === 'industry') return account.industry
    if (column === 'revenue') return account.revenue
    if (column === 'numberOfContacts') return account.numberOfContacts
    return meta[column]
  }

  function resetFilters() {
    setOwnerFilter('all'); setCreateFilter('all'); setActivityFilter('all'); setProfileFilter('all'); setMinimumContacts(0)
  }

  function exportAccounts() {
    const headers = visibleColumns.map((column) => csvCell(columnOptions.find((option) => option.key === column)?.label ?? column))
    const body = filteredRows.map((account) => visibleColumns.map((column) => csvCell(columnValue(account, column))).join(','))
    const blob = new Blob([[headers.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `marketo-accounts-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url)
    setNotice(`${filteredRows.length.toLocaleString()} accounts exported from the current view.`)
  }

  const activeFilterCount = [ownerFilter, createFilter, activityFilter, profileFilter].filter((value) => value !== 'all').length + (minimumContacts > 0 ? 1 : 0)

  return (
    <section className='viewWrap accountsDirectory'>
      <header className='accountDirectoryHeader crmDirectoryHeader'>
        <div className='accountDirectoryTitle crmDirectoryTitle'><h2>Accounts</h2><span>{rows.length.toLocaleString()} records</span></div>
        <div className='accountHeaderActions crmDirectoryActions'>
          <button type='button' className='accountButton secondary' onClick={() => setNotice('Account import is ready for a connected data source.')}><span aria-hidden='true'>↥</span> Import</button>
          <details className='accountMenu'><summary className='accountButton secondary'>Actions <span>⌄</span></summary><div><button type='button' onClick={exportAccounts}>Export current view</button><button type='button' onClick={resetFilters}>Clear all filters</button></div></details>
          <button type='button' className='accountButton primary' onClick={() => setNotice('Account creation opens when a CRM form is connected.')}><span aria-hidden='true'>＋</span> Create account</button>
        </div>
      </header>

      <nav className='accountSavedViews' aria-label='Saved account views'>
        {([['all', 'All accounts'], ['mine', 'My accounts'], ['unassigned', 'Unassigned accounts'], ['views', 'All views']] as Array<[SavedView, string]>).map(([key, label]) => <button key={key} type='button' className={activeView === key ? 'active' : ''} onClick={() => setActiveView(key)}>{label}{key === 'views' && <span>⌄</span>}</button>)}
      </nav>

      <div className='accountQuickFilters' aria-label='Account filters'>
        <label><span>Account owner</span><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value='all'>All owners</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
        <label><span>Create date</span><select value={createFilter} onChange={(event) => setCreateFilter(event.target.value)}><option value='all'>Any time</option><option value='30'>Last 30 days</option><option value='90'>Last 90 days</option><option value='older'>Older</option></select></label>
        <label><span>Last activity date</span><select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}><option value='all'>Any time</option><option value='7'>Last 7 days</option><option value='30'>Last 30 days</option><option value='older'>Older</option></select></label>
        <label><span>Status / industry</span><select value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)}><option value='all'>All accounts</option><optgroup label='Status'>{statuses.map((status) => <option key={status}>{status}</option>)}</optgroup><optgroup label='Industry'>{industries.map((industry) => <option key={industry}>{industry}</option>)}</optgroup></select></label>
        <details className='accountAddFilter'><summary>＋ Add filter{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</summary><div><label>Minimum contacts<input type='number' min='0' value={minimumContacts} onChange={(event) => setMinimumContacts(Math.max(0, Number(event.target.value)))} /></label><button type='button' onClick={resetFilters}>Clear filters</button></div></details>
        <label className='accountSort'><span>Sort by</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value='name-asc'>Name A–Z</option><option value='name-desc'>Name Z–A</option><option value='revenue-desc'>Highest revenue</option><option value='contacts-desc'>Most contacts</option></select></label>
      </div>

      <div className='accountToolkit'>
        <label className='accountSearch'><WireframeIcon name='search' /><input type='search' value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder='Search accounts' /></label>
        <details className='accountColumns'><summary className='accountButton secondary'>▦ Edit columns {columnOptions.length > visibleColumns.length && <span>{columnOptions.length - visibleColumns.length} hidden</span>}</summary><div><header><strong>Edit columns</strong><small>Choose fields shown in the table</small></header>{columnOptions.map((column) => <label key={column.key}><input type='checkbox' checked={visibleColumns.includes(column.key)} disabled={column.required} onChange={(event) => setVisibleColumns((current) => event.target.checked ? [...current, column.key] : current.filter((key) => key !== column.key))} /><span>{column.label}</span>{column.required && <em>Required</em>}</label>)}<footer><button type='button' onClick={() => setVisibleColumns(defaultColumns)}>Reset</button><button type='button' onClick={() => setVisibleColumns(columnOptions.map((column) => column.key))}>Show all</button></footer></div></details>
        <button type='button' className='accountButton secondary' onClick={exportAccounts}><span aria-hidden='true'>↧</span> Export</button>
        <div className='accountViewToggle' role='group' aria-label='Account layout'><button type='button' className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')} aria-label='Table view' title='Table view' aria-pressed={viewMode === 'table'}>▦</button><button type='button' className={viewMode === 'board' ? 'active' : ''} onClick={() => setViewMode('board')} aria-label='Board view' title='Board view' aria-pressed={viewMode === 'board'}>▤</button></div>
      </div>

      {notice && <div className='accountNotice' role='status'><span>✓</span>{notice}<button type='button' onClick={() => setNotice('')} aria-label='Dismiss message'>×</button></div>}

      {viewMode === 'table' ? <div className='accountTableWrap'><table className='accountTable'>
          <thead><tr><th className='accountSelectCell'><input type='checkbox' checked={allSelected} onChange={(event) => onToggleAll(event.target.checked)} aria-label='Select all accounts' /></th>{visibleColumns.map((column) => <th key={column}>{columnOptions.find((option) => option.key === column)?.label}</th>)}</tr></thead>
          <tbody>
            {filteredRows.map((account) => <tr key={account.id} className={selectedIds.includes(account.id) ? 'selected' : ''}><td className='accountSelectCell'><input type='checkbox' checked={selectedIds.includes(account.id)} onChange={() => onToggleRow(account.id)} aria-label={`Select ${account.accountName}`} /></td>{visibleColumns.map((column) => <td key={column}>{column === 'accountName' ? <button type='button' className='accountNameLink' onClick={() => onOpenAccount(account.id)}><i>{account.accountName.slice(0, 1)}</i><span>{account.accountName}</span></button> : column === 'status' ? <span className={`accountStatus ${String(columnValue(account, column)).toLowerCase()}`}>{columnValue(account, column)}</span> : column === 'numberOfContacts' ? <span className='accountContactCount'>{columnValue(account, column)}</span> : columnValue(account, column)}</td>)}</tr>)}
            {filteredRows.length === 0 && <tr><td className='accountEmpty' colSpan={visibleColumns.length + 1}><strong>No accounts found</strong><span>Adjust the search or clear filters to see more records.</span><button type='button' onClick={resetFilters}>Clear filters</button></td></tr>}
          </tbody>
        </table></div> : <div className='accountBoard' aria-label='Accounts grouped by status'>{statuses.map((status) => {
          const statusRows = filteredRows.filter((account) => accountMetadata.get(account.id)?.status === status)
          return <section className={`accountBoardColumn ${status.toLowerCase()}`} key={status}><header><div><i /><strong>{status}</strong></div><span>{statusRows.length}</span></header><div>{statusRows.map((account) => {
            const meta = accountMetadata.get(account.id)!
            return <article className='accountCard' key={account.id}><header><button type='button' onClick={() => onOpenAccount(account.id)}><i>{account.accountName.slice(0, 1)}</i><span><strong>{account.accountName}</strong><small>{account.industry}</small></span></button><input type='checkbox' checked={selectedIds.includes(account.id)} onChange={() => onToggleRow(account.id)} aria-label={`Select ${account.accountName}`} /></header><dl><div><dt>Revenue</dt><dd>{account.revenue}</dd></div><div><dt>Contacts</dt><dd>{account.numberOfContacts}</dd></div></dl><footer><span>{meta.owner}</span><small>{meta.lastActivity}</small></footer></article>
          })}{statusRows.length === 0 && <p>No accounts in this status</p>}</div></section>
        })}</div>}

      <BulkActionBar visible={selectedIds.length > 0} selectedCount={selectedIds.length} />
    </section>
  )
}
