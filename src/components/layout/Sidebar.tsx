import { mainNavigation } from '../../data/crmData'
import type { CrmSubTabKey, MainNavKey } from '../../types/crm'
import { WireframeIcon } from '../common/WireframeIcon'

interface SidebarProps {
  activeTab: MainNavKey
  onTabChange: (tab: MainNavKey) => void
  searchValue: string
  onSearchChange: (value: string) => void
  activeCrmTab: CrmSubTabKey
  onCrmTabChange: (tab: CrmSubTabKey) => void
}

const crmSubNavigation: Array<{ key: CrmSubTabKey; label: string; icon: string }> = [
  { key: 'people', label: 'Leads', icon: '♙' },
  { key: 'accounts', label: 'Accounts', icon: '▣' },
  { key: 'smart-lists', label: 'Segments', icon: '☷' },
]

export function Sidebar({ activeTab, onTabChange, searchValue, onSearchChange, activeCrmTab, onCrmTabChange }: SidebarProps) {
  return (
    <aside className='sidebar'>
      <div className='sidebarLogo'>Marketo Next</div>

      <label className='sidebarPersistentSearch'>
        <WireframeIcon name='search' className='iconSmall' />
        <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={activeTab === 'programs' ? 'Search Programs…' : 'Search programs…'} aria-label={activeTab === 'programs' ? 'Search Programs' : 'Search Marketing Activities programs'} />
        {searchValue && <button type='button' onClick={() => onSearchChange('')} aria-label='Clear program search'>×</button>}
      </label>

      <nav className='sidebarNav' aria-label='Main navigation'>
        {mainNavigation.map((item) => {
          const isActive = item.key === activeTab
          return (
            <div key={item.key} className={`sidebarNavGroup group-${item.key} ${isActive ? 'active' : ''}`}>
              <button
                type='button'
                className={`sidebarNavItem ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.key)}
                aria-expanded={item.key === 'execution' || item.key === 'crm' ? isActive : undefined}
              >
                <WireframeIcon name={item.key} className='sidebarIcon' />
                <span>{item.label}</span>
              </button>
              {item.key === 'crm' && isActive && <div className='crmSidebarSubnav'>{crmSubNavigation.map((tab) => <button type='button' key={tab.key} className={activeCrmTab === tab.key ? 'active' : ''} onClick={() => onCrmTabChange(tab.key)}><span>{tab.icon}</span>{tab.label}</button>)}</div>}
            </div>
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
