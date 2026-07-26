export type MainNavKey = 'crm' | 'content' | 'execution' | 'campaigns' | 'journeys' | 'analytics'

export type CrmSubTabKey = 'people' | 'accounts' | 'smart-lists'

export interface PersonActivity {
  id: string
  type: 'email-open' | 'form-fill' | 'page-visit' | 'webinar'
  label: string
  timestamp: string
}

export interface PersonRecord {
  id: string
  name: string
  email: string
  company: string
  lifecycleStage: 'Lead' | 'MQL' | 'SQL' | 'Customer'
  score: number
  lastActivity: string
  title: string
  owner: string
  location: string
  phone: string
  smartLists: string[]
  activity: PersonActivity[]
  consent: {
    email: boolean
    sms: boolean
    tracking: boolean
  }
}

export interface AccountRecord {
  id: string
  accountName: string
  industry: string
  revenue: string
  numberOfContacts: number
  associatedPeople: Array<{
    id: string
    name: string
  }>
}

export interface SmartListRecord {
  id: string
  name: string
  description: string
  memberCount: number
  lastModified: string
}

export interface ConditionRow {
  id: string
  field: string
  operator: string
  value: string
  groupType: 'AND' | 'OR'
}
