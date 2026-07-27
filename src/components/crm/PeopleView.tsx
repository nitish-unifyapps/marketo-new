import { useMemo, useState } from 'react'
import { BulkActionBar } from '../common/BulkActionBar'
import { PeopleFilters, type LeadColumnKey, type LeadFilterRule, type LeadFilterState } from './PeopleFilters'
import type { PersonRecord } from '../../types/crm'

interface PeopleViewProps {
  rows: PersonRecord[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onToggleAll: (selected: boolean) => void
  onOpenPerson: (id: string) => void
  onCreateSmartListFromView: () => void
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

export function PeopleView({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenPerson,
  onCreateSmartListFromView,
}: PeopleViewProps) {
  const [filters, setFilters] = useState<LeadFilterState>({ query: '', rules: [], logic: 'AND' })
  const [visibleColumns, setVisibleColumns] = useState<LeadColumnKey[]>(['name', 'email', 'company', 'lifecycleStage', 'score', 'lastActivity'])

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return rows.filter((person) => {
      const matchesQuery =
        !query ||
        [person.name, person.email, person.company].some((value) =>
          value.toLowerCase().includes(query),
        )
      const matchesRules = filters.rules.length === 0 || (filters.logic === 'AND' ? filters.rules.every((rule) => matchesRule(person, rule)) : filters.rules.some((rule) => matchesRule(person, rule)))
      return matchesQuery && matchesRules
    })
  }, [filters, rows])

  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  return (
    <section className='viewWrap'>
      <PeopleFilters
        totalCount={filteredRows.length}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        onCreateSmartListFromView={onCreateSmartListFromView}
        onFilterChange={setFilters}
      />

      <div className='tableWrap'>
        <table className='crmTable'>
          <thead>
            <tr>
              <th>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={(event) => onToggleAll(event.target.checked)}
                  aria-label='Select all people'
                />
              </th>
              {visibleColumns.map((column) => <th key={column}>{column === 'name' ? 'Name' : column === 'email' ? 'Email' : column === 'company' ? 'Company' : column === 'lifecycleStage' ? 'Lifecycle Stage' : column === 'score' ? 'Score' : column === 'lastActivity' ? 'Last Activity' : column === 'owner' ? 'Owner' : column === 'title' ? 'Job Title' : 'Location'}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((person, index) => {
              const isSelected = selectedIds.includes(person.id)

              return (
                <tr key={person.id} className={index % 2 === 1 ? 'altRow' : ''}>
                  <td>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => onToggleRow(person.id)}
                      aria-label={`Select ${person.name}`}
                    />
                  </td>
                  {visibleColumns.map((column) => <td key={column}>{column === 'name' ? <button type='button' className='tableLink' onClick={() => onOpenPerson(person.id)}>{person.name}</button> : column === 'email' ? person.email : column === 'company' ? person.company : column === 'lifecycleStage' ? <span className='badge neutral'>{person.lifecycleStage}</span> : column === 'score' ? person.score : column === 'lastActivity' ? person.lastActivity : column === 'owner' ? person.owner : column === 'title' ? person.title : person.location}</td>)}
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td className='emptyRow' colSpan={visibleColumns.length + 1}>
                  No leads match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BulkActionBar visible={selectedIds.length > 0} selectedCount={selectedIds.length} />
    </section>
  )
}
