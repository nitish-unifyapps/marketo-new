interface BulkActionBarProps {
  visible: boolean
  selectedCount: number
}

const actions = ['Add to Smart List', 'Change Owner', 'Delete', 'Merge']

export function BulkActionBar({ visible, selectedCount }: BulkActionBarProps) {
  return (
    <div className={`bulkActionBar ${visible ? 'visible' : ''}`}>
      <span className='bulkCount'>{selectedCount} selected</span>
      <div className='bulkActions'>
        {actions.map((action) => (
          <button key={action} type='button' className='button ghost accent'>
            {action}
          </button>
        ))}
      </div>
    </div>
  )
}
