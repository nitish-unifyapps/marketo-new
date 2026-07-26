import { useMemo, useState } from 'react'
import { BulkActionBar } from '../common/BulkActionBar'
import { PeopleFilters } from './PeopleFilters'
import type { PersonRecord } from '../../types/crm'

interface PeopleViewProps {
  rows: PersonRecord[]
  selectedIds: string[]
  onToggleRow: (id: string) => void
  onToggleAll: (selected: boolean) => void
  onOpenPerson: (id: string) => void
  onCreateSmartListFromView: () => void
}

export function PeopleView({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenPerson,
  onCreateSmartListFromView,
}: PeopleViewProps) {
  const [filters, setFilters] = useState({
    query: '',
    lifecycleStage: 'All',
    minimumScore: 0,
  })

  const filteredRows = useMemo(() => {
    const query = filters.query.trim().toLowerCase()

    return rows.filter((person) => {
      const matchesQuery =
        !query ||
        [person.name, person.email, person.company].some((value) =>
          value.toLowerCase().includes(query),
        )
      const matchesStage =
        filters.lifecycleStage === 'All' ||
        person.lifecycleStage === filters.lifecycleStage

      return matchesQuery && matchesStage && person.score >= filters.minimumScore
    })
  }, [filters, rows])

  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  return (
    <section className='viewWrap'>
      <PeopleFilters
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
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Lifecycle Stage</th>
              <th>Score</th>
              <th>Last Activity</th>
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
                  <td>
                    <button
                      type='button'
                      className='tableLink'
                      onClick={() => onOpenPerson(person.id)}
                    >
                      {person.name}
                    </button>
                  </td>
                  <td>{person.email}</td>
                  <td>{person.company}</td>
                  <td>
                    <span className='badge neutral'>{person.lifecycleStage}</span>
                  </td>
                  <td>{person.score}</td>
                  <td>{person.lastActivity}</td>
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td className='emptyRow' colSpan={7}>
                  No people match the selected filters.
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
