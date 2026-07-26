import type { AnalyticsTabKey, AttributionOpportunity, SavedReport } from '../types/analytics'

export const analyticsTabs: Array<{ key: AnalyticsTabKey; label: string }> = [
  { key: 'dashboards', label: 'Dashboards' },
  { key: 'reports', label: 'Reports' },
  { key: 'attribution', label: 'Attribution' },
]

export const savedReports: SavedReport[] = [
  { id: 'rp-1', name: 'Q3 Campaign Performance', type: 'Campaign Performance', owner: 'Maya Chen', modified: 'Today, 10:42 AM', status: 'Ready' },
  { id: 'rp-2', name: 'Enterprise Email Engagement', type: 'Email Performance', owner: 'Rita Nair', modified: 'Yesterday, 4:18 PM', status: 'Scheduled', schedule: 'Every Monday' },
  { id: 'rp-3', name: 'Pipeline Influence by Channel', type: 'Revenue Attribution', owner: 'Maya Chen', modified: 'Jul 24, 2026', status: 'Ready' },
  { id: 'rp-4', name: 'MQL to SQL Conversion', type: 'Lifecycle Funnel', owner: 'Liam Ortiz', modified: 'Jul 22, 2026', status: 'Ready' },
  { id: 'rp-5', name: 'Webinar Cohort Analysis', type: 'Event Performance', owner: 'Rita Nair', modified: 'Jul 20, 2026', status: 'Draft' },
]

export const channelMappings = [
  { channel: 'Paid Search', source: 'Google Ads, Bing Ads', assignment: 'Acquisition', touchpoints: '8,420' },
  { channel: 'Organic Search', source: 'Google Organic, Bing Organic', assignment: 'Inbound', touchpoints: '12,847' },
  { channel: 'Email Marketing', source: 'Marketo Next Email', assignment: 'Nurture', touchpoints: '21,306' },
  { channel: 'Events', source: 'Webinars, Field Events', assignment: 'Engagement', touchpoints: '4,280' },
  { channel: 'Paid Social', source: 'LinkedIn, Meta', assignment: 'Acquisition', touchpoints: '6,935' },
]

export const attributionOpportunities: AttributionOpportunity[] = [
  { id: 'op-1', name: 'Northlane Enterprise Expansion', account: 'Northlane Systems', amount: '$420,000', model: 'W-Shaped', influencedRevenue: '$378,000', influence: 90 },
  { id: 'op-2', name: 'BrightScale Platform', account: 'BrightScale', amount: '$285,000', model: 'W-Shaped', influencedRevenue: '$228,000', influence: 80 },
  { id: 'op-3', name: 'FinArc Global Rollout', account: 'FinArc', amount: '$640,000', model: 'W-Shaped', influencedRevenue: '$512,000', influence: 80 },
  { id: 'op-4', name: 'HexaMetrics Growth', account: 'HexaMetrics', amount: '$168,000', model: 'W-Shaped', influencedRevenue: '$117,600', influence: 70 },
]
