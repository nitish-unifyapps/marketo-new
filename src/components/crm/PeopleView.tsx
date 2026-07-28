import { useMemo, useState } from 'react'
import { BulkActionBar } from '../common/BulkActionBar'
import { PeopleFilters, type LeadColumnKey, type LeadFilterRule, type LeadFilterState, type LeadViewMode } from './PeopleFilters'
import type { PersonRecord } from '../../types/crm'

interface PeopleViewProps {
  rows: PersonRecord[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onToggleAll: (selected: boolean) => void
  onOpenPerson: (id: string) => void
  onImportRows: (rows: PersonRecord[]) => void
}

const lifecycleStages: PersonRecord['lifecycleStage'][] = ['Lead', 'MQL', 'SQL', 'Customer']

const columnLabels: Record<LeadColumnKey, string> = {
  name: 'Name',
  email: 'Email',
  company: 'Company',
  lifecycleStage: 'Lifecycle Stage',
  score: 'Score',
  lastActivity: 'Last Activity',
  owner: 'Owner',
  title: 'Job Title',
  location: 'Location',
}

function matchesRule(person: PersonRecord, rule: LeadFilterRule) {
  const source = rule.field === 'Lifecycle Stage' ? person.lifecycleStage : rule.field === 'Score' ? person.score : rule.field === 'Company' ? person.company : rule.field === 'Owner' ? person.owner : rule.field === 'Job Title' ? person.title : person.location
  const sourceText = String(source).toLowerCase()
  const valueText = rule.value.toLowerCase()
  if (!rule.value) return true
  if (rule.operator === 'is') return sourceText === valueText
  if (rule.operator === 'is not') return sourceText !== valueText
  if (rule.operator === 'contains') return sourceText.includes(valueText)
  if (rule.operator === 'greater than') return Number(source) > Number(rule.value)
  if (rule.operator === 'less than') return Number(source) < Number(rule.value)
  return true
}

function columnValue(person: PersonRecord, column: LeadColumnKey) {
  if (column === 'lifecycleStage') return person.lifecycleStage
  if (column === 'lastActivity') return person.lastActivity
  return String(person[column])
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function parseCsvRow(line: string) {
  const values: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      values.push(current.trim())
      current = ''
    } else {
      current += character
    }
  }

  values.push(current.trim())
  return values
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function readCsvValue(values: string[], headers: string[], names: string[]) {
  const index = headers.findIndex((header) => names.includes(header))
  return index >= 0 ? values[index]?.trim() ?? '' : ''
}

function normalizeLifecycleStage(value: string): PersonRecord['lifecycleStage'] {
  const match = lifecycleStages.find((stage) => stage.toLowerCase() === value.trim().toLowerCase())
  return match ?? 'Lead'
}

export function PeopleView({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenPerson,
  onImportRows,
}: PeopleViewProps) {
  const [filters, setFilters] = useState<LeadFilterState>({ query: '', rules: [], logic: 'AND' })
  const [visibleColumns, setVisibleColumns] = useState<LeadColumnKey[]>(['name', 'email', 'company', 'lifecycleStage', 'score', 'lastActivity'])
  const [viewMode, setViewMode] = useState<LeadViewMode>('table')
  const [transferMessage, setTransferMessage] = useState('')

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return rows.filter((person) => {
      const matchesQuery = !query || [person.name, person.email, person.company].some((value) => value.toLowerCase().includes(query))
      const matchesRules = filters.rules.length === 0 || (filters.logic === 'AND' ? filters.rules.every((rule) => matchesRule(person, rule)) : filters.rules.some((rule) => matchesRule(person, rule)))
      return matchesQuery && matchesRules
    })
  }, [filters, rows])

  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  function exportLeads() {
    const header = visibleColumns.map((column) => csvCell(columnLabels[column])).join(',')
    const body = filteredRows.map((person) => visibleColumns.map((column) => csvCell(columnValue(person, column))).join(','))
    const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `marketo-leads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setTransferMessage(`${filteredRows.length.toLocaleString()} leads exported from the current view.`)
  }

  async function importLeads(file: File) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim())
    if (lines.length < 2) {
      setTransferMessage('No lead records were found in this CSV file.')
      return
    }

    const headers = parseCsvRow(lines[0]).map(normalizeHeader)
    const importedRows = lines.slice(1).map((line, index): PersonRecord | null => {
      const values = parseCsvRow(line)
      const email = readCsvValue(values, headers, ['email', 'emailaddress'])
      const name = readCsvValue(values, headers, ['name', 'fullname']) || email.split('@')[0]
      if (!name && !email) return null

      return {
        id: `imported-${Date.now()}-${index}`,
        name: name || 'Unnamed Lead',
        email,
        company: readCsvValue(values, headers, ['company', 'companyname', 'account']),
        lifecycleStage: normalizeLifecycleStage(readCsvValue(values, headers, ['lifecyclestage', 'stage'])),
        score: Number(readCsvValue(values, headers, ['score', 'leadscore'])) || 0,
        lastActivity: readCsvValue(values, headers, ['lastactivity', 'lastactivitydate']) || 'Just now',
        owner: readCsvValue(values, headers, ['owner', 'leadowner']) || 'Unassigned',
        title: readCsvValue(values, headers, ['jobtitle', 'title']),
        location: readCsvValue(values, headers, ['location', 'city', 'country']),
        phone: readCsvValue(values, headers, ['phone', 'phonenumber']),
        smartLists: [],
        activity: [],
        consent: { email: false, sms: false, tracking: false },
      }
    }).filter((person): person is PersonRecord => person !== null)

    if (importedRows.length === 0) {
      setTransferMessage('No valid lead records were found. Include a Name or Email column.')
      return
    }

    onImportRows(importedRows)
    setTransferMessage(`${importedRows.length.toLocaleString()} leads imported from ${file.name}.`)
  }

  return (
    <section className='viewWrap leadsView'>
      <PeopleFilters
        totalCount={filteredRows.length}
        visibleColumns={visibleColumns}
        viewMode={viewMode}
        onColumnsChange={setVisibleColumns}
        onFilterChange={setFilters}
        onViewModeChange={setViewMode}
        onImport={(file) => void importLeads(file)}
        onExport={exportLeads}
      />

      {transferMessage && <div className='leadTransferNotice' role='status'><span>✓</span>{transferMessage}<button type='button' onClick={() => setTransferMessage('')} aria-label='Dismiss message'>×</button></div>}

      {viewMode === 'table' ? (
        <div className='tableWrap'>
          <table className='crmTable'>
            <thead>
              <tr>
                <th><input type='checkbox' checked={allSelected} onChange={(event) => onToggleAll(event.target.checked)} aria-label='Select all people' /></th>
                {visibleColumns.map((column) => <th key={column}>{columnLabels[column]}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((person, index) => {
                const isSelected = selectedIds.includes(person.id)
                return (
                  <tr key={person.id} className={index % 2 === 1 ? 'altRow' : ''}>
                    <td><input type='checkbox' checked={isSelected} onChange={() => onToggleRow(person.id)} aria-label={`Select ${person.name}`} /></td>
                    {visibleColumns.map((column) => (
                      <td key={column}>
                        {column === 'name' ? <button type='button' className='tableLink' onClick={() => onOpenPerson(person.id)}>{person.name}</button> : column === 'lifecycleStage' ? <span className='badge neutral'>{person.lifecycleStage}</span> : columnValue(person, column)}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {filteredRows.length === 0 && <tr><td className='emptyRow' colSpan={visibleColumns.length + 1}>No leads match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='leadKanbanBoard' aria-label='Leads grouped by lifecycle stage'>
          {lifecycleStages.map((stage) => {
            const stageRows = filteredRows.filter((person) => person.lifecycleStage === stage)
            return (
              <section className={`leadKanbanColumn stage-${stage.toLowerCase()}`} key={stage}>
                <header><div><i /><strong>{stage}</strong></div><span>{stageRows.length}</span></header>
                <div>
                  {stageRows.map((person) => (
                    <button type='button' className='leadKanbanCard' key={person.id} onClick={() => onOpenPerson(person.id)}>
                      <span className='leadKanbanIdentity'><i>{person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</i><span><strong>{person.name}</strong><small>{person.title || person.email}</small></span></span>
                      <span className='leadKanbanCompany'>{person.company || 'No company'}</span>
                      <span className='leadKanbanMeta'><span>Score <strong>{person.score}</strong></span><span>{person.owner}</span></span>
                    </button>
                  ))}
                  {stageRows.length === 0 && <p className='leadKanbanEmpty'>No leads in this stage</p>}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <BulkActionBar visible={selectedIds.length > 0} selectedCount={selectedIds.length} />
    </section>
  )
}
