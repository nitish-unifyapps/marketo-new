import type { AnalyticsTabKey } from '../../types/analytics'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { AttributionView } from './AttributionView'
import { ReportsView } from './ReportsView'

export function AnalyticsModule({ activeTab }: { activeTab: AnalyticsTabKey }) {
  if (activeTab === 'reports') return <ReportsView />
  if (activeTab === 'attribution') return <AttributionView />
  return <AnalyticsDashboard />
}
