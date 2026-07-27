import type {
  AccountRecord,
  ConditionRow,
  MainNavKey,
  PersonRecord,
  SmartListRecord,
} from '../types/crm'

export const mainNavigation: Array<{ key: MainNavKey; label: string }> = [
  { key: 'crm', label: 'CRM' },
  { key: 'content', label: 'Content' },
  { key: 'execution', label: 'Marketing Activities' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'admin', label: 'Admin' },
]

export const peopleRows: PersonRecord[] = [
  {
    id: 'p-1',
    name: 'Sophia Kim',
    email: 'sophia.kim@northlane.com',
    company: 'Northlane Systems',
    lifecycleStage: 'MQL',
    score: 81,
    lastActivity: '2h ago',
    title: 'Revenue Operations Director',
    owner: 'Maya Chen',
    location: 'San Francisco, CA',
    phone: '+1 (415) 555-0124',
    smartLists: ['High Intent - SaaS', 'Q3 Webinar Follow-up'],
    activity: [
      {
        id: 'a-11',
        type: 'email-open',
        label: 'Opened product update email',
        timestamp: 'Today, 10:24 AM',
      },
      {
        id: 'a-12',
        type: 'form-fill',
        label: 'Completed demo request form',
        timestamp: 'Yesterday, 3:40 PM',
      },
      {
        id: 'a-13',
        type: 'webinar',
        label: 'Registered for attribution webinar',
        timestamp: 'Jul 21, 2026',
      },
    ],
    consent: {
      email: true,
      sms: false,
      tracking: true,
    },
  },
  {
    id: 'p-2',
    name: 'Noah Patel',
    email: 'noah.patel@brightscale.io',
    company: 'BrightScale',
    lifecycleStage: 'SQL',
    score: 92,
    lastActivity: '6h ago',
    title: 'Head of Demand Generation',
    owner: 'Rita Nair',
    location: 'Austin, TX',
    phone: '+1 (512) 555-0193',
    smartLists: ['ABM Tier 1', 'Pipeline Movers'],
    activity: [
      {
        id: 'a-21',
        type: 'page-visit',
        label: 'Visited pricing page',
        timestamp: 'Today, 8:13 AM',
      },
      {
        id: 'a-22',
        type: 'email-open',
        label: 'Opened case study email',
        timestamp: 'Yesterday, 1:03 PM',
      },
    ],
    consent: {
      email: true,
      sms: true,
      tracking: true,
    },
  },
  {
    id: 'p-3',
    name: 'Elena Garcia',
    email: 'elena.garcia@hexametrics.com',
    company: 'HexaMetrics',
    lifecycleStage: 'Lead',
    score: 58,
    lastActivity: '1d ago',
    title: 'Marketing Manager',
    owner: 'Maya Chen',
    location: 'Madrid, ES',
    phone: '+34 910 555 812',
    smartLists: ['Newsletter Engaged'],
    activity: [
      {
        id: 'a-31',
        type: 'form-fill',
        label: 'Downloaded attribution guide',
        timestamp: 'Yesterday, 9:55 AM',
      },
    ],
    consent: {
      email: true,
      sms: false,
      tracking: false,
    },
  },
  {
    id: 'p-4',
    name: 'Arjun Rao',
    email: 'arjun.rao@finarc.io',
    company: 'FinArc',
    lifecycleStage: 'Customer',
    score: 77,
    lastActivity: '3d ago',
    title: 'VP Marketing',
    owner: 'Liam Ortiz',
    location: 'Bengaluru, IN',
    phone: '+91 80 5555 2201',
    smartLists: ['Expansion Signals', 'Executive Contacts'],
    activity: [
      {
        id: 'a-41',
        type: 'webinar',
        label: 'Attended executive roundtable',
        timestamp: 'Jul 19, 2026',
      },
      {
        id: 'a-42',
        type: 'email-open',
        label: 'Opened QBR summary email',
        timestamp: 'Jul 17, 2026',
      },
    ],
    consent: {
      email: true,
      sms: true,
      tracking: true,
    },
  },
  {
    id: 'p-5',
    name: 'Grace Walker',
    email: 'grace.walker@cloudforge.net',
    company: 'CloudForge',
    lifecycleStage: 'MQL',
    score: 69,
    lastActivity: '5d ago',
    title: 'Growth Programs Lead',
    owner: 'Rita Nair',
    location: 'London, UK',
    phone: '+44 20 7946 1021',
    smartLists: ['Intent Surge - EMEA'],
    activity: [
      {
        id: 'a-51',
        type: 'page-visit',
        label: 'Visited integration docs',
        timestamp: 'Jul 16, 2026',
      },
    ],
    consent: {
      email: true,
      sms: false,
      tracking: true,
    },
  },
]

export const accountRows: AccountRecord[] = [
  {
    id: 'ac-1',
    accountName: 'Northlane Systems',
    industry: 'SaaS Infrastructure',
    revenue: '$68M',
    numberOfContacts: 23,
    associatedPeople: [
      { id: 'p-1', name: 'Sophia Kim' },
      { id: 'p-8', name: 'Darren Choi' },
    ],
  },
  {
    id: 'ac-2',
    accountName: 'BrightScale',
    industry: 'FinTech',
    revenue: '$124M',
    numberOfContacts: 41,
    associatedPeople: [
      { id: 'p-2', name: 'Noah Patel' },
      { id: 'p-9', name: 'Iris Lo' },
    ],
  },
  {
    id: 'ac-3',
    accountName: 'HexaMetrics',
    industry: 'Analytics',
    revenue: '$22M',
    numberOfContacts: 12,
    associatedPeople: [
      { id: 'p-3', name: 'Elena Garcia' },
      { id: 'p-10', name: 'Paul Jensen' },
    ],
  },
  {
    id: 'ac-4',
    accountName: 'FinArc',
    industry: 'Financial Services',
    revenue: '$210M',
    numberOfContacts: 56,
    associatedPeople: [
      { id: 'p-4', name: 'Arjun Rao' },
      { id: 'p-11', name: 'Priya Menon' },
    ],
  },
]

export const smartLists: SmartListRecord[] = [
  {
    id: 'sl-1',
    name: 'Pipeline Movers - North America',
    description: 'Contacts with score > 70 and product page activity in last 14 days.',
    memberCount: 482,
    lastModified: 'Jul 24, 2026',
  },
  {
    id: 'sl-2',
    name: 'MQLs for Q3 Webinar Series',
    description: 'MQL audience segmented by vertical and engagement intent.',
    memberCount: 316,
    lastModified: 'Jul 22, 2026',
  },
  {
    id: 'sl-3',
    name: 'Customer Expansion Signals',
    description: 'Current customers with multiple pricing + integration page visits.',
    memberCount: 127,
    lastModified: 'Jul 20, 2026',
  },
  {
    id: 'sl-4',
    name: 'Dormant SQL Reactivation',
    description: 'SQL contacts inactive for 30+ days with historical email engagement.',
    memberCount: 209,
    lastModified: 'Jul 17, 2026',
  },
]

export const initialConditionRows: ConditionRow[] = [
  {
    id: 'c-1',
    field: 'Lifecycle Stage',
    operator: 'is',
    value: 'MQL',
    groupType: 'AND',
  },
  {
    id: 'c-2',
    field: 'Score',
    operator: 'greater than',
    value: '65',
    groupType: 'AND',
  },
]
