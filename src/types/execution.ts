export type ExecutionType = 'Smart Campaign' | 'Engagement Program' | 'Event Program'
export type ExecutionStatus = 'Active' | 'Paused' | 'Draft'
export type ProgramTabKey = 'all-programs' | 'smart-campaigns' | 'engagement-programs' | 'event-programs'
export type PaletteTab = 'Triggers' | 'Filters' | 'Actions' | 'Flow Control'
export type NodeKind = 'smart-list' | 'email' | 'form' | 'landing-page' | 'wait' | 'choice' | 'change-data' | 'alert' | 'smart-filter' | 'action' | 'end'

export interface ExecutionRecord {
  id: string
  name: string
  type: ExecutionType
  status: ExecutionStatus
  lastRun: string
  folder: string
  metrics: {
    entries: number
    inFlow: number
    completed: number
    goalReached: number
  }
  sparkline: number[]
}

export interface FlowNode {
  id: string
  kind: NodeKind
  title: string
  subtitle: string
  x: number
  y: number
}

export interface ExecutionTemplate {
  id: string
  name: string
  description: string
  category: ExecutionType
  steps: string[]
  mode: 'Trigger' | 'Filter'
}
