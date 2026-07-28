import type { SmartListRecord } from '../../types/crm'
import { WireframeIcon } from '../common/WireframeIcon'

interface SmartListsViewProps {
  lists: SmartListRecord[]
  onOpenCreateSmartList: () => void
}

export function SmartListsView({ lists, onOpenCreateSmartList }: SmartListsViewProps) {
  return (
    <section className='viewWrap segmentsDirectory'>
      <header className='crmDirectoryHeader segmentDirectoryHeader'>
        <div className='crmDirectoryTitle'><h2>Segments</h2><span>{lists.length.toLocaleString()} records</span></div>
        <div className='crmDirectoryActions'><button type='button' className='button solid' onClick={onOpenCreateSmartList}>
          <WireframeIcon name='plus' className='iconSmall' />
          Create segment
        </button></div>
      </header>

      <div className='smartListGrid'>
        {lists.map((list, index) => (
          <article
            key={list.id}
            className='smartListCard'
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className='cardActions'>
              <button type='button' className='iconButton subtle' aria-label='Edit list'>
                <WireframeIcon name='edit' className='iconTiny' />
              </button>
              <button type='button' className='iconButton subtle' aria-label='Clone list'>
                <WireframeIcon name='clone' className='iconTiny' />
              </button>
              <button type='button' className='iconButton subtle' aria-label='Delete list'>
                <WireframeIcon name='delete' className='iconTiny' />
              </button>
            </div>

            <h3>{list.name}</h3>
            <p>{list.description}</p>

            <footer>
              <span className='badge accent'>{list.memberCount} members</span>
              <small>Last modified {list.lastModified}</small>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}
