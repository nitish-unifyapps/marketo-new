import { marketingActivityTabs } from '../../data/executionData'
import type { ProgramTabKey } from '../../types/execution'

export function MarketingActivitiesSubNav({ activeTab, onChange }: { activeTab: ProgramTabKey; onChange: (tab: ProgramTabKey) => void }) {
  return <div className='subNav marketingActivitiesSubNav' role='tablist' aria-label='Marketing Activities sub-navigation'>{marketingActivityTabs.map((tab) => <button key={tab.key} type='button' role='tab' aria-selected={activeTab === tab.key} className={`subNavTab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => onChange(tab.key)}>{tab.label}</button>)}</div>
}
