import { mainNavigation } from '../../data/crmData'
import type { MainNavKey } from '../../types/crm'
import { WireframeIcon } from '../common/WireframeIcon'

interface SidebarProps {
  activeTab: MainNavKey
  onTabChange: (tab: MainNavKey) => void
  searchValue: string
  onSearchChange: (value: string) => void
}

export function Sidebar({ activeTab, onTabChange, searchValue, onSearchChange }: SidebarProps) {
  return (
    <aside className='sidebar'>
      <div className='sidebarLogo'>Marketo Next</div>

      <label className='sidebarPersistentSearch'>
        <WireframeIcon name='search' className='iconSmall' />
        <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder='Search programs…' aria-label='Search Marketing Activities programs' />
        {searchValue && <button type='button' onClick={() => onSearchChange('')} aria-label='Clear program search'>×</button>}
      </label>

      <nav className='sidebarNav' aria-label='Main navigation'>
        {mainNavigation.map((item) => {
          const isActive = item.key === activeTab
          return (
            <button
              key={item.key}
              type='button'
              className={`sidebarNavItem ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.key)}
              aria-expanded={item.key === 'execution' ? isActive : undefined}
            >
              <WireframeIcon name={item.key} className='sidebarIcon' />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className='sidebarUser'>
        <div className='avatar'>MC</div>
        <div className='userMeta'>
          <p className='userName'>Maya Chen</p>
          <p className='userRole'>Marketing Ops Lead</p>
        </div>
        <button className='iconButton subtle' type='button' aria-label='Settings'>
          <WireframeIcon name='gear' className='iconSmall' />
        </button>
      </div>
    </aside>
  )
}
