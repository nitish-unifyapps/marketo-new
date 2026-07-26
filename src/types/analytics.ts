export type AnalyticsTabKey = 'dashboards' | 'reports' | 'attribution'
export type ReportStatus = 'Ready' | 'Scheduled' | 'Draft'

export interface SavedReport {
  id: string
  name: string
  type: string
  owner: string
  modified: string
  status: ReportStatus
  schedule?: string
}

export interface AttributionOpportunity {
  id: string
  name: string
  account: string
  amount: string
  model: string
  influencedRevenue: string
  influence: number
}
