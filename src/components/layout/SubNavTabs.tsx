import type { CrmSubTabKey } from '../../types/crm'

const crmTabs: Array<{ key: CrmSubTabKey; label: string }> = [
  { key: 'people', label: 'People' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'smart-lists', label: 'Smart Lists' },
]

interface SubNavTabsProps {
  activeTab: CrmSubTabKey
  onChange: (tab: CrmSubTabKey) => void
}

export function SubNavTabs({ activeTab, onChange }: SubNavTabsProps) {
  return (
    <div className='subNav' role='tablist' aria-label='CRM sub-navigation'>
      {crmTabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            type='button'
            className={`subNavTab ${isActive ? 'active' : ''}`}
            role='tab'
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
