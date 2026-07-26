import { analyticsTabs } from '../../data/analyticsData'
import type { AnalyticsTabKey } from '../../types/analytics'

interface AnalyticsSubNavProps {
  activeTab: AnalyticsTabKey
  onChange: (tab: AnalyticsTabKey) => void
}

export function AnalyticsSubNav({ activeTab, onChange }: AnalyticsSubNavProps) {
  return <div className='subNav' role='tablist' aria-label='Analytics sub-navigation'>{analyticsTabs.map((tab) => <button key={tab.key} type='button' role='tab' aria-selected={activeTab === tab.key} className={`subNavTab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => onChange(tab.key)}>{tab.label}</button>)}</div>
}
