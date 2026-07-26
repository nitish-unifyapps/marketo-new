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

export function AccountsView({
  rows,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onOpenAccount,
}: AccountsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((account) =>
      [account.accountName, account.industry, account.revenue].some((value) =>
        value.toLowerCase().includes(query),
      ),
    )
  }, [rows, searchQuery])

  const allSelected = rows.length > 0 && selectedIds.length === rows.length

  return (
    <section className='viewWrap'>
      <div className='filterPanel compact'>
        <label className='searchInputWrap filterSearch'>
          <WireframeIcon name='search' className='iconSmall muted' />
          <input
            type='text'
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className='searchInput'
            placeholder='Search accounts...'
          />
        </label>

        <button type='button' className='button outline accent'>
          Add Filter
        </button>
      </div>

      <div className='tableWrap'>
        <table className='crmTable'>
          <thead>
            <tr>
              <th>
                <input
                  type='checkbox'
                  checked={allSelected}
                  onChange={(event) => onToggleAll(event.target.checked)}
                  aria-label='Select all accounts'
                />
              </th>
              <th>Account Name</th>
              <th>Industry</th>
              <th>Revenue</th>
              <th>Number of Contacts</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((account, index) => {
              const isSelected = selectedIds.includes(account.id)

              return (
                <tr key={account.id} className={index % 2 === 1 ? 'altRow' : ''}>
                  <td>
                    <input
                      type='checkbox'
                      checked={isSelected}
                      onChange={() => onToggleRow(account.id)}
                      aria-label={`Select ${account.accountName}`}
                    />
                  </td>
                  <td>
                    <button
                      type='button'
                      className='tableLink'
                      onClick={() => onOpenAccount(account.id)}
                    >
                      {account.accountName}
                    </button>
                  </td>
                  <td>{account.industry}</td>
                  <td>{account.revenue}</td>
                  <td>{account.numberOfContacts}</td>
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td className='emptyRow' colSpan={5}>
                  No accounts match your search.
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
