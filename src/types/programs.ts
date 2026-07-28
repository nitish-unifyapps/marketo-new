export type ProgramType = 'Automated Campaign' | 'Simple Email' | 'Event' | 'Nurture' | 'Container'
export type ProgramStatus = 'Active' | 'Draft' | 'Paused' | 'Error' | 'Archived'
export type ProgramAssetFolderKey = 'emails' | 'landing-pages' | 'forms' | 'files'
export type ProgramAssetType = 'Email' | 'Landing Page' | 'Form' | 'File'
export type ProgramSegmentMode = 'trigger' | 'filter' | 'batch'
export type ProgramTriggerType = 'Fills Out Registration Form' | 'Fills Out Form' | 'Clicks Link in Email' | 'Visits Web Page' | 'Data Value Changes' | 'Person Is Created' | 'Added to Smart List'
export type ProgramFlowStepType = 'Send Email' | 'Wait' | 'If/Then' | 'If/Then (Multiple)' | 'Router' | 'Stream' | 'Change Data Value' | 'Add to List' | 'Remove from List' | 'Call Webhook' | 'Sync to CRM' | 'Create Task' | 'Send Alert' | 'End'
export type ProgramScheduleMode = 'trigger' | 'batch'

export interface ProgramScheduleConfig {
  mode: ProgramScheduleMode
  startAt: string
  recurrence: 'None (once)' | 'Daily' | 'Weekly' | 'Monthly' | 'Custom (cron)'
  cron: string
  timezone: string
  qualificationMode: 'new-only' | 'all-each-run'
  allowReentry: boolean
  reentryMode: 'Once per person' | 'Once per trigger event' | 'Unlimited'
  active: boolean
}

export interface ProgramToken {
  id: string
  name: string
  type: 'Text' | 'Number' | 'Date' | 'DateTime' | 'Boolean'
  defaultValue: string
  automatic?: boolean
}

export interface ProgramEventDetails {
  eventName: string
  startAt: string
  endAt: string
  timezone: string
  capacity: number
  waitlist: boolean
  venueDescription: string
}

export interface ProgramCommunicationLimits {
  perDay: number
  perWeek: number
}

export interface ProgramMemberActivity {
  id: string
  label: string
  timestamp: string
  type: 'status' | 'email' | 'activity' | 'stream'
}

export interface ProgramMemberRecord {
  id: string
  personId: string
  name: string
  email: string
  status: string
  stream?: string
  registrationDate: string
  lastActivity: string
  activity: ProgramMemberActivity[]
}

export interface ProgramFlowBranch {
  id: string
  label: string
  condition: string
  conditionField?: string
  conditionOperator?: string
  conditionValue?: string
  weight?: number
  targetStepId?: string
  steps: ProgramFlowStep[]
}

export interface ProgramStreamTransitionRule {
  id: string
  logic: 'AND' | 'OR'
  field: string
  operator: string
  value: string
  targetStepId: string
}

export interface ProgramFlowStep {
  id: string
  type: ProgramFlowStepType
  config: Record<string, string | number | boolean>
  branches?: ProgramFlowBranch[]
  children?: ProgramFlowStep[]
  transitionRules?: ProgramStreamTransitionRule[]
}

export interface ProgramSegmentCondition {
  id: string
  field: string
  operator: string
  value: string
  logic?: 'AND' | 'OR'
}

export interface ProgramSegmentGroup {
  id: string
  logic: 'AND' | 'OR'
  joinLogic?: 'AND' | 'OR'
  conditions: ProgramSegmentCondition[]
}

export interface ProgramSegmentTrigger {
  id: string
  type: ProgramTriggerType
  source: string
  constraints: ProgramSegmentCondition[]
}

export interface ProgramSegmentConfig {
  mode: ProgramSegmentMode
  groups: ProgramSegmentGroup[]
  triggers: ProgramSegmentTrigger[]
}

export interface ProgramFolderRecord {
  id: string
  name: string
  parentId: string | null
}

export interface ProgramAssetRecord {
  id: string
  name: string
  type: ProgramAssetType
  folder: ProgramAssetFolderKey
  editorState?: ProgramAssetEditorState
}

export interface ProgramAssetEditorBlock {
  id: string
  type: string
  content: string
  condition?: string
}

export interface ProgramAssetEditorState {
  subject: string
  preheader: string
  emailBlocks: ProgramAssetEditorBlock[]
  pageSections: ProgramAssetEditorBlock[]
  formFields: string[]
  progressiveProfiling: boolean
  thankYouMode: 'page' | 'message'
  thankYouValue: string
  seoTitle: string
  seoDescription: string
  slug: string
  formDefaultValue: string
}

export interface ProgramRecord {
  id: string
  name: string
  parentId: string | null
  type: ProgramType
  status: ProgramStatus
  enabledAssetFolders: ProgramAssetFolderKey[]
  assets: ProgramAssetRecord[]
  flow: string[]
  flowSteps?: ProgramFlowStep[]
  description: string
  createdAt: string
  segment?: ProgramSegmentConfig
  convertedToNurture?: boolean
  tags?: string[]
  tokens?: ProgramToken[]
  schedule?: ProgramScheduleConfig
  eventDetails?: ProgramEventDetails
  communicationLimits?: ProgramCommunicationLimits
  exclusionSmartList?: string
  pauseOnEngagement?: boolean
  members?: ProgramMemberRecord[]
}
